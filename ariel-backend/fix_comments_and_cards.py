"""
Fix:
  1. Re-insert bot comments with ObjectId user_id so author lookup works
  2. Delete existing bot cards/decks and recreate with expanded unique pools
     (each bot in same subject gets DIFFERENT cards — no repeats)
  3. Update bot profile pictures with randomuser.me (no nationality filter = mixed ages)

Run: MONGODB_URL=<url> DATABASE_NAME=ariel python3 fix_comments_and_cards.py
"""
import asyncio, os, random, json
from datetime import datetime, timedelta
from urllib.request import urlopen
from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId

MONGODB_URL = os.environ.get("MONGODB_URL", "mongodb://localhost:27017")
DB_NAME = os.environ.get("DATABASE_NAME", "ariel")

# ---------------------------------------------------------------------------
# EXPANDED CARD POOLS — enough cards per subject so bots don't repeat
# Each subject has 10-16 cards. Bots in same subject get non-overlapping subsets.
# ---------------------------------------------------------------------------
CARDS_BY_SUBJECT = {
  "Neuroscience": [
    {"q":"What is long-term potentiation?","a":"LTP is the lasting strengthening of synapses when neurons fire together repeatedly. NMDA receptors open, calcium floods in, and new AMPA receptors are inserted. This is the cellular mechanism of memory formation — Hebb's rule made physical.","e":"The synapse literally grows stronger. Learning is structural change.","t":"Memory & Learning","cap":"Lost a duel on this last night and it was embarrassing 😅"},
    {"q":"What role does the hippocampus play in memory?","a":"The hippocampus converts short-term memories into long-term ones by binding information from different cortical regions into a unified trace. Damage to it (like patient H.M.) destroys new declarative memory while leaving procedural memory intact.","e":"The hippocampus is the brain's index, not its storage — memories ultimately live in cortex.","t":"Memory & Learning","cap":"H.M. is the most important case study in neuroscience. Know it cold."},
    {"q":"How does sleep affect memory consolidation?","a":"During slow-wave sleep the hippocampus replays recent experiences and transfers them to the neocortex. REM sleep then integrates them with existing knowledge. Skipping sleep after learning significantly impairs retention.","e":"Sleep is when the brain actually files the day's information.","t":"Memory & Learning","cap":"All-nighters before exams literally sabotage your own memory. Been there 🥲"},
    {"q":"What is the default mode network?","a":"The DMN is a network of brain regions (medial prefrontal cortex, posterior cingulate, angular gyrus) that activates during rest and self-referential thought. Overactivity is linked to depression and anxiety; healthy DMN activity underlies creativity and autobiographical memory.","e":"Rest is not doing nothing — it's the most metabolically expensive state the brain enters.","t":"Memory & Learning","cap":"The fact that resting is more costly than focused attention completely changed how I think about boredom"},
    {"q":"What is neuroplasticity and what limits it?","a":"Neuroplasticity is the brain's ability to reorganize by forming new connections throughout life. It includes synaptic plasticity, structural growth, and neurogenesis mainly in the hippocampus. Limits include critical developmental periods, age-related decline in BDNF, and the metabolic cost of rewiring.","e":"Plasticity is how the brain survives the world, not just adapts to a classroom.","t":"Memory & Learning","cap":"My professor said something I keep coming back to: every experience physically changes your brain. Every single one."},
    {"q":"What role do glial cells play in brain function?","a":"Glia (astrocytes, oligodendrocytes, microglia) maintain ionic balance, form myelin sheaths, and prune synapses. When they fail: astrocyte dysfunction contributes to ALS and Alzheimer's; demyelination causes MS; microglial overactivation drives neuroinflammation in depression.","e":"Glia are co-pilots, not just support staff — their failure underlies almost every major neurological disease.","t":"Memory & Learning","cap":"We spent decades ignoring glia. Turns out they're involved in nearly everything we care about 🧠"},
    {"q":"What is the role of dopamine in learning?","a":"Dopamine signals prediction error — the gap between expected and actual reward. When outcomes exceed expectations, dopamine neurons fire, reinforcing behavior. When worse than expected, they pause, weakening the connection. This is how experience shapes future behavior.","e":"Dopamine is not about pleasure — it's about learning what predicts pleasure.","t":"Memory & Learning","cap":"Every time your phone lights up and you check it, dopamine is running this exact algorithm on you"},
    {"q":"How do NMDA receptors act as 'coincidence detectors'?","a":"NMDA receptors require both presynaptic glutamate release AND postsynaptic depolarization to open — they detect simultaneous activity on both sides of a synapse. This coincidence detection is what makes LTP input-specific rather than globally strengthening all synapses.","e":"NMDA receptors are why 'neurons that fire together wire together' — they literally detect the together part.","t":"Memory & Learning","cap":"This is the molecular logic behind why context matters for memory. Added this to my Ariel deck 🧪"},
  ],

  "Medicine": [
    {"q":"How do beta-blockers work?","a":"Beta-blockers antagonize catecholamines at beta-adrenergic receptors. Beta-1 blockade reduces heart rate and contractility, lowering cardiac output and blood pressure. Beta-2 blockade inhibits bronchodilation — hence the contraindication in asthma.","e":"Cardioselective agents (metoprolol) target beta-1 to spare the lungs.","t":"Pharmacology","cap":"Made this deck for anyone cramming pharmacology — receptor logic makes the rest make sense"},
    {"q":"What is the mechanism of ACE inhibitors?","a":"ACE inhibitors block the enzyme that converts angiotensin I to angiotensin II, reducing vasoconstriction and aldosterone secretion. They also slow bradykinin breakdown — explaining the dry cough side effect.","e":"First-line in hypertension with diabetes because they reduce proteinuria too — two birds, one drug.","t":"Drug Mechanisms","cap":"The bradykinin cough connection is the detail that suddenly makes the side effect profile make sense 💊"},
    {"q":"What is the Frank-Starling mechanism?","a":"The Frank-Starling law states that stroke volume increases with greater ventricular filling (preload). Stretching cardiac sarcomeres increases their calcium sensitivity, generating a stronger contraction. The heart automatically matches output to venous return without neural input.","e":"It's the heart's intrinsic way of equalizing left and right output beat by beat.","t":"Cardiology","cap":"Elegant. The heart self-regulates at a cellular level before your nervous system even gets involved."},
    {"q":"How do you distinguish ischemic from hemorrhagic stroke?","a":"Ischemic stroke (87% of cases) results from arterial blockage — thrombotic or embolic — cutting off oxygen to brain tissue. Hemorrhagic stroke results from vessel rupture. Treatment is opposite: clot-busting drugs help ischemic but can be fatal in hemorrhagic.","e":"CT scan without contrast is the first step — you must rule out hemorrhage before giving tPA.","t":"Cardiology","cap":"Tried a duel on stroke management and got humbled. Back to basics 😤"},
    {"q":"What are the phases of wound healing?","a":"Wound healing has four overlapping phases: hemostasis (minutes), inflammation (days — neutrophils and macrophages), proliferation (weeks — fibroblasts lay collagen and new vessels form), and remodeling (months to years — collagen matures). Each phase is regulated by growth factors.","e":"Chronic wounds like diabetic ulcers get stuck in the inflammatory phase — understanding this guides treatment.","t":"Surgery","cap":"My Ariel streak depends on getting this phase order right every time lol"},
    {"q":"What is the pathophysiology of type 2 diabetes?","a":"T2DM begins with insulin resistance in muscle and liver. The pancreas compensates by oversecretion, then beta cells eventually exhaust. Progressive glucotoxicity and lipotoxicity cause ongoing beta-cell loss, making the disease inherently worsening over time.","e":"T2DM is progressive by nature — but early lifestyle intervention can genuinely reverse insulin resistance.","t":"Drug Mechanisms","cap":"Seeing patients who've had T2DM for 20 years is a reminder that early intervention is everything. Education is medicine."},
    {"q":"How does aspirin differ from other NSAIDs?","a":"Aspirin irreversibly acetylates COX-1 and COX-2 permanently. Other NSAIDs inhibit COX reversibly. Because platelets cannot synthesize new COX, aspirin's antiplatelet effect lasts the platelet's entire lifespan (~10 days). This makes low-dose aspirin uniquely effective for cardiovascular prophylaxis.","e":"One molecule of aspirin permanently disables one COX enzyme in a cell that will never replace it.","t":"Pharmacology","cap":"Aspirin is genuinely one of the most remarkable drugs ever made. Cheap. Old. Still irreplaceable 💊"},
    {"q":"What is the SIRS definition and how does it relate to sepsis?","a":"SIRS: ≥2 of fever/hypothermia, tachycardia, tachypnea/low PaCO2, abnormal WBC. Sepsis (modern Sepsis-3 definition): life-threatening organ dysfunction from dysregulated host response to infection, identified by SOFA score ≥2.","e":"The shift from SIRS to SOFA reflects that sepsis is fundamentally about organ dysfunction, not just inflammation.","t":"Surgery","cap":"Every hour of delayed antibiotics in sepsis increases mortality ~7%. Learned this on a night shift I won't forget."},
    {"q":"What is the coagulation cascade?","a":"Two pathways converge at Factor X: extrinsic (tissue factor → Factor VII) and intrinsic (XII → XI → IX). Both activate Factor X → thrombin → fibrin clot. Warfarin inhibits Vit K-dependent factors (II, VII, IX, X). Heparins potentiate antithrombin III. DOACs target Xa or thrombin directly.","e":"Understanding where anticoagulants act explains both their therapeutic use and reversal strategies.","t":"Drug Mechanisms","cap":"Teaching this to first-years and realising I'd been explaining the intrinsic pathway slightly wrong for years 😅"},
  ],

  "Neurology": [
    {"q":"What is neuroplasticity?","a":"Neuroplasticity is the brain's ability to reorganize by forming new synaptic connections throughout life. After injury, neighboring neurons can take over lost functions through cortical remapping. All learning and skill acquisition depend on it.","e":"The brain is not hardwired — experience and injury continuously reshape its architecture.","t":"Neuroplasticity","cap":"This is why stroke rehabilitation works. The brain literally rewires itself around the damage."},
    {"q":"How does the blood-brain barrier work?","a":"The BBB is formed by tight junctions between endothelial cells lining brain capillaries, supported by astrocyte end-feet. It blocks most large or charged molecules while allowing glucose and small lipid-soluble substances through.","e":"Why most CNS drugs fail in clinical trials — getting past the BBB is the first hurdle.","t":"Neuroplasticity","cap":"Drug delivery to the brain is one of medicine's hardest problems. The BBB is a genius design we're still trying to outsmart."},
    {"q":"What distinguishes upper from lower motor neuron lesions?","a":"UMN lesions produce spasticity, hyperreflexia, and Babinski sign with minimal wasting. LMN lesions cause flaccidity, hyporeflexia, fasciculations, and rapid muscle atrophy. The pattern localizes the lesion precisely.","e":"UMN releases the brake on spinal circuits; LMN is the final common pathway — lose it and movement stops.","t":"Neuroplasticity","cap":"Classic exam topic but genuinely useful in clinical practice every single day."},
    {"q":"What is the pathophysiology of Parkinson's disease?","a":"Parkinson's results from degeneration of dopaminergic neurons in the substantia nigra pars compacta, reducing striatal dopamine. This disrupts basal ganglia circuitry, causing resting tremor, rigidity, bradykinesia, and postural instability. Lewy bodies (alpha-synuclein aggregates) are the hallmark.","e":"Dopamine loss tips the basal ganglia toward movement inhibition — hence the slowness and freezing.","t":"Neuroplasticity","cap":"Been struggling with basal ganglia circuits for months. Ariel duels finally made it stick 💀"},
  ],

  "Immunology": [
    {"q":"What is the difference between innate and adaptive immunity?","a":"Innate immunity is fast, non-specific, and uses pattern recognition receptors (toll-like receptors) to detect conserved microbial structures. Adaptive immunity is slower (days) but highly specific — B and T cells recognize particular antigens and generate immunological memory.","e":"Innate immunity sets the scene; adaptive immunity finishes the fight and remembers the enemy.","t":"Autoimmune Disease","cap":"The interplay between these two systems is where most of the interesting pathology lives."},
    {"q":"What triggers autoimmune disease?","a":"Autoimmune disease results from a failure of self-tolerance — immune cells that recognize self-antigens are not deleted or suppressed. Triggers include molecular mimicry (pathogen resembles self), bystander activation during infection, and breakdown of regulatory T cells.","e":"The thymus eliminates most self-reactive T cells during development — autoimmunity is what happens when that editing fails.","t":"Autoimmune Disease","cap":"Molecular mimicry after streptococcal infection causing rheumatic fever is one of the cleanest examples of this mechanism."},
    {"q":"How do monoclonal antibodies work as therapy?","a":"Monoclonal antibodies are engineered to target a specific protein — blocking a cytokine (like TNF in rheumatoid arthritis), marking a cancer cell for immune destruction, or delivering a drug payload directly to a target. Checkpoint inhibitors (anti-PD-1) remove the brake on T cells to fight cancer.","e":"Biologics transformed rheumatology and oncology — they're precision strikes where traditional drugs use carpet bombs.","t":"Autoimmune Disease","cap":"Checkpoint inhibitors went from experimental to standard of care in a decade. Wild rate of change in oncology."},
    {"q":"What is MHC and why does it matter?","a":"MHC (major histocompatibility complex) molecules present peptide fragments on cell surfaces for T cell inspection. MHC class I presents intracellular antigens to CD8 cytotoxic T cells; MHC class II presents extracellular antigens to CD4 helper T cells. MHC diversity explains why organ transplants are rejected.","e":"HLA typing before transplant is essentially matching the MHC repertoire to minimize rejection risk.","t":"Autoimmune Disease","cap":"Understanding MHC is the unlock for understanding transplant rejection, viral immunity, and autoimmunity all at once."},
  ],

  "Public Health": [
    {"q":"What is the difference between incidence and prevalence?","a":"Incidence measures new cases of a disease in a population over a time period — it captures risk. Prevalence measures all existing cases at a point in time — it captures burden. A disease can have low incidence but high prevalence if it's chronic (like HIV with good treatment).","e":"Incidence tells you what's happening; prevalence tells you what you're dealing with.","t":"Epidemiology","cap":"This distinction trips up almost everyone when they first encounter epidemiology. Been drilling it on Ariel 📊"},
    {"q":"What is herd immunity and how is it achieved?","a":"Herd immunity occurs when enough of a population is immune (through vaccination or prior infection) that transmission chains break, protecting unvaccinated individuals. The threshold depends on the pathogen's R0 — for measles (R0≈15) you need ~93-95% immunity; for COVID (R0≈2-3), around 60-70%.","e":"Herd immunity isn't about protecting the vaccinated — it's about protecting those who can't be vaccinated.","t":"Epidemiology","cap":"The anti-vax movement doesn't just harm individual children. It erodes the herd immunity that protects the most vulnerable."},
    {"q":"What are social determinants of health?","a":"Social determinants are the conditions in which people are born, grow, work, live, and age — income, education, housing, food security, social support, and neighborhood environment. These explain more of the variation in health outcomes than clinical care does.","e":"Fixing healthcare without addressing its social root causes is treating symptoms while ignoring the disease.","t":"Epidemiology","cap":"Every time I see a patient, I'm now thinking about what brought them here before they even got sick."},
    {"q":"What is selection bias and why does it matter in research?","a":"Selection bias occurs when the sample studied systematically differs from the population you want to generalize to. Survivor bias (studying only those who survived), healthy worker effect, and volunteer bias are common examples. It can completely invalidate the conclusions of a study.","e":"Many historical diet and lifestyle studies were wrong because they only studied people who showed up — missing all the deaths.","t":"Epidemiology","cap":"Epidemiology has a long tradition of producing confident findings that later collapse. Critical appraisal is a survival skill."},
  ],

  "Psychiatry": [
    {"q":"What are the diagnostic criteria for major depressive disorder?","a":"MDD requires 5+ symptoms for at least 2 weeks, including depressed mood or anhedonia. Other symptoms: weight/sleep changes, psychomotor changes, fatigue, worthlessness/guilt, concentration impairment, suicidal ideation. Symptoms must cause significant impairment and not be explained by substances or medical conditions.","e":"Anhedonia — the inability to feel pleasure — is often the most functionally disabling symptom.","t":"Mental Health","cap":"Depression is not sadness. The DSM criteria are worth knowing precisely because the misconceptions do real harm."},
    {"q":"How do SSRIs work?","a":"SSRIs block the serotonin reuptake transporter (SERT), increasing synaptic serotonin availability. Despite this immediate effect, clinical improvement takes 2-4 weeks — suggesting the antidepressant effect comes from downstream neuroplasticity and receptor regulation, not just serotonin elevation itself.","e":"The 2-4 week delay is one of the strongest clues that depression isn't simply about serotonin levels.","t":"Mental Health","cap":"The 'chemical imbalance' theory of depression is way more complicated than it sounds. The research is still catching up."},
    {"q":"What distinguishes bipolar I from bipolar II?","a":"Bipolar I requires at least one manic episode (elevated/irritable mood for ≥7 days with impaired functioning or psychotic features). Bipolar II requires at least one hypomanic episode and at least one major depressive episode — but never a full manic episode. Hypomania is less severe and doesn't cause major impairment.","e":"The distinction matters clinically: antidepressant monotherapy can trigger mania in bipolar I — a serious risk.","t":"Mental Health","cap":"Misdiagnosing bipolar II as unipolar depression and prescribing antidepressants alone can genuinely destabilize someone."},
    {"q":"What is the dopamine hypothesis of schizophrenia?","a":"The dopamine hypothesis proposes that positive symptoms of schizophrenia (hallucinations, delusions) result from excess dopamine activity in mesolimbic pathways. Antipsychotics work by blocking D2 receptors. Negative symptoms (flat affect, anhedonia) may involve prefrontal dopamine deficiency.","e":"The fact that L-DOPA can induce psychosis and antipsychotics block D2 was the original evidence for this theory.","t":"Mental Health","cap":"The dopamine hypothesis explains why antipsychotics work but also why they cause such frustrating side effects. It's a messy system."},
  ],

  "Genetics": [
    {"q":"How does CRISPR-Cas9 work?","a":"CRISPR-Cas9 uses a guide RNA to direct the Cas9 endonuclease to a specific DNA sequence, where it makes a double-strand break. The cell's own repair mechanisms (NHEJ or HDR) then either disrupt the gene or insert a new sequence. It's precise, cheap, and works in almost any organism.","e":"CRISPR democratized gene editing — what took years and millions of dollars now takes weeks in a standard lab.","t":"CRISPR & Gene Editing","cap":"The 2020 Nobel was well deserved. CRISPR changed biology the way PCR did — it made something previously impossible routine."},
    {"q":"What is the difference between dominant and recessive inheritance?","a":"In dominant inheritance, one mutant allele is sufficient to cause disease (the normal allele cannot compensate). In recessive inheritance, both alleles must be mutant — carriers with one normal copy are unaffected. Dominant diseases tend to appear in every generation; recessive ones can skip generations.","e":"Whether a mutation is dominant or recessive often depends on whether the remaining normal allele can produce enough functional protein.","t":"CRISPR & Gene Editing","cap":"Mendelian genetics seems simple until you start applying it to real family histories. Added a full deck on this to Ariel."},
    {"q":"What causes chromosomal aneuploidy and what are the consequences?","a":"Aneuploidy results from nondisjunction — chromosomes failing to separate properly during meiosis I or II. Trisomy 21 (Down syndrome), Trisomy 18 (Edwards), and Trisomy 13 (Patau) are the most common viable trisomies. Most other chromosomal aneuploidy results in early miscarriage.","e":"Maternal age is the biggest risk factor for trisomies because aging oocytes accumulate cohesin defects that cause nondisjunction.","t":"CRISPR & Gene Editing","cap":"Nondisjunction in oocytes happens before fertilization — which is why maternal age is the variable that matters, not paternal."},
    {"q":"What is epigenetics?","a":"Epigenetics refers to heritable changes in gene expression that don't involve changes to the DNA sequence itself. Mechanisms include DNA methylation (generally silencing genes) and histone modification (acetylation opens chromatin for transcription; methylation can activate or silence). Environmental exposures can alter epigenetic marks.","e":"Epigenetics explains how identical twins can develop different diseases despite sharing the same genome.","t":"CRISPR & Gene Editing","cap":"The idea that experience can change which genes your children express is one of the most fascinating frontiers in biology right now."},
  ],

  "Physics": [
    {"q":"What is quantum entanglement?","a":"Entanglement is a state where two particles are correlated such that measuring one instantly determines the state of the other, regardless of distance. No information travels faster than light — the correlations are built in at the moment of entanglement. Bell's theorem confirmed this experimentally.","e":"Einstein called it 'spooky action at a distance' and thought it proved QM was incomplete. Experiments proved Einstein wrong.","t":"Quantum Mechanics","cap":"Bell's theorem is one of the most profound experimental results in physics. We live in a non-local universe. 🔭"},
    {"q":"What does the Heisenberg Uncertainty Principle actually say?","a":"The HUP states that position and momentum cannot both be precisely defined simultaneously: Δx·Δp ≥ ℏ/2. This is NOT measurement disturbance — it's ontological. A particle doesn't have a precise position and momentum at the same time, even in principle.","e":"The common misconception is that measurement disturbs the particle. The HUP says something deeper: those properties don't co-exist precisely.","t":"Quantum Mechanics","cap":"Every time someone explains this as 'the measuring tool disturbs the particle' I have to take a deep breath 😮‍💨"},
    {"q":"What is dark matter and what's the evidence for it?","a":"Dark matter is a hypothetical non-electromagnetic matter that exerts gravitational effects. Evidence: galaxy rotation curves (stars orbit too fast for visible mass), gravitational lensing, cosmic microwave background structure, and the Bullet Cluster (where matter and gas separated during a galactic collision).","e":"We know dark matter is there from what it does to visible matter — we just don't know what it is.","t":"Astrophysics","cap":"The Bullet Cluster is the single most compelling piece of evidence. You can see the gravitational mass separate from normal matter 🌌"},
    {"q":"How does general relativity describe gravity?","a":"Newton described gravity as a force acting at a distance. Einstein's GR describes gravity as the curvature of spacetime caused by mass-energy. Objects follow geodesics (shortest paths through curved spacetime). GR predicted gravitational waves, black holes, and gravitational time dilation — all confirmed.","e":"LIGO's 2015 detection of gravitational waves from merging black holes was direct proof of GR 100 years later.","t":"Quantum Mechanics","cap":"Gravitational waves. Two black holes merged 1.3 billion years ago and we felt it here. GR is genuinely extraordinary 🌊"},
    {"q":"What is the Standard Model and what does it fail to explain?","a":"The Standard Model describes all known particles (quarks, leptons, gauge bosons) and three fundamental forces (EM, weak, strong). What it leaves out: gravity, dark matter, dark energy, matter-antimatter asymmetry, neutrino masses, and why there are three generations of matter.","e":"The most tested theory in history only describes ~5% of the universe. We're not close to done.","t":"Particle Physics","cap":"The Higgs discovery completed the Standard Model and simultaneously showed how much we don't understand yet."},
    {"q":"What is the photoelectric effect and why did it matter?","a":"The photoelectric effect is the emission of electrons from a metal when hit by light above a threshold frequency. Einstein explained it by proposing light comes in discrete packets (photons) with energy E=hf. This couldn't be explained by classical wave theory and was key evidence for quantum mechanics.","e":"Einstein won the Nobel Prize for this, not relativity — which tells you how radical the quantum insight was at the time.","t":"Quantum Mechanics","cap":"The photoelectric effect is where QM really began. Classical physics predicted something that just didn't happen. The data forced a new theory."},
  ],

  "Mathematics": [
    {"q":"What is Gödel's Incompleteness Theorem?","a":"Gödel's First Theorem: any consistent formal system powerful enough for arithmetic contains true statements that are unprovable within it. Second Theorem: such a system cannot prove its own consistency. This demolished Hilbert's program and proved mathematical truth is larger than mathematical proof.","e":"There will always be true things we cannot prove from any given set of axioms.","t":"Number Theory","cap":"Watching someone's face change the first time they understand Gödel is one of my favorite things about studying maths."},
    {"q":"Why does the Riemann Hypothesis matter?","a":"The Riemann Hypothesis states that all non-trivial zeros of ζ(s) lie on the critical line Re(s)=1/2. The distribution of prime numbers is deeply connected to these zeros — proving it would transform number theory, cryptography, and quantum chaos. It remains one of the Millennium Prize Problems.","e":"Primes are the atoms of arithmetic. RH is the key to understanding how they're distributed.","t":"Number Theory","cap":"Spent 4 hours just trying to understand WHY it matters, not how to prove it. The depth of the connection to primes is stunning."},
    {"q":"What is the difference between countable and uncountable infinity?","a":"Cantor showed infinities are not equal. Natural numbers, integers, and rationals are countably infinite. Real numbers are uncountably infinite — Cantor's diagonal argument proves no bijection with ℕ exists. There are strictly more real numbers than natural numbers despite both being infinite.","e":"This was so controversial that Kronecker called Cantor a 'corruptor of youth.' Now it's foundational set theory.","t":"Number Theory","cap":"Cantor's diagonal argument is the most elegant proof I've ever seen. Two infinities, one strictly larger, proved in one page. Mathematics is art 🎨"},
    {"q":"What is a proof by contradiction?","a":"Proof by contradiction assumes the negation of what you want to prove, then derives a logical impossibility (contradiction). Since the premises are true, the contradiction means the assumption must be false — so the original statement is true. Euclid's proof that there are infinitely many primes uses this method.","e":"It's elegant because it uses the structure of logic itself as a proof tool, not just algebraic manipulation.","t":"Number Theory","cap":"Euclid's prime proof from 300 BC is still the cleanest example of this technique. Some things don't need improving."},
  ],

  "History": [
    {"q":"What were the primary causes of World War 1?","a":"WWI's causes are often summarized as MAIN: Militarism (arms race, especially Anglo-German naval rivalry), Alliance systems (Triple Entente vs. Triple Alliance), Imperialism (colonial competition), and Nationalism (especially Balkan irredentism). The assassination of Franz Ferdinand was the trigger, not the cause.","e":"The alliance system turned a regional conflict into a world war — the trigger pulled a mechanism that was already cocked.","t":"European History","cap":"The distinction between trigger and cause is one of the most important conceptual tools in historical analysis. Applied to WWI it's everything."},
    {"q":"What was the significance of the Scramble for Africa?","a":"Between 1881-1914, European powers colonized 90% of Africa, drawing arbitrary borders that cut across ethnic groups and created artificial states. The Berlin Conference (1884-85) formalized the division. The legacy includes artificial boundaries, extraction-based economies, and disrupted political structures still felt today.","e":"Most of Africa's post-independence political conflicts trace directly back to colonial borders drawn with a ruler on a map.","t":"African History","cap":"The Berlin Conference borders are still causing wars today. History doesn't end — it compounds."},
    {"q":"What was Pan-Africanism and who were its key thinkers?","a":"Pan-Africanism is the political and cultural movement advocating solidarity among African and diaspora peoples, opposing colonialism and racism. Key thinkers: W.E.B. Du Bois (intellectual foundation), Marcus Garvey (Back to Africa movement), Kwame Nkrumah (continental unity), Frantz Fanon (anti-colonial psychology).","e":"Pan-Africanism was both a philosophical project and a political one — it tried to reconstruct identity after the violence of the slave trade.","t":"Pan-Africanism","cap":"Reading Fanon this week. The way he ties colonial psychology to physical resistance is unlike anything else I've read 📚"},
    {"q":"What caused the Cold War?","a":"The Cold War emerged from post-WWII distrust between the US and USSR: ideological conflict (liberal democracy vs. communism), Soviet expansion into Eastern Europe, nuclear weapons creating a balance of terror, and the collapse of wartime alliance. The Truman Doctrine (1947) framed it as a global struggle.","e":"Both superpowers genuinely believed the other threatened civilizational survival — that belief shaped every proxy conflict for 45 years.","t":"European History","cap":"The Cold War is often taught as strategic competition. Reading primary sources reveals it was also genuine ideological terror on both sides."},
  ],

  "Political Science": [
    {"q":"What is the difference between realism and liberalism in IR?","a":"Realism: states are primary actors, the system is anarchic, states maximize power and security, cooperation is fragile. Liberalism: institutions, trade, and democracy enable durable cooperation. Democratic Peace Theory holds that democracies rarely go to war with each other.","e":"Reality usually requires both lenses — realism explains the war in Ukraine; liberalism explains why the EU held together.","t":"Middle Eastern Politics","cap":"Teaching myself IR theory and the realist-liberal debate is more relevant in 2024 than any textbook year I've studied"},
    {"q":"What is democratic backsliding and what are its warning signs?","a":"Democratic backsliding is the gradual erosion of democratic norms by elected leaders — distinct from coups. Warning signs: executive power concentration through legal means, attacks on judicial independence, delegitimizing media, politicizing security forces. Examples: Hungary, Turkey, India under Modi.","e":"Modern democratic erosion is subtle and legal — by the time it's obvious, institutions are already compromised.","t":"Democracy & Governance","cap":"'How Democracies Die' should be required reading right now. It all happens through democratic mechanisms. That's what makes it so hard to resist."},
    {"q":"What caused the Arab Spring and why did most transitions fail?","a":"Causes: economic grievances, corruption, authoritarian repression, social media coordination, and 2010-11 food price spikes. Most failed because: lack of organized political parties, military/deep state resistance (Egypt 2013), sectarian exploitation (Syria, Libya), and weak civil society institutions.","e":"Tunisia had stronger pre-existing civil society institutions (trade unions, bar associations) — the partial exception that proves the rule.","t":"Middle Eastern Politics","cap":"The Arab Spring is a masterclass in the difference between toppling a dictator and dismantling a system. Egypt proved they're not the same."},
    {"q":"How has China's Belt and Road Initiative reshaped geopolitics?","a":"The BRI (2013) involves infrastructure investment across 140+ countries. It extends Chinese soft power and strategic access, creates debt leverage over developing states, counters US alliance networks, and reorients trade flows. The 'debt trap diplomacy' debate is more nuanced — some projects genuinely fill infrastructure gaps.","e":"Whether BRI is development cooperation or strategic encirclement is probably both simultaneously, depending on the project.","t":"China & Global Order","cap":"Mapping BRI projects in East Africa this week. The information asymmetry between Chinese negotiators and host governments is staggering 🌍"},
    {"q":"What are the main theories explaining persistent poverty?","a":"Geography hypothesis (Sachs): tropical climate, disease burden, landlocked terrain. Institutions hypothesis (Acemoglu & Robinson): extractive vs. inclusive institutions best predict outcomes. Cultural hypothesis (Weber): values and trust. Dependency theory: colonial extraction perpetuates underdevelopment. Evidence strongest for institutions.","e":"North/South Korea — same geography, different institutions — is the cleanest natural experiment for this debate.","t":"African Politics","cap":"Reading Acemoglu alongside Fanon lately. One says fix institutions; the other says institutions were designed to extract. Both are right."},
    {"q":"What is the concept of sovereignty and how has it evolved?","a":"Westphalian sovereignty (1648) established the principle of state non-interference in other states' internal affairs. Modern sovereignty has been qualified by humanitarian intervention norms (R2P), international courts, and the EU's pooling of sovereignty. The tension between sovereignty and universal rights is one of international law's central fault lines.","e":"R2P (Responsibility to Protect) was the biggest formal qualification of Westphalian sovereignty — and its application remains deeply contested.","t":"Geopolitics","cap":"Sovereignty is still the organizing principle of international order, but it's increasingly full of exceptions. That tension defines contemporary IR."},
  ],

  "International Relations": [
    {"q":"What is soft power?","a":"Soft power (Joseph Nye) is the ability to influence other actors through attraction and persuasion rather than coercion or payment. Cultural exports, political values, and foreign policy legitimacy are key sources. The US projects soft power through Hollywood and universities; China is building it through Confucius Institutes and BRI.","e":"Hard power says 'do this or else'; soft power makes others want what you want without being asked.","t":"China & Global Order","cap":"Soft power is why American universities still attract the world's best students even when US foreign policy is unpopular."},
    {"q":"What is the security dilemma?","a":"The security dilemma describes how states, acting defensively to increase their own security, trigger fear in other states who respond similarly — resulting in an arms race that leaves everyone less secure. It's a key explanation for why wars happen between states that neither wanted conflict.","e":"The security dilemma is structural — it can emerge even between states with purely defensive intentions.","t":"China & Global Order","cap":"NATO expansion as a security measure vs. security dilemma — this debate has defined European security for 30 years."},
    {"q":"What is the Washington Consensus?","a":"The Washington Consensus (1989, Williamson) was a set of economic policy prescriptions for developing countries: fiscal discipline, trade liberalization, privatization, deregulation, and market-determined exchange rates. Promoted by the IMF and World Bank, it became associated with structural adjustment programs that often caused economic hardship.","e":"The Washington Consensus largely failed in sub-Saharan Africa and Latin America — and its legacy shaped both the anti-globalization movement and China's alternative model.","t":"China & Global Order","cap":"Understanding the Washington Consensus is essential for understanding everything that came after it — including China's development offer."},
    {"q":"What is multilateralism and why is it under pressure?","a":"Multilateralism is the coordination of policy among multiple states through shared rules and institutions (UN, WTO, NATO, IMF). It's under pressure from rising nationalism, US retreat under Trump, China's preference for bilateral deals, and the perception that global institutions reflect Western rather than universal interests.","e":"Multilateralism requires states to accept constraints on sovereignty — that bargain is being renegotiated globally.","t":"China & Global Order","cap":"The multilateral order took 70 years to build. Watching it fray in real time is one of the defining political experiences of our generation."},
  ],

  "Political Philosophy": [
    {"q":"What is Rawls's veil of ignorance?","a":"In Rawls's 'A Theory of Justice', the veil of ignorance is a hypothetical device: imagine designing society without knowing your own position in it (race, gender, class, talents). Rawls argues rational agents behind this veil would choose a society with equal basic liberties and arrange inequalities to benefit the least advantaged (the difference principle).","e":"The veil of ignorance is a test for fairness — if you'd accept a rule without knowing which side you'd be on, it's more likely just.","t":"Democracy & Governance","cap":"Rawls is one of those philosophers where the thought experiment is so simple and the implications so profound it changes how you think permanently."},
    {"q":"What is the trolley problem and why do philosophers care about it?","a":"The trolley problem asks whether it's permissible to divert a trolley to kill one person in order to save five. It probes the tension between consequentialism (maximize outcomes — pull the lever) and deontology (some acts are wrong regardless of consequences — don't use someone as a means). The footbridge variant (pushing someone off a bridge) sharpens this further.","e":"The trolley problem shows that our moral intuitions are inconsistent — we have competing frameworks that can't all be right simultaneously.","t":"Democracy & Governance","cap":"My philosophy professor started with the trolley problem and I thought it was trivial. Two years later I still think about it."},
    {"q":"What is the social contract theory?","a":"Social contract theory (Hobbes, Locke, Rousseau) holds that political authority derives from an agreement among individuals who give up some freedoms for collective protection. Hobbes: absolute sovereignty to escape the state of nature. Locke: limited government protecting natural rights. Rousseau: direct democracy expressing the general will.","e":"The differences between Hobbes, Locke, and Rousseau track almost exactly with authoritarian, liberal, and democratic political traditions today.","t":"Democracy & Governance","cap":"These three thinkers essentially wrote the source code for modern political thought. Everything since is a fork."},
    {"q":"What is Hannah Arendt's 'banality of evil'?","a":"Arendt coined this phrase after covering Adolf Eichmann's trial in Jerusalem. She observed that Eichmann was not a monster but an ordinary bureaucrat who simply didn't think deeply about what he was doing. Evil can be perpetuated through thoughtlessness and conformity, not just malice.","e":"The 'banality of evil' is a warning: atrocities don't require villains, just people who stop thinking critically.","t":"Democracy & Governance","cap":"Eichmann in Jerusalem changed how I understand institutions and individual responsibility. Uncomfortable and essential reading."},
  ],

  "Economics": [
    {"q":"What is Modern Monetary Theory?","a":"MMT argues that monetarily sovereign governments cannot become insolvent in their own currency — they can always create money to pay debt. The binding constraint on spending is inflation, not solvency. Therefore, taxes exist to control inflation and reclaim currency, not to fund spending.","e":"MMT is a description of how monetary systems work — the debate is about what policy conclusions follow from that description.","t":"Macroeconomics","cap":"Every time I explain MMT someone says 'but Zimbabwe!' — as if monetary sovereignty and political competence are the same thing 😅"},
    {"q":"What is the Lucas Critique?","a":"Robert Lucas (1976) argued that econometric models fail as policy guides because people's behavior changes in response to policy itself. Exploit a statistical relationship (like the Phillips Curve) and people adjust expectations, destroying the relationship. Solution: models must be based on structural parameters that don't change with policy.","e":"The Lucas Critique led to DSGE models and rational expectations becoming central to macroeconomics.","t":"Macroeconomics","cap":"This critique seems obvious in hindsight but was genuinely revolutionary. Models aren't passive — people read them and adapt."},
    {"q":"What is the difference between nominal and real interest rates?","a":"Nominal rate = stated interest rate. Real rate = nominal − expected inflation (Fisher equation). What matters for economic decisions is the real rate. Negative real rates mean savers lose purchasing power even while nominally earning interest. Central banks target real rates to influence economic behavior.","e":"The Fisher effect describes how nominal rates adjust to inflation in the long run — inflation expectations are built into interest rates.","t":"Monetary Policy","cap":"This is the single most practically important economic concept for everyday life. 4% savings rate sounds fine until inflation is 6%."},
    {"q":"Why do economists use RCTs in development economics?","a":"Randomized controlled trials assign treatment and control groups randomly, letting us identify causal effects (not just correlations) of interventions like microfinance, cash transfers, or deworming. Duflo, Banerjee, and Kremer won the 2019 Nobel for applying this to poverty reduction.","e":"Before RCTs, development economics relied on cross-country regressions full of endogeneity. RCTs brought the rigor of medicine to the field.","t":"Development Economics","cap":"Before RCTs, we thought microfinance was a miracle. RCTs showed the evidence was far more mixed. Science should humble ideology. 📊"},
    {"q":"What is behavioral economics and how does it challenge classical theory?","a":"Behavioral economics integrates psychology into economics to explain why people systematically deviate from rational behavior: loss aversion (losses hurt more than gains feel good), present bias (overvaluing immediate vs. future rewards), and anchoring (relying too heavily on the first number seen). Kahneman and Tversky's prospect theory formalized these findings.","e":"Classical economics assumes people optimize; behavioral economics asks what they actually do. The answers are very different.","t":"Behavioral Economics","cap":"Loss aversion alone explains so much of politics, markets, and personal decisions. I see it everywhere now."},
  ],

  "Finance": [
    {"q":"What is the efficient market hypothesis?","a":"The EMH states that asset prices fully reflect all available information. Weak form: prices reflect all past prices. Semi-strong: prices reflect all public information. Strong: prices reflect all public and private information. If true in strong form, no one can consistently beat the market — even insiders.","e":"The EMH has been challenged by anomalies (momentum, value premium) but remains the benchmark assumption for market modeling.","t":"Financial Markets","cap":"The EMH debate is essentially the finance version of the free will debate — it never really ends but sharpens your thinking."},
    {"q":"How does discounted cash flow valuation work?","a":"DCF values a company by forecasting its future free cash flows and discounting them back to present value using a discount rate (typically WACC). The discount rate reflects the time value of money and risk. Terminal value often dominates the valuation — which shows how sensitive DCF is to long-run assumptions.","e":"DCF is theoretically sound but practically treacherous — garbage assumptions in, garbage valuation out.","t":"Investment & Valuation","cap":"My Ariel deck on DCF finally clicked after I built one myself from scratch. Concept → spreadsheet → understanding, in that order."},
    {"q":"What is the difference between systematic and unsystematic risk?","a":"Systematic risk (market risk) affects all assets and cannot be diversified away — recession, interest rate changes, geopolitical events. Unsystematic risk (firm-specific risk) can be diversified away by holding a portfolio. CAPM holds that only systematic risk (beta) is compensated by expected return.","e":"This is why diversification works — but also why it has limits. You can eliminate firm-specific risk but not market risk.","t":"Financial Markets","cap":"The key insight: markets pay you for risk you can't avoid, not for risk you chose not to diversify away."},
    {"q":"What is free cash flow and why does it matter?","a":"Free cash flow = operating cash flow minus capital expenditure. It represents cash available to shareholders, debt holders, and for reinvestment. Unlike accounting earnings, FCF is harder to manipulate and reflects actual cash generation. Valuation ultimately comes back to FCF.","e":"'Revenue is vanity, profit is sanity, cash is reality' — FCF is what makes or breaks a business in practice.","t":"Corporate Finance","cap":"Once you start looking at FCF instead of earnings, you see why some 'profitable' companies are actually bleeding cash."},
  ],

  "Psychology": [
    {"q":"What is cognitive dissonance?","a":"Cognitive dissonance (Festinger, 1957) is the discomfort of holding contradictory beliefs or when behavior conflicts with beliefs. Resolution: change the behavior, change the belief, or add rationalizations. Most people choose the last — rationalizing behavior they've already committed to.","e":"The key insight: we don't think ourselves into new behaviors; we rationalize behaviors we've already chosen.","t":"Cognitive Psychology","cap":"Cognitive dissonance is the most useful concept I know for understanding why people (including me) do what they do."},
    {"q":"What is the fundamental attribution error?","a":"The FAE is the tendency to attribute others' behavior to character rather than situation — 'she's irresponsible' rather than 'she's overwhelmed.' We show the reverse for our own behavior: 'I was stressed.' Milgram and Zimbardo's research showed how powerfully situations override character.","e":"The FAE is the psychological root of a lot of social injustice — assuming poverty or crime reflects character rather than circumstance.","t":"Social Psychology","cap":"Before studying this, I judged people constantly. Now I just ask: what situation are they in that I can't see?"},
    {"q":"What are the four attachment styles?","a":"Bowlby's attachment theory: Secure (responsive caregiving → comfortable with closeness). Anxious/Preoccupied (inconsistent caregiving → fears abandonment). Dismissive-Avoidant (emotionally unavailable caregiving → suppresses attachment needs). Fearful-Avoidant (frightening caregiving → wants closeness but fears it).","e":"Earned security is well-documented — therapy and healthy relationships can rewrite attachment patterns formed in childhood.","t":"Developmental Psychology","cap":"Understanding my own attachment style was one of the most uncomfortable and clarifying things I've done. Highly recommend."},
    {"q":"What is intrinsic vs. extrinsic motivation?","a":"Intrinsic motivation: doing something for its inherent satisfaction. Extrinsic: for external rewards. Deci & Ryan's Self-Determination Theory identifies three innate needs: competence, autonomy, and relatedness. Key finding: adding rewards to intrinsically motivated behavior can undermine it (overjustification effect).","e":"Paying kids to read can kill their love of reading — grades have this problem built in.","t":"Educational Psychology","cap":"The overjustification effect should be known by every teacher and parent. We've built entire educational systems that inadvertently kill curiosity."},
    {"q":"What is confirmation bias?","a":"Confirmation bias is the tendency to search for, interpret, and recall information in ways that confirm pre-existing beliefs. We notice evidence that supports our views and dismiss or reinterpret evidence that challenges them. It operates unconsciously and affects experts as much as laypeople.","e":"Confirmation bias is why we need external critics, peer review, and adversarial collaboration — our brains are not objective instruments.","t":"Cognitive Psychology","cap":"Every social media algorithm is a confirmation bias machine. Understanding the psychology makes the design choice feel more sinister, not less."},
    {"q":"What is the Dunning-Kruger effect?","a":"The Dunning-Kruger effect describes how people with limited knowledge in a domain overestimate their competence, while experts tend to underestimate theirs. As you learn more, you realize how much you don't know — so expertise brings humility, not confidence.","e":"The most dangerous people in any field are those who've just started — enough knowledge to feel confident, not enough to know their limits.","t":"Cognitive Psychology","cap":"The more I study, the less confident I feel about most things. Turns out that's the correct response to genuine learning."},
  ],

  "Computer Science": [
    {"q":"What is the difference between supervised, unsupervised, and reinforcement learning?","a":"Supervised: trained on labeled input-output pairs to predict outputs. Unsupervised: finds patterns in unlabeled data (clustering, generative models). Reinforcement: an agent learns from environmental rewards and penalties. Most real systems (like LLMs) combine approaches — unsupervised pretraining then supervised fine-tuning.","e":"The paradigm determines the training data you need and the kinds of problems you can solve.","t":"Machine Learning","cap":"These distinctions seem academic until you're actually designing a system and realize your data has no labels. Choice of paradigm is everything."},
    {"q":"What is the transformer architecture?","a":"Transformers (Vaswani et al., 2017) use self-attention mechanisms to process sequences in parallel rather than sequentially. Each token attends to all other tokens, capturing long-range dependencies. The architecture powers modern LLMs, vision models, and protein structure prediction (AlphaFold).","e":"Self-attention computes relationships between every pair of tokens in a sequence — that's why transformers handle context so well.","t":"Natural Language Processing","cap":"'Attention is All You Need' is genuinely one of the most impactful papers of the last decade. Everything is transformers now."},
    {"q":"What is the P vs NP problem?","a":"P is the class of problems solvable in polynomial time. NP is the class where solutions can be verified in polynomial time. The question: is P = NP? If yes, problems like factoring large numbers (which secures cryptography) would be efficiently solvable. Most computer scientists believe P ≠ NP, but it remains unproven.","e":"If P = NP, most modern encryption would be broken overnight. It's not just a theoretical question.","t":"Quantum Algorithms","cap":"The fact that we can't prove P ≠ NP means all of modern cryptography rests on a conjecture, not a proof. Sleep well."},
    {"q":"How does public-key cryptography work?","a":"Public-key cryptography (RSA) uses a mathematically linked key pair: a public key to encrypt and a private key to decrypt. Security relies on the computational difficulty of factoring the product of two large primes — easy to multiply, practically impossible to factor with classical computers.","e":"Quantum computers running Shor's algorithm could break RSA — which is why post-quantum cryptography is an active research area.","t":"Cybersecurity","cap":"Every HTTPS connection you make uses this. Post-quantum crypto is now urgent because 'harvest now, decrypt later' attacks are real."},
    {"q":"What is a distributed system and what are its core challenges?","a":"A distributed system is a collection of independent computers that appears to users as a single coherent system. Core challenges: network partitions (nodes can't communicate), latency, consistency vs. availability tradeoffs (CAP theorem), and consensus (getting nodes to agree on a value despite failures — Paxos, Raft).","e":"The CAP theorem says you can only guarantee two of: consistency, availability, and partition tolerance — forcing real design tradeoffs.","t":"Distributed Systems","cap":"Distributed systems is the field that teaches you how much can go wrong and still keep working. Chaos engineering is a legitimate discipline."},
    {"q":"What are the main ethical concerns with AI systems?","a":"Key concerns: algorithmic bias (models trained on historical data perpetuate historical discrimination), opacity (many models are black boxes), accountability gaps (who is responsible when AI harms someone?), job displacement, and existential risks from misaligned advanced AI.","e":"Bias in AI isn't a bug — it's the system faithfully reflecting the biases in the data it was trained on.","t":"AI Ethics","cap":"We keep building AI systems before we've figured out how to make them fair or accountable. The deployment is outrunning the ethics."},
  ],

  "Law": [
    {"q":"What is judicial review and why is it controversial?","a":"Judicial review is the power of courts to declare legislation unconstitutional. In the US, it derives from Marbury v. Madison (1803) — not explicitly from the Constitution. It's controversial because unelected judges can override the will of elected legislatures, raising questions about democratic legitimacy.","e":"The 'counter-majoritarian difficulty' — how can judicial review be justified in a democracy? — is still debated in constitutional theory.","t":"Constitutional Law","cap":"Marbury v. Madison is one of the most consequential cases ever decided, and Marshall basically invented the power through the opinion itself."},
    {"q":"What is the difference between civil and criminal law?","a":"Criminal law involves the state prosecuting individuals for acts deemed offenses against society — beyond reasonable doubt standard, penalties include imprisonment. Civil law involves disputes between private parties — preponderance of evidence standard, remedies are typically monetary damages or injunctions.","e":"The same act can give rise to both criminal and civil liability — OJ Simpson was acquitted criminally but found liable civilly.","t":"Constitutional Law","cap":"Understanding this distinction is the foundation of legal literacy. The different standards of proof alone explain most of the confusion around high-profile cases."},
    {"q":"What is proportionality in international humanitarian law?","a":"Proportionality in IHL prohibits attacks where expected civilian casualties would be excessive relative to the anticipated military advantage. It requires commanders to assess expected incidental harm against concrete military gains. Highly subjective in practice, and its violation constitutes a war crime.","e":"Proportionality doesn't ban civilian casualties — it bans disproportionate ones. That distinction is central to debates about modern warfare.","t":"International Law","cap":"Gaza, Ukraine, Yemen — the proportionality debate is playing out in real time everywhere. Understanding the legal framework matters."},
    {"q":"What is due process?","a":"Due process (5th and 14th Amendments in the US) requires that no person be deprived of life, liberty, or property without fair legal procedures. Procedural due process: adequate notice and a fair hearing. Substantive due process: the government cannot infringe certain fundamental rights regardless of procedure.","e":"Substantive due process is where rights not explicitly in the Constitution (privacy, same-sex marriage) have been found to reside — and why it's politically contested.","t":"Constitutional Law","cap":"Due process is the most fundamental protection in constitutional law and the most frequently litigated. Know it deeply."},
  ],

  "Philosophy": [
    {"q":"What is the mind-body problem?","a":"The mind-body problem asks how mental states (consciousness, thoughts, feelings) relate to physical states (brain activity). Dualism (Descartes): mind and body are distinct substances. Physicalism: mental states are ultimately physical. Functionalism: mental states are defined by their causal roles, not their physical substrate.","e":"Consciousness — subjective experience — remains the 'hard problem': why does physical processing produce a felt experience at all?","t":"Philosophy of Mind","cap":"The hard problem of consciousness is the one problem in philosophy I genuinely cannot see a path to solving. That's rare for me."},
    {"q":"What is utilitarianism?","a":"Utilitarianism (Bentham, Mill) holds that the morally right action is the one that maximizes total well-being or utility. Act utilitarianism evaluates each action individually. Rule utilitarianism evaluates rules whose general observance maximizes utility. Critics: it can justify harmful acts on aggregate grounds, ignores individual rights.","e":"The 'utility monster' thought experiment shows the limits — a creature that gains immense pleasure from harm would receive all resources under strict utilitarianism.","t":"Ethics & Moral Philosophy","cap":"Utilitarianism feels intuitively right until you follow it to its conclusions. Then it feels horrifying. That tension is the whole field."},
    {"q":"What is Kant's categorical imperative?","a":"Kant's CI offers a test for moral maxims: act only according to that maxim which you can at the same time will to be a universal law. A second formulation: act so that you treat humanity, whether in your own person or that of any other, always as an end, never merely as a means.","e":"The CI tries to ground morality in reason alone, independent of consequences — a radical departure from utilitarian thinking.","t":"Ethics & Moral Philosophy","cap":"The universalizability test is one of the most practically useful tools in ethics. When I face a moral question I often start here."},
    {"q":"What is Plato's allegory of the cave?","a":"In The Republic, prisoners chained in a cave see only shadows on a wall and mistake them for reality. A prisoner freed and brought into sunlight is initially blinded but eventually sees true forms. Plato uses this to argue that the visible world is a shadow of a higher realm of Forms — and that philosophers, who see beyond appearances, are best suited to rule.","e":"The allegory is about epistemology (how we know) and politics (who should govern) simultaneously.","t":"Philosophy of Mind","cap":"Every time I hear 'seeing through the noise' or 'the matrix' I think of this. Plato got there first, 2400 years ago."},
  ],

  "Biology": [
    {"q":"What is the central dogma of molecular biology?","a":"The central dogma describes information flow in cells: DNA → RNA (transcription) → Protein (translation). DNA is replicated during cell division. RNA can also be reverse-transcribed back to DNA (retroviruses). The dogma defines the fundamental directions of genetic information transfer.","e":"HIV uses reverse transcriptase to convert its RNA genome into DNA — exploiting the reverse direction the central dogma had initially overlooked.","t":"Molecular Biology","cap":"The exceptions to the central dogma (retroviruses, prions) are almost more interesting than the rule itself."},
    {"q":"How does natural selection work?","a":"Natural selection requires: heritable variation in a population, variation affecting survival or reproduction, differential reproductive success. Individuals with traits better suited to their environment leave more offspring, shifting trait frequency over generations. It is not random — variation is random, selection is the opposite.","e":"The common misconception is that evolution is random. Mutation is random; selection acts on that variation non-randomly.","t":"Ecology","cap":"'Evolution is just a theory' — so is gravity. The word means something different in science than in everyday speech."},
    {"q":"What is the structure and function of DNA?","a":"DNA is a double helix of two antiparallel strands connected by hydrogen-bonded base pairs (A-T, G-C). The phosphate-sugar backbone provides structural support; the base sequence encodes genetic information. Double-stranded structure allows each strand to serve as a template for replication.","e":"Watson and Crick's structure immediately suggested the copying mechanism — 'It has not escaped our notice...' is one of science's greatest understatements.","t":"Molecular Biology","cap":"The double helix is one of the most elegant structures in all of science. Form and function are inseparable here."},
    {"q":"What is CRISPR-Cas9 and how does it edit genes?","a":"CRISPR-Cas9 uses a guide RNA to direct Cas9 endonuclease to a specific DNA sequence, where it makes a targeted double-strand break. Cell repair mechanisms then disrupt the gene (NHEJ) or insert new sequence (HDR). It works in virtually any organism and is precise, cheap, and fast.","e":"CRISPR democratized gene editing the way PCR democratized DNA amplification — it made something impossible into something routine.","t":"Genetics","cap":"We can now edit the genome like a document. The scientific capability arrived decades ahead of our ethical framework for using it."},
  ],

  "Chemistry": [
    {"q":"What is an enzyme and how does it work?","a":"Enzymes are biological catalysts — proteins that lower the activation energy of reactions without being consumed. They bind substrates at the active site, stabilize the transition state, and are highly specific. Temperature and pH affect conformation and therefore activity; inhibitors can block or modulate function.","e":"Enzymes are why biochemical reactions that take years in a flask happen in milliseconds in a cell.","t":"Biochemistry","cap":"Understanding enzymes is the foundation of pharmacology. Nearly every drug either inhibits or modulates enzyme activity."},
    {"q":"What determines a molecule's polarity?","a":"A molecule is polar when its centers of positive and negative charge don't coincide, creating a dipole moment. This depends on bond polarity (electronegativity differences) and molecular geometry. CO2 has polar bonds but is nonpolar because they cancel out symmetrically; water is bent and strongly polar.","e":"Polarity determines solubility, boiling points, reactivity, and biological interactions — it underpins most of chemistry.","t":"Organic Chemistry","cap":"The water example — bent geometry creating polarity — was the moment chemistry started making sense to me."},
    {"q":"What is the difference between endothermic and exothermic reactions?","a":"Exothermic reactions release energy (ΔH < 0) to the surroundings — combustion, neutralization. Endothermic reactions absorb energy from surroundings (ΔH > 0) — photosynthesis, dissolving ammonium nitrate. Spontaneity is determined by both ΔH and entropy change (ΔG = ΔH − TΔS).","e":"A reaction can be endothermic and still spontaneous if it's driven by a large entropy increase — which is why ice melts at room temperature.","t":"Biochemistry","cap":"ΔG is the real question in thermodynamics. ΔH is only half the story."},
  ],

  "Literature": [
    {"q":"What is magical realism?","a":"Magical realism is a literary style where magical or supernatural elements coexist with ordinary reality, presented matter-of-factly without explanation. Associated with Latin American literature (García Márquez, Borges) and African writing (Amos Tutuola, Ben Okri). It challenges the distinction between the real and the imagined.","e":"Magical realism is often political — presenting the extraordinary as ordinary is a way of making the ordinary feel strange and questioning its naturalness.","t":"Comparative Literature","cap":"García Márquez said he simply narrated reality as a Colombian grandmother would — without treating the miraculous as strange. That's the whole technique."},
    {"q":"What is the difference between a metaphor and a simile?","a":"A simile explicitly compares two things using 'like' or 'as': 'her voice was like music.' A metaphor makes the comparison directly without the connector: 'her voice was music.' Metaphors tend to be more direct and forceful; similes more tentative. Both are forms of figurative comparison.","e":"The distinction matters in close reading — the degree of comparison affects tone and the relationship the writer implies between the compared things.","t":"Creative Writing","cap":"Sounds basic until you realize how differently metaphors and similes land emotionally in a sentence. Try swapping them in a poem."},
    {"q":"What is the Harlem Renaissance?","a":"The Harlem Renaissance (1920s-1930s) was a cultural, artistic, and intellectual explosion among African Americans centered in New York's Harlem. Key figures: Langston Hughes, Zora Neale Hurston, Countee Cullen. It reclaimed Black identity, challenged racist stereotypes, and transformed American music, literature, and visual art.","e":"The Harlem Renaissance showed that African American culture was not marginal but central to American identity — a point still being relitigated.","t":"African Literature","cap":"Reading Zora Neale Hurston for the first time felt like discovering a whole world that should have been on every syllabus 📚"},
  ],

  "Art History": [
    {"q":"What is chiaroscuro?","a":"Chiaroscuro (Italian: light-dark) is a technique using strong contrasts between light and shadow to create depth, volume, and drama in two-dimensional art. Caravaggio mastered it as tenebrism — extreme chiaroscuro with dark backgrounds. Rembrandt used softer gradations. It became central to Baroque painting.","e":"Chiaroscuro is essentially how painters faked three-dimensionality before photography — by following how light actually behaves on surfaces.","t":"Renaissance & Modern Art","cap":"Seeing a Caravaggio in person is different from any reproduction. The light literally seems to be coming from inside the canvas."},
    {"q":"What was the Impressionist revolution?","a":"Impressionism (1870s, Paris) rejected academic painting's emphasis on finish and historical subjects. Monet, Renoir, and Degas painted everyday scenes with visible brushstrokes and attention to light's momentary effects. Rejected by the official Salon, they exhibited independently. They changed the fundamental question from 'what is painted?' to 'how does seeing work?'","e":"Impressionism was less a style than a perceptual question — painting light as it appears, not objects as we know them to be.","t":"Renaissance & Modern Art","cap":"The Impressionists were rejected as unfinished and lazy by critics who couldn't see what they were actually doing. Classic pattern."},
    {"q":"What is the significance of African cinema in world film history?","a":"African cinema (especially Senegalese director Ousmane Sembène, 'the father of African cinema') developed in the 1960s-70s as a counter to colonial representations. It uses film as political critique, documents African perspectives on independence and postcoloniality, and draws on oral storytelling traditions.","e":"African cinema had to create its own distribution networks because French colonial agreements locked African screens to French films.","t":"Film & Cinema","cap":"Sembène's 'Xala' (1975) is one of the greatest political comedies ever made and barely anyone knows it. That's the problem he was trying to solve."},
  ],

  "Sociology": [
    {"q":"What is the sociological imagination?","a":"C. Wright Mills defined the sociological imagination as the ability to connect personal troubles to public issues — understanding individual experience within its broader historical and social context. Unemployment is a personal trouble; mass unemployment is a structural issue. The sociological imagination bridges these levels.","e":"Without the sociological imagination, we individualize structural problems and miss where the real solutions lie.","t":"Social Inequality","cap":"Once you have the sociological imagination you can't turn it off. Everything personal starts looking structural."},
    {"q":"What is Bourdieu's concept of capital?","a":"Bourdieu identified multiple forms of capital beyond economic: social capital (networks and relationships), cultural capital (education, tastes, credentials), and symbolic capital (prestige and recognition). These forms are convertible — cultural capital can become economic capital, and vice versa. They reproduce social inequality across generations.","e":"Why elite education reproduces elites: it transmits cultural capital alongside credentials, which markets reward even when they shouldn't.","t":"Cultural Studies","cap":"Bourdieu explains why your accent, tastes, and mannerisms matter in job interviews. It's not just qualifications — it's capital."},
    {"q":"What is the concept of intersectionality?","a":"Intersectionality (Kimberlé Crenshaw, 1989) describes how overlapping social identities (race, gender, class, sexuality) create interconnected systems of discrimination and privilege. Black women's experiences cannot be understood by analyzing race and gender separately — their combination produces distinct forms of disadvantage.","e":"The concept emerged from Black women being excluded from both feminist and civil rights legal frameworks — a practical legal problem, not just a theoretical one.","t":"Social Inequality","cap":"Intersectionality was originally a legal argument about how courts handled discrimination cases. The theory came from practice, not the other way around."},
  ],

  "Journalism": [
    {"q":"What is the inverted pyramid structure?","a":"The inverted pyramid puts the most newsworthy information first (who, what, when, where, why, how), followed by supporting details, and background last. This allows editors to cut from the bottom without losing essential information and helps readers decide quickly whether to continue reading.","e":"The structure emerged from telegraph reporting — if the transmission failed, at least the key facts had been sent.","t":"Media & Society","cap":"The inverted pyramid is 150 years old and still the default structure for news writing. Some conventions are actually good."},
    {"q":"What is media framing and why does it matter?","a":"Framing is how media present information — what's emphasized, what's omitted, what context is provided — which shapes audience interpretation. The same story can be framed as a crime story, an economic story, or a systemic failure story, each suggesting different causes and solutions.","e":"Media framing shapes not just what people think about but how they think about it — and therefore what policy responses seem logical.","t":"Media & Society","cap":"The immigration 'crisis' vs. 'opportunity' framing generates completely different political responses to identical data. Framing is power."},
    {"q":"What is the difference between misinformation and disinformation?","a":"Misinformation is false or inaccurate information spread without intent to deceive — sharing a false story you believe to be true. Disinformation is deliberately false information spread to deceive. The distinction matters for understanding causes and responses: misinformation needs correction; disinformation needs counter-strategy.","e":"Most of what spreads on social media is misinformation (shared by believers) rather than disinformation (from deliberate campaigns) — though the two interact.","t":"Media & Society","cap":"Labeling everything 'disinformation' assumes bad faith where confusion is often more accurate. The distinction changes the response required."},
  ],

  "Business": [
    {"q":"What is Porter's Five Forces?","a":"Porter's Five Forces analyzes industry competitiveness through: threat of new entrants, bargaining power of suppliers, bargaining power of buyers, threat of substitute products, and rivalry among existing competitors. Together they determine an industry's inherent profitability and shape strategy.","e":"Porter's insight: strategy is fundamentally about choosing a position where these five forces are least threatening.","t":"Corporate Strategy","cap":"Five Forces is one of those frameworks that sounds simple and gets more powerful every time you apply it to a real industry."},
    {"q":"What is a minimum viable product?","a":"An MVP is the simplest version of a product that allows a startup to test a core hypothesis with real users and gather validated learning. It's not a prototype — it must deliver actual value. The goal is to learn as much as possible with as little investment as possible before scaling.","e":"The biggest startup mistake isn't building badly — it's building the right thing badly without first confirming people want it.","t":"Entrepreneurship","cap":"Most failed startups built something nobody wanted. The MVP discipline exists specifically to make that mistake cheap. Ariel helped me understand this before I got burned."},
    {"q":"What is sustainable competitive advantage?","a":"A sustainable competitive advantage allows a company to outperform competitors over time. Sources: cost advantage (economies of scale, process efficiency), differentiation (unique product, brand), switching costs (CRM, ecosystems), and network effects (more users → more value). The test: is the advantage durable and defensible?","e":"Most 'competitive advantages' are temporary. The ones that last are structural — built into how the business works, not just what it sells.","t":"Corporate Strategy","cap":"Amazon's competitive moat isn't the products — it's the logistics infrastructure that took 20 years and billions to build. That's not replicable."},
    {"q":"What are the key principles of design thinking?","a":"Design thinking is a human-centered innovation approach: Empathize (deeply understand user needs), Define (frame the real problem), Ideate (generate solutions broadly), Prototype (build quickly and cheaply), Test (learn from real feedback). It's iterative and non-linear — insights from testing reshape the definition.","e":"Design thinking's value is forcing explicit empathy before solution — most bad products are made by people who never talked to users.","t":"Innovation & Design Thinking","cap":"Every time I skip the empathy phase I regret it. The insight that saves the whole project is usually hiding in user interviews."},
  ],
}

COMMENT_POOL = [
    "🔥", "this is so clear", "exactly what I needed", "saving this",
    "been struggling with this one 😅", "finally a clean breakdown",
    "this + duels on Ariel = unstoppable", "the explanation made it click",
    "sharing this with my study group", "never thought about it this way",
    "this one was hard for me too", "tagged 3 people already",
    "good timing, exam next week", "kept this in my Ariel deck for months",
    "the real world example helped a lot", "someone needed to explain this properly",
    "this is what my textbook failed to do 😭", "appreciate this",
    "lost a duel on this topic, won't happen again", "🙌",
]

async def fetch_photos(n=120):
    """Fetch diverse mixed-age profile photos from randomuser.me (no nationality filter = global mix)."""
    url = f"https://randomuser.me/api/?results={n}&inc=picture,gender&noinfo"
    try:
        with urlopen(url, timeout=20) as r:
            data = json.loads(r.read())
        photos = [u["picture"]["large"] for u in data.get("results", []) if u.get("picture",{}).get("large")]
        print(f"  Fetched {len(photos)} photos from randomuser.me")
        return photos
    except Exception as e:
        print(f"  Warning: photo fetch failed ({e})")
        return []

PERSONAS = [
  {"name":"Amara Osei","username":"amaraneuro","email":"amara.osei@ariel.bot","subject":"Neuroscience","topic":"Memory & Learning"},
  {"name":"Isabella Ferreira","username":"bellamed","email":"isabella.ferreira@ariel.bot","subject":"Medicine","topic":"Pharmacology"},
  {"name":"Ravi Krishnamurthy","username":"ravipharma","email":"ravi.krish@ariel.bot","subject":"Medicine","topic":"Drug Mechanisms"},
  {"name":"Nadia Al-Hassan","username":"nadiapsych","email":"nadia.alhassan@ariel.bot","subject":"Psychiatry","topic":"Mental Health"},
  {"name":"Luca Marchetti","username":"lucaneuro","email":"luca.marchetti@ariel.bot","subject":"Neurology","topic":"Neuroplasticity"},
  {"name":"Yuki Tanaka","username":"yukiimmuno","email":"yuki.tanaka@ariel.bot","subject":"Immunology","topic":"Autoimmune Disease"},
  {"name":"Fatima Benali","username":"fatimahealth","email":"fatima.benali@ariel.bot","subject":"Public Health","topic":"Epidemiology"},
  {"name":"Marcus Thompson","username":"marcuscardio","email":"marcus.thompson@ariel.bot","subject":"Medicine","topic":"Cardiology"},
  {"name":"Anya Petrov","username":"anyagenetics","email":"anya.petrov@ariel.bot","subject":"Genetics","topic":"CRISPR & Gene Editing"},
  {"name":"James Okafor","username":"jamessurgery","email":"james.okafor@ariel.bot","subject":"Medicine","topic":"Surgery"},
  {"name":"Erik Lindström","username":"erikphysics","email":"erik.lindstrom@ariel.bot","subject":"Physics","topic":"Quantum Mechanics"},
  {"name":"Priya Sharma","username":"priyaquantum","email":"priya.sharma@ariel.bot","subject":"Physics","topic":"Quantum Computing"},
  {"name":"Carlos Mendoza","username":"carlosmath","email":"carlos.mendoza@ariel.bot","subject":"Mathematics","topic":"Number Theory"},
  {"name":"Liu Wei","username":"liuastro","email":"liu.wei@ariel.bot","subject":"Physics","topic":"Astrophysics"},
  {"name":"Zara Ahmed","username":"zaraapplied","email":"zara.ahmed@ariel.bot","subject":"Mathematics","topic":"Linear Algebra"},
  {"name":"Thomas Müller","username":"thomasparticle","email":"thomas.muller@ariel.bot","subject":"Physics","topic":"Particle Physics"},
  {"name":"Keiko Yamamoto","username":"keikostats","email":"keiko.yamamoto@ariel.bot","subject":"Mathematics","topic":"Statistics & Probability"},
  {"name":"Adebayo Adeyemi","username":"bayomath","email":"adebayo.adeyemi@ariel.bot","subject":"Mathematics","topic":"Topology"},
  {"name":"Sophie Dubois","username":"sophiecosmos","email":"sophie.dubois@ariel.bot","subject":"Physics","topic":"Cosmology"},
  {"name":"Andrei Volkov","username":"andreinumbers","email":"andrei.volkov@ariel.bot","subject":"Mathematics","topic":"Calculus"},
  {"name":"Chioma Eze","username":"chiomahistory","email":"chioma.eze@ariel.bot","subject":"History","topic":"African History"},
  {"name":"Omar Khaled","username":"omarmideast","email":"omar.khaled@ariel.bot","subject":"Political Science","topic":"Middle Eastern Politics"},
  {"name":"Victoria Novak","username":"viceurohist","email":"victoria.novak@ariel.bot","subject":"History","topic":"European History"},
  {"name":"Samuel Odhiambo","username":"sampolisci","email":"samuel.odhiambo@ariel.bot","subject":"Political Science","topic":"African Politics"},
  {"name":"Mei Lin","username":"meiintrel","email":"mei.lin@ariel.bot","subject":"International Relations","topic":"China & Global Order"},
  {"name":"Rafael Santos","username":"rafalatam","email":"rafael.santos@ariel.bot","subject":"Political Science","topic":"Latin American Politics"},
  {"name":"Ingrid Larsen","username":"ingridpolphil","email":"ingrid.larsen@ariel.bot","subject":"Political Philosophy","topic":"Democracy & Governance"},
  {"name":"Kwame Asante","username":"kwamepan","email":"kwame.asante@ariel.bot","subject":"History","topic":"Pan-Africanism"},
  {"name":"Leila Moradi","username":"leilageo","email":"leila.moradi@ariel.bot","subject":"Political Science","topic":"Geopolitics"},
  {"name":"Benjamin Cohen","username":"benconflict","email":"benjamin.cohen@ariel.bot","subject":"Political Science","topic":"Conflict & Peace Studies"},
  {"name":"Aisha Diallo","username":"aishadeveco","email":"aisha.diallo@ariel.bot","subject":"Economics","topic":"Development Economics"},
  {"name":"Henrik Johansson","username":"henrikbeheco","email":"henrik.johansson@ariel.bot","subject":"Economics","topic":"Behavioral Economics"},
  {"name":"Priscilla Mensah","username":"priscyfinance","email":"priscilla.mensah@ariel.bot","subject":"Finance","topic":"Financial Markets"},
  {"name":"David Kim","username":"davidmacro","email":"david.kim@ariel.bot","subject":"Economics","topic":"Macroeconomics"},
  {"name":"Mariam Toure","username":"mariammicro","email":"mariam.toure@ariel.bot","subject":"Economics","topic":"Microeconomics"},
  {"name":"Alex Petridis","username":"alexeconhist","email":"alex.petridis@ariel.bot","subject":"Economics","topic":"Economic History"},
  {"name":"Nkechi Onyeka","username":"nkechimarkets","email":"nkechi.onyeka@ariel.bot","subject":"Finance","topic":"Investment & Valuation"},
  {"name":"Tobias Weber","username":"tobiasmonetary","email":"tobias.weber@ariel.bot","subject":"Economics","topic":"Monetary Policy"},
  {"name":"Camila Reyes","username":"camitrade","email":"camila.reyes@ariel.bot","subject":"Economics","topic":"International Trade"},
  {"name":"Haruto Sato","username":"harutocorp","email":"haruto.sato@ariel.bot","subject":"Finance","topic":"Corporate Finance"},
  {"name":"Zoe Andersen","username":"zoecog","email":"zoe.andersen@ariel.bot","subject":"Psychology","topic":"Cognitive Psychology"},
  {"name":"Kofi Boateng","username":"kofisocial","email":"kofi.boateng@ariel.bot","subject":"Psychology","topic":"Social Psychology"},
  {"name":"Emma Walsh","username":"emmaclinical","email":"emma.walsh@ariel.bot","subject":"Psychology","topic":"Clinical Psychology"},
  {"name":"Arjun Nair","username":"arjunneuro","email":"arjun.nair@ariel.bot","subject":"Psychology","topic":"Neuropsychology"},
  {"name":"Maria Santos","username":"mariaedu","email":"maria.santos@ariel.bot","subject":"Psychology","topic":"Educational Psychology"},
  {"name":"Noah Bergström","username":"noahevo","email":"noah.bergstrom@ariel.bot","subject":"Psychology","topic":"Evolutionary Psychology"},
  {"name":"Amina Coulibaly","username":"aminadev","email":"amina.coulibaly@ariel.bot","subject":"Psychology","topic":"Developmental Psychology"},
  {"name":"Jake Morrison","username":"jakesports","email":"jake.morrison@ariel.bot","subject":"Psychology","topic":"Sports Psychology"},
  {"name":"Yuna Park","username":"yunapositive","email":"yuna.park@ariel.bot","subject":"Psychology","topic":"Positive Psychology"},
  {"name":"Diana Popescu","username":"dianatrauma","email":"diana.popescu@ariel.bot","subject":"Psychology","topic":"Trauma & Resilience"},
  {"name":"Tariq Al-Rashid","username":"tariqml","email":"tariq.alrashid@ariel.bot","subject":"Computer Science","topic":"Machine Learning"},
  {"name":"Aiko Suzuki","username":"aikocv","email":"aiko.suzuki@ariel.bot","subject":"Computer Science","topic":"Computer Vision"},
  {"name":"Felix Osei","username":"felixcyber","email":"felix.osei@ariel.bot","subject":"Computer Science","topic":"Cybersecurity"},
  {"name":"Natasha Ivanova","username":"natashasys","email":"natasha.ivanova@ariel.bot","subject":"Computer Science","topic":"Distributed Systems"},
  {"name":"Raj Patel","username":"rajaiethics","email":"raj.patel@ariel.bot","subject":"Computer Science","topic":"AI Ethics"},
  {"name":"Chloé Martin","username":"chloehci","email":"chloe.martin@ariel.bot","subject":"Computer Science","topic":"Human-Computer Interaction"},
  {"name":"Emeka Nwosu","username":"emekablockchain","email":"emeka.nwosu@ariel.bot","subject":"Computer Science","topic":"Blockchain & Web3"},
  {"name":"Lars Hansen","username":"larsquantum","email":"lars.hansen@ariel.bot","subject":"Computer Science","topic":"Quantum Algorithms"},
  {"name":"Seo-Yeon Choi","username":"seoyeonnlp","email":"seoyeon.choi@ariel.bot","subject":"Computer Science","topic":"Natural Language Processing"},
  {"name":"Gabriel Moreau","username":"gabrielrobots","email":"gabriel.moreau@ariel.bot","subject":"Computer Science","topic":"Robotics & Automation"},
  {"name":"Chidinma Obi","username":"chidilaw","email":"chidinma.obi@ariel.bot","subject":"Law","topic":"Constitutional Law"},
  {"name":"Antoine Leclerc","username":"antoinephil","email":"antoine.leclerc@ariel.bot","subject":"Philosophy","topic":"Philosophy of Mind"},
  {"name":"Zanele Dlamini","username":"zanelerights","email":"zanele.dlamini@ariel.bot","subject":"Law","topic":"Human Rights Law"},
  {"name":"Hiroshi Nakamura","username":"hiroshilegal","email":"hiroshi.nakamura@ariel.bot","subject":"Law","topic":"Legal Philosophy"},
  {"name":"Beatriz Alves","username":"beaintlaw","email":"beatriz.alves@ariel.bot","subject":"Law","topic":"International Law"},
  {"name":"Elias Mensah","username":"eliascriminal","email":"elias.mensah@ariel.bot","subject":"Law","topic":"Criminal Justice"},
  {"name":"Simone Russo","username":"simoneethics","email":"simone.russo@ariel.bot","subject":"Philosophy","topic":"Ethics & Moral Philosophy"},
  {"name":"Adaeze Nwosu","username":"adaezecorp","email":"adaeze.nwosu@ariel.bot","subject":"Law","topic":"Corporate Law"},
  {"name":"Viktor Sokolov","username":"viktorpolphil","email":"viktor.sokolov@ariel.bot","subject":"Philosophy","topic":"Political Philosophy"},
  {"name":"Grace Wanjiru","username":"graceenvlaw","email":"grace.wanjiru@ariel.bot","subject":"Law","topic":"Environmental Law"},
  {"name":"Femi Adeyemi","username":"femimolbio","email":"femi.adeyemi@ariel.bot","subject":"Biology","topic":"Molecular Biology"},
  {"name":"Chen Xiao","username":"chenbiochem","email":"chen.xiao@ariel.bot","subject":"Chemistry","topic":"Biochemistry"},
  {"name":"Lena Fischer","username":"lenaeco","email":"lena.fischer@ariel.bot","subject":"Biology","topic":"Ecology"},
  {"name":"Oluwaseun Adeleke","username":"seunmicro","email":"seun.adeleke@ariel.bot","subject":"Biology","topic":"Microbiology"},
  {"name":"Ana Gutierrez","username":"anaorgo","email":"ana.gutierrez@ariel.bot","subject":"Chemistry","topic":"Organic Chemistry"},
  {"name":"Kweku Mensah","username":"kwekugene","email":"kweku.mensah@ariel.bot","subject":"Biology","topic":"Genetics"},
  {"name":"Hana Novak","username":"hanacell","email":"hana.novak@ariel.bot","subject":"Biology","topic":"Cell Biology"},
  {"name":"Diego Torres","username":"diegomarine","email":"diego.torres@ariel.bot","subject":"Biology","topic":"Marine Biology"},
  {"name":"Precious Osei","username":"preciouspharma","email":"precious.osei@ariel.bot","subject":"Chemistry","topic":"Pharmacology"},
  {"name":"Mia Andersson","username":"miaenvchem","email":"mia.andersson@ariel.bot","subject":"Chemistry","topic":"Environmental Chemistry"},
  {"name":"Adwoa Asante","username":"adwoalit","email":"adwoa.asante@ariel.bot","subject":"Literature","topic":"African Literature"},
  {"name":"Matteo Romano","username":"matteoart","email":"matteo.romano@ariel.bot","subject":"Art History","topic":"Renaissance & Modern Art"},
  {"name":"Blessing Chukwu","username":"blessingwrite","email":"blessing.chukwu@ariel.bot","subject":"Literature","topic":"Creative Writing"},
  {"name":"Yuki Watanabe","username":"yukicomplit","email":"yuki.watanabe@ariel.bot","subject":"Literature","topic":"Comparative Literature"},
  {"name":"Isabela Costa","username":"isabelaculture","email":"isabela.costa@ariel.bot","subject":"Sociology","topic":"Cultural Studies"},
  {"name":"Patrick Kimani","username":"patrickjourn","email":"patrick.kimani@ariel.bot","subject":"Journalism","topic":"Media & Society"},
  {"name":"Astrid Nilsson","username":"astridmedia","email":"astrid.nilsson@ariel.bot","subject":"Sociology","topic":"Media Studies"},
  {"name":"Tunde Bakare","username":"tundefilm","email":"tunde.bakare@ariel.bot","subject":"Art History","topic":"Film & Cinema"},
  {"name":"Layla Hassan","username":"laylaartphil","email":"layla.hassan@ariel.bot","subject":"Philosophy","topic":"Aesthetics & Art"},
  {"name":"Miriam Osei","username":"miriamsocio","email":"miriam.osei@ariel.bot","subject":"Sociology","topic":"Social Inequality"},
  {"name":"Seun Adesanya","username":"seunstartup","email":"seun.adesanya@ariel.bot","subject":"Business","topic":"Entrepreneurship"},
  {"name":"Ji-Ho Lee","username":"jihomarketing","email":"jiho.lee@ariel.bot","subject":"Business","topic":"Marketing Strategy"},
  {"name":"Amara Traoré","username":"amaraimpact","email":"amara.traore@ariel.bot","subject":"Business","topic":"Social Enterprise"},
  {"name":"Pieter van den Berg","username":"pieterstrat","email":"pieter.vdberg@ariel.bot","subject":"Business","topic":"Corporate Strategy"},
  {"name":"Nneka Obiora","username":"nnekainnov","email":"nneka.obiora@ariel.bot","subject":"Business","topic":"Innovation & Design Thinking"},
  {"name":"Marcus Lindberg","username":"marcuslead","email":"marcus.lindberg@ariel.bot","subject":"Business","topic":"Leadership"},
  {"name":"Fatou Diop","username":"fatousustain","email":"fatou.diop@ariel.bot","subject":"Business","topic":"Sustainable Business"},
  {"name":"Yusuf Mwangi","username":"yusuftech","email":"yusuf.mwangi@ariel.bot","subject":"Business","topic":"Tech Startups & VC"},
  {"name":"Valentina Cruz","username":"valebrand","email":"valentina.cruz@ariel.bot","subject":"Business","topic":"Brand Management"},
  {"name":"Ibrahim Sawadogo","username":"ibrahiminvest","email":"ibrahim.sawadogo@ariel.bot","subject":"Business","topic":"Impact Investment"},
]

async def main():
    client = AsyncIOMotorClient(MONGODB_URL)
    db = client[DB_NAME]
    print(f"Connected to {DB_NAME}")

    # --- Fetch mixed-age photos ---
    print("\nFetching mixed-age profile photos...")
    photos = await fetch_photos(120)

    # --- Get all bot users ---
    bots_by_email = {}
    async for u in db.users.find({"is_bot": True}):
        bots_by_email[u["email"]] = u
    print(f"Found {len(bots_by_email)} bot users")

    bot_ids = [str(u["_id"]) for u in bots_by_email.values()]

    # --- Update profile pictures ---
    if photos:
        print("Updating profile pictures...")
        for i, u in enumerate(bots_by_email.values()):
            pic = photos[i % len(photos)]
            await db.users.update_one({"_id": u["_id"]}, {"$set": {"profile_picture": pic}})

    # --- Delete existing bot cards, decks, comments ---
    print("\nCleaning up old bot content...")
    r1 = await db.cards.delete_many({"user_id": {"$in": bot_ids}})
    r2 = await db.decks.delete_many({"user_id": {"$in": bot_ids}})
    r3 = await db.comments.delete_many({"user_id": {"$in": [u["_id"] for u in bots_by_email.values()]}})
    print(f"  Deleted {r1.deleted_count} cards, {r2.deleted_count} decks, {r3.deleted_count} comments")

    # --- Group personas by subject to avoid card duplication ---
    from collections import defaultdict
    subject_bots = defaultdict(list)  # subject → [persona emails]
    for p in PERSONAS:
        subject_bots[p["subject"]].append(p["email"])

    # Pre-shuffle card pools per subject, then split into non-overlapping chunks
    subject_card_pools = {}
    for subject, cards in CARDS_BY_SUBJECT.items():
        pool = cards.copy()
        random.shuffle(pool)
        subject_card_pools[subject] = pool

    # For each subject, assign non-overlapping card slices to bots
    subject_bot_cards = {}  # email → [cards assigned]
    for subject, emails in subject_bots.items():
        pool = subject_card_pools.get(subject, [])
        n_bots = len(emails)
        if not pool:
            for e in emails:
                subject_bot_cards[e] = []
            continue
        # Assign cards round-robin so each bot gets unique cards
        assignments = [[] for _ in range(n_bots)]
        for i, card in enumerate(pool):
            assignments[i % n_bots].append(card)
        for i, email in enumerate(emails):
            assigned = assignments[i]
            # Each bot gets at least 2 cards, max 5
            if len(assigned) < 2:
                # supplement with cards from other bots' assignments but different question
                extra = [c for c in pool if c not in assigned]
                assigned = assigned + extra[:max(0, 2 - len(assigned))]
            subject_bot_cards[email] = assigned[:5]

    # --- Create cards, decks, collect card references for comments ---
    all_bot_card_ids = []  # (card_oid, bot_oid) pairs for seeding comments
    created_cards = 0
    created_decks = 0

    deck_titles = {
        "Neuroscience": "Memory & the Brain",
        "Medicine": "How Drugs Actually Work",
        "Neurology": "The Wired Brain",
        "Immunology": "Your Body's Defence System",
        "Public Health": "Population Health Essentials",
        "Psychiatry": "Mind, Mood & Medicine",
        "Genetics": "Genes & Editing",
        "Physics": "Quantum & Beyond",
        "Mathematics": "Mathematical Thinking",
        "History": "World History Foundations",
        "Political Science": "Power & Politics",
        "International Relations": "Global Order",
        "Political Philosophy": "Ideas That Run the World",
        "Economics": "Economics You Actually Need",
        "Finance": "Money & Markets",
        "Psychology": "How People Actually Think",
        "Computer Science": "Computing Foundations",
        "Law": "Law & Society",
        "Philosophy": "Big Questions",
        "Biology": "Life at the Molecular Level",
        "Chemistry": "Chemistry That Matters",
        "Literature": "Reading the World",
        "Art History": "Art & Visual Culture",
        "Sociology": "Society & Structure",
        "Journalism": "Media & Truth",
        "Business": "Business Essentials",
    }

    deck_captions = [
        "Sharing my study deck with anyone who needs it 📚",
        "Built this for my revision — might help someone else too",
        "These are the concepts I keep coming back to",
        "Made this on Ariel, still my most-reviewed deck",
        "If you're studying this topic, start here",
        "Took me a while to get these right. Now they're permanent.",
        "The cards that actually show up in exams",
        "Been dueling on these topics all week. Here's what matters.",
        "Study smarter not harder — this is the core of the subject",
        "Pinned these to my Ariel profile for a reason",
    ]

    for persona in PERSONAS:
        email = persona["email"]
        user = bots_by_email.get(email)
        if not user:
            continue

        bot_oid = user["_id"]
        bot_id_str = str(bot_oid)
        username = user.get("username", persona["username"])
        full_name = user.get("full_name", persona["name"])
        profile_pic = user.get("profile_picture", "")
        subject = persona["subject"]
        topic = persona["topic"]

        days_ago = random.randint(10, 180)
        created_at = datetime.utcnow() - timedelta(days=days_ago)

        # Cards
        card_data_list = subject_bot_cards.get(email, [])
        if not card_data_list:
            continue

        card_oids = []
        for cd in card_data_list:
            card_oid = ObjectId()
            card_doc = {
                "_id": card_oid,
                "user_id": bot_id_str,
                "question": cd["q"],
                "answer": cd["a"],
                "explanation": cd.get("e", ""),
                "subject": subject,
                "topic": cd.get("t", topic),
                "tags": [subject.lower(), cd.get("t", topic).lower()],
                "visibility": "public",
                "caption": cd.get("cap", ""),
                "likes": random.randint(5, 280),
                "saves": random.randint(2, 70),
                "review_count": random.randint(0, 45),
                "ease_factor": 2.5,
                "interval": 1,
                "next_review": datetime.utcnow(),
                "last_review": None,
                "liked_by": [],
                "created_at": created_at + timedelta(days=random.randint(0, min(days_ago, 30))),
                "updated_at": created_at,
            }
            await db.cards.insert_one(card_doc)
            card_oids.append(card_oid)
            all_bot_card_ids.append((card_oid, bot_oid))
            created_cards += 1

        # Deck
        deck_title = deck_titles.get(subject, f"{subject} Essentials")
        deck_oid = ObjectId()
        deck_doc = {
            "_id": deck_oid,
            "user_id": bot_id_str,
            "title": deck_title,
            "description": f"Core concepts in {subject} — {topic}",
            "subject": subject,
            "topic": topic,
            "card_ids": [str(oid) for oid in card_oids],
            "card_count": len(card_oids),
            "visibility": "public",
            "tags": [subject.lower()],
            "is_featured": False,
            "likes": random.randint(10, 350),
            "saves": random.randint(5, 90),
            "views": random.randint(50, 1400),
            "comments_count": 0,
            "liked_by": [],
            "saved_by": [],
            "caption": random.choice(deck_captions),
            "cover_image": None,
            "course_code": None,
            "education_level": random.choice(["undergraduate", "postgraduate", "phd"]),
            "created_at": created_at,
            "updated_at": created_at,
            "published_at": created_at,
        }
        await db.decks.insert_one(deck_doc)
        created_decks += 1
        print(f"  [{username}] {len(card_oids)} cards + 1 deck")

    # --- Seed comments (on decks, with ObjectId user_id) ---
    print("\nSeeding comments...")
    all_deck_ids = []
    async for d in db.decks.find({"user_id": {"$in": bot_ids}}, {"_id": 1, "user_id": 1}):
        all_deck_ids.append((d["_id"], d["user_id"]))

    bot_oid_list = [u["_id"] for u in bots_by_email.values()]
    created_comments = 0

    for commenter_bot_oid in bot_oid_list:
        if random.random() > 0.30:  # ~30% of bots comment
            continue
        commenter = next((u for u in bots_by_email.values() if u["_id"] == commenter_bot_oid), None)
        if not commenter:
            continue

        # Comment on 1-2 decks that don't belong to this bot
        eligible_decks = [(did, uid) for did, uid in all_deck_ids if uid != str(commenter_bot_oid)]
        if not eligible_decks:
            continue

        targets = random.sample(eligible_decks, min(random.randint(1, 2), len(eligible_decks)))
        for deck_oid, _ in targets:
            deck_id_str = str(deck_oid)
            comment_doc = {
                "_id": ObjectId(),
                "deck_id": deck_id_str,
                "user_id": commenter_bot_oid,          # ObjectId — matches users._id type
                "content": random.choice(COMMENT_POOL),
                "parent_comment_id": None,
                "likes": random.randint(0, 18),
                "liked_by": [],
                "is_deleted": False,
                "is_edited": False,
                "created_at": datetime.utcnow() - timedelta(days=random.randint(1, 30)),
                "updated_at": datetime.utcnow() - timedelta(days=random.randint(0, 5)),
            }
            await db.comments.insert_one(comment_doc)
            # Update deck's comment count
            await db.decks.update_one({"_id": deck_oid}, {"$inc": {"comments_count": 1}})
            created_comments += 1

    print(f"\nDone.")
    print(f"  Cards: {created_cards}")
    print(f"  Decks: {created_decks}")
    print(f"  Comments: {created_comments}")
    client.close()

asyncio.run(main())

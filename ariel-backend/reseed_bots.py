"""
Reseed bot cards, decks, and comments (bots must already exist in DB).
Run: MONGODB_URL=<url> DATABASE_NAME=ariel python3 reseed_bots.py
"""
import asyncio, os, random
from datetime import datetime, timedelta
from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId

MONGODB_URL = os.environ.get("MONGODB_URL", "mongodb://localhost:27017")
DB_NAME = os.environ.get("DATABASE_NAME", "ariel")

PERSONAS = [
  {"name":"Amara Osei","username":"amaraneuro","email":"amara.osei@ariel.bot","subject":"Neuroscience","topic":"Memory & Learning","img":1},
  {"name":"Isabella Ferreira","username":"bellamed","email":"isabella.ferreira@ariel.bot","subject":"Medicine","topic":"Pharmacology","img":2},
  {"name":"Ravi Krishnamurthy","username":"ravipharma","email":"ravi.krish@ariel.bot","subject":"Medicine","topic":"Drug Mechanisms","img":3},
  {"name":"Nadia Al-Hassan","username":"nadiapsych","email":"nadia.alhassan@ariel.bot","subject":"Psychiatry","topic":"Mental Health","img":4},
  {"name":"Luca Marchetti","username":"lucaneuro","email":"luca.marchetti@ariel.bot","subject":"Neurology","topic":"Neuroplasticity","img":5},
  {"name":"Yuki Tanaka","username":"yukiimmuno","email":"yuki.tanaka@ariel.bot","subject":"Immunology","topic":"Autoimmune Disease","img":6},
  {"name":"Fatima Benali","username":"fatimahealth","email":"fatima.benali@ariel.bot","subject":"Public Health","topic":"Epidemiology","img":7},
  {"name":"Marcus Thompson","username":"marcuscardio","email":"marcus.thompson@ariel.bot","subject":"Medicine","topic":"Cardiology","img":8},
  {"name":"Anya Petrov","username":"anyagenetics","email":"anya.petrov@ariel.bot","subject":"Genetics","topic":"CRISPR & Gene Editing","img":9},
  {"name":"James Okafor","username":"jamessurgery","email":"james.okafor@ariel.bot","subject":"Medicine","topic":"Surgery","img":10},
  {"name":"Erik Lindström","username":"erikphysics","email":"erik.lindstrom@ariel.bot","subject":"Physics","topic":"Quantum Mechanics","img":11},
  {"name":"Priya Sharma","username":"priyaquantum","email":"priya.sharma@ariel.bot","subject":"Physics","topic":"Quantum Computing","img":12},
  {"name":"Carlos Mendoza","username":"carlosmath","email":"carlos.mendoza@ariel.bot","subject":"Mathematics","topic":"Number Theory","img":13},
  {"name":"Liu Wei","username":"liuastro","email":"liu.wei@ariel.bot","subject":"Physics","topic":"Astrophysics","img":14},
  {"name":"Zara Ahmed","username":"zaraapplied","email":"zara.ahmed@ariel.bot","subject":"Mathematics","topic":"Linear Algebra","img":15},
  {"name":"Thomas Müller","username":"thomasparticle","email":"thomas.muller@ariel.bot","subject":"Physics","topic":"Particle Physics","img":16},
  {"name":"Keiko Yamamoto","username":"keikostats","email":"keiko.yamamoto@ariel.bot","subject":"Mathematics","topic":"Statistics & Probability","img":17},
  {"name":"Adebayo Adeyemi","username":"bayomath","email":"adebayo.adeyemi@ariel.bot","subject":"Mathematics","topic":"Topology","img":18},
  {"name":"Sophie Dubois","username":"sophiecosmos","email":"sophie.dubois@ariel.bot","subject":"Physics","topic":"Cosmology","img":19},
  {"name":"Andrei Volkov","username":"andreinumbers","email":"andrei.volkov@ariel.bot","subject":"Mathematics","topic":"Calculus","img":20},
  {"name":"Chioma Eze","username":"chiomahistory","email":"chioma.eze@ariel.bot","subject":"History","topic":"African History","img":21},
  {"name":"Omar Khaled","username":"omarmideast","email":"omar.khaled@ariel.bot","subject":"Political Science","topic":"Middle Eastern Politics","img":22},
  {"name":"Victoria Novak","username":"viceurohist","email":"victoria.novak@ariel.bot","subject":"History","topic":"European History","img":23},
  {"name":"Samuel Odhiambo","username":"sampolisci","email":"samuel.odhiambo@ariel.bot","subject":"Political Science","topic":"African Politics","img":24},
  {"name":"Mei Lin","username":"meiintrel","email":"mei.lin@ariel.bot","subject":"International Relations","topic":"China & Global Order","img":25},
  {"name":"Rafael Santos","username":"rafalatam","email":"rafael.santos@ariel.bot","subject":"Political Science","topic":"Latin American Politics","img":26},
  {"name":"Ingrid Larsen","username":"ingridpolphil","email":"ingrid.larsen@ariel.bot","subject":"Political Philosophy","topic":"Democracy & Governance","img":27},
  {"name":"Kwame Asante","username":"kwamepan","email":"kwame.asante@ariel.bot","subject":"History","topic":"Pan-Africanism","img":28},
  {"name":"Leila Moradi","username":"leilageo","email":"leila.moradi@ariel.bot","subject":"Political Science","topic":"Geopolitics","img":29},
  {"name":"Benjamin Cohen","username":"benconflict","email":"benjamin.cohen@ariel.bot","subject":"Political Science","topic":"Conflict & Peace Studies","img":30},
  {"name":"Aisha Diallo","username":"aishadeveco","email":"aisha.diallo@ariel.bot","subject":"Economics","topic":"Development Economics","img":31},
  {"name":"Henrik Johansson","username":"henrikbeheco","email":"henrik.johansson@ariel.bot","subject":"Economics","topic":"Behavioral Economics","img":32},
  {"name":"Priscilla Mensah","username":"priscyfinance","email":"priscilla.mensah@ariel.bot","subject":"Finance","topic":"Financial Markets","img":33},
  {"name":"David Kim","username":"davidmacro","email":"david.kim@ariel.bot","subject":"Economics","topic":"Macroeconomics","img":34},
  {"name":"Mariam Toure","username":"mariammicro","email":"mariam.toure@ariel.bot","subject":"Economics","topic":"Microeconomics","img":35},
  {"name":"Alex Petridis","username":"alexeconhist","email":"alex.petridis@ariel.bot","subject":"Economics","topic":"Economic History","img":36},
  {"name":"Nkechi Onyeka","username":"nkechimarkets","email":"nkechi.onyeka@ariel.bot","subject":"Finance","topic":"Investment & Valuation","img":37},
  {"name":"Tobias Weber","username":"tobiasmonetary","email":"tobias.weber@ariel.bot","subject":"Economics","topic":"Monetary Policy","img":38},
  {"name":"Camila Reyes","username":"camitrade","email":"camila.reyes@ariel.bot","subject":"Economics","topic":"International Trade","img":39},
  {"name":"Haruto Sato","username":"harutocorp","email":"haruto.sato@ariel.bot","subject":"Finance","topic":"Corporate Finance","img":40},
  {"name":"Zoe Andersen","username":"zoecog","email":"zoe.andersen@ariel.bot","subject":"Psychology","topic":"Cognitive Psychology","img":41},
  {"name":"Kofi Boateng","username":"kofisocial","email":"kofi.boateng@ariel.bot","subject":"Psychology","topic":"Social Psychology","img":42},
  {"name":"Emma Walsh","username":"emmaclinical","email":"emma.walsh@ariel.bot","subject":"Psychology","topic":"Clinical Psychology","img":43},
  {"name":"Arjun Nair","username":"arjunneuro","email":"arjun.nair@ariel.bot","subject":"Psychology","topic":"Neuropsychology","img":44},
  {"name":"Maria Santos","username":"mariaedu","email":"maria.santos@ariel.bot","subject":"Psychology","topic":"Educational Psychology","img":45},
  {"name":"Noah Bergström","username":"noahevo","email":"noah.bergstrom@ariel.bot","subject":"Psychology","topic":"Evolutionary Psychology","img":46},
  {"name":"Amina Coulibaly","username":"aminadev","email":"amina.coulibaly@ariel.bot","subject":"Psychology","topic":"Developmental Psychology","img":47},
  {"name":"Jake Morrison","username":"jakesports","email":"jake.morrison@ariel.bot","subject":"Psychology","topic":"Sports Psychology","img":48},
  {"name":"Yuna Park","username":"yunapositive","email":"yuna.park@ariel.bot","subject":"Psychology","topic":"Positive Psychology","img":49},
  {"name":"Diana Popescu","username":"dianatrauma","email":"diana.popescu@ariel.bot","subject":"Psychology","topic":"Trauma & Resilience","img":50},
  {"name":"Tariq Al-Rashid","username":"tariqml","email":"tariq.alrashid@ariel.bot","subject":"Computer Science","topic":"Machine Learning","img":51},
  {"name":"Aiko Suzuki","username":"aikocv","email":"aiko.suzuki@ariel.bot","subject":"Computer Science","topic":"Computer Vision","img":52},
  {"name":"Felix Osei","username":"felixcyber","email":"felix.osei@ariel.bot","subject":"Computer Science","topic":"Cybersecurity","img":53},
  {"name":"Natasha Ivanova","username":"natashasys","email":"natasha.ivanova@ariel.bot","subject":"Computer Science","topic":"Distributed Systems","img":54},
  {"name":"Raj Patel","username":"rajaiethics","email":"raj.patel@ariel.bot","subject":"Computer Science","topic":"AI Ethics","img":55},
  {"name":"Chloé Martin","username":"chloehci","email":"chloe.martin@ariel.bot","subject":"Computer Science","topic":"Human-Computer Interaction","img":56},
  {"name":"Emeka Nwosu","username":"emekablockchain","email":"emeka.nwosu@ariel.bot","subject":"Computer Science","topic":"Blockchain & Web3","img":57},
  {"name":"Lars Hansen","username":"larsquantum","email":"lars.hansen@ariel.bot","subject":"Computer Science","topic":"Quantum Algorithms","img":58},
  {"name":"Seo-Yeon Choi","username":"seoyeonnlp","email":"seoyeon.choi@ariel.bot","subject":"Computer Science","topic":"Natural Language Processing","img":59},
  {"name":"Gabriel Moreau","username":"gabrielrobots","email":"gabriel.moreau@ariel.bot","subject":"Computer Science","topic":"Robotics & Automation","img":60},
  {"name":"Chidinma Obi","username":"chidilaw","email":"chidinma.obi@ariel.bot","subject":"Law","topic":"Constitutional Law","img":61},
  {"name":"Antoine Leclerc","username":"antoinephil","email":"antoine.leclerc@ariel.bot","subject":"Philosophy","topic":"Philosophy of Mind","img":62},
  {"name":"Zanele Dlamini","username":"zanelerights","email":"zanele.dlamini@ariel.bot","subject":"Law","topic":"Human Rights Law","img":63},
  {"name":"Hiroshi Nakamura","username":"hiroshilegal","email":"hiroshi.nakamura@ariel.bot","subject":"Law","topic":"Legal Philosophy","img":64},
  {"name":"Beatriz Alves","username":"beaintlaw","email":"beatriz.alves@ariel.bot","subject":"Law","topic":"International Law","img":65},
  {"name":"Elias Mensah","username":"eliascriminal","email":"elias.mensah@ariel.bot","subject":"Law","topic":"Criminal Justice","img":66},
  {"name":"Simone Russo","username":"simoneethics","email":"simone.russo@ariel.bot","subject":"Philosophy","topic":"Ethics & Moral Philosophy","img":67},
  {"name":"Adaeze Nwosu","username":"adaezecorp","email":"adaeze.nwosu@ariel.bot","subject":"Law","topic":"Corporate Law","img":68},
  {"name":"Viktor Sokolov","username":"viktorpolphil","email":"viktor.sokolov@ariel.bot","subject":"Philosophy","topic":"Political Philosophy","img":69},
  {"name":"Grace Wanjiru","username":"graceenvlaw","email":"grace.wanjiru@ariel.bot","subject":"Law","topic":"Environmental Law","img":70},
  {"name":"Femi Adeyemi","username":"femimolbio","email":"femi.adeyemi@ariel.bot","subject":"Biology","topic":"Molecular Biology","img":11},
  {"name":"Chen Xiao","username":"chenbiochem","email":"chen.xiao@ariel.bot","subject":"Chemistry","topic":"Biochemistry","img":12},
  {"name":"Lena Fischer","username":"lenaeco","email":"lena.fischer@ariel.bot","subject":"Biology","topic":"Ecology","img":13},
  {"name":"Oluwaseun Adeleke","username":"seunmicro","email":"seun.adeleke@ariel.bot","subject":"Biology","topic":"Microbiology","img":14},
  {"name":"Ana Gutierrez","username":"anaorgo","email":"ana.gutierrez@ariel.bot","subject":"Chemistry","topic":"Organic Chemistry","img":15},
  {"name":"Kweku Mensah","username":"kwekugene","email":"kweku.mensah@ariel.bot","subject":"Biology","topic":"Genetics","img":16},
  {"name":"Hana Novak","username":"hanacell","email":"hana.novak@ariel.bot","subject":"Biology","topic":"Cell Biology","img":17},
  {"name":"Diego Torres","username":"diegomarine","email":"diego.torres@ariel.bot","subject":"Biology","topic":"Marine Biology","img":18},
  {"name":"Precious Osei","username":"preciouspharma","email":"precious.osei@ariel.bot","subject":"Chemistry","topic":"Pharmacology","img":19},
  {"name":"Mia Andersson","username":"miaenvchem","email":"mia.andersson@ariel.bot","subject":"Chemistry","topic":"Environmental Chemistry","img":20},
  {"name":"Adwoa Asante","username":"adwoalit","email":"adwoa.asante@ariel.bot","subject":"Literature","topic":"African Literature","img":21},
  {"name":"Matteo Romano","username":"matteoart","email":"matteo.romano@ariel.bot","subject":"Art History","topic":"Renaissance & Modern Art","img":22},
  {"name":"Blessing Chukwu","username":"blessingwrite","email":"blessing.chukwu@ariel.bot","subject":"Literature","topic":"Creative Writing","img":23},
  {"name":"Yuki Watanabe","username":"yukicomplit","email":"yuki.watanabe@ariel.bot","subject":"Literature","topic":"Comparative Literature","img":24},
  {"name":"Isabela Costa","username":"isabelaculture","email":"isabela.costa@ariel.bot","subject":"Sociology","topic":"Cultural Studies","img":25},
  {"name":"Patrick Kimani","username":"patrickjourn","email":"patrick.kimani@ariel.bot","subject":"Journalism","topic":"Media & Society","img":26},
  {"name":"Astrid Nilsson","username":"astridmedia","email":"astrid.nilsson@ariel.bot","subject":"Sociology","topic":"Media Studies","img":27},
  {"name":"Tunde Bakare","username":"tundefilm","email":"tunde.bakare@ariel.bot","subject":"Art History","topic":"Film & Cinema","img":28},
  {"name":"Layla Hassan","username":"laylaartphil","email":"layla.hassan@ariel.bot","subject":"Philosophy","topic":"Aesthetics & Art","img":29},
  {"name":"Miriam Osei","username":"miriamsocio","email":"miriam.osei@ariel.bot","subject":"Sociology","topic":"Social Inequality","img":30},
  {"name":"Seun Adesanya","username":"seunstartup","email":"seun.adesanya@ariel.bot","subject":"Business","topic":"Entrepreneurship","img":31},
  {"name":"Ji-Ho Lee","username":"jihomarketing","email":"jiho.lee@ariel.bot","subject":"Business","topic":"Marketing Strategy","img":32},
  {"name":"Amara Traoré","username":"amaraimpact","email":"amara.traore@ariel.bot","subject":"Business","topic":"Social Enterprise","img":33},
  {"name":"Pieter van den Berg","username":"pieterstrat","email":"pieter.vdberg@ariel.bot","subject":"Business","topic":"Corporate Strategy","img":34},
  {"name":"Nneka Obiora","username":"nnekainnov","email":"nneka.obiora@ariel.bot","subject":"Business","topic":"Innovation & Design Thinking","img":35},
  {"name":"Marcus Lindberg","username":"marcuslead","email":"marcus.lindberg@ariel.bot","subject":"Business","topic":"Leadership","img":36},
  {"name":"Fatou Diop","username":"fatousustain","email":"fatou.diop@ariel.bot","subject":"Business","topic":"Sustainable Business","img":37},
  {"name":"Yusuf Mwangi","username":"yusuftech","email":"yusuf.mwangi@ariel.bot","subject":"Business","topic":"Tech Startups & VC","img":38},
  {"name":"Valentina Cruz","username":"valebrand","email":"valentina.cruz@ariel.bot","subject":"Business","topic":"Brand Management","img":39},
  {"name":"Ibrahim Sawadogo","username":"ibrahiminvest","email":"ibrahim.sawadogo@ariel.bot","subject":"Business","topic":"Impact Investment","img":40},
]

# ---------------------------------------------------------------------------
# CARD CONTENT BY SUBJECT
# ---------------------------------------------------------------------------
CARDS_BY_SUBJECT = {
  "Neuroscience": [
    {"question": "What is long-term potentiation?",
     "answer": "LTP is the lasting strengthening of synapses when neurons fire together repeatedly. NMDA receptors open, calcium floods in, and new AMPA receptors are inserted — making the synapse stronger. This is the cellular basis of how we form memories.",
     "explanation": "Hebb's rule in action: neurons that fire together, wire together.",
     "topic": "Memory & Learning",
     "caption": "Lost a duel on this last night and it was embarrassing 😅 brushing up"},
    {"question": "What role does the hippocampus play in memory formation?",
     "answer": "The hippocampus is critical for converting short-term memories into long-term ones — a process called memory consolidation. It binds together information from different cortical regions into a unified memory trace. Damage to it (as in amnesia patient H.M.) leaves procedural memory intact but destroys the ability to form new declarative memories.",
     "explanation": "The hippocampus is the brain's index, not its storage — memories ultimately live in cortex.",
     "topic": "Memory & Learning",
     "caption": "H.M. is one of the most important case studies in all of neuroscience. Worth knowing cold."},
    {"question": "What is the difference between declarative and procedural memory?",
     "answer": "Declarative memory stores facts and events that you can consciously recall, like what you had for breakfast or the date of a historical event. Procedural memory stores skills and habits — riding a bike, typing — that operate below conscious awareness. They rely on different brain systems: hippocampus for declarative, basal ganglia and cerebellum for procedural.",
     "explanation": "This split explains why someone with amnesia can still learn to play piano but not remember the lesson.",
     "topic": "Memory & Learning",
     "caption": "Been drilling this on Ariel all week 🔥 the distinction finally clicked"},
    {"question": "How does sleep contribute to memory consolidation?",
     "answer": "During slow-wave sleep, the hippocampus replays recent experiences and transfers them to the neocortex for long-term storage. REM sleep then seems to integrate new memories with existing knowledge and emotional context. Skipping sleep after learning significantly impairs how well you retain information.",
     "explanation": "Sleep is not passive rest — it's when your brain does the actual filing.",
     "topic": "Memory & Learning",
     "caption": "Pulling an all-nighter before an exam is literally sabotaging your own consolidation. Don't do it."},
    {"question": "What is the role of dopamine in learning and reward?",
     "answer": "Dopamine signals prediction error — the gap between an expected and actual reward. When something is better than expected, dopamine neurons fire strongly, reinforcing the behavior. When worse than expected, they pause, weakening the connection. This system is how the brain learns from experience and drives motivated behavior.",
     "explanation": "Dopamine isn't about pleasure itself — it's about learning what predicts pleasure.",
     "topic": "Memory & Learning",
     "caption": "Every time you check your phone and get a notification, dopamine is doing exactly this. Scary and fascinating."},
  ],

  "Medicine": [
    {"question": "How do beta-blockers work?",
     "answer": "Beta-blockers competitively antagonize catecholamines (epinephrine, norepinephrine) at beta-adrenergic receptors. By blocking beta-1 receptors in the heart, they reduce heart rate and contractility, lowering cardiac output and blood pressure. Beta-2 blockade also reduces bronchodilation, which is why they're contraindicated in asthma.",
     "explanation": "Understanding receptor selectivity is key — cardioselective beta-blockers (metoprolol) target beta-1 to spare the lungs.",
     "topic": "Pharmacology",
     "caption": "Made this deck for anyone cramming pharmacology — the receptor logic makes everything else make sense"},
    {"question": "What is the mechanism of action of ACE inhibitors?",
     "answer": "ACE inhibitors block angiotensin-converting enzyme, preventing the conversion of angiotensin I to angiotensin II. This reduces vasoconstriction and aldosterone secretion, lowering blood pressure and reducing fluid retention. They also decrease bradykinin breakdown, which explains the classic dry cough side effect.",
     "explanation": "They're first-line in hypertension with diabetes because they also reduce proteinuria — two birds, one drug.",
     "topic": "Drug Mechanisms",
     "caption": "The bradykinin connection is the detail that makes the side effect profile suddenly make sense 🧠"},
    {"question": "What is the difference between ischemic and hemorrhagic stroke?",
     "answer": "Ischemic stroke results from a blocked artery — either a clot that forms locally (thrombotic) or travels from elsewhere (embolic) — depriving brain tissue of oxygen. Hemorrhagic stroke results from a ruptured vessel, causing blood to leak into or around the brain. Ischemic strokes are more common (about 87%) but hemorrhagic strokes carry higher early mortality.",
     "explanation": "Treatment is opposite for each — clot-busting drugs for ischemic, potentially dangerous in hemorrhagic.",
     "topic": "Cardiology",
     "caption": "This distinction matters enormously in an emergency. You treat them completely differently."},
    {"question": "What are the phases of wound healing?",
     "answer": "Wound healing proceeds through four overlapping phases: hemostasis (clotting within minutes), inflammation (neutrophils and macrophages clearing debris over days), proliferation (fibroblasts lay down collagen and new vessels form over weeks), and remodeling (collagen reorganizes and scar matures over months to years). Each phase is tightly regulated by growth factors and cytokines.",
     "explanation": "Chronic wounds like diabetic ulcers get stuck in the inflammatory phase — understanding this guides treatment.",
     "topic": "Surgery",
     "caption": "My Ariel streak depends on these cards lol finally got the phases in order"},
    {"question": "What is the Frank-Starling mechanism?",
     "answer": "The Frank-Starling law states that the heart's stroke volume increases when ventricular filling (preload) increases — within physiological limits. Stretching cardiac muscle sarcomeres increases their sensitivity to calcium, generating a stronger contraction. This allows the heart to automatically match output to venous return without needing neural input.",
     "explanation": "It's the heart's intrinsic way of equalizing left and right output beat by beat.",
     "topic": "Cardiology",
     "caption": "Elegant mechanism. The heart self-regulates at a cellular level without waiting for your nervous system."},
  ],

  "Neurology": [
    {"question": "What is neuroplasticity?",
     "answer": "Neuroplasticity is the brain's ability to reorganize itself by forming new synaptic connections throughout life. After injury, neighboring neurons can take over functions of damaged areas — a process called cortical remapping. It also underlies all learning and skill acquisition.",
     "explanation": "The brain is not hardwired — experience and injury both continuously reshape its architecture.",
     "topic": "Neuroplasticity",
     "caption": "This is why rehabilitation after stroke actually works. The brain literally rewires itself."},
    {"question": "How does the blood-brain barrier work?",
     "answer": "The BBB is formed by tight junctions between endothelial cells lining brain capillaries, supported by astrocyte end-feet. It blocks most large or charged molecules while allowing glucose and small lipid-soluble substances through. This protects the brain from pathogens and toxins but also makes CNS drug delivery extremely difficult.",
     "explanation": "Why most CNS drugs fail in clinical trials — getting past the BBB is the first hurdle.",
     "topic": "Neuroplasticity",
     "caption": "Drug delivery to the brain is one of the hardest problems in medicine. The BBB is a genius design we're still trying to outsmart."},
    {"question": "What distinguishes upper and lower motor neuron lesions?",
     "answer": "Upper motor neuron (UMN) lesions — above the anterior horn — produce spasticity, hyperreflexia, and an upgoing Babinski sign with minimal muscle wasting. Lower motor neuron (LMN) lesions — at the anterior horn or below — cause flaccidity, hyporeflexia, fasciculations, and rapid muscle atrophy. The pattern tells you exactly where in the nervous system the damage is.",
     "explanation": "UMN releases the brakes on spinal circuits; LMN is the final common pathway — lose it and movement stops.",
     "topic": "Neuroplasticity",
     "caption": "Classic exam territory but also genuinely useful in clinical practice. The contrast is clean once you understand it."},
    {"question": "What is the pathophysiology of Parkinson's disease?",
     "answer": "Parkinson's results from the degeneration of dopaminergic neurons in the substantia nigra pars compacta, reducing dopamine input to the striatum. This disrupts the basal ganglia circuit, leading to the cardinal features: resting tremor, rigidity, bradykinesia, and postural instability. Lewy bodies — aggregates of alpha-synuclein — are the pathological hallmark.",
     "explanation": "Dopamine loss tips the basal ganglia balance toward inhibition of movement — hence the slowness and freezing.",
     "topic": "Neuroplasticity",
     "caption": "Been struggling with the basal ganglia circuit for months. Ariel duels finally made it stick 💀"},
  ],

  "Immunology": [
    {"question": "What is the difference between innate and adaptive immunity?",
     "answer": "Innate immunity is the fast, non-specific first line of defense — pattern recognition receptors (like Toll-like receptors) detect conserved microbial features and trigger immediate inflammation. Adaptive immunity is slower but highly specific, generating T and B cells that recognize particular antigens and form immunological memory. The two systems talk constantly — innate signals instruct adaptive responses.",
     "explanation": "Innate buys time; adaptive finishes the job and remembers for next time.",
     "topic": "Autoimmune Disease",
     "caption": "The handoff between innate and adaptive is where a lot of autoimmune pathology lives. Worth understanding deeply."},
    {"question": "How do autoimmune diseases arise?",
     "answer": "Autoimmunity occurs when central or peripheral tolerance mechanisms fail, allowing self-reactive T or B cells to survive and attack host tissue. Central tolerance (thymic deletion and receptor editing in bone marrow) eliminates most self-reactive cells, but peripheral mechanisms — regulatory T cells, anergy, and deletion — handle escapees. Triggers like infections can break tolerance through molecular mimicry or bystander activation.",
     "explanation": "The immune system walks a constant tightrope between killing pathogens and not destroying self.",
     "topic": "Autoimmune Disease",
     "caption": "Molecular mimicry is wild — your own immune system gets fooled by a pathogen into attacking you 😤"},
    {"question": "What is the role of regulatory T cells (Tregs)?",
     "answer": "Tregs are a subset of CD4+ T cells that express the transcription factor FoxP3 and suppress immune responses to prevent autoimmunity. They work by secreting inhibitory cytokines (IL-10, TGF-beta) and by direct cell-to-cell contact. Their failure is central to conditions like type 1 diabetes, multiple sclerosis, and inflammatory bowel disease.",
     "explanation": "Tregs are the peacekeepers — remove them, and the immune system attacks everything.",
     "topic": "Autoimmune Disease",
     "caption": "saving this"},
    {"question": "How do monoclonal antibodies work therapeutically?",
     "answer": "Monoclonal antibodies (mAbs) are engineered to bind a single specific target — a receptor, cytokine, or cell-surface protein. They can block signaling (like anti-TNF in rheumatoid arthritis), recruit immune cells to kill targets (like rituximab depleting CD20+ B cells), or deliver drugs directly to diseased cells. Their specificity reduces off-target toxicity compared to small-molecule drugs.",
     "explanation": "The suffix tells you a lot: -mab = monoclonal antibody, -zumab = humanized, -umab = fully human.",
     "topic": "Autoimmune Disease",
     "caption": "The naming convention is a cheat code for pharmacology exams. Once you know it, you know it."},
  ],

  "Public Health": [
    {"question": "What is the basic reproduction number (R0)?",
     "answer": "R0 is the average number of secondary infections one case generates in a completely susceptible population. An R0 above 1 means an epidemic will grow; below 1 it will die out. R0 depends on the transmission rate, contact rate, and infectious period — not a fixed property of a pathogen but a function of pathogen and environment together.",
     "explanation": "R0 above 1 is why public health measures focus on reducing contacts — you're trying to push effective R below 1.",
     "topic": "Epidemiology",
     "caption": "COVID made R0 a household word. But most people still get what it actually means wrong."},
    {"question": "What is herd immunity and how is it achieved?",
     "answer": "Herd immunity occurs when enough of a population is immune that a pathogen can no longer spread efficiently, protecting even unvaccinated individuals. The threshold is 1 - 1/R0: for measles (R0 ~15), you need about 93% immunity. It can be reached through vaccination or prior infection, though natural infection comes with much higher cost.",
     "explanation": "Herd immunity protects the people who can't be vaccinated — the immunocompromised and newborns — which is why vaccine hesitancy has collective consequences.",
     "topic": "Epidemiology",
     "caption": "The math behind why 95% vaccination coverage matters for measles. Not arbitrary — it's derived from R0."},
    {"question": "What is the difference between incidence and prevalence?",
     "answer": "Incidence measures the rate of new cases in a population over a defined time period — it captures how fast a disease is spreading. Prevalence measures all existing cases (new and old) at a given point or period — it captures the total burden. For chronic diseases, prevalence greatly exceeds incidence because patients accumulate over time.",
     "explanation": "Incidence tells you about cause; prevalence tells you about burden — they answer different policy questions.",
     "topic": "Epidemiology",
     "caption": "Got this wrong on a practice exam and it cost me 😤 never again"},
    {"question": "What is a confounding variable in epidemiology?",
     "answer": "A confounder is a variable associated with both the exposure and the outcome that distorts the apparent relationship between them. A classic example: coffee drinkers also tend to smoke, so early studies showed coffee correlated with lung cancer — but smoking was the real cause. Randomization in clinical trials and statistical adjustment in observational studies are the main tools for controlling confounders.",
     "explanation": "Correlation without confounder control is just a coincidence with a p-value.",
     "topic": "Epidemiology",
     "caption": "This is why \"studies show\" headlines need to be read carefully. Was confounding controlled for?"},
  ],

  "Genetics": [
    {"question": "How does CRISPR-Cas9 gene editing work?",
     "answer": "CRISPR-Cas9 uses a guide RNA (gRNA) to direct the Cas9 protein to a precise DNA sequence, where it makes a double-strand break. The cell repairs this break either by non-homologous end joining (NHEJ), which often disrupts the gene, or homology-directed repair (HDR) using a provided template, which can insert a desired sequence. This gives researchers (and increasingly clinicians) precise control over the genome.",
     "explanation": "CRISPR is cheap, fast, and programmable — it democratized genetic engineering almost overnight.",
     "topic": "CRISPR & Gene Editing",
     "caption": "The elegance of repurposing a bacterial immune system to edit human DNA still gets me every time."},
    {"question": "What is epigenetics?",
     "answer": "Epigenetics refers to heritable changes in gene expression that don't alter the DNA sequence itself. Key mechanisms include DNA methylation (usually silencing genes), histone modification (acetylation activates, methylation can activate or repress), and non-coding RNA regulation. These marks can be influenced by environment, diet, and stress — and some are passed to offspring.",
     "explanation": "Epigenetics is how your cells, all with the same DNA, become a neuron or a liver cell.",
     "topic": "CRISPR & Gene Editing",
     "caption": "Been drilling this on Ariel all week — epigenetics is one of those topics that keeps getting bigger the more you learn"},
    {"question": "What is incomplete penetrance in genetics?",
     "answer": "Penetrance refers to the proportion of individuals with a given genotype who actually show the associated phenotype. Incomplete penetrance means that not everyone carrying a disease-causing variant will develop the disease. BRCA1 mutations cause breast cancer in about 70% of carriers — the remaining 30% carry the mutation but never develop the disease, due to modifying genes and environmental factors.",
     "explanation": "It's why genetic test results require careful interpretation — genotype doesn't always equal destiny.",
     "topic": "CRISPR & Gene Editing",
     "caption": "This is why genetic counseling exists. A positive result is not a guaranteed outcome."},
    {"question": "What is the difference between germline and somatic gene editing?",
     "answer": "Somatic gene editing modifies cells in a living patient — the changes affect only that individual and are not heritable. Germline editing modifies embryos, eggs, or sperm — changes are inherited by all descendants. Somatic editing (like the sickle-cell CRISPR treatments) is now in clinical use; germline editing remains highly controversial and largely banned due to unknown intergenerational risks.",
     "explanation": "Germline editing is the line most scientists agree we shouldn't cross yet — the ethics haven't caught up to the technology.",
     "topic": "CRISPR & Gene Editing",
     "caption": "He Jiankui crossed this line in 2018 and is now in prison. The story is a masterclass in scientific ethics gone wrong."},
  ],

  "Psychiatry": [
    {"question": "What is the monoamine hypothesis of depression?",
     "answer": "The monoamine hypothesis proposes that depression results from deficient activity of serotonin, norepinephrine, and/or dopamine in the brain. Most antidepressants (SSRIs, SNRIs, MAOIs) work by increasing monoamine availability. However, the hypothesis is now considered incomplete — antidepressants boost monoamines within hours but take weeks to work, suggesting downstream neuroplasticity changes are the real mechanism.",
     "explanation": "The simplest story about depression is probably wrong — but it gave us useful drugs anyway.",
     "topic": "Mental Health",
     "caption": "The delay paradox in antidepressants was what first made me question the monoamine story. Still no complete answer."},
    {"question": "What distinguishes bipolar I from bipolar II disorder?",
     "answer": "Bipolar I requires at least one full manic episode — lasting at least 7 days, causing significant impairment, often requiring hospitalization. Bipolar II involves hypomanic episodes (less severe, not impairing) and major depressive episodes, but never full mania. Both involve depression, but the distinction matters for treatment: antidepressants alone can trigger mania in bipolar I.",
     "explanation": "Misdiagnosis is common — bipolar II often looks like recurrent depression until a hypomanic episode is identified.",
     "topic": "Mental Health",
     "caption": "Misdiagnosis rates for bipolar II are surprisingly high. The hypomanic episodes often feel good, so patients don't report them."},
    {"question": "What is cognitive behavioral therapy (CBT) and what does it treat?",
     "answer": "CBT is a structured psychotherapy that targets the relationship between thoughts, feelings, and behaviors. It teaches patients to identify distorted thought patterns (like catastrophizing or black-and-white thinking) and replace them with more balanced alternatives, while using behavioral techniques to break avoidance cycles. It has strong evidence for depression, anxiety disorders, OCD, PTSD, eating disorders, and insomnia.",
     "explanation": "CBT's power is in making implicit thought patterns explicit and teachable — it's essentially metacognition training.",
     "topic": "Mental Health",
     "caption": "CBT is one of the most evidence-based interventions in all of psychiatry. Should be talked about more."},
    {"question": "What is the neurobiological basis of PTSD?",
     "answer": "PTSD involves dysregulation of the fear circuit: the amygdala becomes hyperreactive to threat cues, the prefrontal cortex (which normally dampens amygdala responses) loses inhibitory control, and the hippocampus shows reduced volume — impairing context processing. This explains why PTSD patients react as if the trauma is still happening, unable to place the memory safely in the past.",
     "explanation": "PTSD is a memory disorder as much as a fear disorder — the hippocampus fails to contextualize the threat as over.",
     "topic": "Mental Health",
     "caption": "Understanding the neurobiology completely changed how I think about trauma treatment. This stuff matters."},
  ],

  "Physics": [
    {"question": "What is wave-particle duality?",
     "answer": "Wave-particle duality is the principle that quantum objects like electrons and photons exhibit both wave-like and particle-like properties depending on how they are measured. The double-slit experiment demonstrates this: electrons fired one at a time still produce an interference pattern (wave behavior), but when you measure which slit they pass through, the pattern disappears (particle behavior). Observation collapses the wave function.",
     "explanation": "The act of measurement isn't passive in quantum mechanics — it fundamentally changes the system.",
     "topic": "Quantum Mechanics",
     "caption": "The double slit experiment should be required viewing for every human being. Nothing will shake your intuitions more."},
    {"question": "What is quantum entanglement?",
     "answer": "Entanglement is a correlation between quantum particles such that measuring one instantly determines the state of the other, regardless of distance. Einstein called it 'spooky action at a distance' and thought it proved QM was incomplete. Bell's theorem and subsequent experiments proved the correlations are real and cannot be explained by hidden local variables — nature is genuinely non-local in this sense.",
     "explanation": "Entanglement doesn't allow faster-than-light communication — the outcomes are random, you can only compare results afterward.",
     "topic": "Quantum Mechanics",
     "caption": "Bell's theorem is underrated. It's one of the most profound experimental results in physics history."},
    {"question": "What is the Higgs boson and why does it matter?",
     "answer": "The Higgs boson is a particle associated with the Higgs field, which permeates all of space. Particles acquire mass by interacting with this field — the stronger the interaction, the more massive the particle. Its discovery at CERN in 2012 confirmed the final missing piece of the Standard Model and explained why the W and Z bosons are massive while the photon is not.",
     "explanation": "Without the Higgs mechanism, the Standard Model predicts massless particles — which would make atoms, and therefore us, impossible.",
     "topic": "Particle Physics",
     "caption": "A $10 billion experiment to find one particle. And it worked. Science is incredible."},
    {"question": "What is the cosmic microwave background radiation?",
     "answer": "The CMB is thermal radiation left over from the early universe, about 380,000 years after the Big Bang when it cooled enough for electrons and protons to form neutral hydrogen — allowing photons to travel freely for the first time. It has a near-perfect blackbody spectrum at about 2.7 Kelvin and fills the entire observable universe. Tiny temperature fluctuations in the CMB seeded the large-scale structure we see today.",
     "explanation": "The CMB is the oldest light we can observe — a photograph of the infant universe.",
     "topic": "Astrophysics",
     "caption": "You can tune an old TV to static and about 1% of that noise is the CMB. You're literally watching the afterglow of the Big Bang."},
    {"question": "What is dark energy and why do we think it exists?",
     "answer": "Dark energy is the name for whatever is causing the universe's expansion to accelerate, as first discovered in 1998 from observations of Type Ia supernovae. It appears to act as a constant energy density of empty space (the cosmological constant Einstein originally proposed and then abandoned). It makes up about 68% of the total energy content of the universe, yet its fundamental nature remains completely unknown.",
     "explanation": "We know dark energy exists from its gravitational effects, but we have no idea what it actually is.",
     "topic": "Cosmology",
     "caption": "68% of the universe is something we can't detect, identify, or explain. Physics is humbling."},
  ],

  "Mathematics": [
    {"question": "What is a prime number and why is the distribution of primes important?",
     "answer": "A prime number is a natural number greater than 1 with no positive divisors other than 1 and itself. The distribution of primes is described by the Prime Number Theorem: the number of primes up to n is approximately n/ln(n). The Riemann Hypothesis, still unproven, makes precise predictions about this distribution and is considered one of the greatest open problems in mathematics.",
     "explanation": "Prime distribution underpins modern cryptography — RSA encryption depends on the difficulty of factoring large primes.",
     "topic": "Number Theory",
     "caption": "The Riemann Hypothesis has a $1 million prize for its proof. It's been open for 165 years."},
    {"question": "What is an eigenvalue and what does it represent geometrically?",
     "answer": "An eigenvalue of a matrix A is a scalar λ such that Av = λv for some non-zero vector v (the eigenvector). Geometrically, eigenvectors are directions that a linear transformation only scales — not rotates. The eigenvalue tells you by how much. This decomposition reveals the fundamental action of a transformation and is central to quantum mechanics, principal component analysis, and network analysis.",
     "explanation": "Diagonalizing a matrix using its eigenvectors makes many otherwise intractable computations simple.",
     "topic": "Linear Algebra",
     "caption": "Once eigenvectors clicked geometrically, linear algebra started making sense. The algebra follows the geometry."},
    {"question": "What is the central limit theorem?",
     "answer": "The central limit theorem states that the sum (or mean) of a large number of independent, identically distributed random variables approaches a normal distribution, regardless of the original distribution's shape — provided the variance is finite. This is why the normal distribution appears everywhere in nature and statistics. Sample sizes of 30+ are usually sufficient for the approximation to hold well.",
     "explanation": "The CLT is why so much of statistics works — it justifies using normal-distribution tools on non-normal data.",
     "topic": "Statistics & Probability",
     "caption": "This single theorem explains why the bell curve shows up literally everywhere. Mind-bending."},
    {"question": "What is a topological space and what does it generalize?",
     "answer": "A topological space is a set X with a collection of open sets satisfying three axioms: the empty set and X itself are open, arbitrary unions of open sets are open, and finite intersections of open sets are open. This abstracts the notion of 'nearness' or 'continuity' from metric spaces, where distance is well-defined, to settings where no distance is needed. It's the minimal structure needed to define continuous functions.",
     "explanation": "Topology asks which properties survive deformation — connectedness, holes, compactness — not measurement.",
     "topic": "Topology",
     "caption": "Topology is the study of space without distance. That sentence took me a semester to actually understand."},
  ],

  "History": [
    {"question": "What was the significance of the Berlin Conference of 1884-85?",
     "answer": "The Berlin Conference formalized the 'Scramble for Africa,' establishing rules by which European powers could claim African territories. Fourteen European nations (and the US) attended — no African representatives were present. It accelerated colonization, drew arbitrary borders cutting across ethnic and cultural lines, and set up the political geography that still shapes African states today.",
     "explanation": "Many of Africa's modern conflicts trace directly to borders drawn in Berlin by men who had never visited the continent.",
     "topic": "African History",
     "caption": "The borders of modern Africa were literally drawn by Europeans in a conference room. The consequences are still playing out."},
    {"question": "What caused the fall of the Western Roman Empire?",
     "answer": "The Western Roman Empire's fall in 476 CE resulted from a combination of factors: military overextension, economic strain from supporting a massive army, political instability (dozens of emperors in the 3rd century alone), pressure from migrating peoples (Huns, Visigoths, Vandals), and a gradual erosion of civic identity. Historians debate which factor was primary, but most emphasize the interaction of internal decay with external pressure.",
     "explanation": "Rome didn't fall in a day — it was a 200-year process of administrative fragmentation, not a single collapse.",
     "topic": "European History",
     "caption": "Edward Gibbon spent 12 volumes on this question and people still argue. That tells you something about historical causation."},
    {"question": "Who was Marcus Garvey and what was his vision?",
     "answer": "Marcus Garvey was a Jamaican political leader who founded the Universal Negro Improvement Association in 1914 and became the most prominent Pan-Africanist of the early 20th century. He promoted Black economic self-sufficiency, racial pride, and the idea of returning to Africa to build a sovereign Black nation. At his peak, his movement had millions of followers and inspired generations of Black nationalist thinkers.",
     "explanation": "Garvey's ideas directly influenced Kwame Nkrumah, Malcolm X, and Rastafarianism — his reach was vast.",
     "topic": "Pan-Africanism",
     "caption": "Garvey was deported and dismissed by many in his time. History has rehabilitated him considerably."},
    {"question": "What was the significance of the Haitian Revolution (1791-1804)?",
     "answer": "The Haitian Revolution was the only successful slave revolution in history, resulting in the establishment of Haiti as the first Black republic and the first free nation in the Caribbean. Led by Toussaint Louverture and later Jean-Jacques Dessalines, enslaved people defeated the French, Spanish, and British armies. It sent shockwaves through slaveholding societies worldwide and became a symbol of freedom that was deliberately suppressed in Western historiography.",
     "explanation": "France then demanded reparations from Haiti for 'lost property' — a debt Haiti paid until 1947.",
     "topic": "African History",
     "caption": "Haiti was made to pay for its own freedom for over a century. This story needs to be told more."},
  ],

  "Political Science": [
    {"question": "What is the security dilemma in international relations?",
     "answer": "The security dilemma arises when one state's efforts to increase its own security — through arms buildup or alliances — make other states feel less secure, prompting them to respond in kind. The result can be an arms race or escalating tensions even when no state has aggressive intentions. It's a structural feature of the anarchic international system, not a product of malice.",
     "explanation": "The Cold War nuclear arms race is the clearest modern example — both sides built weapons they hoped never to use.",
     "topic": "Geopolitics",
     "caption": "The security dilemma is why 'just building more weapons' doesn't necessarily make you safer."},
    {"question": "What distinguishes presidential from parliamentary systems?",
     "answer": "In a presidential system, the executive (president) is elected separately from the legislature and serves a fixed term — creating divided powers but also potential gridlock. In a parliamentary system, the executive (prime minister) comes from and is accountable to the legislature, meaning governments can fall via votes of no confidence. Presidential systems are more common in the Americas; parliamentary systems dominate Europe.",
     "explanation": "The choice of system shapes everything from how policies are made to how crises are resolved.",
     "topic": "Democracy & Governance",
     "caption": "The US system is the outlier globally. Most democracies use some form of parliamentary government."},
    {"question": "What is soft power?",
     "answer": "Soft power, coined by Joseph Nye, is the ability to achieve outcomes through attraction and persuasion rather than coercion or payment. It flows from a country's culture, values, and foreign policies when they are seen as legitimate or admirable. American soft power — Hollywood, universities, democratic ideals — has historically been as influential as its military or economic might.",
     "explanation": "When people around the world want to speak your language, wear your brands, or attend your universities, that's soft power.",
     "topic": "Geopolitics",
     "caption": "This concept explains so much about how China, the US, and others compete globally without firing a shot."},
    {"question": "What is the difference between realism and liberalism in IR theory?",
     "answer": "Realism holds that states are the primary actors in an anarchic international system and that they rationally pursue power and security above all else — cooperation is unstable and war is always possible. Liberalism argues that institutions, trade, and democracy can create durable cooperation by changing state incentives. Neither theory fully explains everything, but together they've framed most foreign policy debates for a century.",
     "explanation": "Most policymakers are intuitive realists; most academics are skeptical liberals.",
     "topic": "Middle Eastern Politics",
     "caption": "IR theory sounds abstract until you apply it to a real conflict. Then it becomes essential."},
    {"question": "What is populism and why has it surged globally?",
     "answer": "Populism is a political style that frames politics as a struggle between a pure, virtuous 'people' and a corrupt, self-serving 'elite.' It can be left-wing (targeting economic elites) or right-wing (targeting cultural or ethnic elites). Its recent surge is linked to rising inequality, loss of trust in institutions, identity anxiety amid rapid demographic change, and the role of social media in amplifying anti-establishment sentiment.",
     "explanation": "Populism is a symptom, not a cause — it rises when mainstream politics fails to address real grievances.",
     "topic": "Latin American Politics",
     "caption": "Populism is rising everywhere from Brazil to Hungary to the US. Understanding its structure helps you see through the rhetoric."},
  ],

  "International Relations": [
    {"question": "What is the Belt and Road Initiative?",
     "answer": "China's Belt and Road Initiative (BRI), launched in 2013, is a massive infrastructure investment program spanning over 140 countries. It funds ports, railways, highways, and energy projects across Asia, Africa, and Europe, creating physical and economic connections centered on China. Critics call it 'debt-trap diplomacy'; proponents see it as genuine development finance — the evidence suggests the reality is more complex than either narrative.",
     "explanation": "BRI is China's most ambitious geopolitical project — simultaneously economic, strategic, and diplomatic.",
     "topic": "China & Global Order",
     "caption": "The scale of BRI is hard to grasp. It's effectively a global infrastructure program run by one country."},
    {"question": "What is the responsibility to protect (R2P)?",
     "answer": "R2P is an international norm adopted by the UN in 2005 stating that sovereignty is not absolute — if a state fails to protect its citizens from genocide, war crimes, ethnic cleansing, or crimes against humanity, the international community has a responsibility to intervene. In practice, it has been selectively applied (Libya 2011) and contested (Syria), raising questions about how it can function without great power consensus.",
     "explanation": "R2P challenged the principle of absolute sovereignty — the question is whether it has actually changed behavior.",
     "topic": "China & Global Order",
     "caption": "R2P sounded like progress in 2005. Syria showed its limits. The gap between norm and practice is real."},
    {"question": "What is comparative advantage and how does it explain trade?",
     "answer": "Comparative advantage, from Ricardo, says countries should export goods they produce at relatively lower opportunity cost, even if another country is absolutely better at producing everything. If the US is more efficient at software and Brazil at coffee, both gain by specializing and trading — even if the US could produce coffee more efficiently than Brazil in absolute terms. This is the foundational argument for free trade.",
     "explanation": "Comparative advantage is counterintuitive but robust — it explains why trade benefits both partners even when one is more productive at everything.",
     "topic": "China & Global Order",
     "caption": "Ricardo's insight from 1817 still drives WTO negotiations today. Foundational."},
    {"question": "What is nuclear deterrence and does it work?",
     "answer": "Nuclear deterrence rests on the logic of mutually assured destruction (MAD): if both sides face catastrophic retaliation, neither will strike first. Deterrence requires credibility — the other side must believe you would actually retaliate — and capability — enough survivable weapons to retaliate after absorbing a first strike. The Cold War ended without nuclear exchange, which many cite as evidence deterrence works; critics note we also got very lucky.",
     "explanation": "Deterrence is a psychological strategy as much as a military one — it only works if the other side believes it.",
     "topic": "China & Global Order",
     "caption": "We avoided nuclear war by some mix of deterrence logic and sheer luck. Sobering to study in detail."},
  ],

  "Political Philosophy": [
    {"question": "What is Rawls's veil of ignorance?",
     "answer": "John Rawls proposed that just principles of society should be chosen from an 'original position' — behind a 'veil of ignorance' where you don't know your place in society, class, gender, abilities, or conception of the good. From this position, Rawls argued rational people would choose two principles: equal basic liberties for all, and inequalities only permitted if they benefit the least-advantaged members of society.",
     "explanation": "The veil of ignorance is a thought experiment to strip self-interest from political reasoning.",
     "topic": "Democracy & Governance",
     "caption": "Rawls's framework is the most influential political philosophy of the 20th century. You need to know this."},
    {"question": "What is the difference between negative and positive liberty?",
     "answer": "Negative liberty (Isaiah Berlin) is freedom from interference — the absence of external constraints on action. Positive liberty is the capacity to actually do things — freedom to develop one's potential, requiring resources and enabling conditions. Libertarians emphasize negative liberty; social democrats argue positive liberty matters because formal freedom without resources is hollow.",
     "explanation": "The distinction maps onto real political debates: is poverty a restriction on liberty? Depends which conception you hold.",
     "topic": "Democracy & Governance",
     "caption": "This distinction from Berlin's 'Two Concepts of Liberty' underlies almost every political disagreement about the role of the state."},
    {"question": "What is Habermas's theory of communicative rationality?",
     "answer": "Habermas argues that reason isn't just instrumental (using the most efficient means to reach a goal) but also communicative — embedded in the norms of honest, non-coercive discourse. Legitimate political decisions emerge from the 'ideal speech situation': open dialogue where only the force of the better argument prevails, without domination or manipulation. Democracy, for Habermas, requires such conditions.",
     "explanation": "Habermas grounds democratic legitimacy in how decisions are made, not just what they produce.",
     "topic": "Democracy & Governance",
     "caption": "Habermas is dense but worth it. His framework helps explain why procedurally unfair processes feel wrong even if outcomes are okay."},
    {"question": "What is communitarianism and how does it challenge liberalism?",
     "answer": "Communitarianism (Sandel, MacIntyre, Taylor) challenges liberal individualism by arguing that the 'unencumbered self' is a fiction — we are constituted by our communities, traditions, and relationships, not prior to them. Therefore, political philosophy must take shared values and common goods seriously, not just individual rights. It critiques liberal neutrality as a disguised preference for individualism.",
     "explanation": "Communitarianism asks: can a society that takes no position on what's good actually be good?",
     "topic": "Democracy & Governance",
     "caption": "The liberalism vs communitarianism debate is one of the best in political philosophy. Both sides have real points."},
  ],

  "Economics": [
    {"question": "What is GDP and what does it fail to measure?",
     "answer": "GDP (Gross Domestic Product) measures the total market value of all goods and services produced in a country within a period. It captures economic activity well but misses unpaid work (caregiving, housework), inequality in distribution, environmental degradation, leisure, and subjective wellbeing. A country can have high GDP growth while most citizens become worse off if gains are concentrated.",
     "explanation": "GDP is a useful speedometer, but it tells you how fast you're going — not where you're headed or who's in the car.",
     "topic": "Macroeconomics",
     "caption": "GDP measures everything except what makes life worth living — that quote has been attributed to Bobby Kennedy and it still lands."},
    {"question": "What is moral hazard in economics?",
     "answer": "Moral hazard occurs when one party takes on more risk because they know someone else will bear the costs of that risk. Bank bailouts create moral hazard — banks take excessive risks knowing governments will rescue them if things go wrong. Insurance creates moral hazard — insured people may be less careful. It arises wherever there's a separation between decision-making and risk-bearing.",
     "explanation": "The 2008 financial crisis was partly a moral hazard story — 'too big to fail' changed how banks behaved.",
     "topic": "Behavioral Economics",
     "caption": "Once you see moral hazard, you see it everywhere. It's one of the most useful concepts in all of economics."},
    {"question": "What is the Keynesian multiplier?",
     "answer": "The Keynesian multiplier describes how an initial injection of spending into an economy generates a larger total increase in output. If the government spends $1 billion, recipients spend part of that income, which becomes income for others who spend part of it, and so on. The multiplier is 1/(1 - MPC), where MPC is the marginal propensity to consume. A high MPC means a large multiplier.",
     "explanation": "This is the economic logic behind fiscal stimulus — spending ripples through the economy in successive rounds.",
     "topic": "Macroeconomics",
     "caption": "The multiplier effect is why fiscal stimulus can work — but also why its size is so contested empirically."},
    {"question": "What is comparative advantage and why do economists support free trade?",
     "answer": "Comparative advantage shows that even if one country is absolutely more productive at everything, both countries benefit from specializing in what they produce relatively more efficiently and trading. Free trade increases total output and allows consumption beyond what domestic production alone could provide. However, gains and losses are unevenly distributed — workers in import-competing industries face real costs that free-trade advocates often underweight.",
     "explanation": "The economic case for trade is strong; the political case is complicated by who wins and who loses.",
     "topic": "International Trade",
     "caption": "Economists love free trade. But the distributional effects are why it keeps losing politically. Both things are true."},
    {"question": "What is the difference between monetary and fiscal policy?",
     "answer": "Monetary policy is conducted by central banks (like the Fed) and operates through interest rates and the money supply — raising rates to cool inflation, cutting them to stimulate growth. Fiscal policy is conducted by governments through taxation and spending — stimulus packages and deficit spending to boost demand, austerity to reduce it. They interact: fiscal stimulus is more powerful when monetary policy accommodates it.",
     "explanation": "In a crisis, you usually need both — 2008 and 2020 showed that monetary policy alone has limits.",
     "topic": "Monetary Policy",
     "caption": "The Fed vs Congress dynamic is fiscal vs monetary in real time. Understanding both makes the news make sense."},
  ],

  "Finance": [
    {"question": "What is the efficient market hypothesis?",
     "answer": "The EMH states that asset prices reflect all available information, making it impossible to consistently beat the market through analysis or timing. The weak form says prices reflect all past trading data; semi-strong says they reflect all public information; strong says they reflect all information including insider knowledge. Warren Buffett's track record and anomalies like momentum effects have challenged the hypothesis without fully disproving it.",
     "explanation": "If markets are efficient, active management adds no value — the case for index funds.",
     "topic": "Financial Markets",
     "caption": "The EMH is one of the most debated ideas in finance. The evidence is messier than either side admits."},
    {"question": "What is discounted cash flow (DCF) valuation?",
     "answer": "DCF values an asset by projecting its future cash flows and discounting them back to the present at a rate that reflects risk (the discount rate or WACC). The idea is that a dollar today is worth more than a dollar in the future due to opportunity cost and uncertainty. DCF is theoretically the correct valuation method, but it's highly sensitive to assumptions — small changes in growth or discount rate dramatically change the result.",
     "explanation": "DCF is right in theory but treacherous in practice: garbage assumptions in, garbage value out.",
     "topic": "Investment & Valuation",
     "caption": "Every analyst does DCF. Almost no one agrees on the assumptions. That's why ranges matter more than point estimates."},
    {"question": "What is leverage and why does it amplify both gains and losses?",
     "answer": "Leverage means using borrowed money to increase the size of an investment. If you invest $100 of equity and borrow $400 more to buy $500 of an asset, a 10% gain gives you $50 — a 50% return on equity. But a 10% loss wipes out half your equity. Leverage amplifies returns symmetrically: it multiplies gains and losses by the ratio of total assets to equity.",
     "explanation": "Leverage is why small price drops can bankrupt highly leveraged institutions — it's the main engine of financial contagion.",
     "topic": "Corporate Finance",
     "caption": "Understanding leverage is understanding why financial crises happen so fast. The math is simple; the consequences are not."},
    {"question": "What is the difference between systematic and unsystematic risk?",
     "answer": "Systematic (market) risk affects the whole economy — recessions, interest rate changes, geopolitical events — and cannot be diversified away. Unsystematic (idiosyncratic) risk is specific to a company or sector and can be eliminated by holding a diversified portfolio. Modern portfolio theory says investors should only be compensated for systematic risk, since they can eliminate unsystematic risk for free.",
     "explanation": "Diversification is the only free lunch in finance — it removes risk without reducing expected return.",
     "topic": "Investment & Valuation",
     "caption": "This is the theoretical foundation of index funds. You shouldn't be paid for risk you chose not to diversify away."},
  ],

  "Psychology": [
    {"question": "What is the availability heuristic?",
     "answer": "The availability heuristic is a mental shortcut where people judge the likelihood of an event by how easily examples come to mind. Plane crashes are memorable and vivid, so people overestimate their frequency relative to car accidents. Media coverage amplifies this distortion — events that are widely reported feel more common than they are, regardless of base rates.",
     "explanation": "The availability heuristic explains why fear is often inversely correlated with actual statistical risk.",
     "topic": "Cognitive Psychology",
     "caption": "After 9/11, more Americans drove instead of flying and road deaths spiked. Availability heuristic with real body counts."},
    {"question": "What is the bystander effect?",
     "answer": "The bystander effect describes the tendency for individuals to be less likely to help in an emergency when other people are present. Two mechanisms drive it: diffusion of responsibility (assuming someone else will help) and pluralistic ignorance (looking at others' calm reactions and concluding no emergency exists). The effect is strongest in large groups and ambiguous situations.",
     "explanation": "In an emergency, assigning specific responsibility to one person ('you in the blue shirt, call 911') overcomes the effect.",
     "topic": "Social Psychology",
     "caption": "this + duels on ariel = unstoppable for social psych exams"},
    {"question": "What is attachment theory?",
     "answer": "Attachment theory (Bowlby, Ainsworth) proposes that infants develop an emotional bond with their primary caregiver that shapes their expectations about relationships throughout life. Four attachment styles emerge from the Strange Situation experiment: secure, anxious-ambivalent, avoidant, and disorganized. Secure attachment is associated with better emotional regulation, social competence, and relationship quality in adulthood.",
     "explanation": "Early attachment isn't destiny, but it creates an internal working model that shapes how you interpret relationships for decades.",
     "topic": "Developmental Psychology",
     "caption": "Attachment theory is one of the most replicated frameworks in psychology. And it maps uncomfortably well to adult relationships."},
    {"question": "What is the difference between intrinsic and extrinsic motivation?",
     "answer": "Intrinsic motivation means doing something because it is inherently interesting or satisfying — the activity itself is the reward. Extrinsic motivation means doing something for external rewards or to avoid punishment. Crucially, introducing extrinsic rewards for intrinsically motivated activities can undermine intrinsic motivation — the 'overjustification effect' — making the activity feel like work.",
     "explanation": "Paying kids to read can make them enjoy reading less — a finding with major implications for education and management.",
     "topic": "Educational Psychology",
     "caption": "The research on this is genuinely counterintuitive. Adding a reward can destroy motivation. Design accordingly."},
    {"question": "What is cognitive dissonance?",
     "answer": "Cognitive dissonance is the psychological discomfort that arises when a person holds two contradictory beliefs or when behavior conflicts with beliefs. People are motivated to reduce this tension — often by changing their beliefs to match their behavior rather than vice versa. Classic example: smokers who know smoking is harmful often rationalize their behavior rather than quitting.",
     "explanation": "We don't change behavior to match beliefs as often as we change beliefs to justify behavior — a humbling fact.",
     "topic": "Cognitive Psychology",
     "caption": "Cognitive dissonance is doing a lot of work in political psychology right now. Worth understanding deeply."},
  ],

  "Computer Science": [
    {"question": "What is the bias-variance tradeoff in machine learning?",
     "answer": "Bias is error from overly simplistic assumptions — underfitting, missing real patterns. Variance is error from sensitivity to small fluctuations in training data — overfitting, memorizing noise. Increasing model complexity typically reduces bias but increases variance. The goal is finding the sweet spot that minimizes total error on unseen data, which is why regularization, cross-validation, and ensemble methods exist.",
     "explanation": "A perfect model on training data is often a bad model on new data — generalization is the actual goal.",
     "topic": "Machine Learning",
     "caption": "The bias-variance tradeoff is the conceptual foundation of almost everything in ML. Get this right and the rest makes sense."},
    {"question": "What is a convolutional neural network and why does it work for images?",
     "answer": "A CNN uses convolutional layers that apply learnable filters across an image, detecting local features like edges, textures, and shapes. Because the same filter scans the entire image, CNNs exploit translation invariance — a cat looks like a cat wherever it appears. Pooling layers reduce spatial dimensions while preserving important features. This hierarchical architecture lets deep CNNs detect increasingly abstract patterns.",
     "explanation": "CNNs work because images have local spatial structure — nearby pixels are related in ways that full connections would ignore.",
     "topic": "Computer Vision",
     "caption": "The intuition behind convolutions is what most tutorials skip. Local filters + shared weights = huge efficiency gain."},
    {"question": "What is the difference between symmetric and asymmetric encryption?",
     "answer": "Symmetric encryption uses the same key for encryption and decryption — fast but requires a secure way to share the key. Asymmetric encryption uses a public-private key pair: anyone can encrypt with the public key, but only the private key holder can decrypt. In practice, most systems use asymmetric encryption to securely exchange a symmetric key, then switch to symmetric for the actual data (TLS/HTTPS does exactly this).",
     "explanation": "Asymmetric encryption solves the key distribution problem — you can publish your public key to the world safely.",
     "topic": "Cybersecurity",
     "caption": "How HTTPS actually works — this diagram saved me hours of confusion when I finally saw it clearly."},
    {"question": "What is the CAP theorem?",
     "answer": "The CAP theorem states that a distributed system can guarantee at most two of three properties simultaneously: Consistency (all nodes see the same data at the same time), Availability (every request gets a response), and Partition tolerance (the system continues to function when network partitions occur). Since network partitions are unavoidable in practice, real systems must choose between consistency and availability when a partition happens.",
     "explanation": "CAP forces an explicit tradeoff — knowing where your system sits shapes every architectural decision.",
     "topic": "Distributed Systems",
     "caption": "every backend interview has a distributed systems question. CAP is where you start."},
    {"question": "What is transformer architecture and why did it change NLP?",
     "answer": "The Transformer (Vaswani et al., 2017) replaced recurrent networks with self-attention mechanisms that allow each token in a sequence to directly attend to every other token, regardless of distance. This enables massive parallelization during training and captures long-range dependencies that RNNs struggled with. BERT, GPT, and every major language model since are transformer-based.",
     "explanation": "Attention is all you need — the paper's title was correct. Self-attention unified sequence modeling across language, vision, and more.",
     "topic": "Natural Language Processing",
     "caption": "\"Attention is All You Need\" is probably the most influential ML paper of the last decade. The architecture it introduced is everywhere."},
  ],

  "Law": [
    {"question": "What is judicial review and where does it come from in US law?",
     "answer": "Judicial review is the power of courts to invalidate legislation or executive actions that violate the Constitution. In the US, it was not explicitly written into the Constitution but was established by Chief Justice John Marshall in Marbury v. Madison (1803). Marshall reasoned that if the Constitution is supreme law, courts must have the power to enforce it by striking down conflicting statutes.",
     "explanation": "Marbury v. Madison is arguably the most consequential court decision in US history — it created the role of the Supreme Court we know today.",
     "topic": "Constitutional Law",
     "caption": "Judicial review isn't in the Constitution. Marshall essentially invented it — and it stuck."},
    {"question": "What are peremptory challenges in jury selection and why are they controversial?",
     "answer": "Peremptory challenges allow attorneys to dismiss a limited number of potential jurors without stating a reason. They're controversial because, despite Batson v. Kentucky (1986) prohibiting racially motivated dismissals, they remain difficult to enforce — lawyers can offer race-neutral pretexts. Studies consistently show that prosecutors use peremptory challenges to exclude Black jurors at significantly higher rates.",
     "explanation": "Batson is a rule with weak teeth — the procedure allows discrimination to hide behind pretextual reasoning.",
     "topic": "Criminal Justice",
     "caption": "Jury selection is where a lot of systemic bias lives. The research on this is damning."},
    {"question": "What is the Vienna Convention on the Law of Treaties?",
     "answer": "The Vienna Convention (1969) codifies the rules for how international treaties are formed, interpreted, and terminated. Key principles include pacta sunt servanda (treaties must be honored in good faith), that treaties bind only parties that consent, and provisions for when states can exit treaties (material breach, fundamental change of circumstances). It's the foundational text of international treaty law.",
     "explanation": "Most of international law runs on treaty commitments — the Vienna Convention is the rulebook for the rulebook.",
     "topic": "International Law",
     "caption": "pacta sunt servanda is one of those Latin phrases that actually means everything in international relations."},
    {"question": "What is corporate limited liability and why does it matter?",
     "answer": "Limited liability means that shareholders of a corporation are not personally responsible for the corporation's debts or legal judgments — their loss is capped at their investment. This separates personal and corporate assets, dramatically reducing the risk of investing and enabling capital to be pooled across many shareholders. Without limited liability, the modern corporation (and large-scale capitalism) would not exist in its current form.",
     "explanation": "Limited liability is arguably the most important legal invention of the 19th century for economic development.",
     "topic": "Corporate Law",
     "caption": "Limited liability sounds technical but it's the legal infrastructure of capitalism. Wild when you think about it."},
  ],

  "Philosophy": [
    {"question": "What is the hard problem of consciousness?",
     "answer": "David Chalmers distinguishes the 'easy problems' of consciousness — explaining cognitive functions like attention, memory, and behavior — from the 'hard problem': why is there subjective experience at all? Why does the physical processing of information feel like something? Even a complete neuroscientific account of brain function might leave unexplained why there's an inner experiential quality (qualia) to seeing red or feeling pain.",
     "explanation": "The hard problem asks why we're not philosophical zombies — beings who function identically to us but experience nothing.",
     "topic": "Philosophy of Mind",
     "caption": "Chalmers's hard problem is either the deepest question in philosophy or a confusion — smart people disagree on which."},
    {"question": "What is the trolley problem and what does it reveal?",
     "answer": "The trolley problem asks: would you pull a lever to divert a runaway trolley to kill one person instead of five? Most say yes. But would you push a large man off a bridge to stop the trolley and save the five? Most say no — even though the outcome is identical. This reveals a tension between utilitarian reasoning (maximize lives saved) and deontological constraints (don't use someone as a mere means).",
     "explanation": "The two cases have the same math but different moral intuitions — that asymmetry is philosophically revealing.",
     "topic": "Ethics & Moral Philosophy",
     "caption": "Judith Jarvis Thomson's version with the bridge is the one that really forces the intuition. Look it up."},
    {"question": "What is Plato's allegory of the cave?",
     "answer": "Plato's cave allegory describes prisoners chained in a cave, seeing only shadows on a wall — which they take for reality. One prisoner escapes, discovers the real world and the sun (the Form of the Good), and returns to tell the others — who reject and ridicule him. The allegory captures Plato's theory of Forms: material reality is a pale shadow of perfect, eternal, intelligible Forms that only philosophy can illuminate.",
     "explanation": "The allegory also serves as a political theory — philosophers who grasp truth should govern, even if they'd rather not.",
     "topic": "Political Philosophy",
     "caption": "The prisoner who returns is rejected. Plato was thinking about Socrates when he wrote this."},
    {"question": "What is Kant's categorical imperative?",
     "answer": "Kant's categorical imperative is a supreme moral principle with several formulations. The first: 'Act only according to that maxim you could will to be a universal law.' If lying were universal, promises would be meaningless — so lying is impermissible. The second: 'Treat humanity never merely as a means, but always as an end.' Both formulations point to duties that are unconditional and apply regardless of consequences.",
     "explanation": "Kant grounds morality in reason alone, not consequences or God — ethics that any rational being could derive.",
     "topic": "Ethics & Moral Philosophy",
     "caption": "Tagged 3 people in this already — the categorical imperative comes up in every applied ethics conversation."},
  ],

  "Biology": [
    {"question": "What is the central dogma of molecular biology?",
     "answer": "The central dogma describes the flow of genetic information: DNA is transcribed into RNA, which is translated into protein. DNA replication copies the genome for cell division. The dogma has exceptions — retroviruses use reverse transcriptase to write RNA back into DNA — but the core directionality holds for all known life. This framework unified genetics and biochemistry.",
     "explanation": "Everything from genetic diseases to CRISPR to mRNA vaccines makes sense once you understand this flow.",
     "topic": "Molecular Biology",
     "caption": "The central dogma isn't a dogma in the religious sense — Crick called it that to mean 'a strong assumption' before the evidence was in."},
    {"question": "What is the difference between mitosis and meiosis?",
     "answer": "Mitosis produces two genetically identical daughter cells for growth and repair — one division yields two diploid cells with the same chromosome number as the parent. Meiosis produces four genetically unique haploid cells for sexual reproduction — two rounds of division, with crossing over in prophase I shuffling genetic material. Errors in meiosis cause chromosomal disorders like Down syndrome.",
     "explanation": "Meiosis is where genetic diversity is generated — crossing over and random assortment mean siblings are never identical.",
     "topic": "Cell Biology",
     "caption": "Mixing these two up on an exam is a rite of passage. Make sure you don't."},
    {"question": "What is natural selection and how does it work?",
     "answer": "Natural selection is the process by which heritable traits that improve survival and reproduction become more common in a population over generations. It requires variation (individuals differ), heritability (differences are passed on), and differential fitness (some traits lead to more offspring). Crucially, selection acts on phenotype but evolution happens at the level of genotype — only heritable variation matters.",
     "explanation": "Natural selection doesn't have a goal or direction — it just filters: whatever survives to reproduce, persists.",
     "topic": "Genetics",
     "caption": "Evolution is the most powerful explanatory framework in biology. Understanding natural selection is non-negotiable."},
    {"question": "What is a keystone species?",
     "answer": "A keystone species has a disproportionately large effect on its ecosystem relative to its abundance. Removing it causes cascading changes — often collapse of other species' populations — far beyond what its biomass would suggest. The classic example is the sea otter: its removal in Pacific kelp forests allowed sea urchin populations to explode, devastating kelp, which collapsed entire associated ecosystems.",
     "explanation": "Keystone species reveal how ecological networks depend on specific nodes — remove the right one and everything unravels.",
     "topic": "Ecology",
     "caption": "Sea otters holding ecosystems together is genuinely one of the coolest stories in ecology. Look up the Aleutian Islands research."},
  ],

  "Chemistry": [
    {"question": "What are the different types of isomers in organic chemistry?",
     "answer": "Isomers share the same molecular formula but differ in structure. Constitutional isomers differ in connectivity (butane vs. isobutane). Stereoisomers have the same connectivity but differ in spatial arrangement: enantiomers are non-superimposable mirror images (like left and right hands); diastereomers are stereoisomers that are not mirror images of each other. Enantiomers can have dramatically different biological activity — one form of thalidomide treats nausea, the other causes birth defects.",
     "explanation": "In biochemistry, chirality matters enormously — enzymes are stereospecific, so the wrong isomer is often inactive or toxic.",
     "topic": "Organic Chemistry",
     "caption": "Thalidomide is the most important case study in why chirality matters in drug design. Tragic but foundational."},
    {"question": "What is an enzyme and how does it catalyze reactions?",
     "answer": "Enzymes are biological catalysts — usually proteins — that speed up reactions by lowering activation energy. They bind substrates at their active site, forming a transient enzyme-substrate complex. The active site has a specific three-dimensional shape that positions substrates favorably and provides chemical groups that stabilize the transition state. They are not consumed in the reaction and can catalyze millions of cycles per second.",
     "explanation": "Enzymes don't change the equilibrium of a reaction — just how fast it's reached.",
     "topic": "Biochemistry",
     "caption": "Lock and key vs induced fit models — the difference matters more than most biochemistry courses suggest."},
    {"question": "What is the difference between oxidation and reduction?",
     "answer": "Oxidation is the loss of electrons (or increase in oxidation state); reduction is the gain of electrons (or decrease in oxidation state). They always occur together — redox reactions. A useful mnemonic: OIL RIG (Oxidation Is Loss, Reduction Is Gain). In biological systems, electron transfer through the electron transport chain is how cells generate most of their ATP.",
     "explanation": "Cellular respiration is essentially a controlled, stepwise oxidation of glucose — extracting energy from electron transfer.",
     "topic": "Biochemistry",
     "caption": "OIL RIG is the mnemonic. Once you have it, redox makes sense everywhere from batteries to metabolism."},
  ],

  "Literature": [
    {"question": "What is the narrative significance of the unreliable narrator?",
     "answer": "An unreliable narrator is one whose account the reader has reason to doubt — due to limited knowledge, self-interest, psychological disturbance, or deliberate deception. The technique forces the reader to read between the lines, constructing a 'real' story from what the narrator reveals and conceals. Examples include Nick Carraway in The Great Gatsby, Stevens in The Remains of the Day, and the narrator in We Need to Talk About Kevin.",
     "explanation": "Unreliable narration shifts the reader from passive recipient to active interpreter — the gap between what's said and what's true is where meaning lives.",
     "topic": "Comparative Literature",
     "caption": "The most interesting narrators are unreliable in ways they don't realize. That's the sophisticated version."},
    {"question": "What is Chinua Achebe's central argument in Things Fall Apart?",
     "answer": "Things Fall Apart presents Igbo society in Nigeria at the moment of colonial encounter with a depth and dignity that colonial literature systematically denied. Achebe's central argument — articulated also in his essay 'An Image of Africa' — is that Conrad and the Western literary tradition dehumanized Africans by portraying them as background to European experience. Achebe wrote the novel specifically to tell the African story from the inside.",
     "explanation": "Achebe demonstrated that the novel form could be a decolonizing tool — you reclaim narrative, you reclaim humanity.",
     "topic": "African Literature",
     "caption": "Achebe's critique of Conrad is one of the most important pieces of literary criticism written. Read both back to back."},
    {"question": "What distinguishes modernism from postmodernism in literature?",
     "answer": "Modernism (Joyce, Woolf, Faulkner) responded to the fragmentation of modernity by seeking new aesthetic forms to capture subjective experience — stream of consciousness, fragmented chronology, unreliable narrators — while still believing in the possibility of meaning. Postmodernism (Pynchon, DFW, Borges) abandoned that belief, embracing irony, self-referentiality, and the impossibility of stable meaning or grand narratives.",
     "explanation": "Modernists are still trying to make sense of the wreckage; postmodernists have given up on sense-making itself.",
     "topic": "Comparative Literature",
     "caption": "This distinction is easier to feel in the texts than to define in theory. Read Woolf, then read Pynchon."},
  ],

  "Art History": [
    {"question": "What was the significance of linear perspective in Renaissance painting?",
     "answer": "Linear perspective, developed by Brunelleschi and codified by Alberti in the 15th century, allowed painters to create the illusion of three-dimensional space on a flat surface by making parallel lines converge at a vanishing point on the horizon. It transformed painting from symbolic representation to illusionistic depiction and placed the human viewer at the mathematical center of the image — a fundamentally humanist shift.",
     "explanation": "Perspective isn't just a technique — it's a worldview that puts the human observer at the organizing center of reality.",
     "topic": "Renaissance & Modern Art",
     "caption": "Every time you watch a movie, linear perspective is doing the heavy lifting. It's the DNA of Western visual representation."},
    {"question": "What is montage theory in cinema?",
     "answer": "Montage theory (developed by Soviet filmmakers Eisenstein, Kuleshov, and Pudovkin in the 1920s) holds that meaning in film is created by the juxtaposition of shots — the collision of images produces ideas beyond what either image contains alone. The Kuleshov effect demonstrated this: the same neutral face, cut next to food, a coffin, or a child, reads as hungry, grief-stricken, or loving. Editing is filmmaking's primary meaning-making tool.",
     "explanation": "Montage shows that cinema's power lies in the cuts between images, not the images themselves.",
     "topic": "Film & Cinema",
     "caption": "The Kuleshov effect experiment is one of the most important in film history. Watch it — it changes how you see every movie."},
    {"question": "What is the difference between impressionism and post-impressionism?",
     "answer": "Impressionism (Monet, Renoir) prioritized capturing fleeting light and momentary perception over precise detail, using loose brushwork and pure color applied in dabs. Post-impressionism (Cézanne, Van Gogh, Gauguin, Seurat) built on this but moved in different directions: Cézanne toward geometric structure and permanence; Van Gogh toward emotional intensity and expressive distortion; Seurat toward systematic color theory (pointillism). Post-impressionism planted the seeds of modernism.",
     "explanation": "Impressionism broke from realism; post-impressionism broke from impressionism and opened the door to abstraction.",
     "topic": "Renaissance & Modern Art",
     "caption": "Cézanne is the hinge figure — Impressionist roots, cubist descendants. He's the reason modern art looks the way it does."},
  ],

  "Sociology": [
    {"question": "What is Bourdieu's concept of cultural capital?",
     "answer": "Pierre Bourdieu's cultural capital refers to non-financial social assets — knowledge, skills, education, tastes, manners — that confer social advantages. It exists in three forms: embodied (dispositions and habits), objectified (cultural goods like books and art), and institutionalized (credentials and degrees). Crucially, it is acquired through socialization and disproportionately transmitted within privileged families, reproducing social inequality across generations.",
     "explanation": "Cultural capital explains why children from educated families tend to succeed academically even without superior intelligence.",
     "topic": "Cultural Studies",
     "caption": "Bourdieu gives you a vocabulary for things you've always sensed but couldn't name. Genuinely useful outside academia too."},
    {"question": "What is the concept of intersectionality?",
     "answer": "Intersectionality, coined by legal scholar Kimberlé Crenshaw, describes how different forms of social stratification — race, gender, class, sexuality, disability — interact and compound each other rather than operating independently. A Black woman's experience of discrimination is not simply 'racism + sexism' but a qualitatively distinct form of oppression that neither framework alone captures. The concept emerged from examining how anti-discrimination law failed to protect Black women.",
     "explanation": "Intersectionality is a methodological tool, not just an ideology — it asks you to examine multiple axes of power simultaneously.",
     "topic": "Social Inequality",
     "caption": "Crenshaw developed this to explain a specific legal failure. Understanding the origin makes the concept sharper."},
    {"question": "What is media framing and how does it shape public opinion?",
     "answer": "Framing refers to how media outlets select, emphasize, and contextualize information about events, shaping how audiences interpret them. The same immigration story framed as an 'economic contribution' vs. a 'security threat' activates different values and produces different policy preferences. Agenda-setting theory adds that the frequency of coverage shapes what the public considers important, even independent of how it's framed.",
     "explanation": "Media doesn't tell you what to think — it tells you what to think about and through which lens.",
     "topic": "Media Studies",
     "caption": "Frame analysis is one of the most practical tools in media literacy. Once you see frames, you can't unsee them."},
  ],

  "Journalism": [
    {"question": "What is the difference between objectivity and impartiality in journalism?",
     "answer": "Objectivity claims that journalism can and should report facts without any point of view — a view increasingly criticized as impossible and as a cover for false balance. Impartiality acknowledges that perfect neutrality is unattainable but requires that journalists be transparent about their methods, give fair hearing to relevant perspectives, and distinguish clearly between fact and opinion. Most serious journalism ethics now favor impartiality over objectivity.",
     "explanation": "False balance — treating a fringe view as equivalent to scientific consensus — is objectivity's failure mode.",
     "topic": "Media & Society",
     "caption": "The difference between objectivity and impartiality is one of the most important debates in journalism right now."},
    {"question": "What is the watchdog function of journalism?",
     "answer": "The watchdog function describes journalism's role in scrutinizing power — governments, corporations, institutions — on behalf of the public. It operates through investigative reporting, freedom of information requests, source cultivation, and persistent accountability coverage. Classic examples include Watergate, the Panama Papers, and the Boston Globe's Spotlight investigation into clergy sexual abuse. It is considered the democratic function that most justifies press freedom.",
     "explanation": "The press is only the 'Fourth Estate' when it actually watches the other three.",
     "topic": "Media & Society",
     "caption": "Spotlight is required viewing for anyone who cares about what journalism can accomplish at its best."},
    {"question": "How has social media changed the economics of journalism?",
     "answer": "Social media has disrupted journalism's business model by drawing advertising revenue away from news outlets (toward platforms like Facebook and Google) while simultaneously reducing the barrier to publishing — enabling both citizen journalism and misinformation at scale. Platforms now control distribution, making news outlets dependent on algorithms they don't control. The result is a collapse of local journalism, a boom in polarized content that performs well algorithmically, and a shrinking of quality investigative reporting.",
     "explanation": "When content is optimized for engagement rather than truth, the business model of journalism becomes misaligned with its public mission.",
     "topic": "Media & Society",
     "caption": "Local newsrooms have collapsed at a rate of about 2 per week in the US since 2004. This is a democracy problem, not just a media problem."},
  ],

  "Business": [
    {"question": "What is a minimum viable product (MVP)?",
     "answer": "An MVP is the simplest version of a product that delivers core value to early customers and generates feedback for further development. The concept, popularized by Eric Ries in The Lean Startup, argues that building fully-featured products before testing assumptions wastes resources. An MVP tests your riskiest assumptions as cheaply and quickly as possible, using real customer behavior rather than surveys or projections.",
     "explanation": "The point of an MVP isn't the product — it's the learning. Build the minimum to find out if your hypothesis is right.",
     "topic": "Entrepreneurship",
     "caption": "Most failed startups built too much too early. MVP discipline is harder than it sounds."},
    {"question": "What is Porter's Five Forces framework?",
     "answer": "Porter's Five Forces analyzes competitive intensity in an industry through five dimensions: threat of new entrants, bargaining power of suppliers, bargaining power of buyers, threat of substitute products, and rivalry among existing competitors. Together, they determine the average profitability of an industry. An industry with all five forces favorable (like luxury goods) allows sustained profits; one with all unfavorable (like airlines) structurally destroys value.",
     "explanation": "Five Forces explains why some industries are structurally profitable and others aren't — before any individual firm strategy.",
     "topic": "Corporate Strategy",
     "caption": "Porter wrote this in 1979 and it's still the first framework every strategy consultant uses. Foundational for a reason."},
    {"question": "What is the difference between gross profit margin and net profit margin?",
     "answer": "Gross profit margin is revenue minus cost of goods sold (COGS) divided by revenue — it measures how efficiently a company produces its product before overhead. Net profit margin subtracts all expenses — operating costs, interest, taxes — from revenue, measuring overall profitability. A company can have high gross margins but thin net margins if overhead, debt, or taxes are heavy (as with many tech companies in growth phase).",
     "explanation": "Gross margin reveals pricing power; net margin reveals whether the overall business model works.",
     "topic": "Tech Startups & VC",
     "caption": "Made this deck for anyone early in their finance journey — the margin distinctions trip people up constantly"},
    {"question": "What is brand equity and how is it built?",
     "answer": "Brand equity is the additional value a product commands beyond its functional attributes — the premium consumers pay for the name alone. It is built through consistent quality, distinctive identity, emotional resonance, and repeated positive experiences over time. Keller's brand equity model argues that equity flows from brand awareness → brand associations → brand response → brand resonance, each level building on the last.",
     "explanation": "Brand equity is an intangible asset on the balance sheet — Apple's brand is worth more than most countries' GDP.",
     "topic": "Brand Management",
     "caption": "People pay $1000 more for a laptop with an apple on it. That's brand equity in the most concrete possible terms."},
  ],
}

# ---------------------------------------------------------------------------
# DECK METADATA PER SUBJECT/TOPIC (natural titles + captions)
# ---------------------------------------------------------------------------
DECK_META = {
  "Neuroscience": {"title": "Memory & the Brain", "description": "How we learn, remember, and forget — from synapses to sleep.", "caption": "Everything I know about memory in one deck."},
  "Medicine_Pharmacology": {"title": "Pharmacology Essentials", "description": "Core drug classes, mechanisms, and clinical pearls.", "caption": "The receptor logic that makes pharmacology finally make sense."},
  "Medicine_Drug Mechanisms": {"title": "How Drugs Actually Work", "description": "Mechanisms behind the most commonly tested drug classes.", "caption": "Made this after bombing a pharm exam. Won't happen again."},
  "Medicine_Cardiology": {"title": "Cardiology Fundamentals", "description": "Heart physiology, pathology, and clinical reasoning.", "caption": "The heart is elegant. These cards explain why."},
  "Medicine_Surgery": {"title": "Surgery Basics", "description": "Key surgical concepts from wound healing to pre-op assessment.", "caption": "For anyone rotating through surgery and feeling lost."},
  "Neurology": {"title": "Neuroplasticity & the Brain", "description": "How the brain rewires itself through injury, learning, and experience.", "caption": "The brain's capacity to change is wilder than most people know."},
  "Immunology": {"title": "Immune System Deep Dive", "description": "Innate vs adaptive, tolerance, autoimmunity, and biologics.", "caption": "Immunology clicked for me when I stopped memorizing and started understanding the logic."},
  "Public Health": {"title": "Epidemiology 101", "description": "The tools epidemiologists use to understand disease in populations.", "caption": "COVID made everyone an armchair epidemiologist. These cards give you the real framework."},
  "Genetics": {"title": "Gene Editing & Genomics", "description": "CRISPR, epigenetics, penetrance, and the ethics of genome modification.", "caption": "We're living through a revolution in genetics. These are the concepts to know."},
  "Psychiatry": {"title": "Mental Health & the Brain", "description": "Psychiatric conditions through a neuroscientific lens.", "caption": "Understanding the biology doesn't reduce the humanity — it adds to it."},
  "Physics_Quantum Mechanics": {"title": "Quantum Mechanics Core", "description": "Wave-particle duality, entanglement, and the strangeness of quantum reality.", "caption": "Quantum mechanics will make you question everything you thought you knew about reality."},
  "Physics_Quantum Computing": {"title": "Quantum Computing Basics", "description": "Qubits, superposition, entanglement — how quantum computers work.", "caption": "The computing revolution no one is ready for."},
  "Physics_Astrophysics": {"title": "Astrophysics Essentials", "description": "Stars, galaxies, dark matter, and the large-scale structure of the universe.", "caption": "Space is stranger and more beautiful than any sci-fi gets right."},
  "Physics_Particle Physics": {"title": "Particle Physics & the Standard Model", "description": "The fundamental particles and forces that make up everything.", "caption": "The Standard Model is one of the greatest achievements of human thought."},
  "Physics_Cosmology": {"title": "Cosmology: Big Bang to Now", "description": "The origin, evolution, and fate of the universe.", "caption": "These questions were philosophy 100 years ago. Now they're physics."},
  "Mathematics_Number Theory": {"title": "Number Theory Fundamentals", "description": "Primes, divisibility, and the deep structure hiding in integers.", "caption": "Number theory is pure math with secret applications in cryptography."},
  "Mathematics_Linear Algebra": {"title": "Linear Algebra That Matters", "description": "Vectors, matrices, eigenvalues — the language of data science and physics.", "caption": "Linear algebra is the backbone of machine learning. Learn it well."},
  "Mathematics_Statistics & Probability": {"title": "Stats & Probability Essentials", "description": "The tools for reasoning under uncertainty.", "caption": "Bad statistics is everywhere. These cards help you spot it."},
  "Mathematics_Topology": {"title": "Introduction to Topology", "description": "Shape, space, and continuity without distance.", "caption": "Topology is math that bends your brain. In the best way."},
  "Mathematics_Calculus": {"title": "Calculus Core Concepts", "description": "Limits, derivatives, integrals — the math of change.", "caption": "Calculus is the language nature speaks. These are the first words."},
  "History_African History": {"title": "African History You Should Know", "description": "From precolonial kingdoms to the long shadow of colonialism.", "caption": "African history is taught badly almost everywhere. This is a start."},
  "History_European History": {"title": "European History: Key Turning Points", "description": "The events that shaped the modern world.", "caption": "You can't understand the present without understanding this history."},
  "History_Pan-Africanism": {"title": "Pan-Africanism & Black Freedom Movements", "description": "Garvey, Nkrumah, Du Bois, and the global struggle for Black liberation.", "caption": "The intellectual history of Pan-Africanism is richer than most curricula admit."},
  "Political Science_Middle Eastern Politics": {"title": "Middle Eastern Politics", "description": "States, non-state actors, and the regional dynamics of the Middle East.", "caption": "Context is everything in this region. These cards provide it."},
  "Political Science_African Politics": {"title": "African Political Systems", "description": "Governance, democracy, and political economy across the African continent.", "caption": "African politics is diverse and complex. This is not a monolith."},
  "Political Science_Latin American Politics": {"title": "Latin American Politics", "description": "Populism, democracy, inequality, and political economy in Latin America.", "caption": "From Bolsonaro to Morales — the spectrum is wider than most people realize."},
  "Political Science_Geopolitics": {"title": "Geopolitics: Power & Place", "description": "How geography, power, and strategy shape international relations.", "caption": "Geopolitics gives you the map behind the news."},
  "Political Science_Conflict & Peace Studies": {"title": "Conflict & Peacebuilding", "description": "The causes of war, the conditions for peace, and the tools in between.", "caption": "Understanding why conflicts start is the first step to preventing them."},
  "International Relations": {"title": "International Relations Core", "description": "Theories, institutions, and the dynamics of global order.", "caption": "IR theory sounds dry until you apply it to a real conflict."},
  "Political Philosophy": {"title": "Political Philosophy Essentials", "description": "Justice, liberty, democracy — the ideas that underpin political life.", "caption": "Every political debate is a philosophy debate in disguise."},
  "Economics_Development Economics": {"title": "Development Economics", "description": "Why some countries are rich and others are poor — and what to do about it.", "caption": "The most important questions in economics are development questions."},
  "Economics_Behavioral Economics": {"title": "Behavioral Economics", "description": "How humans actually make decisions — not the rational agent fiction.", "caption": "Behavioral economics is economics that takes humans seriously."},
  "Economics_Macroeconomics": {"title": "Macroeconomics Fundamentals", "description": "GDP, inflation, monetary and fiscal policy — the big picture.", "caption": "Understanding macroeconomics is understanding why policy debates happen."},
  "Economics_Microeconomics": {"title": "Microeconomics Core", "description": "Supply, demand, market structure, and individual decision-making.", "caption": "Micro is where economics is most intuitive and most powerful."},
  "Economics_Economic History": {"title": "Economic History: Key Moments", "description": "The industrial revolution, the Great Depression, globalization — history through an economic lens.", "caption": "Economic history is the discipline that explains why we live the way we do."},
  "Economics_Monetary Policy": {"title": "Monetary Policy & Central Banking", "description": "How central banks manage money, inflation, and economic stability.", "caption": "The Fed raised rates 11 times in 2022-23. These cards explain why that matters."},
  "Economics_International Trade": {"title": "International Trade", "description": "Comparative advantage, trade policy, and the global trading system.", "caption": "Trade isn't just economics — it's geopolitics, domestic politics, and history combined."},
  "Finance_Financial Markets": {"title": "Financial Markets 101", "description": "Stocks, bonds, derivatives, and how markets price assets.", "caption": "You don't need to work in finance to understand how financial markets shape your life."},
  "Finance_Investment & Valuation": {"title": "Investment & Valuation", "description": "DCF, multiples, and how investors decide what things are worth.", "caption": "Valuation is part science, part judgment. These cards give you the science."},
  "Finance_Corporate Finance": {"title": "Corporate Finance Essentials", "description": "Capital structure, leverage, WACC, and financial decision-making.", "caption": "Corporate finance is the language of business strategy."},
  "Psychology_Cognitive Psychology": {"title": "Cognitive Psychology & Biases", "description": "How we think, decide, and systematically err.", "caption": "Knowing your biases doesn't make you immune — but it helps."},
  "Psychology_Social Psychology": {"title": "Social Psychology", "description": "How other people shape our behavior, beliefs, and identity.", "caption": "The experiments in social psychology are disturbing and essential."},
  "Psychology_Clinical Psychology": {"title": "Clinical Psychology Fundamentals", "description": "Diagnosis, treatment, and evidence-based interventions for mental health.", "caption": "Clinical psych demystifies mental health in ways that reduce stigma."},
  "Psychology_Neuropsychology": {"title": "Brain & Behavior: Neuropsychology", "description": "How brain structure and function shape cognition and personality.", "caption": "Neuropsychology is where neuroscience and psychology finally shake hands."},
  "Psychology_Educational Psychology": {"title": "Educational Psychology", "description": "How people learn — and how to teach more effectively.", "caption": "The research on learning is way more useful than most schools apply."},
  "Psychology_Evolutionary Psychology": {"title": "Evolutionary Psychology", "description": "Why we are the way we are — through the lens of evolution.", "caption": "Evolutionary psychology is controversial because it's interesting."},
  "Psychology_Developmental Psychology": {"title": "Developmental Psychology", "description": "How humans change across the lifespan — from infancy to aging.", "caption": "Development never really stops. These cards show you why."},
  "Psychology_Sports Psychology": {"title": "Sports Psychology", "description": "Mental performance, resilience, and the psychology of competition.", "caption": "The mental game is half the sport. These cards give you the framework."},
  "Psychology_Positive Psychology": {"title": "Positive Psychology & Wellbeing", "description": "The science of flourishing — what makes life good and how to cultivate it.", "caption": "Positive psychology isn't self-help. It's rigorous science about what works."},
  "Psychology_Trauma & Resilience": {"title": "Trauma & Resilience", "description": "Understanding trauma, its effects, and the science of recovery.", "caption": "Understanding trauma is one of the most important things you can learn."},
  "Computer Science_Machine Learning": {"title": "Machine Learning Fundamentals", "description": "The core concepts behind modern AI — from linear regression to deep learning.", "caption": "ML is the most important technology of our time. Understand it, don't just use it."},
  "Computer Science_Computer Vision": {"title": "Computer Vision Core", "description": "How machines see — CNNs, object detection, and visual AI.", "caption": "Your phone unlocks with your face because of these ideas."},
  "Computer Science_Cybersecurity": {"title": "Cybersecurity Fundamentals", "description": "Encryption, authentication, attacks, and defenses.", "caption": "Everyone uses the internet. Almost no one understands how it's secured."},
  "Computer Science_Distributed Systems": {"title": "Distributed Systems", "description": "Consistency, availability, and the challenges of building reliable distributed software.", "caption": "Every tech system you use is distributed. These are the constraints."},
  "Computer Science_AI Ethics": {"title": "AI Ethics", "description": "Fairness, accountability, transparency, and the societal implications of AI.", "caption": "Building AI without ethics is just building faster bias amplifiers."},
  "Computer Science_Human-Computer Interaction": {"title": "Human-Computer Interaction", "description": "How design shapes behavior — usability, accessibility, and user experience.", "caption": "Good design is invisible. Bad design makes you feel stupid."},
  "Computer Science_Blockchain & Web3": {"title": "Blockchain & Web3 Explained", "description": "How blockchains work, what they enable, and where the hype exceeds the reality.", "caption": "Understanding blockchain without the hype is harder than it should be. This helps."},
  "Computer Science_Quantum Algorithms": {"title": "Quantum Algorithms", "description": "Grover's, Shor's, and the computational power of quantum mechanics.", "caption": "Quantum algorithms will break current encryption. That's not a joke."},
  "Computer Science_Natural Language Processing": {"title": "NLP & Language Models", "description": "How machines process, understand, and generate human language.", "caption": "ChatGPT is just the tip of the NLP iceberg. These cards go deeper."},
  "Computer Science_Robotics & Automation": {"title": "Robotics & Automation", "description": "Sensing, planning, actuation, and the future of physical AI.", "caption": "Robots are moving from factories to everywhere. Understanding how helps."},
  "Law_Constitutional Law": {"title": "Constitutional Law Essentials", "description": "Fundamental rights, judicial review, and the structure of constitutional democracy.", "caption": "Constitutional law is where law and politics are most visibly intertwined."},
  "Law_Human Rights Law": {"title": "Human Rights Law", "description": "International frameworks, enforcement mechanisms, and the limits of rights protection.", "caption": "Human rights law is aspirational by design. The gap to reality is the subject."},
  "Law_Legal Philosophy": {"title": "Legal Philosophy & Jurisprudence", "description": "What law is, where it comes from, and how it relates to morality.", "caption": "Jurisprudence asks the questions practicing lawyers rarely have time for."},
  "Law_International Law": {"title": "International Law Basics", "description": "Treaties, sovereignty, jurisdiction, and the rules governing state behavior.", "caption": "International law is real even when it's unenforceable. Understanding both is key."},
  "Law_Criminal Justice": {"title": "Criminal Justice: Law & Policy", "description": "Criminal procedure, sentencing, mass incarceration, and reform.", "caption": "Criminal justice is where law, race, and power are most visibly in tension."},
  "Law_Corporate Law": {"title": "Corporate Law Fundamentals", "description": "Corporate structure, directors' duties, limited liability, and M&A basics.", "caption": "Corporate law created the world we live in. Worth understanding from first principles."},
  "Philosophy_Philosophy of Mind": {"title": "Philosophy of Mind", "description": "Consciousness, qualia, and the hard problem of subjective experience.", "caption": "The hardest question in philosophy might be the one you're living through right now."},
  "Philosophy_Ethics & Moral Philosophy": {"title": "Ethics: Core Frameworks", "description": "Consequentialism, deontology, virtue ethics — the major theories and their applications.", "caption": "Ethics isn't relative. It's hard. These frameworks help."},
  "Philosophy_Political Philosophy": {"title": "Political Philosophy", "description": "Justice, liberty, and the philosophical foundations of political life.", "caption": "Political philosophy is where the arguments that shape policy begin."},
  "Philosophy_Aesthetics & Art": {"title": "Aesthetics & Philosophy of Art", "description": "What is beauty? What is art? How do we make aesthetic judgments?", "caption": "These questions sound soft until you try to answer them rigorously."},
  "Biology_Molecular Biology": {"title": "Molecular Biology Essentials", "description": "DNA, RNA, protein synthesis, and the central dogma of life.", "caption": "mRNA vaccines make sense once you understand the central dogma."},
  "Biology_Ecology": {"title": "Ecology & Ecosystems", "description": "How species interact and what holds ecosystems together.", "caption": "Ecology explains why removing one species can collapse everything else."},
  "Biology_Genetics": {"title": "Genetics: From Mendel to CRISPR", "description": "Inheritance, variation, and the molecular basis of heredity.", "caption": "Genetics is moving faster than our ethical frameworks. Worth knowing the basics."},
  "Biology_Cell Biology": {"title": "Cell Biology Core", "description": "Cell structure, division, signaling, and the machinery of life.", "caption": "Every disease is ultimately a cell biology story."},
  "Biology_Microbiology": {"title": "Microbiology Essentials", "description": "Bacteria, viruses, and the microbial world we live in and with.", "caption": "You have more microbial cells than human cells. These cards explain what they're doing."},
  "Biology_Marine Biology": {"title": "Marine Biology", "description": "Ocean ecosystems, marine organisms, and the biology of life underwater.", "caption": "We know less about the deep ocean than we do about space. Humbling."},
  "Chemistry_Biochemistry": {"title": "Biochemistry Essentials", "description": "Enzymes, metabolism, and the molecular chemistry of living systems.", "caption": "Biochemistry is where chemistry and biology finally make sense together."},
  "Chemistry_Organic Chemistry": {"title": "Organic Chemistry Fundamentals", "description": "Functional groups, reaction mechanisms, and stereochemistry.", "caption": "Orgo has a reputation for being hard. Understanding mechanisms makes it manageable."},
  "Chemistry_Pharmacology": {"title": "Pharmacological Chemistry", "description": "Drug-receptor interactions, bioavailability, and medicinal chemistry.", "caption": "Every drug is a chemistry story. These are the key chapters."},
  "Chemistry_Environmental Chemistry": {"title": "Environmental Chemistry", "description": "Chemical processes in air, water, and soil — and how pollution works.", "caption": "Climate change is a chemistry problem before it's a policy problem."},
  "Literature_African Literature": {"title": "African Literature & Voice", "description": "Achebe, Adichie, Ngugi — the writers redefining narrative from the inside.", "caption": "African literature is one of the richest traditions in world literature. Read it."},
  "Literature_Creative Writing": {"title": "Creative Writing Craft", "description": "The techniques behind great storytelling — structure, voice, character, revision.", "caption": "Writing is a skill. These are the tools."},
  "Literature_Comparative Literature": {"title": "Comparative Literature", "description": "Reading across languages, traditions, and cultures to find what's universal.", "caption": "Comparative literature teaches you to read better in every language."},
  "Art History_Renaissance & Modern Art": {"title": "Art History: Renaissance to Modernism", "description": "The visual ideas that changed how we see the world.", "caption": "Art history is the history of ideas you can look at."},
  "Art History_Film & Cinema": {"title": "Film Theory & History", "description": "Montage, genre, auteur theory, and the cinema that shaped culture.", "caption": "Film theory gives you a vocabulary for why some movies stay with you forever."},
  "Sociology_Cultural Studies": {"title": "Cultural Studies", "description": "How culture reproduces power, identity, and inequality.", "caption": "Culture isn't neutral. Cultural studies helps you see the politics inside it."},
  "Sociology_Media Studies": {"title": "Media Studies & Framing", "description": "How media shapes public opinion, agenda, and reality.", "caption": "Understanding media framing is the core skill of modern citizenship."},
  "Sociology_Social Inequality": {"title": "Social Inequality", "description": "Class, race, gender, and the structures that produce unequal outcomes.", "caption": "Inequality is structured, not random. These cards show the mechanisms."},
  "Journalism_Media & Society": {"title": "Journalism & Democracy", "description": "The watchdog function, media ethics, and journalism in the digital age.", "caption": "Good journalism is infrastructure for democracy. We should treat it that way."},
  "Business_Entrepreneurship": {"title": "Startup Fundamentals", "description": "MVPs, product-market fit, business models, and building in uncertainty.", "caption": "Most startup advice is noise. These are the signal concepts."},
  "Business_Marketing Strategy": {"title": "Marketing Strategy", "description": "Positioning, segmentation, brand, and the frameworks behind great marketing.", "caption": "Marketing isn't manipulation. Done right, it's matching real value to real needs."},
  "Business_Social Enterprise": {"title": "Social Enterprise & Impact", "description": "How organizations create social value alongside — or instead of — profit.", "caption": "The most interesting businesses are trying to solve real problems."},
  "Business_Corporate Strategy": {"title": "Corporate Strategy Essentials", "description": "Five Forces, competitive advantage, and how firms sustain superior performance.", "caption": "Strategy is about making choices. These frameworks make the logic explicit."},
  "Business_Innovation & Design Thinking": {"title": "Innovation & Design Thinking", "description": "Human-centered design, ideation, prototyping, and the process of innovation.", "caption": "Design thinking is a process, not a personality trait. Anyone can learn it."},
  "Business_Leadership": {"title": "Leadership & Management", "description": "What great leadership actually looks like — and the research behind it.", "caption": "Leadership is one of the most studied topics in business. Most of it is noise. This isn't."},
  "Business_Sustainable Business": {"title": "Sustainable Business", "description": "ESG, circular economy, and building businesses that don't destroy the planet.", "caption": "Sustainable business isn't charity — it's the only viable long-term strategy."},
  "Business_Tech Startups & VC": {"title": "Tech Startups & Venture Capital", "description": "How VC works, how startups are valued, and the logic of venture investing.", "caption": "VC funding is misunderstood by almost everyone outside Silicon Valley."},
  "Business_Brand Management": {"title": "Brand Management", "description": "Brand equity, identity, positioning, and how brands create lasting value.", "caption": "A brand is a promise. Brand management is keeping that promise at scale."},
  "Business_Impact Investment": {"title": "Impact Investing", "description": "How capital can be deployed to generate both financial returns and social good.", "caption": "Impact investing is either the future of finance or a great story. Worth understanding either way."},
}

COMMENT_POOL = [
  "this is so clear, thank you",
  "exactly what I needed 🙌",
  "the explanation made it click for me",
  "been struggling with this one",
  "🔥",
  "finally a clean breakdown",
  "saving this",
  "this + duels on ariel = unstoppable",
  "tagged 3 people in this already",
  "ok the explanation is perfect",
  "I needed this for my exam tomorrow",
  "been getting this wrong for weeks",
  "💀 why is this so good",
  "the caption got me 😭",
  "wish my textbook explained it like this",
  "came back to this 3 times already",
  "added to my deck immediately",
  "actually understandable, rare",
  "this is the one",
  "short and exactly right",
]

EDUCATION_LEVELS = ["undergraduate", "postgraduate", "phd"]


def random_past_date(days_back=180):
    delta = random.randint(1, days_back)
    return datetime.utcnow() - timedelta(days=delta)


def get_deck_key(subject, topic):
    key = f"{subject}_{topic}"
    if key in DECK_META:
        return DECK_META[key]
    if subject in DECK_META:
        return DECK_META[subject]
    return {
        "title": f"{topic} Essentials",
        "description": f"Core concepts in {topic}.",
        "caption": f"Built this deck to get my {topic} fundamentals solid.",
    }


async def main():
    client = AsyncIOMotorClient(MONGODB_URL)
    db = client[DB_NAME]

    print("Fetching bot users from DB...")
    bot_users = await db.users.find({"is_bot": True}).to_list(length=None)
    if not bot_users:
        print("No bot users found. Run seed_bots.py first.")
        return

    bot_ids = [str(u["_id"]) for u in bot_users]
    print(f"Found {len(bot_users)} bot users.")

    # Delete existing cards and decks for all bots
    print("Deleting existing bot cards...")
    del_cards = await db.cards.delete_many({"user_id": {"$in": bot_ids}})
    print(f"  Deleted {del_cards.deleted_count} cards.")

    print("Deleting existing bot decks...")
    del_decks = await db.decks.delete_many({"user_id": {"$in": bot_ids}})
    print(f"  Deleted {del_decks.deleted_count} decks.")

    print("Deleting existing bot comments...")
    del_comments = await db.comments.delete_many({"user_id": {"$in": bot_ids}})
    print(f"  Deleted {del_comments.deleted_count} comments.")

    # Build lookup: email -> db user doc
    email_to_user = {u["email"]: u for u in bot_users}

    # For each persona, create cards + deck
    all_created_cards = []  # list of (card_doc, bot_user_doc)

    for persona in PERSONAS:
        user = email_to_user.get(persona["email"])
        if not user:
            print(f"  WARN: {persona['email']} not found in DB, skipping.")
            continue

        bot_uid = str(user["_id"])
        subject = persona["subject"]
        topic = persona["topic"]

        card_templates = CARDS_BY_SUBJECT.get(subject, [])
        if not card_templates:
            print(f"  WARN: No cards defined for subject '{subject}', skipping {persona['username']}.")
            continue

        created_at = random_past_date(180)

        # Build card documents
        card_docs = []
        for tmpl in card_templates:
            card_id = ObjectId()
            card = {
                "_id": card_id,
                "user_id": bot_uid,
                "question": tmpl["question"],
                "answer": tmpl["answer"],
                "explanation": tmpl["explanation"],
                "subject": subject,
                "topic": tmpl.get("topic", topic),
                "tags": [subject.lower(), tmpl.get("topic", topic).lower()],
                "visibility": "public",
                "caption": tmpl.get("caption", ""),
                "likes": random.randint(5, 300),
                "saves": random.randint(2, 80),
                "review_count": random.randint(0, 50),
                "ease_factor": 2.5,
                "interval": 1,
                "next_review": datetime.utcnow(),
                "last_review": None,
                "liked_by": [],
                "created_at": created_at,
                "updated_at": created_at,
            }
            card_docs.append(card)

        if card_docs:
            await db.cards.insert_many(card_docs)
            for c in card_docs:
                all_created_cards.append((c, user))

        # Create deck
        deck_meta = get_deck_key(subject, topic)
        deck_created_at = created_at - timedelta(days=random.randint(0, 10))
        deck = {
            "_id": ObjectId(),
            "user_id": bot_uid,
            "title": deck_meta["title"],
            "description": deck_meta["description"],
            "subject": subject,
            "topic": topic,
            "card_ids": [str(c["_id"]) for c in card_docs],
            "card_count": len(card_docs),
            "visibility": "public",
            "tags": [subject.lower()],
            "is_featured": False,
            "likes": random.randint(10, 400),
            "saves": random.randint(5, 100),
            "views": random.randint(50, 1500),
            "comments_count": 0,
            "liked_by": [],
            "saved_by": [],
            "caption": deck_meta["caption"],
            "created_at": deck_created_at,
            "updated_at": deck_created_at,
            "published_at": deck_created_at,
            "course_code": None,
            "cover_image": None,
            "education_level": random.choice(EDUCATION_LEVELS),
        }
        await db.decks.insert_one(deck)
        print(f"  [{persona['username']}] {len(card_docs)} cards + 1 deck created.")

    # Comments: ~25% of bots comment on other bots' cards
    print("\nCreating comments...")
    comment_docs = []

    # Build a pool of other bots' cards to comment on
    # all_created_cards: list of (card_doc, bot_user_doc)
    commenter_personas = random.sample(PERSONAS, max(1, len(PERSONAS) // 4))

    for persona in commenter_personas:
        commenter_user = email_to_user.get(persona["email"])
        if not commenter_user:
            continue
        commenter_uid = str(commenter_user["_id"])
        commenter_username = commenter_user.get("username", persona["username"])
        commenter_full_name = commenter_user.get("full_name", persona["name"])
        img = persona["img"]

        # Pick 1-2 random cards NOT from this bot
        other_cards = [(c, u) for c, u in all_created_cards if str(u["_id"]) != commenter_uid]
        if not other_cards:
            continue
        targets = random.sample(other_cards, min(random.randint(1, 2), len(other_cards)))

        for target_card, _ in targets:
            card_created_at = target_card["created_at"]
            comment_date = card_created_at + timedelta(days=random.randint(1, 10))
            comment = {
                "_id": ObjectId(),
                "card_id": str(target_card["_id"]),
                "user_id": commenter_uid,
                "author_username": commenter_username,
                "author_full_name": commenter_full_name,
                "author_profile_picture": f"https://i.pravatar.cc/300?img={img}",
                "content": random.choice(COMMENT_POOL),
                "likes": random.randint(0, 20),
                "liked_by": [],
                "created_at": comment_date,
            }
            comment_docs.append(comment)

    if comment_docs:
        await db.comments.insert_many(comment_docs)
    print(f"  Created {len(comment_docs)} comments.")

    total_cards = len(all_created_cards)
    print(f"\nDone. {total_cards} cards, decks for {len(PERSONAS)} bots, {len(comment_docs)} comments inserted.")
    client.close()


if __name__ == "__main__":
    asyncio.run(main())

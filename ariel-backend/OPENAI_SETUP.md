# OpenAI API Key Setup Guide

This guide will help you configure OpenAI API access for the AI Card Generator feature.

## 📋 Prerequisites

- OpenAI account with API access
- Credit card for billing (required by OpenAI)
- Terminal access to your backend server

## 🔑 Step 1: Get Your OpenAI API Key

1. **Create an OpenAI Account**
   - Go to https://platform.openai.com/signup
   - Sign up with email, Google, or Microsoft
   - Verify your email

2. **Generate API Key**
   - Visit https://platform.openai.com/api-keys
   - Click **"Create new secret key"**
   - Name it: "Ariel Learning Platform"
   - **COPY THE KEY IMMEDIATELY** - you can't see it again!
   - Example format: `sk-proj-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

3. **Set Up Billing**
   - Go to https://platform.openai.com/settings/organization/billing/overview
   - Add payment method (credit card required)
   - **IMPORTANT**: Set usage limits to avoid surprise charges
     - Go to https://platform.openai.com/settings/organization/limits
     - Set monthly budget: $5-10 for testing, $20-50 for production

4. **Free Credits**
   - New accounts get $5 free credits (enough for ~50 card generations)
   - Credits expire after 3 months

## 💻 Step 2: Add API Key to Your Backend

### Method: Edit .env File (Recommended)

1. **Open the .env file**
   ```bash
   cd /Users/willyshumbusho/ariel-learning-platform/ariel-backend
   nano .env
   ```

2. **Replace the empty OPENAI_API_KEY value**

   Change this:
   ```
   OPENAI_API_KEY=
   ```

   To this (with YOUR actual key):
   ```
   OPENAI_API_KEY=sk-proj-your-actual-key-here
   ```

3. **Save and exit**
   - Press `Ctrl + X`
   - Press `Y` to confirm
   - Press `Enter` to save

4. **Restart the backend server**

   The backend should auto-reload, but if not:
   ```bash
   # Stop the server (Ctrl+C) and restart:
   cd /Users/willyshumbusho/ariel-learning-platform/ariel-backend
   source venv/bin/activate
   python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
   ```

## ✅ Step 3: Test It Works

1. **Login to Ariel**
   - Go to http://localhost:3000
   - Sign in with your account

2. **Complete Onboarding**
   - If you haven't completed onboarding, do it now
   - Select your education level, subjects, etc.

3. **Generate AI Cards**
   - Go to Home page
   - You should see the **AI Card Generator** section
   - Click **"🚀 Generate Daily Cards"**
   - Should see "Generating cards with AI..."
   - Success! Cards appear in your deck

## 💰 Cost Estimation

### GPT-4 Pricing (Current Rates)
- Input: ~$0.03 per 1,000 tokens
- Output: ~$0.06 per 1,000 tokens

### Expected Costs for Ariel
| Action | Tokens Used | Cost |
|--------|-------------|------|
| Generate 10 cards | ~1,500 | $0.10 |
| Daily cards (5 subjects × 5 cards) | ~3,500 | $0.40 |
| Monthly (daily use) | ~105,000 | ~$12 |

### Cost Optimization Tips
1. **Use GPT-3.5-turbo** (10x cheaper, still good quality)
   - Edit `app/services/ai_card_generator.py`
   - Change `model="gpt-4"` to `model="gpt-3.5-turbo"`

2. **Limit daily generations**
   - Generate cards once per week instead of daily
   - Reduces monthly cost to ~$2-3

3. **Set strict limits**
   - Always use OpenAI dashboard to set hard limits
   - Set alerts for 50%, 75%, 90% of budget

## 🔒 Security Best Practices

### ✅ DO:
- Keep your API key secret
- Use `.env` file (already in `.gitignore`)
- Set usage limits in OpenAI dashboard
- Rotate keys every 3-6 months
- Monitor usage regularly

### ❌ DON'T:
- Commit `.env` to git
- Share your API key publicly
- Use same key for dev and production
- Skip setting usage limits

## 🐛 Troubleshooting

### Error: "OpenAI API key not configured"
**Solution:** Check that `.env` file has your key with no extra spaces
```bash
# Correct:
OPENAI_API_KEY=sk-proj-xxxxx

# Wrong (has spaces):
OPENAI_API_KEY = sk-proj-xxxxx
```

### Error: "Invalid API key"
**Solution:**
1. Check you copied the full key (starts with `sk-`)
2. Key might be revoked - generate a new one
3. Check for extra spaces or quotes in `.env`

### Error: "Insufficient quota"
**Solution:**
1. Add payment method to OpenAI account
2. Free credits expired - add $5-10 to account
3. Check usage limits aren't set too low

### Cards generate but are low quality
**Solution:**
1. Make sure you're using GPT-4 (not GPT-3.5)
2. Complete onboarding to provide better profile data
3. Subjects in profile help generate relevant content

## 📊 Monitoring Usage

**Check your usage:**
- Dashboard: https://platform.openai.com/usage
- View costs by day, week, month
- Set up billing alerts

**Check backend logs:**
```bash
cd /Users/willyshumbusho/ariel-learning-platform/ariel-backend
tail -f logs/app.log
```

## 🆘 Need Help?

1. **OpenAI Documentation**: https://platform.openai.com/docs
2. **API Status**: https://status.openai.com
3. **Support**: https://help.openai.com

---

## Quick Start (TL;DR)

```bash
# 1. Get API key from: https://platform.openai.com/api-keys

# 2. Edit .env file
cd /Users/willyshumbusho/ariel-learning-platform/ariel-backend
nano .env

# 3. Add your key:
OPENAI_API_KEY=sk-proj-your-actual-key-here

# 4. Save and restart backend (Ctrl+C then restart)

# 5. Test on http://localhost:3000
```

Done! 🎉

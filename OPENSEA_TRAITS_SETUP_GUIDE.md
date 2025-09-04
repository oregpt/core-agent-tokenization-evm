# 🎨 OpenSea Traits Setup Guide

**Problem**: Your tokens don't show traits/attributes on OpenSea because metadata URIs point to non-existent endpoints.

**Solution**: Host properly formatted JSON metadata that OpenSea can read.

---

## 🔍 Current Status

### Your Tokens' Metadata URIs:
- **Agent Token #1**: `https://api.moluabi.com/agents/stablecoin-weekly-oracle/metadata`
- **Usage Token #0**: Uses contract-level URI `https://api.moluabi.com/simple-agent-usage-tokens/`

### Issue:
These URLs don't exist and don't return OpenSea-compatible JSON metadata with traits.

---

## ✅ Quick Fix Solutions

### Option 1: GitHub Raw URLs (Immediate Solution)

**Step 1**: I've created properly formatted metadata files:
- `metadata/agent-token-1.json` - Agent token with 15 traits
- `metadata/usage-token-0.json` - Usage token with 14 traits

**Step 2**: After pushing to GitHub, the URLs will be:
- `https://raw.githubusercontent.com/oregpt/core-agent-tokenization-evm/master/metadata/agent-token-1.json`
- `https://raw.githubusercontent.com/oregpt/core-agent-tokenization-evm/master/metadata/usage-token-0.json`

**Step 3**: Update contract metadata URIs or use OpenSea's override feature.

### Option 2: IPFS Hosting (Decentralized Solution)

Upload JSON files to IPFS and use those URLs:
1. Upload `agent-token-1.json` to IPFS → get `ipfs://QmXXXXX...` URL  
2. Upload `usage-token-0.json` to IPFS → get `ipfs://QmYYYYY...` URL
3. Update metadata URIs to point to IPFS

### Option 3: Your Own Hosting

Host the JSON files on your domain:
1. Upload files to `https://yourdomain.com/metadata/`
2. Ensure proper CORS headers for OpenSea access
3. Update metadata URIs

---

## 📋 Metadata Format (Already Created)

### Agent Token Traits (15 traits):
```json
{
  "name": "Stablecoin Weekly News Oracle",
  "attributes": [
    {"trait_type": "Agent Type", "value": "Market Intelligence"},
    {"trait_type": "Model", "value": "GPT4"},
    {"trait_type": "Modality", "value": "Text"},
    {"trait_type": "Integration", "value": "Gamma"},
    {"trait_type": "Knowledge Base", "value": "Industry Specific"},
    {"trait_type": "Language", "value": "English"},
    {"trait_type": "Domain", "value": "Finance"},
    {"trait_type": "Specialization", "value": "Stablecoin Analysis"},
    {"trait_type": "Output Format", "value": "Gamma.app Presentations"},
    {"trait_type": "Update Frequency", "value": "Weekly"},
    {"trait_type": "Source Count", "value": "150+"},
    {"trait_type": "Target Audience", "value": "DeFi Professionals"},
    {"trait_type": "Network", "value": "Base Mainnet"},
    {"trait_type": "Token Standard", "value": "ERC-721"},
    {"trait_type": "Status", "value": "Active"}
  ]
}
```

### Usage Token Traits (14 traits):
- Token Type, Access Tier, Model Access, Valid From/Until
- Duration, Features, Restrictions, Transferable status
- Agent Reference, Network, Token Standard, Status

---

## 🚀 Immediate Action Plan

### Step 1: Push Metadata to GitHub
```bash
git add metadata/ assets/
git commit -m "Add OpenSea-compatible metadata with traits for tokens"
git push origin master
```

### Step 2: Test GitHub Raw URLs
After push, test these URLs in browser:
- `https://raw.githubusercontent.com/oregpt/core-agent-tokenization-evm/master/metadata/agent-token-1.json`
- `https://raw.githubusercontent.com/oregpt/core-agent-tokenization-evm/master/metadata/usage-token-0.json`

### Step 3: Force OpenSea Refresh
1. Go to your tokens on OpenSea
2. Click "Refresh Metadata" button
3. Wait 10-15 minutes for OpenSea to re-index

### Step 4: Verify Traits Appear
Check your tokens on OpenSea - traits should now be visible!

---

## 🔧 Advanced Solutions

### Update Contract Metadata URIs
If you want to permanently fix the metadata URIs in your contracts, you'd need to:

1. **Deploy new contracts** with corrected base URIs, or
2. **Add admin functions** to update metadata URIs (requires contract upgrade)
3. **Use OpenSea's metadata override** feature (easiest)

### OpenSea Metadata Override
OpenSea allows metadata overrides:
1. Go to your collection settings on OpenSea
2. Upload metadata manually 
3. Override contract metadata with custom JSON

---

## 📊 Expected Traits Display

### Agent Token #1 Traits:
- **Agent Type**: Market Intelligence  
- **Model**: GPT4
- **Domain**: Finance
- **Specialization**: Stablecoin Analysis
- **Source Count**: 150+
- **Output Format**: Gamma.app Presentations
- **Network**: Base Mainnet
- **Status**: Active
- *...and 7 more traits*

### Usage Token #0 Traits:
- **Token Type**: Usage Rights
- **Access Tier**: Premium Limited
- **Model Access**: Grok Only
- **Valid Until**: December 31, 2025
- **Duration**: 118 days
- **Features**: Weekly reports, Gamma slides
- **Status**: Active
- *...and 7 more traits*

---

## ✅ Success Checklist

- [ ] Metadata JSON files created with proper OpenSea format
- [ ] Files pushed to GitHub repository  
- [ ] GitHub raw URLs accessible and return valid JSON
- [ ] OpenSea metadata refreshed for both tokens
- [ ] Traits visible on OpenSea token pages
- [ ] Images placeholder references ready for actual images

Once completed, your tokens will have rich, detailed trait displays on OpenSea and other marketplaces! 🎨✨
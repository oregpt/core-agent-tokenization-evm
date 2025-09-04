# 🔧 Metadata URI Implementation Guide

**Issue**: Current contracts have hardcoded metadata URIs that don't exist, preventing OpenSea trait display.  
**Solution**: Contract modifications and proper metadata endpoint setup for future deployments.

---

## 🚨 CURRENT PROBLEM

### **Deployed Contracts (Base Mainnet)**
- **SimpleAgentOwnershipToken**: `0xf241D4c20A5A578feA25269bb20143A83a5272fD`
- **SimpleAgentUsageToken**: `0x285f2A83ae846500ED876E143a0125D431cEd771`

### **Hardcoded URIs That Don't Work:**
```solidity
// In SimpleAgentOwnershipToken.sol constructor:
ERC721("SimpleAgentOwnershipToken", "SAOT")

// In createAgentOwnerToken function:
if (bytes(platformData.metadataURI).length > 0) {
    _setTokenURI(tokenId, platformData.metadataURI);  // Points to api.moluabi.com
}

// In SimpleAgentUsageToken.sol constructor:
ERC1155("https://api.moluabi.com/simple-agent-usage-tokens/")
```

### **Result**: 
- OpenSea tries to fetch metadata from `https://api.moluabi.com/...`
- URLs return 404 (don't exist)
- No traits, no images, no metadata display

---

## ✅ COMPLETE SOLUTION FOR FUTURE DEPLOYMENTS

### **1. Contract Code Changes Required**

#### **A. SimpleAgentOwnershipToken.sol - Key Changes**

**Current Problem Code:**
```solidity
// Line ~57: Constructor hardcodes base URI
constructor() 
    ERC721("SimpleAgentOwnershipToken", "SAOT") 
    ERC721URIStorage() 
    Ownable(msg.sender) 
{
    // No base URI control
}

// Line ~104: Sets metadata URI without validation
if (bytes(platformData.metadataURI).length > 0) {
    _setTokenURI(tokenId, platformData.metadataURI);
}
```

**FIXED Contract Code:**
```solidity
// Add state variable for base URI control
string private _baseTokenURI;

// Updated constructor with configurable base URI
constructor(string memory baseURI) 
    ERC721("SimpleAgentOwnershipToken", "SAOT") 
    ERC721URIStorage() 
    Ownable(msg.sender) 
{
    _baseTokenURI = baseURI;
}

// Add admin function to update base URI
function setBaseURI(string memory newBaseURI) external onlyOwner {
    _baseTokenURI = newBaseURI;
}

// Override _baseURI function
function _baseURI() internal view override returns (string memory) {
    return _baseTokenURI;
}

// Enhanced tokenURI function
function tokenURI(uint256 tokenId) 
    public 
    view 
    override(ERC721, ERC721URIStorage) 
    returns (string memory) 
{
    // Try specific token URI first
    string memory tokenSpecificURI = super.tokenURI(tokenId);
    if (bytes(tokenSpecificURI).length > 0) {
        return tokenSpecificURI;
    }
    
    // Fall back to base URI + token ID
    return string(abi.encodePacked(_baseURI(), tokenId.toString(), ".json"));
}

// Updated createAgentOwnerToken with optional custom URI
function createAgentOwnerToken(
    AgentIdentity memory identity,
    AgentAttribute[] memory attributes,
    PlatformInfo memory platformData,
    string[] memory metadataKeys,
    string[] memory metadataValues,
    string memory customTokenURI  // NEW: Optional custom URI
) external whenNotPaused nonReentrant returns (uint256) {
    // ... existing code ...
    
    // Set custom URI if provided, otherwise use base URI pattern
    if (bytes(customTokenURI).length > 0) {
        _setTokenURI(tokenId, customTokenURI);
    }
    // If no custom URI, tokenURI() will use base URI + token ID
    
    // ... rest of function ...
}
```

#### **B. SimpleAgentUsageToken.sol - Key Changes**

**Current Problem Code:**
```solidity
// Line ~58: Constructor hardcodes URI
constructor(address _ownershipTokenContract) 
    ERC1155("https://api.moluabi.com/simple-agent-usage-tokens/") 
    Ownable(msg.sender) 
{
    ownershipTokenContract = _ownershipTokenContract;
}
```

**FIXED Contract Code:**
```solidity
// Add state variable for URI control
string private _baseTokenURI;

// Updated constructor with configurable URI
constructor(address _ownershipTokenContract, string memory baseURI) 
    ERC1155(baseURI) 
    Ownable(msg.sender) 
{
    ownershipTokenContract = _ownershipTokenContract;
    _baseTokenURI = baseURI;
}

// Add admin function to update URI
function setURI(string memory newURI) external onlyOwner {
    _baseTokenURI = newURI;
    _setURI(newURI);
}

// Enhanced URI function for specific token metadata
function uri(uint256 tokenId) public view override returns (string memory) {
    return string(abi.encodePacked(_baseTokenURI, tokenId.toString(), ".json"));
}
```

### **2. Deployment Script Changes**

#### **Current Deployment (deploy.js) - PROBLEMATIC:**
```javascript
// Current - hardcoded URIs that don't work
const ownershipToken = await SimpleAgentOwnershipToken.deploy();
const usageToken = await SimpleAgentUsageToken.deploy(ownershipAddress);
```

#### **FIXED Deployment Script:**
```javascript
// deploy-with-metadata.js - NEW DEPLOYMENT SCRIPT
const { ethers } = require("hardhat");

async function main() {
    // Define your metadata base URIs
    const OWNERSHIP_BASE_URI = "https://raw.githubusercontent.com/oregpt/core-agent-tokenization-evm/master/metadata/agent-";
    const USAGE_BASE_URI = "https://raw.githubusercontent.com/oregpt/core-agent-tokenization-evm/master/metadata/usage-";
    
    // Deploy with proper base URIs
    const SimpleAgentOwnershipToken = await ethers.getContractFactory("SimpleAgentOwnershipToken");
    const ownershipToken = await SimpleAgentOwnershipToken.deploy(OWNERSHIP_BASE_URI);
    
    await ownershipToken.waitForDeployment();
    const ownershipAddress = await ownershipToken.getAddress();
    
    const SimpleAgentUsageToken = await ethers.getContractFactory("SimpleAgentUsageToken");
    const usageToken = await SimpleAgentUsageToken.deploy(ownershipAddress, USAGE_BASE_URI);
    
    await usageToken.waitForDeployment();
    const usageAddress = await usageToken.getAddress();
    
    // Connect contracts
    await ownershipToken.setUsageTokenContract(usageAddress);
    
    console.log("Contracts deployed with proper metadata URIs:");
    console.log(`Ownership: ${ownershipAddress}`);
    console.log(`Usage: ${usageAddress}`);
    console.log(`Ownership Base URI: ${OWNERSHIP_BASE_URI}`);
    console.log(`Usage Base URI: ${USAGE_BASE_URI}`);
}
```

### **3. Metadata File Structure**

#### **Required File Naming Convention:**
```
/metadata/
├── agent-1.json          # Agent Token ID 1
├── agent-2.json          # Agent Token ID 2
├── agent-N.json          # Agent Token ID N
├── usage-0.json          # Usage Token ID 0
├── usage-1.json          # Usage Token ID 1
└── usage-N.json          # Usage Token ID N
```

#### **Automated Metadata Generation Script:**
```javascript
// scripts/generate-metadata.js
const fs = require('fs');
const path = require('path');

async function generateAgentMetadata(tokenId, agentData) {
    const metadata = {
        name: agentData.name,
        description: agentData.description,
        image: `https://raw.githubusercontent.com/oregpt/core-agent-tokenization-evm/master/assets/agent-${tokenId}.png`,
        attributes: agentData.attributes.map(attr => ({
            trait_type: attr.attributeType,
            value: attr.attributeValue
        })),
        properties: {
            tokenId: tokenId,
            agentId: agentData.agentId,
            version: agentData.version,
            network: "Base Mainnet",
            contract: process.env.OWNERSHIP_CONTRACT_ADDRESS
        }
    };
    
    const filePath = path.join(__dirname, '..', 'metadata', `agent-${tokenId}.json`);
    fs.writeFileSync(filePath, JSON.stringify(metadata, null, 2));
    console.log(`Generated metadata: agent-${tokenId}.json`);
}

async function generateUsageMetadata(tokenId, usageData) {
    const metadata = {
        name: usageData.tokenName,
        description: usageData.tokenDescription,
        image: `https://raw.githubusercontent.com/oregpt/core-agent-tokenization-evm/master/assets/usage-${tokenId}.png`,
        attributes: Object.entries(usageData.metadata).map(([key, value]) => ({
            trait_type: key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()),
            value: value
        })),
        properties: {
            tokenId: tokenId,
            referencedAgentId: usageData.referencedAgentId,
            network: "Base Mainnet",
            contract: process.env.USAGE_CONTRACT_ADDRESS
        }
    };
    
    const filePath = path.join(__dirname, '..', 'metadata', `usage-${tokenId}.json`);
    fs.writeFileSync(filePath, JSON.stringify(metadata, null, 2));
    console.log(`Generated metadata: usage-${tokenId}.json`);
}
```

---

## 🔄 CURRENT CONTRACT WORKAROUND OPTIONS

### **Option 1: Build Missing API Endpoints**
Create `https://api.moluabi.com/` endpoints that serve your GitHub JSON:

```javascript
// Express.js server example
app.get('/agents/:agentId/metadata', (req, res) => {
    // Fetch from GitHub and return
    const githubUrl = `https://raw.githubusercontent.com/oregpt/core-agent-tokenization-evm/master/metadata/agent-1.json`;
    // Proxy request to GitHub
});

app.get('/simple-agent-usage-tokens/:tokenId', (req, res) => {
    const githubUrl = `https://raw.githubusercontent.com/oregpt/core-agent-tokenization-evm/master/metadata/usage-${req.params.tokenId}.json`;
    // Proxy request to GitHub  
});
```

### **Option 2: Update Contract URIs (If Possible)**
Check if your contracts have functions to update metadata URIs:

```javascript
// If your contract has setTokenURI function:
await ownershipContract.setTokenURI(1, "https://raw.githubusercontent.com/.../agent-1.json");

// If your contract has setURI function (ERC1155):
await usageContract.setURI("https://raw.githubusercontent.com/.../usage-");
```

### **Option 3: Deploy New Contracts**
Redeploy with the fixed contract code and proper base URIs.

---

## 🚀 RECOMMENDED DEPLOYMENT CHECKLIST

### **Pre-Deployment:**
- [ ] Update contract constructors to accept base URIs
- [ ] Add admin functions for URI updates  
- [ ] Create metadata generation scripts
- [ ] Prepare hosting (GitHub, IPFS, or custom domain)
- [ ] Generate all required JSON metadata files
- [ ] Upload token images to permanent storage

### **Deployment:**
- [ ] Deploy contracts with correct base URIs
- [ ] Verify metadata endpoints are accessible
- [ ] Test token creation and metadata display
- [ ] Validate OpenSea compatibility

### **Post-Deployment:**
- [ ] Monitor metadata accessibility
- [ ] Update URIs if hosting changes
- [ ] Generate new metadata for each new token
- [ ] Maintain consistent file naming convention

---

## 💡 BEST PRACTICES FOR PRODUCTION

### **1. Hosting Strategy**
- **GitHub**: Good for development, free but not permanent
- **IPFS**: Decentralized, permanent, best for production
- **Custom Domain**: Full control, requires maintenance
- **CDN**: Fast, reliable, good for high-traffic

### **2. Metadata Standards**
- Follow OpenSea metadata standards exactly
- Include all required fields: name, description, image, attributes
- Use consistent trait_type naming
- Provide fallback images for missing assets

### **3. Contract Design**
- Always make base URIs updateable by admin
- Include functions to update individual token URIs
- Consider using IPFS hashes for immutable metadata
- Plan for metadata schema changes

### **4. Testing Protocol**
- Test all metadata endpoints before deployment
- Verify OpenSea compatibility on testnet first
- Check image loading and trait display
- Validate JSON schema compliance

---

## 🎯 SUMMARY

**Root Cause**: Hardcoded metadata URIs in contracts point to non-existent endpoints.

**Immediate Fix**: Build API endpoints at `api.moluabi.com` or use OpenSea manual override.

**Long-term Solution**: Deploy new contracts with configurable metadata URIs and proper base URI management.

**Future Prevention**: Always deploy with working metadata endpoints and updateable URI functions.

---

**This guide ensures your next deployment will have perfect OpenSea integration from day one! 🌊✨**
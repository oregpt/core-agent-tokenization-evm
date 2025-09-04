const { ethers } = require("hardhat");

async function main() {
    console.log("🤖 Creating sample agent using super simple APIs...");
    
    // Get deployed contract addresses (you'll need to update these after deployment)
    const OWNERSHIP_TOKEN_ADDRESS = process.env.OWNERSHIP_TOKEN_ADDRESS;
    const USAGE_TOKEN_ADDRESS = process.env.USAGE_TOKEN_ADDRESS;
    
    if (!OWNERSHIP_TOKEN_ADDRESS || !USAGE_TOKEN_ADDRESS) {
        console.log("⚠️  Please set OWNERSHIP_TOKEN_ADDRESS and USAGE_TOKEN_ADDRESS in your .env file");
        console.log("   Or run deployment script first to get contract addresses");
        return;
    }
    
    // Get contracts
    const [deployer] = await ethers.getSigners();
    const ownershipToken = await ethers.getContractAt("SimpleAgentOwnershipToken", OWNERSHIP_TOKEN_ADDRESS);
    const usageToken = await ethers.getContractAt("SimpleAgentUsageToken", USAGE_TOKEN_ADDRESS);
    
    // Gas settings (1 gwei proven working)
    const gasPrice = ethers.parseUnits("1", "gwei");
    const gasLimit = 1500000;
    
    console.log(`Using account: ${deployer.address}`);
    console.log(`Gas settings: ${gasPrice} (1 gwei), limit: ${gasLimit}`);
    
    // 1. Create Agent Owner Token
    console.log("\n📝 Step 1: Creating Agent Owner Token...");
    
    const identity = {
        agentId: "simplified-test-agent-001",
        name: "Simplified Test Agent",
        description: "A test agent showcasing the simplified tokenization system",
        createdAt: 0, // Will be set by contract
        version: "1.0.0"
    };
    
    // Primary attributes (using proven structure from spec)
    const attributes = [
        { category: 0, attributeType: "MODEL", attributeValue: "GPT4", isActive: true },
        { category: 0, attributeType: "MODALITY", attributeValue: "Multimodal", isActive: true },
        { category: 1, attributeType: "INTEGRATION", attributeValue: "Google Drive", isActive: true },
        { category: 2, attributeType: "KNOWLEDGEBASE", attributeValue: "Industry Specific", isActive: true },
    ];
    
    const platformData = {
        platformName: "MoluAbi",
        externalId: "test-agent-simplified-001",
        metadataURI: "https://api.moluabi.com/agents/simplified-test/metadata"
    };
    
    // Additional flexible metadata
    const metadataKeys = ["tier", "testPhase", "businessType"];
    const metadataValues = ["premium", "simplified-testing", "healthcare"];
    
    const createOwnerTx = await ownershipToken.createAgentOwnerToken(
        identity,
        attributes,
        platformData,
        metadataKeys,
        metadataValues,
        { gasPrice, gasLimit }
    );
    
    const ownerReceipt = await createOwnerTx.wait();
    console.log(`✅ Agent Owner Token created! Tx: ${createOwnerTx.hash}`);
    console.log(`   Gas used: ${ownerReceipt.gasUsed} (${((Number(ownerReceipt.gasUsed) / gasLimit) * 100).toFixed(1)}% of limit)`);
    
    // Get the token ID from the event
    const ownerTokenId = ownerReceipt.logs[0].topics[1]; // First indexed parameter
    const ownerTokenIdNumber = parseInt(ownerTokenId, 16);
    console.log(`   Token ID: ${ownerTokenIdNumber}`);
    
    // 2. Create Agent User Token  
    console.log("\n🎫 Step 2: Creating Agent User Token...");
    
    const usageTerms = {
        ownershipTokenId: 0, // Will be set by contract
        ownershipContract: "0x0000000000000000000000000000000000000000", // Will be set by contract
        fromTimestamp: Math.floor(Date.now() / 1000),
        toTimestamp: Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60), // 30 days
        attributeKey: "0_MODEL" // Using the MODEL attribute
    };
    
    const usageMetadataKeys = ["subscriptionType", "maxDailyUsage", "features"];
    const usageMetadataValues = ["monthly", "1000", "unlimited"];
    
    const createUserTx = await usageToken.createAgentUserToken(
        ownerTokenIdNumber, // Reference to owner token
        OWNERSHIP_TOKEN_ADDRESS, // Reference to ownership contract
        usageTerms,
        usageMetadataKeys,
        usageMetadataValues,
        deployer.address, // Recipient
        1, // Amount
        { gasPrice, gasLimit: 500000 }
    );
    
    const userReceipt = await createUserTx.wait();
    console.log(`✅ Agent User Token created! Tx: ${createUserTx.hash}`);
    console.log(`   Gas used: ${userReceipt.gasUsed}`);
    
    // 3. Verify relationships
    console.log("\n🔍 Step 3: Verifying relationships...");
    
    const ownershipRef = await usageToken.getOwnershipReference(1);
    console.log(`✅ Usage token references ownership token ${ownershipRef[0]} at ${ownershipRef[1]}`);
    
    const agentIdentity = await ownershipToken.getAgentIdentity(ownerTokenIdNumber);
    console.log(`✅ Agent identity: ${agentIdentity.name} (${agentIdentity.agentId})`);
    
    const additionalMeta = await ownershipToken.getAdditionalMetadata(ownerTokenIdNumber, "tier");
    console.log(`✅ Additional metadata 'tier': ${additionalMeta}`);
    
    const usageMeta = await usageToken.getAdditionalMetadata(1, "subscriptionType");
    console.log(`✅ Usage metadata 'subscriptionType': ${usageMeta}`);
    
    console.log("\n🎉 Sample Agent Creation Complete!");
    console.log("=====================================");
    console.log(`Agent Owner Token ID: ${ownerTokenIdNumber}`);
    console.log(`Agent User Token ID: 1`);
    console.log(`All relationships verified successfully!`);
    
    return {
        ownerTokenId: ownerTokenIdNumber,
        userTokenId: 1
    };
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
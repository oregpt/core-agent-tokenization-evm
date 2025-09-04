const { ethers } = require("hardhat");

async function main() {
    console.log("🔍 DEBUG: Simple agent creation test");
    
    // Get deployed contract addresses
    const OWNERSHIP_ADDRESS = "0x19e38F61C74dEC79C743B0502eA837e6a37fBd00";
    
    const [deployer] = await ethers.getSigners();
    console.log(`Using account: ${deployer.address}`);
    
    const ownershipContract = await ethers.getContractAt("SimpleAgentOwnershipToken", OWNERSHIP_ADDRESS);
    
    const gasPrice = ethers.parseUnits("1.1", "gwei");
    
    // Simple test data
    const identity = {
        agentId: "debug-test-001",
        name: "Debug Test",
        description: "Simple debug test",
        createdAt: 0,
        version: "1.0"
    };
    
    const attributes = [
        { category: 0, attributeType: "MODEL", attributeValue: "GPT4", isActive: true }
    ];
    
    const platformData = {
        platformName: "Test",
        externalId: "debug-001", 
        metadataURI: ""
    };
    
    const metadataKeys = ["test"];
    const metadataValues = ["debug"];
    
    console.log("Creating simple agent...");
    
    try {
        // Check if agent ID already exists
        const existing = await ownershipContract.getTokenIdFromAgentId("debug-test-001");
        if (existing > 0) {
            console.log("Agent ID already exists, using different ID");
            identity.agentId = "debug-test-" + Date.now();
        }
        
        const tx = await ownershipContract.createAgentOwnerToken(
            identity,
            attributes,
            platformData,
            metadataKeys,
            metadataValues,
            { gasPrice, gasLimit: 1500000 }
        );
        
        const receipt = await tx.wait();
        console.log(`✅ Agent created! Gas used: ${receipt.gasUsed}`);
        console.log(`Transaction hash: ${tx.hash}`);
        
        // Get total agents
        const total = await ownershipContract.totalAgents();
        console.log(`Total agents: ${total}`);
        
    } catch (error) {
        console.error("❌ Error creating agent:", error.message);
        
        // Try to get more details
        if (error.transaction) {
            console.log("Transaction details:", error.transaction);
        }
        if (error.receipt) {
            console.log("Receipt status:", error.receipt.status);
            console.log("Gas used:", error.receipt.gasUsed);
        }
    }
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
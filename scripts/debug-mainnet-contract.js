const { ethers } = require("hardhat");

async function main() {
    console.log("🔍 DEBUG: Mainnet Contract Status");
    console.log("=================================");
    
    const OWNERSHIP_ADDRESS = "0xf241D4c20A5A578feA25269bb20143A83a5272fD";
    const USAGE_ADDRESS = "0x285f2A83ae846500ED876E143a0125D431cEd771";
    
    const [deployer] = await ethers.getSigners();
    console.log(`Account: ${deployer.address}`);
    
    const ownershipContract = await ethers.getContractAt("SimpleAgentOwnershipToken", OWNERSHIP_ADDRESS);
    
    try {
        // Check basic contract state
        console.log("\n📊 Contract State:");
        const totalAgents = await ownershipContract.totalAgents();
        console.log(`Total agents: ${totalAgents}`);
        
        const usageContract = await ownershipContract.usageTokenContract();
        console.log(`Connected usage contract: ${usageContract}`);
        console.log(`Expected usage contract: ${USAGE_ADDRESS}`);
        console.log(`Connection status: ${usageContract === USAGE_ADDRESS ? '✅' : '❌'}`);
        
        // Check contract owner
        const contractOwner = await ownershipContract.owner();
        console.log(`Contract owner: ${contractOwner}`);
        console.log(`Deployer address: ${deployer.address}`);
        console.log(`Is owner: ${contractOwner === deployer.address ? '✅' : '❌'}`);
        
        // Check if paused
        const isPaused = await ownershipContract.paused();
        console.log(`Contract paused: ${isPaused ? '❌ YES' : '✅ NO'}`);
        
        console.log("\n🧪 Simple Test - Create Minimal Agent:");
        
        // Try with minimal data first
        const simpleIdentity = {
            agentId: "test-" + Date.now(),
            name: "Test Agent",
            description: "Simple test",
            createdAt: Math.floor(Date.now() / 1000),
            version: "1.0"
        };
        
        const simpleAttributes = [
            { category: 0, attributeType: "MODEL", attributeValue: "GPT4", isActive: true }
        ];
        
        const simplePlatform = {
            platformName: "Test",
            externalId: "test-001",
            metadataURI: ""
        };
        
        const simpleKeys = ["test"];
        const simpleValues = ["debug"];
        
        console.log("Attempting to create simple agent...");
        
        const gasPrice = ethers.parseUnits("2.5", "gwei");
        
        const tx = await ownershipContract.createAgentOwnerToken(
            simpleIdentity,
            simpleAttributes,
            simplePlatform,
            simpleKeys,
            simpleValues,
            { 
                gasPrice,
                gasLimit: 2000000
            }
        );
        
        console.log(`Transaction sent: ${tx.hash}`);
        const receipt = await tx.wait();
        
        console.log("✅ Simple agent created successfully!");
        console.log(`Gas used: ${receipt.gasUsed}`);
        
        const newTotal = await ownershipContract.totalAgents();
        console.log(`New total agents: ${newTotal}`);
        
    } catch (error) {
        console.error("❌ Debug failed:", error.message);
        
        // Try to get more specific error info
        if (error.code === 'CALL_EXCEPTION') {
            console.log("\n🔍 Call Exception Details:");
            console.log("- This usually means the function call reverted");
            console.log("- Common causes: contract paused, insufficient permissions, invalid data");
        }
        
        // Check if it's a specific revert reason
        if (error.reason) {
            console.log(`Revert reason: ${error.reason}`);
        }
        
        if (error.data) {
            console.log(`Error data: ${error.data}`);
        }
    }
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
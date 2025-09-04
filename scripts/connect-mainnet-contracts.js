const { ethers } = require("hardhat");

async function main() {
    console.log("🔗 Connecting Mainnet Contracts...");
    
    // Contract addresses
    const ownershipAddress = "0xf241D4c20A5A578feA25269bb20143A83a5272fD";
    const usageAddress = "0x285f2A83ae846500ED876E143a0125D431cEd771";
    
    console.log(`Ownership Contract: ${ownershipAddress}`);
    console.log(`Usage Contract: ${usageAddress}`);
    
    // Use higher gas price to avoid underpriced issues
    const gasPrice = ethers.parseUnits("3", "gwei");
    console.log(`Using gas price: 3 gwei`);
    
    // Connect to ownership contract
    const ownershipToken = await ethers.getContractAt("SimpleAgentOwnershipToken", ownershipAddress);
    
    console.log("Setting usage token contract reference...");
    const connectTx = await ownershipToken.setUsageTokenContract(usageAddress, {
        gasPrice: gasPrice,
        gasLimit: 150000
    });
    
    console.log(`Transaction sent: ${connectTx.hash}`);
    const receipt = await connectTx.wait();
    console.log(`✅ Connection completed! Gas used: ${receipt.gasUsed}`);
    
    // Verify connection
    const connectedUsageAddress = await ownershipToken.usageTokenContract();
    if (connectedUsageAddress === usageAddress) {
        console.log("✅ Contract connection verified!");
    } else {
        console.log("❌ Connection verification failed");
    }
    
    console.log("\n🎉 MAINNET CONTRACTS FULLY CONNECTED!");
    console.log("====================================");
    console.log(`✅ SimpleAgentOwnershipToken: ${ownershipAddress}`);
    console.log(`✅ SimpleAgentUsageToken: ${usageAddress}`);
    console.log(`✅ Contracts are connected and ready for use!`);
    
    return { ownershipAddress, usageAddress };
}

main().catch((error) => {
    console.error("❌ Connection failed:", error);
    process.exitCode = 1;
});
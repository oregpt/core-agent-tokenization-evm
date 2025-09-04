const { ethers } = require("hardhat");

async function main() {
    console.log("🚀 Deploying to Base Mainnet...");
    
    // Verify we're on mainnet
    const network = await ethers.provider.getNetwork();
    if (network.chainId !== 8453n) {
        throw new Error(`Expected Base Mainnet (8453) but connected to chain ${network.chainId}`);
    }
    
    console.log(`✅ Connected to Base Mainnet (Chain ID: ${network.chainId})`);
    console.log("⚠️  MAINNET DEPLOYMENT - This will use real ETH!");
    
    // Wait 5 seconds for user to cancel if needed
    console.log("Waiting 5 seconds... Cancel now if not intended!");
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Run the main deployment
    const contracts = await require('./deploy.js');
    
    console.log("\n🎉 MAINNET DEPLOYMENT COMPLETE!");
    console.log("Your SimplifiedAgentTokenization system is now live on Base Mainnet!");
    
    return contracts;
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
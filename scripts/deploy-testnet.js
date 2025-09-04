const { ethers } = require("hardhat");

async function main() {
    console.log("🧪 Deploying to Base Sepolia Testnet...");
    
    // Verify we're on testnet
    const network = await ethers.provider.getNetwork();
    if (network.chainId !== 84532n) {
        throw new Error(`Expected Base Sepolia (84532) but connected to chain ${network.chainId}`);
    }
    
    console.log(`✅ Connected to Base Sepolia (Chain ID: ${network.chainId})`);
    
    // Run the main deployment
    const contracts = await require('./deploy.js');
    
    console.log("\n🔍 Testnet Deployment Complete!");
    console.log("Ready for comprehensive testing before mainnet deployment.");
    
    return contracts;
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
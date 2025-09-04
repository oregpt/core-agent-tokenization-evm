const { ethers } = require("hardhat");

async function main() {
    console.log("🚀 Continuing Base Mainnet Deployment...");
    
    // Verify we're on mainnet
    const network = await ethers.provider.getNetwork();
    if (network.chainId !== 8453n) {
        throw new Error(`Expected Base Mainnet (8453) but connected to chain ${network.chainId}`);
    }
    
    console.log(`✅ Connected to Base Mainnet (Chain ID: ${network.chainId})`);
    
    // Get signers
    const [deployer] = await ethers.getSigners();
    console.log(`Deploying with account: ${deployer.address}`);
    
    // Check balance
    const balance = await ethers.provider.getBalance(deployer.address);
    console.log(`Account balance: ${ethers.formatEther(balance)} ETH`);
    
    // ALREADY DEPLOYED CONTRACT
    const ownershipAddress = "0xf241D4c20A5A578feA25269bb20143A83a5272fD";
    console.log(`✅ Using existing SimpleAgentOwnershipToken: ${ownershipAddress}`);
    
    // Gas settings (increased for mainnet)
    const gasPrice = ethers.parseUnits("2.5", "gwei");
    console.log(`Using gas price: ${gasPrice} (2.5 gwei)`);
    
    // Deploy SimpleAgentUsageToken only
    console.log("\n📝 Deploying SimpleAgentUsageToken...");
    const SimpleAgentUsageToken = await ethers.getContractFactory("SimpleAgentUsageToken");
    const usageToken = await SimpleAgentUsageToken.deploy(ownershipAddress, {
        gasPrice: gasPrice,
        gasLimit: 3000000
    });
    
    await usageToken.waitForDeployment();
    const usageAddress = await usageToken.getAddress();
    console.log(`✅ SimpleAgentUsageToken deployed to: ${usageAddress}`);
    
    // Connect contracts
    console.log("\n🔗 Connecting contracts...");
    const ownershipToken = await ethers.getContractAt("SimpleAgentOwnershipToken", ownershipAddress);
    
    const connectTx = await ownershipToken.setUsageTokenContract(usageAddress, {
        gasPrice: gasPrice,
        gasLimit: 100000
    });
    
    await connectTx.wait();
    console.log("✅ Ownership token connected to usage token");
    
    console.log("\n🎉 MAINNET DEPLOYMENT COMPLETE!");
    console.log("===============================");
    console.log(`SimpleAgentOwnershipToken: ${ownershipAddress}`);
    console.log(`SimpleAgentUsageToken: ${usageAddress}`);
    console.log(`Network: Base Mainnet`);
    console.log(`Deployer: ${deployer.address}`);
    
    // Final balance check
    const finalBalance = await ethers.provider.getBalance(deployer.address);
    const gasUsed = balance - finalBalance;
    console.log(`Total gas used: ${ethers.formatEther(gasUsed)} ETH`);
    
    console.log("\n🚀 SimplifiedAgentTokenization is now LIVE on Base Mainnet!");
    console.log("Contracts deployed with NO sample tokens - ready for production use!");
    
    return {
        ownershipToken: ownershipAddress,
        usageToken: usageAddress
    };
}

main().catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exitCode = 1;
});
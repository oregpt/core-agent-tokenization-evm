const { ethers } = require("hardhat");

async function main() {
    console.log("🚀 Deploying SimplifiedAgentTokenization contracts...");
    
    // Get signers
    const [deployer] = await ethers.getSigners();
    console.log(`Deploying with account: ${deployer.address}`);
    
    // Check balance
    const balance = await ethers.provider.getBalance(deployer.address);
    console.log(`Account balance: ${ethers.formatEther(balance)} ETH`);
    
    // Gas settings (increased for mainnet)
    const gasPrice = ethers.parseUnits("2", "gwei");
    console.log(`Using gas price: ${gasPrice} (2 gwei)`);
    
    // Deploy SimpleAgentOwnershipToken
    console.log("\n📝 Deploying SimpleAgentOwnershipToken...");
    const SimpleAgentOwnershipToken = await ethers.getContractFactory("SimpleAgentOwnershipToken");
    const ownershipToken = await SimpleAgentOwnershipToken.deploy({
        gasPrice: gasPrice
    });
    
    await ownershipToken.waitForDeployment();
    const ownershipAddress = await ownershipToken.getAddress();
    console.log(`✅ SimpleAgentOwnershipToken deployed to: ${ownershipAddress}`);
    
    // Deploy SimpleAgentUsageToken
    console.log("\n📝 Deploying SimpleAgentUsageToken...");
    const SimpleAgentUsageToken = await ethers.getContractFactory("SimpleAgentUsageToken");
    const usageToken = await SimpleAgentUsageToken.deploy(ownershipAddress, {
        gasPrice: gasPrice
    });
    
    await usageToken.waitForDeployment();
    const usageAddress = await usageToken.getAddress();
    console.log(`✅ SimpleAgentUsageToken deployed to: ${usageAddress}`);
    
    // Connect contracts
    console.log("\n🔗 Connecting contracts...");
    await ownershipToken.setUsageTokenContract(usageAddress, {
        gasPrice: gasPrice
    });
    console.log("✅ Ownership token connected to usage token");
    
    console.log("\n🎉 Deployment Summary:");
    console.log("========================");
    console.log(`SimpleAgentOwnershipToken: ${ownershipAddress}`);
    console.log(`SimpleAgentUsageToken: ${usageAddress}`);
    console.log(`Network: ${hre.network.name}`);
    console.log(`Deployer: ${deployer.address}`);
    
    // Final balance check
    const finalBalance = await ethers.provider.getBalance(deployer.address);
    const gasUsed = balance - finalBalance;
    console.log(`Gas used: ${ethers.formatEther(gasUsed)} ETH`);
    
    return {
        ownershipToken: ownershipAddress,
        usageToken: usageAddress
    };
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
const { ethers } = require("hardhat");

async function main() {
    console.log("🎫 Creating Usage Token for Stablecoin Weekly News Oracle");
    console.log("========================================================");
    
    // Deployed mainnet contract addresses
    const OWNERSHIP_ADDRESS = "0xf241D4c20A5A578feA25269bb20143A83a5272fD";
    const USAGE_ADDRESS = "0x285f2A83ae846500ED876E143a0125D431cEd771";
    const AGENT_TOKEN_ID = 1; // The agent we just created
    
    // Verify network
    const network = await ethers.provider.getNetwork();
    if (network.chainId !== 8453n) {
        throw new Error(`Expected Base Mainnet (8453) but connected to chain ${network.chainId}`);
    }
    console.log(`✅ Connected to Base Mainnet (Chain ID: ${network.chainId})`);
    
    const [deployer] = await ethers.getSigners();
    console.log(`Creating usage token with account: ${deployer.address}`);
    
    // Check balance
    const balance = await ethers.provider.getBalance(deployer.address);
    console.log(`Account balance: ${ethers.formatEther(balance)} ETH\n`);
    
    // Connect to contracts
    const ownershipContract = await ethers.getContractAt("SimpleAgentOwnershipToken", OWNERSHIP_ADDRESS);
    const usageContract = await ethers.getContractAt("SimpleAgentUsageToken", USAGE_ADDRESS);
    
    // Verify ownership of the agent token
    const tokenOwner = await ownershipContract.ownerOf(AGENT_TOKEN_ID);
    if (tokenOwner !== deployer.address) {
        throw new Error(`You don't own agent token ${AGENT_TOKEN_ID}. Owner is ${tokenOwner}`);
    }
    console.log(`✅ Verified ownership of Agent Token #${AGENT_TOKEN_ID}`);
    
    // Time configuration
    const fromTimestamp = Math.floor(Date.now() / 1000); // September 4, 2025 (now)
    const toTimestamp = Math.floor(new Date('2025-12-31T23:59:59Z').getTime() / 1000); // December 31, 2025
    
    const daysRemaining = Math.floor((toTimestamp - fromTimestamp) / (24 * 60 * 60));
    console.log(`Usage Period: ${daysRemaining} days (Sep 4 - Dec 31, 2025)`);
    
    // Usage Terms
    const usageTerms = {
        ownershipTokenId: 0, // Will be set by contract
        ownershipContract: ethers.ZeroAddress, // Will be set by contract  
        fromTimestamp: fromTimestamp,
        toTimestamp: toTimestamp,
        attributeKey: "GROK_LIMITED_ACCESS" // Represents Grok-only access pattern
    };
    
    // Usage Token Metadata
    const metadataKeys = [
        "tokenName",
        "tokenDescription", 
        "subscriptionTier",
        "modelAccess",
        "includedFeatures",
        "restrictions",
        "transferable",
        "validUntil",
        "includedAttributes"
    ];
    
    const metadataValues = [
        "Stablecoin Weekly News Oracle - End of Year Access",
        "Usage rights for Stablecoin Weekly News Oracle with Grok model access, text analysis, Gamma integration, industry knowledge, English processing, and finance domain expertise. Valid through December 31, 2025.",
        "Premium Limited",
        "Grok Only", 
        "Weekly reports, Gamma slides, breaking news alerts",
        "No GPT4/Claude model access",
        "Yes",
        "December 31, 2025",
        "Text, Gamma, Industry Specific, English, Finance"
    ];
    
    // Gas settings
    const gasPrice = ethers.parseUnits("2.5", "gwei");
    console.log(`Using gas price: 2.5 gwei\n`);
    
    console.log("📋 Usage Token Details:");
    console.log(`Name: ${metadataValues[0]}`);
    console.log(`Model Access: ${metadataValues[3]}`);
    console.log(`Tier: ${metadataValues[2]}`);
    console.log(`Duration: ${daysRemaining} days`);
    console.log(`Recipient: ${deployer.address} (you)`);
    console.log(`Amount: 1 token\n`);
    
    try {
        console.log("🚀 Creating usage token...");
        
        const tx = await usageContract.createAgentUserToken(
            AGENT_TOKEN_ID,           // ownershipTokenId (references our agent)
            OWNERSHIP_ADDRESS,        // ownershipContract address
            usageTerms,              // usage terms with time period
            metadataKeys,            // metadata keys
            metadataValues,          // metadata values
            deployer.address,        // recipient (you get the usage token)
            1,                       // amount (1 copy)
            { 
                gasPrice,
                gasLimit: 1000000
            }
        );
        
        console.log(`Transaction sent: ${tx.hash}`);
        console.log("Waiting for confirmation...");
        
        const receipt = await tx.wait();
        
        // Get the usage token ID that was created
        const totalUsageTokens = await usageContract.totalUsageTokens();
        const usageTokenId = Number(totalUsageTokens);
        
        console.log("\n🎉 SUCCESS! Usage Token Created");
        console.log("===============================");
        console.log(`✅ Transaction Hash: ${tx.hash}`);
        console.log(`✅ Gas Used: ${receipt.gasUsed}`);
        console.log(`✅ Usage Token ID: ${usageTokenId}`);
        console.log(`✅ References Agent Token ID: ${AGENT_TOKEN_ID}`);
        console.log(`✅ Owner: ${deployer.address}`);
        console.log(`✅ Contract: ${USAGE_ADDRESS}`);
        
        // Calculate cost
        const costWei = BigInt(receipt.gasUsed) * gasPrice;
        const costEth = ethers.formatEther(costWei);
        const costUSD = (parseFloat(costEth) * 2500).toFixed(2);
        
        console.log(`\n💰 Creation Cost:`);
        console.log(`   Gas: ${receipt.gasUsed}`);
        console.log(`   Cost: ${costEth} ETH (~$${costUSD})`);
        
        console.log(`\n🔗 View on BaseScan:`);
        console.log(`   Transaction: https://basescan.org/tx/${tx.hash}`);
        console.log(`   Usage Contract: https://basescan.org/address/${USAGE_ADDRESS}`);
        console.log(`   Usage Token ID: ${usageTokenId}`);
        
        console.log(`\n📊 Usage Token Summary:`);
        console.log(`   Name: ${metadataValues[0]}`);
        console.log(`   Access: ${metadataValues[3]} model only`);
        console.log(`   Features: ${metadataValues[4]}`);
        console.log(`   Valid Until: ${metadataValues[7]}`);
        console.log(`   Restrictions: ${metadataValues[5]}`);
        console.log(`   Transferable: ${metadataValues[6]}`);
        
        // Verify the usage token relationship
        console.log(`\n🔍 Verification:`);
        const [refTokenId, refContract] = await usageContract.getOwnershipReference(usageTokenId);
        console.log(`   ✅ References Agent Token: #${refTokenId}`);
        console.log(`   ✅ References Contract: ${refContract}`);
        console.log(`   ✅ Relationship Valid: ${refTokenId == AGENT_TOKEN_ID && refContract === OWNERSHIP_ADDRESS ? 'YES' : 'NO'}`);
        
        // Check usage balance
        const usageBalance = await usageContract.balanceOf(deployer.address, usageTokenId);
        console.log(`   ✅ Your Balance: ${usageBalance} usage token(s)`);
        
        // Check if usage period is active
        const isActive = await usageContract.isUsagePeriodActive(usageTokenId);
        console.log(`   ✅ Currently Active: ${isActive ? 'YES' : 'NO'}`);
        
        return {
            usageTokenId,
            transactionHash: tx.hash,
            usageContract: USAGE_ADDRESS,
            referencedAgentId: AGENT_TOKEN_ID,
            owner: deployer.address,
            gasUsed: receipt.gasUsed,
            cost: costEth,
            validUntil: new Date(toTimestamp * 1000).toISOString()
        };
        
    } catch (error) {
        console.error("❌ Failed to create usage token:", error.message);
        
        if (error.message.includes("NotOwnershipTokenOwner")) {
            console.log("💡 You must own the agent token to create usage tokens for it.");
        } else if (error.message.includes("OwnershipTokenDoesNotExist")) {
            console.log("💡 The referenced agent token does not exist.");
        } else if (error.message.includes("insufficient funds")) {
            console.log("💡 Add more ETH to your wallet for gas fees.");
        }
        
        throw error;
    }
}

main().catch((error) => {
    console.error("💥 USAGE TOKEN CREATION FAILED:");
    console.error(error);
    process.exitCode = 1;
});
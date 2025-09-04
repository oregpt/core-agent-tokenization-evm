const { ethers } = require("hardhat");

async function main() {
    console.log("🤖 Creating Stablecoin Weekly News Oracle Agent");
    console.log("===============================================");
    
    // Deployed mainnet contract address
    const OWNERSHIP_ADDRESS = "0xf241D4c20A5A578feA25269bb20143A83a5272fD";
    
    // Verify network
    const network = await ethers.provider.getNetwork();
    if (network.chainId !== 8453n) {
        throw new Error(`Expected Base Mainnet (8453) but connected to chain ${network.chainId}`);
    }
    console.log(`✅ Connected to Base Mainnet (Chain ID: ${network.chainId})`);
    
    const [deployer] = await ethers.getSigners();
    console.log(`Creating agent with account: ${deployer.address}`);
    
    // Check balance
    const balance = await ethers.provider.getBalance(deployer.address);
    console.log(`Account balance: ${ethers.formatEther(balance)} ETH\n`);
    
    // Connect to ownership contract
    const ownershipContract = await ethers.getContractAt("SimpleAgentOwnershipToken", OWNERSHIP_ADDRESS);
    
    // Agent Identity (shortened description for gas efficiency)
    const identity = {
        agentId: "stablecoin-weekly-oracle-001",
        name: "Stablecoin Weekly News Oracle",
        description: "AI-powered stablecoin market intelligence agent monitoring 150+ sources across 6 ecosystem categories to curate top 10 weekly developments by market impact. Generates Gamma.app presentations for DeFi professionals and institutional investors. Specializes in Circle, Tether, MakerDAO, regulatory developments, and cross-chain innovations.",
        createdAt: Math.floor(Date.now() / 1000),
        version: "1.0.0"
    };
    
    // Structured Attributes (from your specification)
    const attributes = [
        { category: 0, attributeType: "MODEL", attributeValue: "GPT4", isActive: true },
        { category: 0, attributeType: "MODALITY", attributeValue: "Text", isActive: true },
        { category: 1, attributeType: "INTEGRATION", attributeValue: "Gamma", isActive: true },
        { category: 2, attributeType: "KNOWLEDGEBASE", attributeValue: "Industry Specific", isActive: true },
        { category: 3, attributeType: "LANGUAGE", attributeValue: "English", isActive: true },
        { category: 4, attributeType: "DOMAIN", attributeValue: "Finance", isActive: true }
    ];
    
    // Platform Data
    const platformData = {
        platformName: "MoluAbi",
        externalId: "stablecoin-oracle-mainnet",
        metadataURI: "https://api.moluabi.com/agents/stablecoin-weekly-oracle/metadata"
    };
    
    // Additional Metadata (flexible key-value pairs)
    const metadataKeys = [
        "category",
        "specialization", 
        "outputFormat",
        "updateFrequency",
        "sourceCount",
        "targetAudience",
        "ecosystemCategories",
        "keyFocusAreas"
    ];
    
    const metadataValues = [
        "Market Intelligence",
        "Stablecoin Analysis",
        "Gamma.app Presentations",
        "Weekly",
        "150+",
        "DeFi Professionals, Institutional Investors, Protocol Teams",
        "Issuers, Protocols, Infrastructure, Networks, Regulators, Institutions",
        "Circle, Tether, MakerDAO, Regulatory, Cross-chain"
    ];
    
    // Gas settings for mainnet (increased for reliability)
    const gasPrice = ethers.parseUnits("2.5", "gwei");
    console.log(`Using gas price: 2.5 gwei\n`);
    
    console.log("📋 Agent Details:");
    console.log(`Name: ${identity.name}`);
    console.log(`Agent ID: ${identity.agentId}`);
    console.log(`Attributes: ${attributes.length} configured`);
    console.log(`Metadata Fields: ${metadataKeys.length} additional fields\n`);
    
    try {
        console.log("🚀 Creating agent owner token...");
        
        const tx = await ownershipContract.createAgentOwnerToken(
            identity,
            attributes,
            platformData,
            metadataKeys,
            metadataValues,
            { 
                gasPrice,
                gasLimit: 2000000
            }
        );
        
        console.log(`Transaction sent: ${tx.hash}`);
        console.log("Waiting for confirmation...");
        
        const receipt = await tx.wait();
        
        // Get the token ID that was created
        const totalAgents = await ownershipContract.totalAgents();
        const tokenId = Number(totalAgents);
        
        console.log("\n🎉 SUCCESS! Agent Owner Token Created");
        console.log("====================================");
        console.log(`✅ Transaction Hash: ${tx.hash}`);
        console.log(`✅ Gas Used: ${receipt.gasUsed}`);
        console.log(`✅ Token ID: ${tokenId}`);
        console.log(`✅ Owner: ${deployer.address}`);
        console.log(`✅ Contract: ${OWNERSHIP_ADDRESS}`);
        
        // Calculate cost
        const costWei = BigInt(receipt.gasUsed) * gasPrice;
        const costEth = ethers.formatEther(costWei);
        const costUSD = (parseFloat(costEth) * 2500).toFixed(2); // Approximate ETH price
        
        console.log(`\n💰 Creation Cost:`);
        console.log(`   Gas: ${receipt.gasUsed}`);
        console.log(`   Cost: ${costEth} ETH (~$${costUSD})`);
        
        console.log(`\n🔗 View on BaseScan:`);
        console.log(`   Transaction: https://basescan.org/tx/${tx.hash}`);
        console.log(`   Contract: https://basescan.org/address/${OWNERSHIP_ADDRESS}`);
        console.log(`   Token ID: ${tokenId}`);
        
        console.log(`\n📊 Agent Summary:`);
        console.log(`   Name: ${identity.name}`);
        console.log(`   Specialization: Stablecoin Market Intelligence`);
        console.log(`   Model: GPT4 | Output: Gamma.app Presentations`);
        console.log(`   Sources: 150+ across 6 ecosystem categories`);
        console.log(`   Audience: DeFi Professionals & Institutional Investors`);
        
        // Verify the agent was created correctly
        console.log(`\n🔍 Verification:`);
        const storedIdentity = await ownershipContract.getAgentIdentity(tokenId);
        const storedAttributes = await ownershipContract.getAgentAttributes(tokenId);
        
        console.log(`   ✅ Stored Name: "${storedIdentity.name}"`);
        console.log(`   ✅ Attributes Count: ${storedAttributes.length}`);
        console.log(`   ✅ Agent ID: "${storedIdentity.agentId}"`);
        
        return {
            tokenId,
            transactionHash: tx.hash,
            contractAddress: OWNERSHIP_ADDRESS,
            owner: deployer.address,
            gasUsed: receipt.gasUsed,
            cost: costEth
        };
        
    } catch (error) {
        console.error("❌ Failed to create agent:", error.message);
        
        if (error.message.includes("Agent ID already exists")) {
            console.log("💡 Suggestion: The agent ID might already be taken. Try with a different agent ID.");
        } else if (error.message.includes("insufficient funds")) {
            console.log("💡 Suggestion: Add more ETH to your wallet for gas fees.");
        } else {
            console.log("💡 Check the error details above and try again.");
        }
        
        throw error;
    }
}

main().catch((error) => {
    console.error("💥 AGENT CREATION FAILED:");
    console.error(error);
    process.exitCode = 1;
});
const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("SimplifiedAgentTokenization", function () {
    let ownershipToken;
    let usageToken;
    let owner;
    let user1;
    let user2;

    beforeEach(async function () {
        // Get signers
        [owner, user1, user2] = await ethers.getSigners();
        
        // Deploy SimpleAgentOwnershipToken
        const SimpleAgentOwnershipToken = await ethers.getContractFactory("SimpleAgentOwnershipToken");
        ownershipToken = await SimpleAgentOwnershipToken.deploy();
        await ownershipToken.waitForDeployment();
        
        // Deploy SimpleAgentUsageToken
        const SimpleAgentUsageToken = await ethers.getContractFactory("SimpleAgentUsageToken");
        usageToken = await SimpleAgentUsageToken.deploy(await ownershipToken.getAddress());
        await usageToken.waitForDeployment();
        
        // Connect contracts
        await ownershipToken.setUsageTokenContract(await usageToken.getAddress());
    });

    describe("Agent Owner Token Creation", function () {
        it("Should create an agent owner token with structured attributes", async function () {
            const identity = {
                agentId: "test-agent-001",
                name: "Test Agent",
                description: "A test agent for simplified tokenization",
                createdAt: 0, // Will be set by contract
                version: "1.0.0"
            };

            const attributes = [
                { category: 0, attributeType: "MODEL", attributeValue: "GPT4", isActive: true },
                { category: 0, attributeType: "MODALITY", attributeValue: "Multimodal", isActive: true }
            ];

            const platformData = {
                platformName: "MoluAbi",
                externalId: "test-001",
                metadataURI: "https://api.test.com/metadata"
            };

            const metadataKeys = ["tier", "businessType"];
            const metadataValues = ["premium", "healthcare"];

            const tx = await ownershipToken.createAgentOwnerToken(
                identity,
                attributes,
                platformData,
                metadataKeys,
                metadataValues
            );

            const receipt = await tx.wait();
            
            // Check that event was emitted
            expect(receipt.logs.length).to.be.greaterThan(0);
            
            // Verify token was minted
            expect(await ownershipToken.ownerOf(1)).to.equal(owner.address);
            
            // Verify data was stored
            const storedIdentity = await ownershipToken.getAgentIdentity(1);
            expect(storedIdentity.name).to.equal("Test Agent");
            expect(storedIdentity.agentId).to.equal("test-agent-001");
            
            // Verify attributes
            const storedAttributes = await ownershipToken.getAgentAttributes(1);
            expect(storedAttributes.length).to.equal(2);
            expect(storedAttributes[0].attributeType).to.equal("MODEL");
            expect(storedAttributes[0].attributeValue).to.equal("GPT4");
            
            // Verify metadata
            const tierValue = await ownershipToken.getAdditionalMetadata(1, "tier");
            expect(tierValue).to.equal("premium");
        });

        it("Should prevent duplicate agent IDs", async function () {
            const identity1 = {
                agentId: "duplicate-test",
                name: "First Agent",
                description: "First agent",
                createdAt: 0,
                version: "1.0.0"
            };

            const identity2 = {
                agentId: "duplicate-test", // Same ID
                name: "Second Agent",
                description: "Second agent",
                createdAt: 0,
                version: "1.0.0"
            };

            // Create first agent
            await ownershipToken.createAgentOwnerToken(identity1, [], {platformName: "", externalId: "", metadataURI: ""}, [], []);
            
            // Try to create second agent with same ID - should fail
            await expect(
                ownershipToken.createAgentOwnerToken(identity2, [], {platformName: "", externalId: "", metadataURI: ""}, [], [])
            ).to.be.revertedWithCustomError(ownershipToken, "AgentIdAlreadyExists");
        });
    });

    describe("Agent User Token Creation", function () {
        let ownerTokenId;

        beforeEach(async function () {
            // Create an ownership token first
            const identity = {
                agentId: "test-agent-for-usage",
                name: "Test Agent for Usage",
                description: "Agent for testing usage tokens",
                createdAt: 0,
                version: "1.0.0"
            };

            const attributes = [
                { category: 0, attributeType: "MODEL", attributeValue: "GPT4", isActive: true }
            ];

            await ownershipToken.createAgentOwnerToken(
                identity,
                attributes,
                {platformName: "Test", externalId: "test", metadataURI: ""},
                [],
                []
            );
            
            ownerTokenId = 1;
        });

        it("Should create an agent user token with correct relationships", async function () {
            const usageTerms = {
                ownershipTokenId: 0, // Will be set by contract
                ownershipContract: ethers.ZeroAddress, // Will be set by contract
                fromTimestamp: Math.floor(Date.now() / 1000),
                toTimestamp: Math.floor(Date.now() / 1000) + 86400, // 24 hours
                attributeKey: "0_MODEL"
            };

            const metadataKeys = ["subscriptionType"];
            const metadataValues = ["monthly"];

            const tx = await usageToken.createAgentUserToken(
                ownerTokenId,
                await ownershipToken.getAddress(),
                usageTerms,
                metadataKeys,
                metadataValues,
                user1.address,
                1 // amount
            );

            await tx.wait();

            // Verify user token was minted
            expect(await usageToken.balanceOf(user1.address, 1)).to.equal(1);
            
            // Verify relationships
            const [refTokenId, refContract] = await usageToken.getOwnershipReference(1);
            expect(refTokenId).to.equal(ownerTokenId);
            expect(refContract).to.equal(await ownershipToken.getAddress());
            
            // Verify metadata
            const subType = await usageToken.getAdditionalMetadata(1, "subscriptionType");
            expect(subType).to.equal("monthly");
        });

        it("Should validate ownership when creating user tokens", async function () {
            const usageTerms = {
                ownershipTokenId: 0,
                ownershipContract: ethers.ZeroAddress,
                fromTimestamp: Math.floor(Date.now() / 1000),
                toTimestamp: Math.floor(Date.now() / 1000) + 86400,
                attributeKey: "0_MODEL"
            };

            // Try to create usage token from non-owner account
            await expect(
                usageToken.connect(user1).createAgentUserToken(
                    ownerTokenId,
                    await ownershipToken.getAddress(),
                    usageTerms,
                    [],
                    [],
                    user1.address,
                    1
                )
            ).to.be.revertedWithCustomError(usageToken, "NotOwnershipTokenOwner");
        });
    });

    describe("Integration Tests", function () {
        it("Should complete full agent lifecycle", async function () {
            // Step 1: Create ownership token
            const identity = {
                agentId: "lifecycle-test-agent",
                name: "Lifecycle Test Agent",
                description: "Testing full agent lifecycle",
                createdAt: 0,
                version: "1.0.0"
            };

            const attributes = [
                { category: 0, attributeType: "MODEL", attributeValue: "GPT4", isActive: true },
                { category: 1, attributeType: "INTEGRATION", attributeValue: "Google Drive", isActive: true }
            ];

            await ownershipToken.createAgentOwnerToken(
                identity,
                attributes,
                {platformName: "Test", externalId: "lifecycle", metadataURI: ""},
                ["testType"],
                ["lifecycle"]
            );

            // Step 2: Create usage token
            const usageTerms = {
                ownershipTokenId: 0,
                ownershipContract: ethers.ZeroAddress,
                fromTimestamp: Math.floor(Date.now() / 1000),
                toTimestamp: Math.floor(Date.now() / 1000) + 86400,
                attributeKey: "1_INTEGRATION"
            };

            await usageToken.createAgentUserToken(
                1, // ownerTokenId
                await ownershipToken.getAddress(),
                usageTerms,
                ["feature"],
                ["integration"],
                user1.address,
                1
            );

            // Step 3: Verify complete system
            expect(await ownershipToken.totalAgents()).to.equal(1);
            expect(await usageToken.totalUsageTokens()).to.equal(1);
            expect(await ownershipToken.ownerOf(1)).to.equal(owner.address);
            expect(await usageToken.balanceOf(user1.address, 1)).to.equal(1);
            
            // Verify relationship integrity
            const [refTokenId, refContract] = await usageToken.getOwnershipReference(1);
            expect(refTokenId).to.equal(1);
            expect(refContract).to.equal(await ownershipToken.getAddress());
            
            console.log("✅ Full agent lifecycle test completed successfully!");
        });
    });
});
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

interface ISimpleAgentOwnershipToken {
    function ownerOf(uint256 tokenId) external view returns (address);
    function exists(uint256 tokenId) external view returns (bool);
}

/**
 * @title SimpleAgentUsageToken
 * @dev ERC-1155 Multi-Token representing usage rights to agent capabilities with time periods + flexible metadata
 * 
 * KEY FEATURES:
 * - Direct reference to ownership contract (no registry dependency)
 * - Simple time-based usage periods (fromTimestamp to toTimestamp)
 * - Additional flexible metadata for any custom fields
 * - Super simple API: createAgentUserToken()
 */
contract SimpleAgentUsageToken is ERC1155, Ownable, Pausable, ReentrancyGuard {
    
    // Usage terms structure (simplified from spec)
    struct UsageTerms {
        uint256 ownershipTokenId;    // CRITICAL: Reference to ownership token
        address ownershipContract;   // CRITICAL: Reference to ownership contract
        uint256 fromTimestamp;       // Start time
        uint256 toTimestamp;         // End time  
        string attributeKey;         // Which attribute being used
    }
    
    // State variables
    uint256 private _nextTokenId = 1;
    address public ownershipTokenContract;
    
    // Storage mappings  
    mapping(uint256 => UsageTerms) public usageTerms;
    mapping(uint256 => mapping(string => string)) public additionalMetadata; // Open metadata
    
    // Events
    event AgentUserTokenCreated(
        uint256 indexed usageTokenId,
        uint256 indexed ownershipTokenId,
        address indexed ownershipContract,
        address recipient
    );
    
    // Errors
    error OwnershipTokenDoesNotExist(uint256 ownershipTokenId);
    error NotOwnershipTokenOwner(uint256 ownershipTokenId);
    error UsageTokenDoesNotExist(uint256 usageTokenId);
    error InvalidTimeRange(uint256 fromTimestamp, uint256 toTimestamp);
    
    constructor(address _ownershipTokenContract) 
        ERC1155("https://api.moluabi.com/simple-agent-usage-tokens/") 
        Ownable(msg.sender) 
    {
        ownershipTokenContract = _ownershipTokenContract;
    }
    
    /**
     * @dev Create an agent user token - SUPER SIMPLE API  
     * @param ownershipTokenId Reference to the ownership token
     * @param ownershipContract Reference to the ownership contract
     * @param terms Usage terms (time period + attribute key)
     * @param metadataKeys Additional metadata keys
     * @param metadataValues Additional metadata values
     * @param recipient Who receives the usage token
     * @param amount How many copies to mint
     */
    function createAgentUserToken(
        uint256 ownershipTokenId,
        address ownershipContract,
        UsageTerms memory terms,
        string[] memory metadataKeys,
        string[] memory metadataValues,
        address recipient,
        uint256 amount
    ) external whenNotPaused nonReentrant returns (uint256) {
        // Simple validation
        ISimpleAgentOwnershipToken ownerToken = ISimpleAgentOwnershipToken(ownershipContract);
        
        if (!ownerToken.exists(ownershipTokenId)) {
            revert OwnershipTokenDoesNotExist(ownershipTokenId);
        }
        
        if (ownerToken.ownerOf(ownershipTokenId) != msg.sender) {
            revert NotOwnershipTokenOwner(ownershipTokenId);
        }
        
        if (terms.toTimestamp != 0 && terms.fromTimestamp >= terms.toTimestamp) {
            revert InvalidTimeRange(terms.fromTimestamp, terms.toTimestamp);
        }
        
        require(metadataKeys.length == metadataValues.length, "Metadata arrays length mismatch");
        
        uint256 usageTokenId = _nextTokenId++;
        
        // Store usage terms
        terms.ownershipTokenId = ownershipTokenId;
        terms.ownershipContract = ownershipContract;
        usageTerms[usageTokenId] = terms;
        
        // Store additional metadata (flexible key-value pairs)
        for (uint i = 0; i < metadataKeys.length; i++) {
            additionalMetadata[usageTokenId][metadataKeys[i]] = metadataValues[i];
        }
        
        // Mint usage token(s) to recipient
        _mint(recipient, usageTokenId, amount, "");
        
        emit AgentUserTokenCreated(usageTokenId, ownershipTokenId, ownershipContract, recipient);
        
        return usageTokenId;
    }
    
    /**
     * @dev Get ownership reference for a usage token
     */
    function getOwnershipReference(uint256 usageTokenId) external view returns (uint256 ownershipTokenId, address ownershipContract) {
        if (usageTerms[usageTokenId].ownershipTokenId == 0) revert UsageTokenDoesNotExist(usageTokenId);
        UsageTerms memory terms = usageTerms[usageTokenId];
        return (terms.ownershipTokenId, terms.ownershipContract);
    }
    
    /**
     * @dev Get usage terms
     */
    function getUsageTerms(uint256 usageTokenId) external view returns (UsageTerms memory) {
        if (usageTerms[usageTokenId].ownershipTokenId == 0) revert UsageTokenDoesNotExist(usageTokenId);
        return usageTerms[usageTokenId];
    }
    
    /**
     * @dev Get additional metadata value
     */
    function getAdditionalMetadata(uint256 usageTokenId, string memory key) external view returns (string memory) {
        if (usageTerms[usageTokenId].ownershipTokenId == 0) revert UsageTokenDoesNotExist(usageTokenId);
        return additionalMetadata[usageTokenId][key];
    }
    
    /**
     * @dev Check if token exists
     */
    function exists(uint256 usageTokenId) external view returns (bool) {
        return usageTerms[usageTokenId].ownershipTokenId != 0;
    }
    
    /**
     * @dev Check if usage period is currently active
     */
    function isUsagePeriodActive(uint256 usageTokenId) external view returns (bool) {
        if (usageTerms[usageTokenId].ownershipTokenId == 0) revert UsageTokenDoesNotExist(usageTokenId);
        
        UsageTerms memory terms = usageTerms[usageTokenId];
        uint256 currentTime = block.timestamp;
        
        // Check if started
        bool hasStarted = currentTime >= terms.fromTimestamp;
        
        // Check if not expired (0 means no expiration)
        bool hasNotExpired = terms.toTimestamp == 0 || currentTime <= terms.toTimestamp;
        
        return hasStarted && hasNotExpired;
    }
    
    /**
     * @dev Get total number of usage tokens created
     */
    function totalUsageTokens() external view returns (uint256) {
        return _nextTokenId - 1;
    }
    
    // Admin functions
    function pause() external onlyOwner {
        _pause();
    }
    
    function unpause() external onlyOwner {
        _unpause();
    }
}
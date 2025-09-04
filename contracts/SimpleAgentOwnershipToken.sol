// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title SimpleAgentOwnershipToken
 * @dev ERC-721 NFT representing full ownership of AI agents with structured attributes + flexible metadata
 * 
 * KEY FEATURES:
 * - No registry dependency (direct contract communication)
 * - Structured attributes (category + type + value) from proven system
 * - Additional flexible metadata for any custom fields
 * - Super simple API: createAgentOwnerToken()
 */
contract SimpleAgentOwnershipToken is ERC721, ERC721URIStorage, Ownable, Pausable, ReentrancyGuard {
    
    // Agent Identity Structure
    struct AgentIdentity {
        string agentId;
        string name;
        string description;
        uint256 createdAt;
        string version;
    }
    
    // Agent Attribute Structure (Keep proven structure from original)
    struct AgentAttribute {
        uint256 category;      // 0-10 (same as original system)
        string attributeType;  // MODEL, MODALITY, INTEGRATION, etc.
        string attributeValue; // GPT4, Multimodal, Google Drive, etc.
        bool isActive;
    }
    
    // Platform Information
    struct PlatformInfo {
        string platformName;
        string externalId;
        string metadataURI;
    }
    
    // State variables
    uint256 private _nextTokenId = 1;
    address public usageTokenContract;
    
    // Storage mappings
    mapping(uint256 => AgentIdentity) public agentIdentities;
    mapping(uint256 => AgentAttribute[]) public agentAttributes;
    mapping(uint256 => PlatformInfo) public platformInfo;
    mapping(uint256 => mapping(string => string)) public additionalMetadata; // Open metadata
    mapping(string => uint256) public agentIdToToken; // agentId => tokenId (for uniqueness)
    
    // Events
    event AgentOwnerTokenCreated(
        uint256 indexed tokenId,
        string indexed agentId,
        address indexed owner,
        string name
    );
    
    // Errors
    error AgentIdAlreadyExists(string agentId);
    error TokenDoesNotExist(uint256 tokenId);
    error EmptyAgentId();
    
    constructor() ERC721("Simple Agent Ownership Token", "SAOT") Ownable(msg.sender) {}
    
    /**
     * @dev Create a new agent ownership token - SUPER SIMPLE API
     * @param identity Basic agent information
     * @param attributes Structured attributes array
     * @param platformData Platform-specific information  
     * @param metadataKeys Additional metadata keys
     * @param metadataValues Additional metadata values
     */
    function createAgentOwnerToken(
        AgentIdentity memory identity,
        AgentAttribute[] memory attributes,
        PlatformInfo memory platformData,
        string[] memory metadataKeys,
        string[] memory metadataValues
    ) external whenNotPaused nonReentrant returns (uint256) {
        // Simple validation
        if (bytes(identity.agentId).length == 0) revert EmptyAgentId();
        if (agentIdToToken[identity.agentId] != 0) revert AgentIdAlreadyExists(identity.agentId);
        require(metadataKeys.length == metadataValues.length, "Metadata arrays length mismatch");
        
        uint256 tokenId = _nextTokenId++;
        
        // Set creation timestamp
        identity.createdAt = block.timestamp;
        
        // Store core data
        agentIdentities[tokenId] = identity;
        platformInfo[tokenId] = platformData;
        agentIdToToken[identity.agentId] = tokenId;
        
        // Store structured attributes
        for (uint i = 0; i < attributes.length; i++) {
            agentAttributes[tokenId].push(attributes[i]);
        }
        
        // Store additional metadata (flexible key-value pairs)
        for (uint i = 0; i < metadataKeys.length; i++) {
            additionalMetadata[tokenId][metadataKeys[i]] = metadataValues[i];
        }
        
        // Mint token to sender
        _safeMint(msg.sender, tokenId);
        
        // Set metadata URI if provided
        if (bytes(platformData.metadataURI).length > 0) {
            _setTokenURI(tokenId, platformData.metadataURI);
        }
        
        emit AgentOwnerTokenCreated(tokenId, identity.agentId, msg.sender, identity.name);
        
        return tokenId;
    }
    
    /**
     * @dev Set the usage token contract address
     */
    function setUsageTokenContract(address _usageTokenContract) external onlyOwner {
        usageTokenContract = _usageTokenContract;
    }
    
    /**
     * @dev Get agent identity
     */
    function getAgentIdentity(uint256 tokenId) external view returns (AgentIdentity memory) {
        if (_ownerOf(tokenId) == address(0)) revert TokenDoesNotExist(tokenId);
        return agentIdentities[tokenId];
    }
    
    /**
     * @dev Get agent attributes
     */
    function getAgentAttributes(uint256 tokenId) external view returns (AgentAttribute[] memory) {
        if (_ownerOf(tokenId) == address(0)) revert TokenDoesNotExist(tokenId);
        return agentAttributes[tokenId];
    }
    
    /**
     * @dev Get platform info
     */
    function getPlatformInfo(uint256 tokenId) external view returns (PlatformInfo memory) {
        if (_ownerOf(tokenId) == address(0)) revert TokenDoesNotExist(tokenId);
        return platformInfo[tokenId];
    }
    
    /**
     * @dev Get additional metadata value
     */
    function getAdditionalMetadata(uint256 tokenId, string memory key) external view returns (string memory) {
        if (_ownerOf(tokenId) == address(0)) revert TokenDoesNotExist(tokenId);
        return additionalMetadata[tokenId][key];
    }
    
    /**
     * @dev Get token ID from agent ID
     */
    function getTokenIdFromAgentId(string memory agentId) external view returns (uint256) {
        return agentIdToToken[agentId];
    }
    
    /**
     * @dev Check if token exists
     */
    function exists(uint256 tokenId) external view returns (bool) {
        return _ownerOf(tokenId) != address(0);
    }
    
    /**
     * @dev Get total number of agents created
     */
    function totalAgents() external view returns (uint256) {
        return _nextTokenId - 1;
    }
    
    // Admin functions
    function pause() external onlyOwner {
        _pause();
    }
    
    function unpause() external onlyOwner {
        _unpause();
    }
    
    // Override required by Solidity
    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }
    
    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
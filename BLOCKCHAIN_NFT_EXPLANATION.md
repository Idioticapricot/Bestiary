# NFT Integration Explanation for Blockchain Developer

## Current NFT Flow

### 1. **Minting Process**
```solidity
// Your NFT Contract (ERC-721)
function mint(string memory tokenURI) public returns (uint256) {
    uint256 tokenId = _tokenIdCounter.current();
    _tokenIdCounter.increment();
    _safeMint(msg.sender, tokenId);
    _setTokenURI(tokenId, tokenURI);
    
    // Emits: Transfer(address(0), msg.sender, tokenId)
    return tokenId;
}
```

### 2. **Event Extraction**
```typescript
// Backend extracts tokenId from Transfer event
const transferEventSignature = '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef'

for (const log of receipt.logs) {
  if (log.topics[0] === transferEventSignature) {
    // topics[1] = from (0x0 for mint)
    // topics[2] = to (recipient)  
    // topics[3] = tokenId (hex)
    const tokenId = parseInt(log.topics[3], 16).toString()
    break
  }
}
```

### 3. **Database Storage**
```typescript
// Store NFT reference in database
{
  nftTokenId: "123",           // Actual token ID from blockchain
  nftContractAddress: "0x...", // Your contract address
  nftMetadataUri: "ipfs://...", // Token URI (image/metadata)
}
```

## What We Need From You (Contract Side)

### 1. **Standard ERC-721 Implementation**
```solidity
contract BeastNFT is ERC721, ERC721URIStorage {
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIdCounter;
    
    function mint(string memory tokenURI) public returns (uint256) {
        uint256 tokenId = _tokenIdCounter.current();
        _tokenIdCounter.increment();
        _safeMint(msg.sender, tokenId);
        _setTokenURI(tokenId, tokenURI);
        return tokenId;
    }
}
```

### 2. **Contract Address** 
- Deploy contract and give us the address
- We store it in `nftContractAddress` field

### 3. **ABI File**
- Provide the contract ABI
- We use it for `contract.mint()` calls

## Future Operations We'll Support

### 1. **Transfers** (for marketplace)
```typescript
// Using stored NFT data
const contract = new ethers.Contract(beast.nftContractAddress, ABI, signer)
await contract.transferFrom(seller, buyer, beast.nftTokenId)
```

### 2. **Approvals** (for marketplace)
```typescript
await contract.approve(MARKETPLACE_ADDRESS, beast.nftTokenId)
```

### 3. **Ownership Verification**
```typescript
const owner = await contract.ownerOf(beast.nftTokenId)
// Sync with database if different
```

## Current Implementation Status

### ✅ Working
- Image generation (fal.ai)
- NFT minting (your contract)
- Token ID extraction from events
- Database storage with proper NFT references

### ⚠️ Needs Your Input
- **Contract deployment** on Avalanche
- **Contract address** for our config
- **ABI file** for contract interaction
- **Gas optimization** if needed

### 🔄 Future Features
- Marketplace integration
- NFT transfers between users
- Ownership verification
- Multi-contract support

## Technical Requirements

### Contract Must Have:
```solidity
// Standard ERC-721 functions
function mint(string memory tokenURI) external returns (uint256)
function ownerOf(uint256 tokenId) external view returns (address)
function transferFrom(address from, address to, uint256 tokenId) external
function approve(address to, uint256 tokenId) external
function tokenURI(uint256 tokenId) external view returns (string memory)
```

### Events Must Emit:
```solidity
// Standard Transfer event (we parse this)
event Transfer(address indexed from, address indexed to, uint256 indexed tokenId);
```

## Integration Checklist

- [ ] Deploy NFT contract on Avalanche
- [ ] Provide contract address
- [ ] Share ABI file
- [ ] Test minting functionality
- [ ] Verify Transfer events are emitted correctly
- [ ] Test with our backend extraction logic

## Questions for You

1. **Contract Address**: What's the deployed contract address?
2. **Network**: Avalanche Mainnet or Fuji Testnet?
3. **Gas Costs**: Any optimizations needed for minting?
4. **Metadata**: Do you want IPFS integration for metadata?
5. **Royalties**: Need EIP-2981 royalty support?

## Code You Need to Review

Check our NFT ID extraction logic in:
- `/app/api/create/confirm/route.ts` (lines 20-35)

Make sure your contract emits Transfer events correctly so we can extract the token ID.
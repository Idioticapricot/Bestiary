"use client"

import { useState, useEffect } from "react"
import { AppLayout } from "../../components/layout/AppLayout"
import styled from "styled-components"
import { Card, Button } from "../../components/styled/GlobalStyles"
import { BeastCard as BeastCardComponent } from "../../components/beast/BeastCard"
import { SellModal } from "../../components/marketplace/SellModal"
import { useWallet } from "../../components/wallet/WalletProvider"
import { ethers } from "ethers"

const MarketplaceContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;
`

const MarketplaceHeader = styled.div`
  text-align: center;
  background: var(--brutal-violet);
  padding: 24px;
  border: 4px solid var(--border-primary);
  box-shadow: 4px 4px 0px 0px var(--border-primary);
  font-family: var(--font-mono);
`

const MarketplaceTitle = styled.h1`
  font-size: 32px;
  font-weight: 900;
  color: var(--text-primary);
  margin: 0 0 12px 0;
  text-transform: uppercase;
  letter-spacing: 3px;
`

const MarketplaceSubtitle = styled.p`
  font-size: 16px;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0;
  text-transform: uppercase;
  letter-spacing: 1px;
`

const FilterContainer = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
`

const FilterDropdown = styled.select`
  background: var(--light-bg);
  border: 4px solid var(--border-primary);
  padding: 12px 16px;
  font-size: 14px;
  font-weight: 900;
  color: var(--text-primary);
  font-family: var(--font-mono);
  text-transform: uppercase;
  cursor: pointer;
  box-shadow: 2px 2px 0px 0px var(--border-primary);
  
  &:hover {
    background: var(--brutal-cyan);
  }
  
  &:focus {
    outline: none;
    background: var(--brutal-lime);
  }
`

const SellButton = styled(Button)`
  background: var(--brutal-orange);
  font-size: 16px;
  padding: 12px 24px;
  text-transform: uppercase;
  letter-spacing: 1px;
  
  &:hover {
    background: var(--brutal-red);
  }
`

const BeastGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
`

const MarketplaceBeastCard = styled.div`
  background: var(--light-bg);
  border: 4px solid var(--border-primary);
  box-shadow: 4px 4px 0px 0px var(--border-primary);
  padding: 16px;
  transition: all 0.1s ease;
  
  &:hover {
    transform: translate(2px, 2px);
    box-shadow: 2px 2px 0px 0px var(--border-primary);
  }
`

const BeastCard = styled(Card)`
  padding: 20px;
  text-align: center;
  transition: all 0.1s ease;
  
  &:hover {
    transform: translate(2px, 2px);
    box-shadow: 4px 4px 0px 0px var(--border-primary);
  }
`

const BeastIcon = styled.div`
  font-size: 64px;
  margin-bottom: 16px;
`

const BeastName = styled.h3`
  font-size: 20px;
  font-weight: 900;
  color: var(--text-primary);
  margin: 0 0 8px 0;
  font-family: var(--font-mono);
  text-transform: uppercase;
  letter-spacing: 1px;
`

const BeastLevel = styled.div`
  background: var(--brutal-pink);
  padding: 4px 8px;
  border: 2px solid var(--border-primary);
  font-size: 12px;
  font-weight: 900;
  color: var(--text-primary);
  font-family: var(--font-mono);
  text-transform: uppercase;
  margin-bottom: 16px;
  display: inline-block;
`

const BeastStats = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  margin-bottom: 16px;
`

const StatItem = styled.div`
  background: var(--brutal-lime);
  padding: 8px;
  border: 2px solid var(--border-primary);
  text-align: center;
`

const StatLabel = styled.div`
  font-size: 10px;
  font-weight: 900;
  color: var(--text-primary);
  font-family: var(--font-mono);
  text-transform: uppercase;
`

const StatValue = styled.div`
  font-size: 16px;
  font-weight: 900;
  color: var(--text-primary);
  font-family: var(--font-mono);
`

const BeastPrice = styled.div`
  background: var(--brutal-orange);
  padding: 12px;
  border: 3px solid var(--border-primary);
  font-size: 18px;
  font-weight: 900;
  color: var(--text-primary);
  font-family: var(--font-mono);
  text-transform: uppercase;
  letter-spacing: 1px;
  margin-bottom: 16px;
`

const BuyButton = styled(Button)`
  background: var(--brutal-cyan);
  
  &:hover {
    background: var(--brutal-yellow);
  }
`



export default function MarketplacePage() {
  const [filter, setFilter] = useState("all")
  const [showSellModal, setShowSellModal] = useState(false)
  const [listings, setListings] = useState([])
  const [loading, setLoading] = useState(true)
  const [buying, setBuying] = useState<string | null>(null)
  const { wallet } = useWallet()

  const marketplaceAddress = "0x3863776EDAb845787a4342FFE29d274A98ebF9Ff"
  const marketplaceAbi = [
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "listingId",
          "type": "uint256"
        }
      ],
      "name": "buy",
      "outputs": [],
      "stateMutability": "payable",
      "type": "function"
    }
  ]

  useEffect(() => {
    const fetchMarketplaceListings = async () => {
      try {
        const params = new URLSearchParams()
        if (filter !== 'all') params.append('element', filter)
        
        const response = await fetch(`/api/marketplace?${params}`)
        if (response.ok) {
          const data = await response.json()
          setListings(data)
        }
      } catch (error) {
        console.error('Error fetching marketplace:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchMarketplaceListings()
  }, [filter])

  const handleBuyBeast = async (listingId: string, price: string) => {
    if (!wallet.isConnected) {
      alert("Please connect your wallet first");
      return;
    }

    setBuying(listingId);
    try {
      const currentProvider =
        typeof window !== "undefined" ? (window.avalanche || window.ethereum) : null;

      if (!currentProvider) {
        throw new Error("Please connect your wallet first");
      }

      const provider = new ethers.BrowserProvider(currentProvider);
      await provider.send("eth_requestAccounts", []);
      const signer = await provider.getSigner();

      const marketplace = new ethers.Contract(marketplaceAddress, marketplaceAbi, signer);

      // ✅ convert price (assuming $WAM has 18 decimals)
      const priceInWei = ethers.parseUnits(price, 18);

      // ✅ 1. Approve ERC20 spend
      const erc20 = new ethers.Contract(
        "0x3841F6eeE655a48945CDD8102fE0dba51a2a8b43", // WAM token address
        [
          "function approve(address spender, uint256 amount) external returns (bool)",
          "function allowance(address owner, address spender) external view returns (uint256)"
        ],
        signer
      );

      const allowance = await erc20.allowance(await signer.getAddress(), marketplaceAddress);
      if (allowance < priceInWei) {
        const approveTx = await erc20.approve(marketplaceAddress, priceInWei);
        await approveTx.wait();
        console.log("✅ Approved marketplace to spend WAM");
      }

      // ✅ 2. Call buy WITHOUT value, use default listing ID 1
      const tx = await marketplace.buy(1, {
        gasLimit: 300000
      });

      console.log("Buy TX submitted:", tx.hash);
      alert(`Transaction submitted! Hash: ${tx.hash}`);

      const receipt = await tx.wait();
      console.log("Purchased in block:", receipt.blockNumber);

      alert(`✅ Beast purchased successfully!\nTransaction: ${tx.hash}`);

      // refresh listings
      const fetchMarketplaceListings = async () => {
        try {
          const params = new URLSearchParams()
          if (filter !== 'all') params.append('element', filter)
          
          const response = await fetch(`/api/marketplace?${params}`)
          if (response.ok) {
            const data = await response.json()
            setListings(data)
          }
        } catch (error) {
          console.error('Error fetching marketplace:', error)
        }
      }
      await fetchMarketplaceListings();
    } catch (error) {
      console.error("Error buying beast:", error);
      alert("Transaction failed: " + (error as any).message);
    } finally {
      setBuying(null);
    }
  };

  const filters = [
    { id: "all", label: "All" },
    { id: "fire", label: "Fire" },
    { id: "water", label: "Water" },
    { id: "earth", label: "Earth" },
    { id: "electric", label: "Electric" }
  ]

  return (
    <>
      <AppLayout>
        <MarketplaceContainer>
          <MarketplaceHeader>
            <MarketplaceTitle>🏪 MARKETPLACE</MarketplaceTitle>
            <MarketplaceSubtitle>Buy and sell battle beasts</MarketplaceSubtitle>
          </MarketplaceHeader>

          <FilterContainer>
            <FilterDropdown 
              value={filter} 
              onChange={(e) => setFilter(e.target.value)}
            >
              {filters.map((filterOption) => (
                <option key={filterOption.id} value={filterOption.id}>
                  {filterOption.label}
                </option>
              ))}
            </FilterDropdown>
            
            <SellButton 
              onClick={() => setShowSellModal(true)}
              disabled={!wallet.isConnected}
            >
              🏷️ {wallet.isConnected ? 'SELL BEAST' : 'CONNECT WALLET'}
            </SellButton>
          </FilterContainer>

          <BeastGrid>
            {loading ? (
              <div>Loading marketplace...</div>
            ) : listings.length === 0 ? (
              <div>No beasts for sale</div>
            ) : (
              listings.map((listing: any, index: number) => (
                <MarketplaceBeastCard key={listing.id}>
                  <BeastCardComponent
                    beast={listing.beast}
                    onSelect={() => console.log('Beast selected:', listing.beast.name)}
                  />
                  <BeastPrice>{listing.price} $WAM</BeastPrice>
                  <BuyButton 
                    $fullWidth
                    onClick={() => handleBuyBeast("1", listing.price)}
                    disabled={buying === "1" || !wallet.isConnected}
                  >
                    {buying === "1" ? 'BUYING...' : 'BUY BEAST'}
                  </BuyButton>
                </MarketplaceBeastCard>
              ))
            )}
          </BeastGrid>
        </MarketplaceContainer>
      </AppLayout>
      
      {showSellModal && (
        <SellModal 
          onClose={() => setShowSellModal(false)} 
          onSellComplete={() => {
            // Refresh marketplace listings
            const fetchMarketplaceListings = async () => {
              try {
                const params = new URLSearchParams()
                if (filter !== 'all') params.append('element', filter)
                
                const response = await fetch(`/api/marketplace?${params}`)
                if (response.ok) {
                  const data = await response.json()
                  setListings(data)
                }
              } catch (error) {
                console.error('Error fetching marketplace:', error)
              }
            }
            fetchMarketplaceListings()
          }}
        />
      )}
    </>
  )
}
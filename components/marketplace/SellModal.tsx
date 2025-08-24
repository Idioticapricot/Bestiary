"use client"

import { useState, useEffect } from "react"
import styled from "styled-components"
import { Button } from "../styled/GlobalStyles"
import { BeastCard as BeastCardComponent } from "../beast/BeastCard"
import { useWallet } from "../wallet/WalletProvider"
import { Beast } from "../../types/beast"
import { ethers } from "ethers"
import Marketplace from  "../../abi/ERC20MarketplaceWithIndex.json"

interface SellModalProps {
  onClose: () => void
  onSellComplete?: () => void
}

const PopupOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
`

const PopupContent = styled.div`
  background: var(--light-bg);
  border: 4px solid var(--border-primary);
  box-shadow: 8px 8px 0px 0px var(--border-primary);
  padding: 32px;
  max-width: 800px;
  width: 90%;
  max-height: 80vh;
  overflow-y: auto;
  font-family: var(--font-mono);
`

const PopupTitle = styled.h2`
  font-size: 24px;
  font-weight: 900;
  color: var(--text-primary);
  margin: 0 0 16px 0;
  text-transform: uppercase;
  letter-spacing: 2px;
  text-align: center;
`

const SellStep = styled.div<{ $active: boolean }>`
  display: ${props => props.$active ? 'block' : 'none'};
`

const StepTitle = styled.h3`
  font-size: 18px;
  font-weight: 900;
  color: var(--text-primary);
  margin: 0 0 16px 0;
  text-transform: uppercase;
  letter-spacing: 1px;
  background: var(--brutal-cyan);
  padding: 8px 16px;
  border: 3px solid var(--border-primary);
  text-align: center;
`

const BeastGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
`

const SelectableBeastCard = styled.div<{ $selected: boolean }>`
  cursor: pointer;
  transition: all 0.1s ease;
  border: ${props => props.$selected ? '4px solid var(--brutal-yellow)' : 'none'};
  background: ${props => props.$selected ? 'var(--brutal-yellow)' : 'transparent'};
  padding: ${props => props.$selected ? '8px' : '0'};
  
  &:hover {
    transform: translate(2px, 2px);
  }
`

const PriceSection = styled.div`
  background: var(--brutal-lime);
  border: 4px solid var(--border-primary);
  padding: 24px;
  margin-bottom: 24px;
  text-align: center;
`

const PriceInput = styled.input`
  width: 200px;
  padding: 12px 16px;
  border: 4px solid var(--border-primary);
  background: var(--light-bg);
  color: var(--text-primary);
  font-family: var(--font-mono);
  font-weight: 900;
  font-size: 18px;
  text-align: center;
  margin: 0 8px;
  
  &:focus {
    outline: none;
    background: var(--brutal-yellow);
  }
`

const PriceLabel = styled.div`
  font-size: 16px;
  font-weight: 900;
  color: var(--text-primary);
  margin-bottom: 12px;
  text-transform: uppercase;
`

const SelectedBeastDisplay = styled.div`
  background: var(--brutal-violet);
  border: 4px solid var(--border-primary);
  padding: 16px;
  margin-bottom: 24px;
  text-align: center;
`

const SelectedBeastName = styled.div`
  font-size: 20px;
  font-weight: 900;
  color: var(--text-primary);
  text-transform: uppercase;
  margin-bottom: 8px;
`

const PopupButtons = styled.div`
  display: flex;
  gap: 12px;
`

const PopupButton = styled(Button)`
  flex: 1;
  font-size: 14px;
  padding: 12px;
  text-transform: uppercase;
`

const BackButton = styled(Button)`
  background: var(--brutal-red);
  
  &:hover {
    background: var(--brutal-orange);
  }
`

const marketplaceAddress = "0x1163d6A3bf110e1c26D079982c064b939900A9CB"
const marketplaceAbi = Marketplace.abi
export function SellModal({ onClose, onSellComplete }: SellModalProps) {
  const [step, setStep] = useState<'select' | 'price'>('select')
  const [selectedBeast, setSelectedBeast] = useState<string | null>(null)
  const [price, setPrice] = useState('')
  const [userBeasts, setUserBeasts] = useState<Beast[]>([])
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)
  const [selling, setSelling] = useState(false)
  const { wallet } = useWallet()
  const [txHash, setTxHash] = useState<string | null>(null)
  const [txStatus, setTxStatus] = useState<'idle' | 'pending' | 'confirming' | 'success' | 'error'>('idle')

  useEffect(() => {
    const fetchUserBeasts = async () => {
      if (!wallet.isConnected || !wallet.address) {
        setLoading(false)
        return
      }

      try {
        const userResponse = await fetch('/api/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            walletAddress: wallet.address,
            username: `User_${wallet.address.slice(-6)}`
          })
        })

        if (userResponse.ok) {
          const user = await userResponse.json()
          setUserId(user.id)

          // Fetch beasts with all NFT details including token_id
          const beastsResponse = await fetch(`/api/beasts?userId=${user.id}&includeForSale=true`)
          if (beastsResponse.ok) {
            const beasts = await beastsResponse.json()
            // Only show beasts that have NFT token ID and are not for sale
            const availableBeasts = beasts.filter((beast: Beast) => 
              !beast.isForSale && 
              beast.nftTokenId && 
              beast.nftContractAddress
            )
            setUserBeasts(availableBeasts)
          }
        }
      } catch (error) {
        console.error('Error fetching user beasts:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchUserBeasts()
  }, [wallet.isConnected, wallet.address])

  const handleBeastSelect = (beastId: string) => {
    setSelectedBeast(beastId)
  }

  const handleNextStep = () => {
    if (selectedBeast) {
      setStep('price')
    }
  }

  const handleConfirmSell = async () => {
    if (selectedBeast && price && userId) {
      setSelling(true)
      try {
        // First, update the database
        const response = await fetch('/api/marketplace', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            beastId: selectedBeast,
            sellerId: userId,
            price: parseFloat(price)
          })
        })

        if (!response.ok) {
          throw new Error('Failed to list beast for sale in database')
        }

        // Get the beast data to access NFT information
        const beastData = userBeasts.find(b => b.id === selectedBeast)
        if (!beastData) {
          throw new Error('Beast not found')
        }
        
        if (!beastData.nftTokenId || !beastData.nftContractAddress) {
          throw new Error('Beast NFT data is missing - tokenID or contract address not found')
        }
        
        console.log('Beast NFT Data:', {
          tokenId: beastData.nftTokenId,
          contractAddress: beastData.nftContractAddress,
          beastName: beastData.name
        })

        // Now interact with the blockchain marketplace contract
        const currentProvider = typeof window !== 'undefined' ? (window.avalanche || window.ethereum) : null
        
        if (!currentProvider) {
          throw new Error('Please connect your wallet first')
        }

        // Convert price to wei (assuming 18 decimals for WAM token)
        const priceInWei = ethers.parseUnits(price, 18)
        
        console.log('Listing beast on blockchain:', {
          beastName: beastData.name,
          tokenAddress: beastData.nftContractAddress,
          tokenId: beastData.nftTokenId,
          price: priceInWei.toString(),
          priceInEth: price
        })
        
        // Create ethers provider and signer
        const provider = new ethers.BrowserProvider(currentProvider)
        await provider.send('eth_requestAccounts', [])
        const signer = await provider.getSigner()
        
        const marketplace = new ethers.Contract(marketplaceAddress, marketplaceAbi, signer)
        
        setTxStatus('pending')
        
        // Estimate gas first
        let gasEstimate
        try {
          // Approve the marketplace on the NFT contract
const nft = new ethers.Contract(
  beastData.nftContractAddress, // <-- FIXED
  [
    "function approve(address to, uint256 tokenId) external"
  ],
  signer
);

// Step 1: Approve marketplace to transfer the NFT
const approveTx = await nft.approve(marketplaceAddress, beastData.nftTokenId);
await approveTx.wait(); // wait until mined

gasEstimate = await marketplace.sell.estimateGas(
  beastData.nftContractAddress,
  beastData.nftTokenId,
  priceInWei
);

        } catch (gasError) {
          gasEstimate = 500000
        }
        
        // Call the sell function with gas limit
        const tx = await marketplace.sell(
          beastData.nftContractAddress,
          beastData.nftTokenId,
          priceInWei,
          { gasLimit: Math.ceil(Number(gasEstimate) * 1.2) }
        )
        
        console.log('Sell TX submitted:', tx.hash)
        setTxHash(tx.hash)
        setTxStatus('confirming')
        
        // Wait for transaction confirmation
        const receipt = await tx.wait()
        console.log('Sale listed in block:', receipt.blockNumber)
        setTxStatus('success')
        
      } catch (error) {
        console.error('Error listing beast:', error)
        setTxStatus('error')
        
        // Show user-friendly error message
        let errorMessage = 'Failed to list beast for sale'
        if (error instanceof Error) {
          if (error.message.includes('database')) {
            errorMessage = 'Database error: ' + error.message
          } else if (error.message.includes('Wallet not connected')) {
            errorMessage = 'Please connect your wallet'
          } else if (error.message.includes('NFT information')) {
            errorMessage = 'Beast NFT data is missing'
          } else if (error.message.includes('user rejected')) {
            errorMessage = 'Transaction cancelled by user'
          } else {
            errorMessage = 'Blockchain error: ' + error.message
          }
        }
        
        alert(errorMessage)
        setSelling(false)
        setTxStatus('idle')
      }
    }
  }

  // Handle transaction success
  useEffect(() => {
    if (txStatus === 'success' && txHash) {
      console.log("Sale listed successfully on blockchain:", txHash)
      alert(`✅ Beast successfully listed on marketplace!\nTransaction: ${txHash}`)
      setSelling(false)
      onSellComplete?.()
      onClose()
    }
  }, [txStatus, txHash, onSellComplete, onClose])

  const selectedBeastData = userBeasts.find(b => b.id === selectedBeast)

  return (
    <PopupOverlay onClick={onClose}>
      <PopupContent onClick={(e) => e.stopPropagation()}>
        <PopupTitle>🏷️ SELL BEAST</PopupTitle>
        
        <SellStep $active={step === 'select'}>
          <StepTitle>Step 1: Select Beast to Sell</StepTitle>
          
          <BeastGrid>
            {loading ? (
              <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-primary)' }}>Loading beasts...</div>
            ) : !wallet.isConnected ? (
              <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-primary)' }}>Connect wallet to sell beasts</div>
            ) : userBeasts.length === 0 ? (
              <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-primary)' }}>
                No NFT beasts available for sale<br/>
                <small style={{ opacity: 0.7 }}>Only minted NFT beasts can be sold on marketplace</small>
              </div>
            ) : (
              userBeasts.map((beast) => (
                <SelectableBeastCard
                  key={beast.id}
                  $selected={selectedBeast === beast.id}
                  onClick={() => handleBeastSelect(beast.id)}
                >
                  <BeastCardComponent
                    beast={beast}
                    selected={selectedBeast === beast.id}
                  />
                </SelectableBeastCard>
              ))
            )}
          </BeastGrid>
          
          <PopupButtons>
            <PopupButton onClick={onClose}>
              Cancel
            </PopupButton>
            <PopupButton 
              onClick={handleNextStep}
              disabled={!selectedBeast}
            >
              Next: Set Price
            </PopupButton>
          </PopupButtons>
        </SellStep>

        <SellStep $active={step === 'price'}>
          <StepTitle>Step 2: Set Price</StepTitle>
          
          {selectedBeastData && (
            <SelectedBeastDisplay>
              <SelectedBeastName>{selectedBeastData.name}</SelectedBeastName>
              <div>Level {selectedBeastData.level} • {selectedBeastData.tier} Tier</div>
              {selectedBeastData.nftTokenId && (
                <div style={{ fontSize: '14px', marginTop: '8px', opacity: 0.8 }}>
                  NFT Token ID: {selectedBeastData.nftTokenId}
                </div>
              )}
            </SelectedBeastDisplay>
          )}
          
          <PriceSection>
            <PriceLabel>Set Your Price</PriceLabel>
            <div>
              <PriceInput
                type="number"
                placeholder="0"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                min="1"
              />
              <span style={{ fontSize: '18px', fontWeight: 900 }}>$WAM</span>
            </div>
          </PriceSection>
          
          <PopupButtons>
            <BackButton onClick={() => setStep('select')}>
              ← Back
            </BackButton>
            <PopupButton 
              onClick={handleConfirmSell}
              disabled={!price || parseFloat(price) <= 0 || selling || txStatus !== 'idle'}
            >
              {txStatus === 'pending' ? 'Confirm in Wallet...' : 
               txStatus === 'confirming' ? 'Confirming Transaction...' : 
               selling ? 'Processing...' : 
               'List for Sale'}
            </PopupButton>
          </PopupButtons>
        </SellStep>
      </PopupContent>
    </PopupOverlay>
  )
}
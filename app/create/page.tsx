"use client"

import { useState, useEffect } from "react"
import { AppLayout } from "../../components/layout/AppLayout"
import styled from "styled-components"
import { Card, Button } from "../../components/styled/GlobalStyles"
import { useRouter } from "next/navigation"
import { useWallet } from "../../components/wallet/WalletProvider"
import MyNFTABI from "../../abi/MyNFT.json"
import { ethers } from 'ethers'

const BackButton = styled(Button)`
  background: var(--brutal-red);
  margin-bottom: 24px;
  
  &:hover {
    background: var(--brutal-orange);
  }
`

const CreateContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;
`

const CreateHeader = styled.div`
  text-align: center;
  background: var(--brutal-cyan);
  padding: 24px;
  border: 4px solid var(--border-primary);
  box-shadow: 4px 4px 0px 0px var(--border-primary);
  font-family: var(--font-mono);
`

const CreateTitle = styled.h1`
  font-size: 32px;
  font-weight: 900;
  color: var(--text-primary);
  margin: 0 0 12px 0;
  text-transform: uppercase;
  letter-spacing: 3px;
`

const CreateSubtitle = styled.p`
  font-size: 16px;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0;
  text-transform: uppercase;
  letter-spacing: 1px;
`

const SectionTitle = styled.h2`
  font-size: 20px;
  font-weight: 900;
  color: var(--text-primary);
  margin: 0 0 16px 0;
  font-family: var(--font-mono);
  text-transform: uppercase;
  letter-spacing: 2px;
  background: var(--brutal-violet);
  padding: 8px 16px;
  border: 3px solid var(--border-primary);
  display: inline-block;
`

const BeastTypeGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
`

const BeastTypeCard = styled(Card)<{ $selected?: boolean }>`
  cursor: pointer;
  text-align: center;
  padding: 24px;
  background: ${props => props.$selected ? "var(--brutal-yellow)" : "var(--light-bg)"};
  transition: all 0.1s ease;
  
  &:hover {
    background: var(--brutal-lime);
    transform: translate(2px, 2px);
    box-shadow: 4px 4px 0px 0px var(--border-primary);
  }
`

const BeastIcon = styled.div`
  font-size: 48px;
  margin-bottom: 16px;
`

const BeastTypeName = styled.h3`
  font-size: 20px;
  font-weight: 900;
  color: var(--text-primary);
  margin: 0 0 8px 0;
  font-family: var(--font-mono);
  text-transform: uppercase;
  letter-spacing: 1px;
`

const BeastTypeDescription = styled.p`
  font-size: 14px;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0 0 16px 0;
  font-family: var(--font-mono);
`

const MintButton = styled(Button)`
  background: var(--brutal-lime);
  font-size: 18px;
  padding: 16px 32px;
  margin-top: 24px;
  
  &:hover {
    background: var(--brutal-cyan);
  }
  
  &:disabled {
    background: var(--brutal-red);
    opacity: 0.7;
  }
`

const TransactionStatus = styled.div`
  background: var(--brutal-cyan);
  padding: 16px;
  border: 3px solid var(--border-primary);
  box-shadow: 2px 2px 0px 0px var(--border-primary);
  margin: 16px 0;
  text-align: center;
  font-family: var(--font-mono);
`

const TransactionHash = styled.div`
  background: var(--brutal-lime);
  padding: 8px 12px;
  border: 2px solid var(--border-primary);
  font-size: 12px;
  font-weight: 900;
  color: var(--text-primary);
  margin-top: 8px;
  word-break: break-all;
`

const LoadingSpinner = styled.div`
  display: inline-block;
  width: 20px;
  height: 20px;
  border: 3px solid var(--border-primary);
  border-radius: 50%;
  border-top-color: transparent;
  animation: spin 1s ease-in-out infinite;
  margin-right: 8px;
  
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
`

const TierSelector = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
`

const TierCard = styled.div<{ $selected?: boolean; $color?: string }>`
  background: ${props => props.$selected ? props.$color : "var(--light-bg)"};
  border: 4px solid var(--border-primary);
  padding: 20px;
  text-align: center;
  cursor: pointer;
  transition: all 0.1s ease;
  box-shadow: 2px 2px 0px 0px var(--border-primary);
  
  &:hover {
    transform: translate(1px, 1px);
    box-shadow: 1px 1px 0px 0px var(--border-primary);
  }
`

const TierName = styled.h3`
  font-size: 18px;
  font-weight: 900;
  color: var(--text-primary);
  margin: 0 0 8px 0;
  font-family: var(--font-mono);
  text-transform: uppercase;
  letter-spacing: 1px;
`

const TierCost = styled.div`
  background: var(--brutal-red);
  padding: 8px 12px;
  border: 2px solid var(--border-primary);
  font-size: 16px;
  font-weight: 900;
  color: var(--text-primary);
  font-family: var(--font-mono);
  text-transform: uppercase;
  margin-bottom: 12px;
`

const TierAbilities = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`

const Ability = styled.div`
  background: var(--brutal-pink);
  padding: 4px 8px;
  border: 2px solid var(--border-primary);
  font-size: 10px;
  font-weight: 900;
  color: var(--text-primary);
  font-family: var(--font-mono);
  text-transform: uppercase;
`

const DescriptionInput = styled.textarea`
  width: 100%;
  min-height: 120px;
  padding: 16px;
  border: 4px solid var(--border-primary);
  background: var(--light-bg);
  color: var(--text-primary);
  font-family: var(--font-mono);
  font-size: 14px;
  font-weight: 700;
  resize: vertical;
  box-shadow: 2px 2px 0px 0px var(--border-primary);
  box-sizing: border-box;
  
  &:focus {
    outline: none;
    background: var(--brutal-lime);
  }
  
  &::placeholder {
    color: var(--text-primary);
    opacity: 0.7;
  }
`

const StatsContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`

const StatControl = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  background: var(--brutal-cyan);
  border: 3px solid var(--border-primary);
  box-shadow: 2px 2px 0px 0px var(--border-primary);
`

const StatName = styled.div`
  font-size: 16px;
  font-weight: 900;
  color: var(--text-primary);
  font-family: var(--font-mono);
  text-transform: uppercase;
  letter-spacing: 1px;
`

const StatButtons = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`

const StatButton = styled.button`
  width: 32px;
  height: 32px;
  border: 3px solid var(--border-primary);
  background: var(--brutal-yellow);
  color: var(--text-primary);
  font-size: 18px;
  font-weight: 900;
  cursor: pointer;
  font-family: var(--font-mono);
  transition: all 0.1s ease;
  
  &:hover:not(:disabled) {
    background: var(--brutal-orange);
    transform: translate(1px, 1px);
  }
  
  &:disabled {
    background: var(--brutal-red);
    opacity: 0.5;
    cursor: not-allowed;
  }
`

const StatDisplay = styled.div`
  width: 40px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--light-bg);
  border: 3px solid var(--border-primary);
  font-size: 16px;
  font-weight: 900;
  color: var(--text-primary);
  font-family: var(--font-mono);
`

const OverviewSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`

const OverviewItem = styled.div`
  padding: 16px;
  background: var(--brutal-violet);
  border: 3px solid var(--border-primary);
  box-shadow: 2px 2px 0px 0px var(--border-primary);
`

const OverviewLabel = styled.div`
  font-size: 12px;
  font-weight: 900;
  color: var(--text-primary);
  font-family: var(--font-mono);
  text-transform: uppercase;
  letter-spacing: 1px;
  margin-bottom: 8px;
`

const OverviewValue = styled.div`
  font-size: 14px;
  font-weight: 700;
  color: var(--text-primary);
  font-family: var(--font-mono);
`

const OverviewStats = styled.div`
  display: flex;
  gap: 12px;
`

const OverviewStat = styled.div`
  background: var(--brutal-lime);
  padding: 8px 12px;
  border: 2px solid var(--border-primary);
  font-size: 12px;
  font-weight: 900;
  color: var(--text-primary);
  font-family: var(--font-mono);
  text-transform: uppercase;
`

const ConnectWalletButton = styled(Button)`
  background: var(--brutal-lime);
  font-size: 18px;
  padding: 16px 32px;
  margin: 24px 0;
  
  &:hover {
    background: var(--brutal-cyan);
  }
`

const WalletStatus = styled.div`
  background: var(--brutal-violet);
  padding: 16px;
  border: 3px solid var(--border-primary);
  box-shadow: 2px 2px 0px 0px var(--border-primary);
  margin-bottom: 24px;
  text-align: center;
`

const ContractAddressInput = styled.input`
  width: 100%;
  padding: 8px 12px;
  border: 2px solid var(--border-primary);
  background: var(--light-bg);
  color: var(--text-primary);
  font-family: var(--font-mono);
  font-size: 12px;
  margin-top: 8px;
  text-align: center;
  
  &:focus {
    outline: none;
    background: var(--brutal-lime);
  }
`

const WalletAddress = styled.div`
  font-family: var(--font-mono);
  font-size: 14px;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 8px;
`

const NetworkStatus = styled.div`
  font-family: var(--font-mono);
  font-size: 12px;
  font-weight: 900;
  color: var(--text-primary);
  text-transform: uppercase;
  letter-spacing: 1px;
`

const TestWalletButton = styled(Button)`
  background: var(--brutal-orange);
  font-size: 14px;
  padding: 8px 16px;
  margin: 8px;
  
  &:hover {
    background: var(--brutal-red);
  }
`

type Step = 'tier' | 'design' | 'stats' | 'final'

interface BeastData {
  tier: string | null
  name: string
  elementType: string | null
  rarity: string | null
  description: string
  stats: {
    health: number
    stamina: number
    power: number
  }
}

const CONTRACT_ADDRESSES = {
  fuji: "0x4161c6e2B8f787E1d4d06EeDCb83E00b709d5C7c",
  mainnet: "0x...",
}

const tiers = [
  {
    id: "basic",
    name: "Basic Tier",
    cost: 50,
    multiplier: 1,
    abilities: ["20 Stat Points"],
    color: "var(--brutal-lime)"
  },
  {
    id: "advanced",
    name: "Advanced Tier",
    cost: 100,
    multiplier: 1.3,
    abilities: ["30 Stat Points", "Higher chance of special abilities"],
    color: "var(--brutal-cyan)"
  },
  {
    id: "legendary",
    name: "Legendary Tier",
    cost: 200,
    multiplier: 1.6,
    abilities: ["40 Stat Points", "Guaranteed special abilities", "Rare trait bonuses"],
    color: "var(--brutal-yellow)"
  }
]

const beastTypes = [
  {
    id: "fire",
    name: "Fire Beast",
    icon: "🔥",
    description: "",
    baseStats: { hp: 80, attack: 120, defense: 60 }
  },
  {
    id: "water",
    name: "Water Beast",
    icon: "🌊",
    description: "",
    baseStats: { hp: 100, attack: 90, defense: 90 }
  },
  {
    id: "earth",
    name: "Earth Beast",
    icon: "🌍",
    description: "",
    baseStats: { hp: 120, attack: 80, defense: 120 }
  },
  {
    id: "electric",
    name: "Electric Beast",
    icon: "⚡",
    description: "",
    baseStats: { hp: 70, attack: 110, defense: 70 }
  }
]

export default function CreatePage() {
  const router = useRouter()
  const { wallet, connectWallet } = useWallet()
  const [currentStep, setCurrentStep] = useState<Step>('tier')
  const [beastData, setBeastData] = useState<BeastData>({
    tier: null,
    name: '',
    elementType: null,
    rarity: null,
    description: '',
    stats: { health: 5, stamina: 5, power: 5 }
  })
  const [isLoading, setIsLoading] = useState(false)
  const [generatedImage, setGeneratedImage] = useState<string | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [createdBeast, setCreatedBeast] = useState<any>(null)
  const [beastDataForMinting, setBeastDataForMinting] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [contractAddress, setContractAddress] = useState(CONTRACT_ADDRESSES.fuji)
  const [transactionHash, setTransactionHash] = useState<string | null>(null)
  const [isConfirming, setIsConfirming] = useState(false)

  // Check if Core Wallet is available
  const currentProvider = typeof window !== 'undefined' ? (window.avalanche || window.ethereum) : null

  // Get or create user when wallet connects
  useEffect(() => {
    const initUser = async () => {
      if (wallet.isConnected && wallet.address) {
        try {
          const response = await fetch('/api/users', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              walletAddress: wallet.address,
              username: `User_${wallet.address.slice(-6)}`
            })
          })
          if (response.ok) {
            const user = await response.json()
            setUserId(user.id)
          }
        } catch (error) {
          console.error('Error creating user:', error)
        }
      }
    }
    initUser()
  }, [wallet.isConnected, wallet.address])

  const handleNext = () => {
    if (currentStep === 'tier' && beastData.tier) {
      setBeastData({...beastData, description: '', stats: { health: 5, stamina: 5, power: 5 }})
      setCurrentStep('design')
    } else if (currentStep === 'design' && beastData.description.trim()) {
      setBeastData({...beastData, stats: { health: 5, stamina: 5, power: 5 }})
      setCurrentStep('stats')
    } else if (currentStep === 'stats') {
      setCurrentStep('final')
    }
  }

  const handleBack = () => {
    if (currentStep === 'design') {
      setBeastData({...beastData, tier: null, stats: { health: 5, stamina: 5, power: 5 }})
      setCurrentStep('tier')
    } else if (currentStep === 'stats') {
      setBeastData({...beastData, description: '', stats: { health: 5, stamina: 5, power: 5 }})
      setCurrentStep('design')
    } else if (currentStep === 'final') {
      setBeastData({...beastData, stats: { health: 5, stamina: 5, power: 5 }})
      setCurrentStep('stats')
    } else {
      router.back()
    }
  }

  const handleGenerate = async () => {
    if (!wallet.isConnected || !userId) {
      alert('Please connect your wallet first')
      return
    }

    setIsGenerating(true)
    try {
      const beastName = beastData.name || `Beast_${Date.now()}`
      
      const response = await fetch('/api/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          name: beastName,
          description: beastData.description,
          tier: beastData.tier,
          elementType: beastData.elementType || 'fire',
          rarity: beastData.tier === 'legendary' ? 'legendary' : beastData.tier === 'advanced' ? 'rare' : 'common',
          stats: beastData.stats
        })
      })
      
      if (response.ok) {
        const { imageUrl, beastData } = await response.json()
        setGeneratedImage(imageUrl)
        setBeastDataForMinting(beastData)
      } else {
        const error = await response.json()
        console.error('Error creating beast:', error)
        alert(`Error: ${error.error}`)
      }
    } catch (error) {
      console.error('Error creating beast:', error)
      alert('Failed to create beast. Please try again.')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleCreate = async () => {
    if (!currentProvider) {
      setError("Please connect your wallet first")
      return
    }
    
    if (!generatedImage) {
      setError("Please generate an image first")
      return
    }
    
    if (!contractAddress || contractAddress === "0x...") {
      setError("Please set a valid contract address")
      return
    }
    
    setIsLoading(true)
    setError(null)
    setSuccess(null)
    setTransactionHash(null)
    setIsConfirming(false)
    
    try {
      const provider = new ethers.BrowserProvider(currentProvider)
      await provider.send('eth_requestAccounts', [])
      const signer = await provider.getSigner()
      
      const contract = new ethers.Contract(contractAddress, MyNFTABI.abi, signer)
      
      let gasEstimate
      try {
        gasEstimate = await contract.mint.estimateGas(generatedImage)
      } catch (gasError) {
        gasEstimate = 500000
      }
      
      const tx = await contract.mint(generatedImage, { 
        gasLimit: Math.ceil(Number(gasEstimate) * 1.2)
      })
      
      setTransactionHash(tx.hash)
      setSuccess("Transaction submitted! Waiting for confirmation...")
      
      setIsConfirming(true)
      const receipt = await tx.wait()
      
      // Now save beast to database after successful minting
      const confirmResponse = await fetch('/api/create/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          beastData: beastDataForMinting,
          transactionHash: tx.hash
        })
      })
      
      if (confirmResponse.ok) {
        const { beast } = await confirmResponse.json()
        setCreatedBeast(beast)
        setIsConfirming(false)
        setSuccess("🎉 NFT minted and beast created successfully!")
        setIsLoading(false)
      } else {
        throw new Error('Failed to save beast after minting')
      }
      
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('user rejected')) {
          setError("Transaction was rejected by user")
        } else if (error.message.includes('insufficient funds')) {
          setError("Insufficient AVAX for gas fees")
        } else {
          setError(`Transaction failed: ${error.message}`)
        }
      } else {
        setError('Failed to mint NFT')
      }
      setIsLoading(false)
    }
  }

  const selectedTierData = tiers.find(t => t.id === beastData.tier)
  const getMaxPoints = () => {
    if (beastData.tier === 'basic') return 20
    if (beastData.tier === 'advanced') return 30
    if (beastData.tier === 'legendary') return 40
    return 20
  }
  
  const getTotalUsedPoints = () => {
    return beastData.stats.health + beastData.stats.stamina + beastData.stats.power
  }
  
  const getRemainingPoints = () => {
    return getMaxPoints() - getTotalUsedPoints()
  }

  const renderStep = () => {
    switch (currentStep) {
      case 'tier':
        return (
          <Card>
            <SectionTitle>SELECT TIER</SectionTitle>
            <TierSelector>
              {tiers.map((tier) => (
                <TierCard
                  key={tier.id}
                  $selected={beastData.tier === tier.id}
                  $color={tier.color}
                  onClick={() => setBeastData({...beastData, tier: tier.id})}
                >
                  <TierName>{tier.name}</TierName>
                  <TierCost>{tier.cost} $WAM</TierCost>
                  <TierAbilities>
                    {tier.abilities.map((ability, index) => (
                      <Ability key={index}>{ability}</Ability>
                    ))}
                  </TierAbilities>
                </TierCard>
              ))}
            </TierSelector>
          </Card>
        )
      
      case 'design':
        return (
          <Card>
            <SectionTitle>DESIGN YOUR BEAST</SectionTitle>
            <div style={{ marginBottom: '16px' }}>
              <OverviewLabel>BEAST NAME:</OverviewLabel>
              <DescriptionInput
                placeholder="Enter your beast's name..."
                value={beastData.name}
                onChange={(e) => setBeastData({...beastData, name: e.target.value})}
                style={{ minHeight: '60px' }}
              />
            </div>
            <div style={{ marginBottom: '16px' }}>
              <OverviewLabel>ELEMENT TYPE:</OverviewLabel>
              <BeastTypeGrid>
                {beastTypes.map((type) => (
                  <BeastTypeCard
                    key={type.id}
                    $selected={beastData.elementType === type.id}
                    onClick={() => setBeastData({...beastData, elementType: type.id})}
                  >
                    <BeastIcon>{type.icon}</BeastIcon>
                    <BeastTypeName>{type.name}</BeastTypeName>
                    <BeastTypeDescription>{type.description}</BeastTypeDescription>
                  </BeastTypeCard>
                ))}
              </BeastTypeGrid>
            </div>

            <div>
              <OverviewLabel>DESCRIPTION:</OverviewLabel>
              <DescriptionInput
                placeholder="Describe your beast's appearance, personality, and abilities..."
                value={beastData.description}
                onChange={(e) => setBeastData({...beastData, description: e.target.value})}
              />
            </div>
          </Card>
        )
      
      case 'stats':
        return (
          <Card>
            <SectionTitle>DISTRIBUTE STATS ({getRemainingPoints()} POINTS LEFT)</SectionTitle>
            <StatsContainer>
              {Object.entries(beastData.stats).map(([stat, value]) => (
                <StatControl key={stat}>
                  <StatName>{stat.toUpperCase()}</StatName>
                  <StatButtons>
                    <StatButton 
                      onClick={() => {
                        if (value > 5) {
                          setBeastData({
                            ...beastData,
                            stats: {...beastData.stats, [stat]: value - 1}
                          })
                        }
                      }}
                      disabled={value <= 5}
                    >
                      -
                    </StatButton>
                    <StatDisplay>{value}</StatDisplay>
                    <StatButton 
                      onClick={() => {
                        if (getRemainingPoints() > 0) {
                          setBeastData({
                            ...beastData,
                            stats: {...beastData.stats, [stat]: value + 1}
                          })
                        }
                      }}
                      disabled={getRemainingPoints() <= 0}
                    >
                      +
                    </StatButton>
                  </StatButtons>
                </StatControl>
              ))}
            </StatsContainer>
          </Card>
        )
      
      case 'final':
        return (
          <Card>
            <SectionTitle>BEAST OVERVIEW</SectionTitle>
            <OverviewSection>
              <OverviewItem>
                <OverviewLabel>TIER:</OverviewLabel>
                <OverviewValue>{selectedTierData?.name}</OverviewValue>
              </OverviewItem>
              <OverviewItem>
                <OverviewLabel>DESCRIPTION:</OverviewLabel>
                <OverviewValue>{beastData.description}</OverviewValue>
              </OverviewItem>
              <OverviewItem>
                <OverviewLabel>STATS:</OverviewLabel>
                <OverviewStats>
                  <OverviewStat>Health: {beastData.stats.health}</OverviewStat>
                  <OverviewStat>Stamina: {beastData.stats.stamina}</OverviewStat>
                  <OverviewStat>Power: {beastData.stats.power}</OverviewStat>
                </OverviewStats>
              </OverviewItem>
              {(generatedImage || isGenerating) && (
                <OverviewItem>
                  <OverviewLabel>GENERATED BEAST:</OverviewLabel>
                  {isGenerating ? (
                    <div style={{width: '300px', height: '300px', background: 'var(--brutal-lime)', border: '4px solid var(--border-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '48px', animation: 'pulse 2s infinite'}}>
                      🎨
                    </div>
                  ) : generatedImage ? (
                    <img src={generatedImage} alt="Generated Beast" style={{width: '100%', maxWidth: '300px', border: '4px solid var(--border-primary)'}} />
                  ) : null}
                </OverviewItem>
              )}
            </OverviewSection>
            {!beastDataForMinting ? (
              <MintButton
                $fullWidth
                disabled={isGenerating}
                onClick={handleGenerate}
                style={{marginBottom: '16px', background: 'var(--brutal-cyan)'}}
              >
                {isGenerating ? "GENERATING IMAGE..." : "🎨 GENERATE IMAGE"}
              </MintButton>
            ) : createdBeast ? (
              <div style={{
                padding: '16px',
                background: 'var(--brutal-lime)',
                border: '3px solid var(--border-primary)',
                textAlign: 'center',
                fontFamily: 'var(--font-mono)',
                fontWeight: '900',
                color: 'var(--text-primary)',
                marginBottom: '16px'
              }}>
                ✅ BEAST CREATED SUCCESSFULLY!
              </div>
            ) : (
              <div style={{
                padding: '16px',
                background: 'var(--brutal-yellow)',
                border: '3px solid var(--border-primary)',
                textAlign: 'center',
                fontFamily: 'var(--font-mono)',
                fontWeight: '900',
                color: 'var(--text-primary)',
                marginBottom: '16px'
              }}>
                🖼️ IMAGE GENERATED! READY TO MINT NFT
              </div>
            )}
          </Card>
        )
    }
  }

  const renderWalletSection = () => {
    if (!currentProvider) {
      return (
        <WalletStatus>
          <div style={{marginBottom: '16px'}}>
            <div style={{fontSize: '18px', fontWeight: '900', marginBottom: '8px'}}>🔗 CONNECT WALLET</div>
            <div style={{fontSize: '14px', marginBottom: '16px'}}>Connect your Core Wallet to create beasts</div>
          </div>
          <ConnectWalletButton onClick={connectWallet}>
            🚀 CONNECT CORE WALLET
          </ConnectWalletButton>
        </WalletStatus>
      )
    }

    return (
      <WalletStatus>
        <WalletAddress>Wallet: Connected to Core Wallet</WalletAddress>
        <NetworkStatus>Network: Avalanche Fuji Testnet</NetworkStatus>
        <ContractAddressInput
          type="text"
          placeholder="Enter contract address (e.g., 0x...)"
          value={contractAddress}
          onChange={(e) => setContractAddress(e.target.value)}
          style={{marginTop: '16px'}}
        />
      </WalletStatus>
    )
  }

  return (
    <AppLayout>
      <BackButton onClick={handleBack}>
        ← BACK
      </BackButton>
      
      <CreateContainer>
        <CreateHeader>
          <CreateTitle>🐲 CREATE BEAST</CreateTitle>
          <CreateSubtitle>
            {currentStep === 'tier' && 'Choose your beast tier'}
            {currentStep === 'design' && 'Design your beast'}
            {currentStep === 'stats' && 'Distribute stat points'}
            {currentStep === 'final' && 'Review and create'}
          </CreateSubtitle>
        </CreateHeader>
        

        {error && (
          <div style={{
            background: 'var(--brutal-red)',
            padding: '16px',
            border: '3px solid var(--border-primary)',
            color: 'var(--text-primary)',
            fontFamily: 'var(--font-mono)',
            fontWeight: '900',
            textAlign: 'center'
          }}>
            ⚠️ {error}
          </div>
        )}
        
        {success && (
          <div style={{
            background: 'var(--brutal-lime)',
            padding: '16px',
            border: '3px solid var(--border-primary)',
            color: 'var(--text-primary)',
            fontFamily: 'var(--font-mono)',
            fontWeight: '900',
            textAlign: 'center'
          }}>
            ✅ {success}
          </div>
        )}
        
        {renderStep()}

        {transactionHash && (
          <TransactionStatus>
            <div style={{fontSize: '16px', fontWeight: '900', marginBottom: '8px'}}>
              {isConfirming ? '⏳ CONFIRMING TRANSACTION...' : '✅ TRANSACTION CONFIRMED!'}
            </div>
            <TransactionHash>Hash: {transactionHash}</TransactionHash>
          </TransactionStatus>
        )}

        {currentStep !== 'final' ? (
          <MintButton
            $fullWidth
            disabled={
              (currentStep === 'tier' && !beastData.tier) ||
              (currentStep === 'design' && (!beastData.name.trim() || !beastData.elementType || !beastData.description.trim())) ||
              (currentStep === 'stats' && getRemainingPoints() !== 0)
            }
            onClick={handleNext}
          >
            NEXT
          </MintButton>
        ) : (
          <MintButton
            $fullWidth
            disabled={isLoading || isConfirming || !beastDataForMinting || !currentProvider || !!createdBeast}
            onClick={handleCreate}
          >
            {isLoading ? (
              <>
                <LoadingSpinner />
                SUBMITTING TRANSACTION...
              </>
            ) : isConfirming ? (
              <>
                <LoadingSpinner />
                CONFIRMING TRANSACTION...
              </>
            ) : transactionHash ? (
              "✅ NFT MINTED SUCCESSFULLY!"
            ) : (
              "🔗 MINT BEAST NFT"
            )}
          </MintButton>
        )}
      </CreateContainer>
    </AppLayout>
  )
}
"use client"

import { useState } from "react"
import { AppLayout } from "../../components/layout/AppLayout"
import styled from "styled-components"
import { Card, Button } from "../../components/styled/GlobalStyles"
import { useWallet } from "../../components/wallet/WalletProvider"
import WamWithDispenserABI from "../../abi/WamWithDispenser.json"
import { ethers } from 'ethers'

const ProfileHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 20px;
  margin-bottom: 28px;
  padding: 24px;
  background: var(--light-bg);
  border-radius: 0;
  border: 4px solid var(--border-primary);
  box-shadow: 4px 4px 0px 0px var(--border-primary);
  font-family: var(--font-mono);
`

const ProfileAvatar = styled.div`
  width: 64px;
  height: 64px;
  border-radius: 0;
  background: var(--brutal-pink);
  border: 4px solid var(--border-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
  font-weight: 900;
  color: var(--text-primary);
  box-shadow: 3px 3px 0px 0px var(--border-primary);
  font-family: var(--font-mono);
`

const ProfileInfo = styled.div`
  flex: 1;
`

const ProfileName = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
`

const Username = styled.h2`
  color: var(--text-primary);
  font-size: 20px;
  font-weight: 900;
  font-family: var(--font-mono);
  margin: 0;
  text-transform: uppercase;
  letter-spacing: 1px;
`

const EditIcon = styled.button`
  background: var(--brutal-yellow);
  border: 3px solid var(--border-primary);
  color: var(--text-primary);
  cursor: pointer;
  padding: 6px 8px;
  font-weight: 900;
  box-shadow: 2px 2px 0px 0px var(--border-primary);
  transition: all 0.1s ease;
  
  &:hover {
    background: var(--brutal-cyan);
    transform: translate(1px, 1px);
    box-shadow: 1px 1px 0px 0px var(--border-primary);
  }
`

const WalletAddress = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--text-primary);
  font-size: 14px;
  font-family: var(--font-mono);
  font-weight: 900;
  background: var(--brutal-lime);
  padding: 6px 12px;
  border: 2px solid var(--border-primary);
  margin-top: 8px;
`

const CopyButton = styled.button`
  background: var(--brutal-orange);
  border: 2px solid var(--border-primary);
  color: var(--text-primary);
  cursor: pointer;
  padding: 4px 6px;
  font-weight: 900;
  transition: all 0.1s ease;
  
  &:hover {
    background: var(--brutal-red);
    transform: translate(1px, 1px);
  }
`



const BalanceSection = styled.div`
  text-align: center;
  margin-bottom: 28px;
  padding: 28px;
  background: var(--light-bg);
  border-radius: 0;
  border: 4px solid var(--border-primary);
  box-shadow: 6px 6px 0px 0px var(--border-primary);
  font-family: var(--font-mono);
`

const BalanceAmount = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-bottom: 8px;
`

const BalanceValue = styled.h1`
  color: var(--text-primary);
  font-size: 52px;
  font-weight: 900;
  font-family: var(--font-mono);
  margin: 0;
  background: var(--brutal-cyan);
  padding: 16px 32px;
  border: 4px solid var(--border-primary);
  box-shadow: 4px 4px 0px 0px var(--border-primary);
  display: inline-block;
  text-transform: uppercase;
  letter-spacing: 2px;
`

const TokenIcon = styled.div`
  width: 36px;
  height: 36px;
  background: var(--brutal-yellow);
  border-radius: 0;
  border: 3px solid var(--border-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  font-weight: 900;
  color: var(--text-primary);
  box-shadow: 2px 2px 0px 0px var(--border-primary);
  font-family: var(--font-mono);
`

const USDValue = styled.div`
  color: var(--text-primary);
  font-size: 18px;
  margin-bottom: 28px;
  font-family: var(--font-mono);
  font-weight: 900;
  background: var(--brutal-lime);
  padding: 8px 16px;
  border: 3px solid var(--border-primary);
  display: inline-block;
  text-transform: uppercase;
  letter-spacing: 1px;
`

const ActionButtons = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-bottom: 24px;
`

const ActionButton = styled(Button)`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 16px 12px;
  background: var(--brutal-violet);
  border: 4px solid var(--border-primary);
  color: var(--text-primary);
  font-family: var(--font-mono);
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  
  &:hover {
    background: var(--brutal-pink);
    transform: translate(2px, 2px);
    box-shadow: 2px 2px 0px 0px var(--border-primary);
  }
`

const ActionIcon = styled.div`
  font-size: 20px;
`

const ActionLabel = styled.span`
  font-size: 12px;
  font-weight: 600;
  font-family: var(--font-exo2);
`

const TabContainer = styled.div`
  display: flex;
  gap: 8px;
  margin-bottom: 20px;
`

const Tab = styled.button<{ $active?: boolean }>`
  flex: 1;
  padding: 14px 20px;
  border-radius: 0;
  border: 4px solid var(--border-primary);
  background: ${(props) => (props.$active ? "var(--brutal-lime)" : "var(--light-bg)")};
  color: var(--text-primary);
  font-weight: 900;
  font-family: var(--font-mono);
  cursor: pointer;
  transition: all 0.1s ease;
  text-transform: uppercase;
  letter-spacing: 1px;
  box-shadow: ${(props) => (props.$active ? "3px 3px 0px 0px var(--border-primary)" : "2px 2px 0px 0px var(--border-primary)")};
  
  &:hover {
    background: var(--brutal-yellow);
    transform: translate(1px, 1px);
    box-shadow: 1px 1px 0px 0px var(--border-primary);
  }
`

const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 64px 24px;
  text-align: center;
  background: var(--light-bg);
  border-radius: 0;
  border: 4px solid var(--border-primary);
  box-shadow: 4px 4px 0px 0px var(--border-primary);
  font-family: var(--font-mono);
`

const EmptyIcon = styled.div`
  width: 84px;
  height: 84px;
  border-radius: 0;
  background: var(--brutal-cyan);
  border: 4px solid var(--border-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 36px;
  margin-bottom: 24px;
  box-shadow: 3px 3px 0px 0px var(--border-primary);
  font-weight: 900;
`

const EmptyTitle = styled.h3`
  color: var(--text-primary);
  font-size: 22px;
  font-weight: 900;
  font-family: var(--font-mono);
  margin: 0 0 16px 0;
  text-transform: uppercase;
  letter-spacing: 1px;
`

const EmptyDescription = styled.p`
  color: var(--text-primary);
  font-size: 14px;
  line-height: 1.6;
  font-family: var(--font-mono);
  margin: 0;
  max-width: 300px;
  font-weight: 700;
`

const MatchCard = styled(Card)`
  margin-bottom: 12px;
  padding: 16px;
`

const MatchHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
`

const MatchStatus = styled.div<{ $status: "live" | "ended" | "upcoming" }>`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 10px;
  font-weight: 600;
  background: ${(props) => {
    switch (props.$status) {
      case "live":
        return "rgba(34, 197, 94, 0.2)"
      case "ended":
        return "rgba(239, 68, 68, 0.2)"
      case "upcoming":
        return "rgba(251, 191, 36, 0.2)"
    }
  }};
  color: ${(props) => {
    switch (props.$status) {
      case "live":
        return "var(--primary-green)"
      case "ended":
        return "var(--red-primary)"
      case "upcoming":
        return "var(--accent-yellow)"
    }
  }};
`

const StatusDot = styled.div<{ $status: "live" | "ended" | "upcoming" }>`
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: ${(props) => {
    switch (props.$status) {
      case "live":
        return "var(--primary-green)"
      case "ended":
        return "var(--red-primary)"
      case "upcoming":
        return "var(--accent-yellow)"
    }
  }};
  ${(props) =>
    props.$status === "live" &&
    `
    animation: pulse 2s infinite;
    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.5; }
    }
  `}
`

const ConnectWalletButton = styled(Button)`
  margin-top: 20px;
  padding: 12px 24px;
  font-size: 16px;
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: 1px;
  background: var(--brutal-violet);
  border: 4px solid var(--border-primary);
  color: var(--text-primary);
  transition: all 0.1s ease;

  &:hover {
    background: var(--brutal-pink);
    transform: translate(2px, 2px);
    box-shadow: 2px 2px 0px 0px var(--border-primary);
  }
`


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
  z-index: 1000;
`

const PopupContent = styled.div`
  background: var(--light-bg);
  border: 4px solid var(--border-primary);
  box-shadow: 8px 8px 0px 0px var(--border-primary);
  padding: 32px;
  max-width: 500px;
  width: 90%;
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

const PopupText = styled.p`
  font-size: 14px;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0 0 16px 0;
  text-align: center;
`

const AddressDisplay = styled.div`
  background: var(--brutal-lime);
  border: 3px solid var(--border-primary);
  padding: 16px;
  margin: 16px 0;
  word-break: break-all;
  font-family: var(--font-mono);
  font-weight: 900;
  text-align: center;
  position: relative;
`

const CopyAddressButton = styled(Button)`
  margin-top: 12px;
  background: var(--brutal-yellow);
  
  &:hover {
    background: var(--brutal-orange);
  }
`

const InputField = styled.input`
  width: 100%;
  padding: 12px;
  border: 3px solid var(--border-primary);
  background: var(--light-bg);
  color: var(--text-primary);
  font-family: var(--font-mono);
  font-weight: 700;
  margin-bottom: 16px;
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

const MaxButton = styled.button`
  background: var(--brutal-cyan);
  border: 2px solid var(--border-primary);
  color: var(--text-primary);
  padding: 8px 12px;
  font-family: var(--font-mono);
  font-weight: 900;
  cursor: pointer;
  margin-left: 8px;
  transition: all 0.1s ease;
  
  &:hover {
    background: var(--brutal-pink);
    transform: translate(1px, 1px);
  }
`

const PopupButtons = styled.div`
  display: flex;
  gap: 12px;
  margin-top: 24px;
`

const PopupButton = styled(Button)`
  flex: 1;
  font-size: 14px;
  padding: 12px;
  text-transform: uppercase;
`

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState("Live")
  const { wallet, connectWallet } = useWallet()
  const [showDepositPopup, setShowDepositPopup] = useState(false)
  const [showWithdrawPopup, setShowWithdrawPopup] = useState(false)
  const [withdrawAmount, setWithdrawAmount] = useState("")
  const [withdrawAddress, setWithdrawAddress] = useState("")
  const wamContractAddress = '0x3841F6eeE655a48945CDD8102fE0dba51a2a8b43'
  const [isBuyingTokens, setIsBuyingTokens] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const handleDeposit = () => {
    setShowDepositPopup(true)
  }

  const handleWithdraw = () => {
    setShowWithdrawPopup(true)
  }

  const handleCopyAddress = () => {
    if (wallet.address) {
      navigator.clipboard.writeText(wallet.address)
    }
  }

  const handleMaxWithdraw = () => {
    setWithdrawAmount(wallet.balance)
  }

  const handleBuyTokens = async () => {
    console.log('Starting buy tokens transaction...')
    console.log('AVAX Amount:', withdrawAmount)
    console.log('WAM Contract Address:', wamContractAddress)
    
    const currentProvider = typeof window !== 'undefined' ? (window.avalanche || window.ethereum) : null
    
    if (!currentProvider) {
      console.error('No provider available')
      setError("Please connect your wallet first")
      return
    }
    

    
    if (!withdrawAmount || parseFloat(withdrawAmount) <= 0) {
      console.error('Invalid AVAX amount')
      setError("Please enter a valid AVAX amount")
      return
    }
    
    setIsBuyingTokens(true)
    setError(null)
    setSuccess(null)
    const ABI = [
      "function buyTokens() payable",
      "function balanceOf(address account) view returns (uint256)",
      "function decimals() view returns (uint8)",
      "function symbol() view returns (string)"
    ];
    try {
      console.log('Creating provider and signer...')
      const provider = new ethers.BrowserProvider(currentProvider)
      await provider.send('eth_requestAccounts', [])
      const signer = await provider.getSigner()
      
      console.log('Signer address:', await signer.getAddress())
      console.log('Creating contract instance with ABI...')
      const contract = new ethers.Contract(wamContractAddress, WamWithDispenserABI.abi, signer)
      
      console.log('Contract instance created:', contract.target)
      console.log('Parsing AVAX amount:', withdrawAmount)
      const valueInWei = ethers.parseEther(withdrawAmount)
      console.log('Value in Wei:', valueInWei.toString())
      
      console.log('Calling buyTokens with value:', valueInWei.toString())
      const tx = await contract.buyTokens({ value: valueInWei })
      
      console.log('Transaction submitted:', tx.hash)
      setSuccess("Buy tokens transaction submitted! Waiting for confirmation...")
      
      console.log('Waiting for transaction confirmation...')
      const receipt = await tx.wait()
      console.log('Transaction confirmed:', receipt)
      console.log('Block number:', receipt.blockNumber)
      console.log('Gas used:', receipt.gasUsed.toString())
      
      setSuccess("🎉 Tokens purchased successfully!")
      setShowDepositPopup(false)
      setWithdrawAmount('')
      
    } catch (error) {
      console.error('Buy tokens error:', error)
      if (error instanceof Error) {
        console.error('Error message:', error.message)
        if (error.message.includes('user rejected')) {
          setError("Transaction was rejected by user")
        } else if (error.message.includes('insufficient funds')) {
          setError("Insufficient AVAX for transaction")
        } else {
          setError(`Transaction failed: ${error.message}`)
        }
      } else {
        setError('Failed to buy tokens')
      }
    } finally {
      setIsBuyingTokens(false)
    }
  }

  const handleConfirmWithdraw = () => {
    // TODO: Call smart contract withdraw function
    console.log(`Withdrawing ${withdrawAmount} to ${withdrawAddress}`)
    setShowWithdrawPopup(false)
    setWithdrawAmount("")
    setWithdrawAddress("")
  }





  // If wallet is not connected, show connect prompt
  if (!wallet.isConnected) {
    return (
      <AppLayout>
        <EmptyState>
          <EmptyIcon>🔗</EmptyIcon>
          <EmptyTitle>Wallet Not Connected</EmptyTitle>
          <EmptyDescription>
            Connect your wallet to view your profile and manage your assets.
          </EmptyDescription>
          <ConnectWalletButton onClick={connectWallet} disabled={wallet.connecting}>
            {wallet.connecting ? "Connecting..." : "Connect Wallet"}
          </ConnectWalletButton>
        </EmptyState>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <ProfileHeader>
        <ProfileAvatar>T</ProfileAvatar>
        <ProfileInfo>
          <ProfileName>
            <Username>
              {wallet.address ? `${wallet.address.slice(0, 6)}...${wallet.address.slice(-4)}` : "Not Connected"}
            </Username>
            <EditIcon>✏️</EditIcon>
          </ProfileName>
          <WalletAddress>
            {wallet.address ? `${wallet.address.slice(0, 8)}...${wallet.address.slice(-8)}` : "No wallet connected"}
            <CopyButton onClick={handleCopyAddress}>📋</CopyButton>
          </WalletAddress>

        </ProfileInfo>
      </ProfileHeader>

      <BalanceSection>
        <BalanceAmount>
          <BalanceValue>{parseFloat(wallet.balance).toFixed(2)}</BalanceValue>
          <TokenIcon>$WAM</TokenIcon>
        </BalanceAmount>
        <USDValue>{parseFloat(wallet.balance).toFixed(2)} $WAM TOKENS</USDValue>

        <ActionButtons>
          <ActionButton onClick={handleDeposit}>
            <ActionIcon>💰</ActionIcon>
            <ActionLabel>Deposit</ActionLabel>
          </ActionButton>
          <ActionButton onClick={handleWithdraw}>
            <ActionIcon>💸</ActionIcon>
            <ActionLabel>Withdraw</ActionLabel>
          </ActionButton>
        </ActionButtons>
      </BalanceSection>




      {showDepositPopup && (
        <PopupOverlay onClick={() => setShowDepositPopup(false)}>
          <PopupContent onClick={(e) => e.stopPropagation()}>
            <PopupTitle>💰 BUY $WAM TOKENS</PopupTitle>
            <PopupText>
              Exchange your AVAX for $WAM tokens. Enter the amount of AVAX to spend.
            </PopupText>

            <div style={{ display: 'flex', alignItems: 'center' }}>
              <InputField
                type="number"
                placeholder="AVAX amount to spend"
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                max={wallet.balance}
              />
              <MaxButton onClick={handleMaxWithdraw}>MAX</MaxButton>
            </div>
            {error && (
              <div style={{
                background: 'var(--brutal-red)',
                padding: '8px',
                border: '2px solid var(--border-primary)',
                color: 'var(--text-primary)',
                fontFamily: 'var(--font-mono)',
                fontSize: '12px',
                margin: '8px 0'
              }}>
                ⚠️ {error}
              </div>
            )}
            {success && (
              <div style={{
                background: 'var(--brutal-lime)',
                padding: '8px',
                border: '2px solid var(--border-primary)',
                color: 'var(--text-primary)',
                fontFamily: 'var(--font-mono)',
                fontSize: '12px',
                margin: '8px 0'
              }}>
                ✅ {success}
              </div>
            )}
            <PopupButtons>
              <PopupButton onClick={() => setShowDepositPopup(false)}>
                CANCEL
              </PopupButton>
              <PopupButton 
                onClick={handleBuyTokens}
                disabled={!withdrawAmount || isBuyingTokens}
              >
                {isBuyingTokens ? 'BUYING...' : 'BUY $WAM'}
              </PopupButton>
            </PopupButtons>
          </PopupContent>
        </PopupOverlay>
      )}

      {showWithdrawPopup && (
        <PopupOverlay onClick={() => setShowWithdrawPopup(false)}>
          <PopupContent onClick={(e) => e.stopPropagation()}>
            <PopupTitle>💸 WITHDRAW FUNDS</PopupTitle>
            <PopupText>
              Enter the amount and destination address for withdrawal.
            </PopupText>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <InputField
                type="number"
                placeholder="Amount to withdraw"
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                max={wallet.balance}
              />
              <MaxButton onClick={handleMaxWithdraw}>MAX</MaxButton>
            </div>
            <InputField
              type="text"
              placeholder="Destination wallet address (0x...)"
              value={withdrawAddress}
              onChange={(e) => setWithdrawAddress(e.target.value)}
            />
            <PopupButtons>
              <PopupButton onClick={() => setShowWithdrawPopup(false)}>
                CANCEL
              </PopupButton>
              <PopupButton 
                onClick={handleConfirmWithdraw}
                disabled={!withdrawAmount || !withdrawAddress}
              >
                CONFIRM WITHDRAW
              </PopupButton>
            </PopupButtons>
          </PopupContent>
        </PopupOverlay>
      )}
    </AppLayout>
  )
}

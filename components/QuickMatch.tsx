"use client"

import { useState, useEffect } from 'react'
import styled from 'styled-components'
import { Button } from './styled/GlobalStyles'
import { useQuickMatch } from '@/hooks/useQuickMatch'
import { useWallet } from './wallet/WalletProvider'

const QuickMatchContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 24px;
  background: var(--light-bg);
  border: 4px solid var(--border-primary);
  box-shadow: 4px 4px 0px 0px var(--border-primary);
  font-family: var(--font-mono);
`

const QuickMatchTitle = styled.h2`
  font-size: 24px;
  font-weight: 900;
  color: var(--text-primary);
  margin: 0;
  text-transform: uppercase;
  letter-spacing: 2px;
  text-align: center;
`

const QuickMatchButton = styled(Button)`
  background: var(--brutal-lime);
  font-size: 18px;
  padding: 16px 32px;
  
  &:hover {
    background: var(--brutal-cyan);
  }
  
  &:disabled {
    background: var(--brutal-red);
    opacity: 0.7;
  }
`

const CancelButton = styled(Button)`
  background: var(--brutal-red);
  font-size: 16px;
  padding: 12px 24px;
  
  &:hover {
    background: var(--brutal-orange);
  }
`

const StatusContainer = styled.div`
  text-align: center;
  padding: 16px;
  background: var(--brutal-cyan);
  border: 3px solid var(--border-primary);
  box-shadow: 2px 2px 0px 0px var(--border-primary);
`

const StatusText = styled.div`
  font-size: 16px;
  font-weight: 900;
  color: var(--text-primary);
  margin: 0 0 8px 0;
  text-transform: uppercase;
`

const RoomCode = styled.div`
  font-size: 20px;
  font-weight: 900;
  color: var(--text-primary);
  background: var(--brutal-yellow);
  padding: 8px 16px;
  border: 2px solid var(--border-primary);
  display: inline-block;
  letter-spacing: 2px;
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

interface QuickMatchProps {
  userId: string
  teamId: string
  onBattleStart: (battleId: string) => void
}

export function QuickMatch({ userId, teamId, onBattleStart }: QuickMatchProps) {
  const { wallet } = useWallet()
  const { isWaiting, battleId, roomSlug, quickMatch, cancelWait } = useQuickMatch(userId, teamId)

  // Trigger battle start when battleId is set
  useEffect(() => {
    if (battleId) {
      console.log('🎯 REDIRECT: Navigating to battle:', battleId)
      onBattleStart(battleId)
    }
  }, [battleId, onBattleStart])

  // Show loading while redirecting
  if (battleId) {
    return (
      <QuickMatchContainer>
        <QuickMatchTitle>🎮 Quick Match</QuickMatchTitle>
        <StatusContainer>
          <StatusText>
            <LoadingSpinner />
            Starting battle...
          </StatusText>
        </StatusContainer>
      </QuickMatchContainer>
    )
  }

  if (!wallet.isConnected) {
    return (
      <QuickMatchContainer>
        <QuickMatchTitle>🎮 Quick Match</QuickMatchTitle>
        <StatusText>Connect your wallet to start battling!</StatusText>
      </QuickMatchContainer>
    )
  }

  return (
    <QuickMatchContainer>
      <QuickMatchTitle>🎮 Quick Match</QuickMatchTitle>
      
      {!isWaiting ? (
        <>
          <StatusText>Find an opponent instantly!</StatusText>
          <QuickMatchButton 
            onClick={quickMatch}
            $fullWidth
          >
            ⚡ FIND BATTLE
          </QuickMatchButton>
        </>
      ) : (
        <StatusContainer>
          <StatusText>
            <LoadingSpinner />
            Waiting for opponent...
          </StatusText>
          
          <CancelButton onClick={cancelWait}>
            ❌ CANCEL
          </CancelButton>
        </StatusContainer>
      )}
    </QuickMatchContainer>
  )
}
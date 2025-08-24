"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { AppLayout } from '@/components/layout/AppLayout'
import { QuickMatch } from '@/components/QuickMatch'
import { useWallet } from '@/components/wallet/WalletProvider'
import styled from 'styled-components'

const QuickMatchContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;
  max-width: 600px;
  margin: 0 auto;
`

const BackButton = styled.button`
  background: var(--brutal-red);
  border: 4px solid var(--border-primary);
  color: var(--text-primary);
  font-family: var(--font-mono);
  font-weight: 900;
  font-size: 16px;
  padding: 12px 24px;
  cursor: pointer;
  text-transform: uppercase;
  letter-spacing: 1px;
  box-shadow: 4px 4px 0px 0px var(--border-primary);
  transition: all 0.1s ease;
  
  &:hover {
    background: var(--brutal-orange);
    transform: translate(2px, 2px);
    box-shadow: 2px 2px 0px 0px var(--border-primary);
  }
`

export default function QuickMatchPage() {
  const router = useRouter()
  const { wallet } = useWallet()
  const [userId, setUserId] = useState<string | null>(null)
  const [teamId, setTeamId] = useState<string | null>(null)

  useEffect(() => {
    const initializeUser = async () => {
      if (!wallet.isConnected || !wallet.address) return

      try {
        // Get or create user
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

          // Get user's team
          const teamResponse = await fetch(`/api/teams?userId=${user.id}`)
          if (teamResponse.ok) {
            const team = await teamResponse.json()
            if (team && (team.beast1Id || team.beast2Id || team.beast3Id)) {
              setTeamId(team.id)
            }
          }
        }
      } catch (error) {
        console.error('Error initializing user:', error)
      }
    }

    initializeUser()
  }, [wallet.isConnected, wallet.address])

  const handleBattleStart = (battleId: string) => {
    router.push(`/battle/${battleId}`)
  }

  const handleBack = () => {
    router.push('/home')
  }

  return (
    <AppLayout>
      <QuickMatchContainer>
        <BackButton onClick={handleBack}>
          ← BACK TO HOME
        </BackButton>

        {userId && teamId ? (
          <QuickMatch 
            userId={userId}
            teamId={teamId}
            onBattleStart={handleBattleStart}
          />
        ) : (
          <div style={{
            padding: '24px',
            background: 'var(--brutal-red)',
            border: '4px solid var(--border-primary)',
            textAlign: 'center',
            color: 'var(--text-primary)',
            fontFamily: 'var(--font-mono)',
            fontWeight: '900'
          }}>
            {!wallet.isConnected ? (
              'CONNECT WALLET TO BATTLE'
            ) : !teamId ? (
              'CREATE A TEAM FIRST IN TEAM PAGE'
            ) : (
              'LOADING...'
            )}
          </div>
        )}
      </QuickMatchContainer>
    </AppLayout>
  )
}
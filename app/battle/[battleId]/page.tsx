"use client"

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { AppLayout } from '@/components/layout/AppLayout'
import { useWallet } from '@/components/wallet/WalletProvider'
import { supabase } from '@/lib/supabase'
import styled from 'styled-components'
import { Button } from '@/components/styled/GlobalStyles'

const BattleContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;
  max-width: 1200px;
  margin: 0 auto;
`

const BattleHeader = styled.div`
  background: var(--brutal-red);
  border: 4px solid var(--border-primary);
  padding: 24px;
  text-align: center;
  box-shadow: 4px 4px 0px 0px var(--border-primary);
`

const BattleTitle = styled.h1`
  font-size: 28px;
  font-weight: 900;
  color: var(--text-primary);
  margin: 0 0 8px 0;
  text-transform: uppercase;
  letter-spacing: 2px;
  font-family: var(--font-mono);
`

const BattleStatus = styled.div`
  font-size: 16px;
  font-weight: 700;
  color: var(--text-primary);
  font-family: var(--font-mono);
  text-transform: uppercase;
`

const WaitingRoom = styled.div`
  background: var(--brutal-cyan);
  border: 4px solid var(--border-primary);
  padding: 40px;
  text-align: center;
  box-shadow: 4px 4px 0px 0px var(--border-primary);
`

const WaitingText = styled.h2`
  font-size: 24px;
  font-weight: 900;
  color: var(--text-primary);
  margin: 0 0 16px 0;
  font-family: var(--font-mono);
  text-transform: uppercase;
`

const LoadingSpinner = styled.div`
  display: inline-block;
  width: 40px;
  height: 40px;
  border: 4px solid var(--border-primary);
  border-radius: 50%;
  border-top-color: transparent;
  animation: spin 1s ease-in-out infinite;
  margin: 20px 0;
  
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
`

const TurnIndicator = styled.div<{ $isMyTurn: boolean }>`
  background: ${props => props.$isMyTurn ? 'var(--brutal-lime)' : 'var(--brutal-orange)'};
  border: 4px solid var(--border-primary);
  padding: 16px;
  text-align: center;
  font-size: 18px;
  font-weight: 900;
  color: var(--text-primary);
  font-family: var(--font-mono);
  text-transform: uppercase;
  box-shadow: 4px 4px 0px 0px var(--border-primary);
`

export default function BattlePage() {
  const params = useParams()
  const battleId = params.battleId as string
  const { wallet } = useWallet()
  
  const [battle, setBattle] = useState<any>(null)
  const [isMyTurn, setIsMyTurn] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [waitingForOpponent, setWaitingForOpponent] = useState(false)

  useEffect(() => {
    const initUser = async () => {
      if (!wallet.isConnected || !wallet.address) return

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
        }
      } catch (error) {
        console.error('Error initializing user:', error)
      }
    }

    initUser()
  }, [wallet.isConnected, wallet.address])

  useEffect(() => {
    if (!battleId || !userId) return

    const loadBattle = async () => {
      try {
        const { data: battleData } = await supabase
          .from('battles')
          .select('*')
          .eq('id', battleId)
          .single()

        if (battleData) {
          setBattle(battleData)
          
          if (!battleData.player2_id) {
            setWaitingForOpponent(true)
          } else {
            setWaitingForOpponent(false)
            const isPlayer1 = battleData.player1_id === userId
            const isPlayer1Turn = battleData.current_turn % 2 === 1
            setIsMyTurn(isPlayer1 ? isPlayer1Turn : !isPlayer1Turn)
          }
        }
      } catch (error) {
        console.error('Error loading battle:', error)
      } finally {
        setLoading(false)
      }
    }

    loadBattle()

    // Subscribe to battle updates
    const channel = supabase
      .channel(`battle:${battleId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'battles',
        filter: `id=eq.${battleId}`
      }, (payload) => {
        setBattle(payload.new)
        
        if (payload.new.player2_id && waitingForOpponent) {
          setWaitingForOpponent(false)
        }
        
        const isPlayer1 = payload.new.player1_id === userId
        const isPlayer1Turn = payload.new.current_turn % 2 === 1
        setIsMyTurn(isPlayer1 ? isPlayer1Turn : !isPlayer1Turn)
      })
      .subscribe()

    return () => channel.unsubscribe()
  }, [battleId, userId, waitingForOpponent])

  if (loading) {
    return (
      <AppLayout>
        <BattleContainer>
          <BattleHeader>
            <BattleTitle>⚔️ LOADING BATTLE</BattleTitle>
            <LoadingSpinner />
          </BattleHeader>
        </BattleContainer>
      </AppLayout>
    )
  }

  if (!wallet.isConnected) {
    return (
      <AppLayout>
        <BattleContainer>
          <BattleHeader>
            <BattleTitle>⚔️ BATTLE ARENA</BattleTitle>
            <BattleStatus>Connect wallet to join battle</BattleStatus>
          </BattleHeader>
        </BattleContainer>
      </AppLayout>
    )
  }

  if (waitingForOpponent) {
    return (
      <AppLayout>
        <BattleContainer>
          <BattleHeader>
            <BattleTitle>⚔️ BATTLE ARENA</BattleTitle>
            <BattleStatus>Battle ID: {battleId}</BattleStatus>
          </BattleHeader>
          
          <WaitingRoom>
            <WaitingText>🕐 Waiting for Opponent...</WaitingText>
            <LoadingSpinner />
            <p style={{ 
              color: 'var(--text-primary)', 
              fontFamily: 'var(--font-mono)',
              fontSize: '14px',
              margin: '16px 0 0 0'
            }}>
              Share this URL with your opponent to join the battle!
            </p>
          </WaitingRoom>
        </BattleContainer>
      </AppLayout>
    )
  }

  if (!battle) {
    return (
      <AppLayout>
        <BattleContainer>
          <BattleHeader>
            <BattleTitle>⚔️ BATTLE NOT FOUND</BattleTitle>
            <BattleStatus>Invalid battle ID</BattleStatus>
          </BattleHeader>
        </BattleContainer>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <BattleContainer>
        <BattleHeader>
          <BattleTitle>⚔️ PVP BATTLE</BattleTitle>
          <BattleStatus>Turn {battle.current_turn}</BattleStatus>
        </BattleHeader>

        <TurnIndicator $isMyTurn={isMyTurn}>
          {isMyTurn ? '🎯 YOUR TURN' : '⏳ OPPONENT\'S TURN'}
        </TurnIndicator>

        <div style={{
          background: 'var(--brutal-lime)',
          border: '4px solid var(--border-primary)',
          padding: '40px',
          textAlign: 'center',
          fontFamily: 'var(--font-mono)',
          fontSize: '18px',
          fontWeight: '900',
          color: 'var(--text-primary)'
        }}>
          🎮 REAL-TIME PVP BATTLE IN PROGRESS!
          <br />
          <small style={{ fontSize: '14px' }}>
            Battle system connected and waiting for moves...
          </small>
        </div>
      </BattleContainer>
    </AppLayout>
  )
}
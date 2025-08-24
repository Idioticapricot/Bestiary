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

const BattleArena = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
  background: var(--light-bg);
  border: 4px solid var(--border-primary);
  padding: 24px;
  box-shadow: 4px 4px 0px 0px var(--border-primary);
`

const PlayerSide = styled.div`
  text-align: center;
`

const PlayerTitle = styled.h3`
  font-size: 18px;
  font-weight: 900;
  color: var(--text-primary);
  margin: 0 0 16px 0;
  font-family: var(--font-mono);
  text-transform: uppercase;
  background: var(--brutal-lime);
  padding: 8px 16px;
  border: 3px solid var(--border-primary);
`

const BeastGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
`

const BeastSlot = styled.div<{ $active?: boolean }>`
  background: ${props => props.$active ? 'var(--brutal-yellow)' : 'var(--brutal-pink)'};
  border: 3px solid var(--border-primary);
  padding: 12px;
  text-align: center;
  box-shadow: 2px 2px 0px 0px var(--border-primary);
`

const BeastName = styled.div`
  font-size: 12px;
  font-weight: 900;
  color: var(--text-primary);
  font-family: var(--font-mono);
  text-transform: uppercase;
  margin-bottom: 4px;
`

const BeastHP = styled.div`
  font-size: 10px;
  font-weight: 900;
  color: var(--text-primary);
  font-family: var(--font-mono);
  background: var(--brutal-red);
  padding: 2px 6px;
  border: 2px solid var(--border-primary);
`

const MoveSelector = styled.div`
  background: var(--light-bg);
  border: 4px solid var(--border-primary);
  padding: 24px;
  box-shadow: 4px 4px 0px 0px var(--border-primary);
`

const MovesGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
`

const MoveButton = styled(Button)`
  background: var(--brutal-cyan);
  padding: 16px;
  font-size: 14px;
  
  &:hover:not(:disabled) {
    background: var(--brutal-yellow);
  }
  
  &:disabled {
    background: var(--brutal-red);
    opacity: 0.5;
  }
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
  const [myBeasts, setMyBeasts] = useState<any[]>([])
  const [opponentBeasts, setOpponentBeasts] = useState<any[]>([])

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
            
            // Load team beasts
            const isPlayer1 = battleData.player1_id === userId
            const myTeamId = isPlayer1 ? battleData.player1_team : battleData.player2_team
            const opponentTeamId = isPlayer1 ? battleData.player2_team : battleData.player1_team
            
            if (myTeamId) {
              loadTeamBeasts(myTeamId, true)
            }
            if (opponentTeamId) {
              loadTeamBeasts(opponentTeamId, false)
            }
            
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

  const loadTeamBeasts = async (teamId: string, isMyTeam: boolean) => {
    try {
      const { data: team } = await supabase
        .from('teams')
        .select(`
          beast1:beasts!beast1_id(
            id, name, health, stamina, power, element_type, nft_metadata_uri,
            moves:beast_moves(
              move:moves(id, name, damage, element_type, description)
            )
          ),
          beast2:beasts!beast2_id(
            id, name, health, stamina, power, element_type, nft_metadata_uri,
            moves:beast_moves(
              move:moves(id, name, damage, element_type, description)
            )
          ),
          beast3:beasts!beast3_id(
            id, name, health, stamina, power, element_type, nft_metadata_uri,
            moves:beast_moves(
              move:moves(id, name, damage, element_type, description)
            )
          )
        `)
        .eq('id', teamId)
        .single()

      if (team) {
        const beasts = [team.beast1, team.beast2, team.beast3].filter(Boolean)
        if (isMyTeam) {
          setMyBeasts(beasts)
        } else {
          setOpponentBeasts(beasts)
        }
      }
    } catch (error) {
      console.error('Error loading team beasts:', error)
    }
  }

  const makeMove = async (moveId: string, targetBeastId: string) => {
    if (!isMyTurn || !myBeasts[0]) return

    console.log('🎯 BATTLE: Making move:', { moveId, targetBeastId })

    try {
      const { error } = await supabase
        .from('battle_actions')
        .insert({
          battle_id: battleId,
          player_id: userId,
          beast_id: myBeasts[0].id,
          move_id: moveId,
          target_beast_id: targetBeastId,
          turn_number: battle.current_turn
        })

      if (!error) {
        // Update turn
        await supabase
          .from('battles')
          .update({ current_turn: battle.current_turn + 1 })
          .eq('id', battleId)
        
        console.log('✅ BATTLE: Move completed, turn passed')
      }
    } catch (error) {
      console.error('❌ BATTLE: Move failed:', error)
    }
  }

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

        <BattleArena>
          <PlayerSide>
            <PlayerTitle>🛡️ YOUR TEAM</PlayerTitle>
            <BeastGrid>
              {myBeasts.map((beast, index) => (
                <BeastSlot key={beast.id} $active={index === 0}>
                  {beast.nft_metadata_uri && (
                    <img 
                      src={beast.nft_metadata_uri} 
                      alt={beast.name}
                      style={{
                        width: '60px',
                        height: '60px',
                        objectFit: 'contain',
                        border: '2px solid var(--border-primary)',
                        marginBottom: '8px'
                      }}
                    />
                  )}
                  <BeastName>{beast.name}</BeastName>
                  <BeastHP>HP: {beast.health}</BeastHP>
                </BeastSlot>
              ))}
            </BeastGrid>
          </PlayerSide>

          <PlayerSide>
            <PlayerTitle>⚔️ OPPONENT</PlayerTitle>
            <BeastGrid>
              {opponentBeasts.map((beast, index) => (
                <BeastSlot key={beast.id} $active={index === 0}>
                  {beast.nft_metadata_uri && (
                    <img 
                      src={beast.nft_metadata_uri} 
                      alt={beast.name}
                      style={{
                        width: '60px',
                        height: '60px',
                        objectFit: 'contain',
                        border: '2px solid var(--border-primary)',
                        marginBottom: '8px'
                      }}
                    />
                  )}
                  <BeastName>{beast.name}</BeastName>
                  <BeastHP>HP: {beast.health}</BeastHP>
                </BeastSlot>
              ))}
            </BeastGrid>
          </PlayerSide>
        </BattleArena>

        {isMyTurn && myBeasts[0] && (
          <MoveSelector>
            <h3 style={{ 
              color: 'var(--text-primary)', 
              fontFamily: 'var(--font-mono)',
              textAlign: 'center',
              margin: '0 0 16px 0'
            }}>
              SELECT MOVE FOR {myBeasts[0].name.toUpperCase()}
            </h3>
            <MovesGrid>
              {myBeasts[0].moves?.map((beastMove: any) => (
                <MoveButton
                  key={beastMove.move.id}
                  onClick={() => makeMove(beastMove.move.id, opponentBeasts[0]?.id)}
                  disabled={!opponentBeasts[0]}
                >
                  {beastMove.move.name}
                  <br />
                  <small>DMG: {beastMove.move.damage}</small>
                </MoveButton>
              )) || (
                <div style={{ 
                  gridColumn: '1 / -1', 
                  textAlign: 'center',
                  color: 'var(--text-primary)',
                  fontFamily: 'var(--font-mono)'
                }}>
                  No moves available
                </div>
              )}
            </MovesGrid>
          </MoveSelector>
        )}
      </BattleContainer>
    </AppLayout>
  )
}
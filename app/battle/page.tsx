"use client"

import { useState, useEffect } from "react"
import { AppLayout } from "../../components/layout/AppLayout"
import styled from "styled-components"
import { Button } from "../../components/styled/GlobalStyles"

import { Beast, Move } from "../../types/beast"
import { BattleArena } from "../../components/battle/BattleArena"
import { MoveSelector } from "../../components/battle/MoveSelector"
import { BattleLog } from "../../components/battle/BattleLog"
import { useWallet } from "../../components/wallet/WalletProvider"

const BattleContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
  min-height: 100vh;
`

const BattleHeader = styled.div`
  background: var(--brutal-red);
  border: 4px solid var(--border-primary);
  padding: 20px;
  text-align: center;
  box-shadow: 4px 4px 0px 0px var(--border-primary);
`

const BattleTitle = styled.h1`
  font-size: 28px;
  font-weight: 900;
  color: var(--text-primary);
  margin: 0;
  text-transform: uppercase;
  letter-spacing: 2px;
  font-family: var(--font-mono);
`

const BattleStatus = styled.div`
  font-size: 14px;
  font-weight: 700;
  color: var(--text-primary);
  margin-top: 8px;
  text-transform: uppercase;
  font-family: var(--font-mono);
`

const BattleContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
  flex: 1;
`

const StartBattleButton = styled(Button)`
  background: var(--brutal-orange);
  font-size: 18px;
  padding: 16px 32px;
  text-transform: uppercase;
  letter-spacing: 2px;
  
  &:hover {
    background: var(--brutal-yellow);
  }
`

const BattleModeSelector = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 32px;
  padding: 40px;
  max-width: 800px;
  margin: 0 auto;
`

const ModeCard = styled.div`
  background: var(--light-bg);
  border: 4px solid var(--border-primary);
  padding: 32px 24px;
  text-align: center;
  cursor: pointer;
  transition: all 0.1s ease;
  box-shadow: 4px 4px 0px 0px var(--border-primary);
  
  &:hover {
    background: var(--brutal-lime);
    transform: translate(2px, 2px);
    box-shadow: 2px 2px 0px 0px var(--border-primary);
  }
`

const ModeIcon = styled.div`
  font-size: 64px;
  margin-bottom: 16px;
`

const ModeTitle = styled.h2`
  font-size: 24px;
  font-weight: 900;
  color: var(--text-primary);
  margin: 0 0 12px 0;
  text-transform: uppercase;
  letter-spacing: 2px;
  font-family: var(--font-mono);
`

const ModeDesc = styled.p`
  font-size: 14px;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0 0 16px 0;
  font-family: var(--font-mono);
`

const ModeReward = styled.div`
  background: var(--brutal-yellow);
  border: 3px solid var(--border-primary);
  padding: 8px 16px;
  font-size: 12px;
  font-weight: 900;
  color: var(--text-primary);
  font-family: var(--font-mono);
  text-transform: uppercase;
  letter-spacing: 1px;
  display: inline-block;
`

const ArenaSetup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;
  padding: 40px;
`

const BackButton = styled(Button)`
  background: var(--brutal-red);
  align-self: flex-start;
  
  &:hover {
    background: var(--brutal-orange);
  }
`

const TeamDisplay = styled.div`
  background: var(--light-bg);
  border: 4px solid var(--border-primary);
  padding: 24px;
  box-shadow: 4px 4px 0px 0px var(--border-primary);
`

const TeamTitle = styled.h2`
  font-size: 20px;
  font-weight: 900;
  color: var(--text-primary);
  margin: 0 0 16px 0;
  text-align: center;
  text-transform: uppercase;
  letter-spacing: 2px;
  font-family: var(--font-mono);
  background: var(--brutal-cyan);
  padding: 8px 16px;
  border: 3px solid var(--border-primary);
`

const TeamGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
`

const TeamSlot = styled.div`
  background: var(--brutal-lime);
  border: 4px solid var(--border-primary);
  padding: 20px;
  text-align: center;
  box-shadow: 2px 2px 0px 0px var(--border-primary);
`

const BeastIcon = styled.div`
  font-size: 32px;
  margin-bottom: 8px;
`

const BeastName = styled.div`
  font-size: 12px;
  font-weight: 900;
  color: var(--text-primary);
  font-family: var(--font-mono);
  text-transform: uppercase;
  margin-bottom: 4px;
`

const BeastLevel = styled.div`
  font-size: 10px;
  font-weight: 900;
  color: var(--text-primary);
  font-family: var(--font-mono);
  background: var(--brutal-pink);
  padding: 2px 6px;
  border: 2px solid var(--border-primary);
`

interface BattleBeast {
  id: string
  name: string
  maxHP: number
  currentHP: number
  power: number
  stamina: number
  elementType: string
  imageUrl: string | null
  moves: Move[]
}

interface BattleState {
  id: string
  player1Beast: BattleBeast
  player2Beast: BattleBeast
  player1Team: Beast[]
  player2Team: Beast[]
  currentTurn: 'player1' | 'player2'
  battleLog: string[]
  winner: string | null
  isProcessing: boolean
  pot: number
}

export default function BattlePage() {
  const [battleMode, setBattleMode] = useState<'select' | 'arena' | 'combat'>('select')
  const [selectedMode, setSelectedMode] = useState<'pvp' | 'pve' | null>(null)
  const [battleState, setBattleState] = useState<BattleState | null>(null)
  const [selectedMove, setSelectedMove] = useState<Move | null>(null)
  const [showSwitcher, setShowSwitcher] = useState(false)
  const [player1Team, setPlayer1Team] = useState<Beast[]>([])
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)
  const { wallet } = useWallet()

  const [player2Team, setPlayer2Team] = useState<Beast[]>([])

  useEffect(() => {
    const loadUserTeam = async () => {
      if (!wallet.isConnected || !wallet.address) {
        setLoading(false)
        return
      }

      try {
        // Get user
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

          // Fetch user's team
          const teamResponse = await fetch(`/api/teams?userId=${user.id}`)
          if (teamResponse.ok) {
            const team = await teamResponse.json()
            if (team && (team.beast1 || team.beast2 || team.beast3)) {
              const teamBeasts = [team.beast1, team.beast2, team.beast3]
                .filter(Boolean)
                .map(beast => ({
                  id: beast.id,
                  name: beast.name,
                  tier: beast.tier.toLowerCase(),
                  level: beast.level,
                  exp: { current: beast.currentExp, required: beast.requiredExp },
                  stats: { health: beast.health, stamina: beast.stamina, power: beast.power },
                  elementType: beast.elementType.toLowerCase(),
                  rarity: beast.rarity.toLowerCase(),
                  imageUrl: beast.nftMetadataUri,
                  moves: beast.moves.map(bm => ({
                    id: bm.move.id,
                    name: bm.move.name,
                    damage: bm.move.damage,
                    elementType: bm.move.elementType.toLowerCase(),
                    cooldown: bm.move.cooldown,
                    description: bm.move.description
                  }))
                }))
              setPlayer1Team(teamBeasts)
            }
          }

          // Fetch random opponent beasts for PvE
          const opponentResponse = await fetch(`/api/beasts?userId=${user.id}`)
          if (opponentResponse.ok) {
            const allBeasts = await opponentResponse.json()
            if (allBeasts.length >= 3) {
              // Use different beasts as opponents
              const shuffled = allBeasts.sort(() => 0.5 - Math.random())
              setPlayer2Team(shuffled.slice(0, 3))
            } else {
              // Fallback: create basic opponent beasts
              setPlayer2Team([
                {
                  id: 'opp1',
                  name: 'Wild Fire Beast',
                  tier: 'basic',
                  level: 8,
                  exp: { current: 400, required: 500 },
                  stats: { health: 60, stamina: 50, power: 55 },
                  elementType: 'fire',
                  rarity: 'common',
                  imageUrl: null,
                  moves: [{
                    id: 'fire_basic',
                    name: 'Flame Burst',
                    damage: 45,
                    elementType: 'fire',
                    cooldown: 2,
                    description: 'Basic fire attack'
                  }]
                },
                {
                  id: 'opp2',
                  name: 'Wild Water Beast',
                  tier: 'basic',
                  level: 7,
                  exp: { current: 300, required: 400 },
                  stats: { health: 65, stamina: 45, power: 50 },
                  elementType: 'water',
                  rarity: 'common',
                  imageUrl: null,
                  moves: [{
                    id: 'water_basic',
                    name: 'Water Pulse',
                    damage: 40,
                    elementType: 'water',
                    cooldown: 2,
                    description: 'Basic water attack'
                  }]
                },
                {
                  id: 'opp3',
                  name: 'Wild Earth Beast',
                  tier: 'basic',
                  level: 9,
                  exp: { current: 500, required: 600 },
                  stats: { health: 70, stamina: 40, power: 60 },
                  elementType: 'earth',
                  rarity: 'common',
                  imageUrl: null,
                  moves: [{
                    id: 'earth_basic',
                    name: 'Rock Throw',
                    damage: 50,
                    elementType: 'earth',
                    cooldown: 2,
                    description: 'Basic earth attack'
                  }]
                }
              ])
            }
          }
        }
      } catch (error) {
        console.error('Error loading team:', error)
      } finally {
        setLoading(false)
      }
    }

    loadUserTeam()
  }, [wallet.isConnected, wallet.address])

  const selectMode = (mode: 'pvp' | 'pve') => {
    if (mode === 'pvp') {
      // Redirect to Quick Match for real PvP
      window.location.href = '/battle/quick'
      return
    }
    setSelectedMode(mode)
    setBattleMode('arena')
  }

  const convertToBattleBeast = (beast: Beast): BattleBeast => ({
    id: beast.id,
    name: beast.name,
    maxHP: beast.stats.health,
    currentHP: beast.stats.health,
    power: beast.stats.power,
    stamina: beast.stats.stamina,
    elementType: beast.elementType,
    imageUrl: beast.imageUrl,
    moves: beast.moves
  })

  const startBattle = () => {
    if (!selectedMode || !player1Team[0] || !player2Team[0]) return
    
    const player1Beast = convertToBattleBeast(player1Team[0])
    const player2Beast = convertToBattleBeast(player2Team[0])
    
    // Determine first turn by stamina (speed)
    const firstTurn = player1Beast.stamina >= player2Beast.stamina ? 'player1' : 'player2'
    
    const newBattle: BattleState = {
      id: 'battle_' + Date.now(),
      player1Beast,
      player2Beast,
      player1Team,
      player2Team,
      currentTurn: firstTurn,
      battleLog: [
        selectedMode === 'pve' ? 'PvE Battle started!' : 'PvP Battle started!',
        `${player1Beast.name} vs ${player2Beast.name}`,
        `${firstTurn === 'player1' ? player1Beast.name : player2Beast.name} goes first!`
      ],
      winner: null,
      isProcessing: false,
      pot: selectedMode === 'pvp' ? 20 : 0
    }
    setBattleState(newBattle)
    setBattleMode('combat')
  }

  const calculateDamage = (attacker: BattleBeast, defender: BattleBeast, move: Move): number => {
    const baseDamage = (attacker.power * move.damage) / 100
    const typeMultiplier = getTypeEffectiveness(move.elementType, defender.elementType)
    const critChance = 0.0625 + (attacker.power / 1000) // Base 6.25% + power bonus
    const isCrit = Math.random() < critChance
    const critMultiplier = isCrit ? 1.5 : 1
    const randomFactor = 0.85 + Math.random() * 0.3 // 0.85 - 1.15
    
    return Math.floor(baseDamage * typeMultiplier * critMultiplier * randomFactor)
  }

  const getTypeEffectiveness = (attackType: string, defenseType: string): number => {
    const effectiveness: Record<string, Record<string, number>> = {
      fire: { earth: 2, water: 0.5, electric: 1, fire: 1 },
      earth: { electric: 2, fire: 0.5, water: 1, earth: 1 },
      electric: { water: 2, earth: 0.5, fire: 1, electric: 1 },
      water: { fire: 2, electric: 0.5, earth: 1, water: 1 }
    }
    return effectiveness[attackType]?.[defenseType] || 1
  }

  const handleAttack = async (move: Move) => {
    if (!battleState || battleState.isProcessing || battleState.currentTurn !== 'player1') return
    
    setBattleState(prev => prev ? { ...prev, isProcessing: true } : null)
    setSelectedMove(move)

    await new Promise(resolve => setTimeout(resolve, 1000))

    const damage = calculateDamage(battleState.player1Beast, battleState.player2Beast, move)
    const newPlayer2HP = Math.max(0, battleState.player2Beast.currentHP - damage)
    
    let newLog = [
      ...battleState.battleLog,
      `${battleState.player1Beast.name} used ${move.name}!`,
      `Dealt ${damage} damage to ${battleState.player2Beast.name}!`
    ]

    // Check if opponent is defeated
    if (newPlayer2HP <= 0) {
      newLog.push(`${battleState.player2Beast.name} fainted!`)
      newLog.push(`${battleState.player1Beast.name} wins!`)
      
      setBattleState(prev => prev ? {
        ...prev,
        player2Beast: { ...prev.player2Beast, currentHP: 0 },
        battleLog: newLog,
        winner: 'player1',
        isProcessing: false
      } : null)
      setSelectedMove(null)
      return
    }

    // AI turn
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    const aiMove = battleState.player2Beast.moves[Math.floor(Math.random() * battleState.player2Beast.moves.length)]
    const aiDamage = calculateDamage(battleState.player2Beast, battleState.player1Beast, aiMove)
    const newPlayer1HP = Math.max(0, battleState.player1Beast.currentHP - aiDamage)
    
    newLog.push(`${battleState.player2Beast.name} used ${aiMove.name}!`)
    newLog.push(`Dealt ${aiDamage} damage to ${battleState.player1Beast.name}!`)

    // Check if player is defeated
    if (newPlayer1HP <= 0) {
      newLog.push(`${battleState.player1Beast.name} fainted!`)
      newLog.push(`${battleState.player2Beast.name} wins!`)
      
      setBattleState(prev => prev ? {
        ...prev,
        player1Beast: { ...prev.player1Beast, currentHP: 0 },
        player2Beast: { ...prev.player2Beast, currentHP: newPlayer2HP },
        battleLog: newLog,
        winner: 'player2',
        isProcessing: false
      } : null)
    } else {
      setBattleState(prev => prev ? {
        ...prev,
        player1Beast: { ...prev.player1Beast, currentHP: newPlayer1HP },
        player2Beast: { ...prev.player2Beast, currentHP: newPlayer2HP },
        battleLog: newLog,
        isProcessing: false
      } : null)
    }

    setSelectedMove(null)
  }

  const handleSwitch = (beastId: string) => {
    if (!battleState || battleState.isProcessing) return
    
    const newBeast = battleState.player1Team.find(b => b.id === beastId)
    if (!newBeast || newBeast.id === battleState.player1Beast.id) return
    
    const switchedBeast = convertToBattleBeast(newBeast)
    
    setBattleState(prev => prev ? {
      ...prev,
      player1Beast: switchedBeast,
      battleLog: [...prev.battleLog, `Switched to ${switchedBeast.name}!`],
      currentTurn: 'player2'
    } : null)
    
    setShowSwitcher(false)
  }

  const handleEndBattle = () => {
    setBattleState(null)
    setSelectedMove(null)
    setBattleMode('select')
    setSelectedMode(null)
  }

  const handleBackToModeSelect = () => {
    setBattleMode('select')
    setSelectedMode(null)
  }

  if (loading) {
    return (
      <AppLayout>
        <BattleContainer>
          <BattleHeader>
            <BattleTitle>⚔️ BATTLE ARENA</BattleTitle>
            <BattleStatus>Loading your team...</BattleStatus>
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
            <BattleStatus>Connect wallet to battle</BattleStatus>
          </BattleHeader>
        </BattleContainer>
      </AppLayout>
    )
  }

  if (player1Team.length === 0) {
    return (
      <AppLayout>
        <BattleContainer>
          <BattleHeader>
            <BattleTitle>⚔️ BATTLE ARENA</BattleTitle>
            <BattleStatus>No team found - Create and save a team first</BattleStatus>
          </BattleHeader>
        </BattleContainer>
      </AppLayout>
    )
  }

  if (battleMode === 'select') {
    return (
      <AppLayout>
        <BattleContainer>
          <BattleHeader>
            <BattleTitle>⚔️ BATTLE ARENA</BattleTitle>
            <BattleStatus>Choose battle mode</BattleStatus>
          </BattleHeader>
          
          <BattleModeSelector>
            <ModeCard onClick={() => selectMode('pvp')}>
              <ModeIcon>👥</ModeIcon>
              <ModeTitle>PvP BATTLE</ModeTitle>
              <ModeDesc>Fight against other players</ModeDesc>
              <ModeReward>Stake: 20 $WAM</ModeReward>
            </ModeCard>
            
            <ModeCard onClick={() => selectMode('pve')}>
              <ModeIcon>🐲</ModeIcon>
              <ModeTitle>PvE BATTLE</ModeTitle>
              <ModeDesc>Fight wild beasts</ModeDesc>
              <ModeReward>Earn EXP & Loot</ModeReward>
            </ModeCard>
          </BattleModeSelector>
        </BattleContainer>
      </AppLayout>
    )
  }

  if (battleMode === 'arena') {
    return (
      <AppLayout>
        <BattleContainer>
          <BattleHeader>
            <BattleTitle>⚔️ BATTLE ARENA</BattleTitle>
            <BattleStatus>Challenge other trainers</BattleStatus>
          </BattleHeader>
          
          <ArenaSetup>
            <BackButton onClick={handleBackToModeSelect}>
              ← BACK TO MODE SELECT
            </BackButton>
            
            <TeamDisplay>
              <TeamTitle>MY TEAM ({selectedMode?.toUpperCase()})</TeamTitle>
              <TeamGrid>
                {player1Team.map((beast, index) => (
                  <TeamSlot key={index}>
                    {beast.imageUrl ? (
                      <img 
                        src={beast.imageUrl} 
                        alt={beast.name}
                        style={{
                          width: '32px',
                          height: '32px',
                          objectFit: 'cover',
                          border: '2px solid var(--border-primary)',
                          marginBottom: '8px',
                          imageRendering: 'pixelated'
                        }}
                      />
                    ) : (
                      <BeastIcon>{beast.elementType === 'fire' ? '🔥' : beast.elementType === 'water' ? '🌊' : beast.elementType === 'earth' ? '🌍' : '⚡'}</BeastIcon>
                    )}
                    <BeastName>{beast.name}</BeastName>
                    <BeastLevel>LVL {beast.level}</BeastLevel>
                  </TeamSlot>
                ))}
              </TeamGrid>
            </TeamDisplay>
            
            <StartBattleButton onClick={startBattle}>
              ⚔️ START {selectedMode?.toUpperCase()} BATTLE
            </StartBattleButton>
          </ArenaSetup>
        </BattleContainer>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <BattleContainer>
        <BattleHeader>
          <BattleTitle>
            ⚔️ {selectedMode === 'pve' ? 'PvE' : 'PvP'} BATTLE IN PROGRESS
          </BattleTitle>
          <BattleStatus>Turn {battleState.currentTurn}</BattleStatus>
        </BattleHeader>

        <BattleContent>
          <BattleArena
            playerBeast={battleState.player1Beast}
            opponentBeast={battleState.player2Beast}
            isPlayerTurn={battleState.currentTurn === 'player1' && !battleState.isProcessing}
            winner={battleState.winner}
          />
          
          {!battleState.winner && (
            <>
              <MoveSelector
                moves={battleState.player1Beast.moves}
                onMoveSelect={handleAttack}
                disabled={battleState.isProcessing || battleState.currentTurn !== 'player1'}
                onSwitch={() => setShowSwitcher(true)}
                canSwitch={battleState.player1Team.length > 1}
              />
              
              {showSwitcher && (
                <div style={{
                  position: 'fixed',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background: 'rgba(0,0,0,0.8)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  zIndex: 1000
                }}>
                  <div style={{
                    background: 'var(--light-bg)',
                    border: '4px solid var(--border-primary)',
                    padding: '24px',
                    maxWidth: '400px'
                  }}>
                    <h3>Switch Beast</h3>
                    {battleState.player1Team.filter(b => b.id !== battleState.player1Beast.id).map(beast => (
                      <Button
                        key={beast.id}
                        onClick={() => handleSwitch(beast.id)}
                        style={{ display: 'block', margin: '8px 0', width: '100%' }}
                      >
                        {beast.name} (HP: {beast.stats.health})
                      </Button>
                    ))}
                    <Button onClick={() => setShowSwitcher(false)} style={{ marginTop: '16px' }}>
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
          
          <BattleLog 
            log={battleState.battleLog}
            maxEntries={10}
          />
          
          <Button onClick={handleEndBattle}>
            END BATTLE
          </Button>
        </BattleContent>
      </BattleContainer>
    </AppLayout>
  )
}
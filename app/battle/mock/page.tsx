"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { AppLayout } from '@/components/layout/AppLayout'
import { useWallet } from '@/components/wallet/WalletProvider'
import { BattleArena } from '@/components/battle/BattleArena'
import { MoveSelector } from '@/components/battle/MoveSelector'
import { BattleLog } from '@/components/battle/BattleLog'
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



const beastTemplates = [
  {
    name: 'FIRE DRAGON',
    elementType: 'fire',
    emoji: '🔥',
    moves: [
      { name: 'FLAME BURST', damage: 25, elementType: 'fire' },
      { name: 'FIRE BLAST', damage: 35, elementType: 'fire' },
      { name: 'EMBER', damage: 15, elementType: 'fire' },
      { name: 'INFERNO', damage: 45, elementType: 'fire' }
    ]
  },
  {
    name: 'WATER SERPENT',
    elementType: 'water',
    emoji: '🌊',
    moves: [
      { name: 'WATER GUN', damage: 20, elementType: 'water' },
      { name: 'HYDRO PUMP', damage: 40, elementType: 'water' },
      { name: 'BUBBLE BEAM', damage: 30, elementType: 'water' },
      { name: 'TSUNAMI', damage: 50, elementType: 'water' }
    ]
  },
  {
    name: 'EARTH GOLEM',
    elementType: 'earth',
    emoji: '🌍',
    moves: [
      { name: 'ROCK THROW', damage: 22, elementType: 'earth' },
      { name: 'EARTHQUAKE', damage: 42, elementType: 'earth' },
      { name: 'STONE EDGE', damage: 35, elementType: 'earth' },
      { name: 'LANDSLIDE', damage: 48, elementType: 'earth' }
    ]
  },
  {
    name: 'THUNDER HAWK',
    elementType: 'electric',
    emoji: '⚡',
    moves: [
      { name: 'THUNDER BOLT', damage: 28, elementType: 'electric' },
      { name: 'LIGHTNING STRIKE', damage: 38, elementType: 'electric' },
      { name: 'SPARK', damage: 18, elementType: 'electric' },
      { name: 'STORM', damage: 46, elementType: 'electric' }
    ]
  }
]

const generateRandomBeast = (id: string) => {
  const template = beastTemplates[Math.floor(Math.random() * beastTemplates.length)]
  const baseHP = 80 + Math.floor(Math.random() * 40)
  const power = 60 + Math.floor(Math.random() * 40)
  const stamina = 60 + Math.floor(Math.random() * 40)
  
  return {
    id,
    name: template.name,
    maxHP: baseHP,
    currentHP: baseHP,
    power,
    stamina,
    elementType: template.elementType,
    imageUrl: null,
    emoji: template.emoji,
    moves: template.moves.map((move, index) => ({
      id: `${id}_${index}`,
      name: move.name,
      damage: move.damage + Math.floor(Math.random() * 10) - 5,
      elementType: move.elementType,
      cooldown: 1,
      description: `${move.elementType} attack`
    }))
  }
}

export default function MockBattlePage() {
  const router = useRouter()
  const { wallet } = useWallet()
  
  const [playerBeast, setPlayerBeast] = useState(() => generateRandomBeast('1'))
  const [opponentBeast, setOpponentBeast] = useState(() => generateRandomBeast('2'))
  
  const [isMyTurn, setIsMyTurn] = useState(true)
  const [winner, setWinner] = useState<string | null>(null)
  const [turn, setTurn] = useState(1)
  const [battleLog, setBattleLog] = useState<string[]>(['PvP Battle started!', 'Fire Dragon vs Water Serpent'])

  const calculateDamage = (move: any, attacker: any, defender: any) => {
    const typeChart: { [key: string]: { [key: string]: number } } = {
      fire: { water: 0.5, fire: 1, earth: 2, electric: 1 },
      water: { fire: 2, water: 1, earth: 0.5, electric: 1 },
      earth: { fire: 0.5, water: 2, earth: 1, electric: 2 },
      electric: { fire: 1, water: 2, earth: 0.5, electric: 0.5 }
    }
    
    const effectiveness = typeChart[move.elementType]?.[defender.elementType] || 1
    const stab = attacker.elementType === move.elementType ? 1.5 : 1
    
    return Math.floor(move.damage * effectiveness * stab)
  }

  const makeMove = (move: any) => {
    if (!isMyTurn || winner) return

    const damage = calculateDamage(move, playerBeast, opponentBeast)
    const newHP = Math.max(0, opponentBeast.currentHP - damage)
    
    setOpponentBeast(prev => ({ ...prev, currentHP: newHP }))
    setBattleLog(prev => [...prev, `${playerBeast.name} used ${move.name}!`, `Dealt ${damage} damage!`])
    
    if (newHP <= 0) {
      setWinner('player')
      setBattleLog(prev => [...prev, 'You win!'])
      return
    }
    
    setIsMyTurn(false)
    setTurn(prev => prev + 1)
    
    setTimeout(() => {
      const aiMove = opponentBeast.moves[Math.floor(Math.random() * opponentBeast.moves.length)]
      const aiDamage = calculateDamage(aiMove, opponentBeast, playerBeast)
      const playerNewHP = Math.max(0, playerBeast.currentHP - aiDamage)
      
      setPlayerBeast(prev => ({ ...prev, currentHP: playerNewHP }))
      setBattleLog(prev => [...prev, `${opponentBeast.name} used ${aiMove.name}!`, `Dealt ${aiDamage} damage!`])
      
      if (playerNewHP <= 0) {
        setWinner('opponent')
        setBattleLog(prev => [...prev, 'You lose!'])
      } else {
        setIsMyTurn(true)
        setTurn(prev => prev + 1)
      }
    }, 1500)
  }

  if (!wallet.isConnected) {
    return (
      <AppLayout>
        <BattleContainer>
          <BattleHeader>
            <BattleTitle>⚔️ PVP BATTLE</BattleTitle>
            <BattleStatus>Connect wallet to battle</BattleStatus>
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
          <BattleStatus>Turn {turn}</BattleStatus>
        </BattleHeader>

        {!winner && (
          <TurnIndicator $isMyTurn={isMyTurn}>
            {isMyTurn ? '🎯 YOUR TURN' : '⏳ OPPONENT\'S TURN'}
          </TurnIndicator>
        )}

        <BattleArena
          playerBeast={playerBeast}
          opponentBeast={opponentBeast}
          isPlayerTurn={isMyTurn}
          winner={winner}
        />

        {winner && (
          <BattleHeader>
            <BattleTitle>
              {winner === 'player' ? '🏆 VICTORY!' : '😔 DEFEAT!'}
            </BattleTitle>
            <BattleStatus>
              {winner === 'player' ? 'You won the battle!' : 'Better luck next time!'}
            </BattleStatus>
            <Button 
              onClick={() => router.push('/')}
              style={{ marginTop: '16px' }}
            >
              Return to Dashboard
            </Button>
          </BattleHeader>
        )}

        {!winner && (
          <MoveSelector
            moves={playerBeast.moves}
            onMoveSelect={makeMove}
            disabled={!isMyTurn}
            onSwitch={() => {}}
            canSwitch={false}
          />
        )}
        
        <BattleLog 
          log={battleLog}
          maxEntries={10}
        />
      </BattleContainer>
    </AppLayout>
  )
}
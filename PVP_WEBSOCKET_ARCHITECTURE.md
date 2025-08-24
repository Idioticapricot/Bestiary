# PvP Mechanism with WebSocket & Supabase Real-time

## Overview

Real-time PvP battle system using Supabase WebSocket connections for instant matchmaking, live battles, and synchronized game state across players.

## Architecture

### Core Components
```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Frontend      │◄──►│   Supabase       │◄──►│   Game Engine   │
│   (React)       │    │   (WebSocket)    │    │   (Node.js)     │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│ Battle UI       │    │ Real-time DB     │    │ Battle Logic    │
│ Team Selection  │    │ Matchmaking      │    │ Move Validation │
│ Move Selection  │    │ Battle State     │    │ Damage Calc     │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

## Database Schema Extensions

### Battle Tables
```sql
-- Battle sessions
CREATE TABLE battle_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player1_id UUID REFERENCES users(id),
  player2_id UUID REFERENCES users(id),
  player1_team_id UUID REFERENCES teams(id),
  player2_team_id UUID REFERENCES teams(id),
  status battle_status DEFAULT 'waiting',
  current_turn INTEGER DEFAULT 1,
  turn_player_id UUID,
  battle_data JSONB DEFAULT '{}',
  winner_id UUID,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Real-time battle moves
CREATE TABLE battle_moves (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  battle_id UUID REFERENCES battle_sessions(id),
  player_id UUID REFERENCES users(id),
  beast_id UUID REFERENCES beasts(id),
  move_id UUID REFERENCES moves(id),
  target_beast_id UUID REFERENCES beasts(id),
  turn_number INTEGER,
  damage_dealt INTEGER DEFAULT 0,
  move_data JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Matchmaking queue
CREATE TABLE matchmaking_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID REFERENCES users(id),
  team_id UUID REFERENCES teams(id),
  rank_points INTEGER,
  queue_type VARCHAR(50) DEFAULT 'ranked',
  status VARCHAR(20) DEFAULT 'waiting',
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Real-time Subscriptions
```sql
-- Enable real-time for battle tables
ALTER PUBLICATION supabase_realtime ADD TABLE battle_sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE battle_moves;
ALTER PUBLICATION supabase_realtime ADD TABLE matchmaking_queue;
```

## Frontend Implementation

### 1. Supabase Client Setup
```typescript
// lib/supabase.ts
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseKey, {
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
})
```

### 2. Matchmaking Hook
```typescript
// hooks/useMatchmaking.ts
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export function useMatchmaking(userId: string, teamId: string) {
  const [isSearching, setIsSearching] = useState(false)
  const [matchFound, setMatchFound] = useState(false)
  const [battleId, setBattleId] = useState<string | null>(null)

  const joinQueue = async () => {
    setIsSearching(true)
    
    // Add to matchmaking queue
    const { data, error } = await supabase
      .from('matchmaking_queue')
      .insert({
        player_id: userId,
        team_id: teamId,
        rank_points: 1000 // Get from user ranking
      })
      .select()
      .single()

    if (error) {
      console.error('Queue join error:', error)
      setIsSearching(false)
      return
    }

    // Listen for match found
    const channel = supabase
      .channel('matchmaking')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'battle_sessions',
        filter: `player1_id=eq.${userId},player2_id=eq.${userId}`
      }, (payload) => {
        setBattleId(payload.new.id)
        setMatchFound(true)
        setIsSearching(false)
      })
      .subscribe()

    return () => {
      channel.unsubscribe()
    }
  }

  const leaveQueue = async () => {
    await supabase
      .from('matchmaking_queue')
      .delete()
      .eq('player_id', userId)
    
    setIsSearching(false)
  }

  return { isSearching, matchFound, battleId, joinQueue, leaveQueue }
}
```

### 3. Battle Hook
```typescript
// hooks/useBattle.ts
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

interface BattleState {
  id: string
  player1: any
  player2: any
  currentTurn: number
  turnPlayerId: string
  battleData: any
  status: string
}

export function useBattle(battleId: string, userId: string) {
  const [battleState, setBattleState] = useState<BattleState | null>(null)
  const [isMyTurn, setIsMyTurn] = useState(false)

  useEffect(() => {
    if (!battleId) return

    // Subscribe to battle updates
    const channel = supabase
      .channel(`battle:${battleId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'battle_sessions',
        filter: `id=eq.${battleId}`
      }, (payload) => {
        setBattleState(payload.new as BattleState)
        setIsMyTurn(payload.new.turn_player_id === userId)
      })
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'battle_moves',
        filter: `battle_id=eq.${battleId}`
      }, (payload) => {
        // Handle new move
        console.log('New move:', payload.new)
      })
      .subscribe()

    // Load initial battle state
    loadBattleState()

    return () => {
      channel.unsubscribe()
    }
  }, [battleId, userId])

  const loadBattleState = async () => {
    const { data } = await supabase
      .from('battle_sessions')
      .select(`
        *,
        player1:users!player1_id(*),
        player2:users!player2_id(*),
        player1_team:teams!player1_team_id(*),
        player2_team:teams!player2_team_id(*)
      `)
      .eq('id', battleId)
      .single()

    if (data) {
      setBattleState(data)
      setIsMyTurn(data.turn_player_id === userId)
    }
  }

  const makeMove = async (beastId: string, moveId: string, targetBeastId: string) => {
    if (!isMyTurn) return

    const { error } = await supabase
      .from('battle_moves')
      .insert({
        battle_id: battleId,
        player_id: userId,
        beast_id: beastId,
        move_id: moveId,
        target_beast_id: targetBeastId,
        turn_number: battleState?.currentTurn
      })

    if (error) {
      console.error('Move error:', error)
    }
  }

  return { battleState, isMyTurn, makeMove }
}
```

### 4. Battle Component
```typescript
// components/battle/BattleArena.tsx
import { useBattle } from '@/hooks/useBattle'

interface BattleArenaProps {
  battleId: string
  userId: string
}

export function BattleArena({ battleId, userId }: BattleArenaProps) {
  const { battleState, isMyTurn, makeMove } = useBattle(battleId, userId)

  if (!battleState) {
    return <div>Loading battle...</div>
  }

  return (
    <div className="battle-arena">
      <div className="battle-header">
        <h2>Battle Arena</h2>
        <div className="turn-indicator">
          {isMyTurn ? "Your Turn" : "Opponent's Turn"}
        </div>
      </div>

      <div className="battle-field">
        <div className="player-side">
          <h3>Your Team</h3>
          {/* Render player's beasts */}
        </div>

        <div className="opponent-side">
          <h3>Opponent</h3>
          {/* Render opponent's beasts */}
        </div>
      </div>

      {isMyTurn && (
        <div className="move-selection">
          <h3>Select Move</h3>
          {/* Move selection UI */}
        </div>
      )}
    </div>
  )
}
```

## Backend Game Engine

### 1. Matchmaking Service
```typescript
// services/matchmaking.ts
import { supabase } from '@/lib/supabase'

export class MatchmakingService {
  private static instance: MatchmakingService
  private matchmakingInterval: NodeJS.Timeout | null = null

  static getInstance() {
    if (!this.instance) {
      this.instance = new MatchmakingService()
    }
    return this.instance
  }

  startMatchmaking() {
    this.matchmakingInterval = setInterval(async () => {
      await this.processQueue()
    }, 5000) // Check every 5 seconds
  }

  private async processQueue() {
    // Get waiting players
    const { data: waitingPlayers } = await supabase
      .from('matchmaking_queue')
      .select('*')
      .eq('status', 'waiting')
      .order('created_at', { ascending: true })
      .limit(10)

    if (!waitingPlayers || waitingPlayers.length < 2) return

    // Match players with similar rank
    for (let i = 0; i < waitingPlayers.length - 1; i++) {
      const player1 = waitingPlayers[i]
      const player2 = this.findMatch(player1, waitingPlayers.slice(i + 1))

      if (player2) {
        await this.createBattle(player1, player2)
      }
    }
  }

  private findMatch(player1: any, candidates: any[]) {
    return candidates.find(player2 => 
      Math.abs(player1.rank_points - player2.rank_points) <= 200
    )
  }

  private async createBattle(player1: any, player2: any) {
    // Create battle session
    const { data: battle } = await supabase
      .from('battle_sessions')
      .insert({
        player1_id: player1.player_id,
        player2_id: player2.player_id,
        player1_team_id: player1.team_id,
        player2_team_id: player2.team_id,
        status: 'active',
        turn_player_id: player1.player_id, // Player 1 goes first
        battle_data: {
          player1_beasts: [],
          player2_beasts: [],
          turn_timer: 30
        }
      })
      .select()
      .single()

    // Remove from queue
    await supabase
      .from('matchmaking_queue')
      .delete()
      .in('id', [player1.id, player2.id])

    console.log(`Battle created: ${battle.id}`)
  }
}
```

### 2. Battle Engine
```typescript
// services/battleEngine.ts
import { supabase } from '@/lib/supabase'

export class BattleEngine {
  static async processBattleMove(moveData: any) {
    const { battle_id, player_id, beast_id, move_id, target_beast_id } = moveData

    // Get battle state
    const { data: battle } = await supabase
      .from('battle_sessions')
      .select('*')
      .eq('id', battle_id)
      .single()

    if (!battle || battle.turn_player_id !== player_id) {
      throw new Error('Invalid move: Not your turn')
    }

    // Get move and beast data
    const [moveResult, beastResult, targetResult] = await Promise.all([
      supabase.from('moves').select('*').eq('id', move_id).single(),
      supabase.from('beasts').select('*').eq('id', beast_id).single(),
      supabase.from('beasts').select('*').eq('id', target_beast_id).single()
    ])

    const move = moveResult.data
    const beast = beastResult.data
    const target = targetResult.data

    // Calculate damage
    const damage = this.calculateDamage(move, beast, target)

    // Apply damage
    const newHealth = Math.max(0, target.health - damage)
    
    await supabase
      .from('beasts')
      .update({ health: newHealth })
      .eq('id', target_beast_id)

    // Update battle move record
    await supabase
      .from('battle_moves')
      .update({ damage_dealt: damage })
      .eq('id', moveData.id)

    // Switch turns
    const nextPlayer = battle.turn_player_id === battle.player1_id 
      ? battle.player2_id 
      : battle.player1_id

    await supabase
      .from('battle_sessions')
      .update({
        turn_player_id: nextPlayer,
        current_turn: battle.current_turn + 1,
        updated_at: new Date().toISOString()
      })
      .eq('id', battle_id)

    // Check for battle end
    await this.checkBattleEnd(battle_id)
  }

  private static calculateDamage(move: any, attacker: any, target: any): number {
    let baseDamage = move.damage
    let attackerPower = attacker.power
    let targetDefense = target.stamina // Using stamina as defense

    // Type effectiveness
    const effectiveness = this.getTypeEffectiveness(move.element_type, target.element_type)
    
    // Damage formula
    const damage = Math.floor(
      (baseDamage * (attackerPower / targetDefense) * effectiveness) + 
      Math.random() * 10 // Random factor
    )

    return Math.max(1, damage) // Minimum 1 damage
  }

  private static getTypeEffectiveness(attackType: string, defenseType: string): number {
    const effectiveness: Record<string, Record<string, number>> = {
      FIRE: { WATER: 0.5, EARTH: 2.0, ELECTRIC: 1.0, FIRE: 1.0 },
      WATER: { FIRE: 2.0, EARTH: 0.5, ELECTRIC: 0.5, WATER: 1.0 },
      EARTH: { FIRE: 0.5, WATER: 2.0, ELECTRIC: 2.0, EARTH: 1.0 },
      ELECTRIC: { FIRE: 1.0, WATER: 2.0, EARTH: 0.5, ELECTRIC: 1.0 }
    }

    return effectiveness[attackType]?.[defenseType] || 1.0
  }

  private static async checkBattleEnd(battleId: string) {
    // Check if any team has all beasts defeated
    // Update battle status and winner
    // Award rewards
  }
}
```

## Real-time Features

### 1. Live Battle Updates
```typescript
// Real-time battle state synchronization
const battleChannel = supabase
  .channel(`battle:${battleId}`)
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'battle_sessions'
  }, (payload) => {
    // Update battle UI instantly
    updateBattleUI(payload.new)
  })
  .subscribe()
```

### 2. Turn Timer
```typescript
// Turn-based timer with WebSocket sync
const TURN_TIME_LIMIT = 30000 // 30 seconds

useEffect(() => {
  if (isMyTurn) {
    const timer = setTimeout(() => {
      // Auto-skip turn if no move made
      skipTurn()
    }, TURN_TIME_LIMIT)

    return () => clearTimeout(timer)
  }
}, [isMyTurn])
```

### 3. Spectator Mode
```typescript
// Allow spectators to watch battles
const spectateChannel = supabase
  .channel(`spectate:${battleId}`)
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'battle_moves'
  }, (payload) => {
    // Show move animations to spectators
    animateMove(payload.new)
  })
  .subscribe()
```

## Performance Optimizations

### 1. Connection Pooling
```typescript
// Limit concurrent connections
const MAX_CONNECTIONS = 100
const connectionPool = new Map()

function getConnection(userId: string) {
  if (connectionPool.size >= MAX_CONNECTIONS) {
    // Remove oldest connection
    const oldestKey = connectionPool.keys().next().value
    connectionPool.delete(oldestKey)
  }
  
  return supabase.channel(`user:${userId}`)
}
```

### 2. Message Batching
```typescript
// Batch multiple updates
const updateBatch = []
const BATCH_SIZE = 10

function batchUpdate(update: any) {
  updateBatch.push(update)
  
  if (updateBatch.length >= BATCH_SIZE) {
    processBatch()
  }
}
```

### 3. State Compression
```typescript
// Compress battle state for transmission
function compressBattleState(state: BattleState) {
  return {
    id: state.id,
    t: state.currentTurn,
    p: state.turnPlayerId,
    // Abbreviated field names to reduce payload
  }
}
```

## Security Considerations

### 1. Move Validation
```sql
-- Row Level Security for battle moves
CREATE POLICY "Players can only make moves in their battles" ON battle_moves
  FOR INSERT WITH CHECK (
    player_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM battle_sessions 
      WHERE id = battle_id 
      AND (player1_id = auth.uid() OR player2_id = auth.uid())
      AND turn_player_id = auth.uid()
    )
  );
```

### 2. Anti-Cheat Measures
```typescript
// Server-side move validation
function validateMove(move: BattleMove, gameState: GameState): boolean {
  // Check if move is legal
  // Verify beast can use this move
  // Check cooldowns
  // Validate target selection
  return true
}
```

## Deployment Setup

### 1. Environment Variables
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_key
```

### 2. Supabase Configuration
```sql
-- Enable real-time
ALTER PUBLICATION supabase_realtime ADD TABLE battle_sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE battle_moves;
ALTER PUBLICATION supabase_realtime ADD TABLE matchmaking_queue;

-- Set up RLS policies
ALTER TABLE battle_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE battle_moves ENABLE ROW LEVEL SECURITY;
ALTER TABLE matchmaking_queue ENABLE ROW LEVEL SECURITY;
```

This architecture provides a robust, real-time PvP system with instant matchmaking, live battles, and synchronized game state using Supabase WebSockets.
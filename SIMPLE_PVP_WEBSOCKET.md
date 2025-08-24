# Simple PvP with Slug-Based Matching & WebSocket

## Overview

Minimal real-time PvP system using existing database elements with slug-based room matching for instant multiplayer battles.

## Core Concept

**Slug Matching**: Generate random 6-character room codes. When 2 players join the same slug, they get matched instantly.

```
Player 1: Creates room → Gets slug "ABC123"
Player 2: Enters "ABC123" → Instant match!
```

## Minimal Database Addition

### Only Add Battle Rooms Table
```sql
-- Single new table for room matching
CREATE TABLE battle_rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug VARCHAR(6) UNIQUE NOT NULL,
  player1_id UUID REFERENCES users(id),
  player2_id UUID REFERENCES users(id),
  battle_id UUID REFERENCES battles(id), -- Use existing battles table
  status VARCHAR(20) DEFAULT 'waiting',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Enable real-time
ALTER PUBLICATION supabase_realtime ADD TABLE battle_rooms;
ALTER PUBLICATION supabase_realtime ADD TABLE battles;
ALTER PUBLICATION supabase_realtime ADD TABLE battle_actions;
```

## Frontend Implementation

### 1. Slug Matchmaking Hook
```typescript
// hooks/useSlugMatch.ts
import { useState } from 'react'
import { supabase } from '@/lib/supabase'

function generateSlug(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase()
}

export function useSlugMatch(userId: string, teamId: string) {
  const [roomSlug, setRoomSlug] = useState<string | null>(null)
  const [isWaiting, setIsWaiting] = useState(false)
  const [battleId, setBattleId] = useState<string | null>(null)

  const createRoom = async () => {
    const slug = generateSlug()
    setIsWaiting(true)
    
    const { data } = await supabase
      .from('battle_rooms')
      .insert({ slug, player1_id: userId })
      .select()
      .single()

    if (data) {
      setRoomSlug(slug)
      listenForPlayer2(slug)
    }
  }

  const joinRoom = async (slug: string) => {
    const { data } = await supabase
      .from('battle_rooms')
      .update({ player2_id: userId, status: 'full' })
      .eq('slug', slug)
      .eq('status', 'waiting')
      .select()
      .single()

    if (data) {
      await startBattle(data)
    }
  }

  const listenForPlayer2 = (slug: string) => {
    supabase
      .channel(`room:${slug}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'battle_rooms',
        filter: `slug=eq.${slug}`
      }, async (payload) => {
        if (payload.new.status === 'full') {
          await startBattle(payload.new)
        }
      })
      .subscribe()
  }

  const startBattle = async (room: any) => {
    // Use existing battles table
    const { data: battle } = await supabase
      .from('battles')
      .insert({
        player1_id: room.player1_id,
        player2_id: room.player2_id,
        player1_team_id: teamId,
        player2_team_id: teamId,
        battle_type: 'PVP',
        status: 'ACTIVE'
      })
      .select()
      .single()

    if (battle) {
      setBattleId(battle.id)
      setIsWaiting(false)
    }
  }

  return { roomSlug, isWaiting, battleId, createRoom, joinRoom }
}
```

### 2. Simple Battle Hook
```typescript
// hooks/useBattle.ts
export function useBattle(battleId: string, userId: string) {
  const [battle, setBattle] = useState<any>(null)
  const [isMyTurn, setIsMyTurn] = useState(false)

  useEffect(() => {
    if (!battleId) return

    // Listen to existing battles table
    const channel = supabase
      .channel(`battle:${battleId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'battles',
        filter: `id=eq.${battleId}`
      }, (payload) => {
        setBattle(payload.new)
        // Simple turn logic: odd turns = player1, even = player2
        const isPlayer1 = payload.new.player1_id === userId
        const isPlayer1Turn = payload.new.current_turn % 2 === 1
        setIsMyTurn(isPlayer1 ? isPlayer1Turn : !isPlayer1Turn)
      })
      .subscribe()

    return () => channel.unsubscribe()
  }, [battleId, userId])

  const makeMove = async (beastId: string, moveId: string, targetBeastId: string) => {
    if (!isMyTurn) return

    // Use existing battle_actions table
    await supabase.from('battle_actions').insert({
      battle_id: battleId,
      player_id: userId,
      beast_id: beastId,
      move_id: moveId,
      target_beast_id: targetBeastId,
      turn_number: battle.current_turn
    })

    // Update turn
    await supabase
      .from('battles')
      .update({ current_turn: battle.current_turn + 1 })
      .eq('id', battleId)
  }

  return { battle, isMyTurn, makeMove }
}
```

### 3. Room UI Component
```typescript
// components/RoomMatcher.tsx
export function RoomMatcher({ userId, teamId }: { userId: string, teamId: string }) {
  const [inputSlug, setInputSlug] = useState('')
  const { roomSlug, isWaiting, battleId, createRoom, joinRoom } = useSlugMatch(userId, teamId)

  if (battleId) {
    return <BattleArena battleId={battleId} userId={userId} />
  }

  return (
    <div className="room-matcher">
      <h2>Quick Match</h2>
      
      {!roomSlug ? (
        <>
          <button onClick={createRoom} className="create-room-btn">
            🎮 Create Room
          </button>
          
          <div className="join-room">
            <input
              value={inputSlug}
              onChange={(e) => setInputSlug(e.target.value.toUpperCase())}
              placeholder="Enter room code (ABC123)"
              maxLength={6}
            />
            <button onClick={() => joinRoom(inputSlug)}>
              Join Room
            </button>
          </div>
        </>
      ) : (
        <div className="waiting-room">
          <h3>Room Code: {roomSlug}</h3>
          <p>Share this code with your opponent!</p>
          {isWaiting && <p>Waiting for player 2...</p>}
        </div>
      )}
    </div>
  )
}
```

## Battle Logic (Frontend Only)

### Simple Damage Calculation
```typescript
// utils/battleLogic.ts
export const calculateDamage = (move: any, attacker: any, target: any) => {
  const baseDamage = move.damage
  const attackPower = attacker.power
  const defense = target.stamina

  // Type effectiveness using existing elements
  const typeChart: Record<string, Record<string, number>> = {
    fire: { water: 0.5, earth: 2.0, electric: 1.0, fire: 1.0 },
    water: { fire: 2.0, earth: 0.5, electric: 0.5, water: 1.0 },
    earth: { fire: 0.5, water: 2.0, electric: 2.0, earth: 1.0 },
    electric: { fire: 1.0, water: 2.0, earth: 0.5, electric: 1.0 }
  }

  const effectiveness = typeChart[move.elementType]?.[target.elementType] || 1.0
  const damage = Math.floor((baseDamage * attackPower / defense * effectiveness) + Math.random() * 3)
  
  return Math.max(1, damage)
}

export const applyDamage = async (targetBeastId: string, damage: number) => {
  const { data: beast } = await supabase
    .from('beasts')
    .select('health')
    .eq('id', targetBeastId)
    .single()

  const newHealth = Math.max(0, beast.health - damage)
  
  await supabase
    .from('beasts')
    .update({ health: newHealth })
    .eq('id', targetBeastId)

  return newHealth
}
```

## Better Alternative Suggestions

### 1. **QR Code Matching** ⭐ (Recommended)
```typescript
// Generate QR code with room slug
import QRCode from 'qrcode'

const generateRoomQR = async (slug: string) => {
  const qrData = await QRCode.toDataURL(`https://yourgame.com/join/${slug}`)
  return qrData
}

// Player 1: Shows QR code
// Player 2: Scans QR → Auto-joins room
```

### 2. **Quick Match Button**
```typescript
const quickMatch = async () => {
  // Try to join any waiting room first
  const { data: waitingRoom } = await supabase
    .from('battle_rooms')
    .select('*')
    .eq('status', 'waiting')
    .limit(1)
    .single()

  if (waitingRoom) {
    await joinRoom(waitingRoom.slug)
  } else {
    await createRoom() // Create new room if none available
  }
}
```

### 3. **Friend Code System**
```typescript
// Each user gets permanent 6-digit friend code
const generateFriendCode = (userId: string) => {
  // Generate consistent code based on user ID
  return userId.slice(-6).toUpperCase()
}

// Players share friend codes instead of temporary room slugs
```

### 4. **Proximity Matching**
```typescript
// Match players in same geographic area
const proximityMatch = async (userLocation: { lat: number, lng: number }) => {
  // Find nearby players looking for matches
  // Great for local tournaments
}
```

## Room Cleanup

### Auto-cleanup Old Rooms
```typescript
// Clean rooms older than 1 hour
setInterval(async () => {
  await supabase
    .from('battle_rooms')
    .delete()
    .lt('created_at', new Date(Date.now() - 3600000).toISOString())
}, 300000) // Every 5 minutes
```

## Security (Minimal)

### Basic Row Level Security
```sql
-- Users can only access rooms they're part of
CREATE POLICY "Users can access their rooms" ON battle_rooms
  FOR ALL USING (
    player1_id = auth.uid() OR player2_id = auth.uid()
  );

-- Use existing battle_actions RLS
CREATE POLICY "Players can only make moves in their battles" ON battle_actions
  FOR INSERT WITH CHECK (
    player_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM battles 
      WHERE id = battle_id 
      AND (player1_id = auth.uid() OR player2_id = auth.uid())
    )
  );
```

## Complete Flow

1. **Player 1**: Clicks "Create Room" → Gets slug "ABC123"
2. **Player 1**: Shares "ABC123" with friend
3. **Player 2**: Enters "ABC123" → Joins room
4. **System**: Auto-creates battle using existing `battles` table
5. **Both Players**: Real-time battle begins using existing `battle_actions`

## Advantages

✅ **Minimal Code**: Uses 90% existing database structure
✅ **Instant Matching**: No complex matchmaking algorithms
✅ **Real-time**: WebSocket updates via Supabase
✅ **Simple UX**: Just share a 6-character code
✅ **Scalable**: Each room is independent
✅ **No Backend**: All logic runs in frontend

This approach gives you working multiplayer PvP with minimal changes to your existing codebase!
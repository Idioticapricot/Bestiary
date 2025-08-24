# Battle Matchmaking Flow & User Experience

## Overview

Complete real-time PvP battle system with smart matchmaking, turn-based combat, and seamless user experience using Supabase WebSocket for instant updates.

## System Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Frontend      │◄──►│   Supabase       │◄──►│   Database      │
│   (React)       │    │   (WebSocket)    │    │   (PostgreSQL)  │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│ Quick Match UI  │    │ Real-time Sync   │    │ battle_rooms    │
│ Battle Arena    │    │ Room Management  │    │ battles         │
│ Move Selection  │    │ Turn Updates     │    │ battle_actions  │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

## Database Schema

### Core Tables
```sql
-- Room management for matchmaking
battle_rooms (
  id UUID,
  slug VARCHAR(6),        -- Random room code (ABC123)
  player1_id UUID,        -- Room creator
  player2_id UUID,        -- Room joiner
  battle_id UUID,         -- Links to actual battle
  status VARCHAR(20),     -- waiting, full, active
  created_at TIMESTAMP
)

-- Actual battle data
battles (
  id UUID,
  player1_id UUID,
  player2_id UUID,
  player1_team UUID,      -- Team reference
  player2_team UUID,      -- Team reference
  current_turn INTEGER,   -- Turn counter
  status VARCHAR(20),     -- ACTIVE, COMPLETED
  battle_type VARCHAR(10) -- PVP
)

-- Move history
battle_actions (
  id UUID,
  battle_id UUID,
  player_id UUID,
  beast_id UUID,          -- Which beast made the move
  move_id UUID,           -- Which move was used
  target_beast_id UUID,   -- Target of the attack
  turn_number INTEGER,
  damage_dealt INTEGER
)
```

## Matchmaking Logic Flow

### Smart Room Management
```
User clicks "FIND BATTLE"
         ↓
Check battle_rooms table
         ↓
┌────────────────────────────────────┐
│ Query: status = 'waiting'          │
│ Limit: 1                          │
└────────────────────────────────────┘
         ↓
    Room found?
    ┌─────┴─────┐
   YES          NO
    │            │
    ▼            ▼
Join Room    Create Room
(Player 2)   (Player 1)
    │            │
    ▼            ▼
Start Battle  Wait for P2
```

### Backend Processing
```typescript
// 1. Check for available rooms
const availableRoom = await supabase
  .from('battle_rooms')
  .select('*')
  .eq('status', 'waiting')
  .limit(1)

if (availableRoom) {
  // Scenario A: Join existing room as Player 2
  await supabase
    .from('battle_rooms')
    .update({ player2_id: userId, status: 'full' })
    .eq('id', availableRoom.id)
  
  // Create battle immediately
  createBattle(room)
} else {
  // Scenario B: Create new room as Player 1
  const newRoom = await supabase
    .from('battle_rooms')
    .insert({
      slug: generateRandomSlug(),
      player1_id: userId,
      status: 'waiting'
    })
  
  // Listen for Player 2 via WebSocket
  listenForOpponent(newRoom.slug)
}
```

## User Experience Flows

### Flow 1: First Player (Room Creator)

#### Step-by-Step Experience
```
1. User A clicks "⚡ FIND BATTLE"
   └── UI: Shows "Waiting for opponent..."

2. Backend: No rooms available
   └── Creates room with slug "ABC123"
   └── Sets status = 'waiting'

3. User A sees: "Waiting for opponent..."
   └── WebSocket listening on room:ABC123

4. User B joins (see Flow 2)
   └── WebSocket triggers: room status = 'full'

5. Battle created automatically
   └── User A redirected to battle screen

6. Battle begins: "YOUR TURN" (Player 1 starts)
```

#### Technical Logs
```
🎮 MATCHMAKING: Starting quick match for user: user-a-id
🔍 MATCHMAKING: Checking for available rooms...
❌ MATCHMAKING: No available rooms found
🏗️ MATCHMAKING: Creating new room with slug: ABC123
✅ MATCHMAKING: Room created successfully
⏳ MATCHMAKING: Waiting for Player 2 to join...
👂 MATCHMAKING: Listening for opponent on room: ABC123
🎉 MATCHMAKING: Player 2 joined room: ABC123
🚀 MATCHMAKING: Starting battle...
⚔️ BATTLE: Creating battle for room: ABC123
✅ BATTLE: Battle created with ID: battle-123
🎯 BATTLE: Player 1 starts first (Turn 1)
🏁 MATCHMAKING: Complete! Redirecting to battle...
```

### Flow 2: Second Player (Room Joiner)

#### Step-by-Step Experience
```
1. User B clicks "⚡ FIND BATTLE"
   └── UI: Shows "Waiting for opponent..."

2. Backend: Finds User A's room "ABC123"
   └── Joins as Player 2
   └── Sets status = 'full'

3. Battle created immediately
   └── User B redirected to battle screen

4. Battle begins: "OPPONENT'S TURN" (Player 1 starts)
```

#### Technical Logs
```
🎮 MATCHMAKING: Starting quick match for user: user-b-id
🔍 MATCHMAKING: Checking for available rooms...
✅ MATCHMAKING: Found available room: ABC123
👥 MATCHMAKING: Joining as Player 2...
🚀 MATCHMAKING: Room full! Starting battle immediately...
⚔️ BATTLE: Creating battle for room: ABC123
👤 BATTLE: Player roles - Current User: Player 2
✅ BATTLE: Battle created with ID: battle-123
🏁 MATCHMAKING: Complete! Redirecting to battle...
```

## Battle System Flow

### Turn-Based Combat
```
Battle Start
     ↓
Player 1 Turn
     ↓
┌─────────────────────────────────┐
│ 1. Select active beast          │
│ 2. Choose move from beast moves │
│ 3. Select target (opponent)     │
│ 4. Confirm attack               │
└─────────────────────────────────┘
     ↓
Record battle_action
     ↓
Update current_turn + 1
     ↓
WebSocket sync to Player 2
     ↓
Player 2 Turn
     ↓
Repeat until victory condition
```

### Battle Screen Components

#### Team Display
```
┌─────────────────┐    ┌─────────────────┐
│   🛡️ YOUR TEAM   │    │  ⚔️ OPPONENT    │
├─────────────────┤    ├─────────────────┤
│ [Beast1] Active │    │ [Beast1] Active │
│ [Beast2] Ready  │    │ [Beast2] Ready  │
│ [Beast3] Ready  │    │ [Beast3] Ready  │
└─────────────────┘    └─────────────────┘
```

#### Move Selection (Your Turn)
```
┌─────────────────────────────────────┐
│     SELECT MOVE FOR FIRE DRAGON     │
├─────────────────┬───────────────────┤
│ [Flame Burst]   │ [Inferno Strike]  │
│ DMG: 45         │ DMG: 65           │
├─────────────────┼───────────────────┤
│ [Fire Whip]     │ [Meteor Crash]    │
│ DMG: 50         │ DMG: 85           │
└─────────────────┴───────────────────┘
```

### Real-Time Synchronization

#### WebSocket Events
```typescript
// Room updates (matchmaking)
supabase
  .channel(`room:${slug}`)
  .on('postgres_changes', {
    event: 'UPDATE',
    table: 'battle_rooms'
  }, handleRoomUpdate)

// Battle updates (turn changes)
supabase
  .channel(`battle:${battleId}`)
  .on('postgres_changes', {
    event: '*',
    table: 'battles'
  }, handleBattleUpdate)

// Move updates (battle actions)
supabase
  .channel(`battle:${battleId}`)
  .on('postgres_changes', {
    event: 'INSERT',
    table: 'battle_actions'
  }, handleMoveUpdate)
```

## Complete User Journey Example

### Scenario: Alice vs Bob Battle

#### Timeline
```
T+0s:  Alice clicks "FIND BATTLE"
       └── Creates room "XYZ789", waits

T+5s:  Bob clicks "FIND BATTLE"  
       └── Finds Alice's room, joins instantly

T+6s:  Battle created, both redirected
       └── Alice: "YOUR TURN"
       └── Bob: "OPPONENT'S TURN"

T+10s: Alice selects "Flame Burst" → Bob's beast
       └── Damage calculated, turn switches
       └── Alice: "OPPONENT'S TURN"
       └── Bob: "YOUR TURN"

T+15s: Bob selects "Water Pulse" → Alice's beast
       └── Damage calculated, turn switches

T+20s: Continue until one team defeated
       └── Winner declared, battle ends
```

#### Database State Changes
```sql
-- T+0s: Alice creates room
INSERT INTO battle_rooms (slug, player1_id, status) 
VALUES ('XYZ789', 'alice-id', 'waiting');

-- T+5s: Bob joins room
UPDATE battle_rooms 
SET player2_id = 'bob-id', status = 'full' 
WHERE slug = 'XYZ789';

-- T+6s: Battle created
INSERT INTO battles (player1_id, player2_id, current_turn, status)
VALUES ('alice-id', 'bob-id', 1, 'ACTIVE');

-- T+10s: Alice's move
INSERT INTO battle_actions (battle_id, player_id, beast_id, move_id, target_beast_id, turn_number)
VALUES ('battle-123', 'alice-id', 'alice-beast-1', 'flame-burst', 'bob-beast-1', 1);

UPDATE battles SET current_turn = 2 WHERE id = 'battle-123';

-- T+15s: Bob's move
INSERT INTO battle_actions (battle_id, player_id, beast_id, move_id, target_beast_id, turn_number)
VALUES ('battle-123', 'bob-id', 'bob-beast-1', 'water-pulse', 'alice-beast-1', 2);

UPDATE battles SET current_turn = 3 WHERE id = 'battle-123';
```

## Performance & Scalability

### Concurrent Battles
- **Multiple rooms**: Many Player 1s can wait simultaneously
- **Fair matching**: First available room gets next player
- **No conflicts**: Atomic room updates prevent double-joining

### WebSocket Efficiency
- **Targeted channels**: Each room/battle has dedicated channel
- **Event filtering**: Only relevant updates trigger UI changes
- **Auto cleanup**: Channels unsubscribe when users leave

### Database Optimization
- **Indexed queries**: Fast room lookups by status
- **Minimal data**: Only essential fields in real-time updates
- **Cleanup jobs**: Remove old rooms periodically

## Error Handling

### Common Scenarios
```
Room full (race condition):
└── Fallback: Create new room

WebSocket disconnect:
└── Reconnect: Resume battle state

Battle timeout:
└── Auto-forfeit: Declare winner

Invalid moves:
└── Reject: Show error, keep turn
```

## Future Enhancements

### Planned Features
- **Spectator mode**: Watch ongoing battles
- **Replay system**: Review battle history
- **Tournament brackets**: Multi-round competitions
- **Ranked matchmaking**: Skill-based pairing
- **Battle analytics**: Move statistics and insights

This system provides a complete, scalable, real-time PvP battle experience with seamless matchmaking and engaging turn-based combat.
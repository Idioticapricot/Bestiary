# P2P Battle System - MVP Implementation Guide

## Overview
A real-time peer-to-peer battle system for Beastiar where players can find opponents, engage in live battles, and compete for rewards.

## Core Components

### 1. Matchmaking System

#### Queue-Based Matching
```typescript
interface BattleQueue {
  playerId: string
  teamId: string
  rankPoints: number
  queuedAt: Date
  preferences: {
    rankRange: number // ±200 points
    maxWaitTime: number // 60 seconds
  }
}
```

#### Matching Algorithm
- **Rank-based**: Match players within ±200 rank points
- **Wait time expansion**: Expand range every 15 seconds
- **Auto-match**: Force match after 60 seconds regardless of rank

### 2. Real-time Communication (Vercel Compatible)

#### Polling + Server-Sent Events
```typescript
// API-based real-time simulation
enum BattleEvents {
  QUEUE_JOIN = 'queue:join',
  QUEUE_LEAVE = 'queue:leave',
  MATCH_FOUND = 'match:found',
  BATTLE_START = 'battle:start',
  MOVE_SUBMIT = 'move:submit',
  TURN_END = 'turn:end',
  BATTLE_END = 'battle:end'
}
```

#### Serverless Real-time Strategy
- **Short polling** (2-3 second intervals) for battle state
- **Optimistic updates** for immediate UI feedback
- **Database triggers** for state changes
- **Edge functions** for low-latency responses

### 3. Battle Flow

#### Pre-Battle Phase (30 seconds)
1. **Match Found**: Both players notified
2. **Team Confirmation**: Players confirm their active team
3. **Loading Screen**: Show opponent info and battle arena
4. **Ready Check**: Both players must ready up

#### Battle Phase
1. **Turn-based Combat**: 30-second turn timer
2. **Move Selection**: Choose move + target
3. **Simultaneous Resolution**: Both moves execute together
4. **Health/Status Updates**: Real-time HP bars and effects
5. **Victory Conditions**: First team eliminated loses

#### Post-Battle Phase
1. **Results Screen**: Winner, XP gained, rank changes
2. **Rewards Distribution**: Tokens, items, rank points
3. **Rematch Option**: Quick rematch with same opponent

### 4. Database Schema

#### Battle Sessions
```sql
CREATE TABLE battle_sessions (
  id UUID PRIMARY KEY,
  player1_id UUID REFERENCES users(id),
  player2_id UUID REFERENCES users(id),
  player1_team_id UUID REFERENCES teams(id),
  player2_team_id UUID REFERENCES teams(id),
  status ENUM('waiting', 'active', 'completed', 'abandoned'),
  winner_id UUID REFERENCES users(id),
  stake_amount DECIMAL(18,8),
  started_at TIMESTAMP,
  ended_at TIMESTAMP,
  battle_data JSONB -- Store turn-by-turn actions
);
```

#### Battle Queue
```sql
CREATE TABLE battle_queue (
  id UUID PRIMARY KEY,
  player_id UUID REFERENCES users(id),
  team_id UUID REFERENCES teams(id),
  rank_points INTEGER,
  queued_at TIMESTAMP DEFAULT NOW(),
  preferences JSONB
);
```

### 5. UI Components

#### Queue Interface
```typescript
// Components needed:
- QueueButton: Join/Leave queue
- QueueStatus: Position, estimated wait time
- QueueSettings: Rank range, stake amount
- MatchFoundModal: Accept/Decline match
```

#### Battle Arena
```typescript
// Real-time battle interface:
- BattleField: 3D arena with both teams
- TurnTimer: Countdown for current turn
- MoveSelector: Available moves for active beast
- HealthBars: Real-time HP for all beasts
- BattleLog: Move history and damage dealt
- ChatSystem: Quick messages/emotes
```

#### Results Screen
```typescript
// Post-battle summary:
- VictoryAnimation: Winner celebration
- StatsComparison: Damage dealt, moves used
- RewardsPanel: XP, tokens, rank changes
- RematchButton: Challenge same opponent
```

### 6. Technical Implementation

#### Vercel API Routes
```typescript
// Matchmaking
POST /api/battle/queue/join
DELETE /api/battle/queue/leave
GET /api/battle/queue/status
GET /api/battle/queue/poll // Long polling for matches

// Battle Management
POST /api/battle/create
POST /api/battle/[id]/move
GET /api/battle/[id]/state
GET /api/battle/[id]/poll // Poll for state changes
POST /api/battle/[id]/surrender
```

#### Client-Side Polling
```typescript
// Real-time simulation with polling
const useBattleState = (battleId: string) => {
  const [state, setState] = useState(null)
  
  useEffect(() => {
    const poll = async () => {
      const response = await fetch(`/api/battle/${battleId}/poll`)
      const newState = await response.json()
      setState(newState)
    }
    
    const interval = setInterval(poll, 2000) // 2-second polling
    return () => clearInterval(interval)
  }, [battleId])
  
  return state
}
```

### 7. Game Balance & Rules

#### Turn System
- **Simultaneous Turns**: Both players select moves simultaneously
- **Speed Priority**: Faster beast moves first if same turn
- **Move Cooldowns**: Prevent spamming powerful moves
- **Status Effects**: Poison, burn, stun affect turn order

#### Victory Conditions
- **Team Elimination**: All 3 beasts defeated
- **Timeout Victory**: Higher total HP wins after 10 turns
- **Surrender**: Player can forfeit anytime

#### Rewards System
```typescript
interface BattleRewards {
  winner: {
    rankPoints: number // +25 to +50 based on opponent rank
    tokens: number // 50-100 $WAM
    experience: number // 100-200 XP per beast
  }
  loser: {
    rankPoints: number // -10 to -25
    tokens: number // 10-25 $WAM (participation)
    experience: number // 25-50 XP per beast
  }
}
```

### 8. Anti-Cheat Measures

#### Server-Side Validation
- All moves validated on server
- Damage calculations server-side only
- Turn timers enforced server-side
- Move cooldowns tracked server-side

#### Connection Monitoring
- Detect disconnections vs intentional leaves
- Reconnection grace period (30 seconds)
- Auto-forfeit after timeout
- Rate limiting on actions

### 9. MVP Implementation Priority

#### Phase 1 (Core Battle)
1. Basic matchmaking queue
2. Turn-based battle system
3. Simple UI for move selection
4. Victory/defeat detection

#### Phase 2 (Polish)
1. Real-time animations
2. Battle effects and sounds
3. Improved matchmaking algorithm
4. Reconnection handling

#### Phase 3 (Advanced)
1. Spectator mode
2. Tournament brackets
3. Replay system
4. Advanced statistics

### 10. Technical Stack

#### Backend (Vercel Serverless)
- **API Routes**: Next.js API routes for all endpoints
- **Database**: PostgreSQL (Neon/Supabase) for all state
- **Caching**: Vercel Edge Config for fast reads
- **Rate Limiting**: Upstash Redis or database-based

#### Frontend
- **Real-time Simulation**: Short polling with optimistic updates
- **State Management**: Zustand for battle state
- **Animations**: Framer Motion for battle effects
- **UI Components**: Existing styled-components

### 11. Deployment Considerations

#### Vercel Deployment
- **Edge Functions**: Deploy API routes to edge locations
- **Database**: Connection pooling with Prisma
- **Static Assets**: Automatic CDN via Vercel
- **Environment**: Serverless functions auto-scale

#### Monitoring
- **Vercel Analytics**: Function performance
- **Database Metrics**: Query performance
- **Custom Logging**: Battle events and errors
- **Uptime Monitoring**: API endpoint health

## Vercel Deployment Configuration

### vercel.json
```json
{
  "functions": {
    "app/api/battle/queue/poll/route.ts": {
      "maxDuration": 30
    },
    "app/api/battle/[id]/poll/route.ts": {
      "maxDuration": 30
    }
  },
  "env": {
    "DATABASE_URL": "@database-url",
    "DIRECT_URL": "@direct-url"
  }
}
```

### Environment Variables
```bash
# .env.local
DATABASE_URL="postgresql://..."
DIRECT_URL="postgresql://..."
UPSTASH_REDIS_URL="redis://..."
UPSTASH_REDIS_TOKEN="..."
```

## Implementation Timeline

### Week 1: Serverless Infrastructure
- Next.js API routes setup
- Database schema with Prisma
- Basic matchmaking queue

### Week 2: Battle System
- Turn-based combat logic
- Polling-based state updates
- Move validation system

### Week 3: UI Development
- Queue interface with polling
- Battle arena components
- Optimistic UI updates

### Week 4: Polish & Deployment
- Vercel deployment optimization
- Performance tuning
- Error handling and fallbacks

## Vercel-Specific Implementation

### API Route Structure
```
app/api/battle/
├── queue/
│   ├── join/route.ts
│   ├── leave/route.ts
│   ├── status/route.ts
│   └── poll/route.ts
├── [id]/
│   ├── move/route.ts
│   ├── state/route.ts
│   ├── poll/route.ts
│   └── surrender/route.ts
└── create/route.ts
```

### Long Polling Implementation
```typescript
// app/api/battle/queue/poll/route.ts
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const playerId = searchParams.get('playerId')
  
  // Poll for match for up to 25 seconds (Vercel timeout limit)
  const startTime = Date.now()
  const timeout = 25000
  
  while (Date.now() - startTime < timeout) {
    const match = await checkForMatch(playerId)
    if (match) {
      return NextResponse.json(match)
    }
    await new Promise(resolve => setTimeout(resolve, 1000))
  }
  
  return NextResponse.json({ status: 'no_match' })
}
```

### Database Optimizations
```typescript
// Efficient polling queries
const getBattleState = async (battleId: string, lastUpdate?: Date) => {
  return await prisma.battle.findFirst({
    where: {
      id: battleId,
      updatedAt: lastUpdate ? { gt: lastUpdate } : undefined
    },
    include: {
      actions: {
        where: {
          createdAt: lastUpdate ? { gt: lastUpdate } : undefined
        }
      }
    }
  })
}
```

### Client-Side Optimizations
```typescript
// Optimistic updates for better UX
const submitMove = async (moveData) => {
  // Immediately update UI
  setOptimisticState(moveData)
  
  try {
    const result = await fetch('/api/battle/move', {
      method: 'POST',
      body: JSON.stringify(moveData)
    })
    
    // Update with server response
    const serverState = await result.json()
    setState(serverState)
  } catch (error) {
    // Revert optimistic update
    revertOptimisticState()
  }
}
```

This Vercel-optimized P2P battle system provides real-time-like experience using serverless architecture. The polling approach with optimistic updates creates smooth gameplay while staying within Vercel's serverless constraints.
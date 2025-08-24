export interface Beast {
  id: string
  name: string
  tier: 'basic' | 'advanced' | 'legendary'
  level: number
  exp: { current: number; required: number }
  stats: { health: number; stamina: number; power: number }
  elementType: 'fire' | 'water' | 'earth' | 'electric'
  rarity: 'common' | 'rare' | 'legendary'
  imageUrl?: string
  isForSale?: boolean
  moves: Move[]
  // NFT Integration
  nftTokenId?: string
  nftContractAddress?: string
  blockchain?: string
  // Additional fields from database
  ownerId?: string
  currentExp?: number
  requiredExp?: number
  health?: number
  stamina?: number
  power?: number
  abilities?: string[]
  description?: string
  aiPrompt?: string
  nftMetadataUri?: string
  createdAt?: Date
  updatedAt?: Date
  salePrice?: number
  isInBattle?: boolean
}

export interface Move {
  id: string
  name: string
  damage: number
  elementType: 'fire' | 'water' | 'earth' | 'electric'
  cooldown: number
  description?: string
}

export interface BattleState {
  id: string
  teams: Beast[][]
  currentTurn: number
  winner?: string
  log: BattleAction[]
}

export interface BattleAction {
  id: string
  type: 'move' | 'switch' | 'item'
  beastId: string
  targetId?: string
  moveId?: string
  damage?: number
  timestamp: Date
}
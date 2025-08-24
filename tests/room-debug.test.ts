import { describe, it, expect } from '@jest/globals'

describe('Debug Room Tests', () => {
  const PLAYER1_ID = '0a7b9065-151b-48ae-83fd-1c40ea37bf2d'
  const PLAYER2_ID = 'test-player-2-id'
  
  it('should debug validateBattleEntry function', () => {
    function validateBattleEntry(battleId: string, playerId: string) {
      const battle = {
        id: battleId,
        player1_id: PLAYER1_ID,
        player2_id: PLAYER2_ID,
        status: 'ACTIVE'
      }
      
      console.log('Battle:', battle)
      console.log('PlayerId:', playerId)
      console.log('PLAYER1_ID:', PLAYER1_ID)
      console.log('PLAYER2_ID:', PLAYER2_ID)
      
      const isValidPlayer = battle.player1_id === playerId || battle.player2_id === playerId
      const isBattleActive = battle.status === 'ACTIVE'
      const hasBothPlayers = battle.player1_id && battle.player2_id
      
      console.log('isValidPlayer:', isValidPlayer)
      console.log('isBattleActive:', isBattleActive)
      console.log('hasBothPlayers:', hasBothPlayers)
      
      return {
        canEnterBattle: isValidPlayer && isBattleActive && hasBothPlayers,
        playerRole: battle.player1_id === playerId ? 'player1' : 'player2'
      }
    }

    const result = validateBattleEntry('battle-123', PLAYER1_ID)
    console.log('Result:', result)
    
    expect(result.canEnterBattle).toBe(true)
    expect(result.playerRole).toBe('player1')
  })
})
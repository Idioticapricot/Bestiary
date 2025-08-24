import { useState } from 'react'
import { supabase } from '@/lib/supabase'

function generateSlug(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase()
}

export function useQuickMatch(userId: string, teamId: string) {
  const [isWaiting, setIsWaiting] = useState(false)
  const [battleId, setBattleId] = useState<string | null>(null)
  const [roomSlug, setRoomSlug] = useState<string | null>(null)

  const quickMatch = async () => {
    console.log('🎮 MATCHMAKING: Starting quick match for user:', userId)
    setIsWaiting(true)

    try {
      console.log('🔍 MATCHMAKING: Checking for available rooms...')
      // Check if room exists and is not full
      const { data: rooms } = await supabase
        .from('battle_rooms')
        .select('*')
        .eq('status', 'waiting')
        .limit(1)
      
      const availableRoom = rooms && rooms.length > 0 ? rooms[0] : null

      if (availableRoom) {
        console.log('✅ MATCHMAKING: Found available room:', availableRoom.slug)
        console.log('👥 MATCHMAKING: Joining as Player 2...')
        
        // Join existing room as Player 2
        const { data: updatedRoom } = await supabase
          .from('battle_rooms')
          .update({ 
            player2_id: userId, 
            status: 'full' 
          })
          .eq('id', availableRoom.id)
          .eq('status', 'waiting')
          .select()
          .single()

        if (updatedRoom) {
          console.log('🚀 MATCHMAKING: Room full! Starting battle immediately...')
          await startBattle(updatedRoom)
          return
        }
      }

      // No room exists, create new room as Player 1
      const slug = generateSlug()
      console.log('❌ MATCHMAKING: No available rooms found')
      console.log('🏗️ MATCHMAKING: Creating new room with slug:', slug)
      
      const { data: newRoom } = await supabase
        .from('battle_rooms')
        .insert({
          slug,
          player1_id: userId,
          status: 'waiting'
        })
        .select()
        .single()

      if (newRoom) {
        console.log('✅ MATCHMAKING: Room created successfully')
        console.log('⏳ MATCHMAKING: Waiting for Player 2 to join...')
        setRoomSlug(slug)
        listenForOpponent(slug)
      }

    } catch (error) {
      console.error('❌ MATCHMAKING ERROR:', error.message || error)
      setIsWaiting(false)
    }
  }

  const listenForOpponent = (slug: string) => {
    console.log('👂 MATCHMAKING: Listening for opponent on room:', slug)
    
    const channel = supabase
      .channel(`room:${slug}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'battle_rooms',
        filter: `slug=eq.${slug}`
      }, async (payload) => {
        if (payload.new.status === 'full') {
          console.log('🎉 MATCHMAKING: Player 2 joined room:', slug)
          console.log('🚀 MATCHMAKING: Starting battle...')
          await startBattle(payload.new)
          // Cleanup channel after battle starts
          channel.unsubscribe()
        }
        // Handle case where battle was created by Player 2
        if (payload.new.battle_id && !battleId) {
          console.log('✅ MATCHMAKING: Battle created by opponent, joining...', payload.new.battle_id)
          setBattleId(payload.new.battle_id)
          setIsWaiting(false)
          channel.unsubscribe()
        }
      })
      .subscribe()
      
    // Store channel reference for cleanup
    return channel
  }

  const startBattle = async (room: any) => {
    console.log('⚔️ BATTLE: Creating battle for room:', room.slug)
    
    // Check if battle already exists (race condition protection)
    if (room.battle_id) {
      console.log('✅ BATTLE: Battle already exists, redirecting...', room.battle_id)
      setBattleId(room.battle_id)
      setIsWaiting(false)
      return
    }
    
    // Get team IDs for both players
    const isPlayer1 = room.player1_id === userId
    
    // Fetch team IDs for both players from database
    const [player1Team, player2Team] = await Promise.all([
      supabase.from('teams').select('id').eq('user_id', room.player1_id).single(),
      supabase.from('teams').select('id').eq('user_id', room.player2_id).single()
    ])
    
    const player1TeamId = player1Team.data?.id
    const player2TeamId = player2Team.data?.id
    
    console.log('👤 BATTLE: Player roles -', {
      'Current User': isPlayer1 ? 'Player 1' : 'Player 2',
      'Player 1 ID': room.player1_id,
      'Player 2 ID': room.player2_id,
      'Player 1 Team': player1TeamId,
      'Player 2 Team': player2TeamId
    })

    if (!player1TeamId || !player2TeamId) {
      console.error('❌ BATTLE: Missing team data for players')
      console.error('❌ BATTLE: Player 1 Team:', player1TeamId, 'Player 2 Team:', player2TeamId)
      
      // Try to create battle anyway and let battle page handle missing teams
      console.log('⚠️ BATTLE: Proceeding with battle creation despite missing team data')
    }

    // Create battle using existing battles table
    const { data: battle } = await supabase
      .from('battles')
      .insert({
        player1_id: room.player1_id,
        player2_id: room.player2_id,
        player1_team: player1TeamId || null,
        player2_team: player2TeamId || null,
        battle_type: 'PVP',
        status: 'ACTIVE',
        current_turn: 1
      })
      .select()
      .single()

    if (battle) {
      console.log('✅ BATTLE: Battle created with ID:', battle.id)
      console.log('🎯 BATTLE: Player 1 starts first (Turn 1)')
      
      // Update room with battle ID
      await supabase
        .from('battle_rooms')
        .update({ 
          battle_id: battle.id, 
          status: 'active' 
        })
        .eq('id', room.id)

      console.log('🏁 MATCHMAKING: Complete! Redirecting to battle...')
      setBattleId(battle.id)
      setIsWaiting(false)
    }
  }

  const cancelWait = async () => {
    if (roomSlug) {
      console.log('❌ MATCHMAKING: User cancelled - deleting room:', roomSlug)
      await supabase
        .from('battle_rooms')
        .delete()
        .eq('slug', roomSlug)
        .eq('player1_id', userId)
      console.log('🗑️ MATCHMAKING: Room deleted successfully')
    }
    
    setIsWaiting(false)
    setRoomSlug(null)
  }

  return { 
    isWaiting, 
    battleId, 
    roomSlug,
    quickMatch, 
    cancelWait 
  }
}
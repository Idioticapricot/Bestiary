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
      const { data: availableRoom } = await supabase
        .from('battle_rooms')
        .select('*')
        .eq('status', 'waiting')
        .limit(1)
        .single()

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
        }
      })
      .subscribe()
  }

  const startBattle = async (room: any) => {
    console.log('⚔️ BATTLE: Creating battle for room:', room.slug)
    
    // Get team IDs for both players
    const isPlayer1 = room.player1_id === userId
    const player1TeamId = isPlayer1 ? teamId : null
    const player2TeamId = !isPlayer1 ? teamId : null
    
    console.log('👤 BATTLE: Player roles -', {
      'Current User': isPlayer1 ? 'Player 1' : 'Player 2',
      'Player 1 ID': room.player1_id,
      'Player 2 ID': room.player2_id
    })

    // Create battle using existing battles table
    const { data: battle } = await supabase
      .from('battles')
      .insert({
        player1_id: room.player1_id,
        player2_id: room.player2_id,
        player1_team_id: player1TeamId,
        player2_team_id: player2TeamId,
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
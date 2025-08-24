import { useState } from 'react'
import { supabase } from '@/lib/supabase'

function generateSlug(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase()
}

export function useQuickMatch(userId: string, teamId: string) {
  const [isSearching, setIsSearching] = useState(false)
  const [battleId, setBattleId] = useState<string | null>(null)
  const [roomSlug, setRoomSlug] = useState<string | null>(null)

  const quickMatch = async () => {
    setIsSearching(true)

    try {
      // First, try to join any waiting room
      const { data: waitingRoom } = await supabase
        .from('battle_rooms')
        .select('*')
        .eq('status', 'waiting')
        .limit(1)
        .single()

      if (waitingRoom) {
        // Join existing room
        const { data: updatedRoom } = await supabase
          .from('battle_rooms')
          .update({ 
            player2_id: userId, 
            status: 'full' 
          })
          .eq('id', waitingRoom.id)
          .eq('status', 'waiting') // Ensure it's still waiting
          .select()
          .single()

        if (updatedRoom) {
          await startBattle(updatedRoom)
          return
        }
      }

      // No waiting rooms found, create new one
      const slug = generateSlug()
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
        setRoomSlug(slug)
        listenForOpponent(slug)
      }

    } catch (error) {
      console.error('Quick match error:', error)
      setIsSearching(false)
    }
  }

  const listenForOpponent = (slug: string) => {
    const channel = supabase
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
    // Create battle using existing battles table
    const { data: battle } = await supabase
      .from('battles')
      .insert({
        player1_id: room.player1_id,
        player2_id: room.player2_id,
        player1_team_id: teamId,
        player2_team_id: teamId,
        battle_type: 'PVP',
        status: 'ACTIVE',
        current_turn: 1
      })
      .select()
      .single()

    if (battle) {
      // Update room with battle ID
      await supabase
        .from('battle_rooms')
        .update({ 
          battle_id: battle.id, 
          status: 'active' 
        })
        .eq('id', room.id)

      setBattleId(battle.id)
      setIsSearching(false)
    }
  }

  const cancelSearch = async () => {
    if (roomSlug) {
      await supabase
        .from('battle_rooms')
        .delete()
        .eq('slug', roomSlug)
        .eq('player1_id', userId)
    }
    
    setIsSearching(false)
    setRoomSlug(null)
  }

  return { 
    isSearching, 
    battleId, 
    roomSlug,
    quickMatch, 
    cancelSearch 
  }
}
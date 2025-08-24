import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

interface ProcessMoveRequest {
  battleId: string
  playerId: string
  moveId: string
  targetBeastId: string
}

export async function POST(request: NextRequest) {
  try {
    const { battleId, playerId, moveId, targetBeastId }: ProcessMoveRequest = await request.json()

    // Get battle with current state
    const battle = await prisma.battle.findUnique({
      where: { id: battleId },
      include: {
        player1: true,
        player2: true
      }
    })

    if (!battle || !battle.player2Id) {
      return NextResponse.json({ error: 'Battle not found or incomplete' }, { status: 404 })
    }

    // Validate turn
    const isPlayer1 = battle.player1Id === playerId
    const isPlayer1Turn = battle.currentTurn % 2 === 1
    const isValidTurn = isPlayer1 ? isPlayer1Turn : !isPlayer1Turn

    if (!isValidTurn) {
      return NextResponse.json({ error: 'Not your turn' }, { status: 400 })
    }

    // Get move details
    const move = await prisma.move.findUnique({
      where: { id: moveId }
    })

    if (!move) {
      return NextResponse.json({ error: 'Move not found' }, { status: 404 })
    }

    // Get attacker and target beasts
    const attackerTeamId = isPlayer1 ? battle.player1TeamId : battle.player2TeamId
    const targetTeamId = isPlayer1 ? battle.player2TeamId : battle.player1TeamId

    const [attackerTeam, targetTeam] = await Promise.all([
      prisma.team.findUnique({
        where: { id: attackerTeamId },
        include: {
          beast1: true,
          beast2: true,
          beast3: true
        }
      }),
      prisma.team.findUnique({
        where: { id: targetTeamId },
        include: {
          beast1: true,
          beast2: true,
          beast3: true
        }
      })
    ])

    if (!attackerTeam || !targetTeam) {
      return NextResponse.json({ error: 'Teams not found' }, { status: 404 })
    }

    // Get active beasts (first alive beast)
    const attackerBeast = [attackerTeam.beast1, attackerTeam.beast2, attackerTeam.beast3]
      .filter(Boolean)
      .find(beast => (beast?.health) > 0)

    const targetBeast = [targetTeam.beast1, targetTeam.beast2, targetTeam.beast3]
      .filter(Boolean)
      .find(beast => beast?.id === targetBeastId)

    if (!attackerBeast || !targetBeast) {
      return NextResponse.json({ error: 'Beasts not found' }, { status: 404 })
    }

    // Calculate damage
    const damage = calculateDamage(attackerBeast, targetBeast, move)
    const currentHP = targetBeast.health
    const newHP = Math.max(0, currentHP - damage)

    // Update target beast HP
    await prisma.beast.update({
      where: { id: targetBeast.id },
      data: { health: newHP }
    })

    // Record battle action
    await prisma.battleAction.create({
      data: {
        battleId: battleId,
        playerId: playerId,
        beastId: attackerBeast.id,
        moveId: moveId,
        targetBeastId: targetBeastId,
        damageDealt: damage,
        turnNumber: battle.currentTurn
      }
    })

    // Check for victory
    let winner = null
    if (newHP <= 0) {
      // Check if all beasts in target team are defeated
      const allTargetBeasts = [targetTeam.beast1, targetTeam.beast2, targetTeam.beast3].filter(Boolean)
      const aliveBeasts = await Promise.all(
        allTargetBeasts.map(async (beast) => {
          if (beast?.id === targetBeast.id) return { ...beast, health: newHP }
          const updated = await prisma.beast.findUnique({ where: { id: beast!.id } })
          return updated
        })
      )
      
      const hasAliveBeasts = aliveBeasts.some(beast => beast?.health > 0)
      if (!hasAliveBeasts) {
        winner = playerId
      }
    }

    // Update battle state
    const updatedBattle = await prisma.battle.update({
      where: { id: battleId },
      data: {
        currentTurn: battle.currentTurn + 1,
        winnerId: winner,
        status: winner ? 'COMPLETED' : 'ACTIVE'
      }
    })

    return NextResponse.json({
      success: true,
      damage,
      newHP,
      winner,
      battle: updatedBattle,
      moveUsed: move.name,
      attackerName: attackerBeast.name,
      targetName: targetBeast.name
    })

  } catch (error) {
    console.error('Error processing move:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

function calculateDamage(attacker: any, defender: any, move: any): number {
  const attackerPower = attacker.power || 50
  const baseDamage = (attackerPower * move.damage) / 100
  const typeMultiplier = getTypeEffectiveness(move.element_type, defender.element_type)
  const critChance = 0.0625 + (attackerPower / 1000)
  const isCrit = Math.random() < critChance
  const critMultiplier = isCrit ? 1.5 : 1
  const randomFactor = 0.85 + Math.random() * 0.3
  
  return Math.floor(baseDamage * typeMultiplier * critMultiplier * randomFactor)
}

function getTypeEffectiveness(attackType: string, defenseType: string): number {
  const effectiveness: Record<string, Record<string, number>> = {
    FIRE: { EARTH: 2, WATER: 0.5, ELECTRIC: 1, FIRE: 1 },
    EARTH: { ELECTRIC: 2, FIRE: 0.5, WATER: 1, EARTH: 1 },
    ELECTRIC: { WATER: 2, EARTH: 0.5, FIRE: 1, ELECTRIC: 1 },
    WATER: { FIRE: 2, ELECTRIC: 0.5, EARTH: 1, WATER: 1 }
  }
  return effectiveness[attackType?.toUpperCase()]?.[defenseType?.toUpperCase()] || 1
}
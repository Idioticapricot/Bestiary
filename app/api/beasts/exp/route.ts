import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const { beastId, expGained } = await request.json()

    if (!beastId || !expGained) {
      return NextResponse.json({ error: 'Missing beastId or expGained' }, { status: 400 })
    }

    // Get current beast data
    const beast = await prisma.beast.findUnique({
      where: { id: beastId }
    })

    if (!beast) {
      return NextResponse.json({ error: 'Beast not found' }, { status: 404 })
    }

    const newCurrentExp = beast.currentExp + expGained
    let newLevel = beast.level
    let newRequiredExp = beast.requiredExp

    // Check for level up
    if (newCurrentExp >= beast.requiredExp) {
      newLevel += 1
      newRequiredExp = Math.floor(beast.requiredExp * 1.2) // 20% increase per level
    }

    // Update beast
    const updatedBeast = await prisma.beast.update({
      where: { id: beastId },
      data: {
        currentExp: newCurrentExp,
        level: newLevel,
        requiredExp: newRequiredExp
      }
    })

    return NextResponse.json({
      success: true,
      beast: updatedBeast,
      leveledUp: newLevel > beast.level
    })

  } catch (error) {
    console.error('EXP award error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
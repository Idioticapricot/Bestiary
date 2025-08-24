import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const includeForSale = searchParams.get('includeForSale') === 'true'
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 })
    }

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(userId)) {
      return NextResponse.json({ error: 'Invalid user ID format' }, { status: 400 })
    }

    const beastsData = await prisma.beast.findMany({
      where: { 
        ownerId: userId
      },
      include: {
        moves: {
          include: {
            move: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    // Transform database format to frontend format
    const beasts = beastsData.map(beast => ({
      id: beast.id,
      name: beast.name,
      tier: beast.tier.toLowerCase(),
      level: beast.level,
      exp: {
        current: beast.currentExp,
        required: beast.requiredExp
      },
      stats: {
        health: beast.health,
        stamina: beast.stamina,
        power: beast.power
      },
      elementType: beast.elementType.toLowerCase(),
      rarity: beast.rarity.toLowerCase(),
      imageUrl: beast.nftMetadataUri,
      isForSale: beast.isForSale,
      // NFT Integration fields
      nftTokenId: beast.nftTokenId,
      nftContractAddress: beast.nftContractAddress,
      blockchain: beast.blockchain,
      nftMetadataUri: beast.nftMetadataUri,
      moves: beast.moves.map(bm => ({
        id: bm.move.id,
        name: bm.move.name,
        damage: bm.move.damage,
        elementType: bm.move.elementType.toLowerCase(),
        cooldown: bm.move.cooldown,
        description: bm.move.description
      }))
    }))

    return NextResponse.json(beasts)
  } catch (error) {
    console.error('Error fetching beasts:', error)
    return NextResponse.json({ error: 'Failed to fetch beasts' }, { status: 500 })
  }
}
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { ethers } from 'ethers'

const RPC_URL = process.env.AVALANCHE_RPC_URL || 'https://api.avax-test.network/ext/bc/C/rpc'
const CONTRACT_ADDRESS = process.env.NFT_CONTRACT_ADDRESS || '0xb8433deCc52A3a08600d6A13CfA161849C7a27Ee'

export async function POST(request: NextRequest) {
  try {
    const { beastData, transactionHash } = await request.json()

    if (!beastData || !transactionHash) {
      return NextResponse.json({ error: 'Missing beast data or transaction hash' }, { status: 400 })
    }

    // Verify transaction and extract token ID
    const provider = new ethers.JsonRpcProvider(RPC_URL)
    const receipt = await provider.getTransactionReceipt(transactionHash)
    
    if (!receipt || receipt.status !== 1) {
      return NextResponse.json({ error: 'Transaction failed or not found' }, { status: 400 })
    }
    
    if (receipt.to?.toLowerCase() !== CONTRACT_ADDRESS.toLowerCase()) {
      return NextResponse.json({ error: 'Invalid contract address' }, { status: 400 })
    }

    // Extract token ID from Transfer event
    let tokenId = null
    for (const log of receipt.logs) {
      if (log.topics[0] === '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef') { // Transfer event
        tokenId = parseInt(log.topics[3], 16).toString() // Convert hex to decimal
        break
      }
    }
    
    if (!tokenId) {
      return NextResponse.json({ error: 'Could not extract token ID from transaction' }, { status: 400 })
    }

    // Check if beast already exists for this token
    const existingBeast = await prisma.beast.findUnique({
      where: { nftTokenId: tokenId }
    })
    
    if (existingBeast) {
      return NextResponse.json({ beast: existingBeast })
    }

    // Save beast to database only after successful NFT minting
    const result = await prisma.$transaction(async (tx) => {
      // Get random abilities based on rarity
      const abilities = await tx.ability.findMany({
        where: {
          rarity: beastData.rarity === 'LEGENDARY' ? 'LEGENDARY' : beastData.rarity === 'RARE' ? 'RARE' : 'COMMON'
        },
        take: beastData.rarity === 'LEGENDARY' ? 3 : beastData.rarity === 'RARE' ? 2 : 1
      })

      // Create beast in database
      const beast = await tx.beast.create({
        data: {
          ownerId: beastData.userId,
          name: beastData.name,
          tier: beastData.tier,
          elementType: beastData.elementType,
          rarity: beastData.rarity,
          health: beastData.health,
          stamina: beastData.stamina,
          power: beastData.power,
          description: beastData.description,
          aiPrompt: beastData.aiPrompt,
          nftMetadataUri: beastData.nftMetadataUri,
          nftTokenId: tokenId, // Store actual NFT token ID
          nftContractAddress: CONTRACT_ADDRESS, // Store contract address
          abilities: abilities.map(a => a.id)
        }
      })

      // Assign basic moves
      const basicMoves = await tx.move.findMany({
        where: {
          elementType: beastData.elementType,
          tier: 'BASIC',
          minLevel: { lte: 5 }
        },
        take: 2
      })

      // Create beast moves
      for (let i = 0; i < basicMoves.length; i++) {
        await tx.beastMove.create({
          data: {
            beastId: beast.id,
            moveId: basicMoves[i].id,
            slotIndex: i
          }
        })
      }

      return { beast, abilities }
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error('Beast confirmation error:', error)
    return NextResponse.json({ error: 'Failed to save beast' }, { status: 500 })
  }
}
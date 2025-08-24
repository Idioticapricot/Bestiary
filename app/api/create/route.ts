import { NextRequest, NextResponse } from 'next/server'
import { fal } from '@fal-ai/client'
import { prisma } from '@/lib/prisma'

const BASE_PROMPT = "Create a high-detail pixel art dragon with no background. Render a perfect, symmetric side view of the entire dragon, showcasing its elongated body, detailed scales, and vibrant colors in crisp pixel style. The image should capture the dragon in full profile with clean lines and a balanced composition, emphasizing its majestic form without any additional elements."

fal.config({
  credentials: process.env.FAL_KEY
})

export async function POST(request: NextRequest) {
  try {
    const { description, tier, stats, userId, name, elementType, rarity } = await request.json()

    if (!description || !tier || !stats || !userId || !name || !elementType || !rarity) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Only generate image - don't save to database yet
    const enhancedPrompt = `${BASE_PROMPT} ${description}`
    const result = await fal.subscribe("fal-ai/flux-1/schnell", {
      input: {
        prompt: enhancedPrompt
      }
    })

    if (!result.data?.images?.[0]?.url) {
      return NextResponse.json({ error: 'Failed to generate image' }, { status: 500 })
    }

    // Return image and beast data for minting, but don't save to database
    return NextResponse.json({ 
      imageUrl: result.data.images[0].url,
      beastData: {
        userId,
        name,
        tier: tier.toUpperCase(),
        elementType: elementType.toUpperCase(),
        rarity: rarity.toUpperCase(),
        health: stats.health,
        stamina: stats.stamina,
        power: stats.power,
        description,
        aiPrompt: enhancedPrompt,
        nftMetadataUri: result.data.images[0].url
      }
    })
  } catch (error) {
    console.error('Image generation error:', error)
    return NextResponse.json({ error: 'Failed to generate image' }, { status: 500 })
  }
}
"use client"

import { useState, useEffect } from "react"
import { AppLayout } from "../../components/layout/AppLayout"
import styled from "styled-components"
import { Card, Button } from "../../components/styled/GlobalStyles"
import { BeastCard as BeastCardComponent } from "../../components/beast/BeastCard"
import { LevelUpModal } from "../../components/beast/LevelUpModal"
import { LearnMoveModal } from "../../components/beast/LearnMoveModal"
import { Beast } from "../../types/beast"
import { getAvailableMoves } from "../../data/mockMoves"
import { useWallet } from "../../components/wallet/WalletProvider"

const TeamContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;
`

const TeamHeader = styled.div`
  text-align: center;
  background: var(--brutal-violet);
  padding: 24px;
  border: 4px solid var(--border-primary);
  box-shadow: 4px 4px 0px 0px var(--border-primary);
  font-family: var(--font-mono);
`

const TeamTitle = styled.h1`
  font-size: 32px;
  font-weight: 900;
  color: var(--text-primary);
  margin: 0 0 12px 0;
  text-transform: uppercase;
  letter-spacing: 3px;
`

const TeamSubtitle = styled.p`
  font-size: 16px;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0;
  text-transform: uppercase;
  letter-spacing: 1px;
`

const CurrentTeamSection = styled.div`
  background: var(--light-bg);
  border: 4px solid var(--border-primary);
  padding: 24px;
  box-shadow: 4px 4px 0px 0px var(--border-primary);
`

const SectionTitle = styled.h2`
  font-size: 20px;
  font-weight: 900;
  color: var(--text-primary);
  margin: 0 0 16px 0;
  font-family: var(--font-mono);
  text-transform: uppercase;
  letter-spacing: 2px;
  background: var(--brutal-cyan);
  padding: 8px 16px;
  border: 3px solid var(--border-primary);
  display: inline-block;
`

const TeamSlots = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  margin-bottom: 20px;
`

const TeamSlot = styled.div<{ $filled?: boolean }>`
  background: ${props => props.$filled ? "var(--brutal-lime)" : "var(--light-bg)"};
  border: 4px solid var(--border-primary);
  padding: 12px;
  text-align: center;
  min-height: 160px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-between;
  cursor: ${props => props.$filled ? "pointer" : "default"};
  transition: all 0.1s ease;
  box-shadow: 2px 2px 0px 0px var(--border-primary);
  
  &:hover {
    transform: ${props => props.$filled ? "translate(1px, 1px)" : "none"};
    box-shadow: ${props => props.$filled ? "1px 1px 0px 0px var(--border-primary)" : "2px 2px 0px 0px var(--border-primary)"};
  }
`

const SlotIcon = styled.div`
  font-size: 24px;
  margin-bottom: 4px;
`

const SlotText = styled.div`
  font-size: 12px;
  font-weight: 900;
  color: var(--text-primary);
  font-family: var(--font-mono);
  text-transform: uppercase;
  letter-spacing: 0.5px;
`

const BeastName = styled.div`
  font-size: 14px;
  font-weight: 900;
  color: var(--text-primary);
  font-family: var(--font-mono);
  text-transform: uppercase;
  margin-bottom: 4px;
`

const BeastLevel = styled.div`
  font-size: 10px;
  font-weight: 900;
  color: var(--text-primary);
  font-family: var(--font-mono);
  background: var(--brutal-pink);
  padding: 2px 6px;
  border: 2px solid var(--border-primary);
`

const MyBeastsSection = styled.div`
  background: var(--light-bg);
  border: 4px solid var(--border-primary);
  padding: 24px;
  box-shadow: 4px 4px 0px 0px var(--border-primary);
`

const BeastGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 16px;
`

const BeastCard = styled(Card)<{ $selected?: boolean }>`
  padding: 16px;
  text-align: center;
  cursor: pointer;
  background: ${props => props.$selected ? "var(--brutal-yellow)" : "var(--light-bg)"};
  transition: all 0.1s ease;
  
  &:hover {
    background: var(--brutal-cyan);
    transform: translate(2px, 2px);
    box-shadow: 2px 2px 0px 0px var(--border-primary);
  }
`

const BeastIcon = styled.div`
  font-size: 48px;
  margin-bottom: 12px;
`

const BeastCardName = styled.h3`
  font-size: 16px;
  font-weight: 900;
  color: var(--text-primary);
  margin: 0 0 8px 0;
  font-family: var(--font-mono);
  text-transform: uppercase;
  letter-spacing: 1px;
`

const BeastStats = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 4px;
  margin-bottom: 12px;
`

const StatItem = styled.div`
  background: var(--brutal-orange);
  padding: 4px;
  border: 2px solid var(--border-primary);
  text-align: center;
`

const StatLabel = styled.div`
  font-size: 8px;
  font-weight: 900;
  color: var(--text-primary);
  font-family: var(--font-mono);
  text-transform: uppercase;
`

const StatValue = styled.div`
  font-size: 12px;
  font-weight: 900;
  color: var(--text-primary);
  font-family: var(--font-mono);
`

const SaveTeamButton = styled(Button)`
  background: var(--brutal-lime);
  font-size: 18px;
  padding: 16px 32px;
  margin-top: 20px;
  
  &:hover {
    background: var(--brutal-cyan);
  }
`



export default function TeamPage() {
  const [currentTeam, setCurrentTeam] = useState<(Beast | null)[]>([null, null, null])
  const [selectedBeasts, setSelectedBeasts] = useState<string[]>([])
  const [levelUpBeast, setLevelUpBeast] = useState<string | null>(null)
  const [learnMoveBeast, setLearnMoveBeast] = useState<string | null>(null)
  const [userBeasts, setUserBeasts] = useState<Beast[]>([])
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)
  const { wallet } = useWallet()

  useEffect(() => {
    const initializeUser = async () => {
      if (!wallet.isConnected || !wallet.address) {
        setLoading(false)
        return
      }

      try {
        // Create or get user
        const userResponse = await fetch('/api/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            walletAddress: wallet.address,
            username: `User_${wallet.address.slice(-6)}`
          })
        })

        if (userResponse.ok) {
          const user = await userResponse.json()
          setUserId(user.id)

          // Fetch user's beasts
          const beastsResponse = await fetch(`/api/beasts?userId=${user.id}`)
          if (beastsResponse.ok) {
            const beasts = await beastsResponse.json()
            setUserBeasts(beasts)
          }

          // Fetch user's saved team
          const teamResponse = await fetch(`/api/teams?userId=${user.id}`)
          if (teamResponse.ok) {
            const team = await teamResponse.json()
            if (team && (team.beast1 || team.beast2 || team.beast3)) {
              const savedTeam = [team.beast1, team.beast2, team.beast3].map(beast => {
                if (!beast) return null
                return {
                  id: beast.id,
                  name: beast.name,
                  tier: beast.tier.toLowerCase(),
                  level: beast.level,
                  exp: { current: beast.currentExp, required: beast.requiredExp },
                  stats: { health: beast.health, stamina: beast.stamina, power: beast.power },
                  elementType: beast.elementType.toLowerCase(),
                  rarity: beast.rarity.toLowerCase(),
                  imageUrl: beast.nftMetadataUri,
                  moves: beast.moves.map(bm => ({
                    id: bm.move.id,
                    name: bm.move.name,
                    damage: bm.move.damage,
                    elementType: bm.move.elementType.toLowerCase(),
                    cooldown: bm.move.cooldown,
                    description: bm.move.description
                  }))
                }
              })
              setCurrentTeam(savedTeam)
              setSelectedBeasts(savedTeam.filter(Boolean).map(beast => beast.id))
            }
          }
        }
      } catch (error) {
        console.error('Error initializing user:', error)
      } finally {
        setLoading(false)
      }
    }

    initializeUser()
  }, [wallet.isConnected, wallet.address])

  const handleBeastSelect = (beastId: string) => {
    const beast = userBeasts.find(b => b.id === beastId)
    if (!beast) return
    
    const emptySlotIndex = currentTeam.findIndex(slot => slot === null)
    if (emptySlotIndex !== -1 && !selectedBeasts.includes(beast.id)) {
      const newTeam = [...currentTeam]
      newTeam[emptySlotIndex] = beast
      setCurrentTeam(newTeam)
      setSelectedBeasts([...selectedBeasts, beast.id])
    }
  }

  const handleLevelUp = (beastId: string) => {
    setLevelUpBeast(beastId)
  }

  const handleConfirmLevelUp = async (beastId: string, newStats: { health: number; stamina: number; power: number }) => {
    try {
      const response = await fetch('/api/beasts/level-up', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ beastId, newStats })
      })
      
      if (response.ok) {
        const { beast, shouldLearnMove } = await response.json()
        
        // Update local state
        setUserBeasts(prev => prev.map(b => b.id === beastId ? { ...b, ...beast } : b))
        
        if (shouldLearnMove) {
          setLearnMoveBeast(beastId)
        }
      }
    } catch (error) {
      console.error('Error leveling up beast:', error)
    }
    
    setLevelUpBeast(null)
  }

  const handleLearnMove = async (beastId: string, moveId: string, slotIndex: number) => {
    try {
      const response = await fetch('/api/beasts/learn-move', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ beastId, moveId, slotIndex })
      })
      
      if (response.ok) {
        // Refresh user beasts
        if (userId) {
          const beastsResponse = await fetch(`/api/beasts?userId=${userId}`)
          if (beastsResponse.ok) {
            const beasts = await beastsResponse.json()
            setUserBeasts(beasts)
          }
        }
      }
    } catch (error) {
      console.error('Error learning move:', error)
    }
    
    setLearnMoveBeast(null)
  }

  const handleCloseLearnMove = () => {
    setLearnMoveBeast(null)
  }

  const handleCloseLevelUp = () => {
    setLevelUpBeast(null)
  }

  const handleSlotClick = (index: number) => {
    if (currentTeam[index]) {
      const beastId = currentTeam[index]!.id
      const newTeam = [...currentTeam]
      newTeam[index] = null
      setCurrentTeam(newTeam)
      setSelectedBeasts(selectedBeasts.filter(id => id !== beastId))
    }
  }

  const handleSaveTeam = async () => {
    if (!userId || currentTeam.filter(Boolean).length !== 3) return
    
    try {
      const response = await fetch('/api/teams', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          beast1Id: currentTeam[0]?.id || null,
          beast2Id: currentTeam[1]?.id || null,
          beast3Id: currentTeam[2]?.id || null
        })
      })
      
      if (response.ok) {
        alert('Team saved successfully!')
      }
    } catch (error) {
      console.error('Error saving team:', error)
    }
  }

  return (
    <AppLayout>
      <TeamContainer>
        <TeamHeader>
          <TeamTitle>⚔️ MY TEAM</TeamTitle>
          <TeamSubtitle>Select 3 beasts for battle</TeamSubtitle>
        </TeamHeader>

        <CurrentTeamSection>
          <SectionTitle>CURRENT TEAM</SectionTitle>
          <TeamSlots>
            {currentTeam.map((beast, index) => (
              <TeamSlot 
                key={index} 
                $filled={!!beast}
                onClick={() => handleSlotClick(index)}
              >
                {beast ? (
                  <>
                    
                    {beast.imageUrl ? (
                      <img 
                        src={beast.imageUrl} 
                        alt={beast.name}
                        style={{
                          width: '100px',
                          height: '100px',
                          objectFit: 'cover',
                          border: '2px solid var(--border-primary)',
                          imageRendering: 'pixelated'
                        }}
                      />
                    ) : (
                      <div style={{ height: '70px' }} />
                    )}
                    <div>
                      <BeastName>{beast.name}</BeastName>
                      <BeastLevel>LVL {beast.level}</BeastLevel>
                    </div>
                  </>
                ) : (
                  <>
                    <SlotIcon>➕</SlotIcon>
                    <SlotText>EMPTY SLOT</SlotText>
                  </>
                )}
              </TeamSlot>
            ))}
          </TeamSlots>
          
          <SaveTeamButton 
            $fullWidth 
            disabled={currentTeam.filter(Boolean).length !== 3}
            onClick={handleSaveTeam}
          >
            SAVE TEAM ({currentTeam.filter(Boolean).length}/3)
          </SaveTeamButton>
        </CurrentTeamSection>

        <MyBeastsSection>
          <SectionTitle>MY BEASTS</SectionTitle>
          <BeastGrid>
            {loading ? (
              <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-primary)' }}>Loading beasts...</div>
            ) : !wallet.isConnected ? (
              <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-primary)' }}>
                <h3>🔗 Wallet Connection Required</h3>
                <p>Connect your wallet to view and manage your beasts</p>
              </div>
            ) : userBeasts.length === 0 ? (
              <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-primary)' }}>
                <h3>🐲 No Beasts Found</h3>
                <p>Create your first beast to start building your team!</p>
              </div>
            ) : (
              userBeasts.map((beast) => (
                <BeastCardComponent
                  key={beast.id}
                  beast={beast}
                  selected={selectedBeasts.includes(beast.id)}
                  onSelect={handleBeastSelect}
                  onLevelUp={handleLevelUp}
                />
              ))
            )}
          </BeastGrid>
        </MyBeastsSection>
      </TeamContainer>

      {levelUpBeast && (
        <LevelUpModal
          beastId={levelUpBeast}
          beastName={userBeasts.find(b => b.id === levelUpBeast)?.name || "Unknown Beast"}
          currentLevel={userBeasts.find(b => b.id === levelUpBeast)?.level || 1}
          currentStats={userBeasts.find(b => b.id === levelUpBeast) ? {
            health: userBeasts.find(b => b.id === levelUpBeast)!.health,
            stamina: userBeasts.find(b => b.id === levelUpBeast)!.stamina,
            power: userBeasts.find(b => b.id === levelUpBeast)!.power
          } : { health: 0, stamina: 0, power: 0 }}
          onConfirm={handleConfirmLevelUp}
          onClose={handleCloseLevelUp}
        />
      )}

      {learnMoveBeast && (
        <LearnMoveModal
          beastId={learnMoveBeast}
          beastName={userBeasts.find(b => b.id === learnMoveBeast)?.name || "Unknown Beast"}
          currentLevel={userBeasts.find(b => b.id === learnMoveBeast)?.level || 1}
          currentMoves={userBeasts.find(b => b.id === learnMoveBeast)?.moves || []}
          availableMoves={getAvailableMoves(
            userBeasts.find(b => b.id === learnMoveBeast)?.elementType || 'fire',
            userBeasts.find(b => b.id === learnMoveBeast)?.level || 1
          )}
          onConfirm={handleLearnMove}
          onClose={handleCloseLearnMove}
        />
      )}
    </AppLayout>
  )
}
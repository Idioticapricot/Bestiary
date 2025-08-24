"use client"

import styled from "styled-components"
import { Beast } from '../../types/beast'
import { MoveSlots } from './MoveSlots'

interface BeastCardProps {
  beast: Beast
  onLevelUp?: (beastId: string) => void
  onSelect?: (beastId: string) => void
  selected?: boolean
}

const Card = styled.div<{ $selected?: boolean }>`
  background: var(--light-bg);
  border: 4px solid var(--border-primary);
  box-shadow: 4px 4px 0px 0px var(--border-primary);
  padding: 16px;
  cursor: pointer;
  transition: all 0.1s ease;
  position: relative;
  ${props => props.$selected && `
    background: var(--brutal-yellow);
    transform: translate(2px, 2px);
    box-shadow: 2px 2px 0px 0px var(--border-primary);
  `}
  
  &:hover {
    background: var(--brutal-lime);
    transform: translate(2px, 2px);
    box-shadow: 2px 2px 0px 0px var(--border-primary);
  }
`

const BeastHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
`

const BeastInfo = styled.div`
  flex: 1;
`

const BeastName = styled.h3`
  font-size: 16px;
  font-weight: 900;
  color: var(--text-primary);
  margin: 0 0 4px 0;
  font-family: var(--font-mono);
  text-transform: uppercase;
  letter-spacing: 1px;
`

const BeastTier = styled.div<{ $tier: string }>`
  display: inline-block;
  padding: 2px 8px;
  border: 2px solid var(--border-primary);
  font-size: 10px;
  font-weight: 900;
  color: var(--text-primary);
  font-family: var(--font-mono);
  text-transform: uppercase;
  background: ${props => {
    switch (props.$tier) {
      case 'basic': return 'var(--brutal-lime)'
      case 'advanced': return 'var(--brutal-cyan)'
      case 'legendary': return 'var(--brutal-yellow)'
      default: return 'var(--brutal-lime)'
    }
  }};
`

const LevelSection = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 4px;
`

const LevelDisplay = styled.div`
  background: var(--brutal-violet);
  border: 2px solid var(--border-primary);
  padding: 4px 8px;
  font-size: 14px;
  font-weight: 900;
  color: var(--text-primary);
  font-family: var(--font-mono);
  text-transform: uppercase;
`

const BeastImageContainer = styled.div`
  width: 100%;
  height: 160px;
  border: 4px solid var(--border-primary);
  margin-bottom: 12px;
  box-shadow: 2px 2px 0px 0px var(--border-primary);
  overflow: hidden;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
`

const BeastImage = styled.img`
  max-width: 100%;
  max-height: 100%;
  width: auto;
  height: auto;
  object-fit: contain;
  image-rendering: pixelated;
  image-rendering: -moz-crisp-edges;
  image-rendering: crisp-edges;
`

const BeastImagePlaceholder = styled.div<{ $elementType: string }>`
  width: 100%;
  height: 100%;
  background: ${props => {
    switch (props.$elementType) {
      case 'fire': return 'var(--brutal-red)'
      case 'water': return 'var(--brutal-cyan)'
      case 'earth': return 'var(--brutal-lime)'
      case 'electric': return 'var(--brutal-yellow)'
      default: return 'var(--brutal-pink)'
    }
  }};
  display: flex;
  align-items: center;
  justify-content: center;
`

const ImageText = styled.div`
  font-size: 14px;
  font-weight: 900;
  color: var(--text-primary);
  font-family: var(--font-mono);
  text-transform: uppercase;
  letter-spacing: 1px;
  opacity: 0.8;
`

const EXPBarSection = styled.div`
  margin-bottom: 12px;
`

const EXPBar = styled.div`
  width: 100%;
  height: 12px;
  background: var(--light-bg);
  border: 2px solid var(--border-primary);
  position: relative;
  overflow: hidden;
  margin-bottom: 4px;
`

const EXPFill = styled.div<{ $percentage: number }>`
  height: 100%;
  background: var(--brutal-orange);
  width: ${props => props.$percentage}%;
  transition: width 0.3s ease;
`

const EXPText = styled.div`
  font-size: 8px;
  font-weight: 900;
  color: var(--text-primary);
  font-family: var(--font-mono);
  text-align: center;
`

const ElementType = styled.div<{ $type: string }>`
  position: absolute;
  top: 8px;
  right: 8px;
  width: 24px;
  height: 24px;
  border: 2px solid var(--border-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 900;
  z-index: 10;
  background: ${props => {
    switch (props.$type) {
      case 'fire': return 'var(--brutal-red)'
      case 'water': return 'var(--brutal-cyan)'
      case 'earth': return 'var(--brutal-lime)'
      case 'electric': return 'var(--brutal-yellow)'
      default: return 'var(--brutal-pink)'
    }
  }};
`

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  margin-bottom: 12px;
`

const StatItem = styled.div`
  background: var(--brutal-pink);
  border: 2px solid var(--border-primary);
  padding: 8px 4px;
  text-align: center;
`

const StatLabel = styled.div`
  font-size: 8px;
  font-weight: 900;
  color: var(--text-primary);
  font-family: var(--font-mono);
  text-transform: uppercase;
  margin-bottom: 2px;
`

const StatValue = styled.div`
  font-size: 14px;
  font-weight: 900;
  color: var(--text-primary);
  font-family: var(--font-mono);
`

const LevelUpButton = styled.button`
  width: 100%;
  padding: 8px;
  background: var(--brutal-orange);
  border: 3px solid var(--border-primary);
  color: var(--text-primary);
  font-size: 12px;
  font-weight: 900;
  font-family: var(--font-mono);
  text-transform: uppercase;
  cursor: pointer;
  transition: all 0.1s ease;
  
  &:hover {
    background: var(--brutal-red);
    transform: translate(1px, 1px);
  }
  
  &:disabled {
    background: var(--brutal-red);
    opacity: 0.5;
    cursor: not-allowed;
  }
`

const getElementIcon = (type: string) => {
  switch (type) {
    case 'fire': return '🔥'
    case 'water': return '🌊'
    case 'earth': return '🌍'
    case 'electric': return '⚡'
    default: return '❓'
  }
}

export function BeastCard({ beast, onLevelUp, onSelect, selected }: BeastCardProps) {
  const expPercentage = (beast.exp.current / beast.exp.required) * 100
  const canLevelUp = beast.exp.current >= beast.exp.required

  const handleClick = () => {
    if (onSelect) {
      onSelect(beast.id)
    }
  }

  const handleLevelUp = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (onLevelUp && canLevelUp) {
      onLevelUp(beast.id)
    }
  }

  return (
    <Card $selected={selected} onClick={handleClick}>
      <ElementType $type={beast.elementType}>
        {getElementIcon(beast.elementType)}
      </ElementType>
      
      <BeastImageContainer>
        {beast.imageUrl ? (
          <BeastImage 
            src={beast.imageUrl} 
            alt={beast.name}
            onError={(e) => {
              e.currentTarget.style.display = 'none'
              e.currentTarget.nextElementSibling?.setAttribute('style', 'display: flex')
            }}
          />
        ) : null}
        <BeastImagePlaceholder 
          $elementType={beast.elementType}
          style={{ display: beast.imageUrl ? 'none' : 'flex' }}
        >
          <ImageText>BEAST IMAGE</ImageText>
        </BeastImagePlaceholder>
      </BeastImageContainer>
      
      <BeastHeader>
        <BeastInfo>
          <BeastName>{beast.name}</BeastName>
          <BeastTier $tier={beast.tier}>{beast.tier}</BeastTier>
        </BeastInfo>
        
        <LevelSection>
          <LevelDisplay>LV {beast.level}</LevelDisplay>
        </LevelSection>
      </BeastHeader>
      
      <EXPBarSection>
        <EXPBar>
          <EXPFill $percentage={expPercentage} />
        </EXPBar>
        <EXPText>{beast.exp.current}/{beast.exp.required}</EXPText>
      </EXPBarSection>

      <StatsGrid>
        <StatItem>
          <StatLabel>HP</StatLabel>
          <StatValue>{beast.stats.health}</StatValue>
        </StatItem>
        <StatItem>
          <StatLabel>STA</StatLabel>
          <StatValue>{beast.stats.stamina}</StatValue>
        </StatItem>
        <StatItem>
          <StatLabel>PWR</StatLabel>
          <StatValue>{beast.stats.power}</StatValue>
        </StatItem>
      </StatsGrid>

      <MoveSlots moves={beast.moves} />

      {canLevelUp && onLevelUp && (
        <LevelUpButton onClick={handleLevelUp}>
          ⬆️ LEVEL UP!
        </LevelUpButton>
      )}
    </Card>
  )
}
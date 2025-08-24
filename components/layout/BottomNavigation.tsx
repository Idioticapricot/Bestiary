"use client"

import styled from "styled-components"
import { usePathname } from "next/navigation"
import Link from "next/link"
import { Users, Calendar, Trophy, User, Swords } from "lucide-react"

const NavContainer = styled.nav`
  position: fixed;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 100%;
  max-width: 600px;
  background: var(--light-bg);
  border-top: 4px solid var(--border-primary);
  border-left: 4px solid var(--border-primary);
  border-right: 4px solid var(--border-primary);
  padding: 12px 0 8px;
  z-index: 100;
  font-family: var(--font-mono);
`

const NavList = styled.div`
  display: flex;
  justify-content: space-around;
  align-items: center;
`

const NavItem = styled(Link)<{ $active: boolean; $isBattle?: boolean }>`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: ${(props) => (props.$isBattle ? "12px 16px" : "8px 12px")};
  border-radius: 0;
  text-decoration: none;
  color: var(--text-primary);
  background: ${(props) => {
    if (props.$isBattle && props.$active) return "var(--brutal-red)"
    if (props.$isBattle) return "var(--brutal-orange)"
    if (props.$active) return "var(--brutal-yellow)"
    return "transparent"
  }};
  border: ${(props) => {
    if (props.$isBattle) return "4px solid var(--border-primary)"
    if (props.$active) return "3px solid var(--border-primary)"
    return "3px solid transparent"
  }};
  box-shadow: ${(props) => {
    if (props.$isBattle && props.$active) return "4px 4px 0px 0px var(--border-primary)"
    if (props.$isBattle) return "3px 3px 0px 0px var(--border-primary)"
    if (props.$active) return "2px 2px 0px 0px var(--border-primary)"
    return "none"
  }};
  transition: all 0.1s ease;
  font-weight: 900;
  text-transform: uppercase;
  transform: ${(props) => (props.$isBattle ? "scale(1.1)" : "scale(1)")};
  
  &:hover {
    background: ${(props) => (props.$isBattle ? "var(--brutal-red)" : "var(--brutal-lime)")};
    border: ${(props) => (props.$isBattle ? "4px" : "3px")} solid var(--border-primary);
    box-shadow: ${(props) => (props.$isBattle ? "3px 3px" : "2px 2px")} 0px 0px var(--border-primary);
    transform: ${(props) => (props.$isBattle ? "scale(1.1) translate(1px, 1px)" : "translate(1px, 1px)")};
  }
`

const NavIcon = styled.div`
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
`

const NavLabel = styled.span`
  font-size: 10px;
  font-weight: 900;
  font-family: var(--font-mono);
  letter-spacing: 0.5px;
`

const navItems = [
  { href: "/team", icon: Users, label: "Team" },
  { href: "/create", icon: Calendar, label: "Create" },
  { href: "/battle", icon: Swords, label: "Battle", isBattle: true },
  { href: "/marketplace", icon: Trophy, label: "Market" },
  { href: "/profile", icon: User, label: "Profile" },
]

export function BottomNavigation() {
  const pathname = usePathname()

  return (
    <NavContainer>
      <NavList>
        {navItems.map(({ href, icon: Icon, label, isBattle }) => (
          <NavItem key={href} href={href} $active={pathname === href} $isBattle={isBattle}>
            <NavIcon>
              <Icon size={isBattle ? 24 : 20} />
            </NavIcon>
            <NavLabel>{label}</NavLabel>
          </NavItem>
        ))}
      </NavList>
    </NavContainer>
  )
}

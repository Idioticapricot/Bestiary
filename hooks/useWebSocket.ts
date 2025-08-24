"use client"

import { useEffect, useRef, useState } from "react"

interface WebSocketMessage {
  type: string
  data: any
}

export function useWebSocket(url: string) {
  const [isConnected, setIsConnected] = useState(false)
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null)
  const ws = useRef<WebSocket | null>(null)

  useEffect(() => {
    const connect = () => {
      ws.current = new WebSocket(url)

      ws.current.onopen = () => {
        setIsConnected(true)
      }

      ws.current.onmessage = (event) => {
        const message = JSON.parse(event.data)
        setLastMessage(message)
      }

      ws.current.onclose = () => {
        setIsConnected(false)
        // Reconnect after 3 seconds
        setTimeout(connect, 3000)
      }

      ws.current.onerror = (error) => {
        console.error('WebSocket error:', error)
      }
    }

    connect()

    return () => {
      ws.current?.close()
    }
  }, [url])

  const sendMessage = (message: WebSocketMessage) => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify(message))
    }
  }

  return {
    isConnected,
    lastMessage,
    sendMessage
  }
}
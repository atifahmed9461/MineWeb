'use client'

import { useEffect, useState, useRef } from 'react'
import { motion } from 'framer-motion'
import { io, Socket } from 'socket.io-client'
import axios from 'axios'

// Components
import { ChatPanel } from './chat-panel'
import { ServerPanel } from './server-panel'
import { BotStatusPanel } from './bot-status-panel'
import { MessagePanel } from './message-panel'
import { PlayerList } from './player-list'
import { BotStats } from './bot-stats'

// Types
interface BotStatus {
  connected: boolean
  connecting?: boolean
  username: string | null
  server: string | null
}

interface ChatMessage {
  text: string
  timestamp: string
}

export default function Dashboard() {
  const [socket, setSocket] = useState<Socket | null>(null)
  const [botStatus, setBotStatus] = useState<BotStatus>({
    connected: false,
    connecting: false,
    username: null,
    server: null
  })
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [error, setError] = useState<string | null>(null)

  // Initialize socket connection
  useEffect(() => {
    const SOCKET_URL = process.env.SOCKET_URL || 'http://localhost:3001'
    const newSocket = io(SOCKET_URL)
    
    setSocket(newSocket)
    
    // Clean up on unmount
    return () => {
      newSocket.disconnect()
    }
  }, [])
  
  // Set up socket event listeners
  useEffect(() => {
    if (!socket) return
    
    // Bot status update
    socket.on('botStatus', (status: BotStatus) => {
      setBotStatus(status)
      
      if (status.connected) {
        setError(null)
      }
    })
    
    // Chat messages
    socket.on('chatMessage', (message: ChatMessage) => {
      setMessages(prev => [...prev, message])
    })
    
    // Chat history
    socket.on('chatHistory', (history: ChatMessage[]) => {
      setMessages(history)
    })
    
    // Handle errors
    socket.on('error', (err: { message: string }) => {
      setError(err.message)
    })
    
    // Clean up listeners on unmount
    return () => {
      socket.off('botStatus')
      socket.off('chatMessage')
      socket.off('chatHistory')
      socket.off('error')
    }
  }, [socket])
  
  // Connect bot to server
  const connectBot = (serverIP: string, serverPort: string, username: string, auth: string = 'offline') => {
    if (!socket) return
    
    setError(null)
    socket.emit('connectBot', { serverIP, serverPort, username, auth })
  }
  
  // Disconnect bot from server
  const disconnectBot = () => {
    if (!socket) return
    
    socket.emit('disconnectBot')
  }
  
  // Send message to Minecraft server
  const sendMessage = (message: string) => {
    if (!socket || !botStatus.connected) {
      setError('Bot is not connected to a server')
      return
    }
    
    socket.emit('sendMessage', { message })
  }
  
  return (
    <div className="space-y-4">
      {error && (
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-red-500 text-white rounded-lg shadow"
        >
          <p>{error}</p>
        </motion.div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left Column */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="lg:col-span-2 space-y-4"
        >
          {/* Message Input at Top */}
          <MessagePanel 
            onSendMessage={sendMessage} 
            isConnected={botStatus.connected}
          />
          
          {/* Chat Panel */}
          <div className="h-[calc(100vh-280px)] min-h-[400px]">
            <ChatPanel messages={messages} />
          </div>
        </motion.div>
        
        {/* Right Column */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-4 lg:h-[calc(100vh-100px)] lg:overflow-y-auto lg:pr-2 fancy-scrollbar"
        >
          <BotStatusPanel status={botStatus} onDisconnect={disconnectBot} />
          {botStatus.connected && socket && <BotStats socket={socket} />}
          {botStatus.connected && socket && <PlayerList socket={socket} />}
          <ServerPanel 
            onConnect={connectBot} 
            isConnected={botStatus.connected}
            isConnecting={botStatus.connecting}
          />
        </motion.div>
      </div>
    </div>
  )
} 
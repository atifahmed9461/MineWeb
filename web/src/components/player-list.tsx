'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import Image from 'next/image'

interface Player {
  username: string
  ping: number
  uuid: string
  isBot: boolean
}

interface PlayerListProps {
  socket: any
}

export function PlayerList({ socket }: PlayerListProps) {
  const [players, setPlayers] = useState<Player[]>([])
  
  useEffect(() => {
    if (!socket) return
    
    // Listen for player list updates
    socket.on('playerList', (playerList: Player[]) => {
      setPlayers(playerList)
    })
    
    // Request initial player list
    socket.emit('requestPlayerList')
    
    // Cleanup
    return () => {
      socket.off('playerList')
    }
  }, [socket])
  
  // Function to get ping bars display
  const getPingBars = (ping: number) => {
    if (ping <= 0) return '●' // Unknown ping
    if (ping <= 50) return '||||' // Excellent
    if (ping <= 150) return '|||' // Good
    if (ping <= 300) return '||' // Medium
    return '|' // Poor
  }
  
  // Function to get ping color
  const getPingColor = (ping: number) => {
    if (ping <= 0) return 'text-gray-500'
    if (ping <= 50) return 'text-green-500'
    if (ping <= 150) return 'text-green-400'
    if (ping <= 300) return 'text-yellow-500'
    return 'text-red-500'
  }
  
  if (players.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 mb-4">
        <h2 className="text-lg font-bold mb-2">Players</h2>
        <p className="text-gray-500 dark:text-gray-400 italic">No players online</p>
      </div>
    )
  }
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 mb-4">
      <h2 className="text-lg font-bold mb-2">Players Online ({players.length})</h2>
      
      <div className="border dark:border-gray-700 rounded-md overflow-hidden">
        {/* Tab header - similar to Minecraft tab list header */}
        <div className="bg-gray-100 dark:bg-gray-700 py-2 px-3 flex justify-between items-center border-b dark:border-gray-600">
          <span className="font-medium">Player</span>
          <span className="font-medium">Ping</span>
        </div>
        
        {/* Player list */}
        <div className="divide-y dark:divide-gray-700">
          {players.map((player) => (
            <motion.div 
              key={player.username}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className={`flex items-center justify-between py-2 px-3 ${
                player.isBot ? 'bg-blue-50 dark:bg-blue-900/20' : ''
              }`}
            >
              <div className="flex items-center">
                <div className="relative w-7 h-7 mr-2">
                  <Image
                    src={`https://mc-heads.net/avatar/${player.username}/100`}
                    alt={player.username}
                    width={28}
                    height={28}
                    className="rounded"
                    priority
                  />
                </div>
                <span className={player.isBot ? 'font-medium text-blue-600 dark:text-blue-400' : ''}>{player.username}</span>
              </div>
              
              <span className={`font-mono text-sm ${getPingColor(player.ping)}`}>
                {player.ping > 0 ? `${player.ping}ms ${getPingBars(player.ping)}` : 'N/A'}
              </span>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  )
} 
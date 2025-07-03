'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'

interface ServerPanelProps {
  onConnect: (serverIP: string, serverPort: string, username: string, auth?: string) => void
  isConnected: boolean
  isConnecting?: boolean
}

export function ServerPanel({ onConnect, isConnected, isConnecting }: ServerPanelProps) {
  const [serverIP, setServerIP] = useState('localhost')
  const [serverPort, setServerPort] = useState('25565')
  const [username, setUsername] = useState('WebBot')
  const [authType, setAuthType] = useState('offline')

  // Initialize with values from environment if available
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Try to get stored values from localStorage
      const storedIP = localStorage.getItem('mc_server_ip')
      const storedPort = localStorage.getItem('mc_server_port')
      const storedUsername = localStorage.getItem('mc_username')
      const storedAuthType = localStorage.getItem('mc_auth_type')
      
      if (storedIP) setServerIP(storedIP)
      if (storedPort) setServerPort(storedPort)
      if (storedUsername) setUsername(storedUsername)
      if (storedAuthType) setAuthType(storedAuthType)
    }
  }, [])

  // Save settings to localStorage
  const saveSettings = () => {
    localStorage.setItem('mc_server_ip', serverIP)
    localStorage.setItem('mc_server_port', serverPort)
    localStorage.setItem('mc_username', username)
    localStorage.setItem('mc_auth_type', authType)
  }

  const handleConnect = (e: React.FormEvent) => {
    e.preventDefault()
    saveSettings()
    onConnect(serverIP, serverPort, username, authType)
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4">
      <h2 className="text-lg font-bold mb-4">Server Connection</h2>
      
      <form onSubmit={handleConnect}>
        <div className="space-y-4">
          <div>
            <label htmlFor="serverIP" className="block text-sm font-medium mb-1">
              Server IP
            </label>
            <input
              id="serverIP"
              type="text"
              value={serverIP}
              onChange={(e) => setServerIP(e.target.value)}
              disabled={isConnected || isConnecting}
              className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
              placeholder="localhost"
              required
            />
          </div>
          
          <div>
            <label htmlFor="serverPort" className="block text-sm font-medium mb-1">
              Server Port
            </label>
            <input
              id="serverPort"
              type="text"
              value={serverPort}
              onChange={(e) => setServerPort(e.target.value)}
              disabled={isConnected || isConnecting}
              className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
              placeholder="25565"
              pattern="[0-9]*"
              required
            />
          </div>
          
          <div>
            <label htmlFor="username" className="block text-sm font-medium mb-1">
              Bot Username
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={isConnected || isConnecting}
              className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
              placeholder="WebBot"
              required
            />
          </div>
          
          <div>
            <label htmlFor="authType" className="block text-sm font-medium mb-1">
              Authentication Type
            </label>
            <select
              id="authType"
              value={authType}
              onChange={(e) => setAuthType(e.target.value)}
              disabled={isConnected || isConnecting}
              className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
            >
              <option value="offline">Offline (Cracked Servers)</option>
              <option value="microsoft">Microsoft (Premium Account)</option>
              <option value="mojang">Mojang (Legacy Account)</option>
            </select>
            {authType !== 'offline' && (
              <p className="text-xs text-amber-500 mt-1">
                Note: For authenticated login, configure BOT_PASSWORD in the .env file
              </p>
            )}
          </div>
          
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={isConnected || isConnecting}
            className={`w-full py-2 px-4 rounded-md text-white font-medium ${
              isConnected
                ? 'bg-gray-500 cursor-not-allowed'
                : isConnecting
                ? 'bg-yellow-500'
                : 'bg-primary-600 hover:bg-primary-700'
            }`}
          >
            {isConnected 
              ? 'Connected' 
              : isConnecting 
              ? 'Connecting...' 
              : 'Connect to Server'}
          </motion.button>
        </div>
      </form>
    </div>
  )
} 
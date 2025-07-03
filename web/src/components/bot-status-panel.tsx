'use client'

import { motion } from 'framer-motion'
import Image from 'next/image'

interface BotStatus {
  connected: boolean
  connecting?: boolean
  username: string | null
  server: string | null
}

interface BotStatusPanelProps {
  status: BotStatus
  onDisconnect: () => void
}

export function BotStatusPanel({ status, onDisconnect }: BotStatusPanelProps) {
  // Format server display to handle undefined values
  const getServerDisplay = () => {
    if (!status.connected) {
      return 'Not connected';
    }
    
    if (!status.server || status.server === 'undefined:undefined' || status.server.includes('undefined')) {
      return status.username ? `${status.username}'s server` : 'Unknown server';
    }
    
    return status.server;
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4">
      <h2 className="text-lg font-bold mb-4">Bot Status</h2>
      
      <div className="flex items-center mb-4">
        <div className="relative w-16 h-16 mr-4">
          {status.username ? (
            <motion.div 
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="relative w-full h-full"
            >
              <Image
                src={`https://mc-heads.net/avatar/${status.username}/100`}
                alt={status.username}
                width={64}
                height={64}
                className="rounded-md"
                priority
              />
              
              {/* Status indicator */}
              <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${
                status.connected 
                  ? 'bg-green-500' 
                  : status.connecting 
                  ? 'bg-yellow-500'
                  : 'bg-red-500'
              }`} />
            </motion.div>
          ) : (
            <div className="w-full h-full bg-gray-200 dark:bg-gray-700 rounded-md flex items-center justify-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-8 h-8 text-gray-400"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z"
                />
              </svg>
            </div>
          )}
        </div>
        
        <div>
          <h3 className="font-medium text-lg">
            {status.username || 'Not Connected'}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {status.connected ? (
              <span className="text-green-500 font-medium">Connected</span>
            ) : status.connecting ? (
              <span className="text-yellow-500 font-medium">Connecting...</span>
            ) : (
              <span className="text-gray-500 dark:text-gray-400">Disconnected</span>
            )}
          </p>
        </div>
      </div>
      
      <div className="space-y-2 mb-4">
        <div className="flex justify-between">
          <span className="text-gray-500 dark:text-gray-400">Server:</span>
          <span className="font-medium">{getServerDisplay()}</span>
        </div>
        
        <div className="flex justify-between">
          <span className="text-gray-500 dark:text-gray-400">Status:</span>
          <span className={`font-medium ${
            status.connected 
              ? 'text-green-500' 
              : status.connecting 
              ? 'text-yellow-500'
              : 'text-red-500'
          }`}>
            {status.connected 
              ? 'Online' 
              : status.connecting 
              ? 'Connecting...' 
              : 'Offline'}
          </span>
        </div>
      </div>
      
      {status.connected && (
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onDisconnect}
          className="w-full py-2 px-4 bg-red-500 hover:bg-red-600 text-white rounded-md font-medium"
        >
          Disconnect
        </motion.button>
      )}
    </div>
  )
} 
'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'

interface MessagePanelProps {
  onSendMessage: (message: string) => void
  isConnected: boolean
}

export function MessagePanel({ onSendMessage, isConnected }: MessagePanelProps) {
  const [message, setMessage] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!message.trim() || !isConnected) return
    
    onSendMessage(message)
    setMessage('')
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4">
      <h2 className="text-lg font-bold mb-4">Send Message</h2>
      
      <form onSubmit={handleSubmit} className="flex items-center space-x-2">
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          disabled={!isConnected}
          className={`flex-1 px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 ${
            !isConnected ? 'cursor-not-allowed opacity-70' : ''
          }`}
          placeholder={isConnected ? 'Type a message...' : 'Connect to a server first...'}
        />
        
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          type="submit"
          disabled={!isConnected}
          className={`px-4 py-2 rounded-md text-white ${
            isConnected 
              ? 'bg-primary-600 hover:bg-primary-700' 
              : 'bg-gray-400 cursor-not-allowed'
          }`}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="w-5 h-5"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5"
            />
          </svg>
        </motion.button>
      </form>
      
      {!isConnected && (
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
          Connect to a Minecraft server to send messages
        </p>
      )}
    </div>
  )
} 
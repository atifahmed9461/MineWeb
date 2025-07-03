'use client'

import { useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface ChatMessage {
  text: string
  timestamp: string
}

interface ChatPanelProps {
  messages: ChatMessage[]
}

export function ChatPanel({ messages }: ChatPanelProps) {
  const chatContainerRef = useRef<HTMLDivElement>(null)
  
  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight
    }
  }, [messages])

  // Format timestamp to readable time
  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp)
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden h-[500px] flex flex-col">
      <div className="p-4 bg-primary-600 dark:bg-primary-700 text-white">
        <h2 className="text-lg font-bold">Minecraft Chat</h2>
      </div>
      <div 
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-2"
      >
        <AnimatePresence initial={false}>
          {messages.length > 0 ? (
            messages.map((message, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className="bg-gray-100 dark:bg-gray-700 rounded p-3"
              >
                <div className="flex justify-between items-start">
                  <span className="text-gray-800 dark:text-white whitespace-pre-wrap break-words">
                    {message.text}
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400 ml-2 shrink-0">
                    {formatTime(message.timestamp)}
                  </span>
                </div>
              </motion.div>
            ))
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-gray-500 dark:text-gray-400">
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-12 h-12 mb-2 opacity-50"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  d="M12 20.25c4.97 0 9-3.694 9-8.25s-4.03-8.25-9-8.25S3 7.444 3 12c0 2.104.859 4.023 2.273 5.48.432.447.74 1.04.586 1.641a4.483 4.483 0 01-.923 1.785A5.969 5.969 0 006 21c1.282 0 2.47-.402 3.445-1.087.81.22 1.668.337 2.555.337z" 
                />
              </svg>
              <p>No messages yet</p>
              <p className="text-sm mt-1">Connect to a server to see chat messages</p>
            </div>
          )}
        </AnimatePresence>
      </div>
      <div className="p-2 bg-gray-100 dark:bg-gray-900 text-xs text-gray-500 dark:text-gray-400 text-center">
        Showing {messages.length} message{messages.length !== 1 ? 's' : ''}
      </div>
    </div>
  )
} 
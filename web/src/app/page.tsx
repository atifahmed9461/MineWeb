'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'

import Dashboard from '@/components/dashboard'
import { ThemeToggle } from '@/components/theme-toggle'

export default function Home() {
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Simulate loading time
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 1000)
    
    return () => clearTimeout(timer)
  }, [])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-gray-900 to-gray-800">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <motion.div 
            animate={{ 
              y: [0, -10, 0],
              rotateZ: [0, 2, 0, -2, 0],
            }}
            transition={{ 
              duration: 2, 
              repeat: Infinity,
              ease: "easeInOut" 
            }}
            className="w-16 h-16 mx-auto mb-4"
          >
            <svg viewBox="0 0 24 24" className="w-full h-full">
              <path
                fill="#5BBB6D"
                d="M4,2H20A2,2 0 0,1 22,4V20A2,2 0 0,1 20,22H4A2,2 0 0,1 2,20V4A2,2 0 0,1 4,2M6,6V10H10V12H8V18H10V16H14V18H16V12H14V10H18V6H14V10H10V6H6Z"
              />
            </svg>
          </motion.div>
          <h1 className="text-2xl font-bold text-white">Loading...</h1>
          <p className="text-gray-400 mt-2">Preparing your Minecraft Bot...</p>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">
        <header className="flex justify-between items-center mb-8">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center"
          >
            <div className="w-10 h-10 mr-3">
              <svg viewBox="0 0 24 24" className="w-full h-full">
                <path
                  fill="currentColor"
                  d="M4,2H20A2,2 0 0,1 22,4V20A2,2 0 0,1 20,22H4A2,2 0 0,1 2,20V4A2,2 0 0,1 4,2M6,6V10H10V12H8V18H10V16H14V18H16V12H14V10H18V6H14V10H10V6H6Z"
                />
              </svg>
            </div>
            <h1 className="text-2xl font-bold">MineWeb</h1>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <ThemeToggle />
          </motion.div>
        </header>
        
        <main>
          <Dashboard />
        </main>
        
        <footer className="mt-16 text-center text-gray-500 text-sm">
          <p> </p>
        </footer>
      </div>
    </div>
  )
} 
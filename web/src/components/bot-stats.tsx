'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'

interface BotStats {
  health: number
  food: number
  position?: { x: number, y: number, z: number }
  experience?: { level: number, points: number, progress: number }
  armor?: number
  gameMode?: string
  isAlive?: boolean
  isSleeping?: boolean
  isOperator?: boolean
}

interface BotStatsProps {
  socket: any
}

interface AdminAction {
  type: 'kick' | 'ban' | 'kill' | 'gamemode' | 'tp'
  label: string
}

interface AdminActionModalProps {
  action: 'kick' | 'ban' | 'kill' | 'gamemode' | 'tp'
  label: string
  onConfirm: (target: string, reason?: string, gameMode?: string) => void
  onCancel: () => void
  players: Array<{ username: string }>
}

function AdminActionModal({ action, label, onConfirm, onCancel, players }: AdminActionModalProps) {
  const [selectedPlayer, setSelectedPlayer] = useState('')
  const [targetPlayer, setTargetPlayer] = useState('')
  const [reason, setReason] = useState('')
  const [selectedGameMode, setSelectedGameMode] = useState('survival')

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-sm w-full mx-4"
      >
        <h3 className="text-lg font-medium mb-4">{label}</h3>
        {action === 'tp' ? (
          <>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Teleport Player
              </label>
              <select
                value={selectedPlayer}
                onChange={(e) => setSelectedPlayer(e.target.value)}
                className="w-full p-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              >
                <option value="">Select player to teleport</option>
                {players.map((player) => (
                  <option key={player.username} value={player.username}>
                    {player.username}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                To Player
              </label>
              <select
                value={targetPlayer}
                onChange={(e) => setTargetPlayer(e.target.value)}
                className="w-full p-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              >
                <option value="">Select destination player</option>
                {players.map((player) => (
                  <option key={player.username} value={player.username}>
                    {player.username}
                  </option>
                ))}
              </select>
            </div>
          </>
        ) : (
          <>
            <select
              value={selectedPlayer}
              onChange={(e) => setSelectedPlayer(e.target.value)}
              className="w-full p-2 mb-4 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            >
              <option value="">Select a player</option>
              {players.map((player) => (
                <option key={player.username} value={player.username}>
                  {player.username}
                </option>
              ))}
            </select>
            {(action === 'kick' || action === 'ban') && (
              <input
                type="text"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Reason (optional)"
                className="w-full p-2 mb-4 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              />
            )}
            {action === 'gamemode' && (
              <select
                value={selectedGameMode}
                onChange={(e) => setSelectedGameMode(e.target.value)}
                className="w-full p-2 mb-4 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              >
                <option value="survival">Survival</option>
                <option value="creative">Creative</option>
                <option value="adventure">Adventure</option>
                <option value="spectator">Spectator</option>
              </select>
            )}
          </>
        )}
        <div className="flex justify-end space-x-2 mt-4">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              if (action === 'tp') {
                onConfirm(selectedPlayer, targetPlayer);
              } else {
                onConfirm(selectedPlayer, reason, action === 'gamemode' ? selectedGameMode : undefined);
              }
            }}
            disabled={!selectedPlayer || (action === 'tp' && !targetPlayer)}
            className={`px-4 py-2 text-sm text-white rounded ${
              (selectedPlayer && (action !== 'tp' || targetPlayer))
                ? 'bg-blue-600 hover:bg-blue-700'
                : 'bg-blue-400 cursor-not-allowed'
            }`}
          >
            Confirm
          </button>
        </div>
      </motion.div>
    </div>
  )
}

export function BotStats({ socket }: BotStatsProps) {
  const [stats, setStats] = useState<BotStats>({
    health: 0,
    food: 0,
    isAlive: false
  })
  const [showModal, setShowModal] = useState(false)
  const [selectedAction, setSelectedAction] = useState<AdminAction | null>(null)
  const [players, setPlayers] = useState<Array<{ username: string }>>([])

  useEffect(() => {
    if (!socket) return
    
    // Listen for bot stats updates
    socket.on('botStats', (botStats: BotStats) => {
      setStats(botStats)
    })
    
    // Listen for player list updates
    socket.on('playerList', (playerList: Array<{ username: string }>) => {
      setPlayers(playerList)
    })
    
    // Request initial stats and player list
    socket.emit('requestStats')
    socket.emit('requestPlayerList')
    
    // Cleanup
    return () => {
      socket.off('botStats')
      socket.off('playerList')
    }
  }, [socket])

  const handleAdminAction = (action: AdminAction) => {
    setSelectedAction(action)
    setShowModal(true)
  }

  const executeAction = (target: string, reason?: string, gameMode?: string) => {
    if (!selectedAction) return

    socket.emit('adminAction', {
      action: selectedAction.type,
      target,
      reason,
      gameMode
    })

    setShowModal(false)
    setSelectedAction(null)
  }

  const handleGameModeChange = (mode: string) => {
    socket.emit('adminAction', {
      action: 'selfGamemode',
      gameMode: mode
    })
  }

  // Helper to get health color
  const getHealthColor = (health: number) => {
    if (health <= 0) return 'bg-gray-500'
    if (health <= 6) return 'bg-red-600'
    if (health <= 10) return 'bg-yellow-500'
    return 'bg-green-500'
  }
  
  // Helper to get food color
  const getFoodColor = (food: number) => {
    if (food <= 0) return 'bg-gray-500'
    if (food <= 6) return 'bg-red-600'
    if (food <= 10) return 'bg-yellow-500'
    return 'bg-green-500'
  }
  
  if (!stats.isAlive && stats.health === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 mb-4">
        <h2 className="text-lg font-bold mb-2">Bot Stats</h2>
        <p className="text-gray-500 dark:text-gray-400 italic">Not spawned yet</p>
      </div>
    )
  }
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 mb-4">
      <h2 className="text-lg font-bold mb-4">Bot Stats</h2>
      
      {/* Health bar */}
      <div className="mb-4">
        <div className="flex justify-between items-center mb-1">
          <span className="font-medium text-sm flex items-center">
            <svg className="w-4 h-4 mr-1 text-red-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
            </svg>
            Health
          </span>
          <span className="font-bold text-sm">{stats.health}/20</span>
        </div>
        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${(stats.health / 20) * 100}%` }}
            transition={{ duration: 0.5 }}
            className={`h-full ${getHealthColor(stats.health)}`}
          />
        </div>
      </div>
      
      {/* Food bar */}
      <div className="mb-4">
        <div className="flex justify-between items-center mb-1">
          <span className="font-medium text-sm flex items-center">
            <svg className="w-4 h-4 mr-1 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
              <path d="M3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" />
              <path fillRule="evenodd" d="M16.553 17.776C14.761 15.984 13.182 16 13 16H3a1 1 0 110-2h10c0 0 1.995-.016 4.207 2.196a.75.75 0 10.891-1.192A1.75 1.75 0 0118 13.75V8.25c0-1.519-.825-2.875-2.28-3.812a.75.75 0 10-.85 1.224A2.75 2.75 0 0116.5 8.25v5.5a.25.25 0 01-.159.232 3.493 3.493 0 00-.771.512 6.5 6.5 0 00-.882.774c-.5.5-1.034 1.282-1.135 1.508a.75.75 0 001 1z" clipRule="evenodd" />
            </svg>
            Hunger
          </span>
          <span className="font-bold text-sm">{stats.food}/20</span>
        </div>
        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${(stats.food / 20) * 100}%` }}
            transition={{ duration: 0.5 }}
            className={`h-full ${getFoodColor(stats.food)}`}
          />
        </div>
      </div>
      
      {/* Experience (if available) */}
      {stats.experience && (
        <div className="mb-4">
          <div className="flex justify-between items-center mb-1">
            <span className="font-medium text-sm flex items-center">
              <svg className="w-4 h-4 mr-1 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Experience
            </span>
            <span className="font-bold text-sm">Level {stats.experience.level}</span>
          </div>
          <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${stats.experience.progress * 100}%` }}
              transition={{ duration: 0.5 }}
              className="h-full bg-green-500"
            />
          </div>
        </div>
      )}
      
      {/* Position (if available) */}
      {stats.position && (
        <div className="mb-4 grid grid-cols-3 gap-2 text-center">
          <div className="bg-gray-100 dark:bg-gray-700 p-2 rounded">
            <div className="text-xs text-gray-500 dark:text-gray-400">X</div>
            <div className="font-mono text-sm">{Math.round(stats.position.x)}</div>
          </div>
          <div className="bg-gray-100 dark:bg-gray-700 p-2 rounded">
            <div className="text-xs text-gray-500 dark:text-gray-400">Y</div>
            <div className="font-mono text-sm">{Math.round(stats.position.y)}</div>
          </div>
          <div className="bg-gray-100 dark:bg-gray-700 p-2 rounded">
            <div className="text-xs text-gray-500 dark:text-gray-400">Z</div>
            <div className="font-mono text-sm">{Math.round(stats.position.z)}</div>
          </div>
        </div>
      )}
      
      {/* Game mode (if available) */}
      {stats.gameMode && (
        <div className="text-sm mb-2">
          <span className="text-gray-500 dark:text-gray-400">Game Mode: </span>
          <span className="font-medium">{stats.gameMode}</span>
        </div>
      )}
      
      {/* Status indicators */}
      <div className="flex flex-wrap gap-2">
        {stats.isAlive && (
          <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 rounded text-xs">
            Alive
          </span>
        )}
        {stats.isSleeping && (
          <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded text-xs">
            Sleeping
          </span>
        )}
        {stats.isOperator && (
          <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 rounded text-xs flex items-center">
            <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1.323l3.954 1.582 1.599-.8a1 1 0 01.894 1.79l-1.233.616 1.738 5.42a1 1 0 01-.285 1.05A3.989 3.989 0 0115 15a3.989 3.989 0 01-2.667-1.019 1 1 0 01-.285-1.05l1.715-5.349L10 6.477 6.237 7.582l1.715 5.349a1 1 0 01-.285 1.05A3.989 3.989 0 015 15a3.989 3.989 0 01-2.667-1.019 1 1 0 01-.285-1.05l1.738-5.42-1.233-.617a1 1 0 01.894-1.788l1.599.799L9 4.323V3a1 1 0 011-1zm-5 8.274l-.818 2.552c.25.112.526.174.818.174.292 0 .569-.062.818-.174L5 10.274zm10 0l-.818 2.552c.25.112.526.174.818.174.292 0 .569-.062.818-.174L15 10.274z" clipRule="evenodd" />
            </svg>
            Operator
          </span>
        )}
      </div>
      
      {/* Admin Actions */}
      {stats.gameMode && (
        <div className="mt-4 space-y-2">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Admin Actions</h3>
          
          {/* Gamemode Buttons */}
          <div className="grid grid-cols-4 gap-2 mb-4">
            <button 
              onClick={() => handleGameModeChange('survival')}
              className={`px-3 py-1 text-xs ${
                stats.gameMode === 'survival' 
                  ? 'bg-green-600 text-white'
                  : 'bg-green-100 hover:bg-green-200 dark:bg-green-900/30 dark:hover:bg-green-800/40 text-green-800 dark:text-green-300'
              } rounded transition-colors`}
            >
              Survival
            </button>
            <button 
              onClick={() => handleGameModeChange('creative')}
              className={`px-3 py-1 text-xs ${
                stats.gameMode === 'creative'
                  ? 'bg-blue-600 text-white'
                  : 'bg-blue-100 hover:bg-blue-200 dark:bg-blue-900/30 dark:hover:bg-blue-800/40 text-blue-800 dark:text-blue-300'
              } rounded transition-colors`}
            >
              Creative
            </button>
            <button 
              onClick={() => handleGameModeChange('adventure')}
              className={`px-3 py-1 text-xs ${
                stats.gameMode === 'adventure'
                  ? 'bg-purple-600 text-white'
                  : 'bg-purple-100 hover:bg-purple-200 dark:bg-purple-900/30 dark:hover:bg-purple-800/40 text-purple-800 dark:text-purple-300'
              } rounded transition-colors`}
            >
              Adventure
            </button>
            <button 
              onClick={() => handleGameModeChange('spectator')}
              className={`px-3 py-1 text-xs ${
                stats.gameMode === 'spectator'
                  ? 'bg-gray-600 text-white'
                  : 'bg-gray-100 hover:bg-gray-200 dark:bg-gray-900/30 dark:hover:bg-gray-800/40 text-gray-800 dark:text-gray-300'
              } rounded transition-colors`}
            >
              Spectator
            </button>
          </div>

          {/* Other Admin Actions */}
          <div className="grid grid-cols-2 gap-2">
            <button 
              onClick={() => handleAdminAction({ type: 'kick', label: 'Kick Player' })}
              className="px-3 py-1 text-sm bg-yellow-100 hover:bg-yellow-200 dark:bg-yellow-900/30 dark:hover:bg-yellow-800/40 text-yellow-800 dark:text-yellow-300 rounded transition-colors"
            >
              Kick Player
            </button>
            <button 
              onClick={() => handleAdminAction({ type: 'ban', label: 'Ban Player' })}
              className="px-3 py-1 text-sm bg-red-100 hover:bg-red-200 dark:bg-red-900/30 dark:hover:bg-red-800/40 text-red-800 dark:text-red-300 rounded transition-colors"
            >
              Ban Player
            </button>
            <button 
              onClick={() => handleAdminAction({ type: 'kill', label: 'Kill Player' })}
              className="px-3 py-1 text-sm bg-purple-100 hover:bg-purple-200 dark:bg-purple-900/30 dark:hover:bg-purple-800/40 text-purple-800 dark:text-purple-300 rounded transition-colors"
            >
              Kill Player
            </button>
            <button 
              onClick={() => handleAdminAction({ type: 'tp', label: 'Teleport Player' })}
              className="px-3 py-1 text-sm bg-indigo-100 hover:bg-indigo-200 dark:bg-indigo-900/30 dark:hover:bg-indigo-800/40 text-indigo-800 dark:text-indigo-300 rounded transition-colors"
            >
              Teleport
            </button>
            <button 
              onClick={() => handleAdminAction({ type: 'gamemode', label: 'Other Gamemode' })}
              className="px-3 py-1 text-sm bg-blue-100 hover:bg-blue-200 dark:bg-blue-900/30 dark:hover:bg-blue-800/40 text-blue-800 dark:text-blue-300 rounded transition-colors col-span-2"
            >
              Other Gamemode
            </button>
          </div>
        </div>
      )}

      {/* Player Selection Modal */}
      {showModal && selectedAction && (
        <AdminActionModal
          action={selectedAction.type}
          label={selectedAction.label}
          onConfirm={executeAction}
          onCancel={() => {
            setShowModal(false)
            setSelectedAction(null)
          }}
          players={players}
        />
      )}
    </div>
  )
} 
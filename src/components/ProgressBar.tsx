import React from 'react'
import { motion } from 'framer-motion'

interface ProgressBarProps {
  value: number
  max?: number
  color?: string
  bgColor?: string
  height?: number
  animated?: boolean
  showLabel?: boolean
  className?: string
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  max = 100,
  color = '#FF6B1A',
  bgColor = '#2A2A30',
  height = 6,
  animated = true,
  showLabel = false,
  className = '',
}) => {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100))

  return (
    <div className={`w-full ${className}`}>
      <div
        className="rounded-full overflow-hidden"
        style={{ height, backgroundColor: bgColor }}
      >
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: color }}
          initial={animated ? { width: 0 } : { width: `${percentage}%` }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />
      </div>
      {showLabel && (
        <div className="mt-1 text-right text-xs text-forge-white/60">
          {Math.round(percentage)}%
        </div>
      )}
    </div>
  )
}

export default ProgressBar

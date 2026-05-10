import React from 'react'
import { motion } from 'framer-motion'
import type { RankTier } from '../types'
import { RANK_DATA } from '../data/ranks'

interface RankBadgeProps {
  tier: RankTier
  size?: 'sm' | 'md' | 'lg' | 'xl'
  showLabel?: boolean
  animated?: boolean
  className?: string
}

const SIZE_MAP = {
  sm: { badge: 'w-8 h-8 text-sm', label: 'text-xs' },
  md: { badge: 'w-12 h-12 text-xl', label: 'text-sm' },
  lg: { badge: 'w-16 h-16 text-2xl', label: 'text-base' },
  xl: { badge: 'w-24 h-24 text-4xl', label: 'text-lg' },
}

export const RankBadge: React.FC<RankBadgeProps> = ({
  tier,
  size = 'md',
  showLabel = false,
  animated = false,
  className = '',
}) => {
  const rank = RANK_DATA[tier]
  const sizes = SIZE_MAP[size]

  const badge = (
    <div className={`flex flex-col items-center gap-1 ${className}`}>
      <div
        className={`${sizes.badge} rounded-full flex items-center justify-center font-bold border-2 relative`}
        style={{
          backgroundColor: rank.bgColor,
          borderColor: rank.color,
          color: rank.color,
          boxShadow: `0 0 12px ${rank.color}40`,
        }}
      >
        <span style={{ filter: `drop-shadow(0 0 4px ${rank.color})` }}>
          {rank.icon}
        </span>
      </div>
      {showLabel && (
        <span className={`${sizes.label} font-semibold`} style={{ color: rank.color }}>
          {rank.label}
        </span>
      )}
    </div>
  )

  if (animated) {
    return (
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 400, damping: 20 }}
        className="animate-rank-flash"
      >
        {badge}
      </motion.div>
    )
  }

  return badge
}

export default RankBadge

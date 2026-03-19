import { getStatusConfig } from '@/lib/utils'
import type { TrialStatus } from '@/types'

interface StatusBadgeProps {
  status: TrialStatus | null | undefined
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  const { label, className } = getStatusConfig(status)
  return (
    <span className={`status-badge ${className}`}>
      {label}
    </span>
  )
}

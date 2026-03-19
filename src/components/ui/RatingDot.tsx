interface RatingDotProps {
  value: number | null | undefined
  size?: 'sm' | 'md' | 'lg'
}

export default function RatingDot({ value, size = 'md' }: RatingDotProps) {
  if (value == null) {
    return <span style={{ color: '#9ca3af', fontSize: '13px' }}>—</span>
  }

  const cls = `rating-dot rating-${Math.min(5, Math.max(1, value))}`
  const sizeStyle =
    size === 'sm' ? { width: 20, height: 20, fontSize: 11 } :
    size === 'lg' ? { width: 30, height: 30, fontSize: 14 } :
    {}

  return (
    <span className={cls} style={sizeStyle}>
      {value}
    </span>
  )
}

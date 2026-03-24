'use client'

interface PrintButtonProps {
  label?: string
  className?: string
}

export default function PrintButton({ label = '印刷 / PDF保存', className = '' }: PrintButtonProps) {
  return (
    <button
      onClick={() => window.print()}
      className={`btn btn-primary btn-sm no-print ${className}`}
    >
      <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <polyline points="6 9 6 2 18 2 18 9" />
        <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
        <rect x="6" y="14" width="12" height="8" />
      </svg>
      {label}
    </button>
  )
}

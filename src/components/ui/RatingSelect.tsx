'use client'

interface RatingSelectProps {
  label: string
  value: number | null
  onChange: (v: number | null) => void
  hint?: string
  reverse?: boolean // reverseの場合は5が「問題あり」
}

export default function RatingSelect({ label, value, onChange, hint, reverse = false }: RatingSelectProps) {
  const options = reverse
    ? [
        { v: 1, label: '1 なし' },
        { v: 2, label: '2 少し' },
        { v: 3, label: '3 やや' },
        { v: 4, label: '4 多い' },
        { v: 5, label: '5 深刻' },
      ]
    : [
        { v: 1, label: '1 不良' },
        { v: 2, label: '2 やや不良' },
        { v: 3, label: '3 普通' },
        { v: 4, label: '4 良好' },
        { v: 5, label: '5 優秀' },
      ]

  return (
    <div>
      <label className="form-label">{label}</label>
      <div className="flex gap-2 flex-wrap">
        {options.map((opt) => {
          const active = value === opt.v
          return (
            <button
              key={opt.v}
              type="button"
              onClick={() => onChange(active ? null : opt.v)}
              className="flex flex-col items-center justify-center rounded-md border transition-all"
              style={{
                width: 52,
                height: 52,
                backgroundColor: active ? (reverse ? getReverseColor(opt.v) : getColor(opt.v)) : '#fff',
                borderColor: active ? (reverse ? getReverseColorBorder(opt.v) : getColorBorder(opt.v)) : '#d1d5db',
                cursor: 'pointer',
                touchAction: 'manipulation',
              }}
            >
              <span
                className="text-lg font-bold leading-none"
                style={{ color: active ? '#111827' : '#6b7280' }}
              >
                {opt.v}
              </span>
            </button>
          )
        })}
        {value != null && (
          <button
            type="button"
            onClick={() => onChange(null)}
            className="flex items-center justify-center text-xs rounded-md border transition-all"
            style={{
              width: 40,
              height: 52,
              backgroundColor: '#f9fafb',
              borderColor: '#e5e7eb',
              color: '#9ca3af',
              cursor: 'pointer',
              touchAction: 'manipulation',
            }}
          >
            クリア
          </button>
        )}
      </div>
      {hint && <p className="form-hint">{hint}</p>}
    </div>
  )
}

function getColor(v: number): string {
  if (v <= 1) return '#fde8f3'
  if (v <= 2) return '#fef0e0'
  if (v <= 3) return '#fef6d0'
  if (v <= 4) return '#eef6e6'
  return '#dff0d3'
}

function getColorBorder(v: number): string {
  if (v <= 1) return '#e8a0cc'
  if (v <= 2) return '#f0c080'
  if (v <= 3) return '#f0d880'
  if (v <= 4) return '#b8dea0'
  return '#a8d890'
}

function getReverseColor(v: number): string {
  if (v <= 1) return '#dff0d3'
  if (v <= 2) return '#eef6e6'
  if (v <= 3) return '#fef6d0'
  if (v <= 4) return '#fef0e0'
  return '#fde8f3'
}

function getReverseColorBorder(v: number): string {
  if (v <= 1) return '#a8d890'
  if (v <= 2) return '#b8dea0'
  if (v <= 3) return '#f0d880'
  if (v <= 4) return '#f0c080'
  return '#e8a0cc'
}

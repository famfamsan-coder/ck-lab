import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import type { TrialStatus, MenuCategory } from '@/types'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '—'
  try {
    const d = new Date(dateStr)
    return d.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).replace(/\//g, '/')
  } catch {
    return '—'
  }
}

export function formatDateTime(dateStr: string | null | undefined): string {
  if (!dateStr) return '—'
  try {
    const d = new Date(dateStr)
    return d.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return '—'
  }
}

export function formatMinutes(minutes: number | null | undefined): string {
  if (minutes == null) return '—'
  if (minutes < 60) return `${minutes}分`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m > 0 ? `${h}時間${m}分` : `${h}時間`
}

export function getStatusConfig(status: TrialStatus | null | undefined): {
  label: string
  className: string
} {
  switch (status) {
    case '採用':
      return { label: '採用', className: 'status-adopted' }
    case '条件付き採用':
      return { label: '条件付き採用', className: 'status-conditional' }
    case '再試作':
      return { label: '再試作', className: 'status-retrial' }
    case '不採用':
      return { label: '不採用', className: 'status-rejected' }
    default:
      return { label: '未評価', className: 'status-pending' }
  }
}

// カテゴリタグはニュートラルなモノトーンで統一（ブランドカラーは使わない）
export function getCategoryColor(_category: MenuCategory | string): string {
  return 'bg-zinc-50 text-zinc-700 border-zinc-300'
}

// カテゴリごとの左ボーダーアクセント色（テーブル・リスト用）
export function getCategoryAccent(category: MenuCategory | string): string {
  const accents: Record<string, string> = {
    '主菜':   '#d1d5db',
    '副菜':   '#d1d5db',
    '汁物':   '#d1d5db',
    'デザート': '#d1d5db',
    'その他': '#d1d5db',
  }
  return accents[category] ?? '#d1d5db'
}

export function getRatingLabel(field: string): string {
  const labels: Record<string, string> = {
    taste: '味',
    appearance: '見た目',
    texture: '食感',
    aroma: '香り',
    wateriness: '水っぽさ',
    discoloration: '変色',
    shape_collapse: '型崩れ',
    serving_ease: '提供しやすさ',
    field_reproducibility: '現場再現性',
    overall: '総合評価',
  }
  return labels[field] ?? field
}

export function calcAverageRating(
  eval_: Record<string, number | null | undefined> | null | undefined,
  fields: string[]
): number | null {
  if (!eval_) return null
  const values = fields
    .map((f) => eval_[f])
    .filter((v): v is number => typeof v === 'number')
  if (values.length === 0) return null
  return Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 10) / 10
}

export function nullToEmpty(v: string | null | undefined): string {
  return v ?? ''
}

export function emptyToNull(v: string | null | undefined): string | null {
  if (!v || v.trim() === '') return null
  return v.trim()
}

export function parseIntOrNull(v: string | null | undefined): number | null {
  if (!v || v.trim() === '') return null
  const n = parseInt(v, 10)
  return isNaN(n) ? null : n
}

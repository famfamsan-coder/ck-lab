import Link from 'next/link'
import AppLayout from '@/components/layout/AppLayout'
import { createClient } from '@/lib/supabase/server'
import { T } from '@/lib/supabase/constants'
import StatusBadge from '@/components/ui/StatusBadge'
import CategoryTag from '@/components/ui/CategoryTag'
import RatingDot from '@/components/ui/RatingDot'
import { formatDate } from '@/lib/utils'
import type { TrialStatus } from '@/types'

export const revalidate = 0

interface PageProps {
  searchParams: Promise<{
    q?: string
    category?: string
    genre?: string
    status?: string
  }>
}

export default async function MenusPage({ searchParams }: PageProps) {
  const params = await searchParams
  const client = await createClient()

  let query = client
    .from(T.MENUS)
    .select(`
      *,
      menu_photos:${T.MENU_PHOTOS} ( id, public_url, is_primary, display_order ),
      trials:${T.TRIALS} (
        id, version, trial_date, status,
        evaluations:${T.EVALUATIONS} ( overall )
      )
    `)
    .order('updated_at', { ascending: false })

  if (params.q) query = query.ilike('name', `%${params.q}%`)
  if (params.category) query = query.eq('category', params.category)
  if (params.genre) query = query.eq('genre', params.genre)

  const { data: menus = [] } = await query

  let filteredMenus = menus ?? []
  if (params.status) {
    filteredMenus = filteredMenus.filter((m) => {
      const trials = (m.trials ?? []) as Array<{ version: number; status: string | null }>
      if (trials.length === 0) return params.status === 'none'
      const latest = [...trials].sort((a, b) => b.version - a.version)[0]
      return latest.status === params.status
    })
  }

  const categories = ['主菜', '副菜', '汁物', 'デザート', 'その他']
  const genres = ['和食', '洋食', '中華', '行事食', 'その他']
  const statuses = ['採用', '条件付き採用', '再試作', '不採用']

  const header = (
    <div className="flex items-center justify-between w-full py-3">
      <div>
        <h1 className="text-base font-semibold" style={{ color: '#111827' }}>メニュー一覧</h1>
        <p className="text-xs mt-0.5" style={{ color: '#9ca3af' }}>{filteredMenus.length}件</p>
      </div>
      <Link href="/menus/new" className="btn btn-primary btn-sm">
        <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path d="M12 5v14M5 12h14" />
        </svg>
        新規登録
      </Link>
    </div>
  )

  return (
    <AppLayout header={header}>
      <div className="fade-in">
        {/* フィルターバー */}
        <form method="get" className="card mb-4">
          <div className="px-4 py-3 flex flex-wrap gap-3 items-end">
            <div className="flex-1 min-w-48">
              <label className="form-label">メニュー名</label>
              <div className="relative">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2" width="14" height="14" fill="none" stroke="#9ca3af" strokeWidth="2" viewBox="0 0 24 24">
                  <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
                </svg>
                <input name="q" defaultValue={params.q ?? ''} placeholder="メニュー名で検索"
                  className="form-input" style={{ paddingLeft: '40px' }} />
              </div>
            </div>
            <div className="w-32">
              <label className="form-label">料理区分</label>
              <select name="category" defaultValue={params.category ?? ''} className="form-select">
                <option value="">すべて</option>
                {categories.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="w-32">
              <label className="form-label">ジャンル</label>
              <select name="genre" defaultValue={params.genre ?? ''} className="form-select">
                <option value="">すべて</option>
                {genres.map((g) => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
            <div className="w-36">
              <label className="form-label">採用可否</label>
              <select name="status" defaultValue={params.status ?? ''} className="form-select">
                <option value="">すべて</option>
                {statuses.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="flex gap-2">
              <button type="submit" className="btn btn-primary btn-sm">絞り込む</button>
              <Link href="/menus" className="btn btn-secondary btn-sm">リセット</Link>
            </div>
          </div>
        </form>

        {/* メニューテーブル */}
        <div className="card">
          {filteredMenus.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">🍱</div>
              <div className="empty-state-text">
                {params.q || params.category || params.genre || params.status
                  ? '条件に一致するメニューがありません'
                  : 'メニューが登録されていません'}
              </div>
              {!params.q && !params.category && !params.genre && !params.status && (
                <Link href="/menus/new" className="btn btn-primary btn-sm mt-2">最初のメニューを登録する</Link>
              )}
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ width: 64 }}>写真</th>
                  <th>メニュー名</th>
                  <th>区分</th>
                  <th>ジャンル</th>
                  <th style={{ textAlign: 'center' }}>試作</th>
                  <th>最新試作日</th>
                  <th style={{ textAlign: 'center' }}>総合</th>
                  <th>採用可否</th>
                  <th style={{ width: 120 }}></th>
                </tr>
              </thead>
              <tbody>
                {filteredMenus.map((menu) => {
                  const trials = (menu.trials ?? []) as Array<{
                    id: string; version: number; trial_date: string
                    status: string | null; evaluations: { overall: number | null } | null
                  }>
                  const photos = (menu.menu_photos ?? []) as Array<{
                    id: string; public_url: string | null; is_primary: boolean; display_order: number
                  }>
                  const sorted = [...trials].sort((a, b) => b.version - a.version)
                  const latest = sorted[0] ?? null
                  const overall = latest?.evaluations?.overall ?? null
                  const primaryPhoto = photos.find(p => p.is_primary) ?? photos.sort((a, b) => a.display_order - b.display_order)[0] ?? null

                  return (
                    <tr key={menu.id}>
                      {/* サムネイル */}
                      <td style={{ padding: '8px 8px' }}>
                        <Link href={`/menus/${menu.id}`}>
                          {primaryPhoto?.public_url ? (
                            <img
                              src={primaryPhoto.public_url}
                              alt={menu.name}
                              className="rounded object-cover flex-shrink-0"
                              style={{ width: 52, height: 52 }}
                            />
                          ) : (
                            <div
                              className="rounded flex items-center justify-center flex-shrink-0"
                              style={{ width: 52, height: 52, backgroundColor: '#f3f4f6', border: '1px solid #e5e7eb' }}
                            >
                              <svg width="20" height="20" fill="none" stroke="#d1d5db" strokeWidth="1.5" viewBox="0 0 24 24">
                                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                                <circle cx="12" cy="13" r="4" />
                              </svg>
                            </div>
                          )}
                        </Link>
                      </td>
                      <td>
                        <Link href={`/menus/${menu.id}`} className="font-semibold text-sm hover:underline" style={{ color: '#111827' }}>
                          {menu.name}
                        </Link>
                        {menu.allergens && menu.allergens.length > 0 && (
                          <div className="text-xs mt-0.5" style={{ color: '#9ca3af' }}>
                            AL: {(menu.allergens as string[]).join(', ')}
                          </div>
                        )}
                      </td>
                      <td><CategoryTag category={menu.category} /></td>
                      <td><span className="text-sm" style={{ color: '#4b5563' }}>{menu.genre}</span></td>
                      <td style={{ textAlign: 'center' }}>
                        <span className="text-sm font-medium" style={{ color: '#374151' }}>
                          {trials.length > 0 ? `${trials.length}回` : <span style={{ color: '#9ca3af' }}>未</span>}
                        </span>
                      </td>
                      <td><span className="text-sm" style={{ color: '#4b5563' }}>{latest ? formatDate(latest.trial_date) : <span style={{ color: '#9ca3af' }}>—</span>}</span></td>
                      <td style={{ textAlign: 'center' }}><RatingDot value={overall} /></td>
                      <td><StatusBadge status={latest?.status as TrialStatus | null} /></td>
                      <td>
                        <div className="flex gap-1 justify-end">
                          <Link href={`/menus/${menu.id}`} className="btn btn-ghost btn-sm text-xs">詳細</Link>
                          <Link href={`/menus/${menu.id}/trials/new`} className="btn btn-secondary btn-sm text-xs">試作登録</Link>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </AppLayout>
  )
}

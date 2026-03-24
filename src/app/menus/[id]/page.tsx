import Link from 'next/link'
import { notFound } from 'next/navigation'
import AppLayout from '@/components/layout/AppLayout'
import { createClient } from '@/lib/supabase/server'
import { T } from '@/lib/supabase/constants'
import StatusBadge from '@/components/ui/StatusBadge'
import CategoryTag from '@/components/ui/CategoryTag'
import RatingDot from '@/components/ui/RatingDot'
import { formatDate, formatMinutes } from '@/lib/utils'
import type { TrialStatus } from '@/types'
import DeleteMenuButton from '@/components/menus/DeleteMenuButton'

export const revalidate = 0

interface PageProps {
  params: Promise<{ id: string }>
}

const QUALITY_FIELDS = [
  { key: 'taste', label: '味' },
  { key: 'appearance', label: '見た目' },
  { key: 'texture', label: '食感' },
  { key: 'aroma', label: '香り' },
]
const ISSUE_FIELDS = [
  { key: 'wateriness', label: '水っぽさ' },
  { key: 'discoloration', label: '変色' },
  { key: 'shape_collapse', label: '型崩れ' },
]
const OPS_FIELDS = [
  { key: 'serving_ease', label: '提供しやすさ' },
  { key: 'field_reproducibility', label: '現場再現性' },
]

export default async function MenuDetailPage({ params }: PageProps) {
  const { id } = await params
  const client = await createClient()

  const { data: menu, error } = await client
    .from(T.MENUS)
    .select(`
      *,
      menu_photos:${T.MENU_PHOTOS} ( * ),
      trials:${T.TRIALS} (
        *,
        evaluations:${T.EVALUATIONS} ( * ),
        trial_photos:${T.TRIAL_PHOTOS} ( * )
      )
    `)
    .eq('id', id)
    .single()

  if (error || !menu) notFound()

  const menuPhotos = (menu.menu_photos ?? []) as Array<{
    id: string; public_url: string | null; caption: string | null; is_primary: boolean; display_order: number
  }>
  const primaryPhoto = menuPhotos.find(p => p.is_primary) ?? menuPhotos.sort((a, b) => a.display_order - b.display_order)[0] ?? null

  const trials = (menu.trials ?? []) as Array<{
    id: string; version: number; trial_date: string; trialist: string
    status: string | null; prep_time: number | null; cook_time: number | null
    cool_time: number | null; freeze_time: number | null; storage_days: number | null
    thaw_method: string | null; reheat_method: string | null
    freeze_notes: string | null; reheat_notes: string | null
    improvements: string | null; next_trial_notes: string | null
    evaluations: {
      taste: number | null; appearance: number | null; texture: number | null; aroma: number | null
      wateriness: number | null; discoloration: number | null; shape_collapse: number | null
      serving_ease: number | null; field_reproducibility: number | null
      overall: number | null; evaluator: string | null; evaluation_notes: string | null
    } | null
    trial_photos: Array<{ id: string; photo_type: string; public_url: string | null; caption: string | null }>
  }>

  const sortedTrials = [...trials].sort((a, b) => b.version - a.version)
  const latestTrial = sortedTrials[0] ?? null

  const header = (
    <div className="flex items-center justify-between w-full py-3">
      <div className="flex items-center gap-3">
        <Link href="/menus" className="btn btn-ghost btn-sm p-1.5">
          <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M19 12H5M12 5l-7 7 7 7" />
          </svg>
        </Link>
        <div>
          <h1 className="text-base font-semibold" style={{ color: '#111827' }}>{menu.name}</h1>
          <div className="flex items-center gap-2 mt-0.5">
            <CategoryTag category={menu.category} />
            <span className="text-xs" style={{ color: '#9ca3af' }}>{menu.genre}</span>
          </div>
        </div>
      </div>
      <div className="flex gap-2">
        <Link href={`/export/menu/${id}`} target="_blank" className="btn btn-secondary btn-sm">
          <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <polyline points="6 9 6 2 18 2 18 9" />
            <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
            <rect x="6" y="14" width="12" height="8" />
          </svg>
          個票出力
        </Link>
        <Link href={`/menus/${id}/edit`} className="btn btn-secondary btn-sm">編集</Link>
        <Link href={`/menus/${id}/trials/new`} className="btn btn-primary btn-sm">
          <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M12 5v14M5 12h14" />
          </svg>
          試作登録
        </Link>
        <DeleteMenuButton menuId={id} menuName={menu.name} />
      </div>
    </div>
  )

  return (
    <AppLayout header={header}>
      <div className="fade-in space-y-5">
        {/* 基本情報 + 代表写真 + 最新結果 */}
        <div className="grid grid-cols-3 gap-5">
          {/* 基本情報 + 代表写真 */}
          <div className="space-y-4">
            {/* 代表写真 */}
            <div className="card overflow-hidden">
              {primaryPhoto?.public_url ? (
                <div className="relative">
                  <img
                    src={primaryPhoto.public_url}
                    alt={menu.name}
                    className="w-full object-cover"
                    style={{ height: 180 }}
                  />
                  {menuPhotos.length > 1 && (
                    <div className="absolute bottom-2 right-2 px-2 py-1 rounded text-xs font-medium"
                      style={{ backgroundColor: 'rgba(0,0,0,0.5)', color: 'white' }}>
                      +{menuPhotos.length - 1}枚
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center"
                  style={{ height: 140, backgroundColor: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                  <svg width="32" height="32" fill="none" stroke="#d1d5db" strokeWidth="1.5" viewBox="0 0 24 24">
                    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                    <circle cx="12" cy="13" r="4" />
                  </svg>
                  <p className="text-xs mt-2" style={{ color: '#9ca3af' }}>写真未登録</p>
                  <Link href={`/menus/${id}/edit`} className="btn btn-ghost btn-sm text-xs mt-1">
                    写真を追加
                  </Link>
                </div>
              )}

              {/* サムネイル一覧（複数枚の場合） */}
              {menuPhotos.length > 1 && (
                <div className="flex gap-1 p-2 overflow-x-auto" style={{ backgroundColor: '#f9fafb' }}>
                  {menuPhotos.map((p) => (
                    <img key={p.id} src={p.public_url ?? ''} alt=""
                      className="rounded flex-shrink-0 object-cover"
                      style={{ width: 40, height: 40, border: p.is_primary ? '2px solid #3d89b8' : '1px solid #e5e7eb' }} />
                  ))}
                </div>
              )}
            </div>

            {/* 基本情報 */}
            <div className="card">
              <div className="card-header"><h2 className="card-title">基本情報</h2></div>
              <div className="card-body space-y-3">
                <InfoRow label="区分"><CategoryTag category={menu.category} /></InfoRow>
                <InfoRow label="ジャンル"><span className="text-sm">{menu.genre}</span></InfoRow>
                {menu.ingredients && (
                  <InfoRow label="食材"><span className="text-sm" style={{ color: '#374151' }}>{menu.ingredients}</span></InfoRow>
                )}
                {menu.allergens && (menu.allergens as string[]).length > 0 && (
                  <InfoRow label="アレルゲン">
                    <div className="flex flex-wrap gap-1">
                      {(menu.allergens as string[]).map((a: string) => (
                        <span key={a} className="inline-flex items-center px-1.5 py-0.5 text-xs rounded border"
                          style={{ backgroundColor: '#fff7ed', color: '#c2410c', borderColor: '#fed7aa' }}>
                          {a}
                        </span>
                      ))}
                    </div>
                  </InfoRow>
                )}
                {menu.memo && (
                  <InfoRow label="メモ"><p className="text-sm" style={{ color: '#374151' }}>{menu.memo}</p></InfoRow>
                )}
                <InfoRow label="試作回数"><span className="text-sm font-semibold">{trials.length}回</span></InfoRow>
                {menu.created_by && (
                  <InfoRow label="登録者"><span className="text-sm" style={{ color: '#4b5563' }}>{menu.created_by}</span></InfoRow>
                )}
              </div>
            </div>
          </div>

          {/* 最新試作結果 */}
          {latestTrial ? (
            <div className="col-span-2 card">
              <div className="card-header">
                <div className="flex items-center gap-3">
                  <h2 className="card-title">最新試作結果</h2>
                  <span className="text-xs px-2 py-0.5 rounded" style={{ backgroundColor: '#f3f4f6', color: '#6b7280' }}>
                    v{latestTrial.version}
                  </span>
                  <span className="text-xs" style={{ color: '#9ca3af' }}>{formatDate(latestTrial.trial_date)}</span>
                </div>
                <StatusBadge status={latestTrial.status as TrialStatus | null} />
              </div>
              <div className="card-body space-y-4">
                {latestTrial.evaluations ? (
                  <>
                    <div>
                      <div className="section-title mb-2">品質評価</div>
                      <div className="rating-grid">
                        {[...QUALITY_FIELDS, { key: 'overall', label: '総合' }].map((f) => (
                          <div key={f.key} className="rating-cell">
                            <div className="rating-cell-label">{f.label}</div>
                            <div className="rating-cell-value">
                              <RatingDot value={latestTrial.evaluations?.[f.key as keyof typeof latestTrial.evaluations] as number | null} size="lg" />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="section-title mb-2">品質問題</div>
                        <div className="rating-grid">
                          {ISSUE_FIELDS.map((f) => (
                            <div key={f.key} className="rating-cell">
                              <div className="rating-cell-label">{f.label}</div>
                              <div className="rating-cell-value">
                                <RatingDot value={latestTrial.evaluations?.[f.key as keyof typeof latestTrial.evaluations] as number | null} size="lg" />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div>
                        <div className="section-title mb-2">運用評価</div>
                        <div className="rating-grid">
                          {OPS_FIELDS.map((f) => (
                            <div key={f.key} className="rating-cell">
                              <div className="rating-cell-label">{f.label}</div>
                              <div className="rating-cell-value">
                                <RatingDot value={latestTrial.evaluations?.[f.key as keyof typeof latestTrial.evaluations] as number | null} size="lg" />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                    {latestTrial.evaluations.evaluation_notes && (
                      <div className="rounded-md p-3 text-sm" style={{ backgroundColor: '#f9fafb', color: '#374151' }}>
                        <div className="text-xs font-semibold mb-1" style={{ color: '#9ca3af' }}>評価コメント</div>
                        {latestTrial.evaluations.evaluation_notes}
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-sm" style={{ color: '#9ca3af' }}>評価データなし</div>
                )}

                {(latestTrial.freeze_notes || latestTrial.reheat_notes) && (
                  <div className="grid grid-cols-2 gap-3">
                    {latestTrial.freeze_notes && (
                      <NoteBox icon="❄️" label="冷凍時の注意点" text={latestTrial.freeze_notes} />
                    )}
                    {latestTrial.reheat_notes && (
                      <NoteBox icon="🔥" label="再加熱時の注意点" text={latestTrial.reheat_notes} />
                    )}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="col-span-2 card flex items-center justify-center">
              <div className="empty-state">
                <div className="empty-state-icon">🧪</div>
                <div className="empty-state-text">試作記録がありません</div>
                <Link href={`/menus/${id}/trials/new`} className="btn btn-primary btn-sm mt-2">最初の試作を登録する</Link>
              </div>
            </div>
          )}
        </div>

        {/* 試作履歴 */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">試作履歴</h2>
            <Link href={`/menus/${id}/trials/new`} className="btn btn-secondary btn-sm text-xs">+ 新規試作</Link>
          </div>
          {sortedTrials.length === 0 ? (
            <div className="empty-state"><div className="empty-state-text">試作記録がありません</div></div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Ver.</th>
                  <th>試作日</th>
                  <th>担当者</th>
                  <th style={{ textAlign: 'center' }}>総合</th>
                  <th>採用可否</th>
                  <th>仕込み</th>
                  <th>調理</th>
                  <th>冷却</th>
                  <th>保管</th>
                  <th>改善点（要約）</th>
                  <th style={{ width: 120 }}></th>
                </tr>
              </thead>
              <tbody>
                {sortedTrials.map((trial) => (
                  <tr key={trial.id}>
                    <td>
                      <span className="inline-flex items-center px-2 py-0.5 text-xs font-semibold rounded"
                        style={{ backgroundColor: '#f3f4f6', color: '#374151' }}>
                        v{trial.version}
                      </span>
                    </td>
                    <td className="text-sm" style={{ color: '#4b5563' }}>{formatDate(trial.trial_date)}</td>
                    <td className="text-sm" style={{ color: '#4b5563' }}>{trial.trialist}</td>
                    <td style={{ textAlign: 'center' }}><RatingDot value={trial.evaluations?.overall} /></td>
                    <td><StatusBadge status={trial.status as TrialStatus | null} /></td>
                    <td className="text-sm" style={{ color: '#6b7280' }}>{formatMinutes(trial.prep_time)}</td>
                    <td className="text-sm" style={{ color: '#6b7280' }}>{formatMinutes(trial.cook_time)}</td>
                    <td className="text-sm" style={{ color: '#6b7280' }}>{formatMinutes(trial.cool_time)}</td>
                    <td className="text-sm" style={{ color: '#6b7280' }}>{trial.storage_days != null ? `${trial.storage_days}日` : '—'}</td>
                    <td>
                      {trial.improvements ? (
                        <span className="text-xs text-truncate block max-w-xs" style={{ color: '#374151' }}>
                          {trial.improvements.slice(0, 40)}{trial.improvements.length > 40 ? '…' : ''}
                        </span>
                      ) : <span style={{ color: '#9ca3af' }} className="text-xs">—</span>}
                    </td>
                    <td>
                      <div className="flex gap-1 justify-end">
                        <Link href={`/menus/${id}/trials/${trial.id}/photos`} className="btn btn-ghost btn-sm text-xs">写真</Link>
                        <Link href={`/menus/${id}/trials/${trial.id}/edit`} className="btn btn-ghost btn-sm text-xs">編集</Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* 申し送り */}
        {latestTrial?.next_trial_notes && (
          <div className="rounded-lg border p-4" style={{ backgroundColor: '#fffbeb', borderColor: '#fde68a' }}>
            <div className="flex items-center gap-2 mb-2">
              <span>📝</span>
              <span className="text-sm font-semibold" style={{ color: '#92400e' }}>
                次回試作への申し送り（v{latestTrial.version}より）
              </span>
            </div>
            <p className="text-sm" style={{ color: '#78350f' }}>{latestTrial.next_trial_notes}</p>
          </div>
        )}
      </div>
    </AppLayout>
  )
}

function InfoRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-3">
      <dt className="text-xs font-medium flex-shrink-0 pt-0.5" style={{ width: 68, color: '#9ca3af' }}>{label}</dt>
      <dd className="flex-1 min-w-0">{children}</dd>
    </div>
  )
}

function NoteBox({ icon, label, text }: { icon: string; label: string; text: string }) {
  return (
    <div className="rounded-md p-3" style={{ backgroundColor: '#f9fafb', border: '1px solid #e5e7eb' }}>
      <div className="flex items-center gap-1.5 mb-1.5">
        <span className="text-sm">{icon}</span>
        <span className="text-xs font-semibold" style={{ color: '#6b7280' }}>{label}</span>
      </div>
      <p className="text-sm" style={{ color: '#374151' }}>{text}</p>
    </div>
  )
}

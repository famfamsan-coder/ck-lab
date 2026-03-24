import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { T } from '@/lib/supabase/constants'
import { formatDate, formatMinutes, getStatusConfig } from '@/lib/utils'
import PrintButton from '@/components/ui/PrintButton'
import type { TrialStatus } from '@/types'

export const revalidate = 0

interface PageProps {
  params: Promise<{ id: string }>
}

// 評価値を ●●●○○ 形式で表示
function RatingDots({ value }: { value: number | null | undefined }) {
  if (value == null) return <span style={{ color: '#9ca3af' }}>—</span>
  const filled = Math.round(value)
  return (
    <span style={{ fontSize: 14, letterSpacing: 1 }}>
      {'●'.repeat(filled)}
      <span style={{ color: '#d1d5db' }}>{'○'.repeat(5 - filled)}</span>
      <span style={{ marginLeft: 4, fontSize: 12, color: '#6b7280', fontWeight: 600 }}>{value}</span>
    </span>
  )
}

function StatusLabel({ status }: { status: TrialStatus | string | null }) {
  const config = getStatusConfig(status as TrialStatus | null)
  const colors: Record<string, { bg: string; color: string; border: string }> = {
    'status-adopted':      { bg: '#f0f9eb', color: '#3d6a20', border: '#b8dea0' },
    'status-conditional':  { bg: '#fef9e6', color: '#7a5000', border: '#f0d880' },
    'status-retrial':      { bg: '#eef6fb', color: '#1d5878', border: '#9ecce6' },
    'status-rejected':     { bg: '#fdf0f8', color: '#8c1a60', border: '#e8a0cc' },
    'status-pending':      { bg: '#f9fafb', color: '#6b7280', border: '#e5e7eb' },
  }
  const c = colors[config.className] ?? colors['status-pending']
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      padding: '2px 8px',
      fontSize: 12,
      fontWeight: 500,
      borderRadius: 4,
      border: `1px solid ${c.border}`,
      backgroundColor: c.bg,
      color: c.color,
    }}>
      {config.label}
    </span>
  )
}

const EVAL_FIELDS = [
  { key: 'taste',                label: '味' },
  { key: 'appearance',           label: '見た目' },
  { key: 'texture',              label: '食感' },
  { key: 'aroma',                label: '香り' },
  { key: 'wateriness',           label: '水っぽさ' },
  { key: 'discoloration',        label: '変色' },
  { key: 'shape_collapse',       label: '型崩れ' },
  { key: 'serving_ease',         label: '提供しやすさ' },
  { key: 'field_reproducibility',label: '現場再現性' },
  { key: 'overall',              label: '総合評価' },
]

export default async function ExportMenuPage({ params }: PageProps) {
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

  const trials = ((menu.trials ?? []) as any[]).sort((a, b) => b.version - a.version)
  const menuPhotos = (menu.menu_photos ?? []) as any[]
  const primaryPhoto = menuPhotos.find((p: any) => p.is_primary) ?? menuPhotos[0] ?? null

  const today = new Date().toLocaleDateString('ja-JP', {
    year: 'numeric', month: 'long', day: 'numeric',
  })

  return (
    <>
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; }
          @page { margin: 15mm 12mm; size: A4; }
          .page-break { page-break-before: always; }
          .avoid-break { page-break-inside: avoid; }
        }
        body { background: #f5f5f7; }
        .export-wrap {
          max-width: 900px;
          margin: 0 auto;
          padding: 32px 24px 60px;
          font-family: -apple-system, BlinkMacSystemFont, 'Hiragino Sans', 'Noto Sans JP', sans-serif;
          color: #111827;
          font-size: 14px;
          line-height: 1.6;
        }
        .section { margin-top: 28px; }
        .section-head {
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: #9ca3af;
          border-bottom: 2px solid #e5e7eb;
          padding-bottom: 6px;
          margin-bottom: 14px;
        }
        table.info-table { width: 100%; border-collapse: collapse; }
        table.info-table th {
          text-align: left;
          font-size: 12px;
          font-weight: 600;
          color: #6b7280;
          padding: 7px 12px 7px 0;
          width: 120px;
          vertical-align: top;
          border-bottom: 1px solid #f3f4f6;
        }
        table.info-table td {
          font-size: 13px;
          color: #111827;
          padding: 7px 0;
          border-bottom: 1px solid #f3f4f6;
        }
        .trial-block {
          background: #ffffff;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          overflow: hidden;
          margin-bottom: 24px;
        }
        .trial-block-head {
          background: #f9fafb;
          border-bottom: 1px solid #e5e7eb;
          padding: 12px 18px;
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .trial-block-body { padding: 18px; }
        .eval-grid {
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          gap: 1px;
          background: #e5e7eb;
          border: 1px solid #e5e7eb;
          border-radius: 6px;
          overflow: hidden;
          margin-bottom: 14px;
        }
        .eval-cell {
          background: white;
          padding: 10px 12px;
        }
        .eval-label { font-size: 10px; font-weight: 600; color: #9ca3af; letter-spacing: 0.03em; margin-bottom: 5px; }
        .note-box {
          background: #f9fafb;
          border: 1px solid #e5e7eb;
          border-radius: 6px;
          padding: 12px 14px;
          font-size: 13px;
          color: #374151;
        }
        .note-box-label { font-size: 11px; font-weight: 600; color: #9ca3af; margin-bottom: 5px; }
      `}</style>

      <div className="export-wrap">
        {/* ツールバー（印刷時非表示） */}
        <div className="no-print" style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
          <Link href={`/menus/${id}`} className="btn btn-secondary btn-sm">
            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M19 12H5M12 5l-7 7 7 7" />
            </svg>
            メニュー詳細に戻る
          </Link>
          <PrintButton label="印刷 / PDF保存" />
          <span style={{ fontSize: 12, color: '#9ca3af' }}>
            PDFで保存する場合は「印刷」→「送信先：PDFに保存」を選択してください
          </span>
        </div>

        {/* ドキュメントヘッダー */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
          <div>
            <div style={{ fontSize: 11, color: '#9ca3af', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 4 }}>
              冷凍試作メニュー管理 — 個票
            </div>
            <h1 style={{ fontSize: 22, fontWeight: 700, margin: '0 0 8px', letterSpacing: '-0.02em' }}>
              {menu.name}
            </h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 12, padding: '2px 8px', border: '1px solid #d1d5db', borderRadius: 4, color: '#374151' }}>
                {menu.category}
              </span>
              <span style={{ fontSize: 12, color: '#6b7280' }}>{menu.genre}</span>
              <span style={{ fontSize: 12, color: '#9ca3af' }}>試作 {trials.length} 回</span>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            {primaryPhoto?.public_url && (
              <img
                src={primaryPhoto.public_url}
                alt={menu.name}
                style={{ width: 100, height: 100, objectFit: 'cover', borderRadius: 8, border: '1px solid #e5e7eb', marginBottom: 6 }}
              />
            )}
            <div style={{ fontSize: 11, color: '#9ca3af' }}>出力日: {today}</div>
          </div>
        </div>

        {/* 基本情報 */}
        <div className="section avoid-break">
          <div className="section-head">基本情報</div>
          <table className="info-table">
            <tbody>
              {menu.ingredients && (
                <tr>
                  <th>食材</th>
                  <td>{menu.ingredients}</td>
                </tr>
              )}
              {(menu.allergens as string[])?.length > 0 && (
                <tr>
                  <th>アレルゲン</th>
                  <td>{(menu.allergens as string[]).join('、')}</td>
                </tr>
              )}
              {menu.created_by && (
                <tr>
                  <th>登録者</th>
                  <td>{menu.created_by}</td>
                </tr>
              )}
              {menu.memo && (
                <tr>
                  <th>メモ</th>
                  <td style={{ whiteSpace: 'pre-wrap' }}>{menu.memo}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* 試作記録 */}
        <div className="section">
          <div className="section-head">試作記録（全 {trials.length} 回）</div>

          {trials.length === 0 ? (
            <p style={{ color: '#9ca3af', fontSize: 13 }}>試作記録がありません</p>
          ) : (
            trials.map((trial: any) => {
              const ev = trial.evaluations
              const trialPhotos = (trial.trial_photos ?? []) as any[]

              return (
                <div key={trial.id} className="trial-block avoid-break">
                  {/* 試作ヘッダー */}
                  <div className="trial-block-head">
                    <span style={{ fontSize: 12, fontWeight: 700, backgroundColor: '#e5e7eb', padding: '2px 8px', borderRadius: 4, color: '#374151' }}>
                      v{trial.version}
                    </span>
                    <span style={{ fontSize: 13, color: '#374151' }}>{formatDate(trial.trial_date)}</span>
                    <span style={{ fontSize: 13, color: '#6b7280' }}>担当: {trial.trialist}</span>
                    <StatusLabel status={trial.status as TrialStatus | null} />
                    {ev?.overall != null && (
                      <span style={{ marginLeft: 'auto', fontSize: 13 }}>
                        総合: <RatingDots value={ev.overall} />
                      </span>
                    )}
                  </div>

                  <div className="trial-block-body">
                    {/* 作業時間 */}
                    {(trial.prep_time || trial.cook_time || trial.cool_time || trial.freeze_time || trial.storage_days) && (
                      <div style={{ marginBottom: 16 }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: '#9ca3af', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 8 }}>
                          作業時間・保管
                        </div>
                        <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
                          {trial.prep_time != null && <TimeItem label="仕込み" value={formatMinutes(trial.prep_time)} />}
                          {trial.cook_time != null && <TimeItem label="調理" value={formatMinutes(trial.cook_time)} />}
                          {trial.cool_time != null && <TimeItem label="冷却" value={formatMinutes(trial.cool_time)} />}
                          {trial.freeze_time != null && <TimeItem label="凍結" value={formatMinutes(trial.freeze_time)} />}
                          {trial.storage_days != null && <TimeItem label="保管" value={`${trial.storage_days}日`} />}
                          {trial.thaw_method && <TimeItem label="解凍方法" value={trial.thaw_method} />}
                          {trial.reheat_method && <TimeItem label="再加熱方法" value={trial.reheat_method} />}
                        </div>
                      </div>
                    )}

                    {/* 評価 */}
                    {ev && (
                      <div style={{ marginBottom: 16 }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: '#9ca3af', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 8 }}>
                          評価（評価者: {ev.evaluator ?? '—'}）
                        </div>
                        <div className="eval-grid">
                          {EVAL_FIELDS.map((f) => (
                            <div key={f.key} className="eval-cell">
                              <div className="eval-label">{f.label}</div>
                              <RatingDots value={ev[f.key]} />
                            </div>
                          ))}
                        </div>
                        {ev.evaluation_notes && (
                          <div className="note-box">
                            <div className="note-box-label">評価コメント</div>
                            <div style={{ whiteSpace: 'pre-wrap' }}>{ev.evaluation_notes}</div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* ノート */}
                    {(trial.freeze_notes || trial.reheat_notes || trial.improvements || trial.next_trial_notes) && (
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                        {trial.freeze_notes && (
                          <div className="note-box">
                            <div className="note-box-label">❄️ 冷凍時の注意点</div>
                            <div style={{ whiteSpace: 'pre-wrap' }}>{trial.freeze_notes}</div>
                          </div>
                        )}
                        {trial.reheat_notes && (
                          <div className="note-box">
                            <div className="note-box-label">🔥 再加熱時の注意点</div>
                            <div style={{ whiteSpace: 'pre-wrap' }}>{trial.reheat_notes}</div>
                          </div>
                        )}
                        {trial.improvements && (
                          <div className="note-box">
                            <div className="note-box-label">改善点</div>
                            <div style={{ whiteSpace: 'pre-wrap' }}>{trial.improvements}</div>
                          </div>
                        )}
                        {trial.next_trial_notes && (
                          <div className="note-box" style={{ background: '#fffbeb', borderColor: '#fde68a' }}>
                            <div className="note-box-label" style={{ color: '#92400e' }}>📝 次回試作への申し送り</div>
                            <div style={{ whiteSpace: 'pre-wrap', color: '#78350f' }}>{trial.next_trial_notes}</div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* 試作写真 */}
                    {trialPhotos.length > 0 && (
                      <div style={{ marginTop: 14 }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: '#9ca3af', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 8 }}>
                          試作写真
                        </div>
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                          {trialPhotos.map((p: any) => (
                            p.public_url && (
                              <div key={p.id} style={{ textAlign: 'center' }}>
                                <img
                                  src={p.public_url}
                                  alt={p.caption ?? p.photo_type}
                                  style={{ width: 110, height: 110, objectFit: 'cover', borderRadius: 6, border: '1px solid #e5e7eb' }}
                                />
                                <div style={{ fontSize: 10, color: '#9ca3af', marginTop: 3 }}>{p.photo_type}</div>
                              </div>
                            )
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* フッター */}
        <div style={{ marginTop: 40, borderTop: '1px solid #e5e7eb', paddingTop: 14, fontSize: 11, color: '#9ca3af', display: 'flex', justifyContent: 'space-between' }}>
          <span>冷凍試作メニュー管理</span>
          <span>出力日: {today}</span>
        </div>
      </div>
    </>
  )
}

function TimeItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div style={{ fontSize: 10, color: '#9ca3af', fontWeight: 600, marginBottom: 2 }}>{label}</div>
      <div style={{ fontSize: 13, fontWeight: 500, color: '#111827' }}>{value}</div>
    </div>
  )
}

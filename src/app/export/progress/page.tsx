import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { T } from '@/lib/supabase/constants'
import { formatDate, getStatusConfig } from '@/lib/utils'
import PrintButton from '@/components/ui/PrintButton'
import type { TrialStatus, MenuCategory } from '@/types'

export const revalidate = 0

function StatusLabel({ status }: { status: TrialStatus | string | null }) {
  const config = getStatusConfig(status as TrialStatus | null)
  const colors: Record<string, { bg: string; color: string; border: string }> = {
    'status-adopted':     { bg: '#f0f9eb', color: '#3d6a20', border: '#b8dea0' },
    'status-conditional': { bg: '#fef9e6', color: '#7a5000', border: '#f0d880' },
    'status-retrial':     { bg: '#eef6fb', color: '#1d5878', border: '#9ecce6' },
    'status-rejected':    { bg: '#fdf0f8', color: '#8c1a60', border: '#e8a0cc' },
    'status-pending':     { bg: '#f9fafb', color: '#6b7280', border: '#e5e7eb' },
  }
  const c = colors[config.className] ?? colors['status-pending']
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', padding: '2px 8px',
      fontSize: 11, fontWeight: 500, borderRadius: 4,
      border: `1px solid ${c.border}`, backgroundColor: c.bg, color: c.color, whiteSpace: 'nowrap',
    }}>
      {config.label}
    </span>
  )
}

function RatingNum({ value }: { value: number | null | undefined }) {
  if (value == null) return <span style={{ color: '#9ca3af' }}>—</span>
  const colors = ['', '#e8a0cc', '#f9c883', '#f2e08a', '#b8dea0', '#7FBF5B']
  const bg = colors[Math.round(value)] ?? '#f3f4f6'
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      width: 22, height: 22, borderRadius: '50%', backgroundColor: bg,
      fontSize: 11, fontWeight: 700, color: '#111827',
    }}>
      {value}
    </span>
  )
}

const CATEGORIES: MenuCategory[] = ['主菜', '副菜', '汁物', 'デザート', 'その他']

export default async function ExportProgressPage() {
  const client = await createClient()

  // テキストフィールドも含めて取得
  const { data: menus = [] } = await client
    .from(T.MENUS)
    .select(`
      id, name, category, genre, allergens, memo,
      trials:${T.TRIALS} (
        id, version, trial_date, status,
        freeze_notes, reheat_notes, improvements, next_trial_notes,
        evaluations:${T.EVALUATIONS} ( overall, evaluation_notes )
      )
    `)
    .order('category', { ascending: true })
    .order('name', { ascending: true })

  const allMenus = menus ?? []

  const stats = { total: allMenus.length, adopted: 0, conditional: 0, re_trial: 0, rejected: 0, no_trial: 0 }
  const categoryCount: Record<string, number> = {}

  type MenuRow = {
    id: string
    name: string
    category: string
    genre: string
    allergens: string[]
    memo: string | null
    trialCount: number
    latestVersion: number | null
    latestDate: string | null
    status: string | null
    overall: number | null
    // 最新試作のテキストフィールド
    freeze_notes: string | null
    reheat_notes: string | null
    improvements: string | null
    next_trial_notes: string | null
    evaluation_notes: string | null
    // 全試作の改善点（過去分も参照できるよう）
    allImprovements: Array<{ version: number; text: string }>
  }

  const rows: MenuRow[] = allMenus.map((menu) => {
    const trials = (menu.trials ?? []) as any[]
    const sorted = [...trials].sort((a, b) => b.version - a.version)
    const latest = sorted[0] ?? null
    const status: string | null = latest?.status ?? null

    if (!latest) stats.no_trial++
    else if (status === '採用') stats.adopted++
    else if (status === '条件付き採用') stats.conditional++
    else if (status === '再試作') stats.re_trial++
    else if (status === '不採用') stats.rejected++

    categoryCount[menu.category] = (categoryCount[menu.category] ?? 0) + 1

    // 全バージョンの改善点をまとめる
    const allImprovements = sorted
      .filter((t: any) => t.improvements)
      .map((t: any) => ({ version: t.version, text: t.improvements }))

    return {
      id: menu.id,
      name: menu.name,
      category: menu.category,
      genre: menu.genre,
      allergens: (menu.allergens as string[]) ?? [],
      memo: (menu as any).memo ?? null,
      trialCount: trials.length,
      latestVersion: latest?.version ?? null,
      latestDate: latest?.trial_date ?? null,
      status,
      overall: latest?.evaluations?.overall ?? null,
      freeze_notes: latest?.freeze_notes ?? null,
      reheat_notes: latest?.reheat_notes ?? null,
      improvements: latest?.improvements ?? null,
      next_trial_notes: latest?.next_trial_notes ?? null,
      evaluation_notes: latest?.evaluations?.evaluation_notes ?? null,
      allImprovements,
    }
  })

  // テキストノートを持つメニューのみ抽出
  const rowsWithNotes = rows.filter(r =>
    r.memo || r.freeze_notes || r.reheat_notes || r.improvements ||
    r.next_trial_notes || r.evaluation_notes || r.allImprovements.length > 0
  )

  const today = new Date().toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric' })
  const trialledCount = stats.total - stats.no_trial
  const adoptionRate = trialledCount > 0 ? Math.round((stats.adopted / trialledCount) * 100) : 0

  const statItems = [
    { label: '総メニュー数', value: stats.total,       color: '#6BAED6' },
    { label: '採用',         value: stats.adopted,     color: '#7FBF5B' },
    { label: '条件付き採用', value: stats.conditional, color: '#F2C94C' },
    { label: '再試作',       value: stats.re_trial,    color: '#6BAED6' },
    { label: '不採用',       value: stats.rejected,    color: '#D85A9A' },
    { label: '未試作',       value: stats.no_trial,    color: '#c8cbd0' },
  ]

  return (
    <>
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; }
          @page { margin: 12mm 10mm; size: A4 landscape; }
          .page-break { page-break-before: always; }
          .avoid-break { page-break-inside: avoid; }
        }
        body { background: #f5f5f7; }
        .export-wrap {
          max-width: 1100px;
          margin: 0 auto;
          padding: 32px 24px 60px;
          font-family: -apple-system, BlinkMacSystemFont, 'Hiragino Sans', 'Noto Sans JP', sans-serif;
          color: #111827;
          font-size: 14px;
          line-height: 1.5;
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
          margin-bottom: 16px;
        }
        table.prog-table { width: 100%; border-collapse: collapse; font-size: 13px; }
        table.prog-table th {
          text-align: left;
          padding: 8px 10px;
          font-size: 10px;
          font-weight: 700;
          color: #9ca3af;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          border-bottom: 2px solid #e5e7eb;
          background: #fafafa;
          white-space: nowrap;
        }
        table.prog-table td {
          padding: 9px 10px;
          border-bottom: 1px solid #f3f4f6;
          vertical-align: top;
        }
        table.prog-table tbody tr:last-child td { border-bottom: none; }
        table.prog-table tbody tr:nth-child(even) td { background: #fafafa; }
        .kpi-grid {
          display: grid;
          grid-template-columns: repeat(6, 1fr);
          gap: 12px;
          margin-bottom: 8px;
        }
        .kpi-card {
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          padding: 16px 18px;
        }
        .kpi-label { font-size: 10px; font-weight: 700; color: #9ca3af; letter-spacing: 0.08em; text-transform: uppercase; margin-bottom: 10px; }
        .kpi-value { font-size: 34px; font-weight: 700; color: #0f1117; letter-spacing: -0.03em; font-variant-numeric: tabular-nums; }
        .stack-bar { height: 6px; border-radius: 3px; overflow: hidden; background: #f0f0f2; display: flex; margin-bottom: 16px; }
        .cat-row { display: flex; align-items: center; gap: 12px; margin-bottom: 10px; }
        .cat-label { font-size: 12px; color: #374151; width: 60px; flex-shrink: 0; }
        .cat-bar-wrap { flex: 1; height: 4px; background: #f0f0f2; border-radius: 2px; overflow: hidden; }
        .cat-bar { height: 100%; background: #6BAED6; border-radius: 2px; }
        .cat-count { font-size: 12px; font-weight: 700; color: #111827; width: 24px; text-align: right; }
        /* メモカード */
        .note-card {
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          overflow: hidden;
          margin-bottom: 16px;
        }
        .note-card-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 10px 16px;
          background: #fafafa;
          border-bottom: 1px solid #e5e7eb;
        }
        .note-card-body {
          padding: 14px 16px;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
        }
        .note-field {
          background: #f9fafb;
          border: 1px solid #e5e7eb;
          border-radius: 6px;
          padding: 10px 12px;
        }
        .note-field-full {
          grid-column: 1 / -1;
        }
        .note-field-label {
          font-size: 10px;
          font-weight: 700;
          color: #9ca3af;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          margin-bottom: 5px;
        }
        .note-field-text {
          font-size: 12px;
          color: #374151;
          line-height: 1.6;
          white-space: pre-wrap;
        }
        .note-field-next {
          background: #fffbeb;
          border-color: #fde68a;
        }
        .note-field-next .note-field-label { color: #92400e; }
        .note-field-next .note-field-text { color: #78350f; }
      `}</style>

      <div className="export-wrap">
        {/* ツールバー */}
        <div className="no-print" style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
          <Link href="/menus" className="btn btn-secondary btn-sm">
            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M19 12H5M12 5l-7 7 7 7" />
            </svg>
            メニュー一覧に戻る
          </Link>
          <PrintButton label="印刷 / PDF保存（横向き推奨）" />
          <span style={{ fontSize: 12, color: '#9ca3af' }}>
            PDFで保存する場合は「印刷」→「送信先：PDFに保存」→「横向き」を選択してください
          </span>
        </div>

        {/* ドキュメントヘッダー */}
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 24 }}>
          <div>
            <div style={{ fontSize: 11, color: '#9ca3af', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 4 }}>
              冷凍試作メニュー管理 — 進捗状況レポート
            </div>
            <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0, letterSpacing: '-0.02em' }}>
              試作進捗状況
            </h1>
          </div>
          <div style={{ textAlign: 'right', fontSize: 12, color: '#6b7280' }}>
            <div>出力日: {today}</div>
            <div style={{ marginTop: 4, color: '#9ca3af' }}>
              試作済み採用率: <strong style={{ color: '#3d6a20' }}>{adoptionRate}%</strong>
            </div>
          </div>
        </div>

        {/* ── サマリー ──────────────────────────────────── */}
        <div className="section avoid-break">
          <div className="section-head">サマリー</div>
          <div className="kpi-grid">
            {statItems.map((item) => (
              <div key={item.label} className="kpi-card" style={{ borderTop: `3px solid ${item.color}` }}>
                <div className="kpi-label">{item.label}</div>
                <div className="kpi-value">{item.value}</div>
              </div>
            ))}
          </div>

          {stats.total > 0 && (
            <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: 8, padding: '16px 20px', marginTop: 12 }}>
              <div style={{ display: 'flex', gap: 32 }}>
                <div style={{ flex: 2 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#9ca3af', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 10 }}>進捗バー</div>
                  <div className="stack-bar">
                    {stats.adopted > 0 && <div style={{ width: `${(stats.adopted / stats.total) * 100}%`, background: '#7FBF5B' }} />}
                    {stats.conditional > 0 && <div style={{ width: `${(stats.conditional / stats.total) * 100}%`, background: '#F2C94C' }} />}
                    {stats.re_trial > 0 && <div style={{ width: `${(stats.re_trial / stats.total) * 100}%`, background: '#6BAED6' }} />}
                    {stats.rejected > 0 && <div style={{ width: `${(stats.rejected / stats.total) * 100}%`, background: '#D85A9A' }} />}
                    {stats.no_trial > 0 && <div style={{ width: `${(stats.no_trial / stats.total) * 100}%`, background: '#e2e3e7' }} />}
                  </div>
                  <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                    {[
                      { label: '採用',         value: stats.adopted,     color: '#7FBF5B' },
                      { label: '条件付き採用', value: stats.conditional, color: '#F2C94C' },
                      { label: '再試作',       value: stats.re_trial,    color: '#6BAED6' },
                      { label: '不採用',       value: stats.rejected,    color: '#D85A9A' },
                      { label: '未試作',       value: stats.no_trial,    color: '#c8cbd0' },
                    ].map((item) => (
                      <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: item.color }} />
                        <span style={{ fontSize: 12, color: '#6b7280' }}>{item.label}</span>
                        <span style={{ fontSize: 12, fontWeight: 700, color: '#111827' }}>
                          {item.value}
                          <span style={{ fontSize: 10, color: '#9ca3af', marginLeft: 2 }}>
                            ({Math.round((item.value / stats.total) * 100)}%)
                          </span>
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#9ca3af', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 10 }}>区分別メニュー数</div>
                  {CATEGORIES.map((cat) => {
                    const count = categoryCount[cat] ?? 0
                    const maxCount = Math.max(...Object.values(categoryCount), 1)
                    return (
                      <div key={cat} className="cat-row">
                        <span className="cat-label">{cat}</span>
                        <div className="cat-bar-wrap">
                          <div className="cat-bar" style={{ width: `${(count / maxCount) * 100}%`, opacity: count === 0 ? 0 : 0.85 }} />
                        </div>
                        <span className="cat-count">{count}</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── メニュー一覧テーブル ─────────────────────── */}
        <div className="section">
          <div className="section-head">メニュー一覧（全 {rows.length} 件）</div>
          <table className="prog-table">
            <thead>
              <tr>
                <th style={{ width: 24 }}>#</th>
                <th>メニュー名</th>
                <th>区分</th>
                <th>ジャンル</th>
                <th style={{ textAlign: 'center' }}>試作</th>
                <th>最新試作日</th>
                <th style={{ textAlign: 'center' }}>総合</th>
                <th>ステータス</th>
                <th>アレルゲン</th>
                <th>メモ（要約）</th>
                <th className="no-print" style={{ width: 60 }}></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, idx) => (
                <tr key={row.id}>
                  <td style={{ fontSize: 11, color: '#9ca3af', textAlign: 'center' }}>{idx + 1}</td>
                  <td style={{ fontWeight: 600, fontSize: 13 }}>{row.name}</td>
                  <td>
                    <span style={{ fontSize: 11, padding: '2px 7px', border: '1px solid #d1d5db', borderRadius: 4, color: '#374151', background: '#f9fafb', whiteSpace: 'nowrap' }}>
                      {row.category}
                    </span>
                  </td>
                  <td style={{ fontSize: 12, color: '#6b7280' }}>{row.genre}</td>
                  <td style={{ textAlign: 'center', fontSize: 13, fontWeight: 600 }}>
                    {row.trialCount > 0 ? `${row.trialCount}回` : <span style={{ color: '#9ca3af' }}>未</span>}
                  </td>
                  <td style={{ fontSize: 12, color: '#6b7280', whiteSpace: 'nowrap' }}>
                    {row.latestDate ? formatDate(row.latestDate) : <span style={{ color: '#9ca3af' }}>—</span>}
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <RatingNum value={row.overall} />
                  </td>
                  <td>
                    <StatusLabel status={row.status as TrialStatus | null} />
                  </td>
                  <td style={{ fontSize: 11, color: '#6b7280' }}>
                    {row.allergens.length > 0 ? row.allergens.join('、') : <span style={{ color: '#d1d5db' }}>なし</span>}
                  </td>
                  {/* メモ要約列 */}
                  <td style={{ fontSize: 11, color: '#374151', maxWidth: 200 }}>
                    {row.memo ? (
                      <span style={{ color: '#374151' }}>
                        {row.memo.length > 50 ? row.memo.slice(0, 50) + '…' : row.memo}
                      </span>
                    ) : row.next_trial_notes ? (
                      <span style={{ color: '#92400e' }}>
                        📝 {row.next_trial_notes.length > 40 ? row.next_trial_notes.slice(0, 40) + '…' : row.next_trial_notes}
                      </span>
                    ) : (
                      <span style={{ color: '#d1d5db' }}>—</span>
                    )}
                  </td>
                  {/* 個票リンク（画面のみ） */}
                  <td className="no-print">
                    <Link
                      href={`/export/menu/${row.id}`}
                      target="_blank"
                      style={{
                        display: 'inline-flex', alignItems: 'center', gap: 4,
                        padding: '3px 8px', fontSize: 11, fontWeight: 500,
                        border: '1px solid #d1d5db', borderRadius: 4,
                        color: '#374151', background: '#f9fafb', textDecoration: 'none',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      個票
                      <svg width="10" height="10" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                        <polyline points="15 3 21 3 21 9" />
                        <line x1="10" y1="14" x2="21" y2="3" />
                      </svg>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* ── メモ・特記事項一覧（印刷時も表示） ─────── */}
        {rowsWithNotes.length > 0 && (
          <div className="section page-break">
            <div className="section-head">
              メモ・特記事項一覧（{rowsWithNotes.length} 件）
            </div>
            <p style={{ fontSize: 11, color: '#9ca3af', marginBottom: 16, marginTop: -8 }}>
              ※ メモ・注意点・改善点・申し送り・評価コメントが記録されているメニューのみ表示
            </p>

            {rowsWithNotes.map((row, idx) => (
              <div key={row.id} className="note-card avoid-break">
                {/* カードヘッダー */}
                <div className="note-card-head">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 11, color: '#9ca3af', fontWeight: 700, width: 20 }}>{idx + 1}</span>
                    <span style={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>{row.name}</span>
                    <span style={{ fontSize: 11, padding: '1px 6px', border: '1px solid #d1d5db', borderRadius: 4, color: '#6b7280', background: 'white' }}>
                      {row.category}
                    </span>
                    {row.latestVersion != null && (
                      <span style={{ fontSize: 11, color: '#9ca3af' }}>
                        最新: v{row.latestVersion}（{formatDate(row.latestDate)}）
                      </span>
                    )}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <StatusLabel status={row.status as TrialStatus | null} />
                    <RatingNum value={row.overall} />
                  </div>
                </div>

                {/* カードボディ */}
                <div className="note-card-body">
                  {/* メニューメモ */}
                  {row.memo && (
                    <div className="note-field note-field-full">
                      <div className="note-field-label">メニューメモ</div>
                      <div className="note-field-text">{row.memo}</div>
                    </div>
                  )}

                  {/* 冷凍・再加熱の注意点 */}
                  {row.freeze_notes && (
                    <div className="note-field">
                      <div className="note-field-label">❄️ 冷凍時の注意点</div>
                      <div className="note-field-text">{row.freeze_notes}</div>
                    </div>
                  )}
                  {row.reheat_notes && (
                    <div className="note-field">
                      <div className="note-field-label">🔥 再加熱時の注意点</div>
                      <div className="note-field-text">{row.reheat_notes}</div>
                    </div>
                  )}

                  {/* 改善点（全バージョン） */}
                  {row.allImprovements.length > 0 && (
                    <div className={`note-field ${row.allImprovements.length === 1 && !row.freeze_notes && !row.reheat_notes ? 'note-field-full' : ''}`}>
                      <div className="note-field-label">改善点</div>
                      {row.allImprovements.map(({ version, text }) => (
                        <div key={version} style={{ marginBottom: row.allImprovements.length > 1 ? 8 : 0 }}>
                          {row.allImprovements.length > 1 && (
                            <span style={{ fontSize: 10, fontWeight: 700, color: '#9ca3af', marginRight: 6 }}>v{version}</span>
                          )}
                          <span className="note-field-text">{text}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* 評価コメント */}
                  {row.evaluation_notes && (
                    <div className="note-field">
                      <div className="note-field-label">評価コメント（v{row.latestVersion}）</div>
                      <div className="note-field-text">{row.evaluation_notes}</div>
                    </div>
                  )}

                  {/* 申し送り */}
                  {row.next_trial_notes && (
                    <div className="note-field note-field-next">
                      <div className="note-field-label">📝 次回試作への申し送り（v{row.latestVersion}より）</div>
                      <div className="note-field-text">{row.next_trial_notes}</div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* フッター */}
        <div style={{ marginTop: 40, borderTop: '1px solid #e5e7eb', paddingTop: 14, fontSize: 11, color: '#9ca3af', display: 'flex', justifyContent: 'space-between' }}>
          <span>冷凍試作メニュー管理</span>
          <span>出力日: {today}</span>
        </div>
      </div>
    </>
  )
}

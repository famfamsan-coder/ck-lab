import Link from 'next/link'
import AppLayout from '@/components/layout/AppLayout'
import { createClient } from '@/lib/supabase/server'
import { fetchDashboardStats, fetchRecentTrials, fetchCategoryStats } from '@/lib/supabase/queries'
import StatusBadge from '@/components/ui/StatusBadge'
import CategoryTag from '@/components/ui/CategoryTag'
import { formatDate } from '@/lib/utils'
import type { TrialStatus } from '@/types'

export const revalidate = 0

export default async function DashboardPage() {
  const client = await createClient()

  let stats = { total_menus: 0, adopted: 0, conditional: 0, re_trial: 0, rejected: 0, no_trial: 0 }
  let recentTrials: Awaited<ReturnType<typeof fetchRecentTrials>> = []
  let categoryStats: Record<string, number> = {}

  try {
    ;[stats, recentTrials, categoryStats] = await Promise.all([
      fetchDashboardStats(client),
      fetchRecentTrials(client, 8),
      fetchCategoryStats(client),
    ])
  } catch (e) {
    console.error('Dashboard fetch error:', e)
  }

  const statCards = [
    { label: '総メニュー数', value: stats.total_menus, accent: '#6BAED6' },
    { label: '採用',         value: stats.adopted,     accent: '#7FBF5B' },
    { label: '条件付き採用', value: stats.conditional,  accent: '#F2C94C' },
    { label: '再試作',       value: stats.re_trial,    accent: '#6BAED6' },
    { label: '不採用',       value: stats.rejected,    accent: '#D85A9A' },
    { label: '未試作',       value: stats.no_trial,    accent: '#c8cbd0' },
  ]

  const categories = ['主菜', '副菜', '汁物', 'デザート', 'その他']
  const maxCatCount = Math.max(...Object.values(categoryStats), 1)

  // ─── ヘッダー ───────────────────────────────────────────
  const header = (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
      <div>
        <div style={{
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: '0.13em',
          textTransform: 'uppercase',
          color: '#9ca3af',
        }}>
          Overview
        </div>
        <h1 style={{
          fontSize: 15,
          fontWeight: 600,
          color: '#111827',
          letterSpacing: '-0.02em',
          margin: '2px 0 0',
        }}>
          ダッシュボード
        </h1>
      </div>

      <Link
        href="/menus/new"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          padding: '8px 15px',
          backgroundColor: '#111827',
          color: '#ffffff',
          borderRadius: 7,
          fontSize: 13,
          fontWeight: 500,
          letterSpacing: '-0.01em',
          textDecoration: 'none',
          border: '1px solid #111827',
          transition: 'background-color 0.15s',
        }}
      >
        <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
          <path d="M12 5v14M5 12h14" />
        </svg>
        新規メニュー登録
      </Link>
    </div>
  )

  // ─── KPI カードスタイル ──────────────────────────────────
  const kpiCard: React.CSSProperties = {
    backgroundColor: '#ffffff',
    border: '1px solid #ebebec',
    borderRadius: 9,
    padding: '18px 20px 22px',
  }

  // ─── コンテンツパネルスタイル ────────────────────────────
  const panel: React.CSSProperties = {
    backgroundColor: '#ffffff',
    border: '1px solid #ebebec',
    borderRadius: 10,
    overflow: 'hidden',
  }

  const panelHeader: React.CSSProperties = {
    padding: '15px 22px 13px',
    borderBottom: '1px solid #f3f3f4',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  }

  const sectionEyebrow: React.CSSProperties = {
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
    color: '#b0b5be',
  }

  const sectionTitle: React.CSSProperties = {
    fontSize: 13,
    fontWeight: 600,
    color: '#111827',
    letterSpacing: '-0.01em',
    marginTop: 2,
  }

  return (
    <AppLayout header={header}>
      <div className="space-y-5 fade-in">

        {/* ── KPI カード ─────────────────────────────────── */}
        <div className="grid grid-cols-3 gap-3 xl:grid-cols-6">
          {statCards.map((card) => (
            <div
              key={card.label}
              style={{
                ...kpiCard,
                borderTop: `3px solid ${card.accent}`,
              }}
            >
              <div style={{
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: '#a0a6b0',
                marginBottom: 14,
              }}>
                {card.label}
              </div>
              <div style={{
                fontSize: 40,
                fontWeight: 700,
                lineHeight: 1,
                color: '#0f1117',
                letterSpacing: '-0.03em',
                fontFeatureSettings: '"tnum"',
              }}>
                {card.value}
              </div>
            </div>
          ))}
        </div>

        {/* ── コンテンツエリア ───────────────────────────── */}
        <div className="grid grid-cols-5 gap-4">

          {/* 最近の試作記録 */}
          <div className="col-span-3" style={panel}>
            <div style={panelHeader}>
              <div>
                <div style={sectionEyebrow}>Recent</div>
                <div style={sectionTitle}>最近の試作記録</div>
              </div>
              <Link
                href="/menus"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  fontSize: 12,
                  color: '#9ca3af',
                  textDecoration: 'none',
                }}
              >
                すべて表示
                <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </Link>
            </div>

            {recentTrials.length === 0 ? (
              /* 空状態 */
              <div style={{
                padding: '60px 24px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center',
              }}>
                <div style={{
                  width: 44,
                  height: 44,
                  borderRadius: 11,
                  backgroundColor: '#f8f8fa',
                  border: '1px solid #e8e9eb',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 18,
                }}>
                  <svg width="19" height="19" fill="none" stroke="#9ca3af" strokeWidth="1.5" viewBox="0 0 24 24">
                    <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
                    <rect x="9" y="3" width="6" height="4" rx="1" />
                    <path d="M9 12h6M9 16h4" />
                  </svg>
                </div>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
                  試作記録はまだありません
                </div>
                <div style={{ fontSize: 12, color: '#9ca3af', lineHeight: 1.8, marginBottom: 24 }}>
                  最初のメニューを登録して<br />冷凍試作の管理を始めましょう
                </div>
                <Link
                  href="/menus/new"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '7px 14px',
                    borderRadius: 7,
                    fontSize: 12,
                    fontWeight: 500,
                    color: '#374151',
                    backgroundColor: '#f8f8fa',
                    border: '1px solid #e5e7eb',
                    textDecoration: 'none',
                  }}
                >
                  <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                  最初のメニューを登録
                </Link>
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    {['メニュー名', '区分', '試作日', '担当', 'Ver.', '状態'].map((h) => (
                      <th
                        key={h}
                        style={{
                          padding: '9px 16px',
                          fontSize: 10,
                          fontWeight: 700,
                          color: '#a0a6b0',
                          letterSpacing: '0.08em',
                          textTransform: 'uppercase',
                          textAlign: 'left',
                          borderBottom: '1px solid #f3f3f4',
                          whiteSpace: 'nowrap',
                          backgroundColor: 'transparent',
                        }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {recentTrials.map((trial, idx) => {
                    const menu = (trial.menus && !Array.isArray(trial.menus))
                      ? (trial.menus as unknown as { id: string; name: string; category: string })
                      : null
                    const isLast = idx === recentTrials.length - 1
                    return (
                      <tr key={trial.id} className="dash-row">
                        <td style={{ padding: '11px 16px', borderBottom: isLast ? 'none' : '1px solid #f8f8fa', verticalAlign: 'middle' }}>
                          {menu ? (
                            <Link
                              href={`/menus/${menu.id}`}
                              style={{ fontSize: 13, fontWeight: 500, color: '#111827', textDecoration: 'none' }}
                              className="hover:underline"
                            >
                              {menu.name}
                            </Link>
                          ) : (
                            <span style={{ fontSize: 13, color: '#9ca3af' }}>—</span>
                          )}
                        </td>
                        <td style={{ padding: '11px 16px', borderBottom: isLast ? 'none' : '1px solid #f8f8fa', verticalAlign: 'middle' }}>
                          {menu && <CategoryTag category={menu.category} />}
                        </td>
                        <td style={{ padding: '11px 16px', fontSize: 12, color: '#6b7280', borderBottom: isLast ? 'none' : '1px solid #f8f8fa', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>
                          {formatDate(trial.trial_date)}
                        </td>
                        <td style={{ padding: '11px 16px', fontSize: 12, color: '#6b7280', borderBottom: isLast ? 'none' : '1px solid #f8f8fa', verticalAlign: 'middle' }}>
                          {trial.trialist}
                        </td>
                        <td style={{ padding: '11px 16px', fontSize: 11, fontWeight: 600, color: '#b0b5be', borderBottom: isLast ? 'none' : '1px solid #f8f8fa', verticalAlign: 'middle', fontFeatureSettings: '"tnum"', whiteSpace: 'nowrap' }}>
                          v{trial.version}
                        </td>
                        <td style={{ padding: '11px 16px', borderBottom: isLast ? 'none' : '1px solid #f8f8fa', verticalAlign: 'middle' }}>
                          <StatusBadge status={trial.status as TrialStatus | null} />
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </div>

          {/* サイドパネル */}
          <div className="col-span-2" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

            {/* 区分別メニュー数 */}
            <div style={panel}>
              <div style={panelHeader}>
                <div>
                  <div style={sectionEyebrow}>By Category</div>
                  <div style={sectionTitle}>区分別メニュー数</div>
                </div>
              </div>
              <div style={{ padding: '16px 22px 20px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
                  {categories.map((cat) => {
                    const count = categoryStats[cat] ?? 0
                    const pct = maxCatCount > 0 ? (count / maxCatCount) * 100 : 0
                    return (
                      <div key={cat}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                          <span style={{ fontSize: 12, fontWeight: 500, color: '#374151' }}>{cat}</span>
                          <span style={{ fontSize: 12, fontWeight: 700, color: '#111827', fontFeatureSettings: '"tnum"' }}>{count}</span>
                        </div>
                        <div style={{ height: 3, backgroundColor: '#f0f0f2', borderRadius: 2, overflow: 'hidden' }}>
                          <div style={{
                            height: '100%',
                            width: `${pct}%`,
                            backgroundColor: '#6BAED6',
                            borderRadius: 2,
                            opacity: count === 0 ? 0 : 0.85,
                            transition: 'width 0.5s ease',
                          }} />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* 試作進捗 */}
            <div style={panel}>
              <div style={panelHeader}>
                <div>
                  <div style={sectionEyebrow}>Progress</div>
                  <div style={sectionTitle}>試作進捗</div>
                </div>
              </div>
              <div style={{ padding: '16px 22px 20px' }}>
                {stats.total_menus > 0 ? (
                  <>
                    {/* スタックバー */}
                    <div style={{
                      display: 'flex',
                      height: 5,
                      borderRadius: 3,
                      overflow: 'hidden',
                      backgroundColor: '#f0f0f2',
                      marginBottom: 18,
                    }}>
                      {stats.adopted > 0 && (
                        <div title={`採用: ${stats.adopted}`}
                          style={{ width: `${(stats.adopted / stats.total_menus) * 100}%`, backgroundColor: '#7FBF5B' }} />
                      )}
                      {stats.conditional > 0 && (
                        <div title={`条件付き採用: ${stats.conditional}`}
                          style={{ width: `${(stats.conditional / stats.total_menus) * 100}%`, backgroundColor: '#F2C94C' }} />
                      )}
                      {stats.re_trial > 0 && (
                        <div title={`再試作: ${stats.re_trial}`}
                          style={{ width: `${(stats.re_trial / stats.total_menus) * 100}%`, backgroundColor: '#6BAED6' }} />
                      )}
                      {stats.rejected > 0 && (
                        <div title={`不採用: ${stats.rejected}`}
                          style={{ width: `${(stats.rejected / stats.total_menus) * 100}%`, backgroundColor: '#D85A9A' }} />
                      )}
                      {stats.no_trial > 0 && (
                        <div title={`未試作: ${stats.no_trial}`}
                          style={{ width: `${(stats.no_trial / stats.total_menus) * 100}%`, backgroundColor: '#e2e3e7' }} />
                      )}
                    </div>

                    {/* 凡例 */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {[
                        { label: '採用',         value: stats.adopted,     color: '#7FBF5B' },
                        { label: '条件付き採用', value: stats.conditional, color: '#F2C94C' },
                        { label: '再試作',       value: stats.re_trial,    color: '#6BAED6' },
                        { label: '不採用',       value: stats.rejected,    color: '#D85A9A' },
                        { label: '未試作',       value: stats.no_trial,    color: '#c8cbd0' },
                      ].map((item) => (
                        <div key={item.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: item.color, flexShrink: 0 }} />
                            <span style={{ fontSize: 12, color: '#6b7280' }}>{item.label}</span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'baseline', gap: 5 }}>
                            <span style={{ fontSize: 12, fontWeight: 600, color: '#111827', fontFeatureSettings: '"tnum"' }}>
                              {item.value}
                            </span>
                            <span style={{ fontSize: 10, color: '#a0a6b0', fontFeatureSettings: '"tnum"' }}>
                              {Math.round((item.value / stats.total_menus) * 100)}%
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div style={{ padding: '16px 0 8px', textAlign: 'center' }}>
                    <div style={{ fontSize: 12, color: '#9ca3af' }}>メニューが未登録です</div>
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>
      </div>
    </AppLayout>
  )
}

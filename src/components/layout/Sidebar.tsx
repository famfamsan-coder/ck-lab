'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const NAV_ITEMS = [
  {
    href: '/dashboard',
    label: 'ダッシュボード',
    icon: (
      <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.6" viewBox="0 0 24 24">
        <rect x="3" y="3" width="7" height="7" rx="1.5" />
        <rect x="14" y="3" width="7" height="7" rx="1.5" />
        <rect x="3" y="14" width="7" height="7" rx="1.5" />
        <rect x="14" y="14" width="7" height="7" rx="1.5" />
      </svg>
    ),
  },
  {
    href: '/menus',
    label: 'メニュー一覧',
    icon: (
      <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.6" viewBox="0 0 24 24">
        <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
        <rect x="9" y="3" width="6" height="4" rx="1" />
        <path d="M9 12h6M9 16h4" />
      </svg>
    ),
  },
  {
    href: '/settings',
    label: '管理設定',
    icon: (
      <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.6" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
      </svg>
    ),
  },
]

export default function Sidebar() {
  const pathname = usePathname()

  function isActive(href: string) {
    if (href === '/dashboard') return pathname === '/dashboard'
    if (href === '/menus') return pathname.startsWith('/menus')
    return pathname === href
  }

  return (
    <aside
      style={{ backgroundColor: '#0c0d10', borderRight: '1px solid rgba(255,255,255,0.04)' }}
      className="fixed left-0 top-0 h-screen w-56 flex flex-col z-40 select-none"
    >
      {/* ロゴ */}
      <div style={{ padding: '22px 20px 18px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 28,
            height: 28,
            borderRadius: 7,
            backgroundColor: 'rgba(107,174,214,0.1)',
            border: '1px solid rgba(107,174,214,0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}>
            <svg width="13" height="13" fill="none" stroke="#6BAED6" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
          </div>
          <div>
            <div style={{ color: '#f1f5f9', fontSize: 13, fontWeight: 600, letterSpacing: '-0.01em', lineHeight: 1.2 }}>
              冷凍試作
            </div>
            <div style={{ color: '#3f4451', fontSize: 11, lineHeight: 1.3, marginTop: 2 }}>
              メニュー管理
            </div>
          </div>
        </div>
      </div>

      {/* 区切り */}
      <div style={{ height: 1, backgroundColor: 'rgba(255,255,255,0.04)', margin: '0 16px 10px' }} />

      {/* ナビゲーション */}
      <nav style={{ flex: 1, padding: '4px 12px', overflowY: 'auto' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {NAV_ITEMS.map((item) => {
            const active = isActive(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '9px 12px',
                  borderRadius: 7,
                  fontSize: 13,
                  fontWeight: active ? 500 : 400,
                  color: active ? '#e8edf3' : '#52596a',
                  backgroundColor: active ? 'rgba(255,255,255,0.06)' : 'transparent',
                  boxShadow: active ? 'inset 2px 0 0 #6BAED6' : 'inset 2px 0 0 transparent',
                  textDecoration: 'none',
                  transition: 'all 0.12s',
                }}
              >
                <span style={{ color: active ? '#6BAED6' : '#3a404d', flexShrink: 0 }}>
                  {item.icon}
                </span>
                <span>{item.label}</span>
              </Link>
            )
          })}
        </div>
      </nav>

      {/* フッター */}
      <div style={{
        padding: '14px 20px 18px',
        borderTop: '1px solid rgba(255,255,255,0.04)',
      }}>
        <div style={{ fontSize: 11, fontWeight: 500, color: '#52596a' }}>Central Kitchen</div>
        <div style={{ fontSize: 10, color: '#3a404d', marginTop: 2 }}>MVP v1.0</div>
      </div>
    </aside>
  )
}

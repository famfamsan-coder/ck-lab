import AppLayout from '@/components/layout/AppLayout'
import { createClient } from '@/lib/supabase/server'
import { T, BUCKET } from '@/lib/supabase/constants'

export const revalidate = 0

export default async function SettingsPage() {
  const client = await createClient()

  // 統計情報取得
  const [menusRes, trialsRes, photosRes] = await Promise.all([
    client.from(T.MENUS).select('id', { count: 'exact', head: true }),
    client.from(T.TRIALS).select('id', { count: 'exact', head: true }),
    client.from(T.TRIAL_PHOTOS).select('id', { count: 'exact', head: true }),
  ])

  const menuCount = menusRes.count ?? 0
  const trialCount = trialsRes.count ?? 0
  const photoCount = photosRes.count ?? 0

  const header = (
    <div className="flex items-center py-3">
      <div>
        <h1 className="text-base font-semibold" style={{ color: '#111827' }}>管理設定</h1>
        <p className="text-xs mt-0.5" style={{ color: '#9ca3af' }}>システム情報・環境設定</p>
      </div>
    </div>
  )

  return (
    <AppLayout header={header}>
      <div className="fade-in space-y-5 max-w-2xl">
        {/* データ概要 */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">データ概要</h2>
          </div>
          <div className="card-body">
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: '登録メニュー数', value: menuCount, unit: '件' },
                { label: '試作記録数', value: trialCount, unit: '件' },
                { label: '登録写真数', value: photoCount, unit: '枚' },
              ].map((item) => (
                <div
                  key={item.label}
                  className="rounded-md p-4 text-center"
                  style={{ backgroundColor: '#f9fafb', border: '1px solid #e5e7eb' }}
                >
                  <div className="text-2xl font-bold" style={{ color: '#111827' }}>
                    {item.value}
                  </div>
                  <div className="text-xs mt-1" style={{ color: '#6b7280' }}>
                    {item.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Supabase設定 */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Supabase 接続情報</h2>
          </div>
          <div className="card-body space-y-3">
            <InfoRow label="URL">
              <code className="text-xs px-2 py-1 rounded" style={{ backgroundColor: '#f3f4f6', color: '#374151' }}>
                {process.env.NEXT_PUBLIC_SUPABASE_URL
                  ? process.env.NEXT_PUBLIC_SUPABASE_URL.replace(/https?:\/\//, '').slice(0, 30) + '...'
                  : '未設定'}
              </code>
            </InfoRow>
            <InfoRow label="ステータス">
              <span className="status-badge status-adopted">接続済み</span>
            </InfoRow>
            <InfoRow label="ストレージ">
              <span className="text-sm" style={{ color: '#374151' }}>
                {BUCKET.TRIAL_PHOTOS} / {BUCKET.MENU_PHOTOS}
              </span>
            </InfoRow>
          </div>
        </div>

        {/* システム情報 */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">システム情報</h2>
          </div>
          <div className="card-body space-y-3">
            <InfoRow label="アプリ名">
              <span className="text-sm">冷凍試作メニュー管理システム</span>
            </InfoRow>
            <InfoRow label="バージョン">
              <span className="text-sm" style={{ color: '#374151' }}>MVP v1.0</span>
            </InfoRow>
            <InfoRow label="フレームワーク">
              <span className="text-sm" style={{ color: '#374151' }}>Next.js 15 / TypeScript</span>
            </InfoRow>
            <InfoRow label="データベース">
              <span className="text-sm" style={{ color: '#374151' }}>PostgreSQL (Supabase)</span>
            </InfoRow>
            <InfoRow label="対応デバイス">
              <span className="text-sm" style={{ color: '#374151' }}>iPad Safari / デスクトップブラウザ</span>
            </InfoRow>
          </div>
        </div>

        {/* Supabase設定手順 */}
        <div
          className="rounded-lg p-5"
          style={{ backgroundColor: '#fffbeb', border: '1px solid #fde68a' }}
        >
          <h3 className="text-sm font-semibold mb-3" style={{ color: '#92400e' }}>
            📋 初期設定チェックリスト
          </h3>
          <ol className="space-y-2 text-sm" style={{ color: '#78350f' }}>
            <li className="flex gap-2">
              <span className="font-bold flex-shrink-0">1.</span>
              <span>Supabaseプロジェクトで <code className="px-1 rounded text-xs" style={{ backgroundColor: '#fef3c7' }}>supabase/schema.sql</code> を実行する</span>
            </li>
            <li className="flex gap-2">
              <span className="font-bold flex-shrink-0">2.</span>
              <span>Storage に <code className="px-1 rounded text-xs" style={{ backgroundColor: '#fef3c7' }}>ck-trial-photos</code> と <code className="px-1 rounded text-xs" style={{ backgroundColor: '#fef3c7' }}>ck-menu-photos</code> バケットを作成（Public: true）</span>
            </li>
            <li className="flex gap-2">
              <span className="font-bold flex-shrink-0">3.</span>
              <span><code className="px-1 rounded text-xs" style={{ backgroundColor: '#fef3c7' }}>.env.local</code> に SUPABASE_URL と SUPABASE_ANON_KEY を設定する</span>
            </li>
            <li className="flex gap-2">
              <span className="font-bold flex-shrink-0">4.</span>
              <span><code className="px-1 rounded text-xs" style={{ backgroundColor: '#fef3c7' }}>npm run dev</code> でアプリを起動する</span>
            </li>
          </ol>
        </div>
      </div>
    </AppLayout>
  )
}

function InfoRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-3 items-center">
      <dt
        className="text-xs font-medium flex-shrink-0"
        style={{ width: 120, color: '#9ca3af' }}
      >
        {label}
      </dt>
      <dd>{children}</dd>
    </div>
  )
}

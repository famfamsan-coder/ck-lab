import Link from 'next/link'
import AppLayout from '@/components/layout/AppLayout'
import MenuForm from '@/components/menus/MenuForm'

export default function NewMenuPage() {
  const header = (
    <div className="flex items-center gap-3 py-3">
      <Link href="/menus" className="btn btn-ghost btn-sm p-1.5">
        <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path d="M19 12H5M12 5l-7 7 7 7" />
        </svg>
      </Link>
      <div>
        <h1 className="text-base font-semibold" style={{ color: '#111827' }}>新規メニュー登録</h1>
        <p className="text-xs mt-0.5" style={{ color: '#9ca3af' }}>試作対象のメニューを登録します</p>
      </div>
    </div>
  )

  return (
    <AppLayout header={header}>
      <div className="fade-in">
        <MenuForm />
      </div>
    </AppLayout>
  )
}

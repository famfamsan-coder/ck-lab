import Link from 'next/link'
import { notFound } from 'next/navigation'
import AppLayout from '@/components/layout/AppLayout'
import { createClient } from '@/lib/supabase/server'
import { T } from '@/lib/supabase/constants'
import TrialForm from '@/components/trials/TrialForm'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function NewTrialPage({ params }: PageProps) {
  const { id } = await params
  const client = await createClient()

  const { data: menu, error } = await client
    .from(T.MENUS)
    .select('id, name, category')
    .eq('id', id)
    .single()

  if (error || !menu) notFound()

  const safeMenu = menu!

  // 次のバージョン番号を取得
  const { data: latestTrial } = await client
    .from(T.TRIALS)
    .select('version')
    .eq('menu_id', id)
    .order('version', { ascending: false })
    .limit(1)
    .single()

  const nextVersion = latestTrial ? latestTrial.version + 1 : 1

  const header = (
    <div className="flex items-center gap-3 py-3">
      <Link href={`/menus/${id}`} className="btn btn-ghost btn-sm p-1.5">
        <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path d="M19 12H5M12 5l-7 7 7 7" />
        </svg>
      </Link>
      <div>
        <h1 className="text-base font-semibold" style={{ color: '#111827' }}>試作記録 登録</h1>
        <p className="text-xs mt-0.5" style={{ color: '#9ca3af' }}>
          {safeMenu.name} — v{nextVersion}
        </p>
      </div>
    </div>
  )

  return (
    <AppLayout header={header}>
      <div className="fade-in">
        <TrialForm
          menuId={id}
          menuName={safeMenu.name}
          nextVersion={nextVersion}
        />
      </div>
    </AppLayout>
  )
}

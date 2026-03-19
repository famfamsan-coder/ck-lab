import Link from 'next/link'
import { notFound } from 'next/navigation'
import AppLayout from '@/components/layout/AppLayout'
import { createClient } from '@/lib/supabase/server'
import { T } from '@/lib/supabase/constants'
import MenuForm from '@/components/menus/MenuForm'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function EditMenuPage({ params }: PageProps) {
  const { id } = await params
  const client = await createClient()

  const [menuRes, photosRes] = await Promise.all([
    client.from(T.MENUS).select('*').eq('id', id).single(),
    client.from(T.MENU_PHOTOS).select('*').eq('menu_id', id).order('display_order'),
  ])

  if (menuRes.error || !menuRes.data) notFound()

  const photos = (photosRes.data ?? []).map(p => ({
    id: p.id,
    public_url: p.public_url,
    caption: p.caption,
    is_primary: p.is_primary,
    storage_path: p.storage_path,
  }))

  const header = (
    <div className="flex items-center gap-3 py-3">
      <Link href={`/menus/${id}`} className="btn btn-ghost btn-sm p-1.5">
        <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path d="M19 12H5M12 5l-7 7 7 7" />
        </svg>
      </Link>
      <div>
        <h1 className="text-base font-semibold" style={{ color: '#111827' }}>メニュー編集</h1>
        <p className="text-xs mt-0.5" style={{ color: '#9ca3af' }}>{menuRes.data.name}</p>
      </div>
    </div>
  )

  return (
    <AppLayout header={header}>
      <div className="fade-in">
        <MenuForm
          initialData={menuRes.data}
          menuId={id}
          initialPhotos={photos}
        />
      </div>
    </AppLayout>
  )
}

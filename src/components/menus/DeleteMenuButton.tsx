'use client'

import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { T } from '@/lib/supabase/constants'

interface Props {
  menuId: string
  menuName: string
}

export default function DeleteMenuButton({ menuId, menuName }: Props) {
  const router = useRouter()

  async function handleDelete() {
    if (!confirm(`「${menuName}」を削除しますか？\n関連する試作記録・評価・写真もすべて削除されます。`)) return
    const client = createClient()
    const { error } = await client.from(T.MENUS).delete().eq('id', menuId)
    if (error) {
      alert('削除に失敗しました: ' + error.message)
      return
    }
    router.push('/menus')
    router.refresh()
  }

  return (
    <button onClick={handleDelete} className="btn btn-danger btn-sm">
      削除
    </button>
  )
}

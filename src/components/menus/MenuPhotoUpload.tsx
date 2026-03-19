'use client'

import { useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { T, BUCKET } from '@/lib/supabase/constants'

interface MenuPhotoUploadProps {
  menuId: string
  existingPhotos: Array<{
    id: string
    public_url: string | null
    caption: string | null
    is_primary: boolean
  }>
  onPhotosChange: (photos: Array<{
    id: string
    public_url: string | null
    caption: string | null
    is_primary: boolean
    storage_path: string
  }>) => void
}

// 新規登録時（menuIdなし）用のコンポーネント
interface MenuPhotoUploadNewProps {
  pendingFiles: File[]
  onFilesChange: (files: File[]) => void
  previewUrls: string[]
}

export function MenuPhotoUploadNew({ pendingFiles, onFilesChange, previewUrls }: MenuPhotoUploadNewProps) {
  const fileRef = useRef<HTMLInputElement>(null)
  const cameraRef = useRef<HTMLInputElement>(null)

  function handleFiles(files: FileList | null) {
    if (!files) return
    const valid = Array.from(files).filter(f => f.type.startsWith('image/') && f.size <= 10 * 1024 * 1024)
    onFilesChange([...pendingFiles, ...valid])
  }

  function removeFile(idx: number) {
    const next = pendingFiles.filter((_, i) => i !== idx)
    onFilesChange(next)
  }

  return (
    <div>
      {/* アップロードボタン */}
      <div className="flex gap-2 mb-3">
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="flex-1 flex items-center justify-center gap-2 rounded-md border py-3 text-sm font-medium transition-all"
          style={{ backgroundColor: '#fff', borderColor: '#d1d5db', color: '#374151', touchAction: 'manipulation', minHeight: 48 }}
        >
          <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
          ファイルから選択
        </button>
        <button
          type="button"
          onClick={() => cameraRef.current?.click()}
          className="flex-1 flex items-center justify-center gap-2 rounded-md border py-3 text-sm font-medium transition-all"
          style={{ backgroundColor: '#f0fdf4', borderColor: '#bbf7d0', color: '#15803d', touchAction: 'manipulation', minHeight: 48 }}
        >
          <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
            <circle cx="12" cy="13" r="4" />
          </svg>
          カメラで撮影
        </button>
      </div>

      <input ref={fileRef} type="file" accept="image/*" multiple className="hidden"
        onChange={e => handleFiles(e.target.files)} />
      <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="hidden"
        onChange={e => handleFiles(e.target.files)} />

      {/* プレビュー */}
      {previewUrls.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {previewUrls.map((url, idx) => (
            <div key={idx} className="relative group rounded overflow-hidden border" style={{ borderColor: '#e5e7eb' }}>
              <img src={url} alt={`写真${idx + 1}`} className="w-full h-24 object-cover" />
              {idx === 0 && (
                <div className="absolute top-1 left-1 px-1.5 py-0.5 text-xs font-medium rounded"
                  style={{ backgroundColor: '#3d89b8', color: 'white' }}>
                  代表
                </div>
              )}
              <button type="button" onClick={() => removeFile(idx)}
                className="absolute top-1 right-1 w-5 h-5 rounded flex items-center justify-center text-white text-xs"
                style={{ backgroundColor: 'rgba(0,0,0,0.6)', touchAction: 'manipulation' }}>
                ✕
              </button>
            </div>
          ))}
        </div>
      )}
      <p className="form-hint mt-2">最初に選んだ写真が代表写真になります。最大10MB/枚</p>
    </div>
  )
}

// 編集時（既存menuId あり）用のコンポーネント
export default function MenuPhotoUpload({ menuId, existingPhotos, onPhotosChange }: MenuPhotoUploadProps) {
  const [photos, setPhotos] = useState(existingPhotos.map(p => ({ ...p, storage_path: '' })))
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)
  const cameraRef = useRef<HTMLInputElement>(null)

  async function handleUpload(file: File) {
    if (!file.type.startsWith('image/')) { setError('画像ファイルを選択してください'); return }
    if (file.size > 10 * 1024 * 1024) { setError('ファイルサイズは10MB以下にしてください'); return }
    setUploading(true)
    setError('')
    const client = createClient()
    try {
      const ext = file.name.split('.').pop() ?? 'jpg'
      const path = `${menuId}/${Date.now()}.${ext}`
      const { error: upErr } = await client.storage.from(BUCKET.MENU_PHOTOS).upload(path, file)
      if (upErr) throw upErr
      const { data: urlData } = client.storage.from(BUCKET.MENU_PHOTOS).getPublicUrl(path)
      const isPrimary = photos.length === 0
      const { data: photo, error: dbErr } = await client
        .from(T.MENU_PHOTOS)
        .insert({ menu_id: menuId, storage_path: path, public_url: urlData.publicUrl, is_primary: isPrimary, display_order: photos.length })
        .select().single()
      if (dbErr) throw dbErr
      const next = [...photos, { ...photo, storage_path: path }]
      setPhotos(next)
      onPhotosChange(next)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'アップロード失敗')
    } finally {
      setUploading(false)
    }
  }

  async function handleDelete(id: string, storagePath: string) {
    if (!confirm('この写真を削除しますか？')) return
    const client = createClient()
    await client.storage.from(BUCKET.MENU_PHOTOS).remove([storagePath])
    await client.from(T.MENU_PHOTOS).delete().eq('id', id)
    const next = photos.filter(p => p.id !== id)
    setPhotos(next)
    onPhotosChange(next)
  }

  async function setPrimary(id: string) {
    const client = createClient()
    await client.from(T.MENU_PHOTOS).update({ is_primary: false }).eq('menu_id', menuId)
    await client.from(T.MENU_PHOTOS).update({ is_primary: true }).eq('id', id)
    const next = photos.map(p => ({ ...p, is_primary: p.id === id }))
    setPhotos(next)
    onPhotosChange(next)
  }

  return (
    <div className="space-y-3">
      {error && (
        <div className="rounded p-2 text-sm" style={{ backgroundColor: '#fef2f2', color: '#b91c1c', border: '1px solid #fecaca' }}>
          {error}
        </div>
      )}

      {/* アップロードボタン */}
      <div className="flex gap-2">
        <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading}
          className="flex-1 flex items-center justify-center gap-2 rounded-md border py-3 text-sm font-medium"
          style={{ backgroundColor: '#fff', borderColor: '#d1d5db', color: '#374151', touchAction: 'manipulation', minHeight: 48 }}>
          <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" />
          </svg>
          {uploading ? 'アップロード中...' : 'ファイルから選択'}
        </button>
        <button type="button" onClick={() => cameraRef.current?.click()} disabled={uploading}
          className="flex-1 flex items-center justify-center gap-2 rounded-md border py-3 text-sm font-medium"
          style={{ backgroundColor: '#f0fdf4', borderColor: '#bbf7d0', color: '#15803d', touchAction: 'manipulation', minHeight: 48 }}>
          <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" /><circle cx="12" cy="13" r="4" />
          </svg>
          カメラで撮影
        </button>
      </div>

      <input ref={fileRef} type="file" accept="image/*" multiple className="hidden"
        onChange={e => { Array.from(e.target.files ?? []).forEach(handleUpload); e.target.value = '' }} />
      <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="hidden"
        onChange={e => { if (e.target.files?.[0]) handleUpload(e.target.files[0]); e.target.value = '' }} />

      {/* 写真グリッド */}
      {photos.length > 0 ? (
        <div className="grid grid-cols-3 gap-2">
          {photos.map((p) => (
            <div key={p.id} className="relative group rounded overflow-hidden border" style={{ borderColor: '#e5e7eb' }}>
              {p.public_url ? (
                <img src={p.public_url} alt="メニュー写真" className="w-full h-28 object-cover" />
              ) : (
                <div className="w-full h-28 flex items-center justify-center" style={{ backgroundColor: '#f3f4f6' }}>
                  <span className="text-xs" style={{ color: '#9ca3af' }}>読込エラー</span>
                </div>
              )}
              {p.is_primary && (
                <div className="absolute top-1 left-1 px-1.5 py-0.5 text-xs font-medium rounded"
                  style={{ backgroundColor: '#3d89b8', color: 'white' }}>代表</div>
              )}
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100">
                {!p.is_primary && (
                  <button type="button" onClick={() => setPrimary(p.id)}
                    className="px-2 py-1 text-xs rounded font-medium"
                    style={{ backgroundColor: '#3d89b8', color: 'white', touchAction: 'manipulation' }}>
                    代表にする
                  </button>
                )}
                <button type="button" onClick={() => handleDelete(p.id, p.storage_path)}
                  className="px-2 py-1 text-xs rounded font-medium"
                  style={{ backgroundColor: 'rgba(184,67,122,0.9)', color: 'white', touchAction: 'manipulation' }}>
                  削除
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded border-2 border-dashed py-6 text-center text-sm" style={{ borderColor: '#e5e7eb', color: '#9ca3af' }}>
          写真未登録
        </div>
      )}
      <p className="form-hint">最大10MB/枚。代表写真が一覧・詳細に表示されます。</p>
    </div>
  )
}

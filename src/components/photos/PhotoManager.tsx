'use client'

import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { T, BUCKET } from '@/lib/supabase/constants'
import type { PhotoType } from '@/types'
import { PHOTO_TYPES } from '@/types'

interface Photo {
  id: string
  trial_id: string
  photo_type: string
  storage_path: string
  public_url: string | null
  caption: string | null
  display_order: number
  created_at: string
}

interface PhotoManagerProps {
  trialId: string
  menuId: string
  initialPhotos: Photo[]
}

export default function PhotoManager({ trialId, menuId, initialPhotos }: PhotoManagerProps) {
  const [photos, setPhotos] = useState<Photo[]>(initialPhotos)
  const [selectedType, setSelectedType] = useState<PhotoType>('冷凍前')
  const [caption, setCaption] = useState('')
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const cameraRef = useRef<HTMLInputElement>(null)
  const [viewPhoto, setViewPhoto] = useState<Photo | null>(null)

  const photosByType = PHOTO_TYPES.reduce((acc, type) => {
    acc[type] = photos.filter((p) => p.photo_type === type)
    return acc
  }, {} as Record<string, Photo[]>)

  function handleFileSelect(file: File | undefined) {
    if (!file) return
    if (!file.type.startsWith('image/')) { setError('画像ファイルを選択してください'); return }
    if (file.size > 10 * 1024 * 1024) { setError('ファイルサイズは10MB以下にしてください'); return }
    setSelectedFile(file)
    setError('')
    setPreviewUrl(URL.createObjectURL(file))
  }

  async function handleUpload() {
    if (!selectedFile) { setError('ファイルを選択してください'); return }
    setUploading(true)
    setError('')
    const client = createClient()

    try {
      const ext = selectedFile.name.split('.').pop() ?? 'jpg'
      const fileName = `${trialId}/${selectedType}/${Date.now()}.${ext}`
      const { error: uploadError } = await client.storage.from(BUCKET.TRIAL_PHOTOS).upload(fileName, selectedFile, { upsert: false })
      if (uploadError) throw uploadError

      const { data: urlData } = client.storage.from(BUCKET.TRIAL_PHOTOS).getPublicUrl(fileName)
      const { data: photo, error: dbError } = await client
        .from(T.TRIAL_PHOTOS)
        .insert({ trial_id: trialId, photo_type: selectedType, storage_path: fileName, public_url: urlData.publicUrl, caption: caption.trim() || null, display_order: photosByType[selectedType]?.length ?? 0 })
        .select().single()
      if (dbError) throw dbError

      setPhotos((prev) => [...prev, photo])
      setSelectedFile(null)
      setPreviewUrl(null)
      setCaption('')
      if (fileRef.current) fileRef.current.value = ''
      if (cameraRef.current) cameraRef.current.value = ''
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'アップロードに失敗しました')
    } finally {
      setUploading(false)
    }
  }

  async function handleDelete(photo: Photo) {
    if (!confirm('この写真を削除しますか？')) return
    const client = createClient()
    try {
      await client.storage.from(BUCKET.TRIAL_PHOTOS).remove([photo.storage_path])
      await client.from(T.TRIAL_PHOTOS).delete().eq('id', photo.id)
      setPhotos((prev) => prev.filter((p) => p.id !== photo.id))
    } catch {
      alert('削除に失敗しました')
    }
  }

  return (
    <div className="space-y-5">
      {/* アップロードパネル */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">写真を追加</h2>
        </div>
        <div className="card-body space-y-4">
          {error && (
            <div className="rounded-md p-3 text-sm" style={{ backgroundColor: '#fef2f2', color: '#b91c1c', border: '1px solid #fecaca' }}>
              {error}
            </div>
          )}

          {/* 種類選択 */}
          <div>
            <label className="form-label">写真の種類</label>
            <div className="flex gap-2 flex-wrap">
              {PHOTO_TYPES.map((type) => (
                <button key={type} type="button" onClick={() => setSelectedType(type)}
                  className="px-4 py-2.5 text-sm font-medium rounded border transition-all"
                  style={{
                    backgroundColor: selectedType === type ? '#111827' : '#fff',
                    color: selectedType === type ? '#fff' : '#374151',
                    borderColor: selectedType === type ? '#111827' : '#d1d5db',
                    cursor: 'pointer', touchAction: 'manipulation', minHeight: 44,
                  }}>
                  {type}
                </button>
              ))}
            </div>
          </div>

          {/* プレビュー or ファイル選択エリア */}
          {previewUrl ? (
            <div className="relative inline-block">
              <img src={previewUrl} alt="プレビュー" className="max-h-48 max-w-sm rounded object-contain border" style={{ borderColor: '#e5e7eb' }} />
              <button type="button"
                onClick={() => { setPreviewUrl(null); setSelectedFile(null) }}
                className="absolute -top-2 -right-2 w-6 h-6 rounded-full flex items-center justify-center text-white text-xs"
                style={{ backgroundColor: '#374151', touchAction: 'manipulation' }}>
                ✕
              </button>
            </div>
          ) : null}

          {/* 2ボタン: ファイル選択 / カメラ撮影 */}
          <div className="flex gap-2">
            <button type="button" onClick={() => fileRef.current?.click()}
              className="flex-1 flex items-center justify-center gap-2 rounded-md border py-3.5 text-sm font-medium transition-all"
              style={{ backgroundColor: '#fff', borderColor: '#d1d5db', color: '#374151', touchAction: 'manipulation', minHeight: 52 }}>
              <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" />
              </svg>
              ファイルから選択
            </button>
            <button type="button" onClick={() => cameraRef.current?.click()}
              className="flex-1 flex items-center justify-center gap-2 rounded-md border py-3.5 text-sm font-medium transition-all"
              style={{ backgroundColor: '#f0fdf4', borderColor: '#bbf7d0', color: '#15803d', touchAction: 'manipulation', minHeight: 52 }}>
              <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" /><circle cx="12" cy="13" r="4" />
              </svg>
              カメラで撮影
            </button>
          </div>

          <input ref={fileRef} type="file" accept="image/*" className="hidden"
            onChange={e => handleFileSelect(e.target.files?.[0])} />
          <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="hidden"
            onChange={e => handleFileSelect(e.target.files?.[0])} />

          {/* キャプション */}
          <div>
            <label className="form-label">キャプション（任意）</label>
            <input type="text" value={caption} onChange={(e) => setCaption(e.target.value)}
              placeholder="例：冷凍前の状態。型崩れなし。"
              className="form-input" />
          </div>

          <button type="button" onClick={handleUpload} disabled={!selectedFile || uploading}
            className="btn btn-primary"
            style={{ minHeight: 48 }}>
            {uploading ? 'アップロード中...' : `${selectedType}の写真を保存`}
          </button>
        </div>
      </div>

      {/* 写真比較グリッド */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">写真比較</h2>
          <span className="text-xs" style={{ color: '#9ca3af' }}>計 {photos.length} 枚</span>
        </div>
        <div className="card-body p-0">
          <div className="grid grid-cols-4 divide-x" style={{ borderColor: '#e5e7eb' }}>
            {PHOTO_TYPES.map((type) => {
              const typePhotos = photosByType[type] ?? []
              return (
                <div key={type}>
                  <div className="px-3 py-2.5 border-b text-center" style={{ backgroundColor: '#f9fafb', borderColor: '#e5e7eb' }}>
                    <div className="text-xs font-bold" style={{ color: '#374151' }}>{type}</div>
                    <div className="text-xs" style={{ color: '#9ca3af' }}>{typePhotos.length}枚</div>
                  </div>
                  <div className="p-2 space-y-2 min-h-24">
                    {typePhotos.length === 0 ? (
                      <div className="flex items-center justify-center h-20 rounded border-dashed border-2 text-xs"
                        style={{ color: '#9ca3af', borderColor: '#e5e7eb' }}>
                        写真なし
                      </div>
                    ) : (
                      typePhotos.map((photo) => (
                        <div key={photo.id} className="relative group">
                          <button type="button" onClick={() => setViewPhoto(photo)}
                            className="w-full block rounded overflow-hidden" style={{ touchAction: 'manipulation' }}>
                            {photo.public_url ? (
                              <img src={photo.public_url} alt={photo.caption ?? type} className="w-full h-28 object-cover" />
                            ) : (
                              <div className="w-full h-28 flex items-center justify-center" style={{ backgroundColor: '#f3f4f6' }}>
                                <span className="text-xs" style={{ color: '#9ca3af' }}>読込エラー</span>
                              </div>
                            )}
                          </button>
                          {photo.caption && (
                            <p className="text-xs mt-1 px-0.5 truncate" style={{ color: '#6b7280' }}>{photo.caption}</p>
                          )}
                          <button type="button" onClick={() => handleDelete(photo)}
                            className="absolute top-1 right-1 w-5 h-5 rounded flex items-center justify-center text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                            style={{ backgroundColor: 'rgba(0,0,0,0.6)', touchAction: 'manipulation' }}>
                            ✕
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* 拡大モーダル */}
      {viewPhoto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(0,0,0,0.85)' }}
          onClick={() => setViewPhoto(null)}>
          <div className="relative max-w-3xl w-full" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setViewPhoto(null)}
              className="absolute -top-10 right-0 text-white text-2xl font-bold"
              style={{ touchAction: 'manipulation' }}>✕</button>
            {viewPhoto.public_url && (
              <img src={viewPhoto.public_url} alt={viewPhoto.caption ?? viewPhoto.photo_type}
                className="w-full rounded-lg object-contain" style={{ maxHeight: '80vh' }} />
            )}
            {viewPhoto.caption && (
              <p className="text-white text-sm text-center mt-3">{viewPhoto.caption}</p>
            )}
            <div className="flex gap-3 justify-center mt-3">
              <span className="inline-flex items-center px-3 py-1 rounded text-sm font-medium"
                style={{ backgroundColor: 'rgba(255,255,255,0.15)', color: '#fff' }}>
                {viewPhoto.photo_type}
              </span>
              <button type="button"
                onClick={() => { handleDelete(viewPhoto); setViewPhoto(null) }}
                className="inline-flex items-center px-3 py-1 rounded text-sm font-medium"
                style={{ backgroundColor: 'rgba(220,38,38,0.7)', color: '#fff', cursor: 'pointer', touchAction: 'manipulation' }}>
                削除
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

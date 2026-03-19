'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { T, BUCKET } from '@/lib/supabase/constants'
import type { Menu, MenuCategory, MenuGenre } from '@/types'
import { MENU_CATEGORIES, MENU_GENRES, ALLERGEN_LIST } from '@/types'
import { MenuPhotoUploadNew } from './MenuPhotoUpload'
import MenuPhotoUpload from './MenuPhotoUpload'

interface MenuFormProps {
  initialData?: Menu
  menuId?: string
  initialPhotos?: Array<{
    id: string
    public_url: string | null
    caption: string | null
    is_primary: boolean
    storage_path: string
  }>
}

export default function MenuForm({ initialData, menuId, initialPhotos = [] }: MenuFormProps) {
  const router = useRouter()
  const isEdit = !!menuId

  const [name, setName] = useState(initialData?.name ?? '')
  const [category, setCategory] = useState<MenuCategory>(initialData?.category ?? '主菜')
  const [genre, setGenre] = useState<MenuGenre>(initialData?.genre ?? '和食')
  const [ingredients, setIngredients] = useState(initialData?.ingredients ?? '')
  const [allergens, setAllergens] = useState<string[]>(initialData?.allergens ?? [])
  const [memo, setMemo] = useState(initialData?.memo ?? '')
  const [createdBy, setCreatedBy] = useState(initialData?.created_by ?? '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // 新規登録用の写真（未送信）
  const [pendingFiles, setPendingFiles] = useState<File[]>([])
  const [previewUrls, setPreviewUrls] = useState<string[]>([])

  // 編集時の写真状態
  const [editPhotos, setEditPhotos] = useState(initialPhotos)

  useEffect(() => {
    const urls = pendingFiles.map(f => URL.createObjectURL(f))
    setPreviewUrls(urls)
    return () => urls.forEach(u => URL.revokeObjectURL(u))
  }, [pendingFiles])

  function toggleAllergen(a: string) {
    setAllergens((prev) =>
      prev.includes(a) ? prev.filter((x) => x !== a) : [...prev, a]
    )
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) { setError('メニュー名を入力してください'); return }

    setLoading(true)
    setError('')
    const client = createClient()

    try {
      let savedMenuId = menuId

      if (isEdit) {
        const { error: err } = await client
          .from(T.MENUS)
          .update({ name: name.trim(), category, genre, ingredients: ingredients.trim() || null, allergens, memo: memo.trim() || null })
          .eq('id', menuId)
        if (err) throw err
      } else {
        const { data, error: err } = await client
          .from(T.MENUS)
          .insert({ name: name.trim(), category, genre, ingredients: ingredients.trim() || null, allergens, memo: memo.trim() || null, created_by: createdBy.trim() || null })
          .select()
          .single()
        if (err) throw err
        savedMenuId = data.id

        // 新規登録時の写真アップロード
        if (pendingFiles.length > 0 && savedMenuId) {
          for (let i = 0; i < pendingFiles.length; i++) {
            const file = pendingFiles[i]
            const ext = file.name.split('.').pop() ?? 'jpg'
            const path = `${savedMenuId}/${Date.now()}_${i}.${ext}`
            const { error: upErr } = await client.storage.from(BUCKET.MENU_PHOTOS).upload(path, file)
            if (upErr) continue // 写真失敗は無視してメニュー登録は完了させる
            const { data: urlData } = client.storage.from(BUCKET.MENU_PHOTOS).getPublicUrl(path)
            await client.from(T.MENU_PHOTOS).insert({
              menu_id: savedMenuId,
              storage_path: path,
              public_url: urlData.publicUrl,
              is_primary: i === 0,
              display_order: i,
            })
          }
        }
      }

      router.push(`/menus/${savedMenuId}`)
      router.refresh()
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : '保存に失敗しました'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 max-w-2xl">
      {error && (
        <div className="rounded-md p-3 text-sm" style={{ backgroundColor: '#fef2f2', color: '#b91c1c', border: '1px solid #fecaca' }}>
          {error}
        </div>
      )}

      {/* 基本情報 */}
      <div className="card">
        <div className="card-header"><h2 className="card-title">基本情報</h2></div>
        <div className="card-body space-y-4">
          <div>
            <label className="form-label">メニュー名 <span style={{ color: '#b91c1c' }}>*</span></label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="例：肉じゃが"
              className="form-input"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="form-label">料理区分 <span style={{ color: '#b91c1c' }}>*</span></label>
              <select value={category} onChange={(e) => setCategory(e.target.value as MenuCategory)} className="form-select">
                {MENU_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="form-label">ジャンル <span style={{ color: '#b91c1c' }}>*</span></label>
              <select value={genre} onChange={(e) => setGenre(e.target.value as MenuGenre)} className="form-select">
                {MENU_GENRES.map((g) => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
          </div>

          {!isEdit && (
            <div>
              <label className="form-label">登録者</label>
              <input
                type="text"
                value={createdBy}
                onChange={(e) => setCreatedBy(e.target.value)}
                placeholder="例：山田太郎"
                className="form-input"
              />
            </div>
          )}
        </div>
      </div>

      {/* 代表写真 */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">代表写真</h2>
          <span className="text-xs" style={{ color: '#9ca3af' }}>完成イメージ・盛り付け写真など</span>
        </div>
        <div className="card-body">
          {isEdit && menuId ? (
            <MenuPhotoUpload
              menuId={menuId}
              existingPhotos={editPhotos}
              onPhotosChange={setEditPhotos}
            />
          ) : (
            <MenuPhotoUploadNew
              pendingFiles={pendingFiles}
              onFilesChange={setPendingFiles}
              previewUrls={previewUrls}
            />
          )}
        </div>
      </div>

      {/* 食材・アレルゲン */}
      <div className="card">
        <div className="card-header"><h2 className="card-title">食材・アレルゲン</h2></div>
        <div className="card-body space-y-4">
          <div>
            <label className="form-label">使用食材</label>
            <textarea
              value={ingredients}
              onChange={(e) => setIngredients(e.target.value)}
              placeholder="例：じゃがいも、牛肉、玉ねぎ、にんじん、絹さや"
              className="form-textarea"
              rows={3}
              style={{ fontSize: 15 }}
            />
            <p className="form-hint">カンマ区切りで入力してください</p>
          </div>

          <div>
            <label className="form-label">アレルゲン</label>
            <div className="flex flex-wrap gap-2 mt-1">
              {ALLERGEN_LIST.map((a) => {
                const checked = allergens.includes(a)
                return (
                  <button
                    key={a}
                    type="button"
                    onClick={() => toggleAllergen(a)}
                    className="px-3 py-2 text-xs font-medium rounded border transition-all"
                    style={{
                      backgroundColor: checked ? '#fff7ed' : '#fff',
                      color: checked ? '#c2410c' : '#6b7280',
                      borderColor: checked ? '#fed7aa' : '#e5e7eb',
                      cursor: 'pointer',
                      touchAction: 'manipulation',
                      minHeight: 36,
                    }}
                  >
                    {checked && '✓ '}{a}
                  </button>
                )
              })}
            </div>
            {allergens.length > 0 && (
              <p className="form-hint mt-2">選択中: {allergens.join('、')}</p>
            )}
          </div>
        </div>
      </div>

      {/* メモ */}
      <div className="card">
        <div className="card-header"><h2 className="card-title">メモ</h2></div>
        <div className="card-body">
          <textarea
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
            placeholder="メニューに関するメモや注意点を入力してください"
            className="form-textarea"
            rows={4}
            style={{ fontSize: 15 }}
          />
        </div>
      </div>

      {/* ボタン */}
      <div className="flex gap-3">
        <button type="submit" disabled={loading} className="btn btn-primary btn-lg">
          {loading ? '保存中...' : isEdit ? '変更を保存' : 'メニューを登録'}
        </button>
        <button type="button" onClick={() => router.back()} className="btn btn-secondary btn-lg">
          キャンセル
        </button>
      </div>
    </form>
  )
}

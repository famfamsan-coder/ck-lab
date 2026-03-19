import type { SupabaseClient } from '@supabase/supabase-js'
import type { MenuFilters, MenuFormData, TrialFormData, EvaluationFormData } from '@/types'
import { T, BUCKET } from './constants'

// =====================================================
// 注: ネスト結合には PostgREST エイリアス構文を使用
//   alias:ck_table_name(...)
// これにより結果オブジェクトのキー名が元のまま維持され、
// 呼び出し側の型アクセス (.trials / .evaluations 等) が変わらない
// =====================================================

// =====================================================
// Menus
// =====================================================

export async function fetchMenus(client: SupabaseClient, filters?: MenuFilters) {
  let query = client
    .from(T.MENUS)
    .select(`
      *,
      trials:${T.TRIALS} (
        id,
        version,
        trial_date,
        status,
        evaluations:${T.EVALUATIONS} ( overall )
      )
    `)
    .order('updated_at', { ascending: false })

  if (filters?.search) {
    query = query.ilike('name', `%${filters.search}%`)
  }
  if (filters?.category) {
    query = query.eq('category', filters.category)
  }
  if (filters?.genre) {
    query = query.eq('genre', filters.genre)
  }

  const { data, error } = await query
  if (error) throw error
  return data
}

export async function fetchMenuById(client: SupabaseClient, id: string) {
  const { data, error } = await client
    .from(T.MENUS)
    .select(`
      *,
      trials:${T.TRIALS} (
        *,
        evaluations:${T.EVALUATIONS} ( * ),
        trial_photos:${T.TRIAL_PHOTOS} ( * )
      )
    `)
    .eq('id', id)
    .single()

  if (error) throw error
  return data
}

export async function createMenu(client: SupabaseClient, data: MenuFormData) {
  const { data: menu, error } = await client
    .from(T.MENUS)
    .insert({
      name: data.name.trim(),
      category: data.category,
      genre: data.genre,
      ingredients: data.ingredients.trim() || null,
      allergens: data.allergens,
      memo: data.memo.trim() || null,
      created_by: data.created_by.trim() || null,
    })
    .select()
    .single()

  if (error) throw error
  return menu
}

export async function updateMenu(client: SupabaseClient, id: string, data: Partial<MenuFormData>) {
  const { data: menu, error } = await client
    .from(T.MENUS)
    .update({
      name: data.name?.trim(),
      category: data.category,
      genre: data.genre,
      ingredients: data.ingredients?.trim() || null,
      allergens: data.allergens,
      memo: data.memo?.trim() || null,
    })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return menu
}

export async function deleteMenu(client: SupabaseClient, id: string) {
  const { error } = await client.from(T.MENUS).delete().eq('id', id)
  if (error) throw error
}

// =====================================================
// Trials
// =====================================================

export async function fetchTrialsByMenuId(client: SupabaseClient, menuId: string) {
  const { data, error } = await client
    .from(T.TRIALS)
    .select(`
      *,
      evaluations:${T.EVALUATIONS} ( * ),
      trial_photos:${T.TRIAL_PHOTOS} ( * )
    `)
    .eq('menu_id', menuId)
    .order('version', { ascending: false })

  if (error) throw error
  return data
}

export async function fetchTrialById(client: SupabaseClient, id: string) {
  const { data, error } = await client
    .from(T.TRIALS)
    .select(`
      *,
      evaluations:${T.EVALUATIONS} ( * ),
      trial_photos:${T.TRIAL_PHOTOS} ( * ),
      menus:${T.MENUS} ( id, name, category, genre )
    `)
    .eq('id', id)
    .single()

  if (error) throw error
  return data
}

export async function getNextTrialVersion(client: SupabaseClient, menuId: string): Promise<number> {
  const { data } = await client
    .from(T.TRIALS)
    .select('version')
    .eq('menu_id', menuId)
    .order('version', { ascending: false })
    .limit(1)
    .single()

  return data ? data.version + 1 : 1
}

export async function createTrial(
  client: SupabaseClient,
  menuId: string,
  data: TrialFormData,
  version: number
) {
  const { data: trial, error } = await client
    .from(T.TRIALS)
    .insert({
      menu_id: menuId,
      version,
      trial_date: data.trial_date,
      trialist: data.trialist.trim(),
      prep_time: data.prep_time ? parseInt(data.prep_time) : null,
      cook_time: data.cook_time ? parseInt(data.cook_time) : null,
      cool_time: data.cool_time ? parseInt(data.cool_time) : null,
      freeze_time: data.freeze_time ? parseInt(data.freeze_time) : null,
      storage_days: data.storage_days ? parseInt(data.storage_days) : null,
      thaw_method: data.thaw_method.trim() || null,
      reheat_method: data.reheat_method.trim() || null,
      freeze_notes: data.freeze_notes.trim() || null,
      reheat_notes: data.reheat_notes.trim() || null,
      improvements: data.improvements.trim() || null,
      next_trial_notes: data.next_trial_notes.trim() || null,
      status: data.status || null,
    })
    .select()
    .single()

  if (error) throw error
  return trial
}

export async function updateTrial(
  client: SupabaseClient,
  id: string,
  data: TrialFormData
) {
  const { data: trial, error } = await client
    .from(T.TRIALS)
    .update({
      trial_date: data.trial_date,
      trialist: data.trialist.trim(),
      prep_time: data.prep_time ? parseInt(data.prep_time) : null,
      cook_time: data.cook_time ? parseInt(data.cook_time) : null,
      cool_time: data.cool_time ? parseInt(data.cool_time) : null,
      freeze_time: data.freeze_time ? parseInt(data.freeze_time) : null,
      storage_days: data.storage_days ? parseInt(data.storage_days) : null,
      thaw_method: data.thaw_method.trim() || null,
      reheat_method: data.reheat_method.trim() || null,
      freeze_notes: data.freeze_notes.trim() || null,
      reheat_notes: data.reheat_notes.trim() || null,
      improvements: data.improvements.trim() || null,
      next_trial_notes: data.next_trial_notes.trim() || null,
      status: data.status || null,
    })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return trial
}

export async function deleteTrial(client: SupabaseClient, id: string) {
  const { error } = await client.from(T.TRIALS).delete().eq('id', id)
  if (error) throw error
}

// =====================================================
// Evaluations
// =====================================================

export async function upsertEvaluation(
  client: SupabaseClient,
  trialId: string,
  data: EvaluationFormData
) {
  const payload = {
    trial_id: trialId,
    taste: data.taste,
    appearance: data.appearance,
    texture: data.texture,
    aroma: data.aroma,
    wateriness: data.wateriness,
    discoloration: data.discoloration,
    shape_collapse: data.shape_collapse,
    serving_ease: data.serving_ease,
    field_reproducibility: data.field_reproducibility,
    overall: data.overall,
    evaluator: data.evaluator.trim() || null,
    evaluation_notes: data.evaluation_notes.trim() || null,
  }

  const { data: evaluation, error } = await client
    .from(T.EVALUATIONS)
    .upsert(payload, { onConflict: 'trial_id' })
    .select()
    .single()

  if (error) throw error
  return evaluation
}

// =====================================================
// Photos
// =====================================================

export async function uploadTrialPhoto(
  client: SupabaseClient,
  trialId: string,
  file: File,
  photoType: string,
  caption: string
) {
  const ext = file.name.split('.').pop()
  const fileName = `${trialId}/${photoType}/${Date.now()}.${ext}`

  const { error: uploadError } = await client.storage
    .from(BUCKET.TRIAL_PHOTOS)
    .upload(fileName, file, { upsert: false })

  if (uploadError) throw uploadError

  const { data: urlData } = client.storage
    .from(BUCKET.TRIAL_PHOTOS)
    .getPublicUrl(fileName)

  const { data: photo, error } = await client
    .from(T.TRIAL_PHOTOS)
    .insert({
      trial_id: trialId,
      photo_type: photoType,
      storage_path: fileName,
      public_url: urlData.publicUrl,
      caption: caption.trim() || null,
    })
    .select()
    .single()

  if (error) throw error
  return photo
}

export async function deleteTrialPhoto(client: SupabaseClient, id: string, storagePath: string) {
  await client.storage.from(BUCKET.TRIAL_PHOTOS).remove([storagePath])
  const { error } = await client.from(T.TRIAL_PHOTOS).delete().eq('id', id)
  if (error) throw error
}

// =====================================================
// Dashboard
// =====================================================

export async function fetchDashboardStats(client: SupabaseClient) {
  const { data: menus, error: menusError } = await client
    .from(T.MENUS)
    .select('id')

  if (menusError) throw menusError

  const { data: trials, error: trialsError } = await client
    .from(T.TRIALS)
    .select('menu_id, status')

  if (trialsError) throw trialsError

  const menuStatusMap = new Map<string, string | null>()
  trials?.forEach((t) => {
    menuStatusMap.set(t.menu_id, t.status)
  })

  const stats = {
    total_menus: menus?.length ?? 0,
    adopted: 0,
    conditional: 0,
    re_trial: 0,
    rejected: 0,
    no_trial: 0,
  }

  menus?.forEach((m) => {
    const status = menuStatusMap.get(m.id)
    if (!status) stats.no_trial++
    else if (status === '採用') stats.adopted++
    else if (status === '条件付き採用') stats.conditional++
    else if (status === '再試作') stats.re_trial++
    else if (status === '不採用') stats.rejected++
  })

  return stats
}

export async function fetchRecentTrials(client: SupabaseClient, limit = 8) {
  const { data, error } = await client
    .from(T.TRIALS)
    .select(`
      id,
      version,
      trial_date,
      trialist,
      status,
      updated_at,
      menus:${T.MENUS} ( id, name, category )
    `)
    .order('updated_at', { ascending: false })
    .limit(limit)

  if (error) throw error
  return data
}

export async function fetchCategoryStats(client: SupabaseClient) {
  const { data, error } = await client
    .from(T.MENUS)
    .select('category')

  if (error) throw error

  const counts: Record<string, number> = {}
  data?.forEach((m) => {
    counts[m.category] = (counts[m.category] ?? 0) + 1
  })

  return counts
}

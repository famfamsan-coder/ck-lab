// =====================================================
// 冷凍試作メニュー管理アプリ - 型定義
// =====================================================

export type MenuCategory = '主菜' | '副菜' | '汁物' | 'デザート' | 'その他'
export type MenuGenre = '和食' | '洋食' | '中華' | '行事食' | 'その他'
export type TrialStatus = '採用' | '条件付き採用' | '再試作' | '不採用'
export type PhotoType = '冷凍前' | '冷凍後' | '再加熱後' | '盛り付け後'

export const MENU_CATEGORIES: MenuCategory[] = ['主菜', '副菜', '汁物', 'デザート', 'その他']
export const MENU_GENRES: MenuGenre[] = ['和食', '洋食', '中華', '行事食', 'その他']
export const TRIAL_STATUSES: TrialStatus[] = ['採用', '条件付き採用', '再試作', '不採用']
export const PHOTO_TYPES: PhotoType[] = ['冷凍前', '冷凍後', '再加熱後', '盛り付け後']

export const ALLERGEN_LIST = [
  '卵', '乳', '小麦', '蕎麦', '落花生', '海老', '蟹',
  '牛肉', '豚肉', '鶏肉', '鮭', '鯖', 'イカ', 'いくら',
  'あわび', '大豆', 'くるみ', 'ごま', 'カシューナッツ',
  'キウイフルーツ', 'バナナ', 'もも', 'やまいも', 'リンゴ',
  'オレンジ', 'ゼラチン'
] as const

// =====================================================
// DB テーブル型
// =====================================================

export interface Menu {
  id: string
  name: string
  category: MenuCategory
  genre: MenuGenre
  ingredients: string | null
  allergens: string[]
  memo: string | null
  created_at: string
  updated_at: string
  created_by: string | null
}

export interface MenuPhoto {
  id: string
  menu_id: string
  storage_path: string
  public_url: string | null
  caption: string | null
  is_primary: boolean
  display_order: number
  created_at: string
}

export interface Trial {
  id: string
  menu_id: string
  version: number
  trial_date: string
  trialist: string
  prep_time: number | null
  cook_time: number | null
  cool_time: number | null
  freeze_time: number | null
  storage_days: number | null
  thaw_method: string | null
  reheat_method: string | null
  freeze_notes: string | null
  reheat_notes: string | null
  improvements: string | null
  next_trial_notes: string | null
  status: TrialStatus | null
  created_at: string
  updated_at: string
}

export interface Evaluation {
  id: string
  trial_id: string
  taste: number | null
  appearance: number | null
  texture: number | null
  aroma: number | null
  wateriness: number | null
  discoloration: number | null
  shape_collapse: number | null
  serving_ease: number | null
  field_reproducibility: number | null
  overall: number | null
  evaluator: string | null
  evaluation_notes: string | null
  created_at: string
  updated_at: string
}

export interface TrialPhoto {
  id: string
  trial_id: string
  photo_type: PhotoType
  storage_path: string
  public_url: string | null
  caption: string | null
  display_order: number
  created_at: string
}

// =====================================================
// 結合型
// =====================================================

export interface TrialWithEvaluation extends Trial {
  evaluations: Evaluation | null
  trial_photos: TrialPhoto[]
}

export interface MenuWithTrials extends Menu {
  trials: TrialWithEvaluation[]
  menu_photos: MenuPhoto[]
}

export interface MenuListItem extends Menu {
  trial_count: number
  latest_trial: {
    version: number
    trial_date: string
    status: TrialStatus | null
    overall: number | null
  } | null
  menu_photos: MenuPhoto[]
}

// =====================================================
// フォーム型
// =====================================================

export interface MenuFormData {
  name: string
  category: MenuCategory
  genre: MenuGenre
  ingredients: string
  allergens: string[]
  memo: string
  created_by: string
}

export interface TrialFormData {
  trial_date: string
  trialist: string
  prep_time: string
  cook_time: string
  cool_time: string
  freeze_time: string
  storage_days: string
  thaw_method: string
  reheat_method: string
  freeze_notes: string
  reheat_notes: string
  improvements: string
  next_trial_notes: string
  status: TrialStatus | ''
}

export interface EvaluationFormData {
  taste: number | null
  appearance: number | null
  texture: number | null
  aroma: number | null
  wateriness: number | null
  discoloration: number | null
  shape_collapse: number | null
  serving_ease: number | null
  field_reproducibility: number | null
  overall: number | null
  evaluator: string
  evaluation_notes: string
}

// =====================================================
// フィルター型
// =====================================================

export interface MenuFilters {
  search: string
  category: MenuCategory | ''
  genre: MenuGenre | ''
  status: TrialStatus | ''
}

// =====================================================
// ダッシュボード型
// =====================================================

export interface DashboardStats {
  total_menus: number
  adopted: number
  conditional: number
  re_trial: number
  rejected: number
  no_trial: number
}

export interface CategoryCount {
  category: MenuCategory
  count: number
}

// =====================================================
// 冷凍試作メニュー管理アプリ — Supabase 命名定数
//
// 【設計方針】
// - 既存Supabaseプロジェクト内で他アプリと共存するため
//   すべてのテーブル・バケット名に `ck_` 接頭辞を付与
// - 将来このアプリ単独で別プロジェクトへ移行する際は
//   このファイルの値を書き換えるだけで全参照が切り替わる
//
// 【独立移行手順メモ】
// 1. 新Supabaseプロジェクトを作成
// 2. supabase/schema.sql を新プロジェクトで実行
// 3. Storage バケットを新プロジェクトで作成
// 4. .env.local の SUPABASE_URL / SUPABASE_ANON_KEY を更新
// 5. 必要に応じてこのファイルの接頭辞を除去してリネーム
// =====================================================

/** テーブル名定数 */
export const T = {
  MENUS:        'ck_menus',
  MENU_PHOTOS:  'ck_menu_photos',
  TRIALS:       'ck_trials',
  EVALUATIONS:  'ck_evaluations',
  TRIAL_PHOTOS: 'ck_trial_photos',
} as const

/** Storageバケット名定数 */
export const BUCKET = {
  TRIAL_PHOTOS: 'ck-trial-photos',
  MENU_PHOTOS:  'ck-menu-photos',
} as const

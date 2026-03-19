-- =====================================================
-- 冷凍試作メニュー管理アプリ（Central Kitchen）
-- Supabase スキーマ定義
--
-- バージョン : v3
-- 変更内容   : テーブル・インデックス・ポリシー名すべてに
--              ck_ 接頭辞を付与（既存プロジェクト共存対応）
--
-- 【適用手順】
-- 1. Supabase ダッシュボード > SQL Editor を開く
-- 2. このファイルの内容を貼り付けて実行（RUN）
-- 3. Storage > New bucket でバケットを2つ作成（下記参照）
-- 4. .env.local に接続情報を設定してアプリを起動
--
-- 【このSQLで作成されるテーブル】
--   ck_menus          : メニューマスタ
--   ck_menu_photos    : メニュー代表写真
--   ck_trials         : 試作記録
--   ck_evaluations    : 評価記録（試作に1:1紐付）
--   ck_trial_photos   : 試作工程写真
--
-- 【Storageバケット（手動作成が必要）】
--   ck-trial-photos   : 試作工程写真（Public: true）
--   ck-menu-photos    : メニュー代表写真（Public: true）
-- =====================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- ck_menus テーブル
-- =====================================================
CREATE TABLE ck_menus (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  category VARCHAR(50) NOT NULL CHECK (
    category IN ('主菜', '副菜', '汁物', 'デザート', 'その他')
  ),
  genre VARCHAR(50) NOT NULL CHECK (
    genre IN ('和食', '洋食', '中華', '行事食', 'その他')
  ),
  ingredients TEXT,
  allergens TEXT[] DEFAULT '{}',
  memo TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  created_by VARCHAR(255)
);

CREATE INDEX idx_ck_menus_category ON ck_menus(category);
CREATE INDEX idx_ck_menus_genre    ON ck_menus(genre);

-- =====================================================
-- ck_menu_photos テーブル（メニュー代表写真）
-- Storage: ck-menu-photos バケットに保存
-- =====================================================
CREATE TABLE ck_menu_photos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  menu_id UUID NOT NULL REFERENCES ck_menus(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL,
  public_url TEXT,
  caption TEXT,
  is_primary BOOLEAN DEFAULT false,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_ck_menu_photos_menu_id ON ck_menu_photos(menu_id);

-- =====================================================
-- ck_trials テーブル（試作記録）
-- =====================================================
CREATE TABLE ck_trials (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  menu_id UUID NOT NULL REFERENCES ck_menus(id) ON DELETE CASCADE,
  version INTEGER NOT NULL DEFAULT 1,
  trial_date DATE NOT NULL,
  trialist VARCHAR(255) NOT NULL,
  prep_time INTEGER,
  cook_time INTEGER,
  cool_time INTEGER,
  freeze_time INTEGER,
  storage_days INTEGER,
  thaw_method TEXT,
  reheat_method TEXT,
  freeze_notes TEXT,
  reheat_notes TEXT,
  improvements TEXT,
  next_trial_notes TEXT,
  status VARCHAR(50) CHECK (
    status IN ('採用', '条件付き採用', '再試作', '不採用')
  ),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(menu_id, version)
);

CREATE INDEX idx_ck_trials_menu_id    ON ck_trials(menu_id);
CREATE INDEX idx_ck_trials_status     ON ck_trials(status);
CREATE INDEX idx_ck_trials_trial_date ON ck_trials(trial_date DESC);

-- =====================================================
-- ck_evaluations テーブル（試作評価 1:1）
-- =====================================================
CREATE TABLE ck_evaluations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  trial_id UUID NOT NULL REFERENCES ck_trials(id) ON DELETE CASCADE UNIQUE,
  taste SMALLINT CHECK (taste BETWEEN 1 AND 5),
  appearance SMALLINT CHECK (appearance BETWEEN 1 AND 5),
  texture SMALLINT CHECK (texture BETWEEN 1 AND 5),
  aroma SMALLINT CHECK (aroma BETWEEN 1 AND 5),
  wateriness SMALLINT CHECK (wateriness BETWEEN 1 AND 5),
  discoloration SMALLINT CHECK (discoloration BETWEEN 1 AND 5),
  shape_collapse SMALLINT CHECK (shape_collapse BETWEEN 1 AND 5),
  serving_ease SMALLINT CHECK (serving_ease BETWEEN 1 AND 5),
  field_reproducibility SMALLINT CHECK (field_reproducibility BETWEEN 1 AND 5),
  overall SMALLINT CHECK (overall BETWEEN 1 AND 5),
  evaluator VARCHAR(255),
  evaluation_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- =====================================================
-- ck_trial_photos テーブル（試作工程写真）
-- Storage: ck-trial-photos バケットに保存
-- =====================================================
CREATE TABLE ck_trial_photos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  trial_id UUID NOT NULL REFERENCES ck_trials(id) ON DELETE CASCADE,
  photo_type VARCHAR(50) NOT NULL CHECK (
    photo_type IN ('冷凍前', '冷凍後', '再加熱後', '盛り付け後')
  ),
  storage_path TEXT NOT NULL,
  public_url TEXT,
  caption TEXT,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_ck_trial_photos_trial_id ON ck_trial_photos(trial_id);

-- =====================================================
-- 更新日時の自動更新トリガー
-- =====================================================
CREATE OR REPLACE FUNCTION ck_update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_ck_menus_updated_at
  BEFORE UPDATE ON ck_menus FOR EACH ROW EXECUTE FUNCTION ck_update_updated_at();
CREATE TRIGGER trigger_ck_trials_updated_at
  BEFORE UPDATE ON ck_trials FOR EACH ROW EXECUTE FUNCTION ck_update_updated_at();
CREATE TRIGGER trigger_ck_evaluations_updated_at
  BEFORE UPDATE ON ck_evaluations FOR EACH ROW EXECUTE FUNCTION ck_update_updated_at();

-- =====================================================
-- Supabase Storage バケット設定（コンソールから手動作成）
--
-- バケット1: ck-trial-photos（試作工程写真）
--   - Public: true
--   - 用途: 冷凍前/後、再加熱後、盛り付け後の工程写真
--   - パス例: {trial_id}/{photo_type}/{timestamp}.jpg
--
-- バケット2: ck-menu-photos（メニュー代表写真）
--   - Public: true
--   - 用途: メニュー完成イメージ・代表写真
--   - パス例: {menu_id}/{timestamp}.jpg
-- =====================================================

-- =====================================================
-- RLS ポリシー
-- =====================================================
ALTER TABLE ck_menus       ENABLE ROW LEVEL SECURITY;
ALTER TABLE ck_menu_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE ck_trials      ENABLE ROW LEVEL SECURITY;
ALTER TABLE ck_evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE ck_trial_photos ENABLE ROW LEVEL SECURITY;

-- 匿名ユーザーも読み書き可（業務LAN内での利用想定）
CREATE POLICY "ck_allow_all_menus"        ON ck_menus       FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "ck_allow_all_menu_photos"  ON ck_menu_photos FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "ck_allow_all_trials"       ON ck_trials      FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "ck_allow_all_evaluations"  ON ck_evaluations FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "ck_allow_all_trial_photos" ON ck_trial_photos FOR ALL TO anon USING (true) WITH CHECK (true);

CREATE POLICY "ck_allow_auth_menus"        ON ck_menus       FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "ck_allow_auth_menu_photos"  ON ck_menu_photos FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "ck_allow_auth_trials"       ON ck_trials      FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "ck_allow_auth_evaluations"  ON ck_evaluations FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "ck_allow_auth_trial_photos" ON ck_trial_photos FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- =====================================================
-- サンプルデータ（初期確認用）
-- ※ 不要な場合は以下のINSERT文を削除して実行
-- =====================================================
INSERT INTO ck_menus (name, category, genre, ingredients, allergens, memo) VALUES
('肉じゃが',             '主菜',   '和食', 'じゃがいも、牛肉、玉ねぎ、にんじん、絹さや', ARRAY['牛肉'],              '定番メニュー、冷凍後の崩れに注意'),
('鶏の唐揚げ',           '主菜',   '和食', '鶏もも肉、醤油、みりん、生姜、にんにく',       ARRAY['鶏肉', '小麦', '大豆'], NULL),
('ミネストローネ',       '汁物',   '洋食', 'トマト、玉ねぎ、セロリ、にんじん、ズッキーニ', ARRAY['セロリ'],             NULL),
('ほうれん草のごま和え', '副菜',   '和食', 'ほうれん草、ごま、醤油、砂糖',                 ARRAY['ごま', '大豆'],        NULL),
('チョコレートムース',   'デザート','洋食', 'チョコレート、生クリーム、卵',                 ARRAY['卵', '乳'],            '解凍後の食感が課題');

INSERT INTO ck_trials (menu_id, version, trial_date, trialist, prep_time, cook_time, cool_time, freeze_time, storage_days, thaw_method, reheat_method, status) VALUES
((SELECT id FROM ck_menus WHERE name = '肉じゃが'),           1, '2026-03-01', '山田太郎', 30, 45, 60, 15, 30, '冷蔵庫解凍（8時間）', 'スチームコンベクション 85℃ 15分', '再試作'),
((SELECT id FROM ck_menus WHERE name = '肉じゃが'),           2, '2026-03-10', '山田太郎', 30, 40, 60, 15, 30, '冷蔵庫解凍（8時間）', 'スチームコンベクション 80℃ 12分', '条件付き採用'),
((SELECT id FROM ck_menus WHERE name = '鶏の唐揚げ'),         1, '2026-03-05', '鈴木花子', 20, 30, 30, 10, 14, '冷蔵庫解凍（6時間）', 'オーブン 180℃ 10分',              '採用'),
((SELECT id FROM ck_menus WHERE name = 'ミネストローネ'),     1, '2026-03-08', '田中次郎', 20, 35, 60, 10, 21, '湯煎解凍',           '再沸騰まで加熱',                   '採用'),
((SELECT id FROM ck_menus WHERE name = 'チョコレートムース'), 1, '2026-03-12', '鈴木花子', 60,  0,120, 10,  7, '冷蔵庫解凍（4時間）', '解凍のみ（加熱不要）',             '不採用');

INSERT INTO ck_evaluations (trial_id, taste, appearance, texture, aroma, wateriness, discoloration, shape_collapse, serving_ease, field_reproducibility, overall, evaluator) VALUES
((SELECT t.id FROM ck_trials t JOIN ck_menus m ON t.menu_id = m.id WHERE m.name = '肉じゃが'           AND t.version = 1), 3,3,2,3,4,2,4,3,3,3,'山田太郎'),
((SELECT t.id FROM ck_trials t JOIN ck_menus m ON t.menu_id = m.id WHERE m.name = '肉じゃが'           AND t.version = 2), 4,4,3,4,2,2,3,4,4,4,'山田太郎'),
((SELECT t.id FROM ck_trials t JOIN ck_menus m ON t.menu_id = m.id WHERE m.name = '鶏の唐揚げ'         AND t.version = 1), 5,5,4,5,1,1,1,5,5,5,'鈴木花子'),
((SELECT t.id FROM ck_trials t JOIN ck_menus m ON t.menu_id = m.id WHERE m.name = 'ミネストローネ'     AND t.version = 1), 4,4,4,4,1,1,1,5,5,4,'田中次郎'),
((SELECT t.id FROM ck_trials t JOIN ck_menus m ON t.menu_id = m.id WHERE m.name = 'チョコレートムース' AND t.version = 1), 2,2,2,3,1,3,4,2,2,2,'鈴木花子');

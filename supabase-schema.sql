-- YLTT 数据库 Schema
-- 在 Supabase SQL Editor 中运行此文件

-- 1. 用户资料表
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name VARCHAR(100),
  email VARCHAR(255),
  bio TEXT DEFAULT '',
  location VARCHAR(200) DEFAULT '',
  avatar_url TEXT DEFAULT '',
  role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 用户注册时自动创建 profile
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, display_name, email, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', '用户'),
    NEW.email,
    'user'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- 2. 故事表
CREATE TABLE IF NOT EXISTS stories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(300) NOT NULL,
  content TEXT DEFAULT '',
  cover_emoji VARCHAR(10) DEFAULT '💕',
  story_date DATE DEFAULT CURRENT_DATE,
  category VARCHAR(50) DEFAULT 'daily' CHECK (category IN ('milestone', 'travel', 'daily', 'special')),
  published BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. 照片表
CREATE TABLE IF NOT EXISTS photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(300) DEFAULT '',
  url TEXT NOT NULL,
  taken_at TIMESTAMPTZ,
  width INTEGER,
  height INTEGER,
  camera VARCHAR(300) DEFAULT '',
  lens VARCHAR(300) DEFAULT '',
  focal_length VARCHAR(50) DEFAULT '',
  aperture VARCHAR(50) DEFAULT '',
  shutter_speed VARCHAR(50) DEFAULT '',
  iso INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. 视频表
CREATE TABLE IF NOT EXISTS videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(300) NOT NULL,
  description TEXT DEFAULT '',
  url TEXT DEFAULT '',
  emoji VARCHAR(10) DEFAULT '🎬',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. 祝福卡片表
CREATE TABLE IF NOT EXISTS blessings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  author_name VARCHAR(100) NOT NULL DEFAULT '匿名',
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. 评论表
CREATE TABLE IF NOT EXISTS comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id UUID REFERENCES stories(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- RLS (Row Level Security) 策略
-- ============================================================

-- Profiles: 所有人可读，用户自己可编辑
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles_select" ON profiles FOR SELECT USING (true);
CREATE POLICY "profiles_insert" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "profiles_delete_admin" ON profiles FOR DELETE USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Stories: 所有人可读已发布，管理员可CRUD
ALTER TABLE stories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "stories_select_published" ON stories FOR SELECT USING (published = true);
CREATE POLICY "stories_select_all" ON stories FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "stories_insert_admin" ON stories FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "stories_update_admin" ON stories FOR UPDATE USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "stories_delete_admin" ON stories FOR DELETE USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Photos: 所有人可读，管理员可CRUD
ALTER TABLE photos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "photos_select" ON photos FOR SELECT USING (true);
CREATE POLICY "photos_insert_admin" ON photos FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "photos_delete_admin" ON photos FOR DELETE USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Videos: 所有人可读，管理员可CRUD
ALTER TABLE videos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "videos_select" ON videos FOR SELECT USING (true);
CREATE POLICY "videos_insert_admin" ON videos FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "videos_update_admin" ON videos FOR UPDATE USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "videos_delete_admin" ON videos FOR DELETE USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Blessings: 所有人可读，登录用户可创建，作者或管理员可删除
ALTER TABLE blessings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "blessings_select" ON blessings FOR SELECT USING (true);
CREATE POLICY "blessings_insert" ON blessings FOR INSERT WITH CHECK (true);
CREATE POLICY "blessings_delete_own" ON blessings FOR DELETE USING (
  auth.uid() = user_id OR
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Comments: 所有人可读，登录用户可创建，作者或管理员可删除
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "comments_select" ON comments FOR SELECT USING (true);
CREATE POLICY "comments_insert_auth" ON comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "comments_delete_own" ON comments FOR DELETE USING (
  auth.uid() = user_id OR
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- ============================================================
-- 祝福和评论表新增IP/设备字段
-- ============================================================
ALTER TABLE blessings ADD COLUMN IF NOT EXISTS ip_address TEXT DEFAULT '';
ALTER TABLE blessings ADD COLUMN IF NOT EXISTS ip_location TEXT DEFAULT '';
ALTER TABLE blessings ADD COLUMN IF NOT EXISTS device_info TEXT DEFAULT '';
ALTER TABLE comments ADD COLUMN IF NOT EXISTS ip_address TEXT DEFAULT '';
ALTER TABLE comments ADD COLUMN IF NOT EXISTS ip_location TEXT DEFAULT '';
ALTER TABLE comments ADD COLUMN IF NOT EXISTS device_info TEXT DEFAULT '';

-- ============================================================
-- 故事表新增媒体字段（如果表已存在则需要执行）
-- ============================================================
ALTER TABLE stories ADD COLUMN IF NOT EXISTS media_url TEXT DEFAULT '';
ALTER TABLE stories ADD COLUMN IF NOT EXISTS media_type VARCHAR(10) DEFAULT '' CHECK (media_type IN ('', 'image', 'video'));

-- ============================================================
-- 视频表新增 oss_key 字段
-- ============================================================
ALTER TABLE videos ADD COLUMN IF NOT EXISTS oss_key TEXT DEFAULT '';

-- ============================================================
-- 索引
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_stories_published ON stories(published);
CREATE INDEX IF NOT EXISTS idx_stories_story_date ON stories(story_date DESC);
CREATE INDEX IF NOT EXISTS idx_photos_created_at ON photos(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_videos_created_at ON videos(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_blessings_created_at ON blessings(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_comments_story_id ON comments(story_id);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);

-- ============================================================
-- 更新 updated_at 触发器
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_profiles_updated_at ON profiles;
CREATE TRIGGER trg_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trg_stories_updated_at ON stories;
CREATE TRIGGER trg_stories_updated_at BEFORE UPDATE ON stories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trg_videos_updated_at ON videos;
CREATE TRIGGER trg_videos_updated_at BEFORE UPDATE ON videos
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- 音乐播放列表
-- ============================================================
CREATE TABLE IF NOT EXISTS music (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(300) NOT NULL,
  artist VARCHAR(300) DEFAULT '',
  url TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE music ENABLE ROW LEVEL SECURITY;
CREATE POLICY "music_select" ON music FOR SELECT USING (true);
CREATE POLICY "music_insert_admin" ON music FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "music_update_admin" ON music FOR UPDATE USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "music_delete_admin" ON music FOR DELETE USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

CREATE INDEX IF NOT EXISTS idx_music_active ON music(active);
CREATE INDEX IF NOT EXISTS idx_music_sort_order ON music(sort_order);

-- ============================================================
-- 密码保险箱 Vault
-- ============================================================
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS vault_salt TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS vault_verify TEXT;

CREATE TABLE IF NOT EXISTS passwords (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  category TEXT DEFAULT '未分类',
  title_encrypted TEXT NOT NULL,
  username_encrypted TEXT NOT NULL,
  password_encrypted TEXT NOT NULL,
  url_encrypted TEXT DEFAULT '',
  notes_encrypted TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE passwords ENABLE ROW LEVEL SECURITY;
CREATE POLICY "passwords_select_own" ON passwords FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "passwords_insert_own" ON passwords FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "passwords_update_own" ON passwords FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "passwords_delete_own" ON passwords FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_passwords_user_id ON passwords(user_id);
CREATE INDEX IF NOT EXISTS idx_passwords_created_at ON passwords(created_at DESC);

DROP TRIGGER IF EXISTS trg_passwords_updated_at ON passwords;
CREATE TRIGGER trg_passwords_updated_at BEFORE UPDATE ON passwords
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

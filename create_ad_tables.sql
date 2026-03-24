-- 广告功能数据库Schema

-- 1. 创建广告表
CREATE TABLE IF NOT EXISTS ads (
  id BIGSERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  image_url TEXT,
  link_url TEXT,              -- 广告点击后的跳转链接
  duration_seconds INTEGER DEFAULT 5,  -- 广告展示时长（秒）
  is_active BOOLEAN DEFAULT true,     -- 是否启用
  display_order INTEGER DEFAULT 0,    -- 显示顺序
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. 创建广告统计表
CREATE TABLE IF NOT EXISTS ad_analytics (
  id BIGSERIAL PRIMARY KEY,
  ad_id BIGINT REFERENCES ads(id) ON DELETE CASCADE,
  user_id TEXT,              -- 用户标识符（来自survey_user_id）
  action_type VARCHAR(50) NOT NULL,  -- 操作类型: 'view', 'click', 'skip'
  action_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  session_id TEXT,           -- 会话ID，用于统计单次访问
  ip_address TEXT,           -- IP地址（可选）
  user_agent TEXT           -- 用户代理信息（可选）
);

-- 3. 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_ads_active ON ads(is_active, display_order);
CREATE INDEX IF NOT EXISTS idx_ad_analytics_ad_id ON ad_analytics(ad_id);
CREATE INDEX IF NOT EXISTS idx_ad_analytics_action_time ON ad_analytics(action_time);
CREATE INDEX IF NOT EXISTS idx_ad_analytics_user_id ON ad_analytics(user_id);

-- 4. 插入示例广告数据
INSERT INTO ads (title, description, image_url, link_url, duration_seconds, is_active, display_order)
VALUES 
  ('欢迎使用考研交流平台', '这里有最优质的考研资源等你来发现', NULL, 'https://example.com', 5, true, 1),
  ('限时免费课程', '转发给5位好友即可免费获取高联考研择校三节课', NULL, 'https://example.com', 5, false, 2)
ON CONFLICT DO NOTHING;

-- 5. 查看表结构确认
SELECT 'ads table structure:' as info;
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'ads' 
ORDER BY ordinal_position;

SELECT 'ad_analytics table structure:' as info;
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'ad_analytics' 
ORDER BY ordinal_position;

-- 6. 创建获取活跃广告的函数
CREATE OR REPLACE FUNCTION get_active_ad()
RETURNS TABLE (
  id BIGINT,
  title VARCHAR(255),
  description TEXT,
  image_url TEXT,
  link_url TEXT,
  duration_seconds INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    a.id,
    a.title,
    a.description,
    a.image_url,
    a.link_url,
    a.duration_seconds
  FROM ads a
  WHERE a.is_active = true
  ORDER BY a.display_order ASC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql;
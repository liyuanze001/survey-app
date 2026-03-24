-- 广告功能数据库修复脚本

-- 1. 先删除已存在的表（如果存在）
DROP TABLE IF EXISTS ad_analytics CASCADE;
DROP TABLE IF EXISTS ads CASCADE;

-- 2. 创建广告表
CREATE TABLE ads (
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

-- 3. 创建广告统计表
CREATE TABLE ad_analytics (
  id BIGSERIAL PRIMARY KEY,
  ad_id BIGINT REFERENCES ads(id) ON DELETE CASCADE,
  user_id TEXT,              -- 用户标识符（来自survey_user_id）
  action_type VARCHAR(50) NOT NULL,  -- 操作类型: 'view', 'click', 'skip'
  action_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  session_id TEXT,           -- 会话ID，用于统计单次访问
  ip_address TEXT,           -- IP地址（可选）
  user_agent TEXT           -- 用户代理信息（可选）
);

-- 4. 创建索引以提高查询性能
CREATE INDEX idx_ads_active ON ads(is_active, display_order);
CREATE INDEX idx_ad_analytics_ad_id ON ad_analytics(ad_id);
CREATE INDEX idx_ad_analytics_action_time ON ad_analytics(action_time);
CREATE INDEX idx_ad_analytics_user_id ON ad_analytics(user_id);

-- 5. 插入示例广告数据
INSERT INTO ads (title, description, image_url, link_url, duration_seconds, is_active, display_order)
VALUES 
  ('欢迎使用考研交流平台', '这里有最优质的考研资源等你来发现', NULL, 'https://example.com', 5, true, 1),
  ('限时免费课程', '转发给5位好友即可免费获取高联考研择校三节课', NULL, 'https://example.com', 5, false, 2);

-- 6. 为广告表创建RLS策略
ALTER TABLE ads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "任何人都可以插入广告" ON ads
    FOR INSERT WITH CHECK (true);

CREATE POLICY "任何人都可以查看广告" ON ads
    FOR SELECT USING (true);

CREATE POLICY "任何人都可以更新广告" ON ads
    FOR UPDATE USING (true);

CREATE POLICY "任何人都可以删除广告" ON ads
    FOR DELETE USING (true);

-- 7. 为广告统计表创建RLS策略
ALTER TABLE ad_analytics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "任何人都可以插入广告统计" ON ad_analytics
    FOR INSERT WITH CHECK (true);

CREATE POLICY "任何人都可以查看广告统计" ON ad_analytics
    FOR SELECT USING (true);

CREATE POLICY "任何人都可以删除广告统计" ON ad_analytics
    FOR DELETE USING (true);

-- 8. 查看表结构确认
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

-- 9. 创建获取活跃广告的函数
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

-- 10. 测试查询函数
SELECT '测试获取活跃广告:' as info;
SELECT * FROM get_active_ad();
-- 为 answers 表添加 wechat_id 字段
ALTER TABLE answers ADD COLUMN IF NOT EXISTS wechat_id TEXT;

-- 查看表结构确认
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'answers' 
ORDER BY ordinal_position;
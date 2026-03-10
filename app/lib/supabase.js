import { createClient } from '@supabase/supabase-js'

// 使用环境变量配置Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// 验证环境变量
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('缺少Supabase环境变量配置，请检查.env.local文件')
}

// 创建带有错误处理的Supabase客户端
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: true,
    detectSessionInUrl: false
  }
})

// 图片上传辅助函数
export const uploadImageFile = async (file) => {
  try {
    // 验证文件类型
    if (!file || !file.type.startsWith('image/')) {
      throw new Error('请上传有效的图片文件')
    }

    // 生成安全的文件名
    const fileExtension = file.name.split('.').pop()?.toLowerCase() || 'png'
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${fileExtension}`
    
    console.log('开始上传图片到Supabase Storage...')
    console.log('原始文件对象信息:', {
      name: file.name,
      type: file.type,
      size: file.size
    })
    
    // 直接使用File对象上传，确保MIME类型正确
    const { data, error } = await supabase.storage
      .from('survey-images')
      .upload(fileName, file, {
        contentType: file.type || 'image/png',
        upsert: false,
        cacheControl: '3600'
      })
    
    if (error) {
      console.error('Supabase Storage上传错误详情:', error)
      
      if (error.message.includes('bucket') || error.message.includes('Bucket')) {
        throw new Error('存储桶不存在，请先在Supabase中创建survey-images存储桶')
      }
      
      if (error.message.includes('Malformed')) {
        throw new Error('文件格式错误，请检查上传的文件是否为有效图片')
      }
      
      throw error
    }
    
    console.log('图片上传成功，文件路径:', data.path)
    
    // 获取公共URL
    const { data: { publicUrl } } = supabase.storage
      .from('survey-images')
      .getPublicUrl(data.path)
    
    console.log('生成的图片URL:', publicUrl)
    
    // 立即验证URL
    if (!publicUrl || !publicUrl.startsWith('http')) {
      throw new Error('生成的图片URL无效')
    }
    
    return { publicUrl, fileName: data.path }
  } catch (error) {
    console.error('图片上传失败:', error.message)
    throw error
  }
}

// 测试连接函数
export const testSupabaseConnection = async () => {
  try {
    const { data, error } = await supabase.from('questions').select('*').limit(1)
    if (error) {
      throw new Error(`连接测试失败: ${error.message}`)
    }
    return { success: true, data }
  } catch (error) {
    return { success: false, error: error.message }
  }
}
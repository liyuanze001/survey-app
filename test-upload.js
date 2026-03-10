// 测试图片上传功能
const { supabase, uploadImageFile } = require('./app/lib/supabase.js')

async function testUpload() {
  console.log('开始测试图片上传功能...')
  
  try {
    // 创建一个虚拟的图片文件进行测试
    const fakeImageData = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==', 'base64')
    
    const fakeFile = {
      name: 'test.png',
      type: 'image/png',
      size: fakeImageData.length,
      arrayBuffer: () => Promise.resolve(fakeImageData.buffer)
    }
    
    console.log('虚拟文件信息:', {
      name: fakeFile.name,
      type: fakeFile.type,
      size: fakeFile.size
    })
    
    // 测试上传
    const result = await uploadImageFile(fakeFile)
    console.log('✅ 图片上传成功!')
    console.log('文件路径:', result.fileName)
    console.log('公共URL:', result.publicUrl)
    
  } catch (error) {
    console.error('❌ 图片上传失败:', error.message)
  }
}

testUpload()
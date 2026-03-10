'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { supabase, uploadImageFile } from '../../lib/supabase'

export default function QuestionPage() {
  const params = useParams()
  const questionId = params.id
  
  console.log('路由参数:', params)
  console.log('题目ID:', questionId, '类型:', typeof questionId)
  
  const [question, setQuestion] = useState(null)
  const [answer, setAnswer] = useState('')
  const [wechatId, setWechatId] = useState('')
  const [imageFiles, setImageFiles] = useState([])
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [userId, setUserId] = useState(null)

  // 生成或获取用户标识符
  const getOrCreateUserId = async () => {
    try {
      // 检查本地存储中是否有用户标识符
      let storedUserId = localStorage.getItem('survey_user_id')
      
      if (storedUserId) {
        // 验证用户是否存在于 profiles 表
        const { data, error } = await supabase
          .from('profiles')
          .select('id')
          .eq('id', storedUserId)
          .single()
        
        if (!error && data) {
          setUserId(storedUserId)
          return storedUserId
        }
      }

      // 生成一个临时的用户标识符（不需要创建profiles记录）
      const tempUserId = `temp_${Date.now()}_${Math.random().toString(36).substring(7)}`
      
      // 保存到本地存储
      localStorage.setItem('survey_user_id', tempUserId)
      setUserId(tempUserId)
      return tempUserId
      
    } catch (error) {
      console.error('用户标识符处理失败:', error.message)
      
      // 如果创建profiles记录失败，也使用临时标识符
      const tempUserId = `temp_${Date.now()}_${Math.random().toString(36).substring(7)}`
      localStorage.setItem('survey_user_id', tempUserId)
      setUserId(tempUserId)
      return tempUserId
    }
  }

  // 获取题目信息
  const fetchQuestion = async () => {
    try {
      const { data, error } = await supabase
        .from('questions')
        .select('*')
        .eq('id', questionId)
        .single()
      
      if (error) throw error
      setQuestion(data)
    } catch (error) {
      console.error('获取题目失败:', error.message)
      setMessage('题目不存在或获取失败')
    }
  }

  // 上传图片到Supabase Storage - 使用统一的辅助函数
  const uploadImages = async (files) => {
    const uploadedUrls = []
    
    for (const file of files) {
      try {
        const result = await uploadImageFile(file)
        uploadedUrls.push(result.publicUrl)
      } catch (error) {
        console.error('图片上传失败:', error.message)
        throw error
      }
    }
    
    return uploadedUrls
  }

  // 处理表单提交
  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    try {
      // 验证输入
      if (!answer.trim()) {
        throw new Error('请填写回答内容')
      }

      // 获取或创建用户标识符
      const currentUserId = await getOrCreateUserId()

      // 上传图片
      let imageUrls = []
      if (imageFiles.length > 0) {
        imageUrls = await uploadImages(imageFiles)
      }

      // 保存回答到 answers 表
      const { data: answerData, error: answerError } = await supabase
        .from('answers')
        .insert([
          {
            question_id: questionId,
            text_content: answer.trim(),
            wechat_id: wechatId.trim() || null
            // 移除profile_id，因为现在使用临时用户标识符
          }
        ])
        .select()
        .single()

      if (answerError) throw answerError

      // 保存图片到 answer_images 表
      if (imageUrls.length > 0) {
        const imageRecords = imageUrls.map(url => ({
          answer_id: answerData.id,
          image_url: url
        }))

        const { error: imageError } = await supabase
          .from('answer_images')
          .insert(imageRecords)

        if (imageError) throw imageError
      }

      // 重置表单
      setAnswer('')
      setWechatId('')
      setImageFiles([])
      setMessage('回答提交成功！感谢您的参与。')
      
    } catch (error) {
      console.error('提交失败:', error.message)
      setMessage('提交失败: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  // 处理图片文件选择
  const handleImageChange = (e) => {
    const files = Array.from(e.target.files)
    
    // 限制最多2张图片
    if (files.length + imageFiles.length > 2) {
      setMessage('最多只能上传2张图片')
      return
    }
    
    setImageFiles(prev => [...prev, ...files])
  }

  // 移除已选择的图片
  const removeImage = (index) => {
    setImageFiles(prev => prev.filter((_, i) => i !== index))
  }

  useEffect(() => {
    if (questionId) {
      fetchQuestion()
    }
  }, [questionId])

  if (!question) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="text-center py-8">
          <p className="text-gray-500">
            {message || '加载中...'}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto p-4 sm:p-6">
      <h1 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-6">答题页面</h1>
      
      {/* 题目展示 */}
      <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 mb-4 sm:mb-6">
        <h2 className="text-lg sm:text-xl font-semibold mb-2">{question.title}</h2>
        {question.description && (
          <p className="text-gray-600 text-sm sm:text-base mb-3 sm:mb-4 leading-relaxed">{question.description}</p>
        )}
        {question.image_url && (
          <div className="mb-3 sm:mb-4">
            <a 
              href={question.image_url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="block"
            >
              <img
                src={question.image_url}
                alt={question.title}
                className="w-full h-auto rounded cursor-pointer hover:opacity-90 transition-opacity"
                crossOrigin="anonymous"
                loading="lazy"
                onError={(e) => {
                  console.error('题目图片加载失败:', question.image_url);
                  e.target.style.display = 'none';
                }}
              />
            </a>
            <p className="text-xs text-gray-500 mt-1">点击图片查看大图</p>
          </div>
        )}
      </div>
      
      {/* 回答表单 */}
      <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
        <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4">填写您的回答</h2>
        
        <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
          <div>
            <label htmlFor="answer" className="block text-sm font-medium text-gray-700 mb-1">
              回答内容 *
            </label>
            <textarea
              id="answer"
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              required
              rows={5}
              className="w-full px-3 py-3 text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              placeholder="请输入您的回答..."
            />
          </div>
          
          <div>
            <label htmlFor="wechat" className="block text-sm font-medium text-gray-700 mb-1">
              微信号（选填）
            </label>
            <input
              type="text"
              id="wechat"
              value={wechatId}
              onChange={(e) => setWechatId(e.target.value)}
              className="w-full px-3 py-3 text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              placeholder="请输入您的微信号（可选）"
            />
            <p className="text-xs sm:text-sm text-gray-500 mt-1">留下微信号后，网站作者会建立考研内部交流群</p>
          </div>
          
          <div>
            <label htmlFor="images" className="block text-sm font-medium text-gray-700 mb-1">
              上传图片（最多2张）
            </label>
            <input
              type="file"
              id="images"
              accept="image/*"
              multiple
              onChange={handleImageChange}
              disabled={imageFiles.length >= 2}
              className="w-full px-3 py-3 text-base border border-gray-300 rounded-lg file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors disabled:opacity-50"
            />
            <p className="text-xs sm:text-sm text-gray-500 mt-1">
              已选择 {imageFiles.length}/2 张图片
            </p>
            
            {/* 预览已选择的图片 */}
            {imageFiles.length > 0 && (
              <div className="mt-3 space-y-2">
                {imageFiles.map((file, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm truncate flex-1 mr-2">{file.name}</span>
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="text-red-500 hover:text-red-700 text-sm font-medium px-3 py-1 rounded active:bg-red-50 transition-colors"
                    >
                      移除
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg text-base font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 active:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? '提交中...' : '提交回答'}
          </button>
          
          {message && (
            <div className={`p-3 rounded-md ${message.includes('失败') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
              {message}
            </div>
          )}
        </form>
      </div>
    </div>
  )
}
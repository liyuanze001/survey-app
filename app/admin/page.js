'use client'

import { useState, useEffect } from 'react'
import { supabase, uploadImageFile } from '../lib/supabase'


export default function AdminPage() {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [imageFile, setImageFile] = useState(null)
  const [questions, setQuestions] = useState([])
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [deletingQuestion, setDeletingQuestion] = useState(null)

  // 获取已创建的题目列表
  const fetchQuestions = async () => {
    try {
      console.log('开始获取题目列表...')
      
      // 测试Supabase连接
      const { data, error } = await supabase
        .from('questions')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (error) {
        console.error('Supabase查询错误:', error)
        throw new Error(`数据库查询失败: ${error.message}`)
      }
      
      console.log('成功获取题目数量:', data?.length || 0)
      setQuestions(data || [])
    } catch (error) {
      console.error('获取题目列表失败:', error)
      
      // 更详细的错误分类处理
      if (error.message.includes('网络') || error.message.includes('Network')) {
        setMessage('获取题目失败: 网络连接错误，请检查网络连接')
      } else if (error.message.includes('数据库') || error.message.includes('Supabase')) {
        setMessage('获取题目失败: 数据库连接错误，请稍后重试')
      } else {
        setMessage('获取题目失败: ' + error.message)
      }
    }
  }

  // 删除题目
  const deleteQuestion = async (questionId) => {
    if (!confirm('确定要删除这个题目吗？\n\n注意：删除题目会同时删除与该题目相关的所有回答数据！')) {
      return
    }

    setDeletingQuestion(questionId)
    console.log('开始删除题目 ID:', questionId)
    
    try {
      // 首先获取与该题目相关的所有答案ID
      console.log('查询相关答案...')
      const { data: answersData, error: answersQueryError } = await supabase
        .from('answers')
        .select('id')
        .eq('question_id', questionId)
      
      if (answersQueryError) {
        console.error('查询答案错误:', answersQueryError)
        throw answersQueryError
      }
      
      console.log('找到相关答案数量:', answersData?.length || 0)
      
      // 如果有相关答案，删除对应的图片
      if (answersData && answersData.length > 0) {
        const answerIds = answersData.map(answer => answer.id)
        console.log('删除答案图片，答案ID列表:', answerIds)
        
        // 先删除图片数据，再删除答案记录
        const { error: imagesError } = await supabase
          .from('answer_images')
          .delete()
          .in('answer_id', answerIds)
        
        if (imagesError) {
          console.error('删除图片错误:', imagesError)
          throw imagesError
        }
        console.log('图片删除成功')
      }

      // 然后删除与该题目相关的答案
      console.log('删除相关答案...')
      const { error: answersError } = await supabase
        .from('answers')
        .delete()
        .eq('question_id', questionId)

      if (answersError) {
        console.error('删除答案错误:', answersError)
        throw answersError
      }
      console.log('答案删除成功')

      // 最后删除题目本身
      console.log('删除题目...')
      const { error: questionError } = await supabase
        .from('questions')
        .delete()
        .eq('id', questionId)

      if (questionError) {
        console.error('删除题目错误:', questionError)
        throw questionError
      }
      console.log('题目删除成功')

      setMessage('题目删除成功！')
      
      // 刷新题目列表
      await fetchQuestions()
    } catch (error) {
      console.error('删除题目失败:', error)
      
      // 更详细的错误分类处理
      if (error.message.includes('网络') || error.message.includes('Network')) {
        setMessage('删除题目失败: 网络连接错误，请检查网络连接后重试')
      } else if (error.message.includes('数据库') || error.message.includes('Supabase')) {
        setMessage('删除题目失败: 数据库连接错误，请稍后重试')
      } else if (error.message.includes('权限') || error.message.includes('permission')) {
        setMessage('删除题目失败: 权限不足，无法删除题目')
      } else {
        setMessage('删除题目失败: ' + error.message)
      }
    } finally {
      setDeletingQuestion(null)
    }
  }

  useEffect(() => {
    fetchQuestions()
  }, [])

  // 上传图片到Supabase Storage - 使用统一的辅助函数
  const uploadImage = async (file) => {
    try {
      const result = await uploadImageFile(file)
      return result.publicUrl
    } catch (error) {
      console.error('图片上传失败:', error.message)
      throw error
    }
  }

  // 处理表单提交
  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    try {
      let imageUrl = null
      
      // 如果有图片文件，先上传图片
      if (imageFile) {
        console.log('开始上传图片...')
        imageUrl = await uploadImage(imageFile)
        console.log('图片上传成功:', imageUrl)
      }

      console.log('开始保存题目数据...')
      // 保存题目数据到数据库
      const { data, error } = await supabase
        .from('questions')
        .insert([
          {
            title: title.trim(),
            description: description.trim(),
            image_url: imageUrl
          }
        ])
        .select()

      if (error) {
        console.error('Supabase插入错误:', error)
        throw new Error(`数据库保存失败: ${error.message}`)
      }

      console.log('题目创建成功:', data)

      // 重置表单
      setTitle('')
      setDescription('')
      setImageFile(null)
      document.getElementById('image-upload').value = ''
      
      setMessage('题目创建成功！')
      
      // 刷新题目列表
      fetchQuestions()
    } catch (error) {
      console.error('创建题目失败:', error)
      
      // 更详细的错误分类处理
      if (error.message.includes('网络') || error.message.includes('Network')) {
        setMessage('创建题目失败: 网络连接错误，请检查网络连接后重试')
      } else if (error.message.includes('数据库') || error.message.includes('Supabase')) {
        setMessage('创建题目失败: 数据库连接错误，请稍后重试')
      } else if (error.message.includes('存储') || error.message.includes('storage')) {
        setMessage('创建题目失败: 图片上传失败，请尝试重新上传图片')
      } else {
        setMessage('创建题目失败: ' + error.message)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">开发者管理页面</h1>
        <a 
          href="/login"
          className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 text-sm font-medium"
        >
          开发者登录
        </a>
      </div>
      
      {/* 创建题目表单 */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">创建新题目</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
              题目标题
            </label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="请输入题目标题"
            />
          </div>
          
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              题目描述
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="请输入题目描述"
            />
          </div>
          
          <div>
            <label htmlFor="image-upload" className="block text-sm font-medium text-gray-700 mb-1">
              题目图片
            </label>
            <input
              type="file"
              id="image-upload"
              accept="image/*"
              onChange={(e) => setImageFile(e.target.files[0])}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? '创建中...' : '创建题目'}
          </button>
          
          {message && (
            <div className={`p-3 rounded-md ${message.includes('失败') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
              {message}
            </div>
          )}
        </form>
      </div>
      
      {/* 已创建题目列表 */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">已创建的题目</h2>
        
        {questions.length === 0 ? (
          <p className="text-gray-500 text-center py-8">暂无题目，请先创建题目</p>
        ) : (
          <div className="space-y-4">
            {questions.map((question) => (
              <div key={question.id} className="border border-gray-200 rounded-lg p-4 relative">
                <button
                  onClick={() => deleteQuestion(question.id)}
                  disabled={deletingQuestion === question.id}
                  className="absolute top-4 right-4 bg-red-100 text-red-600 p-2 rounded-md hover:bg-red-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  title="删除题目"
                >
                  {deletingQuestion === question.id ? (
                    <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  )}
                </button>
                
                <h3 className="text-lg font-medium mb-2 pr-10">{question.title}</h3>
                <p className="text-gray-600 mb-3">{question.description}</p>
                {question.image_url && (
                  <div className="mt-2">
                    <div className="relative">
                      <img
                        src={question.image_url}
                        alt={question.title}
                        className="max-w-xs max-h-32 object-cover rounded"
                      />
                      <a 
                        href={question.image_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="absolute inset-0"
                      ></a>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">点击图片查看大图</p>
                  </div>
                )}
                <div className="flex justify-between items-center mt-2">
                  <p className="text-sm text-gray-400">
                    创建时间: {new Date(question.created_at).toLocaleString('zh-CN')}
                  </p>
                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                    ID: {question.id}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
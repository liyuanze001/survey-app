'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export default function MyDataPage() {
  const [myAnswers, setMyAnswers] = useState([])
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState(null)

  // 获取当前用户的标识符
  const getUserId = () => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('survey_user_id')
    }
    return null
  }

  // 获取当前用户的回答数据
  const fetchMyAnswers = async () => {
    try {
      setLoading(true)
      const currentUserId = getUserId()
      
      if (!currentUserId) {
        setMyAnswers([])
        return
      }

      setUserId(currentUserId)
      
      const { data, error } = await supabase
        .from('answers')
        .select(`
          *,
          questions (title, description, image_url),
          answer_images (image_url)
        `)
        // 移除profile_id过滤，因为现在使用临时用户标识符
        .order('created_at', { ascending: false })
      
      if (error) throw error
      setMyAnswers(data || [])
    } catch (error) {
      console.error('获取我的回答数据失败:', error.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMyAnswers()
  }, [])

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">加载数据中...</p>
        </div>
      </div>
    )
  }

  if (!userId) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-gray-700 mb-2">未找到用户信息</h3>
          <p className="text-gray-500 mb-4">请先回答题目来创建用户身份</p>
          <a 
            href="/questions"
            className="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
          >
            前往答题
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">我的答题记录</h1>
        <p className="text-gray-600">查看您提交的所有回答记录</p>
      </div>

      {/* 数据统计 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-blue-50 rounded-lg p-4">
          <div className="text-2xl font-bold text-blue-600">{myAnswers.length}</div>
          <div className="text-sm text-blue-800">总回答数</div>
        </div>
        <div className="bg-green-50 rounded-lg p-4">
          <div className="text-2xl font-bold text-green-600">
            {new Set(myAnswers.map(a => a.question_id)).size}
          </div>
          <div className="text-sm text-green-800">回答题目数</div>
        </div>
        <div className="bg-purple-50 rounded-lg p-4">
          <div className="text-2xl font-bold text-purple-600">
            {myAnswers.filter(a => a.answer_images && a.answer_images.length > 0).length}
          </div>
          <div className="text-sm text-purple-800">包含图片的回答</div>
        </div>
      </div>

      {/* 我的回答列表 */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {myAnswers.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">暂无回答记录</h3>
            <p className="text-gray-500 mb-4">您还没有提交过任何回答</p>
            <a 
              href="/questions"
              className="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
            >
              开始答题
            </a>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {myAnswers.map((answer) => (
              <div key={answer.id} className="p-6 hover:bg-gray-50">
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-1">
                          {answer.questions?.title || `题目 #${answer.question_id}`}
                        </h3>
                        <span className="inline-block bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded">
                          题目 #{answer.question_id}
                        </span>
                      </div>
                      <span className="text-sm text-gray-500 whitespace-nowrap">
                        {new Date(answer.created_at).toLocaleString('zh-CN')}
                      </span>
                    </div>
                    
                    {answer.questions?.description && (
                      <p className="text-gray-600 text-sm mb-3">
                        {answer.questions.description}
                      </p>
                    )}
                    
                    <div className="mb-3">
                      <h4 className="text-sm font-medium text-gray-700 mb-1">您的回答：</h4>
                      <p className="text-gray-900 bg-gray-50 rounded p-3 text-sm">
                        {answer.text_content || '无文字回答'}
                      </p>
                    </div>
                    
                    {answer.answer_images && answer.answer_images.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-2">上传的图片 ({answer.answer_images.length} 张)：</h4>
                        <div className="flex flex-wrap gap-2">
                          {answer.answer_images.map((img, index) => (
                            <a 
                              key={index}
                              href={img.image_url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                            >
                              <img
                                src={img.image_url}
                                alt={`回答图片 ${index + 1}`}
                                className="w-20 h-20 object-cover rounded cursor-pointer border hover:opacity-90"
                                crossOrigin="anonymous"
                                onError={(e) => {
                                  console.error('回答图片加载失败:', img.image_url);
                                  e.target.style.display = 'none';
                                }}
                              />
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 权限说明 */}
      <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-start">
          <svg className="w-5 h-5 text-yellow-600 mt-0.5 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          <div>
            <h4 className="text-sm font-medium text-yellow-900 mb-1">权限说明</h4>
            <p className="text-sm text-yellow-700">
              此页面仅显示您个人的回答记录。如需查看所有用户的数据，请联系管理员。
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
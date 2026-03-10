'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { supabase } from '../lib/supabase'

export default function QuestionsListPage() {
  const [questions, setQuestions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // 获取所有题目列表
  const fetchQuestions = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('questions')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (error) throw error
      setQuestions(data || [])
    } catch (error) {
      console.error('获取题目列表失败:', error.message)
      setError('获取题目列表失败，请稍后重试')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchQuestions()
  }, [])

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">加载题目列表中...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <p>{error}</p>
          <button 
            onClick={fetchQuestions}
            className="mt-2 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
          >
            重新加载
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6">
      <div className="text-center mb-6 sm:mb-8">
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 mb-2 leading-tight">题目交流网站：考研方向专为计算机类（包括人工智能、软件工程、大数据等）方向的内部交流网站</h1>
        <p className="text-sm sm:text-base text-gray-600 leading-relaxed">对以下问题愿意提供想法的同学可以选择任意题目作答，并留下微信号，之后网站作者会建立考研内部交流群；另外，若将此网站转发给至少五名有相关考研方向准备的同学，截图发给vx：shiyuanne123，可免费获得高联考研择校三节课</p>
      </div>

      {questions.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <div className="text-gray-400 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-gray-700 mb-2">暂无题目</h3>
          <p className="text-gray-500 mb-4">目前还没有可用的题目，请联系管理员创建题目</p>
          <Link 
            href="/admin"
            className="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
          >
            前往管理员页面
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 sm:gap-6 md:grid-cols-2">
          {questions.map((question) => (
            <Link 
              key={question.id}
              href={`/questions/${question.id}`}
              className="block bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 overflow-hidden active:scale-95 active:shadow-md"
            >
              <div className="p-4 sm:p-6">
                <div className="flex items-start justify-between mb-3 sm:mb-4">
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900 line-clamp-2 leading-snug">
                    {question.title}
                  </h3>
                  <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded-full ml-2 flex-shrink-0 min-w-[60px] text-center">
                    题目 #{question.id}
                  </span>
                </div>
                
                {question.description && (
                  <p className="text-gray-600 text-sm sm:text-base mb-3 sm:mb-4 line-clamp-3 leading-relaxed">
                    {question.description}
                  </p>
                )}
                
                {question.image_url && (
                  <div className="mb-3 sm:mb-4">
                    <img
                      src={question.image_url}
                      alt={question.title}
                      className="w-full h-24 sm:h-32 object-cover rounded-lg"
                      loading="lazy"
                    />
                  </div>
                )}
                
                <div className="flex items-center justify-between">
                  <span className="text-xs sm:text-sm text-gray-500">
                    {new Date(question.created_at).toLocaleDateString('zh-CN')}
                  </span>
                  <div className="bg-green-100 text-green-800 text-xs font-medium px-3 py-1 rounded-full whitespace-nowrap">
                    开始答题 →
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* 底部说明 */}
      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start">
          <svg className="w-5 h-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          <div>
            <h4 className="text-sm font-medium text-blue-900 mb-1">答题说明</h4>
            <p className="text-sm text-blue-700">
              点击题目卡片进入答题页面，每个题目只能回答一次。答题过程中可以上传图片（最多2张），回答内容将自动保存。
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
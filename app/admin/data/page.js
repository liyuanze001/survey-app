'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabase'

export default function AdminDataPage() {
  const [answers, setAnswers] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedQuestion, setSelectedQuestion] = useState('all')
  const [questions, setQuestions] = useState([])
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [authChecked, setAuthChecked] = useState(false)
  const router = useRouter()

  // 检查登录状态
  useEffect(() => {
    const checkAuth = () => {
      const loggedIn = localStorage.getItem('developer_logged_in') === 'true'
      const loginTime = localStorage.getItem('developer_login_time')
      
      // 检查登录是否在24小时内
      if (loggedIn && loginTime) {
        const timeDiff = Date.now() - parseInt(loginTime)
        if (timeDiff < 24 * 60 * 60 * 1000) { // 24小时
          setIsAuthenticated(true)
          setAuthChecked(true)
          return
        }
      }
      
      // 未登录或登录过期，跳转到登录页面
      setIsAuthenticated(false)
      setAuthChecked(true)
      router.push('/login')
    }

    checkAuth()
  }, [router])

  // 获取所有题目
  const fetchQuestions = async () => {
    try {
      const { data, error } = await supabase
        .from('questions')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (error) throw error
      setQuestions(data || [])
    } catch (error) {
      console.error('获取题目列表失败:', error.message)
    }
  }

  // 获取所有回答数据
  const fetchAnswers = async () => {
    try {
      setLoading(true)
      
      let query = supabase
        .from('answers')
        .select(`
          *,
          profiles (name, student_no, created_at),
          questions (title, description, image_url),
          answer_images (image_url)
        `)
        .order('created_at', { ascending: false })

      // 如果选择了特定题目，添加筛选条件
      if (selectedQuestion !== 'all') {
        query = query.eq('question_id', selectedQuestion)
      }

      const { data, error } = await query
      
      if (error) throw error
      setAnswers(data || [])
    } catch (error) {
      console.error('获取回答数据失败:', error.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isAuthenticated) {
      fetchQuestions()
      fetchAnswers()
    }
  }, [selectedQuestion, isAuthenticated])

  // 导出数据为CSV
  const exportToCSV = () => {
    const headers = ['题目ID', '题目标题', '用户姓名', '学号', '回答内容', '图片数量', '提交时间']
    const csvData = answers.map(answer => [
      answer.question_id,
      answer.questions?.title || '',
      answer.profiles?.name || '匿名',
      answer.profiles?.student_no || '未填写',
      `"${answer.text_content?.replace(/"/g, '""') || ''}"`,
      answer.answer_images?.length || 0,
      new Date(answer.created_at).toLocaleString('zh-CN')
    ])

    const csvContent = [headers, ...csvData]
      .map(row => row.join(','))
      .join('\n')

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `survey_data_${new Date().toISOString().split('T')[0]}.csv`
    link.click()
  }

  // 退出登录
  const handleLogout = () => {
    localStorage.removeItem('developer_logged_in')
    localStorage.removeItem('developer_login_time')
    router.push('/login')
  }

  if (!authChecked) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">验证登录状态中...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">跳转到登录页面...</p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">加载数据中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">用户答题数据</h1>
          <p className="text-gray-600">查看所有用户提交的答题数据</p>
        </div>
        <div className="flex gap-2">
          <a 
            href="/admin"
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 text-sm font-medium"
          >
            返回管理页面
          </a>
          <button
            onClick={handleLogout}
            className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 text-sm font-medium"
          >
            退出登录
          </button>
        </div>
      </div>

      {/* 筛选控件 */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="flex items-center gap-4">
            <label htmlFor="question-filter" className="text-sm font-medium text-gray-700">
              筛选题目：
            </label>
            <select
              id="question-filter"
              value={selectedQuestion}
              onChange={(e) => setSelectedQuestion(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm"
            >
              <option value="all">所有题目</option>
              {questions.map(question => (
                <option key={question.id} value={question.id}>
                  #{question.id} - {question.title}
                </option>
              ))}
            </select>
          </div>
          
          <button
            onClick={exportToCSV}
            className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 text-sm font-medium"
          >
            导出CSV数据
          </button>
        </div>
        
        <div className="mt-4 text-sm text-gray-500">
          共找到 {answers.length} 条回答记录
        </div>
      </div>

      {/* 数据表格 */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {answers.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">暂无数据</h3>
            <p className="text-gray-500">当前没有用户提交的回答数据</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    题目
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    用户信息
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    回答内容
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    图片
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    提交时间
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {answers.map((answer) => (
                  <tr key={answer.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        #{answer.question_id}
                      </div>
                      <div className="text-sm text-gray-500">
                        {answer.questions?.title}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {answer.profiles?.name || '匿名'}
                      </div>
                      <div className="text-sm text-gray-500">
                        {answer.profiles?.student_no || '未填写学号'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 max-w-xs truncate">
                        {answer.text_content || '无文字回答'}
                      </div>
                      {answer.text_content && answer.text_content.length > 50 && (
                        <button
                          onClick={() => alert(answer.text_content)}
                          className="text-blue-600 text-xs hover:text-blue-800 mt-1"
                        >
                          查看完整内容
                        </button>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {answer.answer_images?.length || 0} 张
                      </div>
                      {answer.answer_images && answer.answer_images.length > 0 && (
                        <div className="flex space-x-1 mt-1">
                          {answer.answer_images.slice(0, 3).map((img, index) => (
                            <img
                              key={index}
                              src={img.image_url}
                              alt={`图片 ${index + 1}`}
                              className="w-8 h-8 object-cover rounded cursor-pointer"
                              onClick={() => window.open(img.image_url, '_blank')}
                            />
                          ))}
                          {answer.answer_images.length > 3 && (
                            <span className="text-xs text-gray-500">
                              +{answer.answer_images.length - 3}
                            </span>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(answer.created_at).toLocaleString('zh-CN')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 数据统计 */}
      {answers.length > 0 && (
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="text-2xl font-bold text-blue-600">{answers.length}</div>
            <div className="text-sm text-blue-800">总回答数</div>
          </div>
          <div className="bg-green-50 rounded-lg p-4">
            <div className="text-2xl font-bold text-green-600">
              {new Set(answers.map(a => a.profile_id)).size}
            </div>
            <div className="text-sm text-green-800">参与用户数</div>
          </div>
          <div className="bg-purple-50 rounded-lg p-4">
            <div className="text-2xl font-bold text-purple-600">
              {answers.filter(a => a.answer_images && a.answer_images.length > 0).length}
            </div>
            <div className="text-sm text-purple-800">包含图片的回答</div>
          </div>
        </div>
      )}
    </div>
  )
}
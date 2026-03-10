'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      // 验证特定的开发者账号
      if (email === '15853964861@163.com' && password === 'jiangkexin1001') {
        // 存储登录状态到localStorage
        localStorage.setItem('developer_logged_in', 'true')
        localStorage.setItem('developer_login_time', Date.now().toString())
        
        // 跳转到管理员数据页面
        router.push('/admin/data')
      } else {
        setError('账号或密码错误')
        return // 立即返回，不继续执行
      }
    } catch (error) {
      console.error('登录失败:', error)
      
      // 更详细的错误分类处理
      if (error.message.includes('router') || error.message.includes('导航')) {
        setError('登录失败: 页面跳转错误，请刷新页面后重试')
      } else if (error.message.includes('localStorage') || error.message.includes('存储')) {
        setError('登录失败: 浏览器存储错误，请检查浏览器设置')
      } else {
        setError('登录失败: 系统错误，请重试')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            开发者登录
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            请输入开发者账号密码查看所有数据
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleLogin}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="email" className="sr-only">邮箱地址</label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="邮箱地址"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">密码</label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="密码"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          {error && (
            <div className="text-red-600 text-sm text-center">{error}</div>
          )}

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {loading ? '登录中...' : '登录'}
            </button>
          </div>

          <div className="text-center">
            <a 
              href="/questions" 
              className="text-indigo-600 hover:text-indigo-500 text-sm"
            >
              返回题目列表
            </a>
          </div>
        </form>

        <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-md p-4 text-sm text-yellow-800">
          <strong>注意：</strong>此页面仅供开发者使用。普通用户可直接访问题目页面进行回答。
        </div>
      </div>
    </div>
  )
}
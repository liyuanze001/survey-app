'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../lib/supabase'

export default function AdPage() {
  const router = useRouter()
  const [adData, setAdData] = useState(null)
  const [countdown, setCountdown] = useState(5)
  const [loading, setLoading] = useState(true)
  const [sessionId] = useState(`session_${Date.now()}_${Math.random().toString(36).substring(7)}`)
  const [userId, setUserId] = useState(null)

  // 获取用户标识符
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedUserId = localStorage.getItem('survey_user_id')
      if (storedUserId) {
        setUserId(storedUserId)
      } else {
        const newUserId = `temp_${Date.now()}_${Math.random().toString(36).substring(7)}`
        localStorage.setItem('survey_user_id', newUserId)
        setUserId(newUserId)
      }
    }
  }, [])

  // 获取广告数据
  useEffect(() => {
    const fetchAd = async () => {
      try {
        const { data, error } = await supabase
          .from('ads')
          .select('*')
          .eq('is_active', true)
          .order('display_order', { ascending: true })
          .limit(1)

        if (error) throw error
        setAdData(data && data.length > 0 ? data[0] : null)
        
        // 记录广告查看事件
        if (data && data.length > 0) {
          await recordAdEvent(data[0].id, 'view')
        }
      } catch (error) {
        console.error('获取广告失败:', error.message)
      } finally {
        setLoading(false)
      }
    }

    fetchAd()
  }, [])

  // 记录广告事件
  const recordAdEvent = async (adId, actionType) => {
    if (!userId) return

    try {
      await supabase.from('ad_analytics').insert([
        {
          ad_id: adId,
          user_id: userId,
          action_type: actionType,
          session_id: sessionId,
          user_agent: navigator.userAgent
        }
      ])
    } catch (error) {
      console.error('记录广告事件失败:', error.message)
    }
  }

  // 倒计时逻辑
  useEffect(() => {
    if (countdown > 0 && !loading) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1)
      }, 1000)
      return () => clearTimeout(timer)
    } else if (countdown === 0) {
      // 记录跳过事件（自动跳过）
      if (adData) {
        recordAdEvent(adData.id, 'skip')
      }
      // 跳转到题目页面
      router.push('/questions')
    }
  }, [countdown, loading, adData, router])

  // 手动跳过广告
  const handleSkip = async () => {
    if (adData) {
      await recordAdEvent(adData.id, 'skip')
    }
    router.push('/questions')
  }

  // 点击广告
  const handleAdClick = async () => {
    if (adData) {
      await recordAdEvent(adData.id, 'click')
      if (adData.link_url) {
        window.open(adData.link_url, '_blank')
      }
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white">加载中...</p>
        </div>
      </div>
    )
  }

  // 如果没有广告，直接跳转
  if (!adData) {
    router.push('/questions')
    return null
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-600 to-blue-600">
      <div className="max-w-4xl w-full mx-4">
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          {/* 广告内容 */}
          <div 
            className="cursor-pointer transform hover:scale-105 transition-transform duration-300"
            onClick={handleAdClick}
          >
            {adData.image_url ? (
              <img
                src={adData.image_url}
                alt={adData.title}
                className="w-full h-64 sm:h-96 object-cover"
              />
            ) : (
              <div className="h-64 sm:h-96 bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                <div className="text-center text-white">
                  <svg className="w-20 h-20 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
                  </svg>
                  <h2 className="text-2xl font-bold">点击查看详情</h2>
                </div>
              </div>
            )}
          </div>

          {/* 广告信息 */}
          <div className="p-6 sm:p-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">
              {adData.title}
            </h1>
            {adData.description && (
              <p className="text-gray-600 mb-6 leading-relaxed">
                {adData.description}
              </p>
            )}

            {/* 倒计时和跳过按钮 */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="bg-blue-100 text-blue-800 px-4 py-2 rounded-full">
                  <span className="font-semibold text-lg">
                    {countdown}
                  </span>
                  <span className="text-sm ml-1">秒后自动跳转</span>
                </div>
              </div>

              <button
                onClick={handleSkip}
                className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-6 py-2 rounded-full transition-colors duration-300 font-medium"
              >
                立即跳过
              </button>
            </div>

            {/* 提示信息 */}
            <p className="mt-4 text-sm text-gray-500 text-center">
              点击广告可查看详情，{countdown}秒后自动跳转到题目页面
            </p>
          </div>
        </div>

        {/* 页脚说明 */}
        <div className="mt-6 text-center">
          <p className="text-white text-sm opacity-80">
            支持我们继续提供优质内容
          </p>
        </div>
      </div>
    </div>
  )
}
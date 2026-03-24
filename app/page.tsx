'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function HomePage() {
  const router = useRouter()

  useEffect(() => {
    // 重定向到广告页面，用户看完广告后会自动跳转到题目页面
    router.push('/ads')
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <p className="text-lg text-gray-600">正在加载广告页面...</p>
      </div>
    </div>
  )
}

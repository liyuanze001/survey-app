import { NextResponse } from 'next/server'

export function middleware(request) {
  // 定义活动时间范围
  const startTime = new Date('2026-03-01T00:00:00Z')
  const endTime = new Date('2026-04-01T00:00:00Z')
  const currentTime = new Date()

  // 检查当前时间是否在活动时间段内
  if (currentTime < startTime || currentTime >= endTime) {
    // 不在活动时间段内，返回403错误
    return new NextResponse('活动已结束', {
      status: 403,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8'
      }
    })
  }

  // 在活动时间段内，允许正常访问
  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * 匹配所有路径，除了以下路径：
     * - api (API路由)
     * - _next/static (静态文件)
     * - _next/image (图片优化)
     * - favicon.ico (网站图标)
     * - admin (管理页面)
     * - questions (答题页面)
     */
    '/((?!api|_next/static|_next/image|favicon\.ico|admin|questions).*)'
  ]
}
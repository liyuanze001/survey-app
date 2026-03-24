'use client'

import { useState, useEffect } from 'react'
import { supabase, uploadImageFile } from '../../lib/supabase'

export default function AdManagementPage() {
  const [ads, setAds] = useState([])
  const [analytics, setAnalytics] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [editingAd, setEditingAd] = useState(null)
  const [message, setMessage] = useState('')

  // 表单状态
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    link_url: '',
    duration_seconds: 5,
    is_active: true,
    display_order: 0,
    image_file: null
  })

  // 获取广告列表
  const fetchAds = async () => {
    try {
      const { data, error } = await supabase
        .from('ads')
        .select('*')
        .order('display_order', { ascending: true })
      
      if (error) throw error
      setAds(data || [])
    } catch (error) {
      console.error('获取广告列表失败:', error.message)
      setMessage('获取广告列表失败: ' + error.message)
    }
  }

  // 获取广告统计数据
  const fetchAnalytics = async () => {
    try {
      const { data, error } = await supabase
        .from('ad_analytics')
        .select(`
          *,
          ads (title)
        `)
        .order('action_time', { ascending: false })
        .limit(50)
      
      if (error) throw error
      setAnalytics(data || [])
    } catch (error) {
      console.error('获取广告统计失败:', error.message)
    }
  }

  // 获取单个广告的统计数据
  const getAdStats = (adId) => {
    return analytics.filter(a => a.ad_id === adId)
  }

  const getAdViewCount = (adId) => {
    return getAdStats(adId).filter(a => a.action_type === 'view').length
  }

  const getAdClickCount = (adId) => {
    return getAdStats(adId).filter(a => a.action_type === 'click').length
  }

  const getAdSkipCount = (adId) => {
    return getAdStats(adId).filter(a => a.action_type === 'skip').length
  }

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      await Promise.all([fetchAds(), fetchAnalytics()])
      setLoading(false)
    }
    fetchData()
  }, [])

  // 创建或更新广告
  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    try {
      let imageUrl = null
      
      // 如果是编辑模式且没有新图片，保留原有图片
      if (editingAd && !formData.image_file) {
        imageUrl = editingAd.image_url
      } 
      // 如果有新图片文件，上传图片
      else if (formData.image_file) {
        const result = await uploadImageFile(formData.image_file)
        imageUrl = result.publicUrl
      }

      // 如果要启用这个广告，先禁用其他所有广告
      if (formData.is_active && (!editingAd || !editingAd.is_active)) {
        const { error: disableError } = await supabase
          .from('ads')
          .update({ is_active: false })
          .neq('id', editingAd?.id || 0)
        
        if (disableError) throw disableError
      }

      const adData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        link_url: formData.link_url.trim(),
        duration_seconds: parseInt(formData.duration_seconds),
        is_active: formData.is_active,
        display_order: parseInt(formData.display_order),
        image_url: imageUrl
      }

      let result
      if (editingAd) {
        // 更新广告
        result = await supabase
          .from('ads')
          .update(adData)
          .eq('id', editingAd.id)
          .select()
      } else {
        // 创建新广告
        result = await supabase
          .from('ads')
          .insert([adData])
          .select()
      }

      if (result.error) throw result.error

      setMessage(editingAd ? '广告更新成功！' : '广告创建成功！')
      resetForm()
      await fetchAds()
    } catch (error) {
      console.error('操作失败:', error.message)
      setMessage('操作失败: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  // 删除广告
  const deleteAd = async (adId) => {
    if (!confirm('确定要删除这个广告吗？删除后相关的统计数据也会被删除。')) {
      return
    }

    try {
      const { error } = await supabase
        .from('ads')
        .delete()
        .eq('id', adId)

      if (error) throw error

      setMessage('广告删除成功！')
      await fetchAds()
      await fetchAnalytics()
    } catch (error) {
      console.error('删除广告失败:', error.message)
      setMessage('删除广告失败: ' + error.message)
    }
  }

  // 编辑广告
  const editAd = (ad) => {
    setEditingAd(ad)
    setFormData({
      title: ad.title,
      description: ad.description || '',
      link_url: ad.link_url || '',
      duration_seconds: ad.duration_seconds,
      is_active: ad.is_active,
      display_order: ad.display_order,
      image_file: null
    })
    setShowCreateForm(true)
  }

  // 一键启用广告（自动禁用其他广告）
  const activateAd = async (adId) => {
    try {
      setLoading(true)
      setMessage('')

      // 先禁用所有广告
      const { error: disableError } = await supabase
        .from('ads')
        .update({ is_active: false })
        .neq('id', adId) // 排除当前要启用的广告

      if (disableError) throw disableError

      // 启用选中的广告
      const { error: activateError } = await supabase
        .from('ads')
        .update({ is_active: true })
        .eq('id', adId)

      if (activateError) throw activateError

      setMessage('广告已启用！')
      await fetchAds()
    } catch (error) {
      console.error('启用广告失败:', error.message)
      setMessage('启用广告失败: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  // 禁用广告
  const deactivateAd = async (adId) => {
    try {
      setLoading(true)
      setMessage('')

      const { error } = await supabase
        .from('ads')
        .update({ is_active: false })
        .eq('id', adId)

      if (error) throw error

      setMessage('广告已禁用！')
      await fetchAds()
    } catch (error) {
      console.error('禁用广告失败:', error.message)
      setMessage('禁用广告失败: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  // 重置表单
  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      link_url: '',
      duration_seconds: 5,
      is_active: true,
      display_order: 0,
      image_file: null
    })
    setEditingAd(null)
    setShowCreateForm(false)
  }

  // 导出统计数据
  const exportAnalytics = () => {
    const headers = ['时间', '广告标题', '操作类型', '用户ID', '会话ID']
    const csvData = analytics.map(a => [
      new Date(a.action_time).toLocaleString('zh-CN'),
      a.ads?.title || '未知广告',
      a.action_type,
      a.user_id,
      a.session_id
    ])

    const csvContent = [headers, ...csvData]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n')

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `ad_analytics_${new Date().toISOString().split('T')[0]}.csv`
    link.click()
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">广告管理</h1>
        <button
          onClick={() => setShowCreateForm(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 text-sm font-medium"
        >
          创建新广告
        </button>
      </div>

      {message && (
        <div className={`mb-4 p-3 rounded-md ${message.includes('失败') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
          {message}
        </div>
      )}

      {/* 创建/编辑广告表单 */}
      {showCreateForm && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">
            {editingAd ? '编辑广告' : '创建新广告'}
          </h2>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                广告标题 *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="请输入广告标题"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                广告描述
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="请输入广告描述"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                广告图片
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setFormData({...formData, image_file: e.target.files[0]})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {editingAd?.image_url && (
                <p className="text-sm text-gray-500 mt-1">
                  当前图片: <a href={editingAd.image_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">查看图片</a>
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                跳转链接
              </label>
              <input
                type="url"
                value={formData.link_url}
                onChange={(e) => setFormData({...formData, link_url: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="https://example.com"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  展示时长（秒）
                </label>
                <input
                  type="number"
                  min="1"
                  max="60"
                  value={formData.duration_seconds}
                  onChange={(e) => setFormData({...formData, duration_seconds: e.target.value})}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  显示顺序
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.display_order}
                  onChange={(e) => setFormData({...formData, display_order: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="is_active"
                checked={formData.is_active}
                onChange={(e) => setFormData({...formData, is_active: e.target.checked})}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="is_active" className="ml-2 text-sm text-gray-700">
                启用此广告
              </label>
            </div>

            <div className="flex space-x-3">
              <button
                type="submit"
                disabled={loading}
                className="bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? '保存中...' : (editingAd ? '更新广告' : '创建广告')}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="bg-gray-200 text-gray-800 py-2 px-4 rounded-md hover:bg-gray-300"
              >
                取消
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 广告列表 */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">广告列表</h2>
        
        {ads.length === 0 ? (
          <p className="text-gray-500 text-center py-8">暂无广告，请先创建广告</p>
        ) : (
          <div className="space-y-4">
            {ads.map((ad) => {
              const viewCount = getAdViewCount(ad.id)
              const clickCount = getAdClickCount(ad.id)
              const skipCount = getAdSkipCount(ad.id)

              return (
                <div key={ad.id} className="border border-gray-200 rounded-lg p-4 relative">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h3 className="text-lg font-medium text-gray-900">
                          {ad.title}
                        </h3>
                        <span className={`text-xs px-2 py-1 rounded-full ${ad.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                          {ad.is_active ? '启用' : '禁用'}
                        </span>
                      </div>
                      {ad.description && (
                        <p className="text-gray-600 text-sm mb-2">{ad.description}</p>
                      )}
                      {ad.link_url && (
                        <p className="text-blue-600 text-sm mb-2">
                          <a href={ad.link_url} target="_blank" rel="noopener noreferrer" className="hover:underline">
                            {ad.link_url}
                          </a>
                        </p>
                      )}
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <span>时长: {ad.duration_seconds}秒</span>
                        <span>顺序: {ad.display_order}</span>
                      </div>
                    </div>
                  </div>

                  {/* 广告图片预览 */}
                  {ad.image_url && (
                    <div className="mt-3 mb-3">
                      <img
                        src={ad.image_url}
                        alt={ad.title}
                        className="max-w-xs max-h-32 object-cover rounded cursor-pointer"
                        onClick={() => window.open(ad.image_url, '_blank')}
                      />
                    </div>
                  )}

                  {/* 统计数据 */}
                  <div className="mt-3 bg-gray-50 rounded p-3">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">统计数据</h4>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div className="text-center">
                        <div className="text-xl font-bold text-blue-600">{viewCount}</div>
                        <div className="text-gray-500">查看</div>
                      </div>
                      <div className="text-center">
                        <div className="text-xl font-bold text-green-600">{clickCount}</div>
                        <div className="text-gray-500">点击</div>
                      </div>
                      <div className="text-center">
                        <div className="text-xl font-bold text-gray-600">{skipCount}</div>
                        <div className="text-gray-500">跳过</div>
                      </div>
                    </div>
                  </div>

                  {/* 操作按钮 */}
                  <div className="mt-4 flex space-x-2">
                    {ad.is_active ? (
                      // 启用状态下的按钮：禁用、编辑、删除
                      <>
                        <button
                          onClick={() => deactivateAd(ad.id)}
                          className="bg-yellow-100 text-yellow-700 px-3 py-1 rounded hover:bg-yellow-200 text-sm"
                          title="禁用此广告"
                        >
                          禁用
                        </button>
                        <button
                          onClick={() => editAd(ad)}
                          className="bg-blue-100 text-blue-700 px-3 py-1 rounded hover:bg-blue-200 text-sm"
                        >
                          编辑
                        </button>
                      </>
                    ) : (
                      // 禁用状态下的按钮：启用、编辑、删除
                      <>
                        <button
                          onClick={() => activateAd(ad.id)}
                          className="bg-green-100 text-green-700 px-3 py-1 rounded hover:bg-green-200 text-sm"
                          title="启用此广告（将禁用其他广告）"
                        >
                          启用
                        </button>
                        <button
                          onClick={() => editAd(ad)}
                          className="bg-blue-100 text-blue-700 px-3 py-1 rounded hover:bg-blue-200 text-sm"
                        >
                          编辑
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => deleteAd(ad.id)}
                      className="bg-red-100 text-red-700 px-3 py-1 rounded hover:bg-red-200 text-sm"
                    >
                      删除
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* 详细统计数据 */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">详细统计数据</h2>
          <button
            onClick={exportAnalytics}
            className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 text-sm font-medium"
          >
            导出CSV
          </button>
        </div>
        
        {analytics.length === 0 ? (
          <p className="text-gray-500 text-center py-8">暂无统计数据</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">时间</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">广告</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">操作类型</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">用户ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">会话ID</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {analytics.map((record) => (
                  <tr key={record.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(record.action_time).toLocaleString('zh-CN')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {record.ads?.title || '未知广告'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        record.action_type === 'view' ? 'bg-blue-100 text-blue-800' :
                        record.action_type === 'click' ? 'bg-green-100 text-green-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {record.action_type === 'view' ? '查看' :
                         record.action_type === 'click' ? '点击' : '跳过'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {record.user_id?.substring(0, 20)}...
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {record.session_id?.substring(0, 20)}...
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 返回链接 */}
      <div className="mt-6">
        <a 
          href="/admin"
          className="text-blue-600 hover:text-blue-800 text-sm"
        >
          ← 返回管理员首页
        </a>
      </div>
    </div>
  )
}
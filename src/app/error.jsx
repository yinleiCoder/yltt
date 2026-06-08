'use client'

import { useEffect } from 'react'
import Link from 'next/link'

export default function Error({ error, reset }) {
  useEffect(() => {
    console.error('Page error:', error)
  }, [error])

  return (
    <div className="min-h-[80dvh] flex items-center justify-center px-4">
      <div className="text-center">
        <div className="size-20 rounded-full bg-red-100 border-[3px] border-red-400 chunky-shadow flex items-center justify-center mx-auto mb-6">
          <span className="text-4xl font-black text-red-500">!</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black tracking-tight mb-3">出了点问题</h1>
        <p className="text-sm text-muted-foreground font-medium mb-8 max-w-sm mx-auto">
          页面加载时发生错误，请稍后重试。
        </p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={reset}
            className="bg-white text-foreground font-black px-6 py-3 rounded-xl border-[2.5px] border-black chunky-shadow-sm hover:translate-y-[-2px] transition-[box-shadow,transform] duration-150"
          >
            重试
          </button>
          <Link
            href="/"
            className="bg-primary text-white font-black px-6 py-3 rounded-xl border-[2.5px] border-black chunky-shadow hover:translate-y-[-2px] transition-[box-shadow,transform] duration-150"
          >
            返回首页
          </Link>
        </div>
      </div>
    </div>
  )
}

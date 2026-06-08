import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-[80dvh] flex items-center justify-center px-4">
      <div className="text-center">
        <div className="size-20 rounded-full bg-accent border-[3px] border-black chunky-shadow flex items-center justify-center mx-auto mb-6">
          <span className="text-4xl font-black">?</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black tracking-tight mb-3">页面不存在</h1>
        <p className="text-sm text-muted-foreground font-medium mb-8 max-w-sm mx-auto">
          你访问的页面可能已被移除或链接错误。
        </p>
        <Link
          href="/"
          className="inline-block bg-primary text-white font-black px-6 py-3 rounded-xl border-[2.5px] border-black chunky-shadow hover:translate-y-[-2px] hover:shadow-[5px_5px_0_0_#1a1a1a] transition-[box-shadow,transform] duration-150 active:translate-y-0 active:shadow-[1px_1px_0_0_#1a1a1a]"
        >
          返回首页
        </Link>
      </div>
    </div>
  )
}

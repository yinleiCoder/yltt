import "./globals.css"
import { Providers } from "@/components/providers"
import { SmoothScroll } from "@/components/smooth-scroll"
import { createServerSupabase } from "@/lib/supabase/server"

export const metadata = {
  title: "YlTt's 2025",
  description: "记录尹磊和唐涛的每一个甜蜜瞬间，分享我们的幸福时光。",
  icons: { icon: '/rabbit.svg' },
}

export default async function RootLayout({ children }) {
  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body className="min-h-screen bg-background text-foreground antialiased">
        <SmoothScroll>
          <Providers initialUser={user}>
            {children}
          </Providers>
        </SmoothScroll>
      </body>
    </html>
  )
}

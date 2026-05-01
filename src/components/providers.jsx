'use client'

import { ThemeProvider } from 'next-themes'
import { TooltipProvider } from '@/components/ui/tooltip'
import { AuthProvider } from '@/contexts/auth-context'
import { DataProvider } from '@/contexts/data-context'
import { DownloadProvider } from '@/contexts/download-context'
import { UploadProvider } from '@/contexts/upload-context'

export function Providers({ children, initialUser }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
      <TooltipProvider delayDuration={300}>
        <AuthProvider initialUser={initialUser}>
          <DataProvider>
            <DownloadProvider>
              <UploadProvider>
                {children}
              </UploadProvider>
            </DownloadProvider>
          </DataProvider>
        </AuthProvider>
      </TooltipProvider>
    </ThemeProvider>
  )
}

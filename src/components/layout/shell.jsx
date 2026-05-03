import { Sidebar } from "@/components/layout/sidebar"
import { TransferManager } from "@/components/transfer-manager"
import { MusicPlayer } from "@/components/music-player"

export function Shell({ children }) {
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 min-w-0 transition-all duration-300 relative">
        <div className="min-h-screen p-6 lg:p-8 max-w-7xl mx-auto">
          {children}
        </div>
        <TransferManager />
      </main>
      <MusicPlayer />
    </div>
  )
}

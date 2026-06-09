'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Search, Download, File, Loader2, FolderSearch, FileText, Film, Music, Image, Eye } from 'lucide-react'
import { useDownloads } from '@/contexts/download-context'
import PdfViewer from '@/components/pdf-viewer'
import { formatSize } from '@/lib/utils'

const CACHE_KEY = 'fileshare_results'

function loadCache() {
  try { return JSON.parse(localStorage.getItem(CACHE_KEY)) || {} } catch { return {} }
}

function saveCache(query, files) {
  try {
    const cache = loadCache()
    cache[query] = { files, ts: Date.now() }
    const keys = Object.keys(cache).slice(-20)
    const trimmed = {}
    keys.forEach((k) => { trimmed[k] = cache[k] })
    localStorage.setItem(CACHE_KEY, JSON.stringify(trimmed))
  } catch { /* ignore */ }
}

const fileIcon = (name) => {
  const ext = name?.split('.').pop()?.toLowerCase()
  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'].includes(ext)) return <Image size={16} className="text-blue-400" />
  if (['mp4', 'webm', 'mov', 'avi', 'mkv'].includes(ext)) return <Film size={16} className="text-purple-400" />
  if (['mp3', 'wav', 'flac', 'aac', 'ogg'].includes(ext)) return <Music size={16} className="text-green-400" />
  if (['pdf', 'doc', 'docx', 'txt', 'md'].includes(ext)) return <FileText size={16} className="text-amber-400" />
  return <File size={16} className="text-muted-foreground/50" />
}

export default function FilesharePage() {
  const [query, setQuery] = useState('')
  const [searching, setSearching] = useState(false)
  const [files, setFiles] = useState(null)
  const [error, setError] = useState('')
  const { addDownload } = useDownloads()
  const [pdfPreview, setPdfPreview] = useState(null)

  const isPdf = (name) => name?.toLowerCase().endsWith('.pdf')

  const handleSearch = async (e) => {
    e?.preventDefault()
    const q = query.trim()
    if (!q || searching) return

    const cache = loadCache()
    const cached = cache[q]
    if (cached) { setFiles(cached.files); return }

    setSearching(true)
    setError('')
    setFiles(null)

    try {
      const res = await fetch('/api/oshare/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: q }),
      })
      const data = await res.json()
      if (data.error) { setError(data.error) }
      else { setFiles(data.files); saveCache(q, data.files) }
    } catch {
      setError('搜索请求失败，请重试')
    } finally {
      setSearching(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground tracking-tight mb-2">文件共享空间</h1>
        <p className="text-sm text-muted-foreground">输入关键词搜索共享文件</p>
      </div>

      <Card className="surface-card mb-6">
        <CardContent className="p-4 sm:p-5">
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="flex-1 relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/50" />
              <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="搜索文件名..." className="bg-background border-border pl-9 text-sm" disabled={searching} />
            </div>
            <Button type="submit" className="bg-primary hover:bg-primary/90 text-primary-foreground h-9 text-sm gap-1.5" disabled={searching}>
              {searching ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
              {searching ? '搜索中...' : '搜索'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {error && (
        <Card className="surface-card mb-6 border-destructive/30">
          <CardContent className="p-4"><p className="text-sm text-destructive">{error}</p></CardContent>
        </Card>
      )}

      {files !== null && (
        <>
          <div className="flex items-center gap-2 mb-3">
            <FolderSearch size={15} className="text-muted-foreground" />
            <p className="text-sm text-muted-foreground">找到 <span className="font-medium text-foreground">{files.length}</span> 个文件</p>
          </div>
          {files.length === 0 ? (
            <Card className="surface-card"><CardContent className="p-8 text-center"><File size={32} className="mx-auto text-muted-foreground/30 mb-3" /><p className="text-sm text-muted-foreground mb-1">未找到匹配的文件</p><p className="text-xs text-muted-foreground/50">试试其他关键词</p></CardContent></Card>
          ) : (
            <div className="space-y-2">
              {files.map((f) => (
                <Card key={f.key} className="surface-card hover:bg-accent/30 transition-colors">
                  <CardContent className="p-3 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-md bg-accent flex items-center justify-center shrink-0">{fileIcon(f.name)}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-foreground truncate font-medium">{f.name}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        {f.size != null && <span className="text-[10px] text-muted-foreground">{formatSize(f.size)}</span>}
                        {f.lastModified && <span className="text-[10px] text-muted-foreground/50">{new Date(f.lastModified).toLocaleDateString('zh-CN')}</span>}
                      </div>
                    </div>
                    {isPdf(f.name) && (
                      <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-muted-foreground hover:text-primary" onClick={() => setPdfPreview(f)} title="预览 PDF"><Eye size={15} /></Button>
                    )}
                    <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-muted-foreground hover:text-primary" onClick={() => addDownload(f.signedUrl || f.url, f.name)} title="下载文件"><Download size={15} /></Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </>
      )}

      {files === null && !searching && !error && (
        <div className="text-center py-16">
          <FolderSearch size={40} className="mx-auto text-muted-foreground/20 mb-4" />
          <p className="text-sm text-muted-foreground mb-1">在上方输入关键词开始搜索</p>
          <p className="text-xs text-muted-foreground/40">输入文件名关键词即可查找 OSS 共享文件</p>
        </div>
      )}

      {/* PDF Preview */}
      {pdfPreview && (
        <PdfViewer
          file={pdfPreview}
          onClose={() => setPdfPreview(null)}
          onDownload={(f) => addDownload(f.signedUrl || f.url, f.name)}
        />
      )}
    </div>
  )
}

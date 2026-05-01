'use client'

import { useState, useRef, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Search, Download, File, Loader2, FolderSearch, Sparkles, FileText, Film, Music, Image, Key, ChevronDown, ChevronRight } from 'lucide-react'
import { useDownloads } from '@/contexts/download-context'
import { formatSize } from '@/lib/utils'

const CACHE_KEY = 'fileshare_results'

function loadCache() {
  try { return JSON.parse(localStorage.getItem(CACHE_KEY)) || {} } catch { return {} }
}

function saveCache(query, data) {
  try {
    const cache = loadCache()
    cache[query] = { keywords: data.keywords, files: data.files, aiUsed: data.aiUsed, ts: Date.now() }
    // Keep only last 20 entries
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
  const [keywords, setKeywords] = useState('')
  const [files, setFiles] = useState(null)
  const [error, setError] = useState('')
  const [aiUsed, setAiUsed] = useState(false)
  const [apiKey, setApiKey] = useState('')
  const [configOpen, setConfigOpen] = useState(false)
  const inputRef = useRef(null)
  const { addDownload } = useDownloads()

  // Load saved API key from localStorage
  useEffect(() => {
    setApiKey(localStorage.getItem('fileshare_ds_key') || '')
  }, [])

  const handleSearch = async (e) => {
    e?.preventDefault()
    const q = query.trim()
    if (!q || searching) return

    // Check cache first
    const cache = loadCache()
    const cached = cache[q]
    if (cached) {
      setKeywords(cached.keywords)
      setFiles(cached.files)
      setAiUsed(cached.aiUsed)
      return
    }

    setSearching(true)
    setError('')
    setFiles(null)
    setKeywords('')
    setAiUsed(false)

    try {
      const body = { query: q }
      if (apiKey) body.apiKey = apiKey
      const res = await fetch('/api/oshare/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (data.error) {
        setError(data.error)
      } else {
        setKeywords(data.keywords)
        setFiles(data.files)
        setAiUsed(data.aiUsed)
        saveCache(q, data)
      }
    } catch {
      setError('搜索请求失败，请重试')
    } finally {
      setSearching(false)
    }
  }

  const saveApiKey = (val) => {
    setApiKey(val)
    localStorage.setItem('fileshare_ds_key', val)
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground tracking-tight mb-2">文件共享空间</h1>
        <p className="text-sm text-muted-foreground">用自然语言描述你想找的文件，AI 会帮你智能匹配</p>
      </div>

      {/* Search box */}
      <Card className="surface-card mb-6">
        <CardContent className="p-4 sm:p-5">
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="flex-1 relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/50" />
              <Input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder='例如：我想找 React 教程 PDF、Python 入门视频...'
                className="bg-background border-border pl-9 text-sm"
                disabled={searching}
              />
            </div>
            <Button type="submit" className="bg-primary hover:bg-primary/90 text-primary-foreground h-9 text-sm gap-1.5" disabled={searching}>
              {searching ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
              {searching ? '搜索中...' : '搜索'}
            </Button>
          </form>

          {aiUsed && keywords && (
            <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
              <Sparkles size={12} className="text-primary" />
              <span>AI 解析关键词：</span>
              <span className="text-foreground font-medium">{keywords}</span>
            </div>
          )}

          {/* LLM config toggle */}
          <div className="mt-3 pt-3 border-t border-border/50">
            <button
              onClick={() => setConfigOpen(!configOpen)}
              className="flex items-center gap-1.5 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
            >
              {configOpen ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
              <Key size={11} />
              AI 搜索配置
            </button>
            {configOpen && (
              <div className="mt-2 space-y-2">
                <p className="text-[10px] text-muted-foreground/60 leading-relaxed">
                  为了使用 AI 智能搜索，需要提供 DeepSeek API Key。API Key 仅保存在您的浏览器本地，不会上传至服务器以外的任何地方。可前往{' '}
                  <a href="https://platform.deepseek.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">platform.deepseek.com</a>
                  {' '}获取。
                </p>
                <Input
                  value={apiKey}
                  onChange={(e) => saveApiKey(e.target.value)}
                  type="password"
                  placeholder="sk-xxxxxxxxxxxxxxxx"
                  className="bg-background border-border text-xs h-8"
                />
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Error */}
      {error && (
        <Card className="surface-card mb-6 border-destructive/30">
          <CardContent className="p-4">
            <p className="text-sm text-destructive">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Results */}
      {files !== null && (
        <>
          <div className="flex items-center gap-2 mb-3">
            <FolderSearch size={15} className="text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              找到 <span className="font-medium text-foreground">{files.length}</span> 个文件
            </p>
          </div>

          {files.length === 0 ? (
            <Card className="surface-card">
              <CardContent className="p-8 text-center">
                <File size={32} className="mx-auto text-muted-foreground/30 mb-3" />
                <p className="text-sm text-muted-foreground mb-1">未找到匹配的文件</p>
                <p className="text-xs text-muted-foreground/50">试试用更简短的词描述，或在 OSS 的 oshare/ 目录上传文件</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {files.map((f) => (
                <Card key={f.key} className="surface-card hover:bg-accent/30 transition-colors">
                  <CardContent className="p-3 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-md bg-accent flex items-center justify-center shrink-0">
                      {fileIcon(f.name)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-foreground truncate font-medium">{f.name}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        {f.size != null && (
                          <span className="text-[10px] text-muted-foreground">{formatSize(f.size)}</span>
                        )}
                        {f.lastModified && (
                          <span className="text-[10px] text-muted-foreground/50">
                            {new Date(f.lastModified).toLocaleDateString('zh-CN')}
                          </span>
                        )}
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 w-8 p-0 text-muted-foreground hover:text-primary"
                      onClick={() => addDownload(f.signedUrl || f.url, f.name)}
                    >
                      <Download size={15} />
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </>
      )}

      {/* Empty state — before first search */}
      {files === null && !searching && !error && (
        <div className="text-center py-16">
          <FolderSearch size={40} className="mx-auto text-muted-foreground/20 mb-4" />
          <p className="text-sm text-muted-foreground mb-1">在上方输入关键词开始搜索</p>
          <p className="text-xs text-muted-foreground/40">
            支持中英文自然语言描述 · AI 智能提取文件名关键词 · OSS 文件匹配
          </p>
        </div>
      )}
    </div>
  )
}

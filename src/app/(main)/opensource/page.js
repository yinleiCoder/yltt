'use client'

import { useState, useRef } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Download, ExternalLink, Package, ChevronLeft, ChevronRight, X } from 'lucide-react'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'
import { softwareList } from '@/lib/opensource-data'

gsap.registerPlugin(useGSAP)

function ImageGallery({ images, name }) {
  const [activeIdx, setActiveIdx] = useState(0)
  const [lightboxOpen, setLightboxOpen] = useState(false)

  if (!images || images.length === 0) {
    return (
      <div className="sm:w-56 shrink-0 h-48 sm:h-auto bg-accent flex items-center justify-center rounded-l-lg">
        <Package size={40} className="text-muted-foreground/25" />
      </div>
    )
  }

  return (
    <div className="sm:w-56 shrink-0">
      {/* Main image */}
      <button
        className="w-full h-48 sm:h-44 block cursor-zoom-in"
        onClick={() => setLightboxOpen(true)}
      >
        <img
          src={images[activeIdx]}
          alt={`${name} screenshot ${activeIdx + 1}`}
          className="w-full h-full object-cover"
        />
      </button>

      {/* Thumbnails */}
      {images.length > 1 && (
        <div className="flex gap-1.5 p-2">
          {images.map((img, i) => (
            <button
              key={i}
              onClick={() => setActiveIdx(i)}
              className={`w-10 h-10 rounded-md overflow-hidden border-2 shrink-0 transition-all ${
                i === activeIdx
                  ? 'border-primary ring-1 ring-primary/20'
                  : 'border-transparent opacity-50 hover:opacity-80'
              }`}
            >
              <img src={img} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}

      {/* Lightbox */}
      <Dialog open={lightboxOpen} onOpenChange={setLightboxOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-[90vw] lg:max-w-[85vw] max-h-[95vh] bg-card border-border p-0" showCloseButton={false}>
          <div className="relative bg-black/80 flex items-center justify-center min-h-[60vh] sm:min-h-[70vh]">
            <button
              className="absolute top-3 right-3 z-10 p-2 rounded-md bg-black/60 text-white hover:bg-black/80 backdrop-blur-sm"
              onClick={() => setLightboxOpen(false)}
            >
              <X size={18} />
            </button>

            {images.length > 1 && (
              <>
                <button
                  className="absolute left-3 z-10 p-2 rounded-md bg-black/60 text-white hover:bg-black/80 backdrop-blur-sm"
                  onClick={() => setActiveIdx((activeIdx - 1 + images.length) % images.length)}
                >
                  <ChevronLeft size={20} />
                </button>
                <button
                  className="absolute right-3 z-10 p-2 rounded-md bg-black/60 text-white hover:bg-black/80 backdrop-blur-sm"
                  onClick={() => setActiveIdx((activeIdx + 1) % images.length)}
                >
                  <ChevronRight size={20} />
                </button>
              </>
            )}

            <img
              src={images[activeIdx]}
              alt={`${name} screenshot ${activeIdx + 1}`}
              className="max-h-[90vh] max-w-full object-contain p-4"
            />

            {images.length > 1 && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-black/60 text-sm text-white/80 tabular-nums backdrop-blur-sm">
                {activeIdx + 1} / {images.length}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default function OpensourcePage() {
  const gridRef = useRef(null)

  useGSAP(() => {
    if (softwareList.length === 0) return
    gsap.set('.oss-card', { y: 30, opacity: 0 })
    gsap.to('.oss-card', { y: 0, opacity: 1, duration: 0.45, stagger: 0.08, ease: 'power3.out' })
  }, { scope: gridRef })

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground tracking-tight mb-2">开源软件</h1>
        <p className="text-sm text-muted-foreground">我开发的开源项目，欢迎下载和使用</p>
      </div>

      {softwareList.length === 0 ? (
        <div className="text-center py-20">
          <Package size={32} className="mx-auto text-muted-foreground/30 mb-3" />
          <p className="text-sm text-muted-foreground">暂无开源项目</p>
        </div>
      ) : (
        <div ref={gridRef} className="grid gap-4">
          {softwareList.map((sw) => (
            <Card key={sw.id} className="oss-card surface-card overflow-hidden">
              <CardContent className="p-0">
                <div className="flex flex-col sm:flex-row">
                  <ImageGallery images={sw.images} name={sw.name} />

                  {/* Info */}
                  <div className="flex-1 p-5 flex flex-col justify-between">
                    <div>
                      <h3 className="text-base font-semibold text-foreground mb-2">{sw.name}</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed mb-3">{sw.description}</p>
                      {sw.tags?.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mb-3">
                          {sw.tags.map((tag) => (
                            <Badge key={tag} variant="secondary" className="text-[10px] bg-accent text-muted-foreground border-0">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2">
                      {sw.downloadUrl && (
                        <a href={sw.downloadUrl} target="_blank" rel="noopener noreferrer">
                          <Button size="sm" className="h-8 text-xs gap-1.5 bg-primary hover:bg-primary/90 text-primary-foreground">
                            <Download size={13} />下载
                          </Button>
                        </a>
                      )}
                      {sw.homepage && (
                        <a href={sw.homepage} target="_blank" rel="noopener noreferrer">
                          <Button size="sm" variant="outline" className="h-8 text-xs gap-1.5 border-border">
                            <ExternalLink size={13} />访问主页
                          </Button>
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

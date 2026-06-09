'use client'

import { PDFViewer } from '@embedpdf/react-pdf-viewer'
import { X, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function PdfViewer({ file, onClose, onDownload }) {
  const pdfUrl = file.signedUrl || file.url

  return (
    <div className="fixed inset-0 z-[--z-modal] bg-black/50 flex items-center justify-center p-2 sm:p-4" onClick={onClose}>
      <div className="relative w-full max-w-5xl h-[95vh] sm:h-[90vh] bg-white rounded-2xl overflow-hidden shadow-2xl flex flex-col" onClick={(e) => e.stopPropagation()}>
        {/* Toolbar */}
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-200 shrink-0">
          <p className="text-sm font-semibold text-gray-900 truncate flex-1 mr-4">{file.name}</p>
          <div className="flex items-center gap-2 shrink-0">
            {file.size != null && (
              <span className="text-[10px] text-gray-400 hidden sm:inline">{(file.size / 1024 / 1024).toFixed(1)} MB</span>
            )}
            {onDownload && (
              <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={() => onDownload(file)}>
                <Download size={12} />下载
              </Button>
            )}
            <button onClick={onClose} className="size-7 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors" aria-label="关闭">
              <X size={14} className="text-gray-500" />
            </button>
          </div>
        </div>

        {/* PDF Viewer */}
        <div className="flex-1 min-h-0">
          <PDFViewer config={{ src: pdfUrl }} />
        </div>
      </div>
    </div>
  )
}

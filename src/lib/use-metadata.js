'use client'

import { useState, useEffect } from 'react'

let cached = null

export function useMetadata() {
  const [meta, setMeta] = useState(cached)

  useEffect(() => {
    if (cached) return
    fetch('/api/metadata')
      .then(r => r.json())
      .then(data => {
        cached = data
        setMeta(data)
      })
      .catch(() => setMeta({}))
  }, [])

  return meta
}

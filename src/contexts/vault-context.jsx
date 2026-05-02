'use client'

import { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { useToast } from '@/components/ui/toast'
import { deriveKey, encrypt, decrypt, setupVault, unlockVault } from '@/lib/crypto'

const VaultContext = createContext({})

const DEFAULT_AUTO_LOCK_MINUTES = 5

export function VaultProvider({ children }) {
  const { user, profile, supabase } = useAuth()
  const { toast } = useToast()

  const [vaultState, setVaultState] = useState('loading')
  const [passwords, setPasswords] = useState([])
  const [passwordsLoaded, setPasswordsLoaded] = useState(false)
  const cryptoKeyRef = useRef(null)
  const autoLockTimerRef = useRef(null)
  const autoLockMinutesRef = useRef(DEFAULT_AUTO_LOCK_MINUTES)

  // ── Auto-lock timer ─────────────────────────────────────
  const clearAutoLock = useCallback(() => {
    if (autoLockTimerRef.current) {
      clearTimeout(autoLockTimerRef.current)
      autoLockTimerRef.current = null
    }
  }, [])

  const scheduleAutoLock = useCallback(() => {
    clearAutoLock()
    autoLockTimerRef.current = setTimeout(() => {
      lock()
      toast('密码保险箱已自动锁定', 'info', 3000)
    }, autoLockMinutesRef.current * 60 * 1000)
  }, [clearAutoLock]) // eslint-disable-line react-hooks/exhaustive-deps

  const resetAutoLock = useCallback(() => {
    if (cryptoKeyRef.current) {
      scheduleAutoLock()
    }
  }, [scheduleAutoLock])

  // ── Lock ─────────────────────────────────────────────────
  const lock = useCallback(() => {
    cryptoKeyRef.current = null
    setPasswords([])
    setPasswordsLoaded(false)
    setVaultState('locked')
    clearAutoLock()
  }, [clearAutoLock])

  // ── Unlock ───────────────────────────────────────────────
  const unlock = useCallback(async (masterPassword) => {
    const salt = profile?.vault_salt
    const verify = profile?.vault_verify
    if (!salt || !verify) {
      throw new Error('保险箱尚未初始化')
    }
    const key = await unlockVault(masterPassword, salt, verify)
    cryptoKeyRef.current = key
    setVaultState('unlocked')
    scheduleAutoLock()
  }, [profile, scheduleAutoLock])

  // ── Setup (first-time) ───────────────────────────────────
  const setup = useCallback(async (masterPassword) => {
    const { salt, verify } = await setupVault(masterPassword)
    const { error } = await supabase
      .from('profiles')
      .update({ vault_salt: salt, vault_verify: verify })
      .eq('id', user.id)
    if (error) throw error
    const key = await deriveKey(masterPassword, salt)
    cryptoKeyRef.current = key
    setVaultState('unlocked')
    scheduleAutoLock()
    toast('保险箱创建成功', 'success')
  }, [user, supabase, toast, scheduleAutoLock])

  // ── Load passwords ───────────────────────────────────────
  const loadPasswords = useCallback(async () => {
    const key = cryptoKeyRef.current
    if (!key) return

    const { data, error } = await supabase
      .from('passwords')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      toast('加载密码失败: ' + error.message, 'error')
      return
    }

    const decrypted = await Promise.all(
      (data || []).map(async (row) => {
        try {
          return {
            id: row.id,
            category: row.category || '未分类',
            title: await decrypt(key, row.title_encrypted),
            username: await decrypt(key, row.username_encrypted),
            password: await decrypt(key, row.password_encrypted),
            url: row.url_encrypted ? await decrypt(key, row.url_encrypted) : '',
            notes: row.notes_encrypted ? await decrypt(key, row.notes_encrypted) : '',
            created_at: row.created_at,
            updated_at: row.updated_at,
          }
        } catch {
          return null
        }
      }),
    )

    const valid = decrypted.filter(Boolean)
    setPasswords(valid)
    setPasswordsLoaded(true)
  }, [user, supabase, toast])

  // ── Add password ─────────────────────────────────────────
  const addPassword = useCallback(async (entry) => {
    const key = cryptoKeyRef.current
    if (!key) throw new Error('保险箱已锁定')

    const payload = {
      user_id: user.id,
      category: entry.category || '未分类',
      title_encrypted: await encrypt(key, entry.title),
      username_encrypted: await encrypt(key, entry.username),
      password_encrypted: await encrypt(key, entry.password),
      url_encrypted: entry.url ? await encrypt(key, entry.url) : '',
      notes_encrypted: entry.notes ? await encrypt(key, entry.notes) : '',
    }

    const { data, error } = await supabase
      .from('passwords')
      .insert(payload)
      .select('id, created_at, updated_at')
      .single()

    if (error) throw error

    const newEntry = {
      id: data.id,
      category: entry.category || '未分类',
      title: entry.title,
      username: entry.username,
      password: entry.password,
      url: entry.url || '',
      notes: entry.notes || '',
      created_at: data.created_at,
      updated_at: data.updated_at,
    }
    setPasswords((prev) => [newEntry, ...prev])
    return newEntry
  }, [user, supabase])

  // ── Update password ──────────────────────────────────────
  const updatePassword = useCallback(async (id, entry) => {
    const key = cryptoKeyRef.current
    if (!key) throw new Error('保险箱已锁定')

    const payload = {
      category: entry.category || '未分类',
      title_encrypted: await encrypt(key, entry.title),
      username_encrypted: await encrypt(key, entry.username),
      password_encrypted: await encrypt(key, entry.password),
      url_encrypted: entry.url ? await encrypt(key, entry.url) : '',
      notes_encrypted: entry.notes ? await encrypt(key, entry.notes) : '',
    }

    const { error } = await supabase
      .from('passwords')
      .update(payload)
      .eq('id', id)

    if (error) throw error

    setPasswords((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...entry } : p)),
    )
  }, [supabase])

  // ── Delete password ──────────────────────────────────────
  const deletePassword = useCallback(async (id) => {
    const { error } = await supabase
      .from('passwords')
      .delete()
      .eq('id', id)

    if (error) throw error

    setPasswords((prev) => prev.filter((p) => p.id !== id))
  }, [supabase])

  // ── Auto-lock minutes ────────────────────────────────────
  const setAutoLockMinutes = useCallback((minutes) => {
    autoLockMinutesRef.current = minutes
    try { localStorage.setItem('vault_auto_lock_minutes', String(minutes)) } catch {}
    if (cryptoKeyRef.current) {
      scheduleAutoLock()
    }
  }, [scheduleAutoLock])

  // ── Boot ─────────────────────────────────────────────────
  useEffect(() => {
    if (!user || !profile) return

    try {
      const saved = localStorage.getItem('vault_auto_lock_minutes')
      if (saved) autoLockMinutesRef.current = parseInt(saved, 10) || DEFAULT_AUTO_LOCK_MINUTES
    } catch {}

    if (profile.vault_salt && profile.vault_verify) {
      setVaultState('locked')
    } else {
      setVaultState('uninitialized')
    }
  }, [user, profile])

  // ── Activity listener for auto-lock reset ────────────────
  useEffect(() => {
    const events = ['mousedown', 'keydown', 'touchstart', 'scroll']
    events.forEach((e) => window.addEventListener(e, resetAutoLock, { passive: true }))
    return () => events.forEach((e) => window.removeEventListener(e, resetAutoLock))
  }, [resetAutoLock])

  return (
    <VaultContext.Provider
      value={{
        vaultState,
        passwords,
        passwordsLoaded,
        lock,
        unlock,
        setup,
        loadPasswords,
        addPassword,
        updatePassword,
        deletePassword,
        setAutoLockMinutes,
      }}
    >
      {children}
    </VaultContext.Provider>
  )
}

export function useVault() {
  const context = useContext(VaultContext)
  if (!context) throw new Error('useVault must be used within VaultProvider')
  return context
}

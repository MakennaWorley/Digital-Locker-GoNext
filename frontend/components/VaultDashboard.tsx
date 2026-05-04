'use client'

import {
    addFile,
    buildDownloadUrl,
    deleteFile,
    fetchFiles,
    generateKey,
    type AccessKey,
    type VaultFile,
} from '@/lib/api'
import {
    AlertCircle,
    Check,
    Copy,
    ExternalLink,
    HardDrive,
    Key,
    Lock,
    Plus,
    RefreshCw,
    Shield,
    Trash2,
    X,
} from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'

// ── Types ──────────────────────────────────────────────────────────────────────

interface GeneratedLink {
  file: VaultFile
  key: AccessKey
  url: string
}

// ── File Card ──────────────────────────────────────────────────────────────────

function FileCard({
  file,
  onGenerate,
  onDelete,
  isGenerating,
  isDeleting,
}: {
  file: VaultFile
  onGenerate: (file: VaultFile) => void
  onDelete: (file: VaultFile) => void
  isGenerating: boolean
  isDeleting: boolean
}) {
  return (
    <div className="relative flex flex-col gap-4 rounded-xl border border-slate-700/50 bg-slate-800/60 p-5 shadow-lg backdrop-blur-sm transition-all hover:border-slate-600 hover:bg-slate-800">
      {/* Loading overlay */}
      {(isGenerating || isDeleting) && (
        <div className="absolute inset-0 z-10 flex items-center justify-center rounded-xl bg-slate-900/70 backdrop-blur-sm">
          <RefreshCw className="h-6 w-6 animate-spin text-sky-400" />
        </div>
      )}

      {/* File info */}
      <div className="flex items-start gap-3">
        <div className="mt-0.5 rounded-lg bg-slate-700/60 p-2.5">
          <HardDrive className="h-5 w-5 text-sky-400" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold text-slate-100">{file.name}</p>
          <p className="mt-0.5 truncate font-mono text-xs text-slate-500">{file.local_path}</p>
          <p className="mt-1 text-xs text-slate-600">ID #{file.id}</p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <button
          onClick={() => onGenerate(file)}
          disabled={isGenerating || isDeleting}
          className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-sky-600/20 px-4 py-2 text-sm font-medium text-sky-400 ring-1 ring-inset ring-sky-600/30 transition-all hover:bg-sky-600/30 hover:text-sky-300 active:scale-95 disabled:pointer-events-none disabled:opacity-50"
        >
          <Key className="h-4 w-4" />
          Generate Link
        </button>
        <button
          onClick={() => onDelete(file)}
          disabled={isGenerating || isDeleting}
          title="Delete file"
          className="rounded-lg bg-rose-600/20 px-3 py-2 text-rose-400 ring-1 ring-inset ring-rose-600/30 transition-all hover:bg-rose-600/30 hover:text-rose-300 active:scale-95 disabled:pointer-events-none disabled:opacity-50"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}

// ── Add File Modal ────────────────────────────────────────────────────────────

function AddFileModal({
  isOpen,
  onClose,
  onSubmit,
  isLoading,
}: {
  isOpen: boolean
  onClose: () => void
  onSubmit: (name: string, localPath: string) => void
  isLoading: boolean
}) {
  const [name, setName] = useState('')
  const [localPath, setLocalPath] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (name.trim() && localPath.trim()) {
      onSubmit(name, localPath)
      setName('')
      setLocalPath('')
    }
  }

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-md rounded-2xl border border-slate-700 bg-slate-800 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-700/60 px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="rounded-lg bg-emerald-500/10 p-1.5">
              <Plus className="h-4 w-4 text-emerald-400" />
            </div>
            <h2 className="text-base font-semibold text-slate-100">Register Asset</h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-700 hover:text-slate-200"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="space-y-4 px-6 py-5">
          {/* Name input */}
          <div>
            <label className="block text-xs font-medium uppercase tracking-wider text-slate-500 mb-2">
              Asset Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Doom ROM"
              className="w-full rounded-lg bg-slate-900/60 px-3 py-2 text-sm text-slate-100 placeholder-slate-600 ring-1 ring-slate-700 focus:outline-none focus:ring-sky-500"
              disabled={isLoading}
            />
          </div>

          {/* Path input */}
          <div>
            <label className="block text-xs font-medium uppercase tracking-wider text-slate-500 mb-2">
              Local Path
            </label>
            <input
              type="text"
              value={localPath}
              onChange={(e) => setLocalPath(e.target.value)}
              placeholder="e.g., ./assets/doom.rom"
              className="w-full rounded-lg bg-slate-900/60 px-3 py-2 text-sm text-slate-100 placeholder-slate-600 ring-1 ring-slate-700 focus:outline-none focus:ring-sky-500"
              disabled={isLoading}
            />
            <p className="mt-1 text-xs text-slate-600">
              Use absolute or relative paths (e.g., <code className="bg-slate-900 px-1 rounded">./assets/file.bin</code>)
            </p>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isLoading || !name.trim() || !localPath.trim()}
            className="w-full rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-emerald-500 active:scale-95 disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                Registering...
              </>
            ) : (
              <>
                <Plus className="h-4 w-4" />
                Register Asset
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  )
}

// ── Generate Link Modal ────────────────────────────────────────────────────────

interface LinkOptions {
  maxUses: number
  hoursValid: number
}

function GenerateLinkModal({
  isOpen,
  file,
  onClose,
  onSubmit,
  isLoading,
}: {
  isOpen: boolean
  file: VaultFile | null
  onClose: () => void
  onSubmit: (options: LinkOptions) => void
  isLoading: boolean
}) {
  const [maxUses, setMaxUses] = useState(0)
  const [hoursValid, setHoursValid] = useState(24)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit({ maxUses, hoursValid })
    setMaxUses(0)
    setHoursValid(24)
  }

  if (!isOpen || !file) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-md rounded-2xl border border-slate-700 bg-slate-800 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-700/60 px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="rounded-lg bg-sky-500/10 p-1.5">
              <Key className="h-4 w-4 text-sky-400" />
            </div>
            <h2 className="text-base font-semibold text-slate-100">Generate Link</h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-700 hover:text-slate-200"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="space-y-4 px-6 py-5">
          <p className="text-sm text-slate-300">
            <span className="font-semibold">{file.name}</span>
          </p>

          {/* Max uses */}
          <div>
            <label className="block text-xs font-medium uppercase tracking-wider text-slate-500 mb-2">
              Max Downloads (0 = unlimited)
            </label>
            <input
              type="number"
              min="0"
              value={maxUses}
              onChange={(e) => setMaxUses(Math.max(0, parseInt(e.target.value) || 0))}
              placeholder="Unlimited"
              className="w-full rounded-lg bg-slate-900/60 px-3 py-2 text-sm text-slate-100 placeholder-slate-600 ring-1 ring-slate-700 focus:outline-none focus:ring-sky-500"
              disabled={isLoading}
            />
            <p className="mt-1 text-xs text-slate-600">
              Set to 1 for one-time download, 0 for unlimited
            </p>
          </div>

          {/* Hours valid */}
          <div>
            <label className="block text-xs font-medium uppercase tracking-wider text-slate-500 mb-2">
              Valid For (hours)
            </label>
            <select
              value={hoursValid}
              onChange={(e) => setHoursValid(parseInt(e.target.value))}
              className="w-full rounded-lg bg-slate-900/60 px-3 py-2 text-sm text-slate-100 ring-1 ring-slate-700 focus:outline-none focus:ring-sky-500"
              disabled={isLoading}
            >
              <option value={1}>1 hour</option>
              <option value={6}>6 hours</option>
              <option value={24}>24 hours</option>
              <option value={72}>3 days</option>
              <option value={168}>1 week</option>
            </select>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full rounded-lg bg-sky-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-sky-500 active:scale-95 disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Key className="h-4 w-4" />
                Generate Download Link
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  )
}

// ── Link Modal ─────────────────────────────────────────────────────────────────

function LinkModal({ link, onClose }: { link: GeneratedLink; onClose: () => void }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(link.url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const expiresAt = new Date(link.key.expires_at)

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-md rounded-2xl border border-slate-700 bg-slate-800 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-700/60 px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="rounded-lg bg-emerald-500/10 p-1.5">
              <Key className="h-4 w-4 text-emerald-400" />
            </div>
            <h2 className="text-base font-semibold text-slate-100">Access Key Generated</h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-700 hover:text-slate-200"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="space-y-4 px-6 py-5">
          {/* File name */}
          <div className="rounded-lg bg-slate-900/60 px-4 py-3">
            <p className="mb-1 text-xs font-medium uppercase tracking-wider text-slate-500">
              Asset
            </p>
            <p className="font-medium text-slate-200">{link.file.name}</p>
          </div>

          {/* Download URL */}
          <div className="space-y-2">
            <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
              Download URL
            </p>
            <div className="flex items-center gap-2 overflow-hidden rounded-lg bg-slate-900/60 p-3 ring-1 ring-slate-700">
              <p className="min-w-0 flex-1 truncate font-mono text-sm text-emerald-400">
                {link.url}
              </p>
              <button
                onClick={handleCopy}
                title="Copy URL"
                className="flex-shrink-0 rounded-md p-1.5 text-slate-400 transition-colors hover:bg-slate-700 hover:text-slate-200"
              >
                {copied ? (
                  <Check className="h-4 w-4 text-emerald-400" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-lg bg-slate-900/60 px-4 py-3">
              <p className="mb-1 text-xs font-medium uppercase tracking-wider text-slate-500">
                Downloads
              </p>
              <p className="text-slate-200">
                {link.key.use_count}
                {link.key.max_uses > 0 && ` / ${link.key.max_uses}`}
              </p>
            </div>
            <div className="rounded-lg bg-slate-900/60 px-4 py-3">
              <p className="mb-1 text-xs font-medium uppercase tracking-wider text-slate-500">
                Limit
              </p>
              <p className="text-slate-200">
                {link.key.max_uses > 0 ? `${link.key.max_uses}x` : '∞'}
              </p>
            </div>
            <div className="rounded-lg bg-slate-900/60 px-4 py-3">
              <p className="mb-1 text-xs font-medium uppercase tracking-wider text-slate-500">
                Expires
              </p>
              <p className="text-slate-200">
                {expiresAt.toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric',
                })}
              </p>
            </div>
          </div>

          {/* CTA */}
          <a
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-sky-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-sky-500 active:scale-95"
          >
            <ExternalLink className="h-4 w-4" />
            Open Download Link
          </a>
        </div>
      </div>
    </div>
  )
}

// ── Vault Dashboard ────────────────────────────────────────────────────────────

export default function VaultDashboard() {
  const [files, setFiles] = useState<VaultFile[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [generatingId, setGeneratingId] = useState<number | null>(null)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [activeLink, setActiveLink] = useState<GeneratedLink | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [addingFile, setAddingFile] = useState(false)
  const [showGenerateLinkModal, setShowGenerateLinkModal] = useState(false)
  const [selectedFileForLink, setSelectedFileForLink] = useState<VaultFile | null>(null)
  const [generatingLink, setGeneratingLink] = useState(false)

  const loadFiles = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await fetchFiles()
      setFiles(data)
    } catch {
      setError('Could not reach the vault backend. Is the Go server running on :8080?')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadFiles()
  }, [loadFiles])

  const handleGenerate = (file: VaultFile) => {
    setSelectedFileForLink(file)
    setShowGenerateLinkModal(true)
  }

  const handleGenerateLinkWithOptions = async (options: LinkOptions) => {
    if (!selectedFileForLink) return
    try {
      setGeneratingLink(true)
      setError(null)
      const expiresAt = new Date()
      expiresAt.setHours(expiresAt.getHours() + options.hoursValid)
      const key = await generateKey(selectedFileForLink.id, options.maxUses > 0 ? options.maxUses : undefined, expiresAt)
      setActiveLink({ file: selectedFileForLink, key, url: buildDownloadUrl(key.access_key) })
      setShowGenerateLinkModal(false)
    } catch (err) {
      setError(`Failed to generate link: ${err instanceof Error ? err.message : 'Unknown error'}`)
    } finally {
      setGeneratingLink(false)
    }
  }

  const handleDelete = async (file: VaultFile) => {
    if (!confirm(`Delete "${file.name}"? This cannot be undone.`)) return
    try {
      setDeletingId(file.id)
      setError(null)
      await deleteFile(file.id)
      setFiles((prev) => prev.filter((f) => f.id !== file.id))
    } catch {
      setError(`Failed to delete "${file.name}".`)
    } finally {
      setDeletingId(null)
    }
  }

  const handleAddFile = async (name: string, localPath: string) => {
    try {
      setAddingFile(true)
      setError(null)
      const newFile = await addFile(name, localPath)
      setFiles((prev) => [...prev, newFile])
      setShowAddModal(false)
    } catch (err) {
      setError(`Failed to register file: ${err instanceof Error ? err.message : 'Unknown error'}`)
    } finally {
      setAddingFile(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* ── Navigation ── */}
      <header className="sticky top-0 z-40 border-b border-slate-800 bg-slate-900/70 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-6 py-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sky-600/20 ring-1 ring-sky-600/30">
            <Lock className="h-5 w-5 text-sky-400" />
          </div>
          <div>
            <h1 className="text-lg font-bold leading-tight tracking-tight text-slate-100">
              Digital Locker
            </h1>
            <p className="text-xs text-slate-500">Private Asset Vault</p>
          </div>

          <div className="ml-auto flex items-center gap-3">
            <div className="hidden items-center gap-2 rounded-full bg-emerald-500/10 px-3 py-1 ring-1 ring-emerald-500/20 sm:flex">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
              <span className="text-xs text-emerald-400">Vault Active</span>
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              disabled={loading}
              title="Add new asset"
              className="flex items-center gap-1.5 rounded-lg bg-emerald-600/20 px-3 py-2 text-sm font-medium text-emerald-400 ring-1 ring-inset ring-emerald-600/30 transition-all hover:bg-emerald-600/30 hover:text-emerald-300 active:scale-95 disabled:opacity-40"
            >
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Add Asset</span>
            </button>
            <button
              onClick={loadFiles}
              disabled={loading}
              title="Refresh vault"
              className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-800 hover:text-slate-200 disabled:opacity-40"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </header>

      {/* ── Stats bar ── */}
      <div className="border-b border-slate-800/60 bg-slate-900/30">
        <div className="mx-auto max-w-6xl px-6 py-3">
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <Shield className="h-4 w-4 text-slate-500" />
            <span>
              <span className="font-semibold text-slate-200">{files.length}</span> secured{' '}
              {files.length === 1 ? 'asset' : 'assets'}
            </span>
          </div>
        </div>
      </div>

      {/* ── Main content ── */}
      <main className="mx-auto max-w-6xl px-6 py-8">
        {/* Error banner */}
        {error && (
          <div className="mb-6 flex items-start gap-3 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3">
            <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-rose-400" />
            <p className="text-sm text-rose-400">{error}</p>
          </div>
        )}

        {/* Skeleton loaders */}
        {loading && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="h-[9.5rem] animate-pulse rounded-xl border border-slate-700/30 bg-slate-800/40"
              />
            ))}
          </div>
        )}

        {/* Empty state */}
        {!loading && files.length === 0 && !error && (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-700 py-28 text-center">
            <HardDrive className="mb-4 h-12 w-12 text-slate-600" />
            <p className="font-medium text-slate-400">No assets in the vault yet</p>
            <p className="mt-1 max-w-xs text-sm text-slate-600">
              Click the <span className="font-semibold">Add Asset</span> button above to register your first file.
            </p>
          </div>
        )}

        {/* File grid */}
        {!loading && files.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {files.map((file) => (
              <FileCard
                key={file.id}
                file={file}
                onGenerate={handleGenerate}
                onDelete={handleDelete}
                isGenerating={generatingId === file.id}
                isDeleting={deletingId === file.id}
              />
            ))}
          </div>
        )}
      </main>

      {/* ── Add File Modal ── */}
      <AddFileModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSubmit={handleAddFile}
        isLoading={addingFile}
      />

      {/* ── Generate Link Modal ── */}
      <GenerateLinkModal
        isOpen={showGenerateLinkModal}
        file={selectedFileForLink}
        onClose={() => {
          setShowGenerateLinkModal(false)
          setSelectedFileForLink(null)
        }}
        onSubmit={handleGenerateLinkWithOptions}
        isLoading={generatingLink}
      />

      {/* ── Link modal ── */}
      {activeLink && <LinkModal link={activeLink} onClose={() => setActiveLink(null)} />}
    </div>
  )
}

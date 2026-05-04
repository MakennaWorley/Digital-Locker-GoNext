const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080'

export interface VaultFile {
  id: number
  name: string
  local_path: string
}

export interface AccessKey {
  id: number
  access_key: string
  file_id: number
  use_count: number
  expires_at: string
}

export async function fetchFiles(): Promise<VaultFile[]> {
  const res = await fetch(`${API_BASE}/files`, { cache: 'no-store' })
  if (!res.ok) throw new Error(`GET /files → ${res.status}`)
  return res.json()
}

export async function addFile(name: string, localPath: string): Promise<VaultFile> {
  const res = await fetch(`${API_BASE}/files`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, local_path: localPath }),
  })
  if (!res.ok) throw new Error(`POST /files → ${res.status}`)
  return res.json()
}

export async function deleteFile(fileId: number): Promise<void> {
  const res = await fetch(`${API_BASE}/files`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ file_id: fileId }),
  })
  if (!res.ok) throw new Error(`DELETE /files → ${res.status}`)
}

export async function generateKey(
  fileId: number,
  maxUses?: number,
  expiresAt?: Date
): Promise<AccessKey> {
  const apiKey = process.env.NEXT_PUBLIC_API_KEY
  const headers: HeadersInit = { 'Content-Type': 'application/json' }
  if (apiKey) {
    headers['X-API-Key'] = apiKey
  }

  const body: any = { file_id: fileId }
  if (maxUses && maxUses > 0) {
    body.max_uses = maxUses
  }
  if (expiresAt) {
    body.expires_at = expiresAt.toISOString()
  }

  const res = await fetch(`${API_BASE}/keys`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(`POST /keys → ${res.status}`)
  return res.json()
}

export function buildDownloadUrl(accessKey: string): string {
  return `${API_BASE}/download/${accessKey}`
}

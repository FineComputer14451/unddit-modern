import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

export default function Home() {
  const [url, setUrl] = useState('')
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    let path = url.trim()

    if (!path) {
      setError('Paste a Reddit post URL first')
      return
    }

    try {
      if (path.startsWith('http')) {
        const u = new URL(path)
        path = u.pathname
      }
      path = path.replace(/^\/+/, '/')
      if (path.includes('/comments/')) {
        navigate(path)
      } else {
        setError('URL must contain /comments/ (a full post link)')
      }
    } catch {
      setError('Invalid URL')
    }
  }

  return (
    <div className="home">
      <h1>View removed Reddit comments</h1>
      <p className="lead">
        Paste any Reddit post URL. We'll try to restore deleted and removed comments
        using available public archives.
      </p>

      <form onSubmit={handleSubmit} className="url-form">
        <input
          type="text"
          value={url}
          onChange={(e) => { setUrl(e.target.value); setError('') }}
          placeholder="https://www.reddit.com/r/example/comments/abc123/..."
          autoFocus
        />
        <button type="submit">View</button>
      </form>
      {error && <p className="form-error">{error}</p>}

      <div className="tips">
        <h3>Classic shortcut still works</h3>
        <p>
          Just replace <code>reddit</code> with <code>unddit</code> in any Reddit URL,
          or paste the full URL here.
        </p>
      </div>

      <div className="status-box">
        <h3>2026 Reality Check</h3>
        <ul>
          <li>Pre-2023 content: often recoverable</li>
          <li>Moderator-removed (pre-2023): sometimes recoverable</li>
          <li>User-deleted after mid-2023: usually not recoverable with free tools</li>
          <li>Best remaining free sources: PullPush + occasional Wayback snapshots</li>
        </ul>
      </div>
    </div>
  )
}

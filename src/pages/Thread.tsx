import { useParams, Link } from 'react-router-dom'
import { useEffect, useState, useMemo } from 'react'

interface Comment {
  id: string
  author: string
  body: string
  created_utc: number
  score: number
  isRemoved?: boolean
  isDeleted?: boolean
  isRecovered?: boolean
  parent_id?: string
  depth?: number
  replies?: Comment[]
}

function buildTree(flat: Comment[], threadId: string): Comment[] {
  const map = new Map<string, Comment>()
  const roots: Comment[] = []

  for (const c of flat) {
    const parent = c.parent_id
      ? c.parent_id.replace(/^(t1_|t3_)/, '')
      : threadId
    map.set(c.id, { ...c, parent_id: parent, replies: [], depth: 0 })
  }

  for (const c of map.values()) {
    if (c.parent_id === threadId || !map.has(c.parent_id!)) {
      roots.push(c)
    } else {
      const parent = map.get(c.parent_id!)
      if (parent) {
        parent.replies = parent.replies || []
        parent.replies.push(c)
      } else {
        roots.push(c)
      }
    }
  }

  const sortReplies = (nodes: Comment[]) => {
    nodes.sort((a, b) => (b.score || 0) - (a.score || 0))
    nodes.forEach(n => {
      if (n.replies && n.replies.length) sortReplies(n.replies)
    })
  }
  sortReplies(roots)
  return roots
}

function CommentNode({ comment, depth = 0 }: { comment: Comment; depth?: number }) {
  const [collapsed, setCollapsed] = useState(false)
  const hasReplies = comment.replies && comment.replies.length > 0
  const maxDepth = 8

  return (
    <div
      className={`comment ${comment.isRemoved ? 'removed' : ''} ${comment.isDeleted ? 'deleted' : ''} ${comment.isRecovered ? 'recovered' : ''}`}
      style={{ marginLeft: depth > 0 ? Math.min(depth * 16, 80) : 0 }}
    >
      <div className="comment-meta">
        {hasReplies && (
          <button
            className="collapse-btn"
            onClick={() => setCollapsed(!collapsed)}
            aria-label={collapsed ? 'Expand' : 'Collapse'}
          >
            {collapsed ? '+' : '−'}
          </button>
        )}
        <span className="author">u/{comment.author}</span>
        <span className="score">{comment.score} pts</span>
        {comment.isRecovered && <span className="badge recovered-badge">recovered</span>}
        {comment.isRemoved && <span className="badge removed-badge">removed</span>}
        {comment.isDeleted && <span className="badge deleted-badge">deleted</span>}
      </div>
      <div className="comment-body">{comment.body}</div>

      {!collapsed && hasReplies && depth < maxDepth && (
        <div className="replies">
          {comment.replies!.map(r => (
            <CommentNode key={r.id} comment={r} depth={depth + 1} />
          ))}
        </div>
      )}
      {!collapsed && hasReplies && depth >= maxDepth && (
        <div className="depth-limit">[replies hidden — depth limit]</div>
      )}
    </div>
  )
}

export default function Thread() {
  const { subreddit, id } = useParams()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [postTitle, setPostTitle] = useState('')
  const [postAuthor, setPostAuthor] = useState('')
  const [flatComments, setFlatComments] = useState<Comment[]>([])
  const [status, setStatus] = useState('')
  const [sourceInfo, setSourceInfo] = useState('')

  useEffect(() => {
    if (!id) return

    let cancelled = false

    async function load() {
      setLoading(true)
      setError(null)
      setStatus('Connecting to archives...')
      setSourceInfo('')

      try {
        let archived: any[] = []
        let pullpushOk = false
        try {
          setStatus('Querying PullPush archive...')
          const pullpushUrl = `https://api.pullpush.io/reddit/search/comment/?link_id=t3_${id}&size=200&sort=asc`
          const res = await fetch(pullpushUrl)
          if (res.ok) {
            const data = await res.json()
            archived = data.data || data || []
            if (!Array.isArray(archived)) archived = []
            pullpushOk = true
            setStatus(`PullPush returned ${archived.length} comments`)
          } else {
            setStatus(`PullPush HTTP ${res.status}`)
          }
        } catch {
          setStatus('PullPush unreachable')
        }

        if (cancelled) return

        let liveComments: any[] = []
        let livePost: any = null
        try {
          setStatus(prev => prev + ' · Fetching live Reddit...')
          const redditRes = await fetch(
            `https://www.reddit.com/r/${subreddit}/comments/${id}.json?limit=500&raw_json=1`,
            { headers: { Accept: 'application/json' } }
          )
          if (redditRes.ok) {
            const redditData = await redditRes.json()
            livePost = redditData[0]?.data?.children?.[0]?.data
            if (livePost) {
              setPostTitle(livePost.title || '')
              setPostAuthor(livePost.author || '')
            }

            const flatten = (children: any[]): any[] => {
              const out: any[] = []
              for (const child of children || []) {
                if (child.kind !== 't1') continue
                const d = child.data
                out.push(d)
                if (d.replies?.data?.children) {
                  out.push(...flatten(d.replies.data.children))
                }
              }
              return out
            }
            liveComments = flatten(redditData[1]?.data?.children || [])
          }
        } catch {
          // ignore
        }

        if (cancelled) return

        const liveMap = new Map(liveComments.map((c: any) => [c.id, c]))
        const merged: Comment[] = []
        const seen = new Set<string>()

        for (const a of archived) {
          if (!a.id || seen.has(a.id)) continue
          seen.add(a.id)
          const live = liveMap.get(a.id)
          const liveBody = live?.body
          const isRemoved =
            liveBody === '[removed]' ||
            live?.author === '[deleted]' ||
            (live && liveBody === '[deleted]')
          const isDeleted = a.author === '[deleted]' || a.body === '[deleted]'

          merged.push({
            id: a.id,
            author: a.author || '[unknown]',
            body: a.body || '[no body]',
            created_utc: a.created_utc,
            score: a.score ?? 0,
            parent_id: a.parent_id,
            isRemoved: !!isRemoved,
            isDeleted: !!isDeleted,
            isRecovered: !!isRemoved || !live,
          })
        }

        for (const l of liveComments) {
          if (seen.has(l.id)) continue
          if (l.body === '[removed]' || l.body === '[deleted]') continue
          seen.add(l.id)
          merged.push({
            id: l.id,
            author: l.author || '[deleted]',
            body: l.body,
            created_utc: l.created_utc,
            score: l.score ?? 0,
            parent_id: l.parent_id,
            isRecovered: false,
          })
        }

        setFlatComments(merged)

        const recoveredCount = merged.filter(c => c.isRecovered).length
        setSourceInfo(
          pullpushOk
            ? `PullPush + Reddit · ${merged.length} total · ${recoveredCount} recovered`
            : `Reddit only · ${merged.length} visible comments (archive unavailable)`
        )

        if (merged.length === 0) {
          setError(
            'No comments could be recovered. This is expected for many posts after mid-2023 when public Pushshift access ended.'
          )
        }
      } catch (err: any) {
        if (!cancelled) setError(err.message || 'Unexpected error while loading')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [id, subreddit])

  const tree = useMemo(() => {
    if (!id || flatComments.length === 0) return []
    return buildTree(flatComments, id)
  }, [flatComments, id])

  if (loading) {
    return (
      <div className="thread loading">
        <div className="spinner" />
        <p>{status || 'Loading thread...'}</p>
      </div>
    )
  }

  return (
    <div className="thread">
      <div className="thread-header">
        <Link to="/" className="back">
          ← Back
        </Link>
        <h1>{postTitle || `Post ${id}`}</h1>
        <p className="meta">
          r/{subreddit}
          {postAuthor && <> · u/{postAuthor}</>}
          {' · '}
          {flatComments.length} comments
        </p>
        {sourceInfo && <p className="status">{sourceInfo}</p>}
      </div>

      {error && (
        <div className="error-box">
          <strong>Note:</strong> {error}
        </div>
      )}

      <div className="comments">
        {tree.map(c => (
          <CommentNode key={c.id} comment={c} />
        ))}
      </div>

      {flatComments.length === 0 && !error && (
        <p className="empty">No recoverable comments found for this thread.</p>
      )}
    </div>
  )
}

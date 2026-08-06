export default function About() {
  return (
    <div className="about">
      <h1>About this rebuild</h1>
      
      <p>
        This is a modern rebuild of the classic <strong>Unddit / removeddit</strong> project
        (originally by Jesper Wrang, later maintained in the gurnec fork).
      </p>

      <h2>What changed</h2>
      <ul>
        <li>React 19 + Vite + TypeScript</li>
        <li>Cleaner, responsive dark UI</li>
        <li>Updated data sources (PullPush + Reddit live comparison)</li>
        <li>Honest limitations messaging</li>
      </ul>

      <h2>Why coverage is limited</h2>
      <p>
        In 2023 Reddit revoked public access to Pushshift — the archive that powered
        the original Unddit, Removeddit, Ceddit, and similar tools. Without a complete
        real-time archive of every comment, full recovery of deleted content is no longer
        freely possible at scale.
      </p>
      <p>
        Remaining free options (PullPush, Arctic Shift dumps, Wayback Machine) have
        incomplete or delayed coverage, especially for content deleted after mid-2023.
      </p>

      <h2>Original project</h2>
      <p>
        Source inspiration:{' '}
        <a href="https://github.com/gurnec/removeddit" target="_blank" rel="noreferrer">
          github.com/gurnec/removeddit
        </a>
      </p>
    </div>
  )
}

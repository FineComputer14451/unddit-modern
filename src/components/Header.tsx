import { Link } from 'react-router-dom'

export default function Header() {
  return (
    <header className="header">
      <div className="header-inner">
        <Link to="/" className="logo">
          <span className="logo-mark">un</span>ddit
        </Link>
        <nav className="nav">
          <Link to="/">Home</Link>
          <Link to="/about">About</Link>
        </nav>
      </div>
      <div className="banner">
        <strong>Limited coverage:</strong> Public Pushshift ended in 2023. 
        This rebuild uses remaining free archives (PullPush + live Reddit). 
        Many recent deletions cannot be recovered.
      </div>
    </header>
  )
}

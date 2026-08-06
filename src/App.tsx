import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Header from './components/Header'
import Home from './pages/Home'
import Thread from './pages/Thread'
import About from './pages/About'
import './App.css'

function App() {
  return (
    <BrowserRouter>
      <div className="app">
        <Header />
        <main className="main">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/about" element={<About />} />
            <Route path="/r/:subreddit/comments/:id/*" element={<Thread />} />
            <Route path="/r/:subreddit/comments/:id" element={<Thread />} />
            <Route path="*" element={<Home />} />
          </Routes>
        </main>
        <footer className="footer">
          <p>
            Modern rebuild of Unddit / removeddit · Data coverage is limited after mid-2023
          </p>
        </footer>
      </div>
    </BrowserRouter>
  )
}

export default App

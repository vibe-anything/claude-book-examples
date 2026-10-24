'use client'

import { useState } from 'react'

export default function Shell({ generated, children }) {
  const [theme, setTheme] = useState(null)

  function toggleTheme() {
    const next = theme === 'dark' ? 'light' : 'dark'
    setTheme(next)
    document.documentElement.dataset.theme = next
  }

  return (
    <>
      <div className="page-head">
        <div>
          <h1 className="page-title">살림풍경 인수인계 아카이브</h1>
          <p className="page-sub">
            출처 <code>wiki/data/dashboard.json</code>
            {generated ? ` · 생성 ${generated}` : ''}
          </p>
        </div>
        <div className="btn-row">
          <button className="btn" onClick={toggleTheme} aria-label="라이트·다크 전환">
            ◐
          </button>
        </div>
      </div>
      {children}
    </>
  )
}

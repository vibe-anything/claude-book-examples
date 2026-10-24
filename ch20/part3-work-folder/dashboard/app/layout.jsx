import './globals.css'

export const metadata = {
  title: '살림풍경 인수인계 아카이브 대시보드',
  description: '살림풍경 인수인계 아카이브 대시보드. 분포·관계·타임라인 위젯 3개 (wiki/data/dashboard.json 기준)',
}

export default function RootLayout({ children }) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  )
}

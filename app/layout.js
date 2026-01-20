import './globals.css'

export const metadata = {
  title: 'Baltic Salary Calculator 2026',
  description: 'Calculate net/gross salary and employer costs for Estonia, Latvia, and Lithuania',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}

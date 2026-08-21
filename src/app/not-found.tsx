import Link from 'next/link';

export default function RootNotFound() {
  return (
    <html lang="hy-AM">
      <body>
        <div style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ textAlign: 'center', fontFamily: 'system-ui, sans-serif' }}>
            <p style={{ fontSize: 48, fontWeight: 700, color: '#008577', margin: 0 }}>404</p>
            <Link href="/hy" style={{ color: '#008577' }}>
              Home
            </Link>
          </div>
        </div>
      </body>
    </html>
  );
}

// src/app/fotky/layout.tsx

export const metadata = {
  title: 'Fotokoutek #svatbahrdinu',
  description: 'Gallery of photos',
}

export default function FotkyLayout({ children }) {
  return (
    <html lang="en">
      <head>{/* You can still use <meta> tags here if needed */}</head>
      <body>{children}</body>
    </html>
  )
}

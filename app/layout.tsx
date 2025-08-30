import type React from "react"
import type { Metadata, Viewport } from "next"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"

export const metadata: Metadata = {
  title: "YYC³ AI - 无边界智能交互中心",
  description: "基于无边界设计理念的AI智能交互平台，支持语音、手势、眼动等多模态交互方式",
  keywords: ["AI", "搜索", "人工智能", "内容生成", "智能助手"],
  authors: [{ name: "AI搜索团队" }],
  creator: "AI搜索平台",
  publisher: "AI搜索平台",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "AI搜索",
  },
  openGraph: {
    type: "website",
    siteName: "YYC³ AI - 无边界智能交互中心",
    title: "YYC³ AI - 无边界智能交互中心",
    description: "基于无边界设计理念的AI智能交互平台，支持语音、手势、眼动等多模态交互方式",
    images: [
      {
        url: "/icon-512.png",
        width: 512,
        height: 512,
        alt: "YYC³ AI - 无边界智能交互中心",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "YYC³ AI - 无边界智能交互中心",
    description: "基于无边界设计理念的AI智能交互平台，支持语音、手势、眼动等多模态交互方式",
    images: ["/icon-512.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
    generator: 'v0.app'
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#000000" },
  ],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <head>
        {/* PWA Meta Tags */}
        <meta name="application-name" content="AI搜索" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="AI搜索" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="msapplication-config" content="/browserconfig.xml" />
        <meta name="msapplication-TileColor" content="#3b82f6" />
        <meta name="msapplication-tap-highlight" content="no" />

        {/* Apple Touch Icons */}
        <link rel="apple-touch-icon" href="/icon-192.png" />
        <link rel="apple-touch-icon" sizes="152x152" href="/icon-152.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/icon-192.png" />
        <link rel="apple-touch-icon" sizes="167x167" href="/icon-192.png" />

        {/* Favicons */}
        <link rel="icon" type="image/png" sizes="32x32" href="/icon-72.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/icon-72.png" />
        <link rel="shortcut icon" href="/icon-72.png" />

        {/* Service Worker Registration Script */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js', { scope: '/' })
                    .then(function(registration) {
                      console.log('✅ SW registered: ', registration);
                    })
                    .catch(function(registrationError) {
                      console.log('❌ SW registration failed: ', registrationError);
                    });
                });
              }
            `,
          }}
        />
      </head>
      <body className="font-sans">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}

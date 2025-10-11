import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ClerkProvider } from '@clerk/nextjs'
import "./globals.css";
import { TopNavBar } from '@/components/top-nav-bar'
import { Provider } from './provider'
import { ErrorBoundary } from '@/components/ui/error-boundary'

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

// Clerk appearance configuration
const appearance = {
  baseTheme: undefined,
  variables: {
    colorPrimary: '#000000',
    colorBackground: '#ffffff',
    colorText: '#000000',
    colorTextSecondary: '#666666',
    colorInputBackground: '#ffffff',
    colorInputText: '#000000',
    colorNeutral: '#000000',
    borderRadius: '0.375rem',
  },
  elements: {
    formButtonPrimary: 'bg-black text-white hover:bg-gray-800',
    card: 'bg-white border border-gray-200',
    headerTitle: 'text-black',
    headerSubtitle: 'text-gray-600',
    socialButtonsBlockButton: 'bg-white border border-gray-200 text-black hover:bg-gray-50',
    socialButtonsBlockButtonText: 'text-black',
    formFieldLabel: 'text-black',
    formFieldInput: 'bg-white border border-gray-200 text-black',
    footerActionLink: 'text-black hover:text-gray-800',
    footerActionText: 'text-gray-600',
  },
};

export const metadata: Metadata = {
  title: "PanelPro",
  description: "Earn points by completing surveys and redeem them for rewards",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} bg-background text-foreground min-h-screen antialiased`}>
        <ErrorBoundary>
          <Provider>
            <ClerkProvider appearance={appearance} dynamic>
              <TopNavBar />
              {children}
            </ClerkProvider>
          </Provider>
        </ErrorBoundary>
      </body>
    </html>
  )
}

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import './index.css'
import App from './App.tsx'
import { AuthProvider } from './components/auth/AuthProvider.tsx'
import { Analytics } from "@vercel/analytics/react"

import { SharedNoteView } from './components/public/SharedNoteView.tsx'
import { PublicNoteView } from './components/public/PublicNoteView.tsx'

const queryClient = new QueryClient();

const isSharedRoute = window.location.pathname.startsWith('/share/');
const isPublicRoute = window.location.pathname.startsWith('/p/');

// If running inside a Chrome extension popup, set a fixed width/height
// so the layout has enough room for the sidebar and editor.
// (Chrome limits popups to 800x600 maximum)
if ((window as any).chrome && (window as any).chrome.runtime && !window.location.href.startsWith('http')) {
  document.documentElement.style.width = '780px';
  document.documentElement.style.height = '600px';
  document.body.style.width = '780px';
  document.body.style.height = '600px';
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      {isSharedRoute ? (
        <SharedNoteView />
      ) : isPublicRoute ? (
        <PublicNoteView />
      ) : (
        <AuthProvider>
          <App />
        </AuthProvider>
      )}
    </QueryClientProvider>
    <Analytics />
  </StrictMode>,
)

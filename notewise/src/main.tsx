import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import './index.css'
import App from './App.tsx'
import { AuthProvider } from './components/auth/AuthProvider.tsx'
import { Analytics } from "@vercel/analytics/react"

import { SharedNoteView } from './components/public/SharedNoteView.tsx'

const queryClient = new QueryClient();

const isSharedRoute = window.location.pathname.startsWith('/share/');

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      {isSharedRoute ? (
        <SharedNoteView />
      ) : (
        <AuthProvider>
          <App />
        </AuthProvider>
      )}
    </QueryClientProvider>
    <Analytics />
  </StrictMode>,
)

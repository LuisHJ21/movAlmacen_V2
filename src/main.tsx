import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { OfflineOverlay } from '@/components/layout/OfflineOverlay'
import { AuthProvider } from '@/context/AuthContext'
import App from './App'
import '@/assets/styles/globals.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
    <OfflineOverlay />
  </StrictMode>,
)

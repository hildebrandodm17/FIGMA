import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Toaster } from 'react-hot-toast'
import App from './App'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
    <Toaster
      position="top-right"
      toastOptions={{
        duration: 4000,
        style: {
          background: '#1A1A1A',
          color: '#F5F5F5',
          border: '1px solid #2A2A2A',
        },
        success: {
          iconTheme: {
            primary: '#16A34A',
            secondary: '#F5F5F5',
          },
        },
        error: {
          iconTheme: {
            primary: '#DC2626',
            secondary: '#F5F5F5',
          },
        },
      }}
    />
  </StrictMode>,
)

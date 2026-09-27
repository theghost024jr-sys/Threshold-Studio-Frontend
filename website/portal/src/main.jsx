import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { MythicProvider } from './context/MythicContext.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <MythicProvider>
      <App />
    </MythicProvider>
  </StrictMode>,
)

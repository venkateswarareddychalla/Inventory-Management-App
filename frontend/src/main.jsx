import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import axios from 'axios'

// During development, prefer the backend at localhost:5000.
// If you use Vite proxy (vite.config.js) this is not necessary,
// but setting a baseURL provides a fallback when the proxy isn't active.
const apiBase = import.meta.env.VITE_API_BASE || 'http://localhost:5000' 
axios.defaults.baseURL = apiBase;

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

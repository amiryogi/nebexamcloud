import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// 🔧 REMOVED StrictMode to prevent double-mounting during development
// StrictMode is useful but can cause issues with contexts that make API calls
createRoot(document.getElementById('root')).render(
  <App />
)
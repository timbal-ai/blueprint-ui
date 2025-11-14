import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import './index.css'
import App from './App.tsx'
import './auth/provider'

window.addEventListener('message', (event) => {
  if (event.data && event.data.action === 'navigate') {
      if (event.data.direction === 'back') {
          window.history.go(-1);
      } else if (event.data.direction === 'forward') {
          window.history.go(1);
      }
  }
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

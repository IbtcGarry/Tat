import { StrictMode, useState } from 'react'
import { createRoot } from 'react-dom/client'
 
// global / layout styles
import './index.css'
import './App.css'
 
// the two screens this app switches between
import Loader from './features/Loader'
import Home from './Home'
 
function Root() {
  const [loaded, setLoaded] = useState(false)
 
  return loaded ? <Home /> : <Loader onComplete={() => setLoaded(true)} />
}
 
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Root />
  </StrictMode>,
)
 
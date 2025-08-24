import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import ChatbotPage from './Page'

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
      <ChatbotPage/>
    </>
  )
}

export default App

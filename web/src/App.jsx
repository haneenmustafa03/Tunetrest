import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'


function App() {
  const [count, setCount] = useState(0)

  return (
    <>
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500">
        <h1 className="text-5xl font-extrabold text-white drop-shadow-lg">
          Tailwind is Working!
        </h1>
      </div>
    </>
  )
}

export default App

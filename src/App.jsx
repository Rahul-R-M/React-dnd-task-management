import { BrowserRouter, Route, Routes } from 'react-router'
import './App.css'
import Login from './Module/Login'
import Dashboard from './Module/Dashboard'

function App() {

  return (
    <>
      <BrowserRouter>
        <Routes>
          <Route path='/' element={<Login />} />
          <Route path='/dashboard' element={<Dashboard />} />
        </Routes>
      </BrowserRouter>
    </>
  )
}

export default App

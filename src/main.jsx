import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { BrowserRouter, Routes, Route} from "react-router-dom"
import "./index.css"
import Login from "./pages/Login"
import Home from "./pages/Home"
import PrivateRoute from "./components/PrivateRoute"

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/home" element={<PrivateRoute><Home /></PrivateRoute>} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)

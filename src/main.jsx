import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "./index.css";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./components/delete-button.css";
import { ConfirmAlert } from "./components/ConfirmAlert";

import App from "./App";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <ConfirmAlert>
        <App />
      </ConfirmAlert>
    </BrowserRouter>
    <ToastContainer
      position="top-right"
      autoClose={4000}
      hideProgressBar={false}
      newestOnTop={false}
      closeOnClick
      pauseOnHover
      draggable
      theme="light"
      limit={3}
      style={{ zIndex: 9999 }}
    />
  </StrictMode>
);

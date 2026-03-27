import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import "./wholecss.scss";

const rootElement = document.getElementById("root");

if (rootElement && rootElement.hasChildNodes()) {
  ReactDOM.hydrateRoot(rootElement, <App />);
} else if (rootElement) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(<App />);
}

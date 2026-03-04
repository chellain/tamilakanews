
import "./App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import PreviewPage from "./Pages/PreviewPage/PreviewPage";
import NewsPaperM from "./Pages/Newspaper/NewsPaperM";
import { SiteDataProvider } from "./context/SiteDataContext";
function App() {
  return (
    <>
      <SiteDataProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<NewsPaperM />} />
            <Route path="/preview/:id" element={<PreviewPage />} />
          </Routes>
        </BrowserRouter>
      </SiteDataProvider>
    </>
    
  )
}

export default App


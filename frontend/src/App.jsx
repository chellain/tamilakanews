
import "./App.css";
import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import PreviewPage from "./Pages/PreviewPage/PreviewPage";
import NewsPaperM from "./Pages/Newspaper/NewsPaperM";
import { getAllNews } from "./Api/newsApi";
import { getLayout } from "./Api/layoutApi";
import { getAdminConfig } from "./Api/adminApi";
import { getNewsPageConfig } from "./Api/newsPageApi";
import { getUsers } from "./Api/userApi";
import { setAllNews } from "./Pages/Slice/newsformSlice.js";
import {
  setLayoutHydrated,
  setLayoutState,
} from "./Pages/Slice/editpaperSlice/editpaperslice.js";
import { setAdminConfig } from "./Pages/Slice/adminSlice.js";
import { setUsers } from "./Pages/Slice/userSlice.js";
import { setNewsPageConfig } from "./Pages/Slice/newspageSlice.js";
function App() {
  const dispatch = useDispatch();

  useEffect(() => {
    const loadInitialData = async () => {
      const usersPromise = getUsers();

      const [newsRes, layoutRes, adminRes, newsPageRes, usersRes] = await Promise.allSettled([
        getAllNews(),
        getLayout(),
        getAdminConfig(),
        getNewsPageConfig(),
        usersPromise
      ]);

      if (newsRes.status === "fulfilled" && Array.isArray(newsRes.value)) {
        dispatch(setAllNews(newsRes.value));
      }

      if (layoutRes.status === "fulfilled" && layoutRes.value) {
        dispatch(setLayoutState(layoutRes.value));
      }
      dispatch(setLayoutHydrated());

      if (adminRes.status === "fulfilled" && adminRes.value) {
        dispatch(setAdminConfig(adminRes.value));
      }

      if (newsPageRes.status === "fulfilled" && newsPageRes.value) {
        dispatch(setNewsPageConfig(newsPageRes.value));
      }

      if (usersRes.status === "fulfilled" && Array.isArray(usersRes.value)) {
        dispatch(setUsers(usersRes.value));
      }
    };

    loadInitialData();
  }, [dispatch]);


  return (
    <>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<NewsPaperM />} />
          <Route path="/preview/:id" element={<PreviewPage />} />
        </Routes>
      </BrowserRouter>
    </>
    
  )
}

export default App


import React, { useEffect, useState } from "react";
import "@/App.css";
import axios from "axios";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from 'sonner';
import { LanguageProvider } from './contexts/LanguageContext';

// Attach JWT token (when present) to every request; public endpoints ignore it.
axios.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

import Home from './pages/Home';
import Send from './pages/Send';
import Tracking from './pages/Tracking';
import Backoffice from './pages/Backoffice';
import Login from './pages/Login';

function App() {
  return (
    <LanguageProvider>
      <div className="App">
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/send" element={<Send />} />
            <Route path="/track" element={<Tracking />} />
            <Route path="/backoffice" element={<Backoffice />} />
            <Route path="/login" element={<Login />} />
          </Routes>
        </BrowserRouter>
        <Toaster position="top-right" />
      </div>
    </LanguageProvider>
  );
}

export default App;

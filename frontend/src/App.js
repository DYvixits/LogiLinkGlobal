import React, { useEffect, useState } from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from 'sonner';
import { LanguageProvider } from './contexts/LanguageContext';

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

import React from 'react';
import "@/App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from 'sonner';

import Home from './pages/Home';
import Send from './pages/Send';
import Tracking from './pages/Tracking';
import Backoffice from './pages/Backoffice';

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/send" element={<Send />} />
          <Route path="/track" element={<Tracking />} />
          <Route path="/backoffice" element={<Backoffice />} />
        </Routes>
      </BrowserRouter>
      <Toaster position="top-right" />
    </div>
  );
}

export default App;

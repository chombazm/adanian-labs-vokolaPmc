import * as React from "react";
import React, { useState, useEffect } from 'react';
import { Routes, Route, Link } from "react-router-dom";
import LandingPage from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";

const App = () => {
  const [login, setLogin] = useState(false);

  useEffect(() => {
  });
    return (
        <div className="App">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/dashboard" element={<Dashboard />} />


        </Routes>
      </div>
    )
}

export default App;
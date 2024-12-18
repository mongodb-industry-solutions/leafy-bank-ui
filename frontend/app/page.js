"use client";

// page.js

import React from 'react';
import Login from '@/components/Login/Login';
import Home from '@/components/Home/Home';

import "./fonts.css";

export default function HomePage() {

  return (
    <>
      <Login />
      <Home />
    </>
  );
}

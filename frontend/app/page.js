"use client";

import React, { useState } from 'react';
import Login from '@/components/Login/Login';
import Header from '@/components/Header/Header';
import AccountsCards from '@/components/AccountsCards/AccountsCards';
import Chatbot from '@/components/Chatbot/Chatbot';

import "./fonts.css";

export default function Home() {

  // State to manage the form open/close state
  const [isFormOpen, setFormOpen] = useState(false);

  // Function to open the form
  const handleOpenForm = () => {
    setFormOpen(true);
  };

  // Function to close the form
  const handleCloseForm = () => {
    setFormOpen(false);
  };

  return (
    <>
      <Login />
      <Header />
      {/* Pass isFormOpen and handleOpenForm, handleCloseForm as props */}
      <AccountsCards
        isFormOpen={isFormOpen}
        handleOpenForm={handleOpenForm}
        handleCloseForm={handleCloseForm}
      />
      <Chatbot />
    </>
  );
}

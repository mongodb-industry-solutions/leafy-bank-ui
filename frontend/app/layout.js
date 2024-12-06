"use client";

// layout.js

import { useEffect } from 'react';
import '../node_modules/bootstrap/dist/css/bootstrap.min.css';
import { GeistSans } from "geist/font/sans";
import Login from '@/components/Login/Login';
import Chatbot from '@/components/Chatbot/Chatbot';

export default function RootLayout({ children }) {

  useEffect(() => {
    // Retrieve data from localStorage with safe parsing
    const selectedUser = localStorage.getItem('selectedUser');
    const accounts = localStorage.getItem('accounts');
    const transactions = localStorage.getItem('transactions');

    // Log the data to the console
    console.log("Selected User:", selectedUser);
    console.log("Accounts:", accounts);
    console.log("Transactions:", transactions);
  }, []);

  return (
    <html lang="en" className={GeistSans.className}>
      <body>
        {children}
        <Login />
        <Chatbot />
      </body>
    </html>
  );
}

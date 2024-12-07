"use client";

// layout.js

import { useEffect } from 'react';
import '../node_modules/bootstrap/dist/css/bootstrap.min.css';
import { GeistSans } from "geist/font/sans";
import Login from '@/components/Login/Login';
import Chatbot from '@/components/Chatbot/Chatbot';
import Header from '@/components/Header/Header';

export default function RootLayout({ children }) {

  useEffect(() => {
    // Retrieve data from localStorage
    const selectedUser = localStorage.getItem('selectedUser');
    const activeAccountsString = localStorage.getItem('active_accounts');
    const recentTransactionsString = localStorage.getItem('recent_transactions');

    // Parse the JSON strings
    const activeAccounts = activeAccountsString ? JSON.parse(activeAccountsString) : { accounts: [] };
    const recentTransactions = recentTransactionsString ? JSON.parse(recentTransactionsString) : { transactions: [] };

    // Log the data to the console
    console.log("Selected User:", selectedUser);
    console.log("Active Accounts:", activeAccounts);
    console.log("Number of Accounts:", activeAccounts.accounts.length);
    console.log("Recent Transactions:", recentTransactions);
    console.log("Number of Recent Transactions:", recentTransactions.transactions.length);
  }, []);

  return (
    <html lang="en" className={GeistSans.className}>
      <body>
        {children}
        <Login />
        <Header />
        <Chatbot />
      </body>
    </html>
  );
}

"use client";

// Home.jsx

import { useEffect, useState } from "react";
import Head from 'next/head';
import { H2, H3, Body } from '@leafygreen-ui/typography';
import RefreshIcon from '@leafygreen-ui/icon/dist/Refresh';
import IconButton from '@leafygreen-ui/icon-button';
import Popover from '@leafygreen-ui/popover';
import { ToastProvider } from '@leafygreen-ui/toast';
import Card from '@leafygreen-ui/card';
import Button from '@leafygreen-ui/button';

import styles from './Home.module.css';

import Header from '@/components/Header/Header';
import AccountsCards from '@/components/AccountsCards/AccountsCards';
import Transactions from '@/components/Transactions/Transactions';
import Chatbot from '@/components/Chatbot/Chatbot';
import Form from '@/components/Form/Form';
import { fetchUserData } from '@/lib/api/userDataApi';

const Home = () => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [activeAccounts, setActiveAccounts] = useState([]);

  // Initialize popupOpen and popupTitle states
  const [popupOpen, setPopupOpen] = useState(false);
  const [popupTitle, setPopupTitle] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const userString = localStorage.getItem('selectedUser');
      if (userString) {
        const user = JSON.parse(userString);
        setSelectedUser(user);
        handleRefresh(user);
      }
    }
  }, []);

  const handleRefresh = async (user) => {
    if (user) {
      const data = await fetchUserData(user.id);
      localStorage.setItem('accounts', JSON.stringify(data.accounts));
      localStorage.setItem('transactions', JSON.stringify(data.transactions));

      setActiveAccounts(data.accounts);
      setRecentTransactions(data.transactions);
    }
  };

  const handleOpenForm = () => {
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
  };

  const toggleChatbot = () => {
    setIsOpen(!isOpen);
  };

  const handlePaypalPayment = () => {
    setPopupTitle('New Digital Payment');
    setPopupOpen(true);
  };

  const handleNewTransaction = () => {
    setPopupTitle('New Transaction');
    setPopupOpen(true);
  };

  const handleLogout = () => {
    setSelectedUser(null);
    window.location.reload(); // or use a router to redirect
  };

  if (!selectedUser) {
    return <div>Please select a user to continue.</div>; // Provide feedback when no user is selected
  }

  return (
    <>
      <Head>
        <title>Leafy Bank</title>
        <link rel="icon" href="favicon.ico" />
      </Head>
      <ToastProvider>
        <Header onLogout={handleLogout} />

        <div style={{ margin: '80px 20px', transition: 'left 0.3s ease' }}>
          <div style={{ display: 'flex', flexDirection: 'column' }}>

            <div style={{ display: 'flex', alignItems: 'center' }}>
              <H2>My Accounts&nbsp;</H2>
              <IconButton
                darkMode={false}
                aria-label="Some Menu"
                onClick={() => handleRefresh(selectedUser)}
                style={{ marginTop: '5px', marginLeft: '10px' }}
                onMouseEnter={() => setIsHovering(true)}
                onMouseLeave={() => setIsHovering(false)}
              >
                <RefreshIcon />
                <Popover active={isHovering} align="right" justify="middle" usePortal={true}>
                  <Body style={{ padding: '10px', borderRadius: '10px', backgroundColor: '#f5f5f5' }}>Refresh</Body>
                </Popover>
              </IconButton>
            </div>
          </div>

          <div>
            <div className={styles.fixedButtons}>
              {!popupOpen && (
                <>
                  <Button variant="baseGreen" onClick={handlePaypalPayment} style={{ marginRight: '2px' }}>Digital Payment</Button>
                  <Button variant="baseGreen" onClick={handleNewTransaction}>Account Transfer</Button>
                </>
              )}
            </div>
            {popupOpen && (
                <div className={styles.popupOverlay}>
                <Card className={styles.transactionCard}>
                  <Form className={styles.transactionForm} setPopupOpen={setPopupOpen} popupTitle={popupTitle} />
                </Card>
              </div>            
            )}

            <div className={styles.bottomMenu}>
              <div className={styles.menuItem} onClick={handleOpenForm}>
                <img src="/images/account.svg" alt="New Account Icon" className={styles.icon} />
                <Body>New Account</Body>
              </div>
              <div className={styles.menuItem} onClick={handlePaypalPayment}>
                <img src="/images/payment.svg" alt="Payment Icon" className={styles.icon} />
                <Body>Payment</Body>
              </div>
              <div className={styles.menuItem} onClick={handleNewTransaction}>
                <img src="/images/transfer.svg" alt="Transfer Icon" className={styles.icon} />
                <Body>Transfer</Body>
              </div>
              <div className={styles.menuItem} onClick={toggleChatbot}>
                <img src="/images/assistant.svg" alt="Assistant Icon" className={styles.icon} />
                <Body>Assistant</Body>
              </div>
            </div>

            <AccountsCards
              isFormOpen={isFormOpen}
              handleOpenForm={handleOpenForm}
              handleCloseForm={handleCloseForm}
            />

            <Chatbot isOpen={isOpen} toggleChatbot={toggleChatbot} />

            <div className={styles.chatbotButton} onClick={toggleChatbot}>
              <img src="/images/bot.svg" alt="Chat Icon" className={styles.chatIcon} />
              <div className={styles.textWrapper}>
                <span><Body className={styles.chatbotText}>Leafy Personal Assistant</Body></span>
                <div className={styles.statusWrapper}>
                  <div className={styles.indicator}></div>
                  <Body>Available</Body>
                </div>
              </div>
            </div>

            <H3>Recent Transactions</H3>
            <Transactions transactions={recentTransactions.transactions} />
          </div>

        </div>
      </ToastProvider>
    </>
  );
};

export default Home;

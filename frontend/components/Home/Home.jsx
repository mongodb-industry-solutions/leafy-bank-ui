"use client";

import { useState, useEffect } from "react";

import Head from 'next/head';
import { H2, H3, Body } from '@leafygreen-ui/typography';
import RefreshIcon from '@leafygreen-ui/icon/dist/Refresh';
import IconButton from '@leafygreen-ui/icon-button';
import Card from '@leafygreen-ui/card';
import Popover from '@leafygreen-ui/popover';
import { ToastProvider } from '@leafygreen-ui/toast';
import Button from '@leafygreen-ui/button';

import Header from '@/components/Header';
import AccountsCards from '@/components/AccountsCards';
import Transactions from '@/components/Transactions';
import Form from '@/components/Form';
import Chatbot from '@/components/Chatbot/Chatbot';

import styles from './Home.module.css'

const Home = () => {

  const [selected, setSelected] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [isHovering, setIsHovering] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isFormOpen, setFormOpen] = useState(false);


  const toggleChatbot = () => {
    setIsOpen(!isOpen);
  };

  // Function to open the form
  const handleOpenForm = () => {
    setFormOpen(true);
  };

  // Function to close the form
  const handleCloseForm = () => {
    setFormOpen(false);
  };

  const handleNewAccount = () => {
    handleOpenForm();
  };


  // Popup related states
  const [popupOpen, setPopupOpen] = useState(false);
  const [popupTitle, setPopupTitle] = useState('');

  const apiUrl = process.env.NEXT_PUBLIC_API_URL;

  const handleRefresh = async () => {
    const user = JSON.parse(localStorage.getItem('user'));
    const response = await fetch(`${apiUrl}/api/user/username/${user.username}`, { method: 'GET' });
    const exi = await response.json();
    const log = {};
    log._id = exi._id;
    log.username = user.username;
    log.email = exi.email;
    log.image_URL = exi.imgUrl;
    log.Number_linked_accounts = exi.linkedAccounts.length;
    log.Number_recent_transactions = exi.recentTransactions.length;
    localStorage.setItem('user', JSON.stringify(log));
    localStorage.setItem('recent_transactions', JSON.stringify(exi.recentTransactions));
    setTransactions(exi.recentTransactions);
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const user = JSON.parse(localStorage.getItem('user'));
      const bud = JSON.parse(localStorage.getItem('transactions'));
      if (!user || !bud) {
        window.location.href = '/user';
        return;
      }
      setTransactions(bud);
    }
  }, []);


  // Popup handler functions
  const handlePaypalPayment = () => {
    setPopupTitle('New Digital Payment');
    setPopupOpen(true);
  };

  const handleNewTransaction = () => {
    setPopupTitle('New Transaction');
    setPopupOpen(true);
  };

  return (
    <>
      <Head>
        <title>Leafy Bank</title>
        <link rel="icon" href="favicon.ico" />
      </Head>
      <ToastProvider>
        <Header />

        <div style={{ margin: '80px 20px', transition: 'left 0.3s ease' }}>
          <div style={{ display: 'flex', flexDirection: 'column' }}>

            <div style={{ display: 'flex', alignItems: 'center' }}>

              <H2>My Accounts&nbsp;</H2>
              <IconButton
                darkMode={false}
                aria-label="Some Menu"
                onClick={handleRefresh}
                style={{ marginTop: '5px', marginLeft: '10px' }}
                onMouseEnter={() => setIsHovering(true)}
                onMouseLeave={() => setIsHovering(false)}
              >
                <RefreshIcon />
                <Popover active={isHovering} align="right" justify="middle" usePortal={true} >
                  <Body style={{ padding: '10px', borderRadius: '10px', backgroundColor: '#f5f5f5' }}>Refresh</Body>
                </Popover>
              </IconButton>

            </div>
          </div>

          {/*<AccountsCards></AccountsCards>*/}

          <div >
            {/* Add buttons and popup at the bottom of the page*/}
            <div className={styles.fixedButtons}>
              {!popupOpen && (
                <>
                  {/* Desktop version buttons */}
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

            {/* Mobile-only bottom menu */}
            <div className={styles.bottomMenu}>
              <div className={styles.menuItem} onClick={handleOpenForm}> {/* New Account Button */}
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
              <div className={styles.menuItem} onClick={toggleChatbot}> {/* Chatbot as Assistant button */}
                <img src="/images/assistant.svg" alt="Assistant Icon" className={styles.icon} />
                <Body>Assistant</Body>
              </div>
            </div>

            {/* Pass isFormOpen and handleOpenForm, handleCloseForm as props */}
            <AccountsCards
              isFormOpen={isFormOpen}
              handleOpenForm={handleOpenForm}
              handleCloseForm={handleCloseForm}
            />

            {/* Pass the state to Chatbot - Modal only for mobile */}
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
            <Transactions transactions={transactions} />
          </div>



        </div>
      </ToastProvider>
    </>
  );
};

export default Home;
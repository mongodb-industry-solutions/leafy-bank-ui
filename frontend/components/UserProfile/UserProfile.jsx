"use client";

// UserProfile.jsx

import { useState, useEffect } from "react";
import { H3, Subtitle, Body } from '@leafygreen-ui/typography';
import Image from 'next/image';
import Card from '@leafygreen-ui/card';
import Button from '@leafygreen-ui/button';
import Icon from '@leafygreen-ui/icon';

import styles from './userProfile.module.css';

const UserProfile = () => {
    const [isPopupOpen, setIsPopupOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [activeAccounts, setActiveAccounts] = useState({ accounts: [] });
    const [recentTransactions, setRecentTransactions] = useState({ transactions: [] });

    useEffect(() => {
        // Retrieve data from localStorage
        const userString = localStorage.getItem('selectedUser');
        const activeAccountsString = localStorage.getItem('active_accounts');
        const recentTransactionsString = localStorage.getItem('recent_transactions');

        // Parse the JSON strings
        const user = userString ? JSON.parse(userString) : null;
        const accounts = activeAccountsString ? JSON.parse(activeAccountsString) : { accounts: [] };
        const transactions = recentTransactionsString ? JSON.parse(recentTransactionsString) : { transactions: [] };

        setSelectedUser(user);
        setActiveAccounts(accounts);
        setRecentTransactions(transactions);
    }, []);

    const togglePopup = () => {
        setIsPopupOpen(!isPopupOpen);
    };

    if (!selectedUser) {
        // Redirect or show a message if no user is selected
        return <div>Please select a user to view the profile.</div>;
    }

    return (
        <>
            <Button onClick={togglePopup} className={styles.userButton}>
                <span className={styles.username}>{selectedUser.name || 'User'}</span>
                <Icon glyph="Person" className={styles.userIcon} />
            </Button>
            {isPopupOpen && (
                <div className={styles.popupOverlay}>
                    <Card className={styles.popupCard}>
                        <H3>My Profile</H3>
                        <Image
                            className={styles.profileImage}
                            src={`/rsc/users/${selectedUser.id}.png`}
                            alt="User Avatar"
                            width={100}
                            height={100}
                            priority
                        />
                        <H3>{selectedUser.name}</H3>
                        <Body className={styles.id}>Customer ID: {selectedUser.id || 'XXXXXXXXX'}</Body>

                        <div className={styles.divider}></div>
                        <Subtitle>User Information</Subtitle>
                        <div className={styles.profileItem}>
                            <Subtitle>Username:</Subtitle>
                            <Body baseFontSize={16}>{selectedUser.name}</Body>
                        </div>
                        <div className={styles.profileItem}>
                            <Subtitle>Email:</Subtitle>
                            <Body baseFontSize={16}>{selectedUser.name + '@example.com' || 'user@example.com'}</Body>
                        </div>

                        <div className={styles.divider}></div>
                        <Subtitle>Account Information</Subtitle>
                        <div className={styles.profileItem}>
                            <Subtitle>Number of Accounts:</Subtitle>
                            <Body baseFontSize={16}>{activeAccounts.accounts.length}</Body>
                        </div>
                        <div className={styles.profileItem}>
                            <Subtitle>Recent Transactions:</Subtitle>
                            <Body baseFontSize={16}>{recentTransactions.transactions.length}</Body>
                        </div>

                        <Button onClick={togglePopup} className={styles.closeButton}>
                            Close
                        </Button>
                    </Card>
                </div>
            )}
        </>
    );
};

export default UserProfile;

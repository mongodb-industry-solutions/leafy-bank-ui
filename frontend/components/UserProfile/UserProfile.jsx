"use client";

// UserProfile.jsx

import { useState } from "react";
import { useSelector } from "react-redux";
import { H3, Subtitle, Body } from '@leafygreen-ui/typography';
import Image from 'next/image';
import Card from '@leafygreen-ui/card';
import Button from '@leafygreen-ui/button';
import Icon from '@leafygreen-ui/icon';

import styles from './userProfile.module.css';

const UserProfile = () => {
    const [isPopupOpen, setIsPopupOpen] = useState(false);

    // Accessing data from Redux store
    const selectedUser = useSelector(state => state.User.selectedUser);
    const accounts = useSelector(state => state.User.accounts.list);
    const transactions = useSelector(state => state.User.transactions.list);

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
                            src={'/images/userAvatar.png'}
                            alt="Profile"
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
                            <Body baseFontSize={16}>{selectedUser.email || 'user@example.com'}</Body>
                        </div>

                        <div className={styles.divider}></div>
                        <Subtitle>Account Information</Subtitle>
                        <div className={styles.profileItem}>
                            <Subtitle>Number of Accounts:</Subtitle>
                            <Body baseFontSize={16}>{accounts.length}</Body>
                        </div>
                        <div className={styles.profileItem}>
                            <Subtitle>Recent Transactions:</Subtitle>
                            <Body baseFontSize={16}>{transactions.length}</Body>
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

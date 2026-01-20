"use client";

// Login.jsx

import React, { useState, useEffect } from 'react';
import Icon from '@leafygreen-ui/icon';
import { Modal, Container } from 'react-bootstrap';
import { H2, Subtitle, Description, Body } from '@leafygreen-ui/typography';
import styles from './Login.module.css';
import User from '@/components/User/User';
import { USER_MAP } from "@/lib/constants";
import { fetchUserData } from '@/lib/api/userDataApi';
import Banner from "@leafygreen-ui/banner";
import { useRouter } from 'next/navigation';

const Login = ({ onUserSelected }) => {
    const [open, setOpen] = useState(false);
    const router = useRouter();

    // Updated to include UserName and BearerToken
    const [users, setUsers] = useState(
        Object.entries(USER_MAP).map(([id, details]) => ({
            id,
            name: details.UserName,
            bearerToken: details.BearerToken,
            role: details.Role
        }))
    );

    const [selectedUser, setSelectedUser] = useState(null);
    const [usersLoading, setUsersLoading] = useState(false);

    useEffect(() => {
        setOpen(true);
    }, []);

    const handleUserSelect = async (user) => {
        // Clear previous user session data
        localStorage.removeItem('selectedUser');
        localStorage.removeItem('accounts');
        localStorage.removeItem('transactions');
        // Clear previous external data
        localStorage.removeItem('external_accounts');
        localStorage.removeItem('external_products');
        localStorage.removeItem('connected_external_accounts');
        localStorage.removeItem('connected_external_products');

        // Set the selected user with BearerToken included
        setSelectedUser(user);
        localStorage.setItem('selectedUser', JSON.stringify(user));

        // Only fetch account/transaction data for non-Portfolio Manager roles
        if (user.role !== 'Portfolio Manager' && user.role !== 'Bank Analyst') {
            try {
                const data = await fetchUserData(user.id);
                localStorage.setItem('accounts', JSON.stringify(data.accounts));
                localStorage.setItem('transactions', JSON.stringify(data.transactions));
            } catch (error) {
                console.error('Failed to fetch user data', error);
            }
        }

        // Notify parent component about the selected user
        onUserSelected(user);

        // Redirect logic
        if (user.role === 'Portfolio Manager') {
            router.push('/asset-portfolio');
        } else if (user.role === 'Payment Analyst') {
            window.location.href = 'https://fsi-payments-processing.industrysolutions.prod.corp.mongodb.com/';
        } else if (user.role === 'Bank Analyst') {
            window.location.href = 'https://document-intelligence-ui.industrysolutions.prod.corp.mongodb.com/';
        }
    };


    return (
        <Modal
            show={open}
            onHide={() => {
                if (!selectedUser) {
                    alert("You must select a user before proceeding!");
                    return;
                }
                setOpen(false);
            }}
            size="lg"
            aria-labelledby="contained-modal-title-vcenter"
            centered
            fullscreen={'md-down'}
            className={styles.leafyFeel}
            backdrop="static"
        >
            <Container className={styles.modalContainer}>
                {!usersLoading && (
                    <div
                        className={`d-flex flex-row-reverse p-1 cursorPointer ${!selectedUser ? styles.disabledCloseButton : ''}`}
                        onClick={() => {
                            if (!selectedUser) {
                                alert("You must select a user before proceeding!");
                            } else {
                                setOpen(false);
                            }
                        }}
                    >
                        <Icon glyph="X" />
                    </div>
                )}
                <div className={styles.modalMainContent}>
                    <H2 className={styles.centerText}>Welcome to Leafy Bank</H2>
                    <Subtitle className={`${styles.weightNormal} ${styles.centerText} mt-2`}>This is a MongoDB demo</Subtitle>
                    <br />
                    <Description className={styles.descriptionModal}>
                        Please select the user you would like to login as:
                    </Description>

                    <div className={`${styles.usersContainer}`}>
                        {/* Map through users and pass `user` details to the `User` component */}
                        {users.map(user => (
                            <User
                                user={user}
                                isSelectedUser={selectedUser && selectedUser.id === user.id}
                                key={user.id}
                                setOpen={setOpen}
                                setLocalSelectedUser={handleUserSelect}
                            />
                        ))}
                    </div>

                    <div className={styles.parentContainer}>

                        <Banner>
                            Look out for  <Icon glyph="Wizard" fill="#889397" /> to find out more about what is going on behind the scenes!
                        </Banner>

                    </div>

                    <Description className={`${styles.descriptionModal} mb-3`}>
                        Note: Each user has pre-loaded data, such as recent transactions, and opened accounts. This variation is designed to showcase different scenarios, providing a more dynamic and realistic user experience for the demo.
                    </Description>
                </div>
            </Container>
        </Modal>
    );
};

export default Login;

"use client";

// Login.jsx

import React, { useState, useEffect } from 'react';
import Icon from '@leafygreen-ui/icon';
import { Modal, Container } from 'react-bootstrap';
import { H2, Subtitle, Description } from '@leafygreen-ui/typography';

import styles from './Login.module.css';
import User from '@/components/User/User';
import { USER_MAP } from "@/lib/constants";
import { fetchUserData } from '@/lib/api/userDataApi';

const Login = ({ onUserSelected }) => {
    const [open, setOpen] = useState(false);

    // Updated to include UserName and ApiKey
    const [users, setUsers] = useState(
        Object.entries(USER_MAP).map(([id, details]) => ({
            id,
            name: details.UserName,
            apiKey: details.ApiKey,
        }))
    );

    const [selectedUser, setSelectedUser] = useState(null);
    const [usersLoading, setUsersLoading] = useState(false);

    useEffect(() => {
        setOpen(true);
    }, []);

    const handleUserSelect = (user) => {
        // Clear previous user session data
        localStorage.removeItem('selectedUser');
        localStorage.removeItem('accounts');
        localStorage.removeItem('transactions');

        // Set the selected user with ApiKey included
        setSelectedUser(user);
        localStorage.setItem('selectedUser', JSON.stringify(user)); // Store UserName, ID, and ApiKey

        // Fetch and store user data
        fetchUserData(user.id).then(data => {
            localStorage.setItem('accounts', JSON.stringify(data.accounts));
            localStorage.setItem('transactions', JSON.stringify(data.transactions));

            // Notify parent component about the selected user
            onUserSelected(user);
        });
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
            <Container className="p-3 h-100">
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
                        Please select the user you would like to login as
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
                    <Description className={`${styles.descriptionModal} mb-3`}>
                        Note: Each user has pre-loaded data, such as recent transactions, and opened accounts. This variation is designed to showcase different scenarios, providing a more dynamic and realistic user experience for the demo.
                    </Description>
                </div>
            </Container>
        </Modal>
    );
};

export default Login;

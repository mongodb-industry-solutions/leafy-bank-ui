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

const Login = () => {
    const [open, setOpen] = useState(false);
    const [users, setUsers] = useState(Object.entries(USER_MAP).map(([id, name]) => ({ id, name })));
    const [selectedUser, setSelectedUser] = useState(null);
    const [usersLoading, setUsersLoading] = useState(false);

    useEffect(() => {
        setOpen(true);
    }, []);

    const handleUserSelect = (user) => {
        // Clear previous data
        localStorage.removeItem('selectedUser');
        localStorage.removeItem('active_accounts');
        localStorage.removeItem('recent_transactions');

        // Set new selected user
        setSelectedUser(user);
        localStorage.setItem('selectedUser', JSON.stringify(user));

        // Fetch and store new data
        fetchUserData(user.id).then(data => {
            localStorage.setItem('active_accounts', JSON.stringify(data.active_accounts));
            localStorage.setItem('recent_transactions', JSON.stringify(data.recent_transactions));
        });
    };

    return (
        <Modal
            show={open}
            onHide={() => setOpen(false)}
            size="lg"
            aria-labelledby="contained-modal-title-vcenter"
            centered
            fullscreen={'md-down'}
            className={styles.leafyFeel}
            backdrop="static"
        >
            <Container className='p-3 h-100'>
                {!usersLoading && (
                    <div className='d-flex flex-row-reverse p-1 cursorPointer' onClick={() => setOpen(false)}>
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

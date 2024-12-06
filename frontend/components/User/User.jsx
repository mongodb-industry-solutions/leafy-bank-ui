"use client";

// User.jsx

import React from 'react';
import { Body } from '@leafygreen-ui/typography';
import Card from '@leafygreen-ui/card';

import styles from './User.module.css';

const User = ({ user = null, isSelectedUser = false, setOpen, setLocalSelectedUser = null }) => {
    const selectUserAndCloseModal = () => {
        if (!setLocalSelectedUser) return;
        setLocalSelectedUser(user);
        setOpen(false);
    };

    return (
        <Card
            className={`${styles.userCard} ${user !== null ? 'cursorPointer' : ''} ${isSelectedUser ? styles.userSelected : ''}`}
            onClick={() => selectUserAndCloseModal()}
        >
            <img src={`/rsc/users/${user.id}.png`} alt="User Avatar" />
            <Body className={styles.userName}>{user.name}</Body>
        </Card>
    );
};

export default User;

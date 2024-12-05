"use client"

// User.jsx

import React from 'react';
import { useDispatch } from 'react-redux';
import { Body } from '@leafygreen-ui/typography';
import Card from '@leafygreen-ui/card';

import styles from './User.module.css'
import { setSelectedUser } from '@/redux/slices/UserSlice';

const User = ({ user = null, isSelectedUser = false, setOpen, setLocalSelectedUser = null }) => {
    const dispatch = useDispatch();

    const selectUserLocally = () => {
        if (!setLocalSelectedUser) return;
        setLocalSelectedUser(user);
    };

    const selectUserAndCloseModal = () => {
        if (!setLocalSelectedUser) return;
        selectUserLocally();
        dispatch(setSelectedUser(user));
        setOpen(false);
    };
    
    return (
        <Card
            className={`${styles.userCard} ${user !== null ? 'cursorPointer' : ''} ${isSelectedUser ? styles.userSelected : ''}`}
            onMouseEnter={() => selectUserLocally()}
            onClick={() => selectUserAndCloseModal()}
        >
            <img src={`/rsc/users/${user.id}.png`}></img>
            <Body className={styles.userName}>{user.name}</Body>
        </Card>
    );
};

export default User;

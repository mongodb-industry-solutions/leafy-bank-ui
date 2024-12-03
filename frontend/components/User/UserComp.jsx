
"use client"

import React from 'react';
import { useDispatch } from 'react-redux';
import { Body } from '@leafygreen-ui/typography';
import Card from '@leafygreen-ui/card';
import { Skeleton } from '@leafygreen-ui/skeleton-loader';

import styles from "./userComp.module.css";
import { setSelectedUser } from '@/redux/slices/UserSlice';

const UserComp = ({user = null, isSelectedUser = false, setOpen, setLocalSelectedUser = null}) => {
    const dispatch = useDispatch();

    const selectUserLocally = () => {
        if(!setLocalSelectedUser)
            return
        setLocalSelectedUser(user)
    }
    const selectUserAndCloseModal = () => {
        if(!setLocalSelectedUser)
            return
        selectUserLocally()
        dispatch(setSelectedUser(user))
        setOpen(false)
    }

    return (
        <Card 
            className={`${styles.userCard} ${user !== null ? 'cursorPointer' : ''} ${isSelectedUser ? styles.userSelected : ''}`}
            onMouseEnter={() => selectUserLocally()}
            onClick={() => selectUserAndCloseModal()}
        >
            {
                user === null
                ? <Skeleton></Skeleton>
                : <>
                    <img src={`/rsc/users/${user._id}.png`}></img>
                    <Body className={styles.userName}>{user.name}</Body>
                </>
            }

        </Card>
    );
};

export default UserComp;
"use client"

import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import Icon from '@leafygreen-ui/icon';
import { Modal, Container } from 'react-bootstrap';
import { H2, Subtitle, Description } from '@leafygreen-ui/typography';

import styles from "./loginComp.module.css";
import UserComp from '../user/UserComp';
import { fetchUserData, setLoadingUsersList, setUsersList } from '@/redux/slices/UserSlice';
import { fetchUsers } from '@/lib/api';

const LoginComp = () => {
    const dispatch = useDispatch();
    const [open, setOpen] = useState(false);
    const users = useSelector(state => state.User.usersList)
    const selectedUser = useSelector(state => state.User.selectedUser)
    const usersLoading = useSelector(state => state.User.loading)
    const [localSelectedUser, setLocalSelectedUser] = useState(null)

    useEffect(() => {
      const getAllUsers = async () => {
        try {
          const result = await fetchUsers();
          if(result){
            dispatch(setUsersList(result))
            if(result.length > 0)
                setLocalSelectedUser(result[0])
          }
          dispatch(setLoadingUsersList(false))
        } catch (err) {
  
        }
      };
      getAllUsers();
      return () => {}
    }, [])

    useEffect(() => {
      if(selectedUser !== null)
        dispatch(fetchUserData(selectedUser._id))
    }, [selectedUser, dispatch])
    
    useEffect(() => {
        setOpen(true);
    }, []);
    
  
    const handleClose = () => {
        setOpen(false)
    }

    return (
        <Modal
            show={open}
            onHide={handleClose}
            size="lg"
            aria-labelledby="contained-modal-title-vcenter"
            centered
            fullscreen={'md-down'}
            className={styles.leafyFeel}
            backdrop="static"
        >
            <Container className='p-3 h-100'>
               {
                !usersLoading &&  
                <div className='d-flex flex-row-reverse p-1 cursorPointer' onClick={handleClose}>
                    <Icon glyph="X" />
                </div>
               }
                <div className={styles.modalMainCOntent}>
                    <H2 className={styles.centerText}>Welcome to Leafy Pop-up store</H2>
                    <Subtitle className={`${styles.weightNormal} ${styles.centerText} mt-2`}>This is a MongoDB demo</Subtitle>
                    <br/>
                    <Description className={styles.descriptionModal}>
                        Please select the user you would like to login as
                    </Description>
                    <div className={`${styles.usersContainer}`}>
                        {
                            usersLoading === true
                            ? [0, 1, 2, 3, 4].map((item) => (
                                <UserComp 
                                    key={item}
                                ></UserComp>
                            ))
                            : users.length > 0
                            ? users.map((user, index) => (
                                <UserComp 
                                    key={index} 
                                    user={user} 
                                    isSelectedUser={localSelectedUser._id === user._id} 
                                    setOpen={setOpen}
                                    setLocalSelectedUser={setLocalSelectedUser}
                                ></UserComp>
                            ))
                            : 'No users found, please reload'
                        }
                    </div>
                    <Description className={`${styles.descriptionModal} mb-3`}>
                        Note: Each user has pre-loaded data, such as past orders and items in their cart, with content unique to them. This variation is designed to showcase different scenarios, providing a more dynamic and realistic user experience for the demo.
                    </Description>
                </div>
            </Container>
        </Modal>
    );
};

export default LoginComp;
"use client";

import { useEffect, useState, useRef } from 'react';
import styles from './AccountsCards.module.css';
import Button from '@leafygreen-ui/button';
import TextInput from '@leafygreen-ui/text-input';
import { Combobox, ComboboxOption } from '@leafygreen-ui/combobox';
import Card from '@leafygreen-ui/card';
import { Subtitle, Body, H3 } from '@leafygreen-ui/typography';
import Icon from '@leafygreen-ui/icon';
import IconButton from '@leafygreen-ui/icon-button';
import Popover from '@leafygreen-ui/popover';
import { createAccount } from '@/lib/api/accounts/accounts_api'; // Import the createAccount function

const AccountsCards = ({ isFormOpen, handleOpenForm, handleCloseForm }) => {
    const [accounts, setAccounts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [accountType, setAccountType] = useState('');
    const [accountBalance, setAccountBalance] = useState('');
    const [accountNumber, setAccountNumber] = useState('');
    const [openPopover, setOpenPopover] = useState(null);
    const popoverRef = useRef(null);

    // When opening the form, set a random account number
    const openForm = () => {
        const nbr = (Math.floor(Math.random() * 900000000) + 100000000).toString();
        setAccountNumber(nbr);
        handleOpenForm(); // Use the passed handler to open the form
    };

    const togglePopover = (index) => {
        setOpenPopover(openPopover === index ? null : index);
    };

    useEffect(() => {
        // Retrieve data from localStorage
        const activeAccountsString = localStorage.getItem('active_accounts');
        const accountsData = activeAccountsString ? JSON.parse(activeAccountsString) : { accounts: [] };

        setAccounts(accountsData.accounts);
        setLoading(false);
    }, []);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (popoverRef.current && !popoverRef.current.contains(event.target)) {
                setOpenPopover(null);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [popoverRef]);

    const handleSubmit = async () => {
        if (!accountBalance || !accountType) {
            alert('Account type and balance are required');
            return;
        }
        const user = JSON.parse(localStorage.getItem('selectedUser'));

        try {
            const newAccount = await createAccount({
                userName: user.name,
                userId: user.id,
                accountNumber: accountNumber,
                accountBalance: parseInt(accountBalance, 10),
                accountType: accountType
            });

            console.log("Account creation response:", newAccount);

            // Update local state and localStorage with the new account
            const updatedAccounts = [...accounts, newAccount];
            setAccounts(updatedAccounts);
            localStorage.setItem('active_accounts', JSON.stringify({ accounts: updatedAccounts }));

            handleCloseForm(); // Close the form after submitting
        } catch (error) {
            console.error('Error creating account:', error);
            alert('Failed to create account. Please try again.');
        }
    };

    return (
        <div className={styles.cardsWrapper}>
            {loading ? (
                <div className={styles.loading}>
                    Loading...
                </div>
            ) : (
                <>
                    <div className={styles.cardsContainer}>
                        {accounts.map((account, index) => (
                            <Card key={index} className={styles.card}>
                                <div className={styles.cardContent}>
                                    <div className={styles.cardHeader}>
                                        <Subtitle>{account?.AccountType || 'N/A'}</Subtitle>
                                        <IconButton
                                            aria-label="Info"
                                            onClick={() => togglePopover(index)}
                                            className={styles.infoButton}
                                        >
                                            <Icon glyph="InfoWithCircle" />
                                        </IconButton>
                                        <Popover
                                            align="top"
                                            justify="end"
                                            active={openPopover === index}
                                            ref={popoverRef}
                                            className={styles.popover}
                                        >
                                            <div className={styles.popoverContent}>
                                                <Body><strong>Currency:</strong> {account?.AccountCurrency || 'N/A'}</Body>
                                                <Body><strong>Bank:</strong> {account?.AccountBank || 'N/A'}</Body>
                                                <Body><strong>Opening Date:</strong> {new Date(account?.AccountDate?.OpeningDate).toLocaleDateString() || 'N/A'}</Body>
                                                <Body><strong>Transfer Limit:</strong> $500</Body>
                                            </div>
                                        </Popover>
                                    </div>

                                    <div><Body className={styles.accNumber}>Account Number: {account?.AccountNumber || 'N/A'}</Body></div>

                                    <div className={styles.accBalance}>
                                        <H3 className={styles.balance}>{account?.AccountCurrency} {account?.AccountBalance?.toLocaleString() || 'N/A'}</H3>
                                        <Body>Available Balance</Body>
                                    </div>

                                </div>
                            </Card>
                        ))}
                    </div>
                </>
            )}
            <div className={styles.formContainer}>
                {!isFormOpen && (
                    <Button className={styles.hideOnMobile} size="default" onClick={openForm} style={{ marginTop: '10px' }}>
                        {'Open New Account'}
                    </Button>
                )}
                {isFormOpen && (
                    <div className={styles.popupOverlay}>
                        <Card style={{ width: '250px' }}>
                            <div className={styles.form}>

                                <Subtitle>New Account</Subtitle>
                                <TextInput
                                    label="Account Number:"
                                    value={accountNumber}
                                    disabled={true}
                                />
                                <TextInput
                                    label="Account Balance:"
                                    placeholder="100"
                                    onChange={(e) => setAccountBalance(e.target.value)}
                                    value={accountBalance}
                                />
                                <Combobox label="Account type:" placeholder="type" value={accountType} onChange={(value) => setAccountType(value)}>
                                    <ComboboxOption className={styles.comboboxDropdown} value="Checking" />
                                    <ComboboxOption className={styles.comboboxDropdown} value="Savings" />
                                </Combobox>

                                <div className={styles.formButtons}>
                                    <Button size="default" onClick={handleCloseForm} style={{ marginTop: '10px', marginRight: '10px' }}>
                                        Close
                                    </Button>
                                    <Button variant="primary" size="default" onClick={handleSubmit} style={{ marginTop: '10px' }}>
                                        Submit
                                    </Button>
                                </div>
                            </div>
                        </Card>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AccountsCards;

"use client";

// Form.jsx

import { useState, useEffect } from "react";
import { NumberInput } from '@leafygreen-ui/number-input';
import { SearchInput, SearchResult } from '@leafygreen-ui/search-input';
import { Subtitle } from '@leafygreen-ui/typography';
import { useToast } from '@leafygreen-ui/toast';
import Button from '@leafygreen-ui/button';

import styles from './Form.module.css';

import { fetchActiveAccounts, fetchActiveAccountsForUser } from '@/lib/api/accounts/accounts_api';
import { performAccountTransfer, performDigitalPayment } from '@/lib/api/transactions/transactions_api';


const Form = ({ setPopupOpen, popupTitle }) => {

    const TRANSACTION_LIMIT = 500; // Transaction limit set here

    const [amount, setAmount] = useState(null);
    const [paymentMethod, setPaymentMethod] = useState(null);
    const [Originator, setOriginator] = useState(null);
    const [Beneficiary, setBeneficiary] = useState(null);
    const { pushToast } = useToast();
    const [value1, setValue1] = useState([]);
    const [value2, setValue2] = useState([]);
    const [loading, setLoading] = useState(false);  // New loading state

    const fetchAccounts = async () => {
        try {
            const response = await fetchActiveAccounts({});
            if (!response.ok) {
                throw new Error(`Error fetching accounts: ${response.status}`);
            }
            const data = await response.json();
            const accounts = data.accounts;
            return accounts;
        } catch (error) {
            console.error("Failed to fetch accounts:", error);
            throw error;
        }
    };

    const fetchUserAccounts = async () => {
        const user = JSON.parse(localStorage.getItem('selectedUser'));
        try {
            const response = await fetchActiveAccountsForUser({user_identifier: user.id});
            if (!response.ok) {
                throw new Error(`Error fetching accounts: ${response.status}`);
            }
            const data = await response.json();
            const accounts = data.accounts;
            return accounts;
        } catch (error) {
            console.error("Failed to fetch accounts:", error);
            throw error;
        }
    };

    function findAccountByNumber(accounts, AccountNumber) {
        return accounts.find(account => account.AccountNumber === AccountNumber);
    }

    const handleSubmit = async () => {
        setLoading(true);  // Disable button when submission starts
        setPopupOpen(false);


        if (amount > TRANSACTION_LIMIT) {
            alert(`Transaction amount cannot exceed ${TRANSACTION_LIMIT}`);
            setLoading(false);
            return;
        }

        if (Beneficiary === Originator) {
            alert("Beneficiary can't be the same as the Originator");
            setLoading(false);  // Re-enable button
            return;
        } else {
            const Ori = findAccountByNumber(value1, Originator);
            const Benef = findAccountByNumber(value2, Beneficiary);

            if (popupTitle === 'New Digital Payment') {
                try {
                    const response = await performDigitalPayment({
                        account_id_sender: Ori._id,
                        account_id_receiver: Benef._id,
                        transaction_amount: amount,
                        sender_user_id: Ori.AccountUser.UserId,
                        sender_user_name: Ori.AccountUser.UserName,
                        sender_account_number: Ori.AccountNumber,
                        sender_account_type: Ori.AccountType,
                        receiver_user_id: Benef.AccountUser.UserId,
                        receiver_user_name: Benef.AccountUser.UserName,
                        receiver_account_number: Benef.AccountNumber,
                        receiver_account_type: Benef.AccountType,
                        payment_method: paymentMethod
                    });

                    if (response.ok) {
                        pushToast({title: "Digital Payment was successful.", variant: "success" , className: styles.customToast});
                    } else {
                        pushToast({ title: "Digital Payment failed.", variant: "warning", className: styles.customToast });
                    }
                } catch (error) {
                    pushToast({ title: "An error occurred.", variant: "warning" , className: styles.customToast});
                }
            } else {
                try {
                    const response = await performAccountTransfer({
                        account_id_sender: Ori._id,
                        account_id_receiver: Benef._id,
                        transaction_amount: amount,
                        sender_user_id: Ori.AccountUser.UserId,
                        sender_user_name: Ori.AccountUser.UserName,
                        sender_account_number: Ori.AccountNumber,
                        sender_account_type: Ori.AccountType,
                        receiver_user_id: Benef.AccountUser.UserId,
                        receiver_user_name: Benef.AccountUser.UserName,
                        receiver_account_number: Benef.AccountNumber,
                        receiver_account_type: Benef.AccountType
                    });
                    if (response.ok) {
                        pushToast({ title: "Account Transfer was successful.", variant: "success", className: styles.customToast });
                    } else {
                        pushToast({ title: "Account Transfer failed.", variant: "warning", className: styles.customToast });
                    }
                } catch (error) {
                    pushToast({ title: "An error occurred.", variant: "warning", className: styles.customToast });
                }
            }
        }
        setLoading(false);  // Re-enable button after submission is done
    };

    const generateOriginators = async () => {
        let accounts = [];
        accounts = await fetchAccounts();
        await setValue1(accounts);
    };

    const generateBeneficiary = async () => {
        let accounts = [];
        accounts = await fetchUserAccounts();
        await setValue2(accounts);
    };

    useEffect(() => {
        generateOriginators();
        generateBeneficiary();
    }, []);

    return (
        <form onSubmit={handleSubmit}>
            <Subtitle style={{ marginBottom: '10px' }}>{popupTitle}</Subtitle>
            <p>Transaction Limit: {TRANSACTION_LIMIT}</p> {/* Display transaction limit */}
            <NumberInput style={{ marginTop: '3px' }} value={amount} placeholder={'Transaction Amount'} onChange={event => setAmount(Number(event.target.value))} />
            {popupTitle !== 'New Transaction' && (
                <SearchInput style={{ marginTop: '10px' }} placeholder={'Payment method'} value={paymentMethod}
                    onChange={event => setPaymentMethod(event.target.value)}>
                    <SearchResult className={styles.comboboxDropdown} key={1} description={`Digital Payment`}>Paypal</SearchResult>
                    <SearchResult className={styles.comboboxDropdown} key={2} description={`Digital Payment`}>Zelle</SearchResult>
                    <SearchResult className={styles.comboboxDropdown} key={3} description={`Digital Payment`}>Venmo</SearchResult>
                </SearchInput>
            )}
            <SearchInput style={{ marginTop: '10px' }} placeholder={'Originator Account Number'} value={Originator}
                onChange={event => setOriginator(event.target.value)}>
                {value1.map((account, index) => (
                    <SearchResult  className={styles.comboboxDropdown} key={index} description={`${account.AccountUser.UserName} ${account.AccountType}`}>
                        {account.AccountNumber}
                    </SearchResult>
                ))}
            </SearchInput>
            <SearchInput style={{ marginTop: '10px' }} placeholder={'Beneficiary Account Number'} value={Beneficiary}
                onChange={event => setBeneficiary(event.target.value)}>
                {value2.map((account, index) => (
                    <SearchResult className={styles.comboboxDropdown} key={index} description={`${account.AccountUser.UserName} ${account.AccountType}`}>
                        {account.AccountNumber}
                    </SearchResult>
                ))}
            </SearchInput>
            <div>
                <Button onClick={() => setPopupOpen(false)} style={{ marginTop: '15px', marginLeft: '25%' }}>Close</Button>
                <Button variant="primary" onClick={handleSubmit} style={{ marginLeft: '10px' }} disabled={loading}>
                    {loading ? 'Submitting...' : 'Submit'}
                </Button>
            </div>
        </form>
    );
};

export default Form;

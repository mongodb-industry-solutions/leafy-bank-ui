"use client";

// Form.jsx

import { useState, useEffect } from "react";
import { NumberInput } from "@leafygreen-ui/number-input";
import { SearchInput, SearchResult } from "@leafygreen-ui/search-input";
import { Subtitle } from "@leafygreen-ui/typography";
import { useToast } from "@leafygreen-ui/toast";
import Button from "@leafygreen-ui/button";

import styles from "./Form.module.css";

import {
    fetchActiveAccounts,
    fetchActiveAccountsForUser,
} from "@/lib/api/accounts/accounts_api";
import {
    performAccountTransfer,
    performDigitalPayment,
} from "@/lib/api/transactions/transactions_api";

const TRANSACTION_LIMIT = 500;

const Form = ({ setPopupOpen, popupTitle }) => {
    const [amount, setAmount] = useState("");
    const [paymentMethod, setPaymentMethod] = useState("");
    const [originator, setOriginator] = useState("");
    const [beneficiary, setBeneficiary] = useState("");
    const [originatorAccounts, setOriginatorAccounts] = useState([]);
    const [beneficiaryAccounts, setBeneficiaryAccounts] = useState([]);
    const [loading, setLoading] = useState(false);
    const { pushToast } = useToast();

    useEffect(() => {
        const fetchAccountsData = async () => {
            try {
                const userAccounts = await fetchUserAccounts();
                setOriginatorAccounts(userAccounts || []);

                const activeAccounts = await fetchActiveAccounts();
                setBeneficiaryAccounts(activeAccounts.accounts || []);
            } catch (error) {
                console.error("Error fetching accounts data:", error);
                setOriginatorAccounts([]);
                setBeneficiaryAccounts([]);
            }
        };

        fetchAccountsData();
    }, []);

    const fetchUserAccounts = async () => {
        try {
            const user = JSON.parse(localStorage.getItem("selectedUser")) || {};
            if (!user.id) {
                console.error("User not found in localStorage or invalid format");
                return [];
            }

            const data = await fetchActiveAccountsForUser(user.id);
            return data?.accounts || [];
        } catch (error) {
            console.error("Error fetching user accounts:", error);
            return [];
        }
    };

    const findAccountByNumber = (accounts, accountNumber) =>
        accounts.find((account) => account.AccountNumber === accountNumber);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        if (!amount || amount <= 0) {
            alert("Please enter a valid transaction amount.");
            setLoading(false);
            return;
        }

        if (amount > TRANSACTION_LIMIT) {
            alert(`Transaction amount cannot exceed ${TRANSACTION_LIMIT}`);
            setLoading(false);
            return;
        }

        if (!originator || !beneficiary) {
            alert("Both Originator and Beneficiary accounts must be selected.");
            setLoading(false);
            return;
        }

        if (beneficiary === originator) {
            alert("Beneficiary can't be the same as the Originator");
            setLoading(false);
            return;
        }

        const originatorAccount = findAccountByNumber(originatorAccounts, originator);
        const beneficiaryAccount = findAccountByNumber(beneficiaryAccounts, beneficiary);

        if (!originatorAccount || !beneficiaryAccount) {
            alert("Invalid Originator or Beneficiary account.");
            setLoading(false);
            return;
        }

        try {
            const transactionDetails = {
                account_id_sender: originatorAccount._id,
                account_id_receiver: beneficiaryAccount._id,
                transaction_amount: amount,
                sender_user_id: originatorAccount.AccountUser?.UserId || "N/A",
                sender_user_name: originatorAccount.AccountUser?.UserName || "N/A",
                sender_account_number: originatorAccount.AccountNumber,
                sender_account_type: originatorAccount.AccountType,
                receiver_user_id: beneficiaryAccount.AccountUser?.UserId || "N/A",
                receiver_user_name: beneficiaryAccount.AccountUser?.UserName || "N/A",
                receiver_account_number: beneficiaryAccount.AccountNumber,
                receiver_account_type: beneficiaryAccount.AccountType,
            };

            const response =
                popupTitle === "New Digital Payment"
                    ? await performDigitalPayment({
                          ...transactionDetails,
                          payment_method: paymentMethod || "N/A",
                      })
                    : await performAccountTransfer(transactionDetails);

            pushToast({
                title: response.ok
                    ? `${popupTitle} was successful.`
                    : `${popupTitle} failed.`,
                variant: response.ok ? "success" : "warning",
                className: styles.customToast,
            });
        } catch (error) {
            console.error("Transaction error:", error);
            pushToast({
                title: "An error occurred.",
                variant: "warning",
                className: styles.customToast,
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <p>Transaction Limit: {TRANSACTION_LIMIT}</p>
            <Subtitle style={{ marginBottom: "10px" }}>{popupTitle}</Subtitle>
            <form onSubmit={handleSubmit}>
                <NumberInput
                    style={{ marginTop: "3px" }}
                    value={amount}
                    placeholder="Transaction Amount"
                    onChange={(event) => setAmount(Number(event.target.value) || "")}
                />
                {popupTitle !== "New Transaction" && (
                    <SearchInput
                        style={{ marginTop: "10px" }}
                        placeholder="Payment method"
                        value={paymentMethod}
                        onChange={(event) => setPaymentMethod(event.target.value)}
                    >
                        <SearchResult className={styles.comboboxDropdown} key={1} description="Digital Payment">
                            Paypal
                        </SearchResult>
                        <SearchResult className={styles.comboboxDropdown} key={2} description="Digital Payment">
                            Zelle
                        </SearchResult>
                        <SearchResult className={styles.comboboxDropdown} key={3} description="Digital Payment">
                            Venmo
                        </SearchResult>
                    </SearchInput>
                )}
                <SearchInput
                    style={{ marginTop: "10px" }}
                    placeholder="Originator Account Number"
                    value={originator}
                    onChange={(event) => setOriginator(event.target.value)}
                >
                    {originatorAccounts.map((account, index) => (
                        <SearchResult
                            className={styles.comboboxDropdown}
                            key={index}
                            description={`${account.AccountUser?.UserName || "Unknown User"} ${
                                account.AccountType
                            }`}
                        >
                            {account.AccountNumber}
                        </SearchResult>
                    ))}
                </SearchInput>
                <SearchInput
                    style={{ marginTop: "10px" }}
                    placeholder="Beneficiary Account Number"
                    value={beneficiary}
                    onChange={(event) => setBeneficiary(event.target.value)}
                >
                    {beneficiaryAccounts.map((account, index) => (
                        <SearchResult
                            className={styles.comboboxDropdown}
                            key={index}
                            description={`${account.AccountUser?.UserName || "Unknown User"} ${
                                account.AccountType
                            }`}
                        >
                            {account.AccountNumber}
                        </SearchResult>
                    ))}
                </SearchInput>
                <div>
                    <Button
                        onClick={() => setPopupOpen(false)}
                        style={{ marginTop: "15px", marginLeft: "25%" }}
                    >
                        Close
                    </Button>
                    <Button
                        variant="primary"
                        type="submit"
                        style={{ marginLeft: "10px" }}
                        disabled={loading}
                    >
                        {loading ? "Submitting..." : "Submit"}
                    </Button>
                </div>
            </form>
        </div>
    );
};

export default Form;

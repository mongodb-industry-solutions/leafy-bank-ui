"use client";

// Form.jsx

import React, { useEffect, useState } from 'react';
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

const Form = ({ setPopupOpen, popupTitle, handleCloseForm, handleRefresh }) => { 
  const [amount, setAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [originator, setOriginator] = useState("");
  const [beneficiary, setBeneficiary] = useState("");
  const [originatorAccounts, setOriginatorAccounts] = useState([]);
  const [beneficiaryAccounts, setBeneficiaryAccounts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [amountTouched, setAmountTouched] = useState(false);
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

  const validateInputs = () => {
    if (!amount || amount <= 0) {
      alert("Please enter a valid transaction amount.");
      return false;
    }

    if (amount > TRANSACTION_LIMIT) {
      alert(`Transaction amount cannot exceed ${TRANSACTION_LIMIT}`);
      return false;
    }

    if (!originator || !beneficiary) {
      alert("Both Originator and Beneficiary accounts must be selected.");
      return false;
    }

    if (beneficiary === originator) {
      alert("Beneficiary can't be the same as the Originator");
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateInputs()) return;
  
    setLoading(true); // Set loading state to true immediately
  
    const originatorAccount = findAccountByNumber(originatorAccounts, originator);
    const beneficiaryAccount = findAccountByNumber(beneficiaryAccounts, beneficiary);
  
    if (!originatorAccount || !beneficiaryAccount) {
      alert("Invalid Originator or Beneficiary account.");
      setLoading(false);
      return;
    }
  
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
  
    try {
      const transactionResponse =
        popupTitle === "New Digital Payment"
          ? await performDigitalPayment({
              ...transactionDetails,
              payment_method: paymentMethod || "N/A",
            })
          : await performAccountTransfer(transactionDetails);
  
      if (transactionResponse.transaction_id) {
        pushToast({
          title: `${popupTitle} was successful. Transaction ID: ${transactionResponse.transaction_id}`,
          variant: "success",
          className: styles.customToast,
        });

        handleCloseForm(); // Close the form after refreshing
        setPopupOpen(false); // Ensure popup is closed after transaction
  
        // After successful transaction, trigger the data refresh
        const user = JSON.parse(localStorage.getItem("selectedUser"));
        await handleRefresh(user); // This refreshes both accounts and transactions
  
      } else {
        throw new Error("Transaction ID not found, transaction failed.");
      }
    } catch (error) {
      console.error("Transaction error:", error);
      pushToast({
        title: "An error occurred.",
        variant: "warning",
        className: styles.customToast,
      });
    } finally {
      setLoading(false); // Ensure to reset loading when finished
    }
  };  

  const refreshAccountData = async () => {
    try {
      const userAccounts = await fetchUserAccounts();
      setOriginatorAccounts(userAccounts || []);

      const activeAccounts = await fetchActiveAccounts();
      setBeneficiaryAccounts(activeAccounts.accounts || []);
    } catch (error) {
      console.error("Error refreshing accounts data:", error);
    }
  };

  const handlePaymentMethodSelect = (method) => {
    setPaymentMethod(method);
  };

  const handleOriginatorSelect = (accountNumber) => {
    setOriginator(accountNumber);
  };

  const handleBeneficiarySelect = (accountNumber) => {
    setBeneficiary(accountNumber);
  };

  return (
    <div>
      <p>Transaction Limit: {TRANSACTION_LIMIT}</p>
      <Subtitle style={{ marginBottom: "10px" }}>{popupTitle}</Subtitle>
      <NumberInput
        style={{ marginTop: "3px" }}
        value={amount}
        placeholder="Transaction Amount"
        state={(amountTouched && amount <= 0) ? "error" : "none"}
        errorMessage="Enter a valid number greater than zero."
        aria-label="Enter transaction amount"
        onBlur={() => setAmountTouched(true)}
        onChange={(event) => setAmount(Number(event.target.value) || "")}
      />
      {popupTitle !== "New Transaction" && (
        <SearchInput
          style={{ marginTop: "10px" }}
          placeholder="Payment method"
          value={paymentMethod}
          onChange={() => { }}
        >
          <SearchResult
            className={styles.comboboxDropdown}
            key="paypal"
            description="Digital Payment"
            onClick={() => handlePaymentMethodSelect("Paypal")}
          >
            Paypal
          </SearchResult>
          <SearchResult
            className={styles.comboboxDropdown}
            key="zelle"
            description="Digital Payment"
            onClick={() => handlePaymentMethodSelect("Zelle")}
          >
            Zelle
          </SearchResult>
          <SearchResult
            className={styles.comboboxDropdown}
            key="venmo"
            description="Digital Payment"
            onClick={() => handlePaymentMethodSelect("Venmo")}
          >
            Venmo
          </SearchResult>
        </SearchInput>
      )}
      <SearchInput
        style={{ marginTop: "10px" }}
        placeholder="Originator Account Number"
        value={originator}
        onChange={() => { }}
      >
        {originatorAccounts.map((account) => (
          <SearchResult
            className={styles.comboboxDropdown}
            key={account.AccountNumber}
            description={`${account.AccountUser?.UserName || "Unknown User"} ${account.AccountType}`}
            onClick={() => handleOriginatorSelect(account.AccountNumber)}
          >
            {account.AccountNumber}
          </SearchResult>
        ))}
      </SearchInput>
      <SearchInput
        style={{ marginTop: "10px" }}
        placeholder="Beneficiary Account Number"
        value={beneficiary}
        onChange={() => { }}
      >
        {beneficiaryAccounts.map((account) => (
          <SearchResult
            className={styles.comboboxDropdown}
            key={account.AccountNumber}
            description={`${account.AccountUser?.UserName || "Unknown User"} ${account.AccountType}`}
            onClick={() => handleBeneficiarySelect(account.AccountNumber)}
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
          type="button"
          onClick={handleSubmit}
          style={{ marginLeft: "10px" }}
          disabled={loading}
        >
          {loading ? "Submitting..." : "Submit"}
        </Button>
      </div>
    </div>
  );
};

export default Form;

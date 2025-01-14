"use client";

import { useEffect, useState, useRef } from "react";
import styles from "./AccountsCards.module.css";
import Button from "@leafygreen-ui/button";
import TextInput from "@leafygreen-ui/text-input";
import { Combobox, ComboboxOption } from "@leafygreen-ui/combobox";
import Card from "@leafygreen-ui/card";
import { Subtitle, Body, H3 } from "@leafygreen-ui/typography";
import Icon from "@leafygreen-ui/icon";
import IconButton from "@leafygreen-ui/icon-button";
import Popover from "@leafygreen-ui/popover";
import { createAccount } from "@/lib/api/accounts/accounts_api";
import { fetchExternalAccountsForUser } from "@/lib/api/open_finance/open_finance_api";
import { useToast } from "@leafygreen-ui/toast";
import BankConnection from "../BankConnection/BankConnection";
import Badge from "@leafygreen-ui/badge";
import Modal from "@leafygreen-ui/modal";

const AccountsCards = ({
    isFormOpen,
    handleOpenForm,
    handleCloseForm,
    handleRefresh,
}) => {
    const [accounts, setAccounts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [connectedBanks, setConnectedBanks] = useState([]);
    const [accountType, setAccountType] = useState("");
    const [accountBalance, setAccountBalance] = useState("");
    const [accountNumber, setAccountNumber] = useState("");
    const [openPopover, setOpenPopover] = useState(null);
    const [disconnectModalOpen, setDisconnectModalOpen] = useState(false); // Modal state
    const [selectedAccount, setSelectedAccount] = useState(null); // Account to disconnect
    const popoverRef = useRef(null);
    const { pushToast } = useToast();

    const validateInputs = () => {
        if (!accountBalance || parseInt(accountBalance, 10) <= 0) {
            alert("Please enter a valid account balance greater than zero.");
            return false;
        }

        if (!accountType) {
            alert("Account type is required.");
            return false;
        }

        return true;
    };

    const openForm = () => {
        const nbr = (Math.floor(Math.random() * 900000000) + 100000000).toString();
        setAccountNumber(nbr);
        handleOpenForm();
    };

    const togglePopover = (index) => {
        setOpenPopover(openPopover === index ? null : index);
    };

    const addBankAccount = async (bankName) => {
        setConnectedBanks((prevBanks) =>
            prevBanks.includes(bankName) ? prevBanks : [...prevBanks, bankName]
        );

        const fetchedAccounts = await fetchAndMergeAccounts([bankName]);

        if (fetchedAccounts.length === 0) {
            pushToast({
                title: `No accounts found for ${bankName}.`,
                variant: "warning",
                className: styles.customToast,
            });
            return false; // Indicating no accounts were found
        }
        return true; // Indicating accounts were found
    };

    const fetchAndMergeAccounts = async (banksToFetch) => {
        const user = JSON.parse(localStorage.getItem("selectedUser"));
        const fetchedAccounts = [];

        if (!user) {
            pushToast({
                title: "No user selected!",
                variant: "warning",
                className: styles.customToast,
            });
            return fetchedAccounts;
        }

        try {
            for (const bankName of banksToFetch) {
                console.log(`Fetching accounts for bank: ${bankName}`);

                const externalAccountsData = await fetchExternalAccountsForUser(
                    user.id,
                    bankName,
                    user.apiKey
                );

                console.log(`Fetched data for ${bankName}:`, externalAccountsData);

                const processedAccounts = externalAccountsData.accounts.map((account) => ({
                    ...account,
                    isExternalAccount: true,
                    bankName,
                }));

                fetchedAccounts.push(...processedAccounts);
            }

            setAccounts((prevAccounts) => [
                ...prevAccounts.filter(
                    (acc) =>
                        !fetchedAccounts.some((newAcc) => newAcc.AccountNumber === acc.AccountNumber)
                ),
                ...fetchedAccounts,
            ]);
        } catch (error) {
            console.error("Error fetching external accounts:", error);
            pushToast({
                title: "Failed to fetch external accounts. Please try again.",
                variant: "warning",
                className: styles.customToast,
            });
        } finally {
            setLoading(false);
        }

        return fetchedAccounts;
    };

    const handleDisconnectClick = (account) => {
        setSelectedAccount(account);
        setDisconnectModalOpen(true);
    };

    const confirmDisconnect = () => {
        if (selectedAccount) {
            // Remove the disconnecting account from the list
            setAccounts((prevAccounts) =>
                prevAccounts.filter((acc) => acc.AccountNumber !== selectedAccount.AccountNumber)
            );

            setDisconnectModalOpen(false);

            pushToast({
                title: "Your external bank has been successfully disconnected.",
                variant: "success",
            });

            setSelectedAccount(null);
        }
    };

    useEffect(() => {
        const initializeData = async () => {
            const user = JSON.parse(localStorage.getItem("selectedUser"));
            if (user) {
                const activeAccountsString = localStorage.getItem("accounts");
                const accountsData = activeAccountsString
                    ? JSON.parse(activeAccountsString)
                    : { accounts: [] };
                setAccounts(accountsData.accounts);
                if (connectedBanks.length > 0) {
                    setLoading(true);
                    await fetchAndMergeAccounts(connectedBanks);
                } else {
                    setLoading(false);
                }
            } else {
                setLoading(false);
            }
        };
        initializeData();
    }, [connectedBanks]);

    const handleSubmit = async () => {
        if (!validateInputs()) return;

        setLoading(true);
        const user = JSON.parse(localStorage.getItem("selectedUser"));

        try {
            const newAccount = await createAccount({
                userName: user.name,
                userId: user.id,
                accountNumber: accountNumber,
                accountBalance: parseInt(accountBalance, 10),
                accountType: accountType,
            });

            await handleRefresh(user);

            pushToast({
                title: `Account created successfully! Account ID: ${newAccount.account_id}`,
                variant: "success",
                className: `${styles.customToast} ${styles.centeredToast}`,
            });

            handleCloseForm();
        } catch (error) {
            console.error("Error creating account:", error);
            pushToast({
                title: "Failed to create account. Please try again.",
                variant: "warning",
                className: styles.customToast,
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.cardsWrapper}>
            {loading ? (
                <div className={styles.loading}>Loading...</div>
            ) : (
                <div className={styles.cardsContainer}>
                    {accounts.map((account, index) => (
                        <Card
                            key={index}
                            className={`${styles.card} ${account.isExternalAccount ? styles.externalCard : ""} ${
                                selectedAccount?.AccountNumber === account.AccountNumber ? styles.selectedCard : ""
                            }`}
                        >
                            <div className={styles.cardContent}>
                                <div className={styles.cardHeader}>
                                    <Subtitle>{account?.AccountType || "N/A"}</Subtitle>
                                    {account?.isExternalAccount && (
                                        <Badge variant="blue" className={styles.bankBadge}>
                                            {account.bankName || "External Bank"}
                                        </Badge>
                                    )}
                                    <IconButton
                                        aria-label="Info"
                                        onClick={() => togglePopover(index)}
                                        className={styles.infoButton}
                                    >
                                        <Icon glyph="InfoWithCircle" />
                                    </IconButton>
                                    <IconButton
                                        aria-label="Disconnect"
                                        className={styles.disconnectButton}
                                        style={{
                                            display: account?.isExternalAccount
                                                ? "inline-block"
                                                : "none",
                                        }}
                                        onClick={() => handleDisconnectClick(account)}
                                    >
                                        <Icon glyph="Disconnect" />
                                    </IconButton>
                                    <Popover
                                        align="top"
                                        justify="end"
                                        active={openPopover === index}
                                        ref={popoverRef}
                                        className={styles.popover}
                                    >
                                        <div className={styles.popoverContent}>
                                            <Body>
                                                <strong>Currency:</strong>{" "}
                                                {account?.AccountCurrency || "N/A"}
                                            </Body>
                                            <Body>
                                                <strong>Bank:</strong> {account?.AccountBank || "N/A"}
                                            </Body>
                                            <Body>
                                                <strong>Opening Date:</strong>{" "}
                                                {new Date(account?.AccountDate?.OpeningDate).toLocaleDateString() || "N/A"}
                                            </Body>
                                            <Body>
                                                <strong>Transfer Limit:</strong> $500
                                            </Body>
                                        </div>
                                    </Popover>
                                </div>
                                <div>
                                    <Body className={styles.accNumber}>
                                        Account Number: {account?.AccountNumber || "N/A"}
                                    </Body>
                                </div>
                                <div className={styles.accBalance}>
                                    <H3 className={styles.balance}>
                                        {account?.AccountCurrency}{" "}
                                        {account?.AccountBalance?.toLocaleString() || "N/A"}
                                    </H3>
                                    <Body>Available Balance</Body>
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            )}
            <div className={styles.formContainer}>
                {!isFormOpen && (
                    <Button
                        className={styles.hideOnMobile}
                        leftGlyph={<Icon glyph="Plus" />}
                        size="default"
                        onClick={openForm}
                        style={{ marginRight: "20px", marginTop: "40px" }}
                    >
                        {"Open New Account"}
                    </Button>
                )}

                
                {/* I am commenting this out until it is fully functional */}
                <BankConnection
                    className={styles.connectBtn}
                    addBankAccount={addBankAccount}
                /> 

                {isFormOpen && (
                    <div className={styles.popupOverlay}>
                        <Card style={{ width: "250px" }}>
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
                                <Combobox
                                    label="Account type:"
                                    placeholder="type"
                                    value={accountType}
                                    onChange={(value) => setAccountType(value)}
                                >
                                    <ComboboxOption className={styles.comboboxDropdown} value="Checking" />
                                    <ComboboxOption className={styles.comboboxDropdown} value="Savings" />
                                </Combobox>

                                <div className={styles.formButtons}>
                                    <Button
                                        size="default"
                                        onClick={handleCloseForm}
                                        style={{ marginTop: "10px", marginRight: "10px" }}
                                    >
                                        Close
                                    </Button>
                                    <Button
                                        variant="primary"
                                        size="default"
                                        onClick={handleSubmit}
                                        style={{ marginTop: "10px" }}
                                        disabled={loading}
                                    >
                                        {loading ? "Submitting..." : "Submit"}
                                    </Button>
                                </div>
                            </div>
                        </Card>
                    </div>
                )}

                {/* Disconnect Confirmation Modal */}
                <Modal
                    open={disconnectModalOpen}
                    setOpen={setDisconnectModalOpen}
                    className={`${styles.modal} ${disconnectModalOpen ? styles.modalOverlay : ""}`}
                >
                    {selectedAccount && (
                        <div className={styles.modalContent}>
                            <img src="/images/disconnect.png" alt="Disconnect Account" width={300} />
                            <H3>Are you sure you want to disconnect this account?</H3>
                            <Body>Account Number: {selectedAccount.AccountNumber}</Body>
                            <Body>Bank: {selectedAccount.bankName}</Body>
                            <div className={styles.modalButtons}>
                                <Button
                                    variant="primary"
                                    onClick={confirmDisconnect}
                                >
                                    Yes
                                </Button>
                                <Button
                                    variant="default"
                                    onClick={() => setDisconnectModalOpen(false)}
                                >
                                    No
                                </Button>
                            </div>
                        </div>
                    )}
                </Modal>

            </div>
        </div>
    );
};

export default AccountsCards;

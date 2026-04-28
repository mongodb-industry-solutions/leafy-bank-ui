"use client";

// AccountsCards.jsx

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
import { useToast } from "@leafygreen-ui/toast";
import BankConnection from "../BankConnection/BankConnection";
import Badge from "@leafygreen-ui/badge";
import Modal from "@leafygreen-ui/modal";

// Phase 5.1: post-adapter, internal accounts ship BIAN field names
// (CurrentAccountNumber / CurrentAccountType / CurrentAccountBalanceRecord / …).
// External Open Finance accounts still ship the legacy shape (AccountNumber /
// AccountType / AccountBalance / AccountBank / …) — the helpers below read whichever
// is present so the same card renders both.
const ACCOUNT_TYPE_DISPLAY = {
    CURRENT: "Checking",
    SAVINGS: "Savings",
    FIXED_DEPOSIT: "Fixed Deposit",
};

const acctNumber = (item) => item?.CurrentAccountNumber ?? item?.AccountNumber;
const acctType = (item) => {
    const bian = item?.CurrentAccountType;
    if (bian) return ACCOUNT_TYPE_DISPLAY[bian] || bian;
    return item?.AccountType;
};
const acctBalance = (item) =>
    item?.CurrentAccountBalanceRecord?.CurrentAccountBalanceAmount ?? item?.AccountBalance;
const acctCurrency = (item) => item?.CurrentAccountCurrencyCode || item?.AccountCurrency;
const acctOpenDate = (item) =>
    item?.CurrentAccountOpenDate ||
    item?.AccountDate?.OpeningDate ||
    item?.ProductDate?.OpeningDate;
const acctBank = (item) => item?._bankName || item?.AccountBank || item?.ProductBank;
const acctRef = (item) => item?.CurrentAccountReference || item?._id;

const AccountsCards = ({
    isFormOpen,
    handleOpenForm,
    handleCloseForm,
    handleRefresh,
    updateGlobalPosition,
    activeAccounts,
}) => {
    // State to hold accounts and products
    const [accountsAndProducts, setAccountsAndProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [accountType, setAccountType] = useState("");
    const [accountBalance, setAccountBalance] = useState("");
    const [accountNumber, setAccountNumber] = useState("");
    const [openPopover, setOpenPopover] = useState(null);
    const [disconnectModalOpen, setDisconnectModalOpen] = useState(false);
    const [selectedAccountOrProduct, setSelectedAccountOrProduct] = useState(null);
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

    const onBankConnected = ({ bank, accounts, products }) => {
        // Create arrays with additional flag to determine external account/product
        const externalAccounts = accounts.map((acc) => ({
            ...acc,
            isExternalAccount: true,
        }));

        const externalProducts = products.map((prod) => ({
            ...prod,
            isExternalProduct: true,
        }));

        // Filter out existing accounts/products from the same external bank
        const filteredAccountsAndProducts = accountsAndProducts.filter(
            (item) => acctBank(item) !== bank
        );

        // Add newly connected accounts/products to existing array
        const newAccountsAndProducts = [
            ...filteredAccountsAndProducts,
            ...externalAccounts,
            ...externalProducts,
        ];

        setAccountsAndProducts(newAccountsAndProducts);

        // Store external accounts and products in localStorage
        const externalAccountsData = newAccountsAndProducts.filter((item) => item.isExternalAccount);
        const externalProductsData = newAccountsAndProducts.filter((item) => item.isExternalProduct);

        localStorage.setItem('connected_external_accounts', JSON.stringify(externalAccountsData));
        localStorage.setItem('connected_external_products', JSON.stringify(externalProductsData));

        // After modifying the accounts/products, trigger the global position update
        updateGlobalPosition(); // This will notify Home.jsx to trigger GlobalPosition update

        pushToast({
            title: `Successfully connected to ${bank}!`,
            variant: "success",
            className: styles.customToast,
        });
    };

    const handleDisconnectClick = (item) => {
        setSelectedAccountOrProduct(item);
        setDisconnectModalOpen(true);
    };

    const confirmDisconnect = () => {
        if (selectedAccountOrProduct) {
            // Remove the selected account/product from the state
            const updatedAccountsAndProducts = accountsAndProducts.filter(
                (item) => acctRef(item) !== acctRef(selectedAccountOrProduct)
            );
            setAccountsAndProducts(updatedAccountsAndProducts);

            // Update the connected accounts/products in localStorage
            const externalAccountsData = updatedAccountsAndProducts.filter((item) => item.isExternalAccount);
            const externalProductsData = updatedAccountsAndProducts.filter((item) => item.isExternalProduct);

            // Store the updated accounts and products back in localStorage
            localStorage.setItem('connected_external_accounts', JSON.stringify(externalAccountsData));
            localStorage.setItem('connected_external_products', JSON.stringify(externalProductsData));

            // After modifying the accounts/products, trigger the global position update
            updateGlobalPosition(); // This will notify Home.jsx to trigger GlobalPosition update

            pushToast({
                title: "Your external item has been successfully disconnected.",
                variant: "success",
            });
            setSelectedAccountOrProduct(null);
            setDisconnectModalOpen(false);
        }
    };

    // Re-derive accountsAndProducts whenever Home's `activeAccounts` prop changes
    // (e.g. after a transfer triggers `handleRefresh` -> `setActiveAccounts(...)`).
    // External (Open Finance) accounts/products live in localStorage — managed by
    // BankConnection inside this component — so we still pull those from storage.
    useEffect(() => {
        try {
            const userString = localStorage.getItem("selectedUser");
            if (!userString) throw new Error("No user selected");

            const user = JSON.parse(userString);

            // Portfolio Manager has no banking data
            if (user.role === 'Portfolio Manager') {
                setAccountsAndProducts([]);
                return;
            }

            // Prefer the prop (live data); fall back to localStorage on first mount
            // before Home has finished its initial fetch.
            let internalAccountsList = activeAccounts?.accounts;
            if (!Array.isArray(internalAccountsList)) {
                const cached = JSON.parse(
                    localStorage.getItem("accounts") || '{"accounts":[]}'
                );
                internalAccountsList = cached?.accounts || [];
            }

            const connectedExternalAccounts = JSON.parse(
                localStorage.getItem('connected_external_accounts') || '[]'
            );
            const connectedExternalProducts = JSON.parse(
                localStorage.getItem('connected_external_products') || '[]'
            );

            setAccountsAndProducts([
                ...internalAccountsList,
                ...connectedExternalAccounts,
                ...connectedExternalProducts,
            ]);
        } catch (error) {
            console.error("Error initializing account data:", error);
            pushToast({
                title: "Failed to load accounts. Please try again.",
                variant: "warning",
                className: styles.customToast,
            });
        } finally {
            setLoading(false);
        }
    }, [activeAccounts]);

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
                    {accountsAndProducts.map((item, index) => (
                        <Card
                            key={index}
                            className={`${styles.card} ${item.isExternalAccount || item.isExternalProduct
                                ? styles.externalCard
                                : ""
                                } ${acctRef(selectedAccountOrProduct) === acctRef(item)
                                    ? styles.selectedCard
                                    : ""
                                }`}
                        >
                            <div className={styles.cardContent}>
                                <div className={styles.cardHeader}>
                                    <Subtitle>
                                        {acctType(item) || item?.ProductType || "N/A"}
                                    </Subtitle>
                                    {(item.isExternalAccount || item.isExternalProduct) && (
                                        <Badge variant="blue" className={styles.bankBadge}>
                                            {acctBank(item) || "External Bank"}
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
                                            display:
                                                item.isExternalAccount || item.isExternalProduct
                                                    ? "inline-block"
                                                    : "none",
                                        }}
                                        onClick={() => handleDisconnectClick(item)}
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
                                            {acctCurrency(item) && (
                                                <Body>
                                                    <strong>Currency:</strong> {acctCurrency(item)}
                                                </Body>
                                            )}
                                            <Body>
                                                <strong>Bank:</strong>{" "}
                                                {acctBank(item) || "N/A"}
                                            </Body>
                                            <Body>
                                                <strong>Opening Date:</strong>{" "}
                                                {acctOpenDate(item)
                                                    ? new Date(acctOpenDate(item)).toLocaleDateString()
                                                    : "N/A"}
                                            </Body>
                                            {acctBalance(item) != null && (
                                                <Body>
                                                    <strong>Available Balance:</strong>{" "}
                                                    {acctCurrency(item)}{" "}
                                                    {acctBalance(item)?.toLocaleString()}
                                                </Body>
                                            )}
                                            {item.ProductAmount && (
                                                <>
                                                    <Body>
                                                        <strong>Current Debt:</strong>{" "}
                                                        {item.ProductCurrency}{" "}
                                                        {item.ProductAmount?.toLocaleString()}
                                                    </Body>
                                                    <Body>
                                                        <strong>Interest Rate:</strong>{" "}
                                                        {item.ProductInterestRate}%
                                                    </Body>
                                                    {item.ProductType === "Loan" ? (
                                                        <Body>
                                                            <strong>Repayment Period:</strong>{" "}
                                                            {item.RepaymentPeriod} months
                                                        </Body>
                                                    ) : (
                                                        <Body>
                                                            <strong>Amortization Period:</strong>{" "}
                                                            {item.AmortizationPeriod} months
                                                        </Body>
                                                    )}
                                                </>
                                            )}
                                        </div>
                                    </Popover>
                                </div>
                                <div>
                                    <Body className={styles.accNumber}>
                                        {acctNumber(item)
                                            ? `Account Number: ${acctNumber(item)}`
                                            : `Product ID: ${item.ProductId}`}
                                    </Body>
                                </div>
                                <div className={styles.accBalance}>
                                    {acctBalance(item) != null ? (
                                        <>
                                            <H3 className={styles.balance}>
                                                {acctCurrency(item)}{" "}
                                                {acctBalance(item)?.toLocaleString() || "N/A"}
                                            </H3>
                                            <Body>Available Balance</Body>
                                        </>
                                    ) : (
                                        <>
                                            <H3 className={styles.balance}>
                                                {item.ProductCurrency}{" "}
                                                {item.ProductAmount?.toLocaleString() || "N/A"}
                                            </H3>
                                            <Body>Current Debt</Body>
                                        </>
                                    )}
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

                <BankConnection
                    className={styles.connectBtn}
                    onBankConnected={onBankConnected}
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
                                    <ComboboxOption
                                        className={styles.comboboxDropdown}
                                        value="Checking"
                                    />
                                    <ComboboxOption
                                        className={styles.comboboxDropdown}
                                        value="Savings"
                                    />
                                </Combobox>

                                <div className={styles.formButtons}>
                                    <Button
                                        size="default"
                                        onClick={handleCloseForm}
                                        style={{
                                            marginTop: "10px",
                                            marginRight: "10px",
                                        }}
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

                <Modal
                    open={disconnectModalOpen}
                    setOpen={setDisconnectModalOpen}
                    className={`${styles.modal} ${disconnectModalOpen ? styles.modalOverlay : ""
                        }`}
                >
                    {selectedAccountOrProduct && (
                        <div className={styles.modalContent}>
                            <img
                                src="/images/disconnect.png"
                                alt="Disconnect Account"
                                width={300}
                            />
                            <H3>Are you sure you want to disconnect this item?</H3>
                            <Body>
                                {acctNumber(selectedAccountOrProduct)
                                    ? `Account Number: ${acctNumber(selectedAccountOrProduct)}`
                                    : `Product ID: ${selectedAccountOrProduct.ProductId}`}
                            </Body>
                            <Body>
                                Bank: {acctBank(selectedAccountOrProduct)}
                            </Body>
                            <div className={styles.modalButtons}>
                                <Button variant="primary" onClick={confirmDisconnect}>
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

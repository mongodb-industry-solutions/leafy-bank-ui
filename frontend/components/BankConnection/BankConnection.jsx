"use client";

import React, { useState } from "react";
import Modal from "@leafygreen-ui/modal";
import Button from "@leafygreen-ui/button";
import { Combobox, ComboboxOption } from "@leafygreen-ui/combobox";
import { Body, H3 } from "@leafygreen-ui/typography";
import styles from "./BankConnection.module.css";
import Icon from "@leafygreen-ui/icon";
import IconButton from "@leafygreen-ui/icon-button";
import Tooltip from "@leafygreen-ui/tooltip";
import InfoModal from "../InfoWizard/InfoWizard";


// Main BankConnection component
const BankConnection = ({ onBankConnected }) => {
    const [open, setOpen] = useState(false);
    const [openHelpModal, setOpenHelpModal] = useState(false);
    const [selection, setSelection] = useState(null);
    const [status, setStatus] = useState('idle');

    const handleSelectionChange = (value) => setSelection(value);

    const handleConnect = () => {
        if (!selection) return;

        // Start connection process
        setStatus("verification"); // Set status to verification
        setTimeout(() => {
            setStatus("processing"); // Move to processing
            setTimeout(() => {
                try {
                    // Safely retrieve data from localStorage
                    const externalAccountsData = JSON.parse(localStorage.getItem("external_accounts") || "{}");
                    const externalProductsData = JSON.parse(localStorage.getItem("external_products") || "{}");

                    const storedAccounts = externalAccountsData.accounts || [];
                    const storedProducts = externalProductsData.products || [];

                    if (!Array.isArray(storedAccounts) || !Array.isArray(storedProducts)) {
                        console.error("Stored accounts or products are not valid arrays.");
                        return;
                    }

                    // Filter relevant accounts/products for the selected bank
                    const filteredAccounts = storedAccounts.filter((acc) => acc.AccountBank === selection);
                    const filteredProducts = storedProducts.filter((prod) => prod.ProductBank === selection);

                    // Notify parent component about the successful connection
                    onBankConnected({
                        bank: selection,
                        accounts: filteredAccounts,
                        products: filteredProducts,
                    });

                    setStatus("success"); // Transition to success
                } catch (error) {
                    console.error("Error handling bank connection:", error);
                    setStatus("idle"); // Reset status if error occurs
                }
            }, 3000); // Simulated processing delay
        }, 3000); // Simulated verification delay
    };

    const handleClose = () => {
        // Handle clean-up here (resetting state)
        setOpen(false);
        setSelection(null);
        setStatus("idle");
    };

    return (
        <div>
            <Button onClick={() => setOpen(true)} leftGlyph={<Icon glyph="Connect" />} className={styles.connectBtn}>Connect Bank</Button>

            {/* Modal */}
            <Modal open={open} setOpen={setOpen} className={styles.modal}>
                <div className={styles.popupOverlay}>
                    {status === "idle" && (
                        <>

                            <div className={styles.modalTitle}>
                                <H3>Choose your bank</H3>
                                <div className={styles.infoModal}>
                                    <InfoModal
                                        open={openHelpModal}
                                        setOpen={setOpenHelpModal}
                                        title="What is Open Finance?"
                                        body="Open Finance refers to the concept of allowing customers to securely share their financial data with third parties, beyond traditional banking services, to enable a broader range of financial products and services. It builds upon the principles of Open Banking, which focuses primarily on bank accounts, but extends the scope to include other financial products such as investments, insurance, pensions, and loans."
                                        tooltipText="Tell me more!"
                                        iconGlyph="Wizard"
                                        sections={[
                                            {
                                                heading: "What are we doing behind the scenes?",
                                                image: {
                                                    src: "/images/OF_info.png",
                                                    alt: "Open Finance Architecture",
                                                },
                                            },
                                            {
                                                heading: "Why MongoDB?",
                                                body: "MongoDB shines in its flexibility—serving as a central data storage solution for retrieving data from external financial institutions while seamlessly supporting diverse formats and structures.",
                                            },
                                        ]}
                                    />
                                </div>
                            </div>

                            <Body>Select a bank to proceed with the connection.</Body>
                            <div className={styles.combobox}>
                                <Combobox
                                    multiselect={false}
                                    label="Choose a bank"
                                    placeholder="Select bank"
                                    onChange={handleSelectionChange}
                                    value={selection}
                                    onClear={() => setSelection(null)}
                                >
                                    <ComboboxOption value="Green Bank" />
                                    <ComboboxOption value="MongoDB Bank" />
                                </Combobox>
                            </div>
                            <Button
                                variant="baseGreen"
                                disabled={!selection}
                                onClick={handleConnect}
                                className={styles.button}
                            >
                                Connect
                            </Button>
                        </>
                    )}

                    {status === "verification" && (
                        <div className={styles.msgBody}>
                            <div>
                                <img src="/images/faceID.gif" alt="ID Check Icon" width={100} />
                            </div>
                            <H3>ID Check</H3>
                            <Body>Verifying your identity. Please wait.</Body>
                        </div>
                    )}

                    {status === "processing" && (
                        <div className={styles.msgBody}>
                            <div>
                                <img src="/images/loading.gif" alt="Processing Connection" width={100} />
                            </div>
                            <H3>Processing...</H3>
                            <Body>We are processing your connection request. Please wait.</Body>
                        </div>
                    )}

                    {status === "success" && (
                        <div className={styles.msgBody}>
                            <div>
                                <img src="/images/illo2.png" alt="Connection Successful" width={300} />
                            </div>
                            <H3>Success</H3>
                            <Body>Your bank account has been successfully connected!</Body>
                            {/* Remove auto-close timer, making the user manually close */}
                            <Button onClick={handleClose} className={styles.button}>
                                Back to Leafy Bank
                            </Button>
                        </div>
                    )}
                </div>
            </Modal>
        </div>
    );
};

export default BankConnection;

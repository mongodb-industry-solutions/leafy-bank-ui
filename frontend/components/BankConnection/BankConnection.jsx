"use client";

// BankConnection.jsx

import React, { useState } from 'react';
import Modal from '@leafygreen-ui/modal';
import Button from '@leafygreen-ui/button';
import { Combobox, ComboboxOption } from '@leafygreen-ui/combobox';
import { Body, H3 } from '@leafygreen-ui/typography';
import styles from "./BankConnection.module.css";
import Icon from "@leafygreen-ui/icon";
import IconButton from "@leafygreen-ui/icon-button";
import Tooltip from "@leafygreen-ui/tooltip";
import InfoModal from "../InfoWizard/InfoWizard";


// Main BankConnection component
const BankConnection = ({ addBankAccount }) => {
    const [open, setOpen] = useState(false);
    const [openHelpModal, setOpenHelpModal] = useState(false);
    const [selection, setSelection] = useState(null);
    const [status, setStatus] = useState('idle');

    const handleSelectionChange = (value) => {
        setSelection(value);
    };

    const handleConnect = async () => {
        if (!selection) return;
        setStatus("verification");
        setTimeout(async () => {
            setStatus("processing");
            // Always attempt to fetch accounts, even for "connected" banks
            const accountAdded = await addBankAccount(selection);
            if (accountAdded) {
                setTimeout(() => {
                    setStatus("success"); // Only set success if accounts are found!
                }, 5000);
            } else {
                setStatus("idle"); // Return to idle if no accounts were found
            }
        }, 6000);
    };

    const handleClose = () => {
        setOpen(false);
        setStatus('idle');
        setSelection(null);
    };

    return (
        <div>
            <Button onClick={() => setOpen(true)} leftGlyph={<Icon glyph="Connect" />} className={styles.connectBtn}>Connect Bank</Button>

            <Modal open={open} setOpen={setOpen} className={styles.modal}>

                <div className={styles.popupOverlay}>
                    {status === 'idle' && (
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

                            <ComboboxExample
                                selection={selection}
                                setSelection={handleSelectionChange}
                            />

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

                    {status === 'verification' && (
                        <>
                            <div className={styles.msgBody}>
                                <div>
                                    <img src="/images/faceID.gif" alt="ID Check Icon" width={100} />
                                </div>
                                <H3>ID Check</H3>
                                <Body>Verifying your identity. Please wait.</Body>
                            </div>
                        </>
                    )}

                    {status === 'processing' && (
                        <>
                            <div className={styles.msgBody}>
                                <div>
                                    <img src="/images/loading.gif" alt="Bank Icon" width={100} />
                                </div>
                                <H3>Processing...</H3>
                                <Body>We are processing your connection request. Please wait.</Body>
                            </div>
                        </>
                    )}

                    {status === 'success' && (
                        <>
                            <div className={styles.msgBody}>
                                <img src="/images/illo2.png" alt="Bank Icon" width={400} />

                                <H3>Success</H3>
                                <Body>Your bank has been successfully connected!</Body>
                                <Button onClick={handleClose} className={styles.button}>Back to Leafy Bank</Button>
                            </div>
                        </>
                    )}

                </div>
            </Modal>
        </div>
    );
};

// Combobox Example component for selecting a bank
const ComboboxExample = ({
    selection,
    setSelection,
}) => {
    return (
        <div className={styles.combobox}>
            <Combobox
                multiselect={false}
                label="Choose a bank"
                placeholder="Select bank"
                onChange={setSelection}
                value={selection}
                onClear={() => setSelection(null)}
            >
                <ComboboxOption value="GreenLeaf Bank" />
                <ComboboxOption value="MongoDB Bank" />
            </Combobox>
        </div>
    );
};

export default BankConnection;

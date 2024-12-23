import React, { useState } from 'react';
import Modal from '@leafygreen-ui/modal';
import Button from '@leafygreen-ui/button';
import { Combobox, ComboboxOption } from '@leafygreen-ui/combobox';
import { Body, H3 } from '@leafygreen-ui/typography';
import styles from "./BankConnection.module.css";
import Icon from "@leafygreen-ui/icon";


// Main BankConnection component
const BankConnection = ({ addBankAccount }) => {
    const [open, setOpen] = useState(false);
    const [selection, setSelection] = useState(null); // No type annotations in JavaScript
    const [status, setStatus] = useState('idle'); // No type annotations in JavaScript

    const handleSelectionChange = (value) => {
        setSelection(value);
    };

    const handleConnect = () => {
        if (!selection) return; // Only proceed if a bank is selected

        setStatus('processing'); // Set status to processing
       
        setTimeout(() => {
            setStatus('success'); // After 5 seconds, set status to success
            addBankAccount(selection); // Call the callback with the selected bank name
        }, 4000);
    };

    const handleClose = () => {
        setOpen(false); // Close modal
        setStatus('idle'); // Reset modal state
        setSelection(null); // Reset selection
    };


    return (
        <div >
            <Button onClick={() => setOpen(true)} leftGlyph={<Icon glyph="Connect" />}>Connect Bank</Button>
            <Modal open={open} setOpen={setOpen} className={styles.modal}>

                <div className={styles.popupOverlay}>
                    {status === 'idle' && (
                        <>
                            <H3>Choose your bank</H3>
                            <Body>Select a bank to proceed with the connection.</Body>

                            {/* Pass state to the combobox */}
                            <ComboboxExample
                                selection={selection}
                                setSelection={handleSelectionChange}
                            />

                            {/* Disable button until a selection is made */}
                            <Button
                                variant="baseGreen"
                                disabled={!selection} // Disable when no selection
                                onClick={handleConnect}
                                className={styles.button}
                            >
                                Connect
                            </Button>
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
                onClear={() => setSelection(null)} // Clear selection on reset
            >
                <ComboboxOption value="GreenLeaf Banking" />
                <ComboboxOption value="MongoDB Bank" />
            </Combobox>
        </div>
    );
};

export default BankConnection;

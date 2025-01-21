// GlobalPosition.jsx

import React, { useState, useEffect } from "react";
import { Body, H2, H3 } from "@leafygreen-ui/typography";
import styles from "./GlobalPosition.module.css";
import Card from "@leafygreen-ui/card";
import { calculateTotalBalancesForUser, calculateTotalDebtForUser } from "@/lib/api/open_finance/open_finance_api";

function GlobalPosition({ userId, bearerToken, triggerGlobalPositionUpdate }) {
    const [totalBalance, setTotalBalance] = useState(0);
    const [totalDebt, setTotalDebt] = useState(0);
    const [loading, setLoading] = useState(true);

    const fetchFinancialData = async () => {
        try {
            if (!userId || !bearerToken) {
                console.error("User ID or Bearer Token not provided");
                setLoading(false);
                return;
            }

            // Retrieve the external accounts and products from localStorage
            const connectedExternalAccounts = JSON.parse(localStorage.getItem('connected_external_accounts')) || [];
            const connectedExternalProducts = JSON.parse(localStorage.getItem('connected_external_products')) || [];

            // Extract only the _id from each account and product
            const accountIds = connectedExternalAccounts.map(account => account._id);
            const productIds = connectedExternalProducts.map(product => product._id);

            console.log("Connected External Account IDs", accountIds);
            console.log("Connected External Product IDs", productIds);

            // Calculate total balances using only the IDs
            const balanceData = await calculateTotalBalancesForUser(userId, bearerToken, accountIds);
            setTotalBalance(balanceData.total_balance || 0);

            // Calculate total debt using only the IDs
            const debtData = await calculateTotalDebtForUser(userId, bearerToken, productIds);
            setTotalDebt(debtData.total_debt || 0);
        } catch (error) {
            console.error("Failed to fetch financial data", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchFinancialData();
    }, [userId, bearerToken, triggerGlobalPositionUpdate]); // Trigger when `triggerGlobalPositionUpdate` changes

    return (
        <div>
            <H2>Global Position</H2>
            {loading ? (
                <div>Loading...</div>
            ) : (
                <div className={styles.aggregatedCards}>
                    <Card>
                        <H3>USD {totalBalance.toLocaleString()}</H3>
                        <Body>Total Balance</Body>
                    </Card>

                    <Card>
                        <H3>USD {totalDebt.toLocaleString()}</H3>
                        <Body>Total Debt</Body>
                    </Card>
                </div>
            )}
        </div>
    );
}

export default GlobalPosition;
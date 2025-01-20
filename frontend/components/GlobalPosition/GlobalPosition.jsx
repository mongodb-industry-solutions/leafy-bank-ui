"use client";

// GlobalPosition.jsx

import { useState, useEffect } from 'react';
import { Body, H2, H3 } from '@leafygreen-ui/typography';
import styles from "./GlobalPosition.module.css";
import Card from "@leafygreen-ui/card";
import { calculateTotalBalancesForUser, calculateTotalDebtForUser } from "@/lib/api/open_finance/open_finance_api";

function GlobalPosition() {
    const [totalBalance, setTotalBalance] = useState(0);
    const [totalDebt, setTotalDebt] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            const user = JSON.parse(localStorage.getItem("selectedUser"));
            if (!user) {
                console.error("No user found in local storage");
                setLoading(false);
                return;
            }

            try {
                // Fetch total balances
                const balanceData = await calculateTotalBalancesForUser(user.id, user.bearerToken);
                setTotalBalance(balanceData.total_balance || 0);

                // Fetch total debt
                const debtData = await calculateTotalDebtForUser(user.id, user.bearerToken);
                setTotalDebt(debtData.total_debt || 0);
            } catch (error) {
                console.error("Failed to fetch financial data", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

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

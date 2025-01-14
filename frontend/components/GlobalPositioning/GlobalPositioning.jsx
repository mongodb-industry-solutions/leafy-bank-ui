"use client";

// GlobalPositioning.jsx

import { Body, H2, H3 } from '@leafygreen-ui/typography';
import styles from "./GlobalPositioning.module.css";
import Card from "@leafygreen-ui/card";

function GlobalPositioning() {


    return (
        <div>
            <H2>Global Positioning</H2>

            <div className={styles.aggregatedCards}>
                <Card>
                    <H3>USD 20,000</H3>
                    <Body>Total Checking Balance</Body>
                </Card>

                <Card>
                    <H3>USD 20,000</H3>
                    <Body>Total Savings Balance</Body>
                </Card>
            </div>
        </div>
    );
}

export default GlobalPositioning;

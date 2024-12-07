"use client";

import { useState, useEffect, useRef } from "react";

const Typewriter = ({ text, messageId, completedMessages, markCompleted }) => {
    const [displayedText, setDisplayedText] = useState("");
    const typingIntervalRef = useRef(null);

    useEffect(() => {
        if (completedMessages[messageId]) {
            setDisplayedText(text);
            return;
        }

        let currentIndex = 0;

        const typeNextCharacter = () => {
            currentIndex++;
            setDisplayedText((prev) => text.slice(0, currentIndex));

            if (currentIndex >= text.length) {
                clearInterval(typingIntervalRef.current);
                markCompleted(messageId);
            }
        };

        typingIntervalRef.current = setInterval(typeNextCharacter, 30);

        return () => clearInterval(typingIntervalRef.current);
    }, [text, messageId, completedMessages, markCompleted]);

    return <span>{displayedText}</span>;
};

export default Typewriter;

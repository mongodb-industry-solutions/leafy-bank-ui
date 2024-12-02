"use client";

import { useState, useEffect } from "react";
import ReactMarkdown from 'react-markdown';

const Typewriter = ({ text, messageId, completedMessages, markCompleted }) => {
    const [displayedText, setDisplayedText] = useState(completedMessages[messageId] ? text : ""); 
    const [completed, setCompleted] = useState(!!completedMessages[messageId]);

    useEffect(() => {
        if (!completed && text) {
            let index = 0;

            const typing = setInterval(() => {
                if (index < text.length) {
                    setDisplayedText((prev) => prev + text.charAt(index));
                    index++;
                } else {
                    clearInterval(typing);
                    setCompleted(true);
                    markCompleted(messageId);  // Mark this message as completed
                }
            }, 30); // Adjust typing speed

            return () => clearInterval(typing);
        } else {
            setDisplayedText(text); // Ensure the full text is displayed after typing
        }
    }, [text, completed, messageId, markCompleted]);

    return <ReactMarkdown>{displayedText}</ReactMarkdown>;
};

export default Typewriter;

"use client";

import { useState } from "react";
import styles from "./ChatbotPortfolio.module.css";
import { Subtitle, Body } from '@leafygreen-ui/typography';
import IconButton from '@leafygreen-ui/icon-button';
import Icon from '@leafygreen-ui/icon';
import Badge from "@leafygreen-ui/badge";
import Button from "@leafygreen-ui/button";
import axios from "axios";
import InfoWizard from "../InfoWizard/InfoWizard";

import Typewriter from "./Typewriter.jsx";

const ChatbotPortfolio = ({ isOpen, toggleChatbot }) => {
    const industry = "fsi";
    const demo_name = "leafy_bank_assistant";
    const [query, setQuery] = useState("");
    const [messages, setMessages] = useState([]);
    const [answer, setAnswer] = useState("");
    const [docs, setDocs] = useState([]);
    const [isAsking, setIsAsking] = useState(false);
    const [completedMessages, setCompletedMessages] = useState({}); // Track completed messages
    const [openHelpModal, setOpenHelpModal] = useState(false);
    const [showOverlay, setShowOverlay] = useState(false);

    const handleChange = (event) => {
        setQuery(event.target.value);
    };

    const handleSuggestionOne = () => {
        setQuery("How well is my portfolio performing?");
    };

    const handleSuggestionTwo = () => {
        setQuery("My name is Mark Scout.");
    };

    const formatAnswer = (text) => {
        return text.replace(/(\d+\.\s)/g, '\n$1');
    };

    const handleAsk = async () => {
        const guidelines = "personal-banking-terms-conditions.pdf";
        setIsAsking(true);

        try {
            const NEXT_PUBLIC_CROSS_BACKEND_PDF_RAG_URL = process.env.NEXT_PUBLIC_CROSS_BACKEND_PDF_RAG_URL;
            const apiUrl = `${NEXT_PUBLIC_CROSS_BACKEND_PDF_RAG_URL}/querythepdf`;

            const response = await axios.post(
                apiUrl,
                { industry, demo_name, query, guidelines },
                {
                    headers: {
                        "Content-Type": "application/json",
                    }
                }
            );

            const formattedAnswer = formatAnswer(response.data.answer);
            setAnswer(formattedAnswer);
            setDocs(response.data.supporting_docs);
            setMessages((prevMessages) => [...prevMessages, query, formattedAnswer]);
            setQuery("");
        } catch (error) {
            console.error("Error:", error);
        } finally {
            setIsAsking(false);
        }
    };

    const handleImageClick = (e) => {
        e.target.classList.toggle(styles.enlargedImage);
    };

    const markCompleted = (messageId) => {
        setCompletedMessages((prev) => ({ ...prev, [messageId]: true }));
    };

    return (
        <>
            {isOpen && (
                <div className={styles.chatbotModal}>
                    <div className={styles.chatbotOverlay} onClick={toggleChatbot}></div>
                    <div className={styles.chatbotContent}>

                        <div className={styles.chatbotHeader}>
                            <div className={styles.centeredHeader}>
                                <Badge variant="blue" className={styles.badge} >Leafy Portfolio Assistant</Badge>


                                <div className={styles.infoModal}>
                                    <InfoWizard
                                        open={openHelpModal}
                                        setOpen={setOpenHelpModal}
                                        tooltipText="Tell me more!"
                                        iconGlyph="Wizard"
                                        sections={[
                                            {
                                                heading: "Instructions and Talk Track",
                                                content: [
                                                    {
                                                        heading: "...",
                                                        body: "",
                                                    },
                                                    {
                                                        heading: "How to Demo",
                                                        body: [
                                                            "Select one of the Suggested Questions or type a new one in the prompt",
                                                            "Click “Ask”",
                                                            "View response",
                                                        ],
                                                    },
                                                ],
                                            },
                                            {
                                                heading: "Behind the Scenes",
                                                content: [
                                                    {
                                                        heading: "Data Flow",
                                                        body: "",
                                                    },
                                                    {
                                                        image: {
                                                            src: "./images/.png",
                                                            alt: "Architecture",
                                                        },
                                                    },
                                                ],
                                            },
                                            {
                                                heading: "Why MongoDB?",
                                                content: [
                                                    {
                                                        heading: "Flexibility",
                                                        body: "MongoDB’s flexible document model unifies structured and unstructured data, creating a consistent dataset that enhances the AI’s ability to understand and respond to complex queries. This model enables financial institutions to store and manage customer data, transaction history, and document content within a single system, streamlining interactions and making AI responses more contextually relevant.",
                                                    }
                                                ],
                                            },
                                        ]}
                                    />

                                </div>

                            </div>


                            <IconButton
                                aria-label="X"
                                onClick={toggleChatbot}
                                className={styles.logoutIcon}
                            >
                                <Icon glyph="X" />
                            </IconButton>
                        </div>
                        <div className={styles.chatbotBody}>

                            <Body className={styles.introBubble}>Hi there! I’m Leafy Bank’s portfolio assistant, here to help you as the portfolio manager.
                                <br></br> <br></br>
                                I have memory within each chat session, so I can keep track of our conversation - I encourage you to try it out! And if you’re curious, feel free to take a look at what’s happening behind the scenes.
                            </Body>

                            {messages.map((message, index) => {
                                const isUserMessage = index % 2 === 0;

                                return (
                                    <div key={index} className={styles.chatMessage}>
                                        <div className={`${styles.speechBubble} ${isUserMessage ? styles.userBubble : styles.answerBubble}`}>
                                            {isUserMessage ? (
                                                <Body>{message}</Body>
                                            ) : (
                                                <Body>
                                                    <Typewriter
                                                        text={message}
                                                        messageId={index}
                                                        completedMessages={completedMessages}
                                                        markCompleted={markCompleted}
                                                    />
                                                </Body>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}

                            {/* Always show thinking indicator at the end if isAsking */}
                            {isAsking && (
                                <div className={styles.thinkingMessage}>
                                    The agent is thinking<span className={styles.dots}></span>
                                </div>
                            )}
                            {/**
                            {docs.length > 0 && (
                                <div className={styles.referenceSection}>
                                    {docs.map((doc, index) => (
                                        <img
                                            key={index}
                                            className={styles.referenceImage}
                                            src={`data:image/png;base64,${doc.image}`}
                                            alt={`Reference ${index + 1}`}
                                            onClick={handleImageClick}
                                        />
                                    ))}
                                </div>
                            )}
                                 */}
                        </div>
                        <div className={styles.suggestedQuestions}>
                            <Body>Suggested Questions:</Body>
                            <button className={styles.suggestion} onClick={handleSuggestionOne}>
                                How well is my portfolio performing?
                            </button>
                            <button className={styles.suggestion} onClick={handleSuggestionTwo}>
                                My name is Mark Scout.
                            </button>
                        </div>
                        <div className={styles.chatbotInputArea}>
                            <input
                                type="text"
                                value={query}
                                onChange={handleChange}
                                placeholder="Type your question..."
                            />
                            <Button onClick={handleAsk} variant="baseGreen" disabled={!query || isAsking}>
                                {isAsking ? "Asking..." : "Ask"}
                            </Button>
                        </div>

                        {/** Chatbot Behind the scenes */}
                        <div className={styles.pageFlip} onClick={() => setShowOverlay(true)}>
                            <IconButton
                                aria-label="Behind the Scenes"
                                onClick={() => setShowOverlay(true)}
                            >
                                <Icon glyph="ArrowRight" />
                            </IconButton>
                        </div>

                        {showOverlay && (
                            <div className={styles.overlay}>

                                <IconButton
                                    aria-label="X"
                                    onClick={() => setShowOverlay(false)}
                                    className={styles.closeBTS}
                                >
                                    <Icon glyph="X" />
                                </IconButton>

                                <h3>Behind the Scenes</h3>
                                <p>This is where the backend magic happens ✨</p>


                            </div>
                        )}
                    </div>
                </div>
            )}
        </>
    );
};

export default ChatbotPortfolio;

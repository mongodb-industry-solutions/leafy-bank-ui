"use client";

import { useState } from "react";
import styles from "./Chatbot.module.css";
import { Subtitle, Body } from '@leafygreen-ui/typography';
import IconButton from '@leafygreen-ui/icon-button';
import Icon from '@leafygreen-ui/icon';
import Badge from "@leafygreen-ui/badge";
import Button from "@leafygreen-ui/button";
import axios from "axios";
import InfoWizard from "../InfoWizard/InfoWizard";

import Typewriter from "./Typewriter.jsx";

const Chatbot = ({ isOpen, toggleChatbot }) => {
    const industry = "fsi";
    const demo_name = "leafy_bank_assistant";
    const [query, setQuery] = useState("");
    const [messages, setMessages] = useState([]);
    const [answer, setAnswer] = useState("");
    const [docs, setDocs] = useState([]);
    const [isAsking, setIsAsking] = useState(false);
    const [completedMessages, setCompletedMessages] = useState({}); // Track completed messages
    const [openHelpModal, setOpenHelpModal] = useState(false);

    const handleChange = (event) => {
        setQuery(event.target.value);
    };

    const handleSuggestionOne = () => {
        setQuery("Can I overdraft my account for payments and transfers?");
    };

    const handleSuggestionTwo = () => {
        setQuery("Am I going to be notified when overdraft interests will be charged?");
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
                                <Badge variant="blue" className={styles.badge} >Leafy Personal Assistant</Badge>


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
                                                        heading: "What is Interactive Banking?",
                                                        body: "Interactive banking uses generative AI, like chatbots and virtual assistants, to provide real-time, personalized, and seamless customer experiences. It enhances self-service by resolving queries instantly, offering tailored advice, and keeping interactions within banking apps, making banking smarter, more efficient, and user-friendly.",
                                                    },
                                                    {
                                                        heading: "How to Demo",
                                                        body: [
                                                            "Select one of the Suggested Questions or type a new one in the prompt.",
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
                                                            src: "./images/chatbot_info.png",
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
                                                    },
                                                    {
                                                        heading: "Atlas Vector Search",
                                                        body: "MongoDB Atlas Vector Search makes it easy to perform semantic searches on vectorized document chunks, quickly retrieving the most relevant information to answer user questions. This capability allows the AI to find precise answers within dense documents, enhancing the self-service experience for customers.",
                                                    },
                                                    {
                                                        heading: "Integration with AI Models",
                                                        body: " MongoDB integrates smoothly with major AI frameworks, facilitating rapid and efficient deployment of scalable AI applications in banks. Aligning MongoDB with cloud-based LLMs ensures accurate and real-time responses to customer queries using top tools, meeting demand effectively.",
                                                    },
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
                            <Body className={styles.introBubble}>Hi there! I'm the Leafy Bank's personal assistant, feel free to ask me any questions regarding Leafy Bank's Terms and Conditions.</Body>

                            {messages.map((message, index) => (
                                <div key={index} className={styles.chatMessage}>
                                    <div className={`${styles.speechBubble} ${index % 2 === 0 ? styles.userBubble : styles.answerBubble}`}>
                                        {index % 2 === 0 ? (
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
                            ))}

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
                        </div>
                        <div className={styles.suggestedQuestions}>
                            <Body>Suggested Questions:</Body>
                            <button className={styles.suggestion} onClick={handleSuggestionOne}>
                                Can I overdraft my account for payments and transfers?
                            </button>
                            <button className={styles.suggestion} onClick={handleSuggestionTwo}>
                                Am I going to be notified when overdraft interests will be charged?
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
                    </div>
                </div>
            )}
        </>
    );
};

export default Chatbot;

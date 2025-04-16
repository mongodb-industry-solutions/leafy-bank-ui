//// filepath: /Users/julian.boronat/Github/mongodb/mongodb-industry-solutions/leafy-bank-ui/frontend/components/ChatbotPortfolio/ChatbotPortfolio.jsx
"use client";

import { useState, useEffect } from "react";
import styles from "./ChatbotPortfolio.module.css";
import { Subtitle, Body, Overline } from '@leafygreen-ui/typography';
import IconButton from '@leafygreen-ui/icon-button';
import Icon from '@leafygreen-ui/icon';
import Badge from "@leafygreen-ui/badge";
import Button from "@leafygreen-ui/button";
import InfoWizard from "../InfoWizard/InfoWizard";
import Typewriter from "./Typewriter.jsx";
import { sendMessagetoReactAgentMarketAssistantChatbot } from "@/lib/api/capital_markets/chatbot/capitalmarkets_chatbot_api";

function generateThreadId() {
    const now = new Date();
    const year = now.getUTCFullYear();
    const month = String(now.getUTCMonth() + 1).padStart(2, '0');
    const day = String(now.getUTCDate()).padStart(2, '0');
    const hours = String(now.getUTCHours()).padStart(2, '0');
    const minutes = String(now.getUTCMinutes()).padStart(2, '0');
    const seconds = String(now.getUTCSeconds()).padStart(2, '0');
    return `thread_${year}${month}${day}_${hours}${minutes}${seconds}`;
}

const ChatbotPortfolio = ({ isOpen, toggleChatbot }) => {
    const [query, setQuery] = useState("");
    const [messages, setMessages] = useState([]);
    const [answer, setAnswer] = useState("");
    const [isAsking, setIsAsking] = useState(false);
    const [completedMessages, setCompletedMessages] = useState({});
    const [openHelpModal, setOpenHelpModal] = useState(false);
    const [showOverlay, setShowOverlay] = useState(false);
    const [threadId, setThreadId] = useState(null);

    useEffect(() => {
        // Generate a fresh threadId and clear history each time the chatbot is opened
        if (isOpen) {
            setThreadId(generateThreadId());
        } else {
            // When closing the chatbot, reset everything
            setThreadId(null);
            setMessages([]);
            setAnswer("");
            setCompletedMessages({});
            setSuggestionIndex(0); // Reset suggestions index too
        }
    }, [isOpen]);

    const handleChange = (event) => {
        setQuery(event.target.value);
    };

    const suggestions = [
        "Can you perform an analysis of my current portfolio? Please give me an overall diagnosis and highlight the best-performing assets.",
        "What are the news saying about my asset GLD (Gold ETF)?",
        "I would like to start investing in the database market. Can you search the internet for what’s going on with MDB (MongoDB)? I want to know what the press is saying.",
        "What questions have I asked you so far, and which tools have you used to respond to me?"
    ];

    const [suggestionIndex, setSuggestionIndex] = useState(0);

    const handleSuggestionClick = () => {
        const selected = suggestions[suggestionIndex];
        setQuery(selected);
        setSuggestionIndex((prevIndex) => Math.min(prevIndex + 1, suggestions.length - 1));
    };

    const formatAnswer = (text) => {
        // Preserve newlines but still format numbered lists
        return text.replace(/(\d+\.\s)/g, '\n$1');
    };

    const handleAsk = async () => {
        setIsAsking(true);
        try {
            const data = await sendMessagetoReactAgentMarketAssistantChatbot(threadId, query);
            // The response will contain final_answer and possibly tool_calls
            const { final_answer, tool_calls = [] } = data;
            const responseMessage = formatAnswer(final_answer || "No response");
    
            setAnswer(responseMessage);
    
            // Store the query and agent answer as separate message objects,
            // along with any tool calls
            setMessages((prevMessages) => [
                ...prevMessages,
                { text: query, isUser: true, toolCalls: [] },
                { text: responseMessage, isUser: false, toolCalls: tool_calls }
            ]);
    
            setQuery("");
        } catch (error) {
            console.error("Error:", error);
        } finally {
            setIsAsking(false);
        }
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
                                <Badge variant="blue" className={styles.badge}>Leafy Portfolio Assistant</Badge>
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
                                                        body: "MongoDB’s flexible document model unifies structured and unstructured data, creating a consistent dataset that enhances the AI’s ability to understand and respond to complex queries.",
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
                            <Body className={styles.introBubble}>
                                Hi there! 👋🏻 I’m Leafy Bank’s portfolio assistant, here to help you as the portfolio manager.
                                <br /> <br />
                                I now have ✨<strong> long-term memory</strong> ✨ within each chat session, so I can keep track of our conversation - I encourage you to try it out!
                            </Body>

                            {messages.map((message, index) => {
                                const isUserMessage = message.isUser;
                                return (
                                    <div key={index} className={styles.chatMessage}>
                                        <div
                                            className={`${styles.speechBubble} ${
                                                isUserMessage ? styles.userBubble : styles.answerBubble
                                            }`}
                                        >
                                            {isUserMessage ? (
                                                <Body>{message.text}</Body>
                                            ) : (
                                                <Body>
                                                    <Typewriter
                                                        text={message.text}
                                                        messageId={index}
                                                        completedMessages={completedMessages}
                                                        markCompleted={markCompleted}
                                                    />
                                                </Body>
                                            )}
                                        </div>
                                        
                                        {/* Move tool calls section AFTER the message bubble */}
                                        {!isUserMessage && message.toolCalls && message.toolCalls.length > 0 && completedMessages[index] && (
                                            <div className={styles.toolCallsContainer}>
                                                <div className={styles.behindTheScenesLink}>
                                                    <Icon className={styles.linkIcon} glyph="Wrench" color="#889396" />
                                                    <Body className={styles.link}>Tool(s) called:</Body>
                                                </div>
                                                <div className={styles.toolCallsList}>
                                                    {message.toolCalls.map((tool, idx) => (
                                                        <div key={idx} className={styles.toolCallItem}>
                                                            <span className={styles.toolName}>{tool.tool_name}</span>
                                                            {tool.query && <span className={styles.toolQuery}>Query: "{tool.query}"</span>}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}

                            {isAsking && (
                                <div className={styles.thinkingMessage}>
                                    The agent is thinking<span className={styles.dots}></span>
                                </div>
                            )}
                        </div>

                        <div className={styles.suggestedQuestions}>
                            <Body>Suggested Question:</Body>
                            <button className={styles.suggestion} onClick={handleSuggestionClick}>
                                {suggestions[suggestionIndex]}
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

export default ChatbotPortfolio;
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
        "Based on market condition today, what overall portfolio asset reallocation would you suggest?",
        "What is the news sentiment about my asset GLD (Gold ETF)?",
        "What would be the impact of replacing 50% of Equity assets with Gold?",
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
                                                        heading: "Leafy Portfolio Assistant",
                                                        body: "Leafy Portfolio Assistant provides portfolio managers with a tool that allows them to quickly access and analyze market data, portfolio performance, and news insights. It enhances efficiency by providing tailored responses and reducing the time spent solving the complexities behind data retrieval and analysis, enabling improved decision-making with real-time updates and contextually aware interactions."
                                                    },
                                                    {
                                                        heading: "How to Demo",
                                                        body: [
                                                            "Select one of the Suggested Questions or type a new one in the prompt",
                                                            "Click 'Ask'",
                                                            "View response",
                                                        ],
                                                    },
                                                ],
                                            },
                                            {
                                                heading: "Behind the Scenes",
                                                content: [
                                                    {
                                                        heading: "High-level Architecture",
                                                    },
                                                    {
                                                        image: {
                                                            src: "./images/chatbotPortfolio_info.png",
                                                            alt: "Architecture",
                                                        },
                                                    },
                                                    {
                                                        body:
                                                            `<div>
                                                        <p>
                                                            <br>
                                                            This solution is divided into three core services: 
                                                                <ol>
                                                                    <li>Capital Markets Loaders Service</li>
                                                                    <li>Capital Markets Agents Service</li>
                                                                    <li>Market Assistant ReAct Agent Chatbot</li>
                                                                </ol>
                                                        </p>
                                                        <p>
                                                            This section of the demo focuses on the last one:
                                                            <br>
                                                                <br><strong>3. Market Assistant ReAct Agent Chatbot</strong> 
                                                            <br>
                                                            The Market Assistant Agent is designed to interact with users, process their questions, and provide relevant answers using various technologies and data sources.
                                                            <br>
                                                            Here's how it operates:
                                                            <br>
                                                            <ul>
                                                                <li><strong>User interaction: </strong> Starts with a user's question and finishes with the agent's answer.</li>
                                                                <li><strong>ReAct Agent: </strong> The core of the system is a ReAct (reason-and-act) agent. This agent is responsible for interpreting the question, reasoning through possible actions, and generating a response. It combines reasoning with predefined actions using available tools.</li>
                                                                <li><strong>Tools: </strong></li>
                                                                    <ul>
                                                                        <li>Aggregations: To compile and analyze data.</li>
                                                                        <li>Vector Search: To find similar data points using embeddings.</li>
                                                                        <li>Data Retrieval: To fetch relevant documents from the collections.</li>
                                                                    </ul>
                                                                <li><strong>Models: </strong></li>
                                                                    <ul>
                                                                        <li>LLM: Anthropics Claude Chat Completions model - AWS Bedrock, is used for understanding and processing natural language queries.</li>
                                                                        <li>Embedding: "voyage-finance-2" is used to numerically process and understand financial data queries (vectors).</li>
                                                                    </ul>
                                                                <li><strong>MongoDB Atlas: </strong> Serves as the data layer that enables the storage of all the collections retrieved, search operations and memory retention of past interactions.</li>
                                                            </ul>
                                                        </p>
                                                    </div>`,
                                                        isHTML: true,
                                                    },
                                                    {
                                                        heading: "ReAct Pattern",
                                                        body: "The Leafy Portfolio Assistant uses the ReAct (Reason and Act) pattern, which allows the agent to think step-by-step and take actions as needed. This pattern enables the agent to analyze user queries, reason through the appropriate tools to use, and synthesize coherent responses based on retrieved information."
                                                    },
                                                    {
                                                        image: {
                                                            src: "./images/react_pattern.png",
                                                            alt: "ReAct Pattern",
                                                        },
                                                    },
                                                    {
                                                        heading: "Agent Flow and Interaction Model",
                                                        body: `<div>
                                                        <p>When you interact with the Leafy Portfolio Assistant, your experience is powered by a sophisticated ReAct (Reason and Act) workflow:</p>
                                                        <ol>
                                                            <li><strong>User Query Processing:</strong> When you ask a question (e.g., "Based on market condition today, what overall portfolio asset reallocation would you suggest?"), the ReAct agent examines your query to determine what information you need.</li>
                                                            <li><strong>Reasoning Step:</strong> The agent engages in a thought process, weighing which tools would be most appropriate for your query, guided by its profile which defines its role, capabilities, and decision-making rules.</li>
                                                            <li><strong>Tool Selection:</strong> Based on its reasoning, the agent selects the most appropriate specialized tool:
                                                                <ul>
                                                                    <li>For portfolio-specific analysis → <code>market_analysis_reports_vector_search_tool</code></li>
                                                                    <li>For news about portfolio assets → <code>market_news_reports_vector_search_tool</code></li>
                                                                    <li>For asset allocation questions → <code>get_portfolio_allocation_tool</code></li>
                                                                    <li>For year-to-date returns → <code>get_portfolio_ytd_return_tool</code></li>
                                                                    <li>For volatility metrics → <code>get_vix_closing_value_tool</code></li>
                                                                    <li>For general financial information → <code>tavily_search_tool</code></li>
                                                                </ul>
                                                            </li>
                                                            <li><strong>Tool Execution and Observation:</strong> The selected tool retrieves data from MongoDB collections or external APIs. The agent observes the tool's output, integrating it into its understanding.</li>
                                                            <li><strong>Follow-up Reasoning:</strong> If the information is incomplete, the agent may reason through additional tool calls to gather complementary data points.</li>
                                                            <li><strong>Response Synthesis:</strong> The agent combines all gathered information into a coherent, actionable response that directly addresses your query.</li>
                                                        </ol>
                                                        <p>Throughout this process, the agent maintains a conversation state in MongoDB, enabling it to reference previous interactions and provide contextually relevant responses over time.</p>
                                                    </div>`,
                                                        isHTML: true,
                                                    },
                                                    {
                                                        heading: "Agent Memory Management",
                                                        body: `<div>
                                                        <p>The Leafy Portfolio Assistant uses MongoDB as a long-term memory store to maintain context across conversation sessions:</p>
                                                        <ul>
                                                            <li><strong>Memory Storage:</strong> Two key collections—<code>checkpoints_aio</code> and <code>checkpoint_writes_aio</code>—store the complete state of agent interactions, including reasoning steps, tool calls, and observations.</li>
                                                            <li><strong>Memory Structure:</strong> Each conversation is organized by a unique <code>thread_id</code> that includes a timestamp (format: <code>thread_YYYYMMDD_HHMMSS</code>). This allows for organized memory retrieval and management.</li>
                                                            <li><strong>Automated Memory Cleanup:</strong> To prevent memory buildup, a scheduled job runs daily through the <code>CheckpointerMemoryJobs</code> system to remove older conversation threads, ensuring the system maintains only recent conversation history while preventing database bloat.</li>
                                                        </ul>
                                                        <p>This memory management approach balances the benefits of persistent conversation context with database efficiency, allowing users to continue discussions throughout their workday while automatically clearing older interactions.</p>
                                                    </div>`,
                                                        isHTML: true,
                                                    },
                                                    {
                                                        heading: "Specialized Financial Tools",
                                                        body: `<div>
                                                        <p>The Leafy Portfolio Assistant leverages specialized tools to access and analyze financial data from various sources:</p>
                                                        <p><strong>Portfolio-Specific Tools:</strong></p>
                                                        <ul>
                                                            <li><strong>Market Analysis Reports Vector Search Tool</strong> (<code>market_analysis_reports_vector_search_tool</code>): Retrieves relevant market insights specifically for assets in the current portfolio from the <code>reports_market_analysis</code> collection using vector embeddings generated by the voyage-finance-2 model.</li>
                                                            <li><strong>Market News Reports Vector Search Tool</strong> (<code>market_news_reports_vector_search_tool</code>): Provides recent news summaries and sentiment analysis specifically for portfolio assets from the <code>reports_market_news</code> collection.</li>
                                                            <li><strong>Portfolio Allocation Tool</strong> (<code>get_portfolio_allocation_tool</code>): Shows the precise distribution of investments across different assets, including ticker symbols, asset descriptions, and allocation percentages.</li>
                                                            <li><strong>Portfolio YTD Return Tool</strong> (<code>get_portfolio_ytd_return_tool</code>): Measures portfolio performance since the beginning of the current year from the <code>portfolio_performance</code> collection.</li>
                                                            <li><strong>VIX Closing Value Tool</strong> (<code>get_vix_closing_value_tool</code>): Provides insight into current market volatility levels, serving as a quick indicator of market sentiment and risk.</li>
                                                        </ul>
                                                        <p><strong>General Financial Information:</strong></p>
                                                        <ul>
                                                            <li><strong>Tavily Search Tool</strong> (<code>tavily_search_tool</code>): Supplements portfolio-specific tools with broader financial data and news via the Tavily API, particularly useful for questions about assets not in the portfolio or general market concepts.</li>
                                                        </ul>
                                                    </div>`,
                                                        isHTML: true,
                                                    },
                                                    {
                                                        heading: "MongoDB Stack",
                                                        body: [
                                                            "Atlas Vector Search",
                                                            "Aggregation Pipelines",
                                                            "Atlas Charts",
                                                            "Time Series collections",
                                                            "AsyncMongoClient",
                                                            "AsyncMongoDBSaver",
                                                        ],
                                                    },
                                                ],
                                            },
                                            {
                                                heading: "Why MongoDB?",
                                                content: [
                                                    {
                                                        heading: "Integration with Agentic AI",
                                                        body: "The integration of agentic AI with MongoDB enhances portfolio management by leveraging AI-driven insights to analyze and predict market trends, optimize asset allocations, and facilitate real-time data-driven investment decisions, all powered by efficient data storage and retrieval capabilities."
                                                    },
                                                    {
                                                        heading: "Perfect for Agent Memory Management",
                                                        body: "MongoDB's document model is ideal for storing complex agent state through the MongoDB Checkpointer, providing seamless memory persistence across conversations. This enables the assistant to maintain context over time using collections like `checkpoints_aio` and `checkpoint_writes_aio`, delivering more personalized, contextually relevant responses to financial queries."
                                                    },
                                                    {
                                                        heading: "Vector Search",
                                                        body: "Atlas Vector Search empowers the chatbot to efficiently store and query high-dimensional embeddings, enabling it to deliver contextually accurate and relevant responses. Making AI-driven interactions within the Leafy Bank ecosystem both fast and reliable."
                                                    },
                                                    {
                                                        heading: "Flexibility",
                                                        body: "MongoDB's flexible document model unifies structured (macroeconomic indicators and market data) and unstructured data (financial news) into a single data platform that integrates with agentic AI not only to understand and respond to complex queries, but also generate valuable insights for enhanced portfolio management.",
                                                    },
                                                    {
                                                        heading: "Time Series collections",
                                                        body: "MongoDB allows the storage of time series collections, efficiently ingesting large volumes of data. This enables AI agents to process and analyze sequential interactions, learn patterns, and state changes over time."
                                                    },
                                                    {
                                                        heading: "Atlas Charts",
                                                        body: "MongoDB Atlas Charts provides an intuitive and dynamic way to visualize real-time application data, directly accessing collections to streamline analytic workflows. This feature enables users to effectively visualize metrics such as portfolio performance over the last month, asset distribution, and candlestick charts for each asset, allowing for a comprehensive interpretation of price movements."
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
                                            className={`${styles.speechBubble} ${isUserMessage ? styles.userBubble : styles.answerBubble
                                                }`}
                                        >
                                            {isUserMessage ? (
                                                <Body>{message.text}</Body>
                                            ) : (
                                                <>
                                                <div className={styles.agentHeader}>
                                                    <img
                                                        src="/images/coachGTM_Headshot.png"
                                                        alt="Agent"
                                                        className={styles.agentImage}
                                                    />
                                                    <Subtitle className={styles.agentPrefix}>Agent's response:</Subtitle>
                                                </div>
                                                <Body>
                                                    <Typewriter
                                                        text={message.text}
                                                        messageId={index}
                                                        completedMessages={completedMessages}
                                                        markCompleted={markCompleted}
                                                    />
                                                </Body>
                                            </>
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
                                                            <Body className={styles.toolName}>{tool.tool_name}</Body>
                                                            {tool.query && <Body className={styles.toolQuery}>Query: "{tool.query}"</Body>}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}

                            {isAsking && (

                                <div className={styles.thinkingSection}>
                                    <img
                                        src="/images/animated_bot.gif"
                                        alt="Thinking bot"
                                        className={styles.thinkingGif}
                                    />
                                    <div className={styles.thinkingMessage}>
                                        The agent is thinking<span className={styles.dots}></span>
                                    </div>
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
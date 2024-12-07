"use client";

import { useState } from "react";
import Login from '@/components/Login/Login';
import Chatbot from '@/components/Chatbot/Chatbot';
import Header from '@/components/Header/Header';
import AccountsCards from '@/components/AccountsCards/AccountsCards';

const Home = () => {
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [isOpen, setIsOpen] = useState(false);

    const handleOpenForm = () => {
        setIsFormOpen(true);
    };

    const handleCloseForm = () => {
        setIsFormOpen(false);
    };

    const toggleChatbot = () => {
        setIsOpen(!isOpen);
    };

    return (
        <div>
            <Login />
            <Header />
            <AccountsCards
                isFormOpen={isFormOpen}
                handleOpenForm={handleOpenForm}
                handleCloseForm={handleCloseForm}
            />
            <Chatbot isOpen={isOpen} toggleChatbot={toggleChatbot} />
        </div>
    );
};

export default Home;

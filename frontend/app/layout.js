// layout.js

/**
 * This file contains the RootLayout component.
 * It wraps the application with HTML and body tags.
 * @module layout
 * @requires react
 * @requires geist/font/sans
 * @requires ClientProvider
 * @requires LoginComp
 * @exports RootLayout
 */

import './globals.css';
import { GeistSans } from "geist/font/sans";
import ClientProvider from './ClientProvider';
import LoginComp from '/components/Login/LoginComp';
import Chatbot from '@/components/Chatbot/ChatbotComp';

export const metadata = {
  title: "Home",
  description: "",
};

export default function RootLayout({ children }) {

  return (
    <html lang="en" className={GeistSans.className}>
      <body>
        <ClientProvider>
          {children}
          <LoginComp/>
          <Chatbot/>
        </ClientProvider>
      </body>
    </html>
  );
}


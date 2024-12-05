// layout.js

/**
 * This file contains the RootLayout component.
 * It wraps the application with HTML and body tags.
 * @module layout
 * @requires react
 * @requires geist/font/sans
 * @requires ClientProvider
 * @requires Login
 * @exports RootLayout
 */

import '../node_modules/bootstrap/dist/css/bootstrap.min.css';
import { GeistSans } from "geist/font/sans";
import ClientProvider from './ClientProvider';
import Login from '@/components/Login/Login';
import Chatbot from '@/components/Chatbot/Chatbot';

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
          <Login/>
          <Chatbot/>
        </ClientProvider>
      </body>
    </html>
  );
}


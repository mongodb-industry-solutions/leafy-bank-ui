// layout.js

import '../node_modules/bootstrap/dist/css/bootstrap.min.css';
import { GeistSans } from "geist/font/sans"; 

// Temporary console warning suppression logic
const suppressedWarnings = ['findDOMNode is deprecated in StrictMode'];
const originalConsoleError = console.error;
console.error = (...args) => {
  if (suppressedWarnings.some(entry => args[0].includes(entry))) {
    return;
  }
  originalConsoleError.apply(console, args);
};

export const metadata = {
  title: 'Leafy Bank',
  description: 'A demo bank application featuring a chatbot and transaction history using MongoDB and Next.js.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={GeistSans.className}>
      <body>
          {children}
      </body>
    </html>
  );
}

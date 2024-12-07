"use client";

// layout.js

import '../node_modules/bootstrap/dist/css/bootstrap.min.css';
import { GeistSans } from "geist/font/sans";

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={GeistSans.className}>
      <body>
          {children}
      </body>
    </html>
  );
}

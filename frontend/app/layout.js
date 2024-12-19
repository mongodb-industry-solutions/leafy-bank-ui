// layout.js

import '../node_modules/bootstrap/dist/css/bootstrap.min.css';
import { GeistSans } from "geist/font/sans"; 

// This metadata is automatically applied to the head of your page.
export const metadata = {
  title: "Leafy Bank",
  description: "A demo banking app showcasing the power of MongoDB features."
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

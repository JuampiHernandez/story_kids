import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Storypop",
  description: "Tell a story idea out loud and turn it into a magical illustrated book.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

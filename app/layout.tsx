import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Human Pray Trust",
  description:
    "A quiet force for human dignity across India — celebrating lives, healing animals, and restoring hope one act at a time.",
  keywords: ["NGO", "India", "charity", "human dignity", "animal welfare", "birthday mission"],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;1,400&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body style={{ fontFamily: "'DM Sans', sans-serif", margin: 0 }}>
        {children}
      </body>
    </html>
  );
}

import "./globals.css";

export const metadata = {
  title: "my Jane's Walk",
  description: "my Jane's Walk — Toronto 2026 walk browser",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body style={{ margin: 0 }} suppressHydrationWarning>{children}</body>
    </html>
  );
}


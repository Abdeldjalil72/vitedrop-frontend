import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ViteDrop® — Premium Algerian COD CPA Network",
  description:
    "The premier Cash-on-Delivery CPA network in Algeria. Connecting top media buyers with verified warehouse stock across 58 wilayas, backed by automated courier dispatch and guaranteed escrow.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en-US">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Source+Serif+4:ital,opsz,wght@0,8..60,400;0,8..60,600;1,8..60,400;1,8..60,600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-white text-[#0a0a0a] antialiased selection:bg-black selection:text-white">
        {children}
      </body>
    </html>
  );
}

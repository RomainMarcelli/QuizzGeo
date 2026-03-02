import "./globals.css";

export const metadata = {
  title: "QuizzGeo",
  description: "Quiz interactif des drapeaux, pays et capitales.",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: "/icons/icon-192.svg",
    apple: "/icons/icon-192.svg",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "QuizzGeo",
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0f2230",
};

export default function RootLayout({ children }) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}

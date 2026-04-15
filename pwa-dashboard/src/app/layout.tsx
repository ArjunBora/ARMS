import type { Metadata, Viewport } from "next";
import { Fira_Sans, Fira_Code } from "next/font/google";
import "./globals.css";
import { TelemetryProvider } from "@/context/TelemetryContext";
import { Sidebar } from "@/components/layout/Sidebar";
import { TopBar } from "@/components/layout/TopBar";

const firaSans = Fira_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-fira-sans",
});

const firaCode = Fira_Code({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-fira-code",
});

export const metadata: Metadata = {
  title: "Luminous | Inverter Early Warning System",
  description: "Predictive maintenance dashboard for industrial inverters",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Luminous EW",
  },
};

export const viewport: Viewport = {
  themeColor: "#000000",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${firaSans.variable} ${firaCode.variable} font-sans antialiased`}>
        <TelemetryProvider>
          <div className="flex min-h-screen bg-background">
            <Sidebar />
            <div className="flex-1 md:ml-64 flex flex-col">
              <TopBar />
              <main className="flex-1 p-4 md:p-8">
                {children}
              </main>
            </div>
          </div>
        </TelemetryProvider>
      </body>
    </html>
  );
}

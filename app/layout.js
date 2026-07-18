

import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider"; 
import Header from "@/components/header"; // Ensure this path is correct
import { ClerkProvider } from "@clerk/nextjs";
import { dark } from "@clerk/themes";
import { Toaster } from "sonner";

const inter = Inter({subsets: ["latin"] });

export const metadata = {
  title: {
    default: "NextStep AI",
    template: "%s | NextStep AI",
  },
  description: "NextStep AI is a premium AI career guidance platform for smarter resumes, sharper interviews, and confident growth.",
  keywords: ["AI career coach", "career guidance", "resume builder", "interview prep", "NextStep AI"],
  applicationName: "NextStep AI",
  icons: {
    icon: "/nextstep-logo.svg",
    apple: "/nextstep-logo.svg",
  },
  openGraph: {
    title: "NextStep AI",
    description: "AI-powered career guidance that helps you move forward with confidence.",
    type: "website",
    siteName: "NextStep AI",
    url: "https://nextstepai.app",
    images: [{ url: "/nextstep-logo.svg", width: 1200, height: 630, alt: "NextStep AI" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "NextStep AI",
    description: "AI-powered career guidance that helps you move forward with confidence.",
    images: ["/nextstep-logo.svg"],
  },
};

export default function RootLayout({ children }) {
  return (
    <ClerkProvider appearance={{
      baseTheme:dark
    }}> 

    
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.className}`}> 
      
        <ThemeProvider
            attribute="class"
            defaultTheme="dark"
            enableSystem
            disableTransitionOnChange
          >
            {/*header*/}
            <Header/>
            <main className="min-h-screen">{children}</main>
            <Toaster richColors/>
          </ThemeProvider>
      </body>
    </html>
    </ClerkProvider>
  );
}

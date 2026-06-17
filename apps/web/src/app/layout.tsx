import { ClerkProvider } from "@clerk/nextjs";
import type { Metadata } from "next";
import { Fraunces, IBM_Plex_Mono, Manrope, Inter } from "next/font/google";

import { cn } from "@_scaffold/ui/lib/utils";
import { env } from "@_scaffold/env/web";

import "../index.css";
import Providers from "@/components/providers";
import { ThemeProvider } from "@/components/theme-provider";

const inter = Inter({subsets:['latin'],variable:'--font-sans'});

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
});

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
});

const ibmPlexMono = IBM_Plex_Mono({
  variable: "--font-ibm-plex-mono",
  weight: ["400", "500"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "TechAssure Command Deck",
  description: "Real-time analytics and predictive insights for TechAssure's retail operations.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const clerkEnabled =
    Boolean(env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) && Boolean(process.env.CLERK_SECRET_KEY);

  const app = (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <Providers>{children}</Providers>
    </ThemeProvider>
  );

  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn("bg-background", manrope.variable, fraunces.variable, ibmPlexMono.variable, "font-sans", inter.variable)}
    >
      <body className="antialiased selection:bg-foreground selection:text-background">
        {clerkEnabled ? (
          <ClerkProvider
            signInUrl={env.NEXT_PUBLIC_CLERK_SIGN_IN_URL}
            signUpUrl={env.NEXT_PUBLIC_CLERK_SIGN_UP_URL}
            signInFallbackRedirectUrl={env.NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL}
            signUpFallbackRedirectUrl={env.NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL}
          >
            {app}
          </ClerkProvider>
        ) : (
          app
        )}
      </body>
    </html>
  );
}

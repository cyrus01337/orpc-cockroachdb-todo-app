import "~/styles/globals.css";

import { Inter } from "next/font/google";

import AuthProvider from "~/components/client/auth-provider";
import { Provider as JotaiProvider } from "jotai";

import type { Metadata } from "next";

interface Properties {
    children: React.ReactNode;
}

const INTER = Inter({
    subsets: ["latin"],
    display: "swap",
});
export const metadata: Metadata = {
    title: "ORPC + CockroachDB Todo App",
    description: "Generic intro project that handles CRUD operations for your own checklist",
};

export default function RootLayout(properties: Properties) {
    return (
        <html className={INTER.className} lang="en">
            <body>
                <AuthProvider>
                    <JotaiProvider>
                        {properties.children}
                    </JotaiProvider>
                </AuthProvider>
            </body>
        </html>
    );
}

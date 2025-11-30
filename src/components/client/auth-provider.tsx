"use client";

import { SessionProvider } from "next-auth/react";
import React from "react";

interface Properties {
    children: React.ReactNode;
}

export default function AuthProvider(properties: Properties) {
    return <SessionProvider>{properties.children}</SessionProvider>;
}

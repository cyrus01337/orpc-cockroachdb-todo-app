import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { z as zod } from "zod";

import database from "~/server/database";
import environment from "~/server/environment";
import schemas from "~/server/schemas";
import logging from "~/shared/logging";

import type { ServerLoginCredentials } from "~/server/types";

const HANDLER = NextAuth({
    callbacks: {
        session: async ({ session }) => ({
            ...session,

            user: {
                ...session.user,
                ...(await database.getUserForSession(session.user.email)),
            },
        }),
    },
    pages: {
        newUser: "/",
        signIn: "/login",
        signOut: "/logout",
    },
    providers: [
        CredentialsProvider({
            credentials: {
                email: { label: "Email", placeholder: "user@example.com", type: "text" },
                password: { label: "Password", placeholder: "••••••••", type: "password" },
            },
            name: "Credentials",

            async authorize(rawCredentials, _request) {
                if (!rawCredentials) {
                    logging.log("No credentials passed");

                    return null;
                }

                const verifiableCredentials = {
                    email: rawCredentials.email,
                    encodedPassword: rawCredentials.password,
                } satisfies zod.infer<typeof schemas.LOGIN_CREDENTIALS>;

                try {
                    await schemas.LOGIN_CREDENTIALS.parseAsync(verifiableCredentials);
                } catch (error) {
                    if (error instanceof Error) {
                        logging.log(`Invalid credentials: ${error.message}`);
                    }

                    return null;
                }

                const decodedPassword = verifiableCredentials.encodedPassword;

                try {
                    await schemas.PASSWORD.parseAsync(decodedPassword);
                } catch (error) {
                    if (error instanceof Error) {
                        logging.log(`Invalid password: ${error.message}`);
                    }

                    return null;
                }

                const credentials = {
                    email: rawCredentials.email,
                    password: decodedPassword,
                } satisfies ServerLoginCredentials;

                try {
                    return await database.logIn(credentials);
                } catch (error) {
                    if (error instanceof Error) {
                        logging.log(`GenericError: ${error}`);
                    }

                    return null;
                }
            },
        }),
    ],
    secret: environment.NEXTAUTH_SECRET,
});

export { HANDLER as GET, HANDLER as POST };

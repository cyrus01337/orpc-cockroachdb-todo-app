import { redirect } from "next/navigation";
import { z as zod } from "zod";

import database from "~/server/database";
import schemas from "~/server/schemas";
import logging from "~/shared/logging";

import type { ServerLoginCredentials } from "~/server/types";
import type { ClientLoginCredentials } from "~/shared/types";

export const config = {
    api: {
        bodyParser: false,
    },
};

export async function POST(request: Request) {
    const formData = await request.formData();
    const rawCredentials = Object.fromEntries(
        formData.entries(),
    ) as unknown as ClientLoginCredentials;
    const verifiableCredentials = {
        email: rawCredentials.email,
        encodedPassword: rawCredentials.password,
    } satisfies zod.infer<typeof schemas.LOGIN_CREDENTIALS>;

    try {
        await schemas.LOGIN_CREDENTIALS.parseAsync(verifiableCredentials);
    } catch (error) {
        if (error instanceof Error) {
            const message = `Invalid credentials: ${error.message}`;

            logging.log(message);

            return new Response(message, {
                status: 401,
            });
        }
    }

    const credentials = {
        email: verifiableCredentials.email,
        password: verifiableCredentials.encodedPassword,
    } satisfies ServerLoginCredentials;

    try {
        await database.signUp(credentials);
    } catch (error) {
        if (error instanceof Error) {
            logging.log(error.message);

            return new Response(error.message, {
                status: 500,
            });
        }
    }

    redirect("/");
}

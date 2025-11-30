import { z as zod } from "zod";

import sharedSchemas from "~/shared/schemas";

export type TodoEntry = zod.infer<typeof sharedSchemas.TODO>;

export interface ClientLoginCredentials {
    email: string;
    password: string;
}

export interface LoginResponse {
    credentials: ClientLoginCredentials;
    errors: string[];
    message: string;
}

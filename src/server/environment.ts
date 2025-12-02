import process from "process";

import { createEnv } from "@t3-oss/env-core";
import { z as zod } from "zod";

export default createEnv({
    client: {},
    clientPrefix: "NEXT_PUBLIC_",
    emptyStringAsUndefined: true,
    runtimeEnv: process.env,
    server: {
        COCKROACHDB_CONNECTION_URL: zod.url(),
        NEXTAUTH_SECRET: zod.string().min(1),
        NEXTAUTH_URL: zod.url(),
    },
});

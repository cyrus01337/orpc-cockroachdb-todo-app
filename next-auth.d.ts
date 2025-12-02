import type { UserForSession } from "~/server/database";
import type { DefaultSession } from "next-auth";

declare module "next-auth" {
    type User = UserForSession;

    interface Session {
        user: UserForSession;
    }
}

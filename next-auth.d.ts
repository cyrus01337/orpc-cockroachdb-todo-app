import type { UserForSession } from "~/server/database";

declare module "next-auth" {
    type User = UserForSession;

    interface Session {
        user: UserForSession;
    }
}

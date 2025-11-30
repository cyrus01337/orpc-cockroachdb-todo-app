import type { UserForSession } from "~/server/database";
import type { TodoEntry } from "~/shared/types";
import type { DefaultSession } from "next-auth";

declare module "next-auth" {
    type User = UserForSession;

    interface Session {
        user: UserForSession;
    }
}

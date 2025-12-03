import argon2 from "argon2";
import { pick, omit } from "lodash";
import postgres from "postgres";
import { z as zod } from "zod";

import environment from "~/server/environment";
import logging from "~/shared/logging";
import sharedSchemas from "~/shared/schemas";

import type { ServerLoginCredentials } from "~/server/types";
import type { ClientLoginCredentials, TodoEntry } from "~/shared/types";

interface DatabaseUser {
    createdAt: number;
    email: string;
    id: string;
    isNewUser: boolean;
    passwordHash: string;
    todoEntries: TodoEntry[];
}

export interface UserForSession {
    email: string;
    id: string;
    isNewUser: boolean;
    todoEntries: TodoEntry[];
}

const SQL = postgres(environment.COCKROACHDB_CONNECTION_URL, {
    transform: {
        ...postgres.camel,

        value: {
            from: (value, column) => {
                switch (column.name) {
                    case "createdAt":
                    case "dueDate":
                        const date = new Date(value as string);

                        return date.valueOf();
                    default:
                        return value;
                }
            },
        },
    },
});
const cachedUsers: DatabaseUser[] = [];

export class DatabaseError extends Error {}

class IncorrectPassword extends DatabaseError {
    constructor(email: string, options: Record<string, unknown> = {}) {
        super(`Incorrect password: ${email}`, options);
    }
}

class UserNotFound extends DatabaseError {
    constructor(identifier: string, options: Record<string, unknown> = {}) {
        super(`User not found: ${identifier}`, options);
    }
}

class UserExists extends DatabaseError {
    constructor(email: string, options: Record<string, unknown> = {}) {
        super(`User exists: ${email}`, options);
    }
}

class EntryNotFound extends DatabaseError {
    constructor(id: string, options: Record<string, unknown> = {}) {
        super(`Entry not found: ${id}`, options);
    }
}

const getUser = async ({
    email,
    id,
}: Partial<Pick<DatabaseUser, "email" | "id">>): Promise<DatabaseUser> => {
    const cachedUserFound = cachedUsers.find(user => user.email === email || user.id === id);

    if (cachedUserFound) {
        return cachedUserFound;
    }

    let condition = SQL``;

    if (email && id) {
        condition = SQL`email = ${email} OR id = ${id}`;
    } else if (email) {
        condition = SQL`email = ${email}`;
    } else if (id) {
        condition = SQL`id = ${id}`;
    }

    const [partialUserFound] = await SQL<Omit<DatabaseUser, "todoEntries">[]>`
        SELECT
            created_at,
            email,
            id,
            is_new_user,
            password_hash
        FROM todo_app.users
        WHERE ${condition}
        LIMIT 1;
    `;

    if (!partialUserFound) {
        throw new UserNotFound(`Email = ${email}, ID = ${id}`);
    }

    const todoEntries = await SQL<TodoEntry[]>`
        SELECT
            completed,
            created_at,
            description,
            due_date,
            id,
            priority,
            title,
            user_id
        FROM todo_app.entries
        WHERE user_id = ${partialUserFound.id}
        ORDER BY created_at ASC;
    `;
    const user = {
        ...partialUserFound,

        todoEntries: [...todoEntries],
    } satisfies DatabaseUser;

    cachedUsers.push(user);

    return user;
};

const userExists = async ({
    email,
    id,
}: Partial<Pick<DatabaseUser, "email" | "id">>): Promise<boolean> => {
    try {
        await getUser({ email, id });

        return true;
    } catch (error) {
        if (error instanceof UserNotFound) {
            return false;
        }

        throw error;
    }
};

const logIn = async ({ email, password }: ServerLoginCredentials): Promise<UserForSession> => {
    const user = await getUser({ email });

    if (!(await argon2.verify(user.passwordHash, password))) {
        throw new IncorrectPassword(email);
    }

    return omit(user, "passwordHash");
};

const signUp = async ({ email, password }: ClientLoginCredentials): Promise<UserForSession> => {
    if (await userExists({ email })) {
        throw new UserExists(email);
    }

    const passwordHash = await argon2.hash(password);
    const [newUserFound] = await SQL<DatabaseUser[]>`
        INSERT INTO todo_app.users ${SQL({ email, passwordHash })}
        RETURNING *;
    `;

    if (!newUserFound) {
        throw new DatabaseError(`Failed to retrieve ${email} during creation`);
    }

    const userForSession = {
        ...pick(newUserFound, "id", "isNewUser"),

        email: email,
        todoEntries: [] as TodoEntry[],
    } satisfies UserForSession;

    cachedUsers.push(newUserFound);

    return userForSession;
};

const getUserForSession = async (email: string): Promise<UserForSession> =>
    pick(await getUser({ email }), "email", "id", "isNewUser", "todoEntries");

const disableNewUserFlag = async (userId: TodoEntry["userId"]) => {
    await SQL`
        UPDATE todo_app.users SET is_new_user = FALSE
        WHERE id = ${userId};
    `;

    const user = await getUser({ id: userId });

    user.isNewUser = false;
};

const populateNewUser = async (
    id: TodoEntry["userId"],
    todoEntries: zod.infer<typeof sharedSchemas.POPULATE_USER>["todoEntries"],
): Promise<TodoEntry[]> => {
    const newTodoEntries = await SQL<TodoEntry[]>`
        INSERT INTO todo_app.entries ${SQL(todoEntries)}
        RETURNING *;
    `;

    await disableNewUserFlag(id);

    const user = await getUser({ id });
    user.todoEntries = [...newTodoEntries];

    return newTodoEntries;
};

const createTodoEntry = async (
    data: zod.infer<typeof sharedSchemas.CREATE_TODO>,
): Promise<TodoEntry> => {
    const [newEntryFound] = await SQL<TodoEntry[]>`
        INSERT INTO todo_app.entries ${SQL(data)}
        RETURNING *;
    `;

    if (!newEntryFound) {
        throw new DatabaseError(`Failed to retrieve entry of user ID ${data.userId} during update`);
    }

    const user = await getUser({ id: data.userId });
    user.todoEntries.push(newEntryFound);

    return newEntryFound;
};

const readTodoEntries = async (userId: TodoEntry["userId"]): Promise<TodoEntry[]> =>
    (await getUser({ id: userId })).todoEntries;

const updateTodoEntry = async (
    id: TodoEntry["id"],
    data: Partial<zod.infer<typeof sharedSchemas.UPDATE_TODO>>,
): Promise<TodoEntry> => {
    const [updatedEntryFound] = await SQL<TodoEntry[]>`
        UPDATE todo_app.entries SET ${SQL(data)}
        WHERE id = ${id}
        RETURNING *;
    `;

    if (!updatedEntryFound) {
        throw new DatabaseError(`Failed to find and update entry ${id}`);
    }

    const user = await getUser({ id: updatedEntryFound.userId });
    const correspondingEntryFound = user.todoEntries.find(entry => entry.id === id);

    if (!correspondingEntryFound) {
        logging.log(`Unable to locate cached entry ${id} for update, skipping...`);

        throw new EntryNotFound(id);
    }

    const index = user.todoEntries.indexOf(correspondingEntryFound);
    user.todoEntries[index] = updatedEntryFound;

    return updatedEntryFound;
};

const deleteTodoEntry = async (id: TodoEntry["id"], userId: TodoEntry["userId"]): Promise<void> => {
    await SQL`
        DELETE FROM todo_app.entries WHERE id = ${id};
    `;

    const user = await getUser({ id: userId });
    const correspondingEntryFound = user.todoEntries.find(entry => entry.id === id);

    if (!correspondingEntryFound) {
        return;
    }

    user.todoEntries = user.todoEntries.filter(entry => entry.id !== id);
};

export default {
    createTodoEntry,
    deleteTodoEntry,
    disableNewUserFlag,
    getUserForSession,
    logIn,
    populateNewUser,
    readTodoEntries,
    signUp,
    updateTodoEntry,
};

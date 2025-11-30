import argon2 from "argon2";
import pick from "lodash/pick";
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
    passwordHash: string;
    todoEntries: TodoEntry[];
}

export interface UserForSession {
    email: string;
    id: string;
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
let cachedUsers: DatabaseUser[];

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

const fetchUsers = async () => {
    if (cachedUsers) {
        return cachedUsers;
    }

    const partialUsers = await SQL<Omit<DatabaseUser[], "todoEntries">>`
        SELECT
            id,
            email,
            password_hash,
            created_at
        FROM todo_app.users;
    `;
    const todoEntries = await SQL<TodoEntry[]>`SELECT * FROM todo_app.entries`;
    cachedUsers = partialUsers.map(partialUser => ({
        ...partialUser,

        todoEntries: todoEntries.filter(entry => entry.userId === partialUser.id),
    }));

    return cachedUsers;
};

// TODO: Implement login functionality
const logIn = async (credentials: ServerLoginCredentials): Promise<UserForSession> => {
    for (const user of await fetchUsers()) {
        if (user.email !== credentials.email) {
            continue;
        } else if (!(await argon2.verify(user.passwordHash, credentials.password))) {
            throw new IncorrectPassword(credentials.email);
        }

        return pick(user, "email", "id", "todoEntries");
    }

    throw new UserNotFound(credentials.email);
};

// TODO: Implement sign up functionality
const signUp = async (credentials: ClientLoginCredentials): Promise<UserForSession> => {
    const users = await fetchUsers();
    const userFound = users.find(record => record.email === credentials.email);

    if (userFound) {
        throw new UserExists(credentials.email);
    }

    const passwordHash = await argon2.hash(credentials.password);
    const [newUserFound] = await SQL<DatabaseUser[]>`
        INSERT INTO todo_app.users ${SQL({ email: credentials.email, passwordHash })}
        RETURNING *;
    `;

    if (!newUserFound) {
        throw new DatabaseError(`Failed to retrieve ${credentials.email} during creation`);
    }

    const userForSession = {
        email: credentials.email,
        id: newUserFound.id,
        todoEntries: [] as TodoEntry[],
    } satisfies UserForSession;

    cachedUsers.push(newUserFound);

    return userForSession;
};

const getUserForSession = async (email: string): Promise<UserForSession> => {
    const users = await fetchUsers();
    const cachedUserFound = users.find(user => user.email === email);

    if (!cachedUserFound) {
        const [userFound] = await SQL<Omit<UserForSession[], "email">>`
            SELECT email, id FROM todo_app.users
            WHERE email = ${email};
        `;

        if (!userFound) {
            throw new UserNotFound(email);
        }

        return {
            ...userFound,

            email,
        };
    }

    return pick(cachedUserFound, "email", "id", "todoEntries");
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

    const users = await fetchUsers();
    const correspondingUserFound = users.find(user => user.id === data.userId);

    if (correspondingUserFound) {
        correspondingUserFound.todoEntries.push(newEntryFound);
    }

    return newEntryFound;
};

async function readTodoEntries(): Promise<TodoEntry[]>;
async function readTodoEntries(id: TodoEntry["id"]): Promise<TodoEntry | null>;
async function readTodoEntries(id?: TodoEntry["id"]): Promise<TodoEntry[] | TodoEntry | null> {
    const userFound = cachedUsers.find(user => user.id === id);

    if (userFound) {
        return userFound.todoEntries;
    }

    return await SQL<TodoEntry[]>`
        SELECT * FROM todo_app.entries ${!id ? SQL`` : SQL`WHERE user_id = ${id}`}
    `;
}

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

    const users = await fetchUsers();
    const correspondingUserFound = users.find(user => user.id === updatedEntryFound.userId);

    if (!correspondingUserFound) {
        logging.log(
            `Unable to find user ${updatedEntryFound.userId} to update cached entry ${id}, skipping...`,
        );

        throw new UserNotFound(updatedEntryFound.userId);
    }

    const correspondingEntryFound = correspondingUserFound.todoEntries.find(
        entry => entry.id === id,
    );

    if (!correspondingEntryFound) {
        logging.log(`Unable to locate cached entry ${id} for update, skipping...`);

        throw new EntryNotFound(id);
    }

    const index = correspondingUserFound.todoEntries.indexOf(correspondingEntryFound);
    correspondingUserFound.todoEntries[index] = updatedEntryFound;

    return updatedEntryFound;
};

const deleteTodoEntry = async (id: TodoEntry["id"], userId: TodoEntry["userId"]): Promise<void> => {
    await SQL`
        DELETE FROM todo_app.entries WHERE id = ${id};
    `;

    const users = await fetchUsers();
    const correspondingUserFound = users.find(user => user.id === userId);

    if (!correspondingUserFound) {
        return;
    }

    const correspondingEntryFound = correspondingUserFound.todoEntries.find(
        entry => entry.id === id,
    );

    if (!correspondingEntryFound) {
        return;
    }

    correspondingUserFound.todoEntries = correspondingUserFound.todoEntries.filter(
        entry => entry.id !== id,
    );
};

export default {
    createTodoEntry,
    deleteTodoEntry,
    getUserForSession,
    logIn,
    readTodoEntries,
    signUp,
    updateTodoEntry,
};

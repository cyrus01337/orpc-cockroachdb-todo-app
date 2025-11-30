"use client";

import { useSession } from "next-auth/react";

import useLocalTodoEntries from "~/hooks/use-local-todo-entries";
import logging from "~/shared/logging";

import type { TodoEntry } from "~/shared/types";

export default (): [TodoEntry[] | undefined, (todoEntries: TodoEntry[]) => void] => {
    const { data: session, update: mutateSession } = useSession();
    const [localTodoEntries, setLocalTodoEntries] = useLocalTodoEntries();

    const setTodoEntries = (todoEntries: TodoEntry[]) => {
        if (!session) {
            setLocalTodoEntries(todoEntries);

            return;
        }

        logging.log("Setting Todo Entries:", todoEntries);

        mutateSession({
            todoEntries,
        });
    };

    return [
        session === undefined || session === null ? localTodoEntries : session.user.todoEntries,
        setTodoEntries,
    ];
};

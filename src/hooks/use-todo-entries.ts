"use client";

import { useSession } from "next-auth/react";
import { useState } from "react";

import logging from "~/shared/logging";

import type { TodoEntry } from "~/shared/types";

const KEY = "todo-entries";

const getLocalTodoEntries = (): TodoEntry[] | undefined => {
    if (typeof window === "undefined") {
        return undefined;
    }

    const todoEntriesFound = localStorage.getItem(KEY);
    let parsedTodoEntries: TodoEntry[] = [];

    if (!todoEntriesFound) {
        parsedTodoEntries = [];

        localStorage.setItem(KEY, JSON.stringify(parsedTodoEntries));
    } else {
        parsedTodoEntries = JSON.parse(todoEntriesFound);
    }

    return parsedTodoEntries;
};

export default (): [TodoEntry[] | undefined, (todoEntries: TodoEntry[]) => void] => {
    const { data: session, update: mutateSession } = useSession();
    const [localTodoEntries, setLocalTodoEntries] = useState<TodoEntry[] | undefined>(
        getLocalTodoEntries(),
    );

    const setTodoEntries = (todoEntries: TodoEntry[]) => {
        if (!session) {
            localStorage.setItem(KEY, JSON.stringify(todoEntries));
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

import { useState } from "react";

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

export default (): [TodoEntry[] | undefined, (newLocalTodoEntries: TodoEntry[]) => void] => {
    const [localTodoEntries, setLocalTodoEntriesState] = useState<TodoEntry[] | undefined>(
        getLocalTodoEntries(),
    );

    const setLocalTodoEntries = (newLocalTodoEntries: TodoEntry[]) => {
        localStorage.setItem(KEY, JSON.stringify(newLocalTodoEntries));
        setLocalTodoEntriesState(newLocalTodoEntries);
    };

    return [localTodoEntries, setLocalTodoEntries];
};

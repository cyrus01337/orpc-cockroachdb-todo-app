import pick from "lodash/pick";
import { Session } from "next-auth";
import { z as zod } from "zod";

import orpc from "~/orpc";
import logging from "~/shared/logging";
import sharedSchemas from "~/shared/schemas";

import type { TodoEntry } from "~/shared/types";
import type { PartialWithKeys } from "~/types";

interface Properties {
    entry: PartialWithKeys<TodoEntry>;
    session: Session | null;
    setTodoEntries: (todoEntries: TodoEntry[]) => void;
    todoEntries: TodoEntry[];
}

const resolveDueDate = (dueDate?: number): number | undefined => {
    if (dueDate === undefined) {
        return dueDate;
    }

    return !isNaN(dueDate) ? dueDate : undefined;
};

const parsePartialEntry = async (
    partialEntry: Properties["entry"],
    // @ts-ignore: Return type is either what's returned or an error is raised,
    // which guarantees the return type to be as follows
): Promise<zod.infer<typeof sharedSchemas.UPDATE_TODO>> => {
    try {
        return await sharedSchemas.UPDATE_TODO.parseAsync(partialEntry);
    } catch (error) {
        if (error instanceof Error) {
            logging.log(error);

            throw error;
        }
    }
};

// @ts-ignore: Return type is either what's returned or an error is raised,
// which guarantees the return type to be as follows
const parseLocalEntry = async (entry: PartialWithKeys<TodoEntry>): Promise<TodoEntry> => {
    try {
        return await sharedSchemas.TODO.parseAsync(entry);
    } catch (error) {
        if (error instanceof Error) {
            logging.log(error);

            throw error;
        }
    }
};

const updateEntry = async ({ todoEntries, ...properties }: Properties) => {
    if (!properties.session) {
        const updatedEntry = await parseLocalEntry(properties.entry);
        const staleEntryFound = todoEntries.find(entry => entry.id === updatedEntry.id);

        if (!staleEntryFound) {
            logging.log(
                `Unable to find and update entry ${updatedEntry.id} with following payload: ${updatedEntry}`,
            );

            return;
        }

        logging.log("Entry (Local):", properties.entry, staleEntryFound, updatedEntry);

        const index = todoEntries.indexOf(staleEntryFound);
        const newTodoEntries = [...todoEntries];
        newTodoEntries[index] = updatedEntry;

        logging.log("Todo Entries (Local):", todoEntries, newTodoEntries);
        properties.setTodoEntries(newTodoEntries);

        return updatedEntry;
    }

    const partialEntry = await parsePartialEntry({
        ...pick(
            properties.entry,
            "createdAt",
            "completed",
            "description",
            "id",
            "priority",
            "title",
            "userId",
        ),

        dueDate: resolveDueDate(properties.entry.dueDate),
    });
    const updatedEntry = await orpc.todos.update(partialEntry);
    const staleEntryFound = todoEntries.find(entry => entry.id === updatedEntry.id);

    if (!staleEntryFound) {
        logging.log(
            `Unable to update entry ${updatedEntry.id} with following payload: ${updatedEntry}`,
        );

        return;
    }

    logging.log("Entry:", properties.entry, staleEntryFound, updatedEntry);

    const index = todoEntries.indexOf(staleEntryFound);
    const newTodoEntries = [...todoEntries];
    newTodoEntries[index] = updatedEntry;

    logging.log("Todo Entries:", todoEntries, newTodoEntries);
    properties.setTodoEntries(newTodoEntries);

    return updatedEntry;
};

export default {
    resolveDueDate,
    updateEntry,
};

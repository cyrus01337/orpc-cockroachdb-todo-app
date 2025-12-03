"use client";

import Render from "~/components/client/render";
import LoadingEntry from "~/app/_components/entry/loading";
import EntryCreator from "~/app/_components/entry-creator";
import { useAtom } from "jotai";
import { savingEntryAtom } from "~/store";
import { useSession } from "next-auth/react";
import useTodoEntries from "~/hooks/use-todo-entries";
import Entry from "./entry";
import { useEffect } from "react";
import logging from "~/shared/logging";
import orpc from "~/orpc";
import useLocalTodoEntries from "~/hooks/use-local-todo-entries";
import pick from "lodash/pick";
import sharedSchemas from "~/shared/schemas";
import { z as zod } from "zod";

// eslint-disable-next-line @typescript-eslint/no-empty-function
const DO_NOTHING = () => { };

export default function Entries() {
    const [saving] = useAtom(savingEntryAtom);
    const [localTodoEntries, setLocalTodoEntries] = useLocalTodoEntries();
    const { data: session, update: mutateSession } = useSession();
    const [todoEntries, setTodoEntries] = useTodoEntries();
    const isLoading = session === undefined;

    const populateUser = async (userId: string) => {
        const preparedEntries = localTodoEntries!.map(entry => ({
            ...pick(entry, "completed", "description", "dueDate", "priority", "title"),

            userId,
        })) satisfies zod.infer<typeof sharedSchemas.POPULATE_USER>["todoEntries"];
        const populatedEntries = await orpc.user.populateNewUser({
            todoEntries: preparedEntries,
            userId,
        });

        setLocalTodoEntries([]);
        mutateSession({
            isNewUser: false,
            todoEntries: populatedEntries,
        });
    };

    useEffect(() => {
        if (session?.user.isNewUser && localTodoEntries && localTodoEntries.length > 0) {
            populateUser(session.user.id);
        } else if (session?.user.isNewUser) {
            orpc.user.disableNewUserFlag({ userId: session.user.id });
        }

        return DO_NOTHING;
    }, [session]);

    logging.log("Todo Entries:", todoEntries);

    return (
        <main className="bg-base-300 box-border flex grow flex-col items-center justify-center p-4">
            <Render if={isLoading}>
                <ul className="list rounded-box bg-white shadow-md">
                    {Array.from({ length: 3 }).map((_, index) => (
                        <LoadingEntry key={`loading-entry-${index + 1}`} />
                    ))}
                </ul>
            </Render>

            <Render if={!isLoading}>
                <ul className="list bg-base-100 rounded-box w-96 max-w-96 shadow-md">
                    <li className="p-4 pb-2 text-xs tracking-wide opacity-60">TODOs</li>

                    {todoEntries && todoEntries.length > 0
                        ? todoEntries.map(data => (
                            <Entry
                                key={`entry-${data.id}`}
                                setTodoEntries={setTodoEntries}
                                {...data}
                            />
                        ))
                        : null}

                    {saving ? <LoadingEntry /> : null}

                    <EntryCreator setTodoEntries={setTodoEntries} />
                </ul>
            </Render>
        </main>
    );
}

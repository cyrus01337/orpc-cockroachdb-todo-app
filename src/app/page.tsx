"use client";

import pick from "lodash/pick";
import { signIn, signOut, useSession } from "next-auth/react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { z as zod } from "zod";

import Entry from "~/app/_components/entry";
import EntryCreator from "~/app/_components/entry-creator";
import LoadingEntry from "~/app/_components/entry/loading";
import Render from "~/components/client/render";
import useLocalTodoEntries from "~/hooks/use-local-todo-entries";
import useTodoEntries from "~/hooks/use-todo-entries";
import orpc from "~/orpc";
import logging from "~/shared/logging";
import sharedSchemas from "~/shared/schemas";

const BUTTON_CLASS = "btn btn-primary min-w-24 rounded-lg";

// TODO: Convert page only to server component
export default function Home() {
    const { data: session, update: mutateSession } = useSession();
    const [saving, setSaving] = useState(false);
    const [localTodoEntries, setLocalTodoEntries] = useLocalTodoEntries();
    const [todoEntries, setTodoEntries] = useTodoEntries();
    const isLoading = session === undefined;

    logging.log("Todo Entries:", todoEntries);

    const populateUser = async (userId: string) => {
        const preparedEntries = localTodoEntries!.map(entry => ({
            ...pick(entry, "completed", "description", "dueDate", "priority", "title"),

            userId,
        })) satisfies zod.infer<typeof sharedSchemas.POPULATE_USER>["todoEntries"];
        const populatedEntries = await orpc.user.populate({
            todoEntries: preparedEntries,
            userId,
        });

        setLocalTodoEntries([]);
        mutateSession({
            todoEntries: populatedEntries,
        });
    };

    useEffect(() => {
        if (session && localTodoEntries && localTodoEntries.length > 0) {
            logging.log("Session (Effect):", session);
            populateUser(session.user.id);
        }
    }, [session]);

    return (
        <div className="flex h-dvh w-dvw flex-col">
            <nav className="bg-base-100 sticky top-0 box-border flex w-full flex-row justify-end gap-2 p-4 shadow-lg">
                <Render if={isLoading}>
                    <span className="loading loading-spinner"></span>
                </Render>

                <Render if={session === null}>
                    <button className={BUTTON_CLASS} onClick={() => signIn()}>
                        Login
                    </button>
                    <Link className={BUTTON_CLASS} href="/sign-up">
                        Sign Up
                    </Link>
                </Render>

                <Render if={session}>
                    <button
                        className={BUTTON_CLASS}
                        onClick={() => signOut({ callbackUrl: "/", redirect: true })}
                    >
                        Logout
                    </button>
                </Render>
            </nav>

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

                        <EntryCreator setSaving={setSaving} setTodoEntries={setTodoEntries} />
                    </ul>
                </Render>
            </main>
        </div>
    );
}

"use client";

import pick from "lodash/pick";
import { useSession } from "next-auth/react";

import useTodoEntries from "~/hooks/use-todo-entries";
import orpc from "~/orpc";
import logging from "~/shared/logging";

import type { TodoEntry } from "~/shared/types";
import type { FormEventHandler, RefObject } from "react";

interface Properties {
    id: TodoEntry["id"];
    ref: RefObject<HTMLDialogElement | null>;
    setTodoEntries: (todoEntries: TodoEntry[]) => void;
    title: TodoEntry["title"];
    userId: TodoEntry["userId"];
}

export default function ConfirmationModal(properties: Properties) {
    const { data: session } = useSession();
    const [todoEntries] = useTodoEntries();

    const deleteEntry: FormEventHandler<HTMLFormElement> = async () => {
        if (session) {
            await orpc.todos.delete(pick(properties, "id", "userId"));
        }

        logging.log(
            "Todo Entries (Post-Deletion):",
            todoEntries!.filter(entry => entry.id !== properties.id),
        );

        properties.setTodoEntries(todoEntries!.filter(entry => entry.id !== properties.id));
    };

    return (
        <dialog className="modal" ref={properties.ref}>
            <div className="modal-box">
                <form method="dialog">
                    <button className="btn btn-sm btn-circle btn-ghost absolute top-2 right-2">
                        <svg
                            className="size-6"
                            fill="none"
                            strokeWidth={1.5}
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            xmlns="http://www.w3.org/2000/svg"
                        >
                            <path
                                d="M6 18 18 6M6 6l12 12"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />
                        </svg>
                    </button>
                </form>

                <h1 className="py-2 pl-2 text-xl font-bold">{properties.title}</h1>
                <p className="pb-5 pl-2">Are you sure you want to delete this entry?</p>

                <div className="flex gap-2 px-2">
                    <form method="dialog" onSubmit={deleteEntry}>
                        <button className="btn btn-error text-base-100 rounded">
                            Yes, delete it
                        </button>
                    </form>

                    <form method="dialog">
                        <button className="btn rounded">Cancel</button>
                    </form>
                </div>
            </div>
        </dialog>
    );
}

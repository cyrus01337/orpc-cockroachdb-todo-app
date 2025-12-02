"use client";

import { useSession } from "next-auth/react";
import { useRef, useState } from "react";
import { z as zod } from "zod";

import constants from "~/constants";
import useTodoEntries from "~/hooks/use-todo-entries";
import orpc from "~/orpc";
import logging from "~/shared/logging";
import sharedSchemas from "~/shared/schemas";
import todos from "~/todos";

import type { TodoEntry } from "~/shared/types";
import type { PartialWithKeys } from "~/types";
import type { ChangeEventHandler, FormEventHandler, MouseEventHandler, RefObject } from "react";
import { savingEntryAtom } from "~/store";
import { useAtom } from "jotai";

interface Properties {
    setTodoEntries: (todoEntries: TodoEntry[]) => void;
}

const DEFAULT_PRIORITY = "Select priority";

export default function EntryCreator(properties: Properties) {
    const [, setSaving] = useAtom(savingEntryAtom);
    const modalReference = useRef<HTMLDialogElement>(null);
    const titleReference = useRef<HTMLInputElement>(null);
    const descriptionReference = useRef<HTMLInputElement>(null);
    const priorityReference = useRef<HTMLSelectElement>(null);
    const dueDateReference = useRef<HTMLInputElement>(null);
    const { data: session } = useSession();
    const [priority, setPriority] = useState<TodoEntry["priority"]>();
    const [todoEntries] = useTodoEntries();
    let prioritySelectorColourClass = "";

    switch (priority) {
        case "low":
            prioritySelectorColourClass = "select-success";

            break;

        case "medium":
            prioritySelectorColourClass = "select-warning";

            break;

        case "high":
            prioritySelectorColourClass = "select-error";

            break;

        default:
            break;
    }

    const openModal: MouseEventHandler<HTMLButtonElement> = () => {
        modalReference.current?.showModal();
    };

    const savePriority: ChangeEventHandler<HTMLSelectElement> = event => {
        setPriority(event.currentTarget.value.toLowerCase() as TodoEntry["priority"]);
    };

    const resetFields = () => {
        const references: RefObject<HTMLInputElement | null>[] = [
            titleReference,
            descriptionReference,
            dueDateReference,
        ];

        for (const reference of references) {
            if (reference?.current) {
                reference.current.value = "";
            }
        }

        if (priorityReference.current) {
            priorityReference.current.value = DEFAULT_PRIORITY;
        }

        setPriority(undefined);
    };

    // @ts-ignore: Return type is either what's returned or an error is raised,
    // which guarantees the return type to be as follows
    const parsePartialEntry = async (
        partialEntry: PartialWithKeys<zod.infer<typeof sharedSchemas.CREATE_TODO>>,
        // @ts-ignore: Return type is either what's returned or an error is raised,
        // which guarantees the return type to be as follows
    ): Promise<zod.infer<typeof sharedSchemas.CREATE_TODO>> => {
        try {
            return await sharedSchemas.CREATE_TODO.parseAsync(partialEntry);
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

    const saveEntry: FormEventHandler<HTMLFormElement> = async () => {
        setSaving(true);

        if (!session) {
            const newEntry = await parseLocalEntry({
                completed: false,
                createdAt: Date.now(),
                description: descriptionReference.current?.value,
                dueDate: todos.resolveDueDate(dueDateReference.current?.valueAsNumber),
                id: crypto.randomUUID(),
                priority: priority!,
                title: titleReference.current?.value,
                userId: constants.DEFAULT_LOCAL_USER_ID,
            });

            properties.setTodoEntries([...todoEntries!, newEntry]);
        } else {
            const partialEntry = await parsePartialEntry({
                description: descriptionReference.current?.value,
                dueDate: todos.resolveDueDate(dueDateReference.current?.valueAsNumber),
                title: titleReference.current?.value,
                priority: priority!,
                userId: session?.user.id,
            });
            const newEntry = await orpc.todos.create(partialEntry);

            properties.setTodoEntries([...todoEntries!, newEntry]);
        }

        resetFields();
        setSaving(false);
    };

    return (
        <>
            <li className="list-row">
                <button className="btn btn-ghost flex flex-row items-center" onClick={openModal}>
                    <svg
                        className="size-6"
                        fill="none"
                        strokeWidth={1.5}
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                    >
                        <path
                            d="M12 4.5v15m7.5-7.5h-15"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                    </svg>

                    <span className="select-none">Add TODO</span>
                </button>
            </li>

            <dialog className="modal" ref={modalReference}>
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

                    <div className="flex flex-col gap-2 pb-8">
                        <input
                            className="input input-xl font-bold"
                            placeholder="Enter title here..."
                            ref={titleReference}
                        />
                        <input
                            className="input"
                            placeholder="Enter description here..."
                            ref={descriptionReference}
                        />

                        <select
                            className={`select box-border rounded px-3 ${prioritySelectorColourClass}`}
                            defaultValue={DEFAULT_PRIORITY}
                            onChange={savePriority}
                            ref={priorityReference}
                        >
                            <option disabled={true}>Select priority</option>
                            <option>Low</option>
                            <option>Medium</option>
                            <option>High</option>
                        </select>

                        <fieldset className="fieldset">
                            <legend className="fieldset-legend">Due date:</legend>
                            <input className="input" ref={dueDateReference} type="date" />
                        </fieldset>
                    </div>

                    <div className="flex justify-end gap-2 px-2">
                        <form method="dialog" onSubmit={saveEntry}>
                            <button className="btn btn-success rounded">Save</button>
                        </form>

                        <form method="dialog">
                            <button className="btn btn-error text-base-100 rounded">Cancel</button>
                        </form>
                    </div>
                </div>
            </dialog>
        </>
    );
}

"use client";

import pick from "lodash/pick";
import { useSession } from "next-auth/react";
import { useRef } from "react";

import ConfirmationModal from "~/app/_components/entry/confirmation-modal";
import EditModal from "~/app/_components/entry/edit-modal";
import constants from "~/constants";
import useTodoEntries from "~/hooks/use-todo-entries";
import todos from "~/todos";

import type { TodoEntry } from "~/shared/types";
import type { MouseEventHandler } from "react";

interface Properties extends TodoEntry {
    setTodoEntries: (todoEntries: TodoEntry[]) => void;
}

export default function Entry(properties: Properties) {
    const completedReference = useRef<HTMLInputElement>(null);
    const editModalReference = useRef<HTMLDialogElement>(null);
    const confirmationModalReference = useRef<HTMLDialogElement>(null);
    const { data: session } = useSession();
    const [todoEntries] = useTodoEntries();

    const updateEntry: MouseEventHandler<HTMLDivElement> = async () => {
        const newCompleted = !properties.completed;

        if (completedReference.current) {
            completedReference.current.checked = newCompleted;
        }

        await todos.updateEntry({
            entry: {
                ...pick(
                    properties,
                    "createdAt",
                    "description",
                    "dueDate",
                    "id",
                    "priority",
                    "title",
                    "userId",
                ),

                completed: newCompleted,
            },
            setTodoEntries: properties.setTodoEntries,
            todoEntries: todoEntries!,
            session,
        });
    };

    const openEditModal: MouseEventHandler<HTMLButtonElement> = () =>
        editModalReference.current?.showModal();

    const confirmDeletion: MouseEventHandler<HTMLButtonElement> = () => {
        confirmationModalReference.current?.showModal();
    };

    return (
        <li className="list-row flex flex-row justify-between">
            <div
                className="flex grow flex-row items-center gap-2 hover:cursor-pointer"
                onClick={updateEntry}
            >
                <input
                    className="checkbox checkbox-success"
                    defaultChecked={properties.completed}
                    ref={completedReference}
                    type="checkbox"
                />

                <div className="flex flex-col select-none">
                    <span>{properties.title}</span>
                    <span className="line-clamp-1 max-w-52 text-xs font-semibold text-ellipsis uppercase opacity-60">
                        {properties.description}
                    </span>
                </div>
            </div>

            <div>
                <button className="btn btn-square btn-ghost" onClick={openEditModal}>
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={1.5}
                        stroke="currentColor"
                        className="size-6"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L6.832 19.82a4.5 4.5 0 0 1-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 0 1 1.13-1.897L16.863 4.487Zm0 0L19.5 7.125"
                        />
                    </svg>
                </button>

                <button className="btn btn-square btn-ghost" onClick={confirmDeletion}>
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={1.5}
                        stroke="currentColor"
                        className="size-6"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M6 18 18 6M6 6l12 12"
                        />
                    </svg>
                </button>
            </div>

            <EditModal
                completedReference={completedReference}
                reference={editModalReference}
                {...properties}
            />
            <ConfirmationModal
                id={properties.id}
                ref={confirmationModalReference}
                setTodoEntries={properties.setTodoEntries}
                title={properties.title}
                userId={session?.user.id ?? constants.DEFAULT_LOCAL_USER_ID}
            />
        </li>
    );
}

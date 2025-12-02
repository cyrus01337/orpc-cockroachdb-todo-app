"use client";

import capitalise from "lodash/capitalize";
import pick from "lodash/pick";
import { useSession } from "next-auth/react";
import { useRef, useState } from "react";

import constants from "~/constants";
import useTodoEntries from "~/hooks/use-todo-entries";
import todos from "~/todos";

import type { TodoEntry } from "~/shared/types";
import type { ChangeEventHandler, FormEventHandler, RefObject } from "react";

interface EditModalProperties {
    createdAt: TodoEntry["createdAt"];
    completed: TodoEntry["completed"];
    completedReference: RefObject<HTMLInputElement | null>;
    description: TodoEntry["description"];
    dueDate?: TodoEntry["dueDate"];
    id: TodoEntry["id"];
    priority: TodoEntry["priority"];
    reference: RefObject<HTMLDialogElement | null>;
    setTodoEntries: (todoEntries: TodoEntry[]) => void;
    title: TodoEntry["title"];
}

const resolveDueDate = (dueDate?: number): number | undefined => {
    if (dueDate === undefined) {
        return dueDate;
    }

    return !isNaN(dueDate) ? dueDate : undefined;
};

export default function EditModal(properties: EditModalProperties) {
    const titleReference = useRef<HTMLInputElement>(null);
    const descriptionReference = useRef<HTMLInputElement>(null);
    const dueDateReference = useRef<HTMLInputElement>(null);
    const [priority, setPriority] = useState<TodoEntry["priority"]>(properties.priority);
    const { data: session } = useSession();
    const [todoEntries] = useTodoEntries();
    let prioritySelectorColourClass = "";

    const savePriority: ChangeEventHandler<HTMLSelectElement> = event =>
        setPriority(event.currentTarget.value.toLowerCase() as TodoEntry["priority"]);

    const updateEntry: FormEventHandler<HTMLFormElement> = async () =>
        await todos.updateEntry({
            entry: {
                ...pick(properties, "completed", "createdAt", "id"),

                description: descriptionReference.current?.value,
                dueDate: resolveDueDate(dueDateReference.current?.valueAsNumber),
                title: titleReference.current?.value,
                userId: constants.DEFAULT_LOCAL_USER_ID,
                priority,
            },
            setTodoEntries: properties.setTodoEntries,
            todoEntries: todoEntries!,
            session,
        });

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

    return (
        <dialog className="modal" ref={properties.reference}>
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
                        className="input input-ghost input-xl font-bold"
                        defaultValue={properties.title}
                        placeholder="Enter title here..."
                        ref={titleReference}
                    />
                    <input
                        className="input input-ghost"
                        defaultValue={properties.description}
                        placeholder="Enter description here..."
                        ref={descriptionReference}
                    />

                    <select
                        className={`select box-border rounded px-3 ${prioritySelectorColourClass}`}
                        defaultValue={capitalise(properties.priority)}
                        onChange={savePriority}
                    >
                        <option disabled={true}>Select priority</option>
                        <option>Low</option>
                        <option>Medium</option>
                        <option>High</option>
                    </select>

                    <fieldset className="fieldset">
                        <legend className="fieldset-legend">Due date:</legend>
                        {/* For some reason `defaultValue` only accepts dates in this format */}
                        <input
                            className="input"
                            defaultValue={
                                properties.dueDate &&
                                new Date(properties.dueDate).toLocaleDateString("en-CA")
                            }
                            ref={dueDateReference}
                            type="date"
                        />
                    </fieldset>
                </div>

                <div className="flex justify-end gap-2 px-2">
                    <form method="dialog" onSubmit={updateEntry}>
                        <button className="btn btn-success rounded">Save</button>
                    </form>

                    <form method="dialog">
                        <button className="btn btn-error text-base-100 rounded">Cancel</button>
                    </form>
                </div>
            </div>
        </dialog>
    );
}

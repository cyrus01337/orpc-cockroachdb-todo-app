import { z as zod } from "zod";

const TODO = zod.object({
    completed: zod.boolean(),
    createdAt: zod.number().positive(),
    description: zod.string().min(1),
    dueDate: zod.number().positive().optional(),
    id: zod.string().min(1),
    priority: zod.enum(["low", "medium", "high"]),
    title: zod.string().min(1),
    userId: zod.string().min(1),
});
const CREATE_TODO = TODO.pick({
    description: true,
    dueDate: true,
    priority: true,
    title: true,
    userId: true,
});
const POPULATE_USER = TODO.pick({ userId: true }).and(
    zod.object({
        todoEntries: zod.array(
            TODO.pick({
                completed: true,
                description: true,
                dueDate: true,
                priority: true,
                title: true,
                userId: true,
            }),
        ),
    }),
);
const UPDATE_TODO = TODO.pick({
    completed: true,
    description: true,
    dueDate: true,
    id: true,
    priority: true,
    title: true,
});
const DISABLE_NEW_USER_FLAG = todo.pick({ userId: true });

export default {
    CREATE_TODO,
    DISABLE_NEW_USER_FLAG,
    POPULATE_USER,
    TODO,
    UPDATE_TODO,
};

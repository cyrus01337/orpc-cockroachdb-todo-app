import { os } from "@orpc/server";
import omit from "lodash/omit";

import database from "~/server/database";
import sharedSchemas from "~/shared/schemas";

export const populateNewUser = os
    .input(sharedSchemas.POPULATE_USER)
    .handler(async ({ input }) => await database.populateNewUser(input.userId, input.todoEntries));
export const createTodo = os
    .input(sharedSchemas.CREATE_TODO)
    .handler(async ({ input }) => await database.createTodoEntry(input));
export const readTodo = os
    .input(sharedSchemas.TODO.pick({ id: true }))
    .handler(async ({ input }) => await database.readTodoEntries(input.id));
export const updateTodo = os
    .input(sharedSchemas.UPDATE_TODO)
    .handler(async ({ input }) => await database.updateTodoEntry(input.id, omit(input, "id")));
export const deleteTodo = os
    .input(sharedSchemas.TODO.pick({ id: true, userId: true }))
    .handler(async ({ input }) => await database.deleteTodoEntry(input.id, input.userId));
export const disableNewUserFlag = os
    .input(sharedSchemas.DISABLE_NEW_USER_FLAG)
    .handler(async ({ input }) => await database.disableNewUserFlag(input.userId));

export const router = {
    todos: {
        create: createTodo,
        read: readTodo,
        update: updateTodo,
        delete: deleteTodo,
    },
    user: {
        disableNewUserFlag,
        populateNewUser,
    },
};

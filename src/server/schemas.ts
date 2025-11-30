import { z as zod } from "zod";

const LOGIN_CREDENTIALS = zod.strictObject({
    email: zod.email(),
    encodedPassword: zod.string().min(1),
});
const PASSWORD = zod
    .string()
    .min(8, { message: "Minimum 8 characters" })
    .max(64, { message: "Maximum 64 characters" });

export default {
    LOGIN_CREDENTIALS,
    PASSWORD,
};

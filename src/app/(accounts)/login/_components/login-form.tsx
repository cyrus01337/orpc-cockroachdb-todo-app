"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";

import type { ClientLoginCredentials } from "~/shared/types";

interface Properties {
    csrfToken?: string;
}

export default function LoginForm(properties: Properties) {
    const [loggingIn, setLoggingIn] = useState(false);
    const [email, setEmail] = useState("");

    const handleSignIn: React.FormEventHandler<HTMLFormElement> = async event => {
        event.preventDefault();
        setLoggingIn(true);

        const formData = new FormData(event.currentTarget);
        const credentials = {
            email: formData.get("email") as string,
            password: formData.get("password") as string,
        } satisfies ClientLoginCredentials;

        await signIn("credentials", {
            ...credentials,
            callbackUrl: "/",
        });
        setLoggingIn(false);
    };

    return (
        <form className="space-y-4 md:space-y-6" onSubmit={handleSignIn}>
            <div>
                <input defaultValue={properties.csrfToken} name="csrfToken" type="hidden" />

                <label
                    className="mb-2 block text-sm font-medium text-gray-900 dark:text-white"
                    htmlFor="email"
                >
                    Email
                </label>

                <input
                    className="focus:ring-primary-600 focus:border-primary-600 block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 dark:focus:border-blue-500 dark:focus:ring-blue-500"
                    defaultValue={email}
                    id="email"
                    name="email"
                    onInput={event => setEmail(event.currentTarget.value)}
                    placeholder="name@company.com"
                    required
                    type="email"
                />
            </div>

            <div>
                <label
                    className="mb-2 block text-sm font-medium text-gray-900 dark:text-white"
                    htmlFor="password"
                >
                    Password
                </label>

                <input
                    className="focus:ring-primary-600 focus:border-primary-600 block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 dark:focus:border-blue-500 dark:focus:ring-blue-500"
                    id="password"
                    name="password"
                    placeholder="••••••••"
                    required
                    type="password"
                />
            </div>

            {/* <p aria-live="polite">{data?.errors.join("\n")}</p> */}

            <div className="flex items-center justify-between">
                <a
                    className="text-primary dark:text-primary-500 text-sm font-medium hover:underline"
                    href="/forgot-password"
                >
                    Forgot password?
                </a>
            </div>

            <button
                className="btn btn-primary w-full rounded-lg"
                disabled={loggingIn}
                type="submit"
            >
                {!loggingIn ? (
                    "Log In"
                ) : (
                    <span className="bg-primary loading loading-spinner"></span>
                )}
            </button>

            <p className="text-sm font-light text-gray-500 dark:text-gray-400">
                Don't have an account yet?{" "}
                <a className="text-primary font-medium hover:underline" href="/sign-up">
                    Sign up
                </a>
            </p>
        </form>
    );
}

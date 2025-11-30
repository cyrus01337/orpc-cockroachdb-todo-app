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
                <input name="csrfToken" type="hidden" defaultValue={properties.csrfToken} />

                <label
                    htmlFor="email"
                    className="mb-2 block text-sm font-medium text-gray-900 dark:text-white"
                >
                    Email
                </label>

                <input
                    type="email"
                    name="email"
                    id="email"
                    className="focus:ring-primary-600 focus:border-primary-600 block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 dark:focus:border-blue-500 dark:focus:ring-blue-500"
                    placeholder="name@company.com"
                    defaultValue={email}
                    onInput={event => setEmail(event.currentTarget.value)}
                    required
                />
            </div>

            <div>
                <label
                    htmlFor="password"
                    className="mb-2 block text-sm font-medium text-gray-900 dark:text-white"
                >
                    Password
                </label>

                <input
                    type="password"
                    name="password"
                    id="password"
                    placeholder="••••••••"
                    className="focus:ring-primary-600 focus:border-primary-600 block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 dark:focus:border-blue-500 dark:focus:ring-blue-500"
                    required
                />
            </div>

            {/* <p aria-live="polite">{data?.errors.join("\n")}</p> */}

            <div className="flex items-center justify-between">
                <a
                    href="/forgot-password"
                    className="text-primary dark:text-primary-500 text-sm font-medium hover:underline"
                >
                    Forgot password?
                </a>
            </div>

            <button
                type="submit"
                className="btn btn-primary w-full rounded-lg"
                disabled={loggingIn}
            >
                {!loggingIn ? (
                    "Log In"
                ) : (
                    <span className="bg-primary loading loading-spinner"></span>
                )}
            </button>

            <p className="text-sm font-light text-gray-500 dark:text-gray-400">
                Don't have an account yet?{" "}
                <a href="/sign-up" className="text-primary font-medium hover:underline">
                    Sign up
                </a>
            </p>
        </form>
    );
}

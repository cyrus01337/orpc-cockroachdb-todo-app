"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";

import { ClientLoginCredentials } from "~/shared/types";

export default function SignUpForm() {
    const [email, setEmail] = useState("");
    const [error, setError] = useState("");
    const [registering, setRegistering] = useState(false);

    const handleSignUp: React.FormEventHandler<HTMLFormElement> = async event => {
        event.preventDefault();
        setError("");
        setRegistering(true);

        const formData = new FormData(event.currentTarget);
        const response = await fetch("/api/create-user", {
            body: formData,
            method: "POST",
        });

        if (response.ok) {
            const rawCredentials = {
                email,
                password: formData.get("password") as string,
            } satisfies ClientLoginCredentials;

            signIn("credentials", {
                ...rawCredentials,
                callbackUrl: "/",
            });
        } else {
            setError(`HTTP ${response.status}: ${await response.text()}`);
        }

        setRegistering(false);
    };

    return (
        <form className="space-y-4 md:space-y-6" onSubmit={handleSignUp}>
            <div>
                <label
                    className="mb-2 block text-sm font-medium text-gray-900 dark:text-white"
                    htmlFor="email"
                >
                    Email
                </label>

                <input
                    className="focus:ring-primary focus:border-primary block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 dark:focus:border-blue-500 dark:focus:ring-blue-500"
                    defaultValue={email}
                    id="email"
                    name="email"
                    onInput={event => setEmail(event.currentTarget.value)}
                    placeholder="name@company.com"
                    type="email"
                    required
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
                    className="focus:ring-primary focus:border-primary block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 dark:focus:border-blue-500 dark:focus:ring-blue-500"
                    id="password"
                    name="password"
                    placeholder="••••••••"
                    type="password"
                    required
                />
            </div>

            {error.length > 0 ? <p aria-live="polite">{error}</p> : null}

            <button
                className="btn btn-primary w-full rounded-lg"
                disabled={registering}
                type="submit"
            >
                {!registering ? (
                    "Sign Up"
                ) : (
                    <span className="bg-primary loading loading-spinner"></span>
                )}
            </button>

            <p className="text-sm font-light text-gray-500 dark:text-gray-400">
                Already have an account?{" "}
                <a className="text-primary font-medium hover:underline" href="/login">
                    Log In
                </a>
            </p>
        </form>
    );
}

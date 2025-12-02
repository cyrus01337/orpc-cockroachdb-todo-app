"use client";

import { signIn, signOut, useSession } from "next-auth/react";
import Link from "next/link";

import Render from "~/components/client/render";

const BUTTON_CLASS = "btn btn-primary min-w-24 rounded-lg";

export default function Navbar() {
    const { data: session } = useSession();
    const isLoading = session === undefined;

    return (
        <nav className="bg-base-100 sticky top-0 box-border flex w-full flex-row justify-between items-center p-4 shadow-lg">
            <Link className="text-3xl font-bold transition-colors hover:text-primary" href="/">Balls</Link>

            <div className="flex flex-row gap-2">
                <Render if={isLoading}>
                    <button className={BUTTON_CLASS}>
                        <span className="loading loading-spinner"></span>
                    </button>

                    <button className={BUTTON_CLASS}>
                        <span className="loading loading-spinner"></span>
                    </button>
                </Render>

                <Render if={session === null}>
                    <button className={BUTTON_CLASS} onClick={() => signIn()}>
                        Login
                    </button>
                    <Link className={BUTTON_CLASS} href="/sign-up">
                        Sign Up
                    </Link>
                </Render>

                <Render if={session}>
                    <button
                        className={BUTTON_CLASS}
                        onClick={() => signOut({ callbackUrl: "/", redirect: true })}
                    >
                        Logout
                    </button>
                </Render>
            </div>
        </nav>
    )
}

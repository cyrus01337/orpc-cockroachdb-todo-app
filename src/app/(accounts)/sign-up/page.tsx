"use server";

import { getServerSession } from "next-auth";
import { headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";

import SignUpForm from "~/app/(accounts)/sign-up/_components/sign-up-form";

export default async function SignUp() {
    const session = await getServerSession();

    if (session) {
        const headersList = await headers();

        redirect(headersList.get("referer") ?? "/");
    }

    return (
        <section className="bg-gray-50 dark:bg-gray-900">
            <div className="mx-auto flex flex-col items-center justify-center px-6 py-8 md:h-screen lg:py-0">
                <Link
                    href="/"
                    className="mb-6 flex items-center text-2xl font-semibold text-gray-900 dark:text-white"
                >
                    Next Auth Boilerplate
                </Link>

                <div className="w-full rounded-lg bg-white shadow sm:max-w-md md:mt-0 xl:p-0 dark:border dark:border-gray-700 dark:bg-gray-800">
                    <div className="space-y-4 p-6 sm:p-8 md:space-y-6">
                        <h1 className="text-xl leading-tight font-bold tracking-tight text-gray-900 md:text-2xl dark:text-white">
                            Create your account
                        </h1>

                        <SignUpForm />
                    </div>
                </div>
            </div>
        </section>
    );
}

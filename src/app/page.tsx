"use server";

import Entries from "~/app/_components/entries";
import Navbar from "~/app/_components/navbar";

export default async function Home() {
    return (
        <div className="flex h-dvh w-dvw flex-col">
            <Navbar />
            <Entries />
        </div>
    );
}

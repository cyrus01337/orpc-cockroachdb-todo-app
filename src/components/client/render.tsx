import type { ReactNode } from "react";

interface Properties<Condition> {
    children: ReactNode;
    if: Condition;
}

export default function Render<Condition>(properties: Properties<Condition>) {
    return properties.if ? properties.children : null;
}

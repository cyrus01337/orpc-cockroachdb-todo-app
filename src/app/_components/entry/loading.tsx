export default function LoadingEntry() {
    return (
        <li className="box-border flex w-96 max-w-96 flex-col gap-3 p-4">
            <div className="skeleton h-4 w-28"></div>
            <div className="skeleton h-4 w-full"></div>
        </li>
    );
}

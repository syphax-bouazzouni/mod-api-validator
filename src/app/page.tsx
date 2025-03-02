'use client'
import {cn} from "@/lib/utils";
import EndpointExplorer from "@/app/openapi-explorer";

export default function Home() {
    return (
        <div className={cn("min-h-screen", "bg-gray-100", 'p-2')}>
            <EndpointExplorer />
        </div>
    );
}

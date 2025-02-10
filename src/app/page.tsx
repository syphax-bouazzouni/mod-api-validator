'use client'
import {cn} from "@/lib/utils";
import EndpointExplorer from "@/app/openapi-explorer";

export default function Home() {
    return (
        <div className={cn("min-h-screen")}>
            <EndpointExplorer />
        </div>
    );
}

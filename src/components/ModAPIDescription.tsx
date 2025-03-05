import React from "react";
import {ModAPI} from "@/lib/modapi-parser";

export function ModAPIDescription({modAPI}:  {modAPI: ModAPI | null | undefined}) {
    if (!modAPI || !modAPI.info || !modAPI.endpoints) {
        return null;
    }

    const {info, endpoints} = modAPI;


    return <div className="space-y-2">
        <div className="text-sm text-gray-600">
            <span className="font-semibold">Title:</span> {info.title}
        </div>
        <div className="text-sm text-gray-600">
            <span className="font-semibold">Version:</span> {info.version}
        </div>
        <div className="text-sm text-gray-600">
            <span className="font-semibold">Description:</span> {info.description}
        </div>

        <div className="text-sm text-gray-600">
                                <span
                                    className="font-semibold">Total endpoints:</span> {endpoints.length}
        </div>
    </div>
}
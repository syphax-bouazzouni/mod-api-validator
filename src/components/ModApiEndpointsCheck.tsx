import React from "react";

export default function ModApiEndpointsChecks({filters, setFilters, enabledFilters}: any) {
    return (<div className={'flex gap-x-6'}>
            {filters && Object.entries(filters).map(([key, value]) => (
                <div className="flex items-center gap-2">
                    <input
                        type="checkbox"
                        id={"show" + key}
                        checked={value}
                        disabled={enabledFilters && !enabledFilters[key]}
                        title={enabledFilters && !enabledFilters[key] ? "This filter is disabled": ""}
                        onChange={() => setFilters({...filters, [key]: !value})}
                    />
                    <label htmlFor={"show" + key}>Show {key} endpoints</label>
                </div>
            ))}
        </div>
    );
}
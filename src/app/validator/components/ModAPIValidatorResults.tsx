import {ModAPI} from "@/lib/modapi-parser";
import {CheckCircleIcon, CircleCheck, CircleX, Loader2} from "lucide-react";
import {Alert} from "@/components/ui/alert";
import ModApiEndpointsChecks from "@/components/ModApiEndpointsCheck";
import {useModEndpointsFilter} from "@/app/explore/components/openapi-explorer";
import {EndpointValidationResult, PropertiesResult} from "@/lib/api-fetcher";
import {useModAPIValidator} from "@/lib/validator/modapi-validator";
import {ValidatorResultsTable} from "@/app/validator/components/ValitatorResultsTable";
import {ResultExplicationTooltip} from "@/components/result-explication-tooltip";
import JSONViewer from "@/components/JSONViewer";
import {AppConfig} from "@/lib/config";

export function PropertiesStatus({checked, from, all}: { checked: boolean, from: number, all: number }) {
    if (all === 0 || all === undefined) {
        return <span className="text-gray-500">N/A</span>
    }

    return <div className="flex items-center">
                <span className={`font-bold mr-1 ${checked ? 'text-green-600' : 'text-red-600'}`}>
                  {from}
                </span>
        <span> / </span>
        <span className="text-gray-500">
                   {all}
                </span>
    </div>
}

export function RequiredStatus({properties}: { properties: PropertiesResult }) {
    const checked = properties.foundRequiredProperties === properties.requiredProperties && properties.foundRequiredProperties > 0;
    return <div className={'flex items-center gap-2'}>
        <Level properties={properties}/>
        <PropertiesStatus checked={checked} from={properties.foundRequiredProperties}
                          all={properties.requiredProperties}/>
    </div>
}

export function FoundPropertiesStatus({properties}: { properties: PropertiesResult }) {
    const checked = properties.foundProperties === properties.totalProperties && properties.foundProperties > 0;
    return <PropertiesStatus checked={checked} from={properties.foundProperties} all={properties.totalProperties}/>
}

export function Checker({check}: { check: boolean }) {
    return check ? <CircleCheck className=" text-green-500"/> : <CircleX className="text-red-500"/>
}

export function Level({properties, level}: { properties?: PropertiesResult, level?: number }) {
    level = level || -1;
    const {foundProperties, totalProperties, foundRequiredProperties, requiredProperties} = properties || {};
    if (foundProperties && foundProperties > 0) {
        level = 2
        if (requiredProperties === foundRequiredProperties) {
            level = 3
            if (foundProperties === totalProperties) {
                level = 4
            }
        }
    }
    return level > 0 && <span className="text-gray-500">Level {level}</span>
}

export function ShowPropertiesResult({endpoint}: { endpoint: EndpointValidationResult }) {
    const allRequiredFound = endpoint.checks.requiredProperties
    const properties = endpoint.properties;
    const allRequiredProperties = properties.allRequiredProperties || [];
    const trigger = () => {
        return <div className="flex items-center gap-2">
            {allRequiredProperties.length == 0 ? <span className="text-gray-500">N/A</span> :
                <Checker check={allRequiredFound}/>}
        </div>
    }

    return <ResultExplicationTooltip header={trigger()}>
        <div className="flex flex-col gap-2">
            <Level properties={properties}/>
            <div className="flex justify-between items-center gap-2">
                <span className="font-semibold text-gray-700">Required Properties</span>
                <RequiredStatus properties={properties}/>
            </div>
            <div className="flex justify-between items-center gap-2">
                <span className="text-gray-600">Total Properties (Level 4)</span>
                <FoundPropertiesStatus properties={properties}/>
            </div>
        </div>
    </ResultExplicationTooltip>
}

export function ShowJsonLDCheck({endpoint}: { endpoint: EndpointValidationResult }) {
    const jsonLD = endpoint.checks.jsonLD;
    const isList = endpoint.expectedModel?.list;

    const trigger = () => <Checker check={jsonLD}/>;

    const displayItemJsonLD = (item: any) => {
        if (!item) return <span className="text-gray-500">No item found</span>;

        return (
            <div className="flex flex-col gap-2 p-2 border rounded-md">
                <span className="text-gray-500 font-medium">@id: <span
                    className="text-black">{item['@id'] ?? "No @id found"}</span></span>
                <span className="text-gray-500 font-medium">@type: <span
                    className="text-black">{item['@type'] ?? "No @type found"}</span></span>
                <span className="text-gray-500 font-medium">@context: {item['@context'] ?
                    <JSONViewer data={item['@context']}/> : "No @context found"}</span>
            </div>
        );
    };

    return (
        <ResultExplicationTooltip header={trigger()}>
            <div className="flex flex-col gap-4 p-4">
                <span className="text-gray-700 font-bold text-lg">JSON-LD Validation</span>
                <span className={`text-sm ${jsonLD ? "text-green-600" : "text-red-600"}`}>
                    {jsonLD ? "Valid JSON-LD" : "Invalid JSON-LD: Items must have @id, @type, and @context"}
                </span>

                {isList && (
                    <div className="flex flex-col gap-2">
                        <span className="text-gray-600 font-semibold">Collection Level</span>
                        {displayItemJsonLD(endpoint.originalResponse)}
                    </div>
                )}

                <div className="flex flex-col gap-2">
                    <span className="text-gray-600 font-semibold">Item Level</span>
                    {displayItemJsonLD(endpoint.testItem)}
                </div>
            </div>
        </ResultExplicationTooltip>
    );
}

export function ShowPaginationCheck({endpoint}: { endpoint: EndpointValidationResult }) {
    const paginated = endpoint.checks.pagination;
    const requiredKeys = AppConfig.paginationKeys;
    const responseKeys = endpoint.originalResponse ? Object.keys(endpoint.originalResponse) : [];
    const missingKeys = requiredKeys.filter((key: string) => !responseKeys.includes(key));

    const trigger = () => <Checker check={paginated}/>;

    return <ResultExplicationTooltip header={trigger()}>
        <div className="flex flex-col gap-4 p-4">
            <span className="text-gray-700 font-bold text-lg">Pagination Validation</span>

            {paginated ? (
                <div className="text-sm text-green-600 flex items-center">
                    <CheckCircleIcon className="w-4 h-4 mr-2" />
                    <span>Valid pagination structure</span>
                </div>
            ) : (
                <div className="text-sm text-red-600">
                    <span className="font-semibold">Invalid pagination:</span>
                    <span> Must include required keys: </span>
                    <span className="font-mono">{requiredKeys.join(', ')}</span>
                </div>
            )}

            <div className="text-sm">
                <span className="text-gray-600 font-semibold">Found keys: </span>
                {responseKeys.length > 0 ? (
                    <span className="font-mono text-gray-700">{responseKeys.join(', ')}</span>
                ) : (
                    <span className="italic text-gray-500">No keys found in response</span>
                )}
            </div>

            {!paginated && missingKeys.length > 0 && (
                <div className="text-sm">
                    <span className="text-gray-600 font-semibold">Missing keys: </span>
                    <span className="font-mono text-red-500">{missingKeys.join(', ')}</span>
                </div>
            )}
        </div>
    </ResultExplicationTooltip>
}

export function ShowExpectedType({endpoint}: { endpoint: EndpointValidationResult }) {
    let foundType = endpoint.foundType
    let expectedType = endpoint.expectedType

    const trigger = () => {
        if (expectedType === "") {
            return <span className="text-gray-500">N/A</span>
        }
        return <div className="flex items-center gap-2">
            <Checker check={endpoint.checks.goodType}/>
        </div>
    }
    return <ResultExplicationTooltip header={trigger()}>
        <div className="flex  flex-col gap-2">
            <div className="flex flex-col justify-between items-center gap-2">
                <span className="font-semibold text-gray-700">Expected type</span>
                <span className="text-gray-500">{expectedType ?? "Not provided in specification"} </span>

            </div>
            <div className="flex flex-col justify-between items-center gap-2">
                <span className="text-gray-600 font-semibold">Found types</span>
                <span className="text-gray-500">{foundType ?? "No type found"}</span>
            </div>
        </div>
    </ResultExplicationTooltip>
}

export function ShowScore({endpoint}: { endpoint: EndpointValidationResult }) {

    const scores = endpoint.scores || {}

    const trigger = () => {
        return <span className="text-gray-500">{endpoint.score}</span>
    }

    return <ResultExplicationTooltip header={trigger()}>
        <div className="flex flex-col gap-2">
            <span className="text-gray-700 font-semibold">Score: {endpoint.score} / {endpoint.maxScore}</span>
        </div>
        {Object.keys(scores).map((key) => {
            const score = scores[key]
            return <div key={key}
                        className={"flex justify-between items-center gap-2" + (score > 0 ? " text-green-600" : " text-red-500")}>
                <span className="">{key}</span>
                <span className="">{score}</span>
            </div>
        })}

    </ResultExplicationTooltip>
}

export function ShowExists({endpoint}: { endpoint: EndpointValidationResult }) {
    const exist = endpoint.checks.exists;
    const status = endpoint.status;

    const trigger = () => (
        <div className="flex items-center gap-2">
            <Checker check={exist}/>
        </div>
    );

    return (
        <ResultExplicationTooltip header={trigger()}>
            <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                    <span className="text-gray-700 font-bold">Status</span>
                    <span className={`text-sm ${exist ? "text-green-600" : "text-red-600"}`}>
                        {exist ? "Exists" : "Does not exist"}
                    </span>
                </div>
                <div className="flex flex-col gap-2">
                    <span className="text-gray-700 font-bold">Status Code</span>
                    <span className="text-black font-medium">{status}</span>
                </div>
            </div>
        </ResultExplicationTooltip>
    );
}

export function Loading() {
    return (<div className="flex justify-center w-full py-4 items-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500"/>
        <p>
            Loading data...
        </p>
    </div>)
}

export function ModAPIValidatorResults({
                                           model, baseUrl, params
                                       }: {
    model: ModAPI | undefined | null,
    baseUrl: string,
    params: string | null
}) {

    if (!baseUrl || !model?.endpoints) {
        return null;
    }

    const enabledFilters = {
        metadata: false,
        search: true,
        data: true,
        labels: true,
        records: true
    }

    const checkedFilters = {...enabledFilters, metadata: true}

    const {filters, setFilters, filteredEndpoints} = useModEndpointsFilter(model.endpoints, checkedFilters);

    const {isError, results, errors, isLoading} = useModAPIValidator(filteredEndpoints, baseUrl, params);

    const totalScore = Object.values(results).map(x => x.score).reduce((a, b) => a + b, 0);
    const maxScore = Object.values(results).map(x => x.maxScore).reduce((a, b) => a + b, 0);

    return <div className="space-y-4">
        {isLoading && <div><Loading/></div>}
        {isError && <Alert variant={'destructive'}>Error: {errors.map(x => x.message)}</Alert>}
        {results && Object.keys(results).length > 0 && <div>
            <ModApiEndpointsChecks filters={filters} setFilters={setFilters} enabledFilters={enabledFilters}/>
            <div className={'gap-2'}>
                <div className={'text-gray-500'}>Total endpoints: {filteredEndpoints.length}</div>
                <div className={'text-gray-500'}>Total score: {totalScore} / {maxScore} </div>
            </div>
            <ValidatorResultsTable results={results} baseUrl={baseUrl}/>
        </div>}
    </div>
}

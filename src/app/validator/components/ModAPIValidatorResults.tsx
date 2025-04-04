import {ModAPI} from "@/lib/modapi-parser";
import {Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow} from "@/components/ui/table";
import {Button} from "@/components/ui/button";
import ApiTestResultDetail from "@/app/validator/components/ApiTestResutDetail";
import {Tooltip, TooltipContent, TooltipProvider, TooltipTrigger} from "@/components/ui/tooltip";
import {CircleCheck, CircleX, Info, Loader2} from "lucide-react";
import {Alert} from "@/components/ui/alert";
import ModApiEndpointsChecks from "@/components/ModApiEndpointsCheck";
import Link from "next/link";
import {EndpointValidationResult, PropertiesResult, useModAPIValidator} from "@/lib/modapi-validator";
import {useModEndpointsFilter} from "@/app/explore/components/openapi-explorer";

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
    const allRequiredFound = endpoint.properties.foundRequiredProperties === endpoint.properties.requiredProperties && endpoint.properties.foundRequiredProperties > 0;
    const properties = endpoint.properties;
    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger>
                    {properties.requiredProperties > 0 ?
                        <div className="flex items-center gap-2">
                            <Checker check={allRequiredFound}/>
                            <RequiredStatus properties={properties}/>
                        </div> :
                        <span className="text-gray-500">N/A</span>}
                </TooltipTrigger>

                <TooltipContent className="bg-white border shadow-lg rounded-lg p-4 max-w-[300px]">
                    <div className="space-y-2">
                        <div className="flex justify-between items-center gap-2">
                            <span className="font-semibold text-gray-700">Required Properties</span>
                            <RequiredStatus properties={properties}/>
                        </div>
                        <div className="flex justify-between items-center gap-2">
                            <span className="text-gray-600">Total Properties (Level 4)</span>
                            <FoundPropertiesStatus properties={properties}/>
                        </div>
                        {!allRequiredFound && (
                            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-2 mt-2">
                                <div className="flex items-center">
                                    <Info className="text-yellow-600 mr-2" size={16}/>
                                    <span className="text-yellow-800 text-sm">
                    Some required properties are missing
                  </span>
                                </div>
                            </div>
                        )}
                    </div>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
}

export function ShowJsonLDCheck({endpoint}: { endpoint: EndpointValidationResult }) {
    return <span title={'Require @id, @type, @context'}> <Checker check={endpoint.jsonLD}/> </span>
}

export function ShowPaginationCheck({endpoint}: { endpoint: EndpointValidationResult }) {
    return <span title={'Is paginated'}> <Checker check={endpoint.pagination}/> </span>
}

export function ShowExpectedType({endpoint}: { endpoint: EndpointValidationResult }) {
    let foundType = endpoint.testItem && endpoint.testItem['@type'] || [];
    let expectedType = endpoint.responseType.label ? endpoint.responseType.label.replace("mod", "").trim() : "";

    if (!(foundType instanceof Array)) {
        foundType = [foundType];
    }

    foundType = foundType.map((type: string) => {
        type = type.toString().split("/").pop();
        type = type.replace("mod#", "").trim();
        return type;
    })


    let goodType = expectedType !== "" && foundType.includes(expectedType);

    return <span title={expectedType ? 'Expected type ' + expectedType + ' found type: ' + foundType : 'The specification did not provide a type'}>
    {expectedType !== "" ?
        <div className={'flex items-center gap-2'}>
            <Checker check={goodType}/>
        </div> :
        <span className={'text-gray-500'}>N/A</span>}
    </span>
}

export function ShowModAPIValidatorResults({baseUrl, results}: {
    baseUrl: string,
    results: Record<string, EndpointValidationResult>
}) {
    return <Table>
        <TableCaption>Overview of API Endpoints and Their Properties</TableCaption>
        <TableHeader>
            <TableRow>
                <TableHead>Endpoint</TableHead>
                <TableHead>Exists (Level 1)</TableHead>
                <TableHead>Good @type (Level 2)</TableHead>
                <TableHead>Properties (Level 3-4)</TableHead>
                <TableHead>Valid JSON-LD</TableHead>
                <TableHead>Paginated</TableHead>
                <TableHead>See JSON</TableHead>
            </TableRow>
        </TableHeader>
        <TableBody>
            {Object.entries(results).map(([path, endpoint], index) => (
                <TableRow key={index}>
                    <TableCell className="font-medium">
                        <Button variant={'link'}><Link href={baseUrl + path} target={'_blank'}>{path}</Link></Button>
                    </TableCell>
                    <TableCell>
                        <div className={'flex items-center gap-2'}
                             title={`Status: ${endpoint.originalResponse.status}`}>
                            <Checker check={endpoint.exists}/>
                        </div>
                    </TableCell>
                    <TableCell>
                        <ShowExpectedType endpoint={endpoint}/>
                    </TableCell>
                    <TableCell>
                        <ShowPropertiesResult endpoint={endpoint}/>
                    </TableCell>
                    <TableCell>
                        <ShowJsonLDCheck endpoint={endpoint}/>
                    </TableCell>
                    <TableCell>
                        {endpoint.expectedModel.list && <ShowPaginationCheck endpoint={endpoint}/>}
                    </TableCell>
                    <TableCell>
                        <ApiTestResultDetail path={path} result={endpoint}/>
                    </TableCell>
                </TableRow>
            ))}
        </TableBody>
    </Table>
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
                                           model, baseUrl, apikey, params
                                       }: {
    model: ModAPI | undefined | null,
    baseUrl: string,
    apikey: string | null
    params: string | null
}) {

    if (!baseUrl || !model || !model.endpoints) {
        return null;
    }

    const enabledFilters = {
        metadata: false,
        search: true,
        data: true,
        labels: false,
        records: false
    }

    const checkedFilters = {...enabledFilters, metadata: true}

    const {filters, setFilters, filteredEndpoints} = useModEndpointsFilter(model.endpoints, checkedFilters);

    const {isError, results, errors, isLoading} = useModAPIValidator(filteredEndpoints, baseUrl, apikey, params);

    return <div className="space-y-4">
        {isLoading && <div><Loading/></div>}
        {isError && <Alert variant={'destructive'}>Error: {errors.map(x => x.message)}</Alert>}
        {results && Object.keys(results).length > 0 && <div>
            <ModApiEndpointsChecks filters={filters} setFilters={setFilters} enabledFilters={enabledFilters}/>
            <ShowModAPIValidatorResults baseUrl={baseUrl} results={results}/>
        </div>}
    </div>
}

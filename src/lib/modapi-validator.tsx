import {useMemo} from 'react';
import {QueryObserverResult, useQueries} from "@tanstack/react-query";
import {ModAPIEndpoint, ModAPIModel, ModAPIResponseType} from "@/lib/modapi-parser";

interface APITestResult<T> {
    item: T | null;
    originalResponse: any;
    status: number;
    path: string;
    endpoint: ModAPIEndpoint;
    error: any;
}

export interface PropertiesResult {
    allProperties: string[];
    allFoundProperties: string[];
    allRequiredProperties: string[];
    allFoundRequiredProperties: string[];
    returnedProperties: number;
    totalProperties: number;
    requiredProperties: number;
    foundProperties: number;
    foundRequiredProperties: number;
}

export interface ParametersResult {
    totalParameters: number;
    implementedParameters: number;
}

export interface EndpointValidationResult {
    exists: boolean;
    properties: PropertiesResult;
    parameters: ParametersResult;
    originalResponse: any;
    expectedModel: ModAPIModel;
    responseType: ModAPIResponseType;
    goodType: boolean;
    jsonLD: boolean;
    pagination: boolean;
    testItem: any;
}

class APIUtils {
    static requireParentId(path: string): boolean {
        return path.includes('{') && path.includes('}');
    }

    static resolveEntityPath(path: string, id?: string): string {
        return path.replace(/{[^}]+}/, id || '');
    }

    static extractFirstResult(data: any): any {
        if (data['@graph']) return data['@graph'][0];
        if (data['collection']) return data['collection'][0];
        return Array.isArray(data) ? data[0] : data;
    }

    static processAPIResponse(data: any, path: string, endpoint: ModAPIEndpoint): APITestResult<any> {
        const processedItem = this.extractFirstResult(data.data);
        return {
            item: processedItem || null,
            status: data.status,
            originalResponse: data.data,
            error: data.error,
            path,
            endpoint
        };
    }

    static async fetchURL(path: string, baseUrl: string, apiKey: string | null, params: string | null): Promise<any> {
        let url = `${baseUrl}${path}`;
        if (params) {
            url += `?${params}`;
        }

        const headers: Record<string, string> = apiKey
            ? {
                "Authorization": `apikey token=${apiKey}`,
                "Accept": "application/json, application/ld+json"
            }
            : {

                "Accept": "application/json, application/ld+json"
            };

        let status = 500;
        try {
            const response = await fetch(url, {method: "GET", headers, redirect: 'follow'});
            status = response.status;
            if (response.ok) {
                return {status: status, data: await response.json(), url}
            } else {
                return {status: status, error: response.statusText, url, data: {}};
            }
        } catch (e) {
            return {status: status, error: e, url, data: {}};
        }
    }
}

class ValidationHelpers {
    static checkEndpointProperties(endpoint: ModAPIEndpoint, response: any): PropertiesResult {
        if (!endpoint.responseType.model.properties || !response) {
            return {} as PropertiesResult;
        }

        const allProperties = Object.keys(endpoint.responseType.model.properties);
        const allFoundProperties = Object.keys(response);

        const foundProperties = allProperties.filter(prop =>
            allFoundProperties.includes(prop)
        );

        const requiredProperties = endpoint.responseType.model.required;
        const foundRequiredProperties = requiredProperties.filter(
            (property: string) => foundProperties.includes(property)
        );

        return {
            allProperties,
            allFoundProperties,
            allRequiredProperties: requiredProperties,
            allFoundRequiredProperties: foundRequiredProperties,
            returnedProperties: allFoundProperties.length,
            totalProperties: allProperties.length,
            requiredProperties: requiredProperties.length,
            foundProperties: foundProperties.length,
            foundRequiredProperties: foundRequiredProperties.length,
        };
    }

    static checkEndpointParameters(endpoint: ModAPIEndpoint): ParametersResult {
        return {
            totalParameters: endpoint.parameters ? Object.keys(endpoint.parameters).length : 0,
            implementedParameters: 0
        };
    }

    static checkEndpointPagination(response: any): boolean {
        const keyToInclude = ['collection', 'page'];
        return keyToInclude.every(key => response && response[key]);
    }

    static checkJSONLD(response: any, item: any): boolean {

        let output = response && response["@context"] && response["@id"] && response["@type"];
        const parentContext = response && response["@context"];
        output = output && (item === null ||
            item["@id"] && item["@type"] && (item["@context"] || parentContext));
        return output
    }

    static checkGoodType(itemToCheck: any,endpoint: ModAPIEndpoint): boolean {
        return itemToCheck && itemToCheck["@type"] === endpoint.responseType.model.title
    }

    static checkStatus(response: APITestResult<any> | undefined): boolean {
        return response !== null && response !== undefined
            && (response.status === 200 || response.status === undefined)
    }

    static validateEndpoint(
        endpoint: ModAPIEndpoint,
        response: APITestResult<any> | undefined
    ): EndpointValidationResult {
        const itemToCheck = response?.item;
        return {
            exists: this.checkStatus(response),
            properties: this.checkEndpointProperties(endpoint, itemToCheck),
            parameters: this.checkEndpointParameters(endpoint),
            originalResponse: response?.originalResponse,
            responseType: endpoint.responseType,
            expectedModel: endpoint.responseType.model,
            jsonLD: this.checkJSONLD(response?.originalResponse, itemToCheck),
            goodType: this.checkGoodType(itemToCheck, endpoint),
            pagination: this.checkEndpointPagination(response?.originalResponse),
            testItem: itemToCheck
        };
    }
}

export function useCollectionAPIValidator({
                                              endpoints,
                                              baseUrl,
                                              apiKey,
                                              params
                                          }: any): QueryObserverResult<APITestResult<any>>[] {
    // Filter endpoints that don't require parent ID
    const collectionEndpoints = useMemo(() =>
            (endpoints || []).filter((endpoint: any) => !APIUtils.requireParentId(endpoint.path)),
        [endpoints]
    );

    return useQueries({
        queries: collectionEndpoints.map((endpoint: ModAPIEndpoint) => ({
            queryKey: ['api-test-calls-collection', endpoint.path, baseUrl],
            queryFn: () =>  {
                if(endpoint.parameters.includes("query")){
                    if(params === null){
                        params = `?query=concept`
                    } else {
                        params += `&query=concept`
                    }
                }
                return APIUtils.fetchURL(endpoint.path, baseUrl, apiKey, params)
            },
            select: (data: any) => APIUtils.processAPIResponse(data, endpoint.path, endpoint)
        }))
    });
}

export function useSecondLevelAPIValidator({
                                               endpoints,
                                               collectionQueries,
                                               baseUrl,
                                               apiKey,
                                               params
                                           }: any): QueryObserverResult<APITestResult<any>>[] {
    const secondLevelEndpoints = useMemo(() =>
            (endpoints || []).filter((endpoint: any) => APIUtils.requireParentId(endpoint.path)),
        [endpoints]
    );

    return useQueries({
        queries: secondLevelEndpoints.map((endpoint: any) => {
            const collectionResult = collectionQueries
                .map((query: any) => query.data)
                .filter((result: any) => result && result.path !== '/')
                .find((result: any) =>
                    APIUtils.resolveEntityPath(endpoint.path).startsWith(result.path)
                );

            if (!collectionResult || !collectionResult.item) {
                return {
                    queryKey: ['api-test-calls-second-level', endpoint.path, baseUrl],
                    enabled: false
                };
            }

            const acronym = collectionResult.item.acronym || collectionResult.item['@acronym'];
            if (!acronym) {
                return {
                    queryKey: ['api-test-calls-second-level', endpoint.path, baseUrl],
                    enabled: false
                };
            }

            let resolvedPath = APIUtils.resolveEntityPath(endpoint.path, acronym);
            if (APIUtils.requireParentId(resolvedPath)) {
                resolvedPath = APIUtils.resolveEntityPath(resolvedPath, '1');
            }

            return {
                queryKey: ['api-test-calls-second-level', resolvedPath, baseUrl],
                queryFn: () => APIUtils.fetchURL(resolvedPath, baseUrl, apiKey, params),
                select: (data: any) => APIUtils.processAPIResponse(data, resolvedPath, endpoint)
            };
        })
    });
}

export function useModAPIValidator(
    endpoints: ModAPIEndpoint[] | null,
    baseUrl: string,
    apiKey: string | null,
    params: string | null
) {

    const collectionQueries = useCollectionAPIValidator({endpoints, baseUrl, apiKey, params});
    const secondLevelQueries = useSecondLevelAPIValidator({endpoints, collectionQueries, baseUrl, apiKey, params});

    // Combine and process results
    const results: Record<string, EndpointValidationResult> = {};

    if (endpoints && baseUrl) {
        if (!collectionQueries.some(query => query.isLoading)) {
            collectionQueries.forEach((query) => {
                const path = query.data?.path
                const endpoint = endpoints.find((endpoint) => path && endpoint.path.startsWith(path));
                if(!endpoint){
                    console.log("Endpoint not found for path: ", path)
                    return
                }
                // debugger
                results[endpoint.path] = ValidationHelpers.validateEndpoint(endpoint, query.data);
            });
        }

        if (!secondLevelQueries.some(query => query.isLoading)) {
            secondLevelQueries.forEach(query => {
                const path = query.data?.path;
                const endpoint = query.data?.endpoint;
                if (path && endpoint) {
                    results[path] = ValidationHelpers.validateEndpoint(endpoint, query.data);
                }
            });
        }
    }

    // Compile errors and loading states
    const errors = [
        ...collectionQueries.filter(query => query.isError).map(query => query.error),
        ...secondLevelQueries.filter(query => query.isError).map(query => query.error)
    ];

    const isLoading = collectionQueries.some(query => query.isLoading) ||
        secondLevelQueries.some(query => query.isLoading);

    const isError = errors.length > 0;

    return {results, isLoading, errors, isError};
}

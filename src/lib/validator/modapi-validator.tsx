import {useMemo} from 'react';
import {QueryObserverResult, useQueries} from "@tanstack/react-query";
import {ModAPIEndpoint} from "@/lib/modapi-parser";
import {APITestResult, APIUtils, EndpointValidationResult} from '../api-fetcher';
import {validateEndpoint} from "@/lib/validator/valator-checker";

export function useCollectionAPIValidator({
                                              endpoints,
                                              baseUrl,
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
            queryFn: () => {
                if (endpoint.parameters.includes("query")) {
                    if (params === null || params === undefined) {
                        params = `?q=concept&query=concept`
                    } else if (params.includes("&")) {
                        params += `&q=concept&query=concept`
                    } else {
                        params += `q=concept&query=concept`
                    }
                }
                return APIUtils.fetchURL(endpoint.path, baseUrl, null, params)
            },
            select: (data: any) => APIUtils.processAPIResponse(data, endpoint.path, params, endpoint)
        }))
    });
}

export function useSecondLevelAPIValidator({
                                               endpoints,
                                               collectionQueries,
                                               baseUrl,
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

            if (!collectionResult) {
                return {
                    queryKey: ['api-test-calls-second-level', endpoint.path, baseUrl],
                    enabled: false
                };
            }

            let acronym = "";
            if (!collectionResult?.item) {
                acronym = 'FAKEACRONYM';
            } else {
                acronym = collectionResult.item.acronym || "FAKEACRONYM";
            }


            let resolvedPath = APIUtils.resolveEntityPath(endpoint.path, acronym);
            if (APIUtils.requireParentId(resolvedPath)) {
                return {
                    queryKey: ['api-test-calls-second-level', endpoint.path, baseUrl],
                    enabled: false
                };
            }

            return {
                queryKey: ['api-test-calls-second-level', resolvedPath, baseUrl],
                queryFn: () => APIUtils.fetchURL(resolvedPath, baseUrl, null, params),
                select: (data: any) => APIUtils.processAPIResponse(data, resolvedPath, params, endpoint)
            };
        })
    });
}

function matchUrlPattern(pattern: string, url: string): { match: boolean, groups: string[] } {
    // Remove leading slashes
    const cleanPattern = pattern.replace(/^\//, '');
    const cleanUrl = url.replace(/^\//, '');

    // Split into parts
    const patternParts = cleanPattern.split('/');
    const urlParts = cleanUrl.split('/');

    // Store matched variable values
    const groups: string[] = [];

    // URL can't be longer than pattern
    if (urlParts.length > patternParts.length) return {match: false, groups: []};

    // Check all URL parts against pattern
    for (let i = 0; i < urlParts.length; i++) {
        if (patternParts[i].match(/^\{.+\}$/)) {
            // Variable part - store the value
            groups.push(urlParts[i]);
        } else if (patternParts[i] !== urlParts[i]) {
            // Non-variable part must match exactly
            return {match: false, groups: []};
        }
    }

    // Check if remaining pattern parts are all variables
    for (let i = urlParts.length; i < patternParts.length; i++) {
        if (!patternParts[i].match(/^\{.+\}$/)) {
            return {match: false, groups: []};
        }
    }

    return {match: true, groups};
}


export function useThirdLevelAPIValidator({
                                              endpoints,
                                              collectionQueries,
                                              baseUrl,
                                              params
                                          }: any): QueryObserverResult<APITestResult<any>>[] {
    const thirdLevelEndpoints = useMemo(() =>
            (endpoints || []).filter((endpoint: any) => APIUtils.requireTwoParentId(endpoint.path)),
        [endpoints]
    );

    return useQueries({
        queries: thirdLevelEndpoints.map((endpoint: any) => {
            const collectionResult = collectionQueries
                .map((query: any) => query.data)
                .filter((result: any) => result && result.path !== '/')
                .find((result: any) => {
                        const match = matchUrlPattern(endpoint.path, result.path);
                        let acronym = null
                        let resolvedPath = endpoint.path;
                        if (match.match) {
                            acronym = match.groups[0];
                            resolvedPath = APIUtils.resolveEntityPath(endpoint.path, acronym);
                        }
                        return resolvedPath.startsWith(result.path)
                    }
                );

            if(!collectionResult) {
                return {
                    queryKey: ['api-test-calls-third-level', endpoint.path, baseUrl],
                    enabled: false
                };
            }
            let id =  "";

            if (!collectionResult?.item) {
                id = 'fakeid';
            } else {
                id = collectionResult.item["@id"] || "fakeid";
            }

            if (id.startsWith(baseUrl)) {
                id = id.split('/').pop() ?? '';
            } else {
                id = encodeURIComponent(id)
            }

            const match = matchUrlPattern(endpoint.path, collectionResult.path);
            const acronym = match.groups[0];
            let resolvedPath = APIUtils.resolveEntityPath(endpoint.path, acronym);
            resolvedPath = APIUtils.resolveEntityPath(resolvedPath, id);

            if (APIUtils.requireParentId(resolvedPath)) {
                return {
                    queryKey: ['api-test-calls-third-level', endpoint.path, baseUrl],
                    enabled: false
                };
            }

            return {
                queryKey: ['api-test-calls-third-level', endpoint.path, baseUrl],
                queryFn: () => APIUtils.fetchURL(resolvedPath, baseUrl, null, params),
                select: (data: any) => APIUtils.processAPIResponse(data, resolvedPath, params, endpoint)
            };
        })
    });
}

export function useModAPIValidator(
    endpoints: ModAPIEndpoint[] | null,
    baseUrl: string,
    params: string | null | undefined,
) {

    const collectionQueries = useCollectionAPIValidator({endpoints, baseUrl, params});
    const firstLevelQueriesLoading = collectionQueries.some(query => query.isLoading)

    const secondLevelQueries = useSecondLevelAPIValidator({endpoints, collectionQueries, baseUrl, params});
    const secondLevelQueriesLoading = secondLevelQueries.some(query => query.isLoading);

    const thirdLevelQueries = useThirdLevelAPIValidator({
        endpoints,
        collectionQueries: secondLevelQueries,
        baseUrl,
        params
    });
    const thirdLevelQueriesLoading = thirdLevelQueries.some(query => query.isLoading);

    const isLoading = firstLevelQueriesLoading || secondLevelQueriesLoading || thirdLevelQueriesLoading;


    // Combine and process results
    const results: Record<string, EndpointValidationResult> = {};

    if (endpoints && baseUrl) {

        if (!firstLevelQueriesLoading) {
            collectionQueries.forEach((query) => {
                const path = query.data?.path
                const endpoint = endpoints.find((endpoint) => path && endpoint.path.startsWith(path));
                if (!endpoint) {
                    console.log("Endpoint not found for path: ", path)
                    return
                }
                delete results[endpoint.path];
                results[endpoint.path] = validateEndpoint(endpoint, query.data);
            });
        }

        if (!secondLevelQueriesLoading) {
            secondLevelQueries.forEach(query => {
                const path = query.data?.path;
                const endpoint = query.data?.endpoint;

                if(endpoint?.path)
                    delete results[endpoint.path];

                if (path && endpoint) {
                    results[path] = validateEndpoint(endpoint, query.data);
                }
            });
        }

        if (!thirdLevelQueriesLoading) {
            thirdLevelQueries.forEach(query => {
                const path = query.data?.path;
                const endpoint = query.data?.endpoint;
                if(endpoint?.path)
                    delete results[endpoint.path];

                if (path && endpoint) {
                    results[path] = validateEndpoint(endpoint, query.data);
                }
            });
        }

        if (!isLoading) {
            endpoints.forEach(endpoint => {
                const endpointTested = Object.values(results).some((result) => result.path === endpoint.path);
                if (!endpointTested) {
                    results[endpoint.path] = validateEndpoint(endpoint, undefined);
                }
            })
        }
    }

    // Compile errors and loading states
    const errors = [
        ...collectionQueries.filter(query => query.isError).map(query => query.error),
        ...secondLevelQueries.filter(query => query.isError).map(query => query.error)
    ];


    const isError = errors.length > 0;

    return {results, isLoading, errors, isError};
}

'use client';
import React, {useEffect, useState} from 'react';
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card';
import {Input} from '@/components/ui/input';
import {Button} from '@/components/ui/button';
import {Alert} from '@/components/ui/alert';
import {Badge} from '@/components/ui/badge';
import {ModAPIEndpoint, modApiParser} from "@/lib/modapi-parser";
import {useQuery, useQueryClient} from "@tanstack/react-query";
import {ModAPIDescription} from "@/components/ModAPIDescription";
import ModApiEndpointsChecks from "@/components/ModApiEndpointsCheck";
import {ModelPopup} from "@/app/explore/components/model-popup";
import {EndpointFilters} from "@/lib/interfaces";
import {AppConfig} from "@/lib/config";
import {PageTitle} from "@/components/page-title";


export const DEFAULT_URL = AppConfig.openapiUrl
const methodColors = {
    GET: 'bg-blue-500',
    POST: 'bg-green-500',
    PUT: 'bg-yellow-500',
    DELETE: 'bg-red-500',
    PATCH: 'bg-purple-500'
};

const RECORDS_ENDPOINTS = ['record']
const LABELS_ENDPOINTS = ['label']
const SEARCH_ENDPOINTS = ['search']
const DATA_ENDPOINTS = ['class', 'concept', 'resource', 'schemes', 'collection', 'property']
export const FILTERS = {
    records: RECORDS_ENDPOINTS,
    labels: LABELS_ENDPOINTS,
    search: SEARCH_ENDPOINTS,
    data: DATA_ENDPOINTS,
}

const fetchModAPI = async (url: string) => {
    if (!url) return null;
    return await modApiParser(url);
};

export const useModAPI = (url: string) => {
    return useQuery({
        queryKey: ['modAPI', url],
        queryFn: () => fetchModAPI(url),
        enabled: !!url,
        retry: 1,
    });
}

export const useModEndpointsFilter = (endpoints: ModAPIEndpoint[] | null | undefined, defaultFilters?: EndpointFilters | null): ModAPIEndpointFilter => {
    const [searchQuery, setSearchQuery] = useState('');
    let filteredEndpoints = endpoints || [];
    const [filters, setFilters] = useState(defaultFilters || {
        records: false,
        labels: false,
        search: false,
        data: false,
    });

    if (endpoints) {
        filteredEndpoints = endpoints.filter((endpoint: any) =>
            Object.entries(filters).every(([filterKey, isEnabled]) =>
                isEnabled || !FILTERS[filterKey].some((path: any) => endpoint.path.includes(path))
            )
        )
    }

    if (searchQuery) {
        filteredEndpoints = filteredEndpoints.filter((endpoint: any) =>
            endpoint.path.includes(searchQuery.toLowerCase())
        )
    }

    return {filteredEndpoints, filters, setFilters, searchQuery, setSearchQuery};
}

export const refreshModAPI = (url: string, queryClient: any) => {
    if (url) {
        queryClient.invalidateQueries({queryKey: ['modAPI', url]});
        localStorage.setItem('yamlUrl', url);
    }
};

export const useModApiFetcher = () => {
    const queryClient = useQueryClient();
    const [yamlUrl, setYamlUrl] = useState(DEFAULT_URL);
    const [fetchYamlUrl, setFetchYamlUrl] = useState('');
    const {
        data: modAPI,
        isLoading,
        isError,
        error
    } = useModAPI(fetchYamlUrl);

    // Initialize yamlUrl from localStorage
    useEffect(() => {
        setYamlUrl(DEFAULT_URL);
        setFetchYamlUrl(DEFAULT_URL);
    }, []);

    const updateYamlUrl = (url: string) => {
        setFetchYamlUrl(url);
        refreshModAPI(url, queryClient);
    }

    return {
        modAPI,
        isLoading,
        isError,
        error,
        yamlUrl,
        setYamlUrl,
        updateYamlUrl
    }
}
const EndpointExplorer = () => {
        const {
            modAPI,
            isLoading,
            isError,
            error,
            yamlUrl,
            setYamlUrl,
            updateYamlUrl,
        } = useModApiFetcher()

        const {
            filteredEndpoints,
            filters,
            setFilters,
            searchQuery,
            setSearchQuery
        } = useModEndpointsFilter(modAPI?.endpoints);

        // Initialize yamlUrl from localStorage
        useEffect(() => {
            const savedFilters = localStorage.getItem('filters');
            if (savedFilters && setFilters) {
                setFilters(JSON.parse(savedFilters));
            }
        }, []);

        // Save filters to localStorage when they change
        useEffect(() => {
            localStorage.setItem('filters', JSON.stringify(filters));
        }, [filters]);

        return (
            <Card className="container mx-auto my-2">
                <CardHeader>
                    <CardTitle>
                        <PageTitle>
                            MOD API validator
                        </PageTitle>
                    </CardTitle>

                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="flex gap-4">
                        <Input
                            placeholder="Enter OpenAPI YAML URL"
                            value={yamlUrl}
                            onChange={(e) => setYamlUrl(e.target.value)}
                            className="flex-1"
                        />
                        <Button
                            onClick={() => updateYamlUrl(yamlUrl)}
                            disabled={!yamlUrl || isLoading}>
                            {isLoading ? 'Loading...' : 'Fetch'}
                        </Button>
                    </div>
                    <div>
                        <ModApiEndpointsChecks filters={filters} setFilters={setFilters}/>
                    </div>

                    {isError && (
                        <Alert variant="destructive">
                            {error?.message}
                        </Alert>
                    )}

                    <ModAPIDescription modAPI={modAPI}/>

                    <Input
                        type="search"
                        placeholder="Search paths..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full"
                    />
                    <div className="gap-3 grid grid-cols-2">
                        {filteredEndpoints && filteredEndpoints.map((endpoint: ModAPIEndpoint, index: number) => (
                            <div
                                key={index}
                                className="p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                            >
                                <div className="flex items-center gap-3 mb-2">
                                    <Badge
                                        className={`${methodColors[endpoint.method]} text-white`}
                                    >
                                        {endpoint.method}
                                    </Badge>
                                    <code className="text-sm font-mono">
                                        {endpoint.path}
                                    </code>
                                </div>
                                <div className="text-sm text-gray-600 ml-1">
                                    <span> Returns: </span>
                                    <code className="text-purple-600">
                                        <ModelPopup title={endpoint.responseType.title}
                                                    label={endpoint.responseType.label}
                                                    content={endpoint.responseType}/>
                                    </code>
                                </div>
                                <div className="flex align-middle items-center gap-1 text-sm text-gray-600 ml-1">
                                    <span> Params: </span>
                                    {endpoint.parameters.map((param, index) => (
                                        <code key={index} className={'border-spacing-1 border rounded p-0.5 bg-purple-50'}>
                                            {param}
                                        </code>
                                    ))}
                                </div>

                                {endpoint.summary && (
                                    <div className="text-sm text-gray-500 mt-1 ml-1">
                                        {endpoint.summary}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        );

    }
;

export default EndpointExplorer;

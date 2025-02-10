'use client';
import React, {use, useEffect, useState} from 'react';
import {Card, CardHeader, CardTitle, CardContent} from '@/components/ui/card';
import {Input} from '@/components/ui/input';
import {Button} from '@/components/ui/button';
import {Alert} from '@/components/ui/alert';
import {Badge} from '@/components/ui/badge';
import {ModAPI, ModAPIEndpoint, modApiParser} from "@/modapi-parser/modapi-parser";
import {ModelPopup} from "@/app/model-popup";


const DEFAULT_URL = 'https://raw.githubusercontent.com/FAIR-IMPACT/MOD-API/main/mod_api/static/mod_api/openAPI.yaml'
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
const FILTERS = {
    records: RECORDS_ENDPOINTS,
    labels: LABELS_ENDPOINTS,
    search: SEARCH_ENDPOINTS,
    data: DATA_ENDPOINTS,
}

const EndpointExplorer = () => {
        const [yamlUrl, setYamlUrl] = useState(DEFAULT_URL);
        const [endpoints, setEndpoints] = useState<Array<ModAPIEndpoint>>([]);
        const [loading, setLoading] = useState(false);
        const [error, setError] = useState(null);
        const [info, setInfo] = useState(null);
        const [filters, setFilters] = useState({
            records: false,
            labels: false,
            search: true,
            data: true,
        })

        const formatEndpointParams = (parameters = []) => {
            return parameters
        };


        useEffect(() => {
            setFilters(JSON.parse(localStorage.getItem('filters')) || filters)
            localStorage.setItem('yamlUrl', yamlUrl);
        }, []);

        const fetchAndParseYAML = async () => {
            setLoading(true);
            setError(null);
            const modAPI: ModAPI = await modApiParser(yamlUrl);
            try {
                setInfo(modAPI.info);
                setEndpoints(modAPI.endpoints);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        const filterEndpoints = (endpoints) => {
            return endpoints.filter(endpoint =>
                Object.entries(filters).every(([filterKey, isEnabled]) =>
                    isEnabled || !FILTERS[filterKey].some(path => endpoint.path.includes(path))
                )
            );
        };

        useEffect(() => {
            if (localStorage.getItem('yamlUrl') !== null) {
                setYamlUrl(localStorage.getItem('yamlUrl'));
                fetchAndParseYAML();
            }
        }, []);

        useEffect(() => {
            localStorage.setItem('filters', JSON.stringify(filters))
        }, [filters]);

        return (
            <Card className="w-full">
                <CardHeader>
                    <CardTitle>MOD API validator</CardTitle>
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
                            onClick={fetchAndParseYAML}
                            disabled={!yamlUrl || loading}
                        >
                            {loading ? 'Loading...' : 'Fetch'}
                        </Button>
                    </div>
                    <div className={'flex gap-x-6'}>
                        {Object.entries(filters).map(([key, value]) => (
                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    id={"show" + key}
                                    checked={value}
                                    onChange={() => setFilters({...filters, [key]: !value})}
                                />
                                <label htmlFor={"show" + key}>Show {key} endpoints</label>
                            </div>
                        ))}
                        <div className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                id={"showMetadata"}
                                checked={true}
                                disabled={true}
                            />
                            <label htmlFor={"showMetadata"}>Show metadata endpoints</label>
                        </div>
                    </div>

                    {error && (
                        <Alert variant="destructive">
                            {error}
                        </Alert>
                    )}

                    {info && (
                        <div className="space-y-2">
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
                                    className="font-semibold">Total endpoints:</span> {endpoints.length} (Showing {filterEndpoints(endpoints).length})
                            </div>
                        </div>
                    )}

                    <div className="gap-3 grid grid-cols-2">
                        {filterEndpoints(endpoints).map((endpoint, index) => (
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
                                        <code key={index} className={'border-spacing-1 border rounded p-0.5 bg-purple-50'} >
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

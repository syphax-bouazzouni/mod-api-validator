import {ModAPIEndpoint, ModAPIModel, ModAPIResponseType} from "@/lib/modapi-parser";

export interface APITestResult<T> {
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

export interface EndpointValidationChecks {
    exists: boolean;
    goodType: boolean;
    jsonLD: boolean;
    pagination: boolean;
    requiredProperties: boolean;
}

export interface EndpointValidationResult {
    checks: EndpointValidationChecks;
    properties: PropertiesResult;
    parameters: ParametersResult;
    expectedModel: ModAPIModel;
    expectedType: string | null;
    responseType: ModAPIResponseType;
    foundType: string | null;
    originalResponse: any;
    testItem: any;
    path: string;
    status: number;
    scores: Record<string, number>;
    score: number;
    maxScore: number;
}

export class APIUtils {
    static requireParentId(path: string): boolean {
        return path.includes('{') && path.includes('}');
    }


    static requireTwoParentId(path: string): boolean {
        return (path.match(/{/g) || []).length >= 2 && (path.match(/}/g) || []).length >= 2;
    }

    static resolveEntityPath(path: string, id?: string): string {
        return path.replace(/{[^}]+}/, id || '');
    }

    static extractFirstResult(data: any): any {
        if (data['@graph']) return data['@graph'][0];
        if (data['collection']) return data['collection'][0];
        if (data['member']) return data['member'][0];
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

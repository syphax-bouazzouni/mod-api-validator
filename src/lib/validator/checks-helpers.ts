import {APITestResult, ParametersResult, PropertiesResult} from "@/lib/api-fetcher";
import {ModAPIEndpoint} from "@/lib/modapi-parser";
export class ChecksHelpers {
    static checkRequiredProperties(properties: PropertiesResult): boolean {
        const foundRequiredProperties = properties.foundRequiredProperties;
        const requiredProperties = properties.requiredProperties;
        return (foundRequiredProperties === requiredProperties) && (foundRequiredProperties > 0) ||
            (requiredProperties == 0 || requiredProperties == undefined || requiredProperties == null);
    }

    static checkEndpointProperties(endpoint: ModAPIEndpoint, response: any): PropertiesResult {
        if (!endpoint.responseType.model?.properties || !response) {
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

    static checkEndpointPagination(response: APITestResult<any> | undefined): boolean {
        const keyToInclude = ['member', "@type", "totalItems", "view"];
        const isList = response?.endpoint.responseType.model?.list
        return !isList || keyToInclude.every(key => response?.originalResponse?.[key]);
    }

    static checkJSONLD(response: any, item: any): boolean {

        let output = response && response["@context"] && response["@id"] && response["@type"];
        const parentContext = response && response["@context"];
        output = output && (item === null ||
            item["@id"] && item["@type"] && (item["@context"] || parentContext));
        return output
    }

    static checkGoodType(foundType:any, expectedType: string | null): boolean {
        return expectedType === undefined || expectedType == null || expectedType == '' || foundType?.includes(expectedType);
    }

    static checkStatus(response: APITestResult<any> | undefined): boolean {
        return response !== null && response !== undefined
            && (response.status === 200);
    }

}


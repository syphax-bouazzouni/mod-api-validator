import {APITestResult, EndpointValidationChecks, EndpointValidationResult,} from "@/lib/api-fetcher";
import {ModAPIEndpoint} from "../modapi-parser";
import {ChecksHelpers} from "@/lib/validator/checks-helpers";
import {ScoreHelpers} from "./score-helpers";


export function validateEndpoint(
    endpoint: ModAPIEndpoint,
    response: APITestResult<any> | undefined
): EndpointValidationResult {
    const itemToCheck = response?.item;
    const properties = ChecksHelpers.checkEndpointProperties(endpoint, itemToCheck);
    const expectedType = endpoint.responseType.type ? endpoint.responseType.type.replace("mod:", "").trim() : "";
    let foundType = itemToCheck?.['@type'] || null;

    if (!(foundType instanceof Array) && foundType) {
        foundType = [foundType];
    }

    foundType = foundType?.map((type: string) => {
        type = type.toString().split("/").pop() || type;
        type = type.replace("mod#", "").trim();
        type = type.replace("mod:", "").trim();
        return type;
    })

    let exists = ChecksHelpers.checkStatus(response);
    let jsonLD = exists &&  ChecksHelpers.checkJSONLD(response?.originalResponse, itemToCheck);
    const checks: EndpointValidationChecks = {
        exists: exists,
        jsonLD: jsonLD,
        goodType: exists && ChecksHelpers.checkGoodType(foundType, expectedType),
        pagination: exists && ChecksHelpers.checkEndpointPagination(response),
        requiredProperties: exists && ChecksHelpers.checkRequiredProperties(properties)
    }

    return {
        checks,
        properties: properties,
        parameters: ChecksHelpers.checkEndpointParameters(endpoint),
        originalResponse: response?.originalResponse || {},
        responseType: endpoint.responseType || {},
        foundType: foundType?.join(", ") || null,
        expectedType: endpoint.responseType.type ? endpoint.responseType.type.replace("mod:", "").trim() : "",
        expectedModel: endpoint.responseType.model || {},
        testItem: itemToCheck,
        path: endpoint.path,
        status: response?.status ?? 0,
        scores: ScoreHelpers.getScores(checks),
        score: ScoreHelpers.calculateScore(checks),
        maxScore: ScoreHelpers.maxScore(checks)
    };
}

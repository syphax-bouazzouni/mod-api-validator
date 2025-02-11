import yaml from "js-yaml";
import {decodeGeneratedRanges} from "@jridgewell/sourcemap-codec";

export interface ModAPIModel {
    properties: Array<any>;
    title: string;
    description: string;
    key?: string;
    raw?: any;
    list: boolean;
}

export interface ModAPIResponseType {
    title: string;
    label: string;
    model: ModAPIModel;
}

export interface ModAPIEndpoint {
    path: string;
    method: string;
    summary: string;
    parameters: Array<any>;
    responseType: ModAPIResponseType;
}

export interface ModAPI {
    info: {
        title: string;
        version: string;
        description: string;
    } | null;
    models: Array<ModAPIModel>;
    endpoints: Array<ModAPIEndpoint>
}

export async function modApiParser(apiUrl: string) {
    const parser = new ModAPIParser();
    return parser.parse(apiUrl);
}

class ModAPIParser {

    modAPI: ModAPI = {info: null, endpoints: [], models: []};
    allResponses: { string: { title?: string; model: any; }; } | undefined;

    async parse(url: string) {
        const response = await fetch(url);
        const yamlText = await response.text();
        try {
            const spec = yaml.load(yamlText);
            this.parseInfo(spec);
            this.parseResponses(spec);
            this.parseEndpoints(spec);
        } catch (e){
            throw e
        }
        return this.modAPI;
    }

    parseInfo(spec: any) {
        this.modAPI.info = spec.info;
    }

    parseEndpoints(spec: any) {
        const parsedEndpoints = [];

        Object.entries(spec.paths || {}).forEach(([path, methods]) => {
            let parameters = methods.parameters?.map( x => x.$ref.split('/').pop()) || []
            Object.entries(methods).forEach(([method, details]) => {
                if (method === 'parameters') return;

                parsedEndpoints.push({
                    path,
                    method: method.toUpperCase(),
                    summary: details.summary || '',
                    parameters: parameters,
                    responseType: this.#getResponseType(details.responses)
                });
            });
        });

        this.modAPI.endpoints = parsedEndpoints;
    }

    parseResponses(spec: any) {
        this.allResponses = {};

        let responses = spec.components.responses;
        if (!responses) return;

        Object.entries(responses).forEach(([code, response]) => {
            console.log("parsing response", code)
            let [label, model] = this.#parseModels(code, response, spec.components.schemas)

            if (label) this.modAPI.models.push(model)

            this.allResponses[code] = {
                title: response.content['application/ld+json']?.schema?.title,
                label: label,
                model: model
            };

        });
    }

    #parseModels(code: any, response: any, schemas: any = {}): [string | null, ModAPIModel] {
        let ldResponse = response.content['application/ld+json']?.schema || {}
        let excludedRefs = ["#/components/schemas/Pagination", '#/components/schemas/Context']

        if (ldResponse.items) {
            let schema = schemas[ldResponse.items.$ref.split('/').pop()]
            return [response.title, this.#schemaToModelApi(code, schema, schemas, true)]
        }

        ldResponse = ldResponse?.allOf || []

        let model = ldResponse.filter((item: any) => item.$ref && !excludedRefs.includes(item.$ref) || item.items)[0]


        let list = false
        if (model) {
            if (model.type === 'array') {
                model = model.items
                list = true
            }

            let label = model.$ref.split('/').pop()
            model = schemas[label]

            let newModel = this.#schemaToModelApi(code, model, schemas, list)
            return [label, newModel]
        } else {
            ldResponse.kew = code
            return [null, ldResponse]
        }
    }

    #getResponseType(responses) {
        if (!responses) return 'void';

        const successResponse = responses['200'] || responses['201'];
        if (!successResponse) return 'void';

        const schema = successResponse;
        const type = schema.$ref.split('/').pop();
        return this.allResponses[type];
    }

    #schemaToModelApi(code: string, schema: any, schemas: any = {}, list = false): ModAPIModel {
        return {
            properties: this.#schemaToProperties(schema, schemas),
            title: schema.title,
            description: schema.description,
            raw: schema,
            key: code,
            list: list,
        }
    }

    #schemaToProperties(schema: any, schemas: any = {}): any {
        let allProperties = this.#fetchProperties(schema)
        console.log("All properties", allProperties, 'for', schema.title)

        let refProperties = this.#fetchRefsProperties(schema, schemas);
        console.log("Ref properties", refProperties, 'for', schema.title)

        Object.entries(refProperties).map(([ref, value]: [string, any]) => {
            if (value && Object.keys(value).length > 0) {
                if (value.$ref) {
                    let newRef = this.#schemaToProperties(schemas[value.$ref.split('/').pop()], schemas)
                    if (newRef && Object.keys(newRef).length > 0){
                        delete value['$ref']
                        value = {...value, ...newRef}
                    }
                }
                delete allProperties[ref]
                delete allProperties['$ref']
                allProperties = {...allProperties, ...value}
            }
        })

        return allProperties
    }

    #fetchRefsProperties(schema: any, schemas: any = {}) {
        let refsProperties = {}
        schema.allOf?.filter((item: any) => item.$ref || item.items).forEach((item: any) => {
            let ref = item.$ref.split('/').pop()
            let model = schemas[ref]
            if (model) {
                let newProperties = this.#fetchProperties(model)
                if (newProperties) {
                    refsProperties[ref] = newProperties
                }
            }
        })
        return refsProperties
    }

    #fetchProperties(schema: any) {
        if (schema.properties) {
            return schema.properties
        } else {
            let allProperties =  schema.allOf?.map((item: any) => item.properties || {$ref: item.$ref}).filter((item: any) => item != null) || []
            return Object.assign({}, ...allProperties)
        }
    }
}

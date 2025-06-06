import yaml from "js-yaml";

export interface ModAPIModel {
    properties: any;
    title: string;
    required: Array<string>;
    description: string;
    key?: string;
    raw?: any;
    list: boolean;
}

export interface ModAPIResponseType {
    title: string;
    type: string;
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
    allResponses: Record<string, ModAPIResponseType> | undefined;


    async parse(url: string) {
        const response = await fetch(url);
        const yamlText = await response.text();
        try {
            const spec = yaml.load(yamlText);
            this.parseInfo(spec);
            this.parseResponses(spec);
            this.parseEndpoints(spec);
        } catch (e) {
            throw e
        }
        return this.modAPI;
    }

    parseInfo(spec: any) {
        this.modAPI.info = spec.info;
    }

    parseEndpoints(spec: any) {
        const parsedEndpoints: any = [];

        Object.entries(spec.paths || {}).forEach(([path, methods]: [string, any]) => {
            let parameters = methods.parameters?.map((x: any) => x.$ref.split('/').pop()) || []
            Object.entries(methods).forEach(([method, details]: [string, any]) => {
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
        this.allResponses = {} as any;

        let responses = spec.components.responses;
        if (!responses) return;

        Object.entries(responses).forEach(([code, response]: [string, any]) => {
            let [label, model] = this.#parseModels(code, response, spec.components.schemas)

            if (label) this.modAPI.models.push(model)

            if (this.allResponses)
                this.allResponses[code] = {
                    title: response.content['application/ld+json']?.schema?.title,
                    type: label ?? '',
                    model: model,
                };
        });
    }

    #parseType(model: ModAPIModel): string {
        let type = model?.properties?.["@type"].items?.example
        return type
    }

    #parseModels(code: any, response: any, schemas: any = {}): [string | null, ModAPIModel] {
        let ldResponse = response.content['application/ld+json']?.schema || {}
        let excludedRefs = ["#/components/schemas/Pagination", '#/components/schemas/Context']


        if (ldResponse.items) {
            let schema = schemas[ldResponse.items.$ref.split('/').pop()]
            return [schema.title, this.#schemaToModelApi(code, schema, schemas, true)]
        }
        if (ldResponse?.properties?.member?.items) {
            let schemaUrl = ldResponse.properties.member.items.$ref
            let schemaId = schemaUrl.split('/').pop()
            let schema = schemas[schemaId]
            let model = this.#schemaToModelApi(code, schema, schemas, true)
            let type = this.#parseType(model)
            return [type || schemaId, model]
        }

        ldResponse = ldResponse?.allOf || []
        let model = null
        try {
            model = ldResponse.filter((item: any) => item.$ref && !excludedRefs.includes(item.$ref) || item.items)[0]
        } catch (e) {
        }


        let list = false
        if (model) {
            if (model.type === 'array') {
                model = model.items
                list = true
            }

            let label = model.$ref.split('/').pop()
            model = schemas[label]

            let newModel = this.#schemaToModelApi(code, model, schemas, list)
            let type = this.#parseType(newModel)
            return [type, newModel]
        } else {
            ldResponse.key = code
            return [null, ldResponse]
        }
    }

    #getResponseType(responses: any) {
        if (!responses) return 'void';

        const successResponse = responses['200'] || responses['201'];
        if (!successResponse) return 'void';

        const schema = successResponse;
        const type = schema.$ref.split('/').pop();
        return this.allResponses ? this.allResponses[type] : null;
    }

    #schemaToModelApi(code: string, schema: any, schemas: any = {}, list = false): ModAPIModel {
        return {
            properties: this.schemaToProperties(schema, schemas),
            required: this.schemaToRequired(schema, schemas),
            title: schema.title,
            description: schema.description,
            raw: schema,
            key: code,
            list: list,
        }
    }

    schemaToRequired(schema: any, schemas: Record<string, any> = {}): string[] {
        return this.processSchema<string[]>(
            schema,
            schemas,
            this.fetchRequired,
            this.fetchRefsRequired,
            (acc, items) => [...acc, ...items],
            []
        );
    }

    schemaToProperties(schema: any, schemas: Record<string, any> = {}): Record<string, any> {
        const result = this.processSchema<Record<string, any>>(
            schema,
            schemas,
            this.fetchProperties,
            this.fetchRefsProperties,
            (acc, items) => {
                delete acc.$ref;
                return {...acc, ...items};
            },
            {}
        );


        return result;
    }

    private processSchema<T>(
        schema: any,
        schemas: Record<string, any>,
        directExtractor: (s: any) => T,
        refExtractor: (s: any, schemas: Record<string, any>) => Record<string, any>,
        merger: (accumulated: T, newItems: T) => T,
        initialValue: T
    ): T {
        let result = directExtractor.call(this, schema);
        const refItems = refExtractor.call(this, schema, schemas);

        for (const [ref, items] of Object.entries(refItems)) {
            if (!items || (Array.isArray(items) && items.length === 0) ||
                (!Array.isArray(items) && Object.keys(items).length === 0)) {
                continue;
            }

            if ('$ref' in items) {
                const refKey = this.getRefKey(items.$ref);
                const nestedItems = this.processSchema<T>(
                    schemas[refKey],
                    schemas,
                    directExtractor,
                    refExtractor,
                    merger,
                    initialValue
                );

                if ((Array.isArray(nestedItems) && nestedItems.length > 0) ||
                    (!Array.isArray(nestedItems) && Object.keys(nestedItems).length > 0)) {
                    if (Array.isArray(items)) {
                        const {$ref, ...restItems} = items as any;
                        result = merger(result, merger(restItems as T, nestedItems));
                    } else {
                        result = merger(result, nestedItems);
                    }
                }
            } else {
                result = merger(result, items);
            }
        }

        return result;
    }

    private fetchRefsProperties(schema: any, schemas: Record<string, any> = {}): Record<string, any> {
        return this.removePrefixedProperties(this.fetchRefsItems(schema, schemas, this.fetchProperties))
    }

    private fetchRefsRequired(schema: any, schemas: Record<string, any> = {}): Record<string, any> {
        return this.removePrefixedProperties(this.fetchRefsItems(schema, schemas, this.fetchRequired));
    }

    private fetchRefsItems<T>(
        schema: any,
        schemas: Record<string, any>,
        extractor: (s: any) => T
    ): Record<string, any> {
        const refsItems: Record<string, any> = {};

        schema.allOf?.filter((item: any) => item.$ref || item.items).forEach((item: any) => {
            if (item.$ref) {
                const refKey = this.getRefKey(item.$ref);
                const model = schemas[refKey];

                if (model) {
                    const extractedItems = extractor.call(this, model);
                    const isEmpty = Array.isArray(extractedItems)
                        ? extractedItems.length === 0
                        : Object.keys(extractedItems).length === 0;

                    if (!isEmpty) {
                        refsItems[refKey] = extractedItems;
                    }
                }
            }
        });


        return refsItems;
    }

    private removePrefixedProperties(properties: Record<string, any>): Record<string, any> {
        const removedProperties = {}
        Object.entries(properties).forEach(([key, value]: [string, any]) => {
            removedProperties[this.removePrixProperty(key)] = value
        })
        return removedProperties
    }

    private removePrixProperty(key: string): string {
        if (key === '@type' || key === '@context' || key == '@id') return key

        const [prefix, rest] = key.split(':')
        return rest
    }

    private fetchProperties(schema: any): Record<string, any> {
        if (schema.properties) {
            return schema.properties;
        }

        const allProperties = schema.allOf?.map((item: any) =>
            item.properties || (item.$ref ? {$ref: item.$ref} : null)
        ).filter((item: any) => item !== null) || [];

        return this.removePrefixedProperties(Object.assign({}, ...allProperties));
    }

    private fetchRequired(schema: any): string[] {
        let required = schema.required || [];

        schema.allOf?.forEach((item: any) => {
            if (item.required) {
                required = [...required, ...item.required];
            }
        });


        return required.map((key: string) => this.removePrixProperty(key));
    }

    private getRefKey(ref: string): string {
        return ref.split('/').pop() || '';
    }
}

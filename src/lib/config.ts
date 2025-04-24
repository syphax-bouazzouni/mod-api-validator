export interface ParticipantAPI {
    id: string,
    name?: string;
    baseURL: string;
    apikey?: string;
    params?: string;
}

type Configuration = {
    participants: ParticipantAPI[];
    openapiUrl: string;
    scores: Record<string, number>;
    paginationKeys: string[];
}
export const AppConfig: Configuration = {
    participants: [
        {id: 'finto', name: 'Finto (SKOSMOS)', baseURL: 'https://mod-api.dev.finto.fi' },
        {
            id: 'stageportal',
            name: 'OntoPortal staging',
            baseURL: 'https://data.stageportal.lirmm.fr',
            params: 'apikey=1de0a270-29c5-4dda-b043-7c3580628cd5&format=json',
        },
        {id: 'nvs', name: 'The NERC Vocabulary Server (NVS)', baseURL: 'https://vocab.nerc.ac.uk'},
        {id: 'tib', name: 'TIB (OLS)', baseURL: 'https://service.tib.eu/terminology/mod/api'},
        {
            id: 'showvoc',
            name: 'ShowVoc',
            baseURL: 'https://poseidon.art.uniroma2.it/semanticturkey/it.uniroma2.art.semanticturkey/st-metadata-registry-services/mod',
            params: 'format=jsonld'
        },
        {
            id: 'ts4nfdi',
            name: 'TS-NFDI API Gateway',
            // baseURL:'http://localhost:8080/api-gateway',
            baseURL: 'https://ts4nfdi-api-gateway.prod.km.k8s.zbmed.de/api-gateway',
            params: "format=jsonld&targetDbSchema=mod&showResponseConfiguration=false&database=ontoportal"
        }],
    openapiUrl: 'https://raw.githubusercontent.com/syphax-bouazzouni/MOD-API/main/mod_api/static/mod_api/openapi.yaml',
    scores: {
        exists: 20,
        requiredProperties: 30,
        goodType: 15,
        jsonLD: 10,
        pagination: 5
    }
    paginationKeys: ['member', "@type", "totalItems", "view"]
}
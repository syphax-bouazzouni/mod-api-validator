import {ModAPIEndpoint} from "@/lib/modapi-parser";

export interface EndpointFilters {
    records: boolean
    labels: boolean
    search: boolean
    data: boolean
}

export interface ModAPIEndpointFilter {
    filteredEndpoints: ModAPIEndpoint[];
    filters: Record<string, boolean>;
    setFilters: any;
    searchQuery: string;
    setSearchQuery: any;
}

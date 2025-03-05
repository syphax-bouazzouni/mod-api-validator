'use client';
import {useState} from "react";
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {ModAPIDescription} from "@/components/ModAPIDescription";
import {Label} from "@/components/ui/label";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select";
import {ModAPIValidatorResults} from "@/app/validator/components/ModAPIValidatorResults";
import {useModApiFetcher} from "@/app/explore/components/openapi-explorer";

export default function ModAPIValidator() {
    const [baseURL, setBaseURL] = useState('');
    const [apikey, setApikey] = useState('');
    const [fetchBaseURL, setFetchBaseURL] = useState("");
    const [option, setOption] = useState({});
    const {
        modAPI,
        isLoading,
        isError,
        error,
        yamlUrl,
        setYamlUrl,
        updateYamlUrl,
    } = useModApiFetcher()

    const options = [
        {name: 'OntoPortal staging', baseURL: 'https://data.stageportal.lirmm.fr', apikey: '1de0a270-29c5-4dda-b043-7c3580628cd5'},
        {name: 'The NERC Vocabulary Server (NVS)', baseURL: 'https://vocab.nerc.ac.uk'},
        {name: 'TS-NFDI API Gateway', baseURL: 'https://ts4nfdi-api-gateway.prod.km.k8s.zbmed.de/api-gateway'},
    ]

    if (isLoading) {
        return <div className={'flex w-screen h-screen items-center justify-center'}>Loading MOD API
            from {yamlUrl}...</div>
    }
    if (isError) {
        return <div className={'flex w-screen h-screen items-center justify-center'}>Error loading MOD API
            from {yamlUrl}: {error?.message}</div>
    }

    const updateBaseUrl = (baseUrl: string, apikey: string | undefined) => {
        setFetchBaseURL('')
        setApikey(apikey || '')
        setBaseURL(baseUrl)
    }

    const updateOption = (option: any) => {
        setOption(option)
        updateBaseUrl(option.baseURL, option.apikey)
    }


    return (<>
            <Card className="container mx-auto my-2">
                <CardHeader>
                    <CardTitle>MOD API validator</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className={'space-y-2'}>
                        <div>
                            <Label>OpenAPI yaml URL</Label>
                            <Input
                                placeholder="Enter OpenAPI YAML URL"
                                value={yamlUrl}
                                onChange={(e) => setYamlUrl(e.target.value)}
                            />
                        </div>
                        <ModAPIDescription modAPI={modAPI}/>
                    </div>
                    <div className="space-y-4">
                        <div className="w-full">
                            <hr className={'divide-accent block my-5'}/>
                            <div className={'space-y-2 m-2'}>
                                <div>
                                    <Label>Select a base URL</Label>
                                    <Select onValueChange={(value) => updateOption(options[parseInt(value)])}>
                                        <SelectTrigger className="w-full">
                                            <SelectValue placeholder="Select MOD API call participant"/>
                                        </SelectTrigger>
                                        <SelectContent>
                                            {options.map((option, index) => (
                                                <SelectItem key={index}
                                                            value={index.toString()}>{option.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                {Object.keys(option).length > 0 && <div>
                                    <div>
                                        <Label>Base API URL</Label>
                                        <Input
                                            placeholder="Enter Base path URL of you API to validate"
                                            value={baseURL}
                                            onChange={(e) => updateBaseUrl(e.target.value, apikey)}
                                        />
                                    </div>
                                    {option.apikey &&  <div>
                                        <Label>API key</Label>
                                        <Input
                                            placeholder="Enter API key"
                                            value={apikey}
                                            onChange={(e) => setApikey(e.target.value)}
                                            className="w-1/2"/>
                                    </div>}
                                </div>
                                }
                            </div>
                            <Button className={'w-full'} onClick={() => setFetchBaseURL(baseURL)}
                                    disabled={Object.keys(option).length==0 || !baseURL || isLoading}>
                                Validate
                            </Button>
                        </div>
                        <div>
                            <ModAPIValidatorResults model={modAPI} baseUrl={fetchBaseURL} apikey={apikey}/>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </>
    )
}
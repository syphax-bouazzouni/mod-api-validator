'use client';
import {Suspense, useEffect, useState} from "react";
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {ModAPIDescription} from "@/components/ModAPIDescription";
import {Label} from "@/components/ui/label";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select";
import {Loading, ModAPIValidatorResults} from "@/app/validator/components/ModAPIValidatorResults";
import {useModApiFetcher} from "@/app/explore/components/openapi-explorer";
import {AppConfig, ParticipantAPI} from "@/lib/config";
import {useSearchParams} from "next/navigation";
import {PageTitle} from "@/components/page-title";

function Validator() {
    const options: ParticipantAPI[] = AppConfig.participants
    const searchParams = useSearchParams();
    const [baseURL, setBaseURL] = useState('');
    const [params, setParams] = useState('');
    const [fetchBaseURL, setFetchBaseURL] = useState("");
    const [option, setOption] = useState<ParticipantAPI>({} as ParticipantAPI);
    const {
        modAPI,
        isLoading,
        isError,
        error,
        yamlUrl,
        setYamlUrl,
    } = useModApiFetcher()

    const updateBaseUrl = (option: ParticipantAPI) => {
        const {baseURL, params} = option

        setFetchBaseURL('')
        setBaseURL(baseURL)
        setParams(params ?? '')
    }

    const updateOption = (option: ParticipantAPI) => {
        setOption(option)
        updateBaseUrl(option)
    }

    useEffect(() => {
        const participantId = searchParams.get("participant");
        const participant = options.find((p) => p.id === participantId);
        if (participant) {
            selectOption(participant.baseURL)
        }
    }, []);

    if (isLoading) {
        return <div className={'flex w-screen h-screen items-center justify-center'}>Loading MOD API
            from {yamlUrl}...</div>
    }
    if (isError) {
        return <div className={'flex w-screen h-screen items-center justify-center'}>Error loading MOD API
            from {yamlUrl}: {error?.message}</div>
    }

    const selectOption = (value: string) => {
        const selectedOption = options.find((option) => option.baseURL === value);
        if (selectedOption) {
            updateOption(selectedOption);
            setFetchBaseURL(selectedOption.baseURL)
        }
    }

    return <Card className="container mx-auto my-2">
        <CardHeader>
            <CardTitle>
                <PageTitle>
                    MOD API validator
                </PageTitle>
            </CardTitle>
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
                            <Select onValueChange={selectOption} value={baseURL}>
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Select MOD API call participant"/>
                                </SelectTrigger>
                                <SelectContent>
                                    {options.map((option, index) => (
                                        <SelectItem key={index}
                                                    value={option.baseURL}>{option.name}</SelectItem>
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
                                    onChange={(e) => updateBaseUrl({baseURL: e.target.value, params: params})}
                                />
                            </div>
                            {option.params && <div>
                                <Label>Additional parameters</Label>
                                <Input
                                    placeholder="Enter additional parameters"
                                    value={params}
                                    onChange={(e) => setParams(e.target.value)}
                                    className="w-1/2"/>
                            </div>}
                        </div>}
                    </div>
                    <Button className={'w-full'} onClick={() => setFetchBaseURL(baseURL)}
                            disabled={Object.keys(option).length == 0 || !baseURL || isLoading}>
                        Validate
                    </Button>
                </div>
                <div>
                    <ModAPIValidatorResults model={modAPI} baseUrl={fetchBaseURL} params={params}/>
                </div>
            </div>
        </CardContent>
    </Card>

}

export default function ModAPIValidator() {
    return <Suspense fallback={<Loading/>}>
        <Validator/>
    </Suspense>
}


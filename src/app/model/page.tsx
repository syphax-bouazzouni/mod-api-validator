'use client';

import {ModAPI, modApiParser} from "@/modapi-parser/modapi-parser";
import React, {useEffect, useState} from "react";
import {Input} from "@/components/ui/input";
import {Button} from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";
import {JsonViewer} from '@textea/json-viewer'


export default function ModelPage() {
    const [yamlUrl, setYamlUrl] = useState('');
    const [apiParsed, setApiParsed] = useState<ModAPI | null>(null);
    const [selectedModel, setSelectedModel] = useState<Array<any>>([]);

    const fetchAndParseYAML = async () => {
        const modAPI: ModAPI = await modApiParser(yamlUrl);
        setApiParsed(modAPI);
        setSelectedModel(modAPI.models)
    };

    const updateSelectedModel = (value: string) => {
        setSelectedModel(apiParsed?.models.filter((x) => x.key == apiParsed?.models[value].key) || [])
    }

    useEffect(() => {
        if (localStorage.getItem('yamlUrl') !== null) {
            setYamlUrl(localStorage.getItem('yamlUrl'));
            fetchAndParseYAML();
        }

    }, []);

    return (
        <div className={'p-4'}>
            <div className="flex gap-4">
                <Input
                    placeholder="Enter OpenAPI YAML URL"
                    value={yamlUrl}
                    onChange={(e) => setYamlUrl(e.target.value)}
                    className="flex-1"
                />
                <Button
                    onClick={fetchAndParseYAML}
                >
                    Fetch
                </Button>
            </div>
            <div>
                <Select onValueChange={updateSelectedModel}>
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Select a model"/>
                    </SelectTrigger>
                    <SelectContent>
                        <SelectGroup>
                            <SelectLabel>Models</SelectLabel>
                            {apiParsed?.models && Object.entries(apiParsed.models).map(([key, model]) => (
                                <SelectItem key={key} value={key}>{model.title || key}</SelectItem>))
                            }
                        </SelectGroup>
                    </SelectContent>
                </Select>
            </div>
            <div>
                {apiParsed?.models && <h1>Models found: {Object.keys(apiParsed.models).length}</h1>}
                {selectedModel && Object.entries(selectedModel).map(([key, model]) => (
                    <div key={key}>
                        <h2>{model.title}</h2>
                        <p>{model.description}</p>
                        <h3>Properties</h3>
                        <JsonViewer value={model.properties}/>

                    </div>
                ))}
            </div>
        </div>
    );
}

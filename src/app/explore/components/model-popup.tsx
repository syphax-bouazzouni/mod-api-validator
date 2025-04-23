'use client'
import {
    Dialog,
    DialogContent, DialogHeader,
    DialogTitle,
    DialogTrigger
} from "@/components/ui/dialog";
import {MessageCircleWarning} from "lucide-react";
import {cn} from "@/lib/utils";
import {ScrollArea} from "@/components/ui/scroll-area";
import {ModAPIResponseType} from "@/lib/modapi-parser";
import React, {useState} from "react";
import {Input} from "@/components/ui/input";
import {Tabs, TabsContent, TabsList, TabsTrigger} from "@/components/ui/tabs";
import JSONViewer from "@/components/JSONViewer";


const FAIR_MANDATORY = [
    '@id', '@type',
    'title', 'acronym', 'versionIRI', 'identifier', 'hasRepresentationLanguage', 'hasSyntax', 'type',
    'accessRights', 'license', 'rightsHolder', 'description', 'landingPage', 'keyword', 'created',
    'modified', 'contactPoint', 'creator', 'subject', 'accessURL'
]


function RequiredAsterisk({required}: any) {
    return required ? <span className="text-red-500">*</span> : null
}

function wrapInArray(string: string, list: boolean) {
    if (list) {
        return `Array(${string || ''})`
    }
    return string
}

function isRequired(key: string, requiredProps: string[]) {
    if (requiredProps && requiredProps.length > 0) {
        return requiredProps.includes(key)
    }
    return false
}

const getRequiredCount = (properties: any, requiredProps: string[], showOnlyFAIR: boolean) => {
    return Object.keys(properties).filter((key) => isRequired(key, requiredProps) && (FAIR_MANDATORY.includes(key) || !showOnlyFAIR)).length
}

const ListProperties = ({label, content, showOptional, showOnlyFAIR, searchQuery}: any) => {
    const props = filteredProps(label, content, searchQuery, showOptional, showOnlyFAIR)

    return <ul className="divide-y divide-border">
        {Object.entries(props).map(([key, prop]: [string, any]) => (
            <li key={key} className="py-2">
                <div className="flex flex-wrap gap-2">
                            <span className="font-medium">{prop.title} <RequiredAsterisk key={key}
                                                                                         required={isRequired(key, content.model.required)}/></span>
                    <span className="text-muted-foreground">({key})</span>
                    <span className="text-muted-foreground">—</span>
                    <span className="text-muted-foreground">{prop.description}</span>
                </div>
            </li>
        ))}
    </ul>
}


const filteredProps = (label: any,
                       content: ModAPIResponseType,
                       searchQuery: string,
                       showOptional: boolean, showOnlyFAIR: boolean) => {

    if (!content.model.properties) {
        return {}
    }

    let outProps = content.model.properties;
    let filterKey = null;

    if (label === 'modSemanticArtefact') {
        filterKey = 'artefact';
    } else if (label === 'modSemanticArtefactCatalog') {
        filterKey = 'catalog';
    } else if (label === 'modSemanticArtefactDistribution') {
        filterKey = 'distribution';
    }

    if (filterKey) {
        outProps = Object.fromEntries(
            Object.entries(content.model.properties)
                .filter(([key]) =>
                    showOptional ||
                    ((isRequired(key, content.model.required)) && (FAIR_MANDATORY.includes(key) || !showOnlyFAIR))
                )
                .sort((a: any, b: any) => a[1].title?.localeCompare(b[1].title || ''))
        );
    }

    if (searchQuery) {
        outProps = Object.fromEntries(
            Object.entries(outProps).filter(([key, prop]: any) => {
                const searchTerm = searchQuery.toLowerCase();
                return (
                    key.toLowerCase().includes(searchTerm) ||
                    prop.title?.toLowerCase().includes(searchTerm) ||
                    prop.description?.toLowerCase().includes(searchTerm)
                );
            })
        );
    }

    return outProps;
};

export function ModelPopup({label, title, content}: { label: string, title: string, content: ModAPIResponseType }) {
    const [showOptional, setShowOptional] = useState(false)
    const [showOnlyFAIR, setShowOnlyFAIR] = useState(true)
    const [searchQuery, setSearchQuery] = useState('');

    if (!content.model?.properties) {
        return
    }

    let props = filteredProps(label, content, searchQuery, showOptional, showOnlyFAIR)
    let showingCount = Object.keys(props).length
    const requiredCount = getRequiredCount(content.model.properties, content.model.required, true)

    return (
        <Dialog>
            <DialogTrigger>
                <div className={cn("flex", "align-middle", "items-center", "gap-1", "cursor-pointer")}>
                    <span>{wrapInArray(label, content.model.list)} (require {requiredCount} properties) </span>
                    <span><MessageCircleWarning/></span>
                </div>
            </DialogTrigger>
            <DialogContent className={'w-1/2'}>
                <DialogHeader>
                    <DialogTitle className="text-2xl font-bold">
                        {content.model.title || title}
                    </DialogTitle>
                </DialogHeader>

                <div className="prose dark:prose-invert">
                    <p className="text-muted-foreground">
                        {content.model.description}
                    </p>
                </div>

                <div className={'space-y-4 flex flex-col h-full'}>
                    <h2 className="text-lg font-semibold">Properties list (
                        Total {Object.entries(content.model.properties).length} /
                        Showing {showingCount})</h2>
                    <div className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            id={"showOptional"}
                            checked={showOptional}
                            onChange={() => setShowOptional(!showOptional)}
                        />
                        <label htmlFor={"showOptional"}>Show Optional Properties </label>
                    </div>
                    <div className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            id={"showFAIR"}
                            checked={showOnlyFAIR}
                            onChange={() => setShowOnlyFAIR(!showOnlyFAIR)}
                        />
                        <label htmlFor={"showFAIR"}>Show Only FAIRsFAIR mandatory properties</label>
                    </div>
                    <Input
                        type="search"
                        placeholder="Search properties..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full"
                    />
                </div>

                <Tabs defaultValue="table" className="w-full h-[70vh]">
                    <TabsList>
                        <TabsTrigger value="table" >Table view</TabsTrigger>
                        <TabsTrigger value="json">Json view</TabsTrigger>
                    </TabsList>
                    <TabsContent value="table">
                        <ScrollArea className={'h-[60vh]'}>
                            <ListProperties content={content} label={label}
                                            showOptional={showOptional} showOnlyFAIR={showOnlyFAIR}
                                            searchQuery={searchQuery}/>
                        </ScrollArea>
                    </TabsContent>
                    <TabsContent value="json">
                        <ScrollArea className={'h-[60vh]'}>
                            <JSONViewer data={content.model}/>
                        </ScrollArea>
                    </TabsContent>
                </Tabs>
            </DialogContent>
        </Dialog>)
}

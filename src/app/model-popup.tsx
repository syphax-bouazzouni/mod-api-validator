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
import {ModAPIResponseType} from "@/modapi-parser/modapi-parser";
import React, {useEffect, useState} from "react";
import {Input} from "@/components/ui/input";


const FAIR_MANDATORY = [
    '@id', '@type',
    'dcterms:title', 'mod:acronym', 'owl:versionIRI', 'dcterms:identifier', 'mod:hasRepresentationLanguage', 'mod:hasSyntax', 'dcterms:type',
    'dcterms:accessRights', 'dcterms:license', 'dcterms:rightsHolder', 'dcterms:description', 'dcat:landingPage', 'dcat:keyword', 'dcterms:created',
    'dcterms:modified', 'dcat:contactPoint', 'dcterms:creator', 'dcterms:subject', 'dcat:accessURL'
]


function RequiredAsterisk({required}: any) {
    return required ? <span className="text-red-500">*</span> : null
}

function wrapInArray(string: string, list: false) {
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
export function ModelPopup({label, title, content}: { label: string, title: string, content: ModAPIResponseType }) {
    const properties = content.model.properties || {}

    const [showOptional, setShowOptional] = useState(false)
    const [showOnlyFAIR, setShowOnlyFAIR] = useState(true)
    const [showingCount, setShowingCount] = useState(0)
    const [searchQuery, setSearchQuery] = useState('');
    const [requiredCount, setRequiredCount] = useState(0);


    const filteredProps = (properties) => {
        let outProps = properties;
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
                Object.entries(properties)
                    .filter(([key]) =>
                        showOptional ||
                        ((isRequired(key, content.model.required)) && (FAIR_MANDATORY.includes(key) || !showOnlyFAIR))
                    )
                    .sort((a, b) => a[1].title?.localeCompare(b[1].title || ''))
            );
        }

        if (searchQuery) {
            outProps = Object.fromEntries(
                Object.entries(outProps).filter(([key, prop]) => {
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

    useEffect(() => {
        let props = filteredProps(properties)
        setShowingCount(Object.keys(props).length)
        setRequiredCount(Object.keys(props).filter((key) => isRequired(key, content.model.required)).length)
    }, [showOptional, searchQuery, showOnlyFAIR]);

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

                <h2 className="text-lg font-semibold">Properties list ( Total {Object.entries(properties).length} /
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
                <div className="space-y-4">
                    <Input
                        type="search"
                        placeholder="Search properties..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full"
                    />
                    <ScrollArea className="h-96 pr-4">
                        <ul className="divide-y divide-border">
                            {Object.entries(filteredProps(properties)).map(([key, prop]) => (
                                <li key={key} className="py-2">
                                    <div className="flex flex-wrap gap-2">
                                        <span className="font-medium">{prop.title} <RequiredAsterisk key={key} required={isRequired(key, content.model.required)}/></span>
                                        <span className="text-muted-foreground">({key})</span>
                                        <span className="text-muted-foreground">—</span>
                                        <span className="text-muted-foreground">{prop.description}</span>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </ScrollArea>
                </div>
            </DialogContent>
        </Dialog>)
}

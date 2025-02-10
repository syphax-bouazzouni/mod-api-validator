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


const REQUIRED_PROPS = {
    artefact: [
        "@id", "@type",
        "mod:acronym",
        "dcterms:accessRights",
        "dcterms:subject",
        "mod:URI",
        "owl:versionIRI",
        "dcterms:creator",
        "dcterms:identifier",
        "mod:status",
        "dcterms:language",
        "dcterms:license",
        "dcterms:rightsHolder",
        "dcterms:description",
        "dcat:landingPage",
        "dcat:keyword",
        "dcterms:bibliographicCitation",
        "dcat:contactPoint",
        "dcterms:contributor",
        "dcterms:publisher",
        "dcterms:coverage",
        "pav:createdWith",
        "dcterms:accrualMethod",
        "dcterms:accrualPeriodicity",
        "mod:competencyQuestion",
        "prov:wasGeneratedBy",
        "dcterms:hasFormat",
        "schema:includedInDataCatalog",
        "mod:semanticArtefactRelation"
    ],
    distribution: [
        "@id", "@type",
        "dcterms:title",
        "mod:hasRepresentationLanguage",
        "mod:hasSyntax",
        "dcterms:description",
        "dcterms:created",
        "dcterms:modified",
        "mod:conformsToKnowledgeRepresentationParadigm",
        "mod:usedEngineeringMethodology",
        "mod:prefLabelProperty",
        "mod:synonymProperty",
        "mod:definitionProperty",
        "dcat:accessURL",
        "dcat:downloadURL",
        "dcat:byteSize"
    ],
    catalog: [
        "@id", "@type", 'dct:title', 'mod:color', 'mod:description', 'mod:logo', 'mod:fundedBy', 'mod:versionInfo', 'foaf:homepage', 'mod:numberOfArtefacts'
    ]
};

export function ModelPopup({label, title, content}: { label: string, title: string, content: ModAPIResponseType }) {
    let properties = content.model.properties || {}

    const [showOptional, setShowOptional] = useState(false)
    const [showingCount, setShowingCount] = useState(0)


    const filteredProps = (properties: any) => {
        let outProps = properties
        let filterKey = null
        if (label == 'modSemanticArtefact') {
            filterKey = 'artefact'
        } else if (label == 'modSemanticArtefactCatalog') {
            filterKey = 'catalog'
        } else if (label == 'modSemanticArtefactDistribution') {
            filterKey = 'distribution'
        }

        if (filterKey) {
            outProps = Object.fromEntries(
                Object.entries(properties).filter(([key]) => showOptional || REQUIRED_PROPS[filterKey].includes(key))
            );
        }

        return outProps
    }

    useEffect(() => {
        let props = filteredProps(properties)
        setShowingCount(Object.keys(props).length)
    }, [showOptional]);

    return (
        <Dialog>
            <DialogTrigger>
                <div className={cn("flex", "items-center", "gap-1", "cursor-pointer")}>
                    <span>{label} </span>
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
                    <label htmlFor={"showOptional"}>Show Optional endpoints</label>
                </div>
                <ScrollArea className="h-96 pr-4">
                    <ul className="divide-y divide-border">
                        {Object.entries(filteredProps(properties)).map(([key, prop]) => (
                            <li key={key} className="py-2">
                                <div className="flex flex-wrap gap-2">
                                    <span className="font-medium">{prop.title}</span>
                                    <span className="text-muted-foreground">({key})</span>
                                    <span className="text-muted-foreground">—</span>
                                    <span className="text-muted-foreground">{prop.description}</span>
                                </div>
                            </li>
                        ))}
                    </ul>
                </ScrollArea>
            </DialogContent>
        </Dialog>)
}

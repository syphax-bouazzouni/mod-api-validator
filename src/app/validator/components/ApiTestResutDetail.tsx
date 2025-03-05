import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger
} from "@/components/ui/dialog";
import {ScrollArea} from "@/components/ui/scroll-area";
import JSONViewer from "@/components/JSONViewer";
import React from "react";
import {Card, CardContent, CardTitle} from "@/components/ui/card";
import {Car, FileCodeIcon, VerifiedIcon} from "lucide-react";
import {RequiredStatus} from "@/app/validator/components/ModAPIValidatorResults";
import {EndpointValidationResult} from "@/lib/modapi-validator";

export default function ApiTestResultDetail({path, result}: { path: string, result: EndpointValidationResult }) {
    const isFound = (prop: string, allProps: string[]) => {
        return allProps.includes(prop)
    }
    return (
        <Dialog>
            <DialogTrigger asChild>
                <button
                    className="px-4 py-2 text-primary rounded-md hover:bg-purple-100 transition-colors flex items-center gap-2">
                    <FileCodeIcon className="w-5 h-5"/>
                    View Details
                </button>
            </DialogTrigger>
            <DialogContent className="w-[50vw] h-[60vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle className="flex items-center space-x-1">
                        <div className="flex items-center gap-3">
                            <VerifiedIcon className="w-6 h-6 text-blue-500"/>
                            <span className="text-xl font-semibold">Test Details</span>
                        </div>
                        <span className="text-sm text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
              {path}
            </span>
                    </DialogTitle>
                </DialogHeader>

                {result?.properties && (
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 shadow-sm">
                        <div className="flex items-center space-x-2">
                            <span className="font-semibold text-gray-700">Required Properties:</span>
                            <RequiredStatus properties={result.properties}/>
                        </div>

                        {result.properties.allRequiredProperties && (
                            <div className="mt-2 text-sm text-gray-600">
                                <span className="font-medium">All Required:</span>{' '}
                                <div className={'flex gap-1 flex-wrap'}>
                                    {result.properties.allRequiredProperties.map((prop, index) => (
                                        <code key={index}
                                              className={`border rounded text-primary p-1 ${isFound(prop, result.properties.allFoundRequiredProperties) ? 'bg-green-50' : 'bg-red-50'}`}>
                                            {prop}
                                        </code>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}
                <div className="flex gap-4 flex-grow overflow-hidden">
                    <Card className="w-1/2 flex flex-col">
                        <CardTitle className="p-4 border-b flex items-center gap-2 bg-gray-50">
                            <FileCodeIcon className="w-5 h-5 text-green-500"/>
                            API Response
                        </CardTitle>
                        <CardContent className="flex-grow overflow-hidden p-0">
                            <ScrollArea className="h-full w-full p-1">
                                <JSONViewer data={result.originalResponse}/>
                            </ScrollArea>
                        </CardContent>
                    </Card>

                    <Card className="w-1/2 flex flex-col">
                        <CardTitle className="p-4 border-b flex items-center gap-2 bg-gray-50">
                            <VerifiedIcon className="w-5 h-5 text-blue-500"/>
                            Required Schema
                        </CardTitle>
                        <CardContent className="flex-grow overflow-hidden p-0">
                            <ScrollArea className="h-full w-full p-1">
                                <JSONViewer data={result.expectedModel.properties}/>
                            </ScrollArea>
                        </CardContent>
                    </Card>
                </div>
            </DialogContent>
        </Dialog>
    )
}
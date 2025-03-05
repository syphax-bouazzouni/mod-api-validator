import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger
} from "@/components/ui/dialog";
import {ScrollArea} from "@/components/ui/scroll-area";
import React from "react";
import JSONViewer from "@/components/JSONViewer";

export default function JsonDialog({json, path}: { json: any, path?: string }) {
    return (
        <Dialog>
            <DialogTrigger >
                View JSON
            </DialogTrigger>
            <DialogContent className={'w-[50vw] h-[70vh]'}>
                <DialogHeader>
                    <DialogTitle>
                        <span> JSON Viewer </span>
                        <span className={'text-blue-600'}>{path}</span>
                    </DialogTitle>
                    <DialogDescription>
                        <ScrollArea className={'h-[60vh]'}>
                            <JSONViewer data={json} />
                        </ScrollArea>
                    </DialogDescription>
                </DialogHeader>
            </DialogContent>
        </Dialog>
    );
}
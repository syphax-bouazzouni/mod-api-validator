import {Tooltip, TooltipContent, TooltipProvider, TooltipTrigger} from "@/components/ui/tooltip";

export function ResultExplicationTooltip({ header, children }: any) {
    return <TooltipProvider>
        <Tooltip>
            <TooltipTrigger>
                {header}
            </TooltipTrigger>

            <TooltipContent className="bg-white border shadow-lg rounded-lg p-4 max-w-[300px]">
                {children}
            </TooltipContent>
        </Tooltip>
    </TooltipProvider>
}
"use client";

import {useRouter} from "next/navigation";
import {ArrowLeft} from "lucide-react";
import {Button} from "@/components/ui/button";

const BackButton = ({link}: { link?: string }) => {
    const router = useRouter();
    const handleBack = () => {
        if (window.history.length > 1 && !link) {
            router.back();
        } else {
            router.push(link ?? "/");
        }
    };
    return (
        <Button variant='link' onClick={handleBack}
                className="flex items-center gap-2 p-2">
            <ArrowLeft size={18}/>
        </Button>
    );
};

export default BackButton;

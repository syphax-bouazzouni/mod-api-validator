import BackButton from "@/components/back-button";

export function PageTitle({children, link}: any) {
    return <div className="flex items-center space-x-2">
        <BackButton link={link}/>
        {children}
    </div>
}
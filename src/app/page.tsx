import {Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle} from "@/components/ui/card";
import {Button} from "@/components/ui/button";
import {Rocket, Shield, Trophy} from "lucide-react";
import Link from "next/link";

export default function Home() {
    return <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
        <Card className="w-full max-w-md">
            <CardHeader>
                <CardTitle className="text-3xl font-bold text-center">MOD API</CardTitle>
                <CardDescription className="text-center">
                    MOD API Explorer and Validator
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    <p className="text-center text-gray-600">
                        Explore and validate MOD APIs using the MOD API Explorer and Validator
                    </p>

                    <div className="flex flex-col space-y-4">
                        <Button

                            className="w-full"
                        >
                            <Link href={'/validator'} className={'flex items-center'} prefetch={true}>
                                <Shield className="mr-2 h-5 w-5"/>
                                Validate API Schema
                            </Link>
                        </Button>

                        <Button variant="secondary" className="w-full">
                            <Link href={'/explore'} className={'flex items-center'} prefetch={true}>
                                <Rocket className="mr-2 h-5 w-5"/>
                                Explore MOD API schemas
                            </Link>
                        </Button>


                        <Button
                            variant="secondary"
                            className="w-full"
                        >
                            <Link href={'/board'} className={'flex items-center'} prefetch={true}>
                                <Trophy className="mr-2 h-5 w-5"/>
                                MOD API Leaderboard (2024 call)
                            </Link>
                        </Button>
                    </div>
                </div>
            </CardContent>
            <CardFooter>
                <p className="text-center text-gray-500 text-sm">
                    Not an official validator, check the official <a href={''} className={'text-primary'}
                                                                     target={'_blank'}>MOD API documentation</a> for
                    more information
                </p>
            </CardFooter>
        </Card>
    </div>
}
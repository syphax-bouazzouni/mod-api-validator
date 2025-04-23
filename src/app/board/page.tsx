// app/page.tsx
'use client'

import React, {useEffect, useState} from 'react'
import Link from 'next/link'
import {Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle} from '@/components/ui/card'
import {Button} from '@/components/ui/button'
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from '@/components/ui/table'
import {ArrowUpDown, Medal, Trophy} from 'lucide-react'
import {AppConfig, ParticipantAPI} from "@/lib/config";
import {Skeleton} from "@/components/ui/skeleton";
import {useModAPIValidator} from "@/lib/validator/modapi-validator";
import {useModApiFetcher, useModEndpointsFilter} from "@/app/explore/components/openapi-explorer";
import {PageTitle} from "@/components/page-title";

type Score = {
    participant: ParticipantAPI,
    score: number,
    rank?: number
}

export async function getScore(participant: ParticipantAPI): Promise<Score> {
    // Simulate fetching score from an API
    const times = [1000, 1500, 500, 200]
    const sampleTime = times[Math.floor(Math.random() * times.length)];
    console.log(`Fetching score for ${participant.name}... (${sampleTime}ms)`);
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve({participant, score: Math.floor(Math.random() * 100)});
        }, sampleTime);
    });

}

function BoardLineLoading({participant}: { participant: ParticipantAPI }) {
    return <>
        <TableCell><Skeleton className="h-5 w-5 mx-auto"/></TableCell>
        <TableCell>
            <div className="flex items-center">
                <span className="text-gray-500">Loading {participant?.name} score</span>
            </div>
        </TableCell>

        <TableCell className="text-right"><Skeleton className="h-5 w-10"/></TableCell>
        <TableCell className="text-right"><Skeleton className="h-8 w-16 mx-auto"/></TableCell>
    </>
}

function findCurrentScore(scores: Score[], participant: ParticipantAPI): Score | null {
    const currentScore = scores.find((s) => s.participant.id === participant.id);
    if (currentScore) {
        return currentScore;
    }
    return null;
}

function BoardLine({scores, setScores, participant, model}:
                   {
                       scores: Score[],
                       setScores: any,
                       participant: ParticipantAPI,
                       model: any
                   }) {
    const baseUrl = participant.baseURL;
    const params = participant.params;
    const {filters, setFilters, filteredEndpoints} = useModEndpointsFilter(model?.endpoints, {});
    const {isError, results, errors, isLoading} = useModAPIValidator(filteredEndpoints, baseUrl,  params);

    const totalScore = Object.values(results).map(x => x.score).reduce((a, b) => a + b, 0);
    const maxScore = Object.values(results).map(x => x.maxScore).reduce((a, b) => a + b, 0);

    const getMedalIcon = (rank: number) => {
        if (rank === 1) return <Trophy className="h-5 w-5 text-yellow-500"/>;
        if (rank === 2) return <Medal className="h-5 w-5 text-gray-400"/>;
        if (rank === 3) return <Medal className="h-5 w-5 text-amber-700"/>;
        return <span className="text-gray-500">{rank}</span>;
    };


    const loading = isLoading

    if (loading) {
        return <TableRow key={participant.id}>
            <BoardLineLoading participant={participant}/>
        </TableRow>
    }

    let currentScore = findCurrentScore(scores, participant);

    if (!isLoading && !isError && currentScore?.score !== totalScore) {
        console.log(`Score for ${participant.name}: ${totalScore} / ${maxScore} updated`);
        setScores((prevScores: Score[]) => {
            let updatedScores = [...prevScores];
            let index = updatedScores.findIndex((s) => s.participant.id === participant.id);
            if (index !== -1) {
                updatedScores[index] = {...updatedScores[index], score: totalScore};
            } else {
                console.error('unknown participant score');
            }

            updatedScores = updatedScores.toSorted((a, b) => b.score - a.score)
            .map((participant, index) => ({
                ...participant,
                rank: index + 1
            }));
            return updatedScores;
        });
    }

    currentScore = findCurrentScore(scores, participant);
    const rank = currentScore?.rank ?? -1;

    const rankColor = rank && rank <= 3 ? "bg-yellow-50" : ""
    return <TableRow key={rank} className={loading ? "" : rankColor}>
        <TableCell className="font-medium">
            <div
                className="flex items-center justify-center">{getMedalIcon(rank || -1)}</div>
        </TableCell>
        <TableCell>{participant.name}</TableCell>
        <TableCell className="text-right font-semibold">{totalScore} ({Math.floor(totalScore/maxScore * 100)}%)</TableCell>
        <TableCell className="text-right">
            <Link href={`/validator?participant=${participant.id}`}>
                <Button variant='outline' size="sm">View</Button>
            </Link>
        </TableCell>
    </TableRow>

}

export default function LeaderboardPage() {
    const participants = AppConfig.participants
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
    const [scores, setScores] = useState<Score[]>(
        participants.map(participant => ({participant, score: -1}))
    )

    const {
        modAPI,
        isLoading,
        isError,
        error,
        yamlUrl,
        setYamlUrl,
    } = useModApiFetcher()


    if (isLoading) {
        return <div className={'flex w-screen h-screen items-center justify-center'}>Loading MOD API
            from {yamlUrl}...</div>
    }
    if (isError) {
        return <div className={'flex w-screen h-screen items-center justify-center'}>Error loading MOD API
            from {yamlUrl}: {error?.message}</div>
    }

    // Sort and assign ranks
    const sortedPlayers = scores
        .toSorted((a, b) => sortOrder === 'desc' ? b.score - a.score : a.score - b.score)

    const toggleSortOrder = () => {
        setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc');
    };


    return (
        <div className="flex flex-col items-center min-h-screen p-4 bg-gray-50">
            <div className="w-full max-w-3xl">
                <Card className="shadow-lg">
                    <CardHeader className="text-center">
                        <CardTitle>
                            <PageTitle link="/">
                                <div className="text-2xl font-bold flex items-center justify-center gap-2 flex-end">
                                    <Trophy className="h-6 w-6 text-yellow-500"/>
                                    Leaderboard
                                </div>
                            </PageTitle>
                        </CardTitle>
                        <CardDescription>MOD API specification 2025 call scores</CardDescription>
                    </CardHeader>

                    <CardContent>
                        <div className="flex justify-end mb-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={toggleSortOrder}
                                className="flex items-center gap-1">
                                Sort {sortOrder === 'desc' ? 'Ascending' : 'Descending'}
                                <ArrowUpDown className="h-4 w-4"/>
                            </Button>
                        </div>

                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-16">Rank</TableHead>
                                    <TableHead>Participant</TableHead>
                                    <TableHead className="text-right">Score</TableHead>
                                    <TableHead className="w-28 text-right">Details</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {sortedPlayers.map(s => (
                                    <BoardLine scores={scores} setScores={setScores}
                                               participant={s.participant} model={modAPI}/>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>

                    <CardFooter className="flex justify-center">
                        <Link href="/validator" passHref>
                            <Button variant="default">
                                Add New Score
                            </Button>
                        </Link>
                    </CardFooter>
                </Card>
            </div>
        </div>
    )
}
import {EndpointValidationChecks} from "@/lib/api-fetcher";
import {AppConfig} from "@/lib/config";

export class ScoreHelpers {
    static scorePowersSet(key: string): number {
        let scores = AppConfig.scores

        if (key in scores) {
            return scores[key as keyof typeof scores];
        } else {
            alert("Unknown check: " + key);
            return 0;
        }
    }

    static getScores(checks: EndpointValidationChecks): Record<string, number> {
        let score: Record<string, number> = {}
        Object.keys(checks).forEach(check => {
            score[check] = 0;
            if (checks[check as keyof EndpointValidationChecks]) {
                score[check] = this.scorePowersSet(check);
            }
        })
        return score;
    }

    static calculateScore(checks: EndpointValidationChecks): number {
        return Object.values(this.getScores(checks)).reduce((acc: number, score: number) => acc + score, 0);

    }

    static maxScore(checks: EndpointValidationChecks): number {
        let maxScore = 0;
        Object.keys(checks).forEach(check => {
            maxScore += this.scorePowersSet(check);
        })
        return maxScore;
    }
}

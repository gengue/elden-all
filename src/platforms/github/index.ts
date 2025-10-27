import { Platform } from '../base'
import type { ActionType, DetectionResult, RequestDetails } from '../base'
import { GitHubDetector } from './detector'
import { GITHUB_HOSTNAME, ACTION_LABELS } from './config'

export class GitHubPlatform extends Platform {
    readonly name = 'github'
    readonly displayName = 'GitHub'

    private detector: GitHubDetector

    constructor() {
        super()
        this.detector = new GitHubDetector(this)
    }

    matchesHost(hostname: string): boolean {
        return hostname === GITHUB_HOSTNAME
    }

    detectAction(
        detail: RequestDetails,
        stage: 'before' | 'completed'
    ): DetectionResult | undefined {
        if (stage === 'before') {
            return this.detector.detectBeforeRequest(detail)
        } else {
            return this.detector.detectCompleted(detail)
        }
    }

    getActionLabel(action: ActionType): string {
        return ACTION_LABELS[action] || action
    }
}

import { Platform } from '../base'
import type { ActionType, DetectionResult, RequestDetails } from '../base'
import { GitLabDetector } from './detector'
import { GITLAB_HOSTNAME, ACTION_LABELS } from './config'
import type { PlatformRegistry } from '../registry'

export class GitLabPlatform extends Platform {
    readonly name = 'gitlab'
    readonly displayName = 'GitLab'

    private detector: GitLabDetector
    private registry: PlatformRegistry

    constructor(registry: PlatformRegistry) {
        super()
        this.registry = registry
        this.detector = new GitLabDetector(this)
    }

    matchesHost(hostname: string): boolean {
        if (hostname === GITLAB_HOSTNAME) return true

        const customDomains = this.registry.getCustomGitLabDomains()
        return customDomains.includes(hostname)
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

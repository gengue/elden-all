import type { Platform } from './base'
import type { RequestDetails, DetectionResult } from './base'
import { GitHubPlatform } from './github'
import { GitLabPlatform } from './gitlab'
import { getCustomGitLabDomains } from '../storage'

export class PlatformRegistry {
    private platforms: Platform[] = []
    private customGitLabDomains: string[] = []

    constructor() {
        this.registerPlatform(new GitHubPlatform())
        this.registerPlatform(new GitLabPlatform(this))
    }

    async initialize(): Promise<void> {
        this.customGitLabDomains = await getCustomGitLabDomains()
    }

    getCustomGitLabDomains(): string[] {
        return this.customGitLabDomains
    }

    async refreshCustomDomains(): Promise<void> {
        this.customGitLabDomains = await getCustomGitLabDomains()
    }

    private registerPlatform(platform: Platform): void {
        this.platforms.push(platform)
    }

    detectPlatform(hostname: string): Platform | undefined {
        return this.platforms.find((p) => p.matchesHost(hostname))
    }

    detectAction(
        detail: RequestDetails,
        stage: 'before' | 'completed'
    ): DetectionResult | undefined {
        const url = new URL(detail.url)
        const platform = this.detectPlatform(url.hostname)

        if (!platform) return undefined

        return platform.detectAction(detail, stage)
    }

    getActionLabel(
        hostname: string,
        action: string
    ): string | undefined {
        const platform = this.detectPlatform(hostname)
        if (!platform) return undefined

        return platform.getActionLabel(action as never)
    }
}

export const registry = new PlatformRegistry()

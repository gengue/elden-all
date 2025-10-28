export type WebAppActionType = 'emailSent' | 'inboxCleared' | 'taskDone'

export interface WebAppActionLabel {
    readonly action: WebAppActionType
    readonly label: string
}

export interface WebAppDetectionResult {
    readonly action: WebAppActionType
    readonly delay?: number
}

export abstract class WebApp {
    abstract readonly name: string
    abstract readonly displayName: string

    abstract matchesHost(hostname: string): boolean

    abstract initialize(): void

    abstract cleanup(): void

    abstract getActionLabel(action: WebAppActionType): string
}

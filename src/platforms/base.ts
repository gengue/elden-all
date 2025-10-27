export type ActionType =
    | 'assignmentUpdated'
    | 'codeReviewed'
    | 'commentEdited'
    | 'issueClosed'
    | 'issueCommented'
    | 'issueCreated'
    | 'issueDuplicated'
    | 'issueNotPlanned'
    | 'issueReopened'
    | 'prCommented'
    | 'prClosed'
    | 'prMade'
    | 'prMerged'
    | 'prReopened'
    | 'repoCreated'
    | 'repoDeleted'
    | 'repoStarred'
    | 'repoUnstarred'
    | 'requestedChange'

export interface ActionLabel {
    readonly action: ActionType
    readonly label: string
}

export interface DetectionResult {
    readonly action: ActionType
    readonly delay?: number
}

export interface RequestDetails {
    readonly url: string
    readonly method: string
    readonly requestBody?: {
        raw?: { bytes?: ArrayBuffer }[]
        formData?: Record<string, chrome.webRequest.FormDataItem[]>
    }
}

export abstract class Platform {
    abstract readonly name: string
    abstract readonly displayName: string

    abstract matchesHost(hostname: string): boolean

    abstract detectAction(
        detail: RequestDetails,
        stage: 'before' | 'completed'
    ): DetectionResult | undefined

    abstract getActionLabel(action: ActionType): string

    protected partialShapeMatch(
        a: Record<string, unknown>,
        b: Record<string, unknown>
    ): boolean {
        if (!a || !b) return false

        for (const k of Object.keys(a)) {
            if (!(k in b)) return false

            if (a[k] && typeof a[k] === 'string' && typeof b[k] === 'string') {
                if (a[k] !== b[k]) return false
            }

            if (typeof a[k] === 'object' && typeof b[k] === 'object')
                if (
                    !this.partialShapeMatch(
                        a[k] as Record<string, unknown>,
                        b[k] as Record<string, unknown>
                    )
                )
                    return false
        }

        return true
    }

    protected readBody(detail: RequestDetails): unknown {
        if (detail.method !== 'POST') return

        const bytes = detail.requestBody?.raw?.[0]?.bytes
        if (!bytes) return

        const decoder = new TextDecoder('utf-8')
        const jsonStr = decoder.decode(bytes)

        try {
            return JSON.parse(jsonStr)
        } catch {
            return jsonStr
        }
    }

    protected formDataPropertyArrayToLiteral(
        formDataObject:
            | Record<string, chrome.webRequest.FormDataItem[]>
            | undefined
    ):
        | Record<
              string,
              | chrome.webRequest.FormDataItem
              | chrome.webRequest.FormDataItem[]
          >
        | undefined {
        if (!formDataObject) return undefined

        const formData = {} as Record<
            string,
            | chrome.webRequest.FormDataItem
            | chrome.webRequest.FormDataItem[]
        >

        for (const key of Object.keys(formDataObject)) {
            const body = formDataObject[key]

            if (body.length === 1) formData[key] = body[0]
            else formData[key] = body
        }

        return formData
    }
}

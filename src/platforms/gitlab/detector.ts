import type { DetectionResult, RequestDetails } from '../base'
import { Platform } from '../base'
import { GRAPHQL_ENDPOINT_PATH, DELAYS } from './config'

export class GitLabDetector {
    constructor(private platform: Platform) {}

    detectBeforeRequest(detail: RequestDetails): DetectionResult | undefined {
        const url = new URL(detail.url)
        const match = (urlPattern: string | RegExp, method = 'POST') =>
            detail.method === method &&
            (typeof urlPattern === 'string'
                ? detail.url === urlPattern
                : detail.url.match(urlPattern))

        // GraphQL endpoint
        if (url.pathname === GRAPHQL_ENDPOINT_PATH && detail.method === 'POST') {
            return this.detectGraphQL(detail)
        }

        // Create MR - POST /project/-/merge_requests (without ID at the end)
        if (match(/\/.*\/-\/merge_requests$/, 'POST')) {
            return {
                action: 'prMade',
                delay: DELAYS.prMade
            }
        }

        // Merge MR - POST /project/-/merge_requests/40/merge
        if (match(/\/.*\/-\/merge_requests\/\d+\/merge$/, 'POST')) {
            return {
                action: 'prMerged',
                delay: DELAYS.prMerged
            }
        }

        // Close MR - PUT with merge_request[state_event]=close (URL-encoded)
        if (
            detail.method === 'PUT' &&
            detail.url.match(/\/.*\/-\/merge_requests\/\d+/) &&
            detail.url.includes('merge_request%5Bstate_event%5D=close')
        ) {
            return { action: 'prClosed' }
        }

        // Reopen MR - PUT with merge_request[state_event]=reopen (URL-encoded)
        if (
            detail.method === 'PUT' &&
            detail.url.match(/\/.*\/-\/merge_requests\/\d+/) &&
            detail.url.includes('merge_request%5Bstate_event%5D=reopen')
        ) {
            return { action: 'prReopened' }
        }

        return undefined
    }

    detectCompleted(detail: RequestDetails): DetectionResult | undefined {
        // Detect MR creation by 302 redirect to /-/merge_requests/\d+
        if (
            detail.method === 'GET' &&
            detail.url.match(/\/-\/merge_requests\/\d+$/)
        ) {
            // This could be a newly created MR or just viewing an MR
            // We'll detect it on the first GET after creation
            // Note: This may cause false positives when just viewing MRs
            // A better approach would be to track the POST that creates the MR
            // For now, we'll skip this to avoid false positives
        }

        return undefined
    }

    private detectGraphQL(detail: RequestDetails): DetectionResult | undefined {
        const body = this.platform['readBody'](detail) as any

        if (!body || typeof body !== 'object') return undefined

        const operationName = body.operationName as string | undefined
        const variables = body.variables as Record<string, any> | undefined

        // Create issue/work item
        if (operationName === 'createWorkItem') {
            return { action: 'issueCreated' }
        }

        // Comment on issue/work item
        if (operationName === 'createWorkItemNote') {
            return { action: 'issueCommented' }
        }

        // Update work item (close/reopen issue)
        if (operationName === 'workItemUpdate' && variables?.input) {
            const stateEvent = variables.input.stateEvent

            if (stateEvent === 'CLOSE') {
                return { action: 'issueClosed' }
            }

            if (stateEvent === 'REOPEN') {
                return { action: 'issueReopened' }
            }
        }

        return undefined
    }
}

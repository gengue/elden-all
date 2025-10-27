import type { DetectionResult, RequestDetails } from '../base'
import { Platform } from '../base'
import { GRAPHQL_ENDPOINT, DELAYS } from './config'

export class GitHubDetector {
    private pending = {
        prMade: false,
        repoDeleted: false
    }

    constructor(private platform: Platform) {}

    detectBeforeRequest(detail: RequestDetails): DetectionResult | undefined {
        const match = (url: string | RegExp, method = 'POST') =>
            detail.method === method &&
            (typeof url === 'string'
                ? detail.url === url
                : detail.url.match(url))

        if (match(GRAPHQL_ENDPOINT)) {
            return this.detectGraphQL(detail)
        }

        if (
            match(
                /https:\/\/github.com\/.*?\/.*?\/pull\/\d+\/comment\?sticky=true/g
            )
        ) {
            return this.detectModifyPullRequest(detail)
        }

        if (
            match(
                /https:\/\/github.com\/.*?\/.*?\/pull\/\d+\/page_data\/merge/g
            )
        ) {
            return this.detectMergePullRequest(detail)
        }

        if (
            match(/https:\/\/github.com\/.*?\/.*?\/pull\/create/g) ||
            match(/https:\/\/github.com\/.*?\/.*?\/pull\/new/g)
        ) {
            this.pending.prMade = true
            return undefined
        }

        if (match(/https:\/\/github.com\/.*?\/.*?\/settings\/delete/g)) {
            this.pending.repoDeleted = true
            return undefined
        }

        return undefined
    }

    detectCompleted(detail: RequestDetails): DetectionResult | undefined {
        const match = (url: string | RegExp, method = 'POST') =>
            detail.method === method &&
            (typeof url === 'string'
                ? detail.url === url
                : detail.url.match(url))

        if (match('https://github.com/repositories')) {
            return {
                action: 'repoCreated',
                delay: DELAYS.repoCreated
            }
        }

        if (
            this.pending.prMade &&
            match(
                /https:\/\/github.com\/.*?\/.*?\/pull\/\d+\/suggested\-reviewers/g,
                'GET'
            )
        ) {
            this.pending.prMade = false
            return {
                action: 'prMade',
                delay: DELAYS.prMade
            }
        }

        if (
            this.pending.repoDeleted &&
            match(
                /https:\/\/github.com\/.*?\/.*?\/graphs\/participation/g,
                'GET'
            )
        ) {
            this.pending.repoDeleted = false
            return {
                action: 'repoDeleted',
                delay: DELAYS.repoDeleted
            }
        }

        return undefined
    }

    private detectGraphQL(detail: RequestDetails): DetectionResult | undefined {
        const body = this.platform['readBody'](detail)

        const partOfGraphQL = (expected: Record<string, unknown>) => {
            if (typeof expected === 'string') return expected === body

            return this.platform['partialShapeMatch'](
                { variables: expected },
                body as Record<string, unknown>
            )
        }

        if (
            partOfGraphQL({
                input: {
                    title: '',
                    body: '',
                    repositoryId: ''
                }
            })
        )
            return { action: 'issueCreated' }

        if (
            partOfGraphQL({
                input: {
                    body: '',
                    subjectId: ''
                }
            })
        )
            return { action: 'issueCommented' }

        if (partOfGraphQL({ newStateReason: 'COMPLETED' }))
            return { action: 'issueClosed' }

        if (partOfGraphQL({ newStateReason: 'NOT_PLANNED' }))
            return { action: 'issueNotPlanned' }

        if (partOfGraphQL({ newStateReason: 'DUPLICATE' }))
            return { action: 'issueDuplicated' }

        if (
            partOfGraphQL({
                input: {
                    body: '',
                    bodyVersion: '',
                    id: ''
                }
            })
        )
            return { action: 'commentEdited' }

        if (partOfGraphQL({ input: { assignableId: '' } }))
            return { action: 'assignmentUpdated' }

        if (partOfGraphQL({ id: '' })) return { action: 'issueReopened' }

        return undefined
    }

    private detectModifyPullRequest(
        detail: RequestDetails
    ): DetectionResult | undefined {
        const body = this.platform['formDataPropertyArrayToLiteral'](
            detail.requestBody?.formData
        )

        if (!body) return undefined

        if (this.platform['partialShapeMatch']({ comment_and_close: '1' }, body))
            return { action: 'prClosed' }

        if (this.platform['partialShapeMatch']({ comment_and_open: '1' }, body))
            return { action: 'prReopened' }

        if (this.platform['partialShapeMatch']({ 'comment[body]': '' }, body))
            return { action: 'prCommented' }

        return undefined
    }

    private detectMergePullRequest(
        detail: RequestDetails
    ): DetectionResult | undefined {
        const body = this.platform['readBody'](detail) as
            | Record<string, unknown>
            | undefined

        if (!body || typeof body !== 'object') return undefined

        if (this.platform['partialShapeMatch']({ mergeMethod: 'MERGE' }, body))
            return {
                action: 'prMerged',
                delay: DELAYS.prMerged
            }

        return undefined
    }
}

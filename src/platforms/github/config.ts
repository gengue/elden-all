import type { ActionType } from '../base'

export const GITHUB_HOSTNAME = 'github.com'

export const GRAPHQL_ENDPOINT = 'https://github.com/_graphql'

export const ACTION_LABELS: Record<ActionType, string> = {
    assignmentUpdated: 'Assignment updated',
    codeReviewed: 'Code reviewed',
    commentEdited: 'Comment edited',
    issueClosed: 'Issue closed',
    issueCommented: 'Issue commented',
    issueCreated: 'Issue created',
    issueDuplicated: 'Issue duplicated',
    issueNotPlanned: 'Issue not planned',
    issueReopened: 'Issue reopened',
    prCommented: 'Pull request commented',
    prClosed: 'Pull request closed',
    prMade: 'Pull request made',
    prMerged: 'Pull request merged',
    prReopened: 'Pull request reopened',
    repoCreated: 'Repository created',
    repoDeleted: 'Repository deleted',
    repoStarred: 'Repository starred',
    repoUnstarred: 'Repository unstarred',
    requestedChange: 'Changes requested'
}

export const DELAYS: Partial<Record<ActionType, number>> = {
    prMerged: 3000,
    repoCreated: 3000,
    prMade: 0,
    repoDeleted: 0
}

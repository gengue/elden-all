import {
    getCustomGitLabDomains,
    addCustomGitLabDomain,
    removeCustomGitLabDomain
} from './src/storage'

const domainInput = document.getElementById('domainInput') as HTMLInputElement
const addButton = document.getElementById('addButton') as HTMLButtonElement
const domainList = document.getElementById('domainList') as HTMLDivElement

function showStatus(message: string, isError = false) {
    const statusDiv = document.createElement('div')
    statusDiv.className = `status-message ${isError ? 'status-error' : 'status-success'}`
    statusDiv.textContent = message
    document.body.appendChild(statusDiv)

    setTimeout(() => {
        statusDiv.remove()
    }, 3000)
}

function isValidDomain(domain: string): boolean {
    const domainRegex = /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/
    return domainRegex.test(domain)
}

async function renderDomains() {
    const domains = await getCustomGitLabDomains()

    domainList.innerHTML = ''

    if (domains.length === 0) {
        const emptyState = document.createElement('div')
        emptyState.className = 'empty-state'
        emptyState.textContent = 'No custom GitLab domains configured'
        domainList.appendChild(emptyState)
        return
    }

    for (const domain of domains) {
        const item = document.createElement('div')
        item.className = 'domain-item'

        const nameSpan = document.createElement('span')
        nameSpan.className = 'domain-name'
        nameSpan.textContent = domain

        const removeBtn = document.createElement('button')
        removeBtn.className = 'btn-danger'
        removeBtn.textContent = 'Remove'
        removeBtn.onclick = async () => {
            await removeCustomGitLabDomain(domain)
            showStatus(`Removed ${domain}`)
            renderDomains()
        }

        item.appendChild(nameSpan)
        item.appendChild(removeBtn)
        domainList.appendChild(item)
    }
}

async function handleAdd() {
    const domain = domainInput.value.trim().toLowerCase()

    if (!domain) {
        showStatus('Please enter a domain', true)
        return
    }

    if (!isValidDomain(domain)) {
        showStatus('Please enter a valid domain (e.g., gitlab.company.com)', true)
        return
    }

    const domains = await getCustomGitLabDomains()
    if (domains.includes(domain)) {
        showStatus('Domain already exists', true)
        return
    }

    await addCustomGitLabDomain(domain)
    showStatus(`Added ${domain}`)
    domainInput.value = ''
    renderDomains()
}

addButton.addEventListener('click', handleAdd)
domainInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        handleAdd()
    }
})

renderDomains()

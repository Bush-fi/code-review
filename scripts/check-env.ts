import * as dotenv from 'dotenv'
import { createPublicClient, http } from 'viem'
import type { Chain } from 'viem'

dotenv.config()

const RPC_CHECK_TIMEOUT_MS = 10_000

// Network keys from process-issue.ts networks map; env var is {KEY.toUpperCase()}_RPC_URL
const RPC_ENV_KEYS = ['robinhood'] as const

function envName(key: string): string {
    return `${key.toUpperCase()}_RPC_URL`
}

function isValidHttpUrl(s: string): boolean {
    try {
        const u = new URL(s)
        return u.protocol === 'http:' || u.protocol === 'https:'
    } catch {
        return false
    }
}

function minimalChain(rpcUrl: string): Chain {
    return {
        id: 1,
        name: 'Unknown',
        nativeCurrency: { decimals: 18, name: 'Ether', symbol: 'ETH' },
        rpcUrls: { default: { http: [rpcUrl] } },
    }
}

async function checkRpcUrl(rpcUrl: string): Promise<{ ok: true } | { ok: false; reason: string }> {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), RPC_CHECK_TIMEOUT_MS)

    const publicClient = createPublicClient({
        chain: minimalChain(rpcUrl),
        transport: http(rpcUrl, {
            fetchOptions: { signal: controller.signal },
        }),
    })

    try {
        await publicClient.createAccessList({
            to: '0x0000000000000000000000000000000000000000',
            data: '0x',
        })
        clearTimeout(timeoutId)
        return { ok: true }
    } catch (err) {
        clearTimeout(timeoutId)
        const reason = err instanceof Error ? err.message : String(err)
        if (controller.signal.aborted) return { ok: false, reason: 'timeout' }
        return { ok: false, reason }
    }
}

async function checkRobinscanApiKey(apiKey: string): Promise<{ ok: true } | { ok: false; reason: string }> {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), RPC_CHECK_TIMEOUT_MS)

    // Multicall3 on Robinhood Chain - always verified contract
    const address = '0xcA11bde05977b3631167028862bE2a173976CA11'
    const url = `https://api.etherscan.io/v2/api?chainid=4663&module=contract&action=getsourcecode&address=${address}&apikey=${apiKey}`

    try {
        const response = await fetch(url, { signal: controller.signal })
        clearTimeout(timeoutId)

        if (!response.ok) {
            return { ok: false, reason: `HTTP ${response.status}: ${response.statusText}` }
        }

        const data = await response.json()

        // Check for API errors in the response
        if (data.message) {
            const message = data.message.toLowerCase()
            if (message.includes('invalid api key') || message.includes('invalid api')) {
                return { ok: false, reason: 'invalid API key' }
            }
            if (message.includes('rate limit') || message.includes('max rate limit')) {
                return { ok: false, reason: 'rate limit' }
            }
        }

        // Success criteria: status "1" and valid result
        if (data.status === '1' && Array.isArray(data.result) && data.result.length > 0) {
            // Check that contract is verified (not "Contract source code not verified")
            if (data.result[0].ABI && data.result[0].ABI !== 'Contract source code not verified') {
                return { ok: true }
            }
        }

        // If we get here, something unexpected happened
        return { ok: false, reason: data.message || 'unexpected response format' }
    } catch (err) {
        clearTimeout(timeoutId)
        if (controller.signal.aborted) {
            return { ok: false, reason: 'timeout' }
        }
        const reason = err instanceof Error ? err.message : String(err)
        return { ok: false, reason }
    }
}

async function main(): Promise<void> {
    const results: { name: string; status: 'pass' | 'fail'; reason?: string }[] = []

    for (const key of RPC_ENV_KEYS) {
        const name = envName(key)
        const value = process.env[name]?.trim()

        if (value === undefined || value === '') {
            results.push({ name, status: 'fail', reason: 'missing' })
            console.log(`${name}: fail — missing`)
            continue
        }

        if (!isValidHttpUrl(value)) {
            results.push({ name, status: 'fail', reason: 'invalid URL' })
            console.log(`${name}: fail — invalid URL`)
            continue
        }

        const check = await checkRpcUrl(value)
        if (check.ok) {
            results.push({ name, status: 'pass' })
            console.log(`${name}: success`)
        } else {
            results.push({ name, status: 'fail', reason: check.reason })
            console.log(`${name}: fail — ${check.reason}`)
        }
    }

    // Check Robinscan API key
    const robinscanApiKey = process.env.ROBINSCAN_API_KEY?.trim()
    if (robinscanApiKey === undefined || robinscanApiKey === '') {
        results.push({ name: 'ROBINSCAN_API_KEY', status: 'fail', reason: 'missing' })
        console.log(`ROBINSCAN_API_KEY: fail — missing`)
    } else {
        const check = await checkRobinscanApiKey(robinscanApiKey)
        if (check.ok) {
            results.push({ name: 'ROBINSCAN_API_KEY', status: 'pass' })
            console.log(`ROBINSCAN_API_KEY: success`)
        } else {
            results.push({ name: 'ROBINSCAN_API_KEY', status: 'fail', reason: check.reason })
            console.log(`ROBINSCAN_API_KEY: fail — ${check.reason}`)
        }
    }

    const passed = results.filter((r) => r.status === 'pass').length
    const failed = results.filter((r) => r.status === 'fail').length
    console.log('')
    console.log(`Summary: ${passed} passed, ${failed} failed`)
    if (failed > 0) {
        console.log('Failed:')
        results.filter((r) => r.status === 'fail').forEach((r) => console.log(`  ${r.name}`))
    }
}

main().catch((err) => {
    console.error(err)
    process.exit(1)
})

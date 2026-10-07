import { Address, Chain } from 'viem'
import { robinhood } from './customChains'

export function validateAndPrepareNetwork(networkName: string, rpcUrl: string): Chain {
    // Map network name to Chain object
    const networks: { [key: string]: Chain } = {
        robinhood,
    }

    let network = networks[networkName]

    if (!network) {
        throw new Error(`Unsupported network: ${networkName}`)
    }

    // Override the default RPC URL
    // Reason it must be an RPC URL that supports createAccessList
    network = {
        ...network,
        rpcUrls: {
            ...network.rpcUrls,
            default: {
                http: [rpcUrl],
            },
        },
    }

    return network
}

export function validateAddress(address: string, fieldName: string): Address {
    if (!address || !address.startsWith('0x')) {
        throw new Error(`Invalid ${fieldName}: ${address}. It must start with "0x".`)
    }
    return address as Address
}

export function validateInputData(
    rateProviderAddress: string,
    networkName: string,
    rateProviderAsset: string,
    rpcUrl: string,
): {
    rateProviderAddress: Address
    network: Chain
    rateProviderAsset: Address
    rpcUrl: string
} {
    if (!rateProviderAddress || !networkName || !rateProviderAsset || !rpcUrl) {
        throw new Error('All parameters are required: rateProviderAddress, network, rateProviderAsset, rpcUrl')
    }

    const validatedRateProviderAddress = validateAddress(rateProviderAddress, 'rateProviderAddress')
    const validatedRateProviderAsset = validateAddress(rateProviderAsset, 'rateProviderAsset')
    const validatedNetwork = validateAndPrepareNetwork(networkName, rpcUrl)

    return {
        rateProviderAddress: validatedRateProviderAddress,
        network: validatedNetwork,
        rateProviderAsset: validatedRateProviderAsset,
        rpcUrl,
    }
}

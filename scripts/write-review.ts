import * as dotenv from 'dotenv'
import yargs from 'yargs'
import { hideBin } from 'yargs/helpers'
import { Address } from 'viem'

import { Chain } from 'viem'

import { robinhood } from '../src/utils/customChains'
import { writeReviewAndUpdateRegistry } from '../src/utils/write-rp-review'

dotenv.config()
const fs = require('fs')

// to use this script use the command below
// for network see the viem chains
// Important: The custom RPC URL in the .env must support createAccessList (or the viem default rpc url)
// npm run write-review -- --rateProviderAddress <address> --network <network> --rateProviderAsset <asset> [--rpc-url <rpcUrl>]

// Parse command-line arguments using yargs
async function main() {
    const argv = await yargs(hideBin(process.argv))
        .option('rateProviderAddress', {
            alias: 'r',
            type: 'string',
            description: 'The address of the rate provider',
            demandOption: true,
        })
        .option('network', {
            alias: 'n',
            type: 'string',
            description: 'The network the rate provider is deployed on',
            choices: ['robinhood'],
            default: 'robinhood',
        })
        .option('rateProviderAsset', {
            alias: 'a',
            type: 'string',
            description: 'The asset the rate provider provides the rate for',
            demandOption: true,
        })
        .option('rpc-url', {
            alias: 'u',
            type: 'string',
            description: 'The RPC URL to use for the network (must support eth_createAccessList)',
            default: process.env.ROBINHOOD_RPC_URL,
            defaultDescription: 'ROBINHOOD_RPC_URL from .env',
        })
        .check((argv) => {
            if (!argv.rpcUrl) throw new Error('No RPC URL: pass --rpc-url or set ROBINHOOD_RPC_URL in .env')
            return true
        }).argv

    // Map network name to Chain object
    const networks: { [key: string]: Chain } = {
        robinhood,
    }

    let network = networks[argv.network]

    if (!network) {
        console.error(`Unsupported network: ${argv.network}`)
        process.exit(1)
    }

    // Override the default RPC URL
    // Reason it must be an RPC URL that supports createAccessList
    network = {
        ...network,
        rpcUrls: {
            ...network.rpcUrls,
            default: {
                http: [argv.rpcUrl as string],
            },
        },
    }

    const rateProviderAddress = argv.rateProviderAddress.startsWith('0x')
        ? (argv.rateProviderAddress as Address)
        : (() => {
              throw new Error(`Invalid rateProviderAddress: ${argv.rateProviderAddress}. It must start with "0x".`)
          })()

    const rateProviderAsset = argv.rateProviderAsset.startsWith('0x')
        ? (argv.rateProviderAsset as Address)
        : (() => {
              throw new Error(`Invalid rateProviderAsset: ${argv.rateProviderAsset}. It must start with "0x".`)
          })()

    await writeReviewAndUpdateRegistry(rateProviderAddress, network, rateProviderAsset, argv.rpcUrl as string)
}

main().catch((error) => {
    console.error(error)
    process.exit(1)
})

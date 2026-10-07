import * as dotenv from 'dotenv'
import yargs from 'yargs'
import { hideBin } from 'yargs/helpers'
import { Address } from 'viem'

import { Chain } from 'viem'

import { robinhood } from '../src/utils/customChains'
import { writeReviewAndUpdateRegistry } from '../src/utils/write-erc4626-review'

dotenv.config()

// to use this script use the command below
// for network see the viem chains
// Important: The custom RPC URL in the .env must support createAccessList (or the viem default rpc url)
// npm run write-erc4626-review -- --erc4626Address <address> --rpcUrl <custom rpc url>

// Parse command-line arguments using yargs
async function main() {
    const argv = await yargs(hideBin(process.argv))
        .option('erc4626Address', {
            alias: 'r',
            type: 'string',
            description: 'The address of the erc4626',
            demandOption: true,
        })
        .option('network', {
            alias: 'n',
            type: 'string',
            description: 'The network the rate provider is deployed on',
            choices: ['robinhood'],
            default: 'robinhood',
        })
        .option('rpcUrl', {
            alias: 'u',
            type: 'string',
            description: 'The custom RPC URL to use for the network',
            demandOption: true,
        })
        .option('linkToAudits', { type: 'string', description: 'Link to the audits of the vault' })
        .option('docs', { type: 'string', description: 'Text snippet describing what the vault does' })
        .option('linkToForkTests', { type: 'string', description: 'Link to passing fork tests' })
        .option('canUseBufferForSwaps', { type: 'boolean', default: false })
        .option('useUnderlyingForAddRemove', { type: 'boolean', default: false })
        .option('useWrappedForAddRemove', { type: 'boolean', default: false }).argv

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
                http: [argv.rpcUrl],
            },
        },
    }

    const erc4626Address = argv.erc4626Address.startsWith('0x')
        ? (argv.erc4626Address as Address)
        : (() => {
              throw new Error(`Invalid erc4626Address: ${argv.erc4626Address}. It must start with "0x".`)
          })()

    await writeReviewAndUpdateRegistry(
        erc4626Address,
        network,
        argv.rpcUrl,
        argv.linkToAudits,
        argv.docs,
        argv.linkToForkTests,
        argv.linkToForkTests,
        argv.canUseBufferForSwaps,
        argv.useUnderlyingForAddRemove,
        argv.useWrappedForAddRemove,
    )
}

main().catch((error) => {
    console.error(error)
    process.exit(1)
})

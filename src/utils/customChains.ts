import { defineChain } from 'viem'

export const robinhood = /*#__PURE__*/ defineChain({
    id: 4663,
    name: 'Robinhood',
    nativeCurrency: {
        name: 'Ether',
        symbol: 'ETH',
        decimals: 18,
    },
    rpcUrls: {
        default: {
            http: ['https://rpc.mainnet.chain.robinhood.com'],
        },
    },
    blockExplorers: {
        default: {
            name: 'Robinscan',
            url: 'https://robin.etherscan.io',
            apiUrl: 'https://api.etherscan.io/v2/api?chainid=4663',
        },
    },
    contracts: {
        multicall3: {
            address: '0xcA11bde05977b3631167028862bE2a173976CA11',
        },
    },
})

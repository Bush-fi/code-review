import { Chain } from 'viem'
import EtherscanApi from '../services/etherscanApi'

export const createChainApi = (chain: Chain) => {
    return new EtherscanApi(chain, process.env.ROBINSCAN_API_KEY || '')
}

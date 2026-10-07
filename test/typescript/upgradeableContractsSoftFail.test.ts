import { Address } from 'viem'
import { robinhood } from '../../src/utils/customChains'
import RateProviderDataService from '../../src/app'

describe('RateProviderDataService.getUpgradeableContracts soft-fail', () => {
    const rateProvider = '0x586d1D28D5F8aeD81dA8AEf7016c4108f7A4ce51' as Address
    const implementation = '0xb3201cde011873f604bf3f9be6bf3570ecc29b23' as Address

    beforeEach(() => {
        process.env.ROBINSCAN_API_KEY = 'test-robinscan-key'
    })

    afterEach(() => {
        jest.restoreAllMocks()
    })

    it('returns proxies with wasUpgraded=null when deployment lookup fails', async () => {
        const service = new RateProviderDataService(rateProvider, robinhood)
        service.accessList = {
            accessList: [{ address: rateProvider, storageKeys: [] }],
            gasUsed: 0n,
        }

        jest.spyOn(service, 'getContractInfo').mockResolvedValue([
            {
                address: rateProvider,
                Proxy: '1',
                ContractName: 'HilbertBTCRateProvider',
                ABI: '[]',
                Implementation: implementation,
            },
        ])
        jest.spyOn(service, 'getDeploymentBlocks').mockRejectedValue(new Error('Robinscan 500'))
        jest.spyOn(console, 'warn').mockImplementation(() => undefined)

        await expect(service.getUpgradeableContracts()).resolves.toEqual([
            {
                address: rateProvider,
                wasUpgraded: null,
                implementation,
            },
        ])
    })
})

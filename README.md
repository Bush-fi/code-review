# bush.fi code-review

A collection of smart contract code reviews for bush.fi integrations, performed upon friendly request.

NOTHING IN THIS REPOSITORY CONSTITUTES A FORMAL AUDIT, AND CODE SHOULD NEVER BE DEPLOYED TO PRODUCTION WITHOUT A FORMAL AUDIT. REVIEWERS ARE HUMAN; MISTAKES WILL BE MADE AND BUGS MISSED. REVIEWERS ARE NOT LIABLE FOR ANY INCIDENT THAT OCCURS POST-REVIEW. THIS IS MERELY A FRIENDLY PEER-REVIEW SERVICE AND SHOULD NOT BE TREATED AS A STAMP OF APPROVAL. REVIEWED CODE IS NOT NECESSARILY BUG-FREE. ALWAYS TRIPLE-CHECK BEFORE INTERACTING WITH SMART CONTRACTS, AND DO NOT TRUST REVIEWERS ON THE BASIS OF REPUTATION ALONE.

Reviews live in:

- [`rate-providers/`](rate-providers/): rate provider reviews, indexed in `rate-providers/registry.json`
- [`erc4626/`](erc4626/): ERC4626 vault reviews, indexed in `erc4626/registry.json`
- [`hooks/`](hooks/): hook reviews, indexed in `hooks/registry.json`

Each directory has a `template.md` to start a manual review from.

---

## Setup

1. **Install dependencies:**
    ```sh
    npm install
    ```

2. **Set up environment variables:**
    Create a .env file in the root directory and add the necessary environment variables. You can use the .env.example file as a reference.

    ```sh
    cp .env.example .env
    ```

    ### Essential Environment Variables:
    - **`ROBINSCAN_API_KEY`**: Your Robinscan (Etherscan V2) API key.
    - **`ROBINHOOD_RPC_URL`**: A Robinhood Chain RPC that supports `eth_createAccessList` (the public RPC does not).

---

## Testing

1. **Run tests:**
    ```sh
    npm test
    ```

---

## Scripts

The following scripts are available in the package.json file:

- **`npm run test`**: Runs the test suite.
- **`npm run lint`**: Lints the registry.
- **`npm run write-review`**: Generates the rate-provider review.

---

## Running Scripts

All scripts target Robinhood Chain (chain ID 4663) and read the RPC from `ROBINHOOD_RPC_URL` in `.env`. Pass `--rpc-url <url>` to override it for a single run. The RPC must support `eth_createAccessList`.

### `npm run write-review`

Generates a rate provider review, writes the markdown report to `rate-providers/` and updates `rate-providers/registry.json`.

```sh
npm run write-review -- --rateProviderAddress <address> --rateProviderAsset <asset> [--rpc-url <url>]
```

### `npm run write-erc4626-review`

Generates an ERC4626 vault review, writes the markdown report to `erc4626/`, and updates `erc4626/registry.json`.

```sh
npm run write-erc4626-review -- --erc4626Address <address> [--rpc-url <url>] \
    [--linkToAudits <url>] [--docs <text>] [--linkToForkTests <url>] \
    [--canUseBufferForSwaps] [--useUnderlyingForAddRemove] [--useWrappedForAddRemove]
```

---

## Output

The `write-review` script does the following:
1. Updates the `registry.json` file with rate provider information.
2. Generates a markdown review report.

### Post-Script Actions:
Before the review is finalized, the user is expected to:
- Add context about the rate provider in the generated markdown file.
- Include audit reports (if available).
- Optionally rename the review file and update the `name` and `review` fields in the registry.

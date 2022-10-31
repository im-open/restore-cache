# restore-cache

This is a fork of [martijnhols/actions-cache] at version 3.0.4 but only contains a slimmed down version of the [restore] action.  

This action will restore a cache but will not save the cache in a post-job step. 

If you need an action that saves a cache, check out the official [actions/cache] action.

## Index

- [Inputs](#inputs)
- [Outputs](#outputs)
- [Usage Examples](#usage-examples)
- [Contributing](#contributing)
  - [Recompiling](#recompiling)
  - [Incrementing the Version](#incrementing-the-version)
- [Code of Conduct](#code-of-conduct)
- [License](#license)

## Inputs

| Parameter      | Is Required | Description                                                                                                                             |
| -------------- | ----------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| `path`         | true        | The list of files, directories and wildcard patterns that were used when saving the cache.                                              |
| `key`          | true        | The key for the cache to check.                                                                                                         |
| `restore-keys` | true        | An ordered list of keys to use for restoring stale cache if no cache hit occurred for key. Note `cache-hit` returns false in this case. |
| `required`     | false       | Flag indicating whether the action should fail on a cache miss.  Defaults to `false`.                                                   |

## Outputs

| Output        | Description                                                        | Possible Values |
| ------------- | ------------------------------------------------------------------ | --------------- |
| `cache-hit`   | Flag indicating whether an exact match was found for the cache key | `true,false`    |
| `primary-key` | The primary key that should be used when saving the cache.         |                 |

## Usage Examples

```yml

jobs:
  setup-caches:
    runs-on: ubuntu-20.04
    outputs:
      NPM_CACHE_KEY: ${{ env.NPM_CACHE_KEY }}
      HAS_NPM_CACHE: ${{ steps.has-npm-cache.outputs.cache-hit }}
      
    steps:
      - uses: actions/checkout@v3
        
      - name: Set Cache Keys
        run: echo "NPM_CACHE_KEY=node_modules-${{ hashFiles('package-lock.json', '**/package-lock.json') }}" >> $GITHUB_ENV
          
      - name: Check for an npm cache
        id: has-npm-cache
        uses: im-open/check-for-cache@v1.1.0
        with:
          paths:  '**/node_modules'
          key: ${{ env.NPM_CACHE_KEY }}
      
  create-npm-cache:
    runs-on: ubuntu-20.04
    needs: [ setup-caches ]
    if: needs.setup-caches.outputs.HAS_NPM_CACHE == 'false'
    steps:
      - uses: actions/checkout@v3
        
      # This action will upload the node_modules dir to the cache if the job completes successfully.
      # Subsequent jobs/workflow runs can use this cached copy if the package-lock.json hasn't changed
      # and they are also using a ubuntu-20.04 runner to restore the cache from.
      - name: Setup caching for node_modules directory
        uses: actions/cache@v2
        id: module-cache
        with:
          key: ${{ needs.set-cache-keys.outputs.NPM_MODULES_CACHE_KEY }}
          path: '**/node_modules'

      - run: npm ci
  
  jest:
    runs-on: ubuntu-20.04
    needs: [ setup-caches, create-npm-cache ]
    steps:
      - uses: actions/checkout@v3
        
      - name: Download the node_modules folder from the cache
        id: get-cached-node-modules
        uses: im-open/restore-cache@v1.1.1
        with:
          key: ${{ needs.set-cache-keys.outputs.NPM_MODULES_CACHE_KEY }}
          path: '**/node_modules'

      - name: Rebuild Node Modules
        run: npm rebuild

      - name: jest test with coverage
        run: npm test -- --json --outputFile=jest-results.json --coverage
      
    
```

## Contributing

When creating new PRs please ensure:
1. The action has been recompiled.  See the [Recompiling](#recompiling) section below for more details.
2. For major or minor changes, at least one of the commit messages contains the appropriate `+semver:` keywords listed under [Incrementing the Version](#incrementing-the-version).
3. The `README.md` example has been updated with the new version.  See [Incrementing the Version](#incrementing-the-version).
4. The action code does not contain sensitive information.

### Recompiling

If changes are made to the action's code in this repository, or its dependencies, you will need to re-compile the action.

```sh
# Installs dependencies and bundles the code
npm run build

# Bundle the code (if dependencies are already installed)
npm run bundle
```

These commands utilize [ncc](https://github.com/vercel/ncc) to bundle the action and its dependencies into a single file located in the `dist` folder.

### Incrementing the Version

This action uses [git-version-lite] to examine commit messages to determine whether to perform a major, minor or patch increment on merge.  The following table provides the fragment that should be included in a commit message to active different increment strategies.
| Increment Type | Commit Message Fragment                     |
| -------------- | ------------------------------------------- |
| major          | +semver:breaking                            |
| major          | +semver:major                               |
| minor          | +semver:feature                             |
| minor          | +semver:minor                               |
| patch          | *default increment type, no comment needed* |

## Code of Conduct

This project has adopted the [im-open's Code of Conduct](https://github.com/im-open/.github/blob/main/CODE_OF_CONDUCT.md).

## License

Copyright &copy; 2022, Extend Health, LLC. Code released under the [MIT license](LICENSE).

[git-version-lite]: https://github.com/im-open/git-version-lite
[actions/cache]: https://github.com/actions/cache
[restore]: https://github.com/MartijnHols/actions-cache/blob/main/restore/action.yml
[martijnhols/actions-cache]: https://github.com/MartijnHols/actions-cache
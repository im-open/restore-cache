# restore-cache

This is a fork of [martijnhols/actions-cache] at version 3.0.4 but only contains a slimmed down version of the [restore] action.

This action will restore a cache but will not save the cache in a post-job step.

If you need an action that saves a cache, check out the official [actions/cache] action.

## Index <!-- omit in toc -->

- [restore-cache](#restore-cache)
  - [Inputs](#inputs)
  - [Outputs](#outputs)
  - [Usage Examples](#usage-examples)
  - [Contributing](#contributing)
    - [Incrementing the Version](#incrementing-the-version)
    - [Source Code Changes](#source-code-changes)
    - [Recompiling Manually](#recompiling-manually)
    - [Updating the README.md](#updating-the-readmemd)
    - [Tests](#tests)
  - [Code of Conduct](#code-of-conduct)
  - [License](#license)

## Inputs

| Parameter      | Is Required | Description                                                                                                                             |
|----------------|-------------|-----------------------------------------------------------------------------------------------------------------------------------------|
| `path`         | true        | The list of files, directories and wildcard patterns that were used when saving the cache.                                              |
| `key`          | true        | The key for the cache to check.                                                                                                         |
| `restore-keys` | true        | An ordered list of keys to use for restoring stale cache if no cache hit occurred for key. Note `cache-hit` returns false in this case. |
| `required`     | false       | Flag indicating whether the action should fail on a cache miss.  Defaults to `false`.                                                   |

## Outputs

| Output        | Description                                                        | Possible Values |
|---------------|--------------------------------------------------------------------|-----------------|
| `cache-hit`   | Flag indicating whether an exact match was found for the cache key | `true,false`    |
| `primary-key` | The primary key that should be used when saving the cache.         |                 |

## Usage Examples

```yml

jobs:
  npm-cache:
    runs-on: ubuntu-20.04
    outputs:
      NPM_CACHE_KEY: ${{ env.NPM_CACHE_KEY }}

    steps:
      - uses: actions/checkout@v4

      - name: Set Cache Keys
        run: echo "NPM_CACHE_KEY=node_modules-${{ hashFiles('**/package-lock.json') }}" >> $GITHUB_ENV

      - name: Check for an npm cache
        id: has-cache
        uses: actions/cache@v4
        with:
          path: '**/node_modules'
          key: ${{ env.NPM_CACHE_KEY }}
          lookup-only: true
          enableCrossOsArchive: true

      # This action will upload the node_modules dir to the cache if the job completes successfully.
      # Subsequent jobs/workflow runs can use this cached copy if the package-lock.json hasn't changed
      # and they are also using a ubuntu-20.04 runner to restore the cache from.
      - name: Setup caching for node_modules directory if cache does not exist
        if: steps.has-cache.outputs.cache-hit != 'true'
        uses: actions/cache@v4
        with:
          key: ${{ env.NPM_CACHE_KEY }}
          path: '**/node_modules'
          enableCrossOsArchive: true

      - name: npm ci if cache does not exist
        if: steps.has-cache.outputs.cache-hit != 'true'
        run: npm ci

  jest:
    runs-on: ubuntu-20.04
    needs: [ npm-cache ]
    steps:
      - uses: actions/checkout@v4

      - name: Download npm cache
        uses: im-open/restore-cache@v1.3.0
        with:
          key: ${{ needs.npm-cache.outputs.NPM_CACHE_KEY }}
          path: '**/node_modules'

      - name: Rebuild Node Modules
        run: npm rebuild

      - name: jest test with coverage
        run: npm test -- --json --outputFile=jest-results.json --coverage


```

## Contributing

When creating PRs, please review the following guidelines:

- [ ] The action code does not contain sensitive information.
- [ ] At least one of the commit messages contains the appropriate `+semver:` keywords listed under [Incrementing the Version] for major and minor increments.
- [ ] The action has been recompiled.  See [Recompiling Manually] for details.
- [ ] The README.md has been updated with the latest version of the action.  See [Updating the README.md] for details.
- [ ] Any tests in the [build-and-review-pr] workflow are passing

### Incrementing the Version

This repo uses [git-version-lite] in its workflows to examine commit messages to determine whether to perform a major, minor or patch increment on merge if [source code] changes have been made.  The following table provides the fragment that should be included in a commit message to active different increment strategies.

| Increment Type | Commit Message Fragment                     |
|----------------|---------------------------------------------|
| major          | +semver:breaking                            |
| major          | +semver:major                               |
| minor          | +semver:feature                             |
| minor          | +semver:minor                               |
| patch          | *default increment type, no comment needed* |

### Source Code Changes

The files and directories that are considered source code are listed in the `files-with-code` and `dirs-with-code` arguments in both the [build-and-review-pr] and [increment-version-on-merge] workflows.

If a PR contains source code changes, the README.md should be updated with the latest action version and the action should be recompiled.  The [build-and-review-pr] workflow will ensure these steps are performed when they are required.  The workflow will provide instructions for completing these steps if the PR Author does not initially complete them.

If a PR consists solely of non-source code changes like changes to the `README.md` or workflows under `./.github/workflows`, version updates and recompiles do not need to be performed.

### Recompiling Manually

This command utilizes [esbuild] to bundle the action and its dependencies into a single file located in the `dist` folder.  If changes are made to the action's [source code], the action must be recompiled by running the following command:

```sh
# Installs dependencies and bundles the code
npm run build
```

### Updating the README.md

If changes are made to the action's [source code], the [usage examples] section of this file should be updated with the next version of the action.  Each instance of this action should be updated.  This helps users know what the latest tag is without having to navigate to the Tags page of the repository.  See [Incrementing the Version] for details on how to determine what the next version will be or consult the first workflow run for the PR which will also calculate the next version.

### Tests

The build and review PR workflow includes tests which are linked to a status check. That status check needs to succeed before a PR is merged to the default branch.  The tests do not need special permissions, so they should succeed whether they come from a branch or a fork.

## Code of Conduct

This project has adopted the [im-open's Code of Conduct](https://github.com/im-open/.github/blob/main/CODE_OF_CONDUCT.md).

## License

Copyright &copy; 2023, Extend Health, LLC. Code released under the [MIT license](LICENSE).

<!-- Links -->
[Incrementing the Version]: #incrementing-the-version
[Recompiling Manually]: #recompiling-manually
[Updating the README.md]: #updating-the-readmemd
[source code]: #source-code-changes
[usage examples]: #usage-examples
[build-and-review-pr]: ./.github/workflows/build-and-review-pr.yml
[increment-version-on-merge]: ./.github/workflows/increment-version-on-merge.yml
[esbuild]: https://esbuild.github.io/getting-started/#bundling-for-node
[git-version-lite]: https://github.com/im-open/git-version-lite
[actions/cache]: https://github.com/actions/cache
[restore]: https://github.com/MartijnHols/actions-cache/blob/main/restore/action.yml
[martijnhols/actions-cache]: https://github.com/MartijnHols/actions-cache

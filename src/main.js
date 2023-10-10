import * as core from '@actions/core';
import * as cache from '@actions/cache';

function getInputAsArray(name, options) {
  return core
    .getInput(name, options)
    .split('\n')
    .map(s => s.trim())
    .filter(x => x !== '');
}

function isExactKeyMatch(key, cacheKey) {
  return !!(cacheKey && cacheKey.localeCompare(key, undefined, { sensitivity: 'accent' }) === 0);
}

async function run() {
  try {
    // When used, this requiredArgOptions will cause the action to error if a value has not been provided.
    const requiredArgOptions = {
      required: true,
      trimWhitespace: true
    };

    const primaryKey = core.getInput('key', requiredArgOptions);
    core.saveState('CACHE_KEY', primaryKey);
    core.setOutput('primary-key', primaryKey);

    const restoreKeys = getInputAsArray('restore-keys', null);
    const cachePaths = getInputAsArray('path', requiredArgOptions);
    const isCacheRequired = core.getBooleanInput('required');

    try {
      const cacheKey = await cache.restoreCache(cachePaths, primaryKey, restoreKeys);
      if (!cacheKey) {
        const message = `Cache not found for input keys: ${[primaryKey, ...restoreKeys].join(
          ', '
        )}`;

        if (isCacheRequired) {
          throw new Error(message);
        } else {
          core.info(message);
          core.setOutput('cache-hit', false);
          return;
        }
      }

      // Store the matched cache key
      core.saveState('CACHE_RESULT', cacheKey);

      const exactMatch = isExactKeyMatch(primaryKey, cacheKey);
      core.setOutput('cache-hit', exactMatch);

      core.info(`Cache restored from key: ${cacheKey}`);
      return;
    } catch (error) {
      // When cache is not required, any non-input failures (such as network
      // failures) are allowed so they don't unnecessarily hold up the job

      if (isCacheRequired) {
        throw error;
      } else {
        if (error.name === cache.ValidationError.name) {
          throw error;
        } else {
          core.info(`[warning]${error.message}`);
          core.setOutput('cache-hit', false);
        }
      }

      return;
    }
  } catch (error) {
    core.setFailed(error.message);
  }
}

run();

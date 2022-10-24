/**
 * Data loader mode.
 * 
 * This is a fallback mode and must only be added
 * to the list of modes at the very end, as it will
 * handle any URL not recognized by any of the other
 * modes, and simply return a Promise.
 * 
 * This mode only works in an environment with
 * the `fetch()` API available.
 * 
 * @module @lumjs/simple-loader/modes/data
 */

const {F} = require('@lumjs/core').types;
const 
{
  isStr, optObj, TEST_MSGS: TM, needFetch, getLoaderOpts, getUrl,
} = require('../loader');

exports.name = 'data';

exports.defaults =
{
  dataPrefix: '',
  dataSuffix: '',
  fetch: null,
}

exports.validators =
{
  dataPrefix: isStr,
  dataSuffix: isStr,
  fetch: optObj,
}

const MUST = 'Must be ';

exports.validationMsgs =
{
  dataPrefix: MUST+TM.isStr,
  dataSuffix: MUST+TM.isStr,
  fetch: MUST+TM.optObj,
}

exports.autoProps = ['mode', 'func'];

// This is a fallback mode, so it handles everything.
exports.handles = function() { return true; }

exports.load = function ()
{
  needFetch();

  const opts = getLoaderOpts(this, arguments, 'fetch');

  const loaded = this.context.loaded.data;
  const cache  = this.context.metadata.data;

  const prefix = opts.dataPrefix || '';
  const suffix = opts.dataSuffix || '';

  const url = getUrl(opts, prefix, suffix);

  if (loaded.includes(url)) 
  { // Already loaded.
    return Promise.resolve(cache[url]);
  }

  const init = opts.fetch ?? {};

  const promise = fetch(url, init);

  return promise.then(function(response)
  {
    loaded.push(url);
    cache[url] = response;
    return (
      (typeof opts.func === F) 
      ? opts.func.call(opts, response, true) 
      : response
    );
  }, 
  function(err)
  {
    return (
      (typeof opts.func === F)
      ? opts.func.call(opts, err, false)
      : err
    );
  });

}

/**
 * HTML loader mode.
 * 
 * Will auto-handle urls ending in `.html`
 * 
 * This mode only works in a browser Window context.
 * It also requires the `fetch()` API.
 * 
 * @module @lumjs/simple-loader/modes/html
 */

const {F} = require('@lumjs/core').types;
const 
{
  ctx, isBool, isStr, isNum, TEST_MSGS: TM, needFetch, dom, getLoaderOpts, optObj,
} = require('../loader');

exports.name = 'html';

exports.defaults =
{
  htmlPrefix: '',
  htmlSuffix: '',
  htmlExtend: false,
  htmlMode: null,
  fetch: null,
}

exports.validators =
{
  htmlPrefix: isStr,
  htmlSuffix: isStr,
  htmlExtend: isBool,
  htmlMode: isNum,
  fetch: optObj,
}

const MUST = 'Must be ';

exports.validationMsgs =
{
  htmlPrefix: MUST+TM.isStr,
  htmlSuffix: MUST+TM.isStr,
  htmlExtend: MUST+TM.isBool,
  htmlMode: MUST+TM.isNum,
  fetch: MUST+TM.optObj,
}

exports.autoProps = ['mode', 'func', 'target'];

exports.handles = function(url)
{
  return url.endsWith('.html');
}

exports.load = function ()
{
  needFetch();

  const opts = getLoaderOpts(this, arguments, 'fetch');

  const loaded = this.context.loaded.html;
  const cache  = this.context.metadata.html;

  const prefix = opts.dataPrefix || '';
  const suffix = opts.dataSuffix || '';

  const url = prefix + opts.url + suffix;

  if (loaded.includes(url))
  { // Already loaded
    return Promise.resolve(cache[url]);
  }

  const init = opts.fetch ?? {};

  let promise = fetch(url, init).then(function(res)
  { // A successful fetch, get the response text.
    return res.text();
  });

  if (ctx.isWindow)
  { // A few things specific to a Window context.
    if (opts.target instanceof Element)
    { // Set the element HTML to the loaded text.
      const target = opts.target;
      promise = promise.then(function(htmlText)
      {
        target.innerHTML = htmlText;
        return target;
      });
    }
    else
    { // Parse the HTML text into an HTML document.
      const extend = opts.htmlExtend ?? false;
      const mode   = opts.htmlMode   ?? 0;
      promise = promise.then(function(htmlText)
      {
        dom.options.extendQueries = extend;
        return dom.html(htmlText, mode);
      });
    }
  }

  return promise.then(function(data)
  {
    loaded.push(url);
    cache[url] = data;
    return (
      (typeof opts.func === F) 
      ? opts.func.call(opts, data, true) 
      : data
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

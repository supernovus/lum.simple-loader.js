/**
 * CSS loader mode.
 *  
 * Will auto-handle urls ending in `.css`
 * 
 * This mode only works in a browser Window context.
 * 
 * @module @lumjs/simple-loader/modes/css
 */
const {isObj,F} = require('@lumjs/core').types;
const 
{
  ctx, isStr, TEST_MSGS: TM, dom, getLoaderOpts, getUrl,
} = require('../loader');

exports.name = 'css';

exports.defaults =
{
  cssPrefix: '',
  cssSuffix: '',
  linkProps: {},
  linkAttrs: {},
}

exports.validators =
{
  cssPrefix: isStr,
  cssSuffix: isStr,
  linkProps: isObj,
  linkAttrs: isObj,
}

const MUST = 'Must be ';

exports.validationMsgs =
{
  cssPrefix: MUST+TM.isStr,
  cssSuffix: MUST+TM.isStr,
  linkProps: MUST+TM.isObj,
  linkAttrs: MUST+TM.isObj,
}

exports.handles = function(url)
{
  return url.endsWith('.css');
}

exports.load = function ()
{
  // TODO: support usePromise in a few forms.

  if (ctx.isWindow)
  {
    const opts = getLoaderOpts(this, arguments, 'linkProps', 'linkAttrs');

    const loaded = this.context.loaded.css;

    const prefix = opts.cssPrefix || '';
    const suffix = opts.cssSuffix || '';

    const url = getUrl(opts, prefix, suffix);

    if (loaded.includes(url))
    { // Nothing more to do here.
      return this;
    }

    const link = dom.elem('link');
    if (isObj(opts.linkProps))
    {
      for (const prop in opts.linkProps)
      {
        link[prop] = opts.linkProps[prop];
      }
    }
    if (isObj(opts.linkAttrs))
    {
      for (const attr in opts.linkAttrs)
      {
        link.setAttribute(attr, opts.linkAttrs[attr]);
      }
    }
    link.rel = 'stylesheet';
    link.type = 'text/css';
    if (typeof opts.func === F)
    {
      link.$lumLoadOptions = opts;
      if (opts.useOnLoad)
        link.onload = opts.func;
      if (opts.useReadyState)
        link.onreadystatechange = opts.func;
    }
    link.href = url;
    opts.loc.appendChild(link);
    if (typeof opts.func === F && !opts.useOnLoad && !opts.useReadyState)
    {
      opts.func.call(opts, link);
    }

    loaded.push(url);
  }
  else 
  {
    console.error("load.css() is not supported in this context", 
      arguments, this, ctx);
  }

  return this;
}
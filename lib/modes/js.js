/**
 * Javascript loader mode.
 * 
 * Will auto-handle urls ending in `.js`
 * 
 * @module @lumjs/simple-loader/modes/js
 */

"use strict";

const {isObj,F} = require('@lumjs/core').types;
const 
{
  ctx, isStr, TEST_MSGS: TM, getLoaderOpts, getUrl,
} = require('../loader');

exports.name = 'js';

exports.defaults =
{
  jsPrefix: '',
  jsSuffix: '',
  scriptProps: {},
  scriptAttrs: {},
}

exports.validators =
{
  jsPrefix: isStr,
  jsSuffix: isStr,
  scriptProps: isObj,
  scriptAttrs: isObj,
}

const MUST = 'Must be ';

exports.validationMsgs =
{
  jsPrefix: MUST+TM.isStr,
  jsSuffix: MUST+TM.isStr,
  scriptProps: MUST+TM.isObj,
  scriptAttrs: MUST+TM.isObj,
}

exports.handles = function(url)
{
  return url.endsWith('.js');
}

exports.load = function ()
{ 
  const opts = getLoaderOpts(this, arguments, 'scriptProps', 'scriptAttrs');

  const loaded = this.context.loaded.js;

  const prefix = opts.jsPrefix || '';
  const suffix = opts.jsSuffix || '';

  const url = getUrl(opts, prefix, suffix);

  console.debug("js.load", {url});

  if (loaded.includes(url))
  { // Nothing more to do here.
    return this;
  }

  if (ctx.isWindow)
  {
    const script = document.createElement('script');
    if (isObj(opts.scriptProps))
    {
      for (const prop in opts.scriptProps)
      {
        script[prop] = opts.scriptProps[prop];
      }
    }
    if (isObj(opts.scriptAttrs))
    {
      for (const attr in opts.scriptAttrs)
      {
        script.setAttribute(attr, opts.scriptAttrs[attr]);
      }
    }
    if (typeof opts.func === F)
    {
      script.$lumLoadOptions = opts;
      if (opts.useOnLoad)
        script.onload = opts.func;
      if (opts.useReadyState)
        script.onreadystatechange = opts.func;
    }
    script.src = url;
    opts.loc.appendChild(script);
    if (typeof opts.func === F && !opts.useOnLoad && !opts.useReadyState)
    {
      opts.func.call(opts);
    }
  }
  else if (ctx.isWorker)
  { // A Worker or ServiceWorker.
    self.importScripts(url);
    if (typeof opts.func === F)
    {
      opts.func.call(opts);
    }
  }
  else if (ctx.isNode)
  { // Node works differently.
    const cache = this.context.metadata.js;
    const lib = cache[url] = require(url);
    if (typeof opts.func  === F)
    {
      opts.func.call(opts, lib);
    }
  }
  else 
  {
    console.error("load.js() is not supported in this context", 
      arguments, this, ctx);
  }

  loaded.push(url);

  return this;
}

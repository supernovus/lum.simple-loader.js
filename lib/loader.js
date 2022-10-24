const core = require('@lumjs/core');
const ctx = core.context;
const 
{
  U, S, F, B, N,
  isObj, isNil, isArray,
  def,
} = core.types;

const {copyProps} = core.obj;

// Re-export the context.
exports.ctx = ctx;

/**
 * Module defining the core loader framework.
 * @module @lumjs/simple-loader/loader
 */

/**
 * The name of the built-in default mode.
 * @alias module:@lumjs/simple-loader/loader.AUTO
 */
const AUTO = exports.AUTO = 'auto';

/**
 * A DOM helper.
 * 
 * Only used in a browser window context.
 * In any other context, this will be `null`.
 * 
 * @type {module:@lumjs/dom}
 * @alias module:@lumjs/simple-loader/loader.dom
 */
exports.dom 
  = ctx.isWindow 
  ? require('@lumjs/dom').new() 
  : null;

/**
 * Check for an optional array value.
 * @param {*} val 
 * @returns {boolean}
 * @alias module:@lumjs/simple-loader/loader.dom
 */
const optArr = exports.optArr = val => (isNil(val) || isArray(val));

/**
 * Check for an optional object value.
 * @param {*} val 
 * @returns {boolean}
 * @alias module:@lumjs/simple-loader/loader.dom
 */
const optObj = exports.optObj = val => (isNil(val) || isObj(val));

const isBool = exports.isBool = val => (typeof val === B);
exports.isStr = val => (typeof val === S);
exports.isNum = val => (typeof val === N);

const TEST_MSGS = exports.TEST_MSGS =
{
  isObj: 'an object',
  isArray: 'an array',
  isStr: 'a string',
  isBool: 'a boolean',
  isNum: 'a number',
  optArr: 'an array, or null',
  optObj: 'an object, or null',
}

function runTest(value, test)
{
  let type;
  let ok;

  if (typeof test === S)
  { // A simple type test.
    type = 'a ' + S;
    ok = (typeof value === test);
  }
  else if (typeof test === F)
  {
    type = TEST_MSGS[test.name] ?? test.name;
    ok = test(value);
  }

  return {ok, type};
}
exports.runTest = runTest;

/**
 * Ensure an object implements the `mode` interface.
 * 
 * @param {object} mode - Object to check
 * @param {boolean} [fatal=false] Throw an error on failure?
 * 
 * If `true` the error will describe why the check failed.
 * 
 * @returns {boolean} 
 * 
 * @alias module:@lumjs/simple-loader/loader.checkMode
 */
function checkMode(mode, fatal=false)
{
  function check(prop, test)
  {
    const value = prop ? mode[prop] : mode;
    const name  = prop ? 'mode.'+prop : 'mode';

    const {ok,type} = runTest(value, test);

    if (!ok)
    {
      if (fatal) throw new TypeError(`${name} must be ${type}`);
      return false;
    }

    return true;
  }

  if (!check(null, isObj)) return false;
  if (!check('name', S)) return false;
  if (!check('load', F)) return false;
  if (!check('handles', F)) return false;
  if (!check('autoProps', optArr)) return false;
  if (!check('defaults', optObj)) return false;
  if (!check('defaultOpts', optArr)) return false;
  if (!check('validators', optObj)) return false;
  if (!check('validationMsgs', optObj)) return false;

  // If we reached here, all is good.
  return true;
}
exports.checkMode = checkMode;

const MODE_COPY_OBJ = ['defaults', 'validators', 'validationMsgs'];
const MODE_COPY_ARR = ['defaultOpts'];

/**
 * A class used behind the scenes of a loader function.
 * 
 * This handles registering loader modes, groups, and more.
 * 
 * @alias module:@lumjs/simple-loader/loader.Context
 */
class LoaderContext
{
  /**
   * Build a new Context object.
   */
  constructor(opts={})
  {
    this.modes = {};
    this.settings = {};
    this.loaded = {};
    this.metadata = {};

    this.useModeGroups = opts.useModeGroups ?? false;
    this.useSetsGroups = opts.useSetsGroups ?? true;

    this.autoProps = 
    {
      default: ['mode', 'func', 'loc'],
    };

    this.defaults =
    {
      mode: AUTO,
      func: null,
      loc:  (ctx.isWindow ? document.head : null),

      validate:      opts.validate      ?? true,
      usePromise:    opts.usePromise    ?? ctx.has.Promise,
      useReadyState: opts.useReadyState ?? false,
      useOnLoad:     opts.useOnLoad     ?? true,
    };

    this.defaultOpts =
    [
      'usePromise', 'useReadyState', 'useOnLoad',
    ];

    this.validators =
    {
      mode: (val) => (typeof val === S && isObj(this.modes[val])),
      func: (val) => (typeof val === F || val === null),
      loc: isElem,
      target: isElem,
      validate: isBool,
    }

    this.validationMsgs =
    {
      mode: ["Must be one of: ", Object.keys(this.modes)],
      func: ["Must be a function or null"],
      loc:  [(ctx.isWindow 
        ? "Must be a DOM Element or jQuery element" 
        : "Is not supported in this context")],
      validate: ["Must be a boolean value"],
    }

    // Create our default settings document.
    this.settings.default = this.setupSettings();
  }

  /**
   * Build a `load()` function from a settings document.
   * 
   * @param {object} [settings] - The top-level settings document.
   * 
   * If not specified, we use the default settings found in our
   * `this.settings.default` property.
   * 
   * @returns {function}
   */
  buildLoad(settings=this.settings.default)
  {
    console.log("buildLoad", settings);

    const load = function()
    {
      return settings.loadFrom(...arguments);
    }

    def(load, 'context', this);
    def(load, 'settings', settings);
    def(load, 'isLoadSettings', false);

    def(load, 'set', function (opts, validate)
    {
      return settings.set(opts, validate);
    });

    def(load, 'reset', function()
    {
      return settings.reset();
    });

    const context = this;
    def(load, 'addSetting', function(name, opts={}, parent=settings)
    {
      if (typeof name === S 
        && isObj(opts) && isObj(parent) && parent.isLoadSettings)
      {
        const newSetting = parent.loadFrom(opts);
        context.addSetting(name, newSetting);
        return newSetting;
      }
    });

    // Make direct loaders available for each mode.
    for (const mname in this.modes)
    {
      const mode = this.modes[mname];
      def(load, mname, mode.load);
    }

    return load;
  }

  addSetting(name, setting)
  {
    if (this.settings[name] !== undefined)
    {
      throw new Error(`Setting ${name} already exists`);
    }

    if (isObj(setting) && setting.isLoadSettings)
    {
      this.settings[name] = setting;
    }
    else 
    {
      throw new TypeError(`Setting for ${name} was not a valid settings object`);
    }

  }

  addMode(mode, check=true, fatal=true)
  {
    if (check) checkMode(mode, fatal);

    this.modes[mode.name] = mode;
    this.loaded[mode.name] = [];
    this.metadata[mode.name] = {};

    if (typeof mode.setup === F)
    { // The mode will take care of setup.
      mode.setup(this);
    }
    else 
    { // We'll run our standard setup.
      this.setupMode(mode, false);
    }

  }

  setupMode(mode, check=true, fatal=true)
  {
    if (check) checkMode(mode, fatal);

    if (mode.autoProps)
    {
      this.autoProps[mode.name] = mode.autoProps;
    }

    for (const prop of MODE_COPY_OBJ)
    {
      if (mode[prop])
      {
        copyProps(mode[prop], this[prop], mode.copyProps);
      }
    }

    for (const prop of MODE_COPY_ARR)
    {
      if (mode[prop])
      {
        for (const value of mode[prop])
        {
          if (!this[prop].includes(value))
          {
            this[prop].push(value);
          }
        }
      }
    }

  }

  // The function to initialize a `load()` *settings object*.
  setupSettings (settings={})
  {
    return Settings.setup(this, settings);
  } // setupSettings()

}

exports.Context = LoaderContext;

function needFetch()
{
  if (!ctx.has.fetch)
  {
    throw new Error("The Fetch API is not supported, cannot continue");
  }
}
exports.needFetch = needFetch;

// TODO: support a custom jQuery variable.
function isJQ(val)
{
  return ((typeof jQuery !== U) 
  && (val instanceof jQuery) 
  && val.length > 0);
}
exports.isJQ = isJQ;

function isElem(val)
{
  if (ctx.isWindow)
  {
    if (val instanceof Element)
    { // We're good.
      return true;
    }
    else if (isJQ(val))
    { // It's a jQuery selector.
      return val[0];
    }
  }
  else
  { // In any other context, 'loc' is not used.
    return false;
  }
}
exports.isElem = isElem;

function getLoaderOpts(caller, args, ...objArgs)
{
  const context = caller.context;

  const DEFS = context.defaultOpts;
  const GC   = context.defaultSettings;
  let opts;

  if (args.length === 1 && isObj(args[0]) && typeof args[0].url === S)
  { // Named options can be passed directly.
    opts = args[0];
    for (const opt of DEFS)
    {
      if (opts[opt] === undefined)
      { // Use the global context for default values.
        opts[opt] = GC[opt];
      }
    }
  }
  else if (args.length === 1 && caller.isLoadSettings && typeof args[0] === S)
  { // We get all our options from the current settings object.
    opts = caller;
    opts.url = args[0];
  }
  else
  { // Loop the arguments to look for more options.
    const srcObj = caller.isLoadSettings ? caller : GC;
    opts = srcObj.extract(...DEFS);

    const hasProps = typeof objProps === S;
    const hasAttrs = typeof objAttrs === S;

    for (const arg of args)
    {
      if (opts.url === undefined && typeof arg === S)
      { 
        opts.url = arg;
      }
      else if (opts.func === undefined && typeof arg === F)
      {
        opts.func = arg;
      }
      else if (opts.loc === undefined && arg instanceof Element)
      {
        opts.loc = arg;
      }
      else if (opts.loc === undefined && isJQ(arg) && arg.length > 0)
      {
        opts.loc = arg[0];
      }
      else if (hasProps && opts[objProps] === undefined && isObj(arg))
      { // First time we see a raw object, it's Element properties.
        opts[objProps] = arg;
      }
      else if (hasAttrs && opts[objAttrs] === undefined && isObj(arg))
      { // The second time we see a raw object, it's Element attributes.
        opts[objAttrs] = arg;
      }
      else
      {
        console.error("Unknown or invalid parameter", 
          arg, caller, args, objProps, objAttrs);
      }
    }
  }

  if (!(typeof opts.url === S))
  {
    throw new Error("Could not find a valid 'url' parameter");
  }

  /*if (ctx.isWindow && !isInstance(opts.loc, Element))
  { // Let's add the default loc.
    opts.loc = document.head;
  }*/

  return opts;
}
exports.getLoaderOpts = getLoaderOpts;

function getUrl(opts, prefix, suffix)
{
  let url = '';
  if (prefix && !opts.url.startsWith('/') && !opts.url.includes('://'))
  {
    url = prefix;
  }

  url += opts.url;

  if (suffix && !url.endsWith(suffix))
  {
    url += suffix;
  }

  return url;
}
exports.getUrl = getUrl;

// At the bottom to avoid bootstrap issues.
const Settings = require('./settings');

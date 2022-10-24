/**
 * Module of functions used to define settings documents.
 * 
 * I will document this at some point.
 * 
 * @module @lumjs/simple-loader/settings
 */

const core = require('@lumjs/core');
const {S,F,B,isObj,def} = core.types;
const {clone} = core.obj;

// The function that does the validation.
function validateProp(prop, value, reportInvalid, reportUnknown)
{
  if (typeof this.validators[prop] === F)
  { // Call the validator, which will return `true`, `false`, or in some cases, a new valid value.
    const isValid = this.validators[prop].call(this, value)
    if (reportInvalid && isValid === false)
    { // Did not pass the test.
      const help = this.validationMsgs[prop] ?? [];
      console.error("Invalid value for setting", prop, value, ...help);
    }
    return isValid;
  }
  else if (reportUnknown)
  {
    console.error("Unknown setting", prop, value);
  }
  return false;
}
exports.validateProp = validateProp;

// Make a new clone, and pass all arguments to it's `loadUsing()` method.
function loadFrom ()
{
  return this.clone().loadUsing(...arguments);
}
exports.loadFrom = loadFrom;

// Look for resources to load using the current settings.
function loadUsing ()
{
  const modes = this.context.modes;
  const moreSettings = this.context.settings;
  const modeGroups = this.context.useModeGroups;
  const setsGroups = this.context.useSetsGroups;

  for (let a=0; a < arguments.length; a++)
  {
    const arg = arguments[a];

    if (arg === null || arg === undefined) continue; // These are invalid values for the loader.

    let url = null;

    // See if the argument is one of detectable option values.
    const foundSetting = this.setValue(arg);
    if (foundSetting)
    { // Settings were found and changed, time to move on.
      continue;
    }

    if (isObj(arg))
    { 
      if (Array.isArray(arg))
      { // An array of sub-arguments will get its own settings context.
        this.loadFrom(...arg);
        continue; // Now we're done.
      }

      // Check for settings we can set.
      this.set(arg, this.validate, false);

      if (modeGroups)
      { // Look for mode-specific groups.
        for (const mode in modes)
        {
          if (Array.isArray(arg[mode]))
          { 
            const subLoader = this.clone();
            const subArgs = arg[mode];
            subLoader.set({mode}, false);
            subLoader.loadUsing(...subArgs)
          }
        }
      }

      if (setsGroups)
      { // Look for settings-specific groups.
        for (const setName in moreSettings)
        {
          if (Array.isArray(arg[setName]))
          {
            const subLoader = moreSettings[setName];
            const subArgs = arg[setName];
            subLoader.loadFrom(...subArgs);
          }
        }
      }

      // Finally, if there is a 'url' property, set our URL.
      if (typeof arg.url === S)
      {
        url = arg;
      }

    }
    else if (typeof arg === S)
    { // This is the only valid argument type left.
      url = arg;
    }
    
    if (typeof url === S)
    { // Okay, time to pass it on to a loader method.
      let loaderFunc;
      if (this.mode === Loader.AUTO)
      { // Determine the loader to use based on the extension.
        for (const m in modes)
        {
          const mode = modes[m];
          if (mode.handles(url, this))
          { // We found a mode that handles the url.
            loaderFunc = mode.load;
          }
        }

        if (typeof loaderFunc !== F)
        { // No valid loader found.
          console.error("No loader found for", url, arg, arguments);
          continue;
        }
      } 
      else
      { // Use a directly specified loading mode.
        loaderFunc = modes[this.mode].load;
      }
      console.debug({url, settings: this, arg, loaderFunc});
      loaderFunc.call(this, url);
    }

  }

  return this;
}
exports.loadUsing = loadUsing;

// The `settings.set()` method, assigned by the `setupSettings()` function.
// Allows us to set a bunch options all at once, and validate the values.
function changeSettings (opts, validate, reportUnknown=true)
{
  if (!isObj(opts))
  {
    throw new TypeError("set opts must be an object");
  }

  if (typeof validate !== B)
  {
    validate = this.validate;
  }

  const reserved = [];
  const reservations = 
  { // A map of reservations to the boolean flag that enables them.
    useModeGroups: 'modes',
    useSetsGroups: 'settings',
  }
  for (const rn in reservations)
  {
    if (this.context[rn])
    {
      const rp = reservations[rn];
      reserved.push(...Object.keys(this.context[rp]));
    }
  }

  for (const prop in opts)
  {
    if (reserved.includes(prop)) continue; // Skip reserved properties.

    let val = opts[prop];
    let okay = true;

    if (validate)
    { // Let's get the value.
      okay = validateProp.call(this.context, prop, val, true, reportUnknown);
      if (typeof okay !== B)
      { // A replacement value was passed.
        val = okay;
        okay = true;
      }
    }

    if (okay)
    { // Assign the setting.
      this[prop] = val;
    }
  }

  return this;
} // changeSettings()
exports.changeSettings = changeSettings;

// The `settings.setValue()` method, assigned by the `setupSettings()` function.
// Will return the name of a matching setting if one was found, or `null` otherwise.
function updateMatchingSetting(value)
{
  const MAPS = this.context.autoProps;
  const MAP = MAPS[this.mode] ?? MAPS.default;
  
  for (const prop in MAP)
  {
    const okay = validateProp.call(this.context, prop, value, false, false);
    if (okay !== false)
    { // Something other than false means a setting was found.
      if (okay !== true)
      { // Something other than true means a custom value was returned.
        value = okay;
      }
      this[prop] = value;
      return prop;
    }
  }

  // If we made it here, nothing matched.
  return null;
}
exports.updateMatchingSetting = updateMatchingSetting;

// The function to initialize a *settings object*.
function setupSettings (context, settings)
{
  if (!(context instanceof Loader.Context))
  {
    throw new Error("Context must be a Context instance");
  }

  if (!isObj(settings))
  {
    throw new Error("Settings must be an object");
  }

  // A reference to the parent context.
  def(settings, 'context', context);

  // Yee haa.
  def(settings, 'isLoadSettings', true);

  // Clone this *settings object* and run `setupSettings()` on the clone.
  def(settings, 'clone', function()
  { 
    const copts = this.cloneOpts ?? context.cloneOpts;
    return setupSettings(context, clone(this, copts));;
  });

  // Add a `set()` method that handles validation automatically.
  def(settings, 'set', changeSettings);

  // Reset to defaults.
  def(settings, 'reset', function()
  {
    return this.set(this.context.defaults, false);
  });

  // Add a `setValue()` method that detects the type of value and sets an appropriate setting.
  def(settings, 'setValue', updateMatchingSetting);

  // Load resources from a clone of these settings.
  def(settings, 'loadFrom', loadFrom);

  // Load resources using these settings.
  def(settings, 'loadUsing', loadUsing);

  // Get a plain object with a specified subset of our properties.
  def(settings, 'extract', function()
  {
    const set = {};
    for (const arg of arguments)
    {
      if (typeof arg === S)
      {
        set[arg] = this[arg];
      }
      else 
      {
        throw new TypeError("Property names must be strings");
      }
    }
    return set;
  });

  // Return the settings object.
  return settings;
}
exports.setup = setupSettings;

// At the bottom to avoid bootstrap issues.
const Loader = require('./loader');

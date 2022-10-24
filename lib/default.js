const core = require('@lumjs/core');
const Loader = require('./loader');

const context = new Loader.Context();

// Adding JS first.
context.addMode(require('./modes/js'));

if (core.context.isWindow)
{ 
  context.addMode(require('./modes/css'));
  context.addMode(require('./modes/html'));
}

// Add Data last, as it's a fallback.
context.addMode(require('./modes/data'));

/**
 * A default `load()` function.
 * 
 * Builds a [Context]{@link module:@lumjs/simple-loader/loader.Context}
 * instance, adds some specific mode plugins, then generates a `load()`
 * function associated with the context.
 * 
 * - Enables `js` mode in every environment.
 * - Enables `css` and `html` modes in a browser Window context.
 * - Uses `data` mode as a final fallback in every environment.
 * 
 * @exports module:@lumjs/simple-loader/default
 * @function
 * @param {...mixed} params - Arguments to be parsed.
 * 
 * I'll document this properly at some point.
 * 
 * @returns {object} The *settings* document. 
 */
const load = context.buildLoad();

// Initialize the top-level settings.
load.reset();

// Export it.
module.exports = load;

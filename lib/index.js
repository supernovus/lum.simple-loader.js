const core = require('@lumjs/core');
const {can,has,def} = core.buildModule(module);

/**
 * A module which simply makes the other modules
 * within this package available via nice names.
 * 
 * @module @lumjs/simple-loader
 */

/**
 * @name module:@lumjs/simple-loader.Loader
 * @see module:@lumjs/simple-loader/loader
 */
has('Loader', true);

/**
 * @name module:@lumjs/simple-loader.Settings
 * @see module:@lumjs/simple-loader/settings
 */
has('Settings', true);

/**
 * @name module:@lumjs/simple-loader.load
 * @see module:@lumjs/simple-loader/default
 */
can('load', {module: './default'});

/**
 * A set of lazy-loaded properties for each
 * of the currently defined loader modes.
 * 
 * @alias module:@lumjs/simple-loader.modes
 * @prop {object} js [Javascript mode]{@link module:@lumjs/simple-loader/modes/js}
 * @prop {object} css [CSS mode]{@link module:@lumjs/simple-loader/modes/css}
 * @prop {object} html [HTML mode]{@link module:@lumjs/simple-loader/modes/html}
 * @prop {object} data [Data mode]{@link module:@lumjs/simple-loader/modes/data}
 * 
 */
const modes = {};
for (const mode of ['js','css','html','data'])
{
  def.lazy(modes, mode, () => require('./modes/'+mode));
}
has('modes', {value: modes});

/**
 * A module which simply makes the other modules
 * within this package available via nice names.
 * 
 * @module @lumjs/simple-loader
 */

"use strict";

const {def,lazy} = require('@lumjs/core/types');
const E = def.e;

/**
 * @name module:@lumjs/simple-loader.Loader
 * @see module:@lumjs/simple-loader/loader
 */
def(exports, 'Loader', require('./loader'), E);

/**
 * @name module:@lumjs/simple-loader.Settings
 * @see module:@lumjs/simple-loader/settings
 */
def(exports, 'Settings', require('./settings'), E);

/**
 * @name module:@lumjs/simple-loader.load
 * @see module:@lumjs/simple-loader/default
 */
lazy(exports, 'load', () => require('./default'), E);

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
  lazy(modes, mode, () => require('./modes/'+mode), E);
}
def(exports, 'modes', modes, E);

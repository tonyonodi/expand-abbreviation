'use strict';

import Profile from '@emmetio/output-profile';
import SnippetsRegistry from '@emmetio/snippets-registry';
import { expand as htmlExpand, parse as htmlParse } from './lib/html';
import { expand as cssExpand,  parse as cssParse } from './lib/css';
import snippetsRegistryFactory from './lib/snippets-registry';

/**
 * Default variables used in snippets to insert common values into predefined snippets
 * @type {Object}
 */
const defaultVariables = {
	lang: 'en',
	locale: 'en-US',
	charset: 'UTF-8'
};

/**
 * A list of syntaxes that should use Emmet CSS abbreviations:
 * a variations of default abbreivation that holds values right in abbreviation name
 * @type {Set}
 */
const stylesheetSyntaxes = new Set(['css', 'sass', 'scss', 'less', 'stylus', 'sss']);

const defaultOptions = {
	/**
	 * Abbreviation output syntax
	 * @type {String}
	 */
	syntax: 'html',

	/**
	 * Field/tabstop generator for editor. Most editors support TextMate-style
	 * fields: ${0} or ${1:item}. So for TextMate-style fields this function
	 * will look like this:
	 * @example
	 * (index, placeholder) => `\${${index}${placeholder ? ':' + placeholder : ''}}`
	 *
	 * @param  {Number} index         Placeholder index. Fields with the same indices
	 * should be linked
	 * @param  {String} [placeholder] Field placeholder
	 * @return {String}
	 */
	field: (index, placeholder) => placeholder || '',

	/**
	 * Insert given text string(s) into expanded abbreviation
	 * If array of strings is given, the implicitly repeated element (e.g. `li*`)
	 * will be repeated by the amount of items in array
	 * @type {String|String[]}
	 */
	text: null,

	/**
	 * Either predefined output profile or options for output profile. Used for
	 * abbreviation output
	 * @type {Profile|Object}
	 */
	profile: null,

	/**
	 * Custom variables for variable resolver
	 * @see @emmetio/variable-resolver
	 * @type {Object}
	 */
	variables: {},

	/**
	 * Custom predefined snippets for abbreviation. The expanded abbreviation
	 * will try to match given snippets that may contain custom elements,
	 * predefined attributes etc.
	 * May also contain array of items: either snippets (Object) or references
	 * to default syntax snippets (String; the key in default snippets hash)
	 * @see @emmetio/snippets
	 * @type {Object|SnippetsRegistry}
	 */
	snippets: {},

	/**
	 * Hash of additional transformations that should be applied to expanded
	 * abbreviation, like BEM or JSX. Since these transformations introduce
	 * side-effect, they are disabled by default and should be enabled by
	 * providing a transform name as a key and transform options as value:
	 * @example
	 * {
	 *     bem: {element: '--'},
	 *     jsx: true // no options, just enable transform
	 * }
	 * @see @emmetio/html-transform/lib/addons
	 * @type {Object}
	 */
	addons: null,

	/**
	 * Additional options for syntax formatter
	 * @see @emmetio/markup-formatters
	 * @type {Object}
	 */
	format: null
};

/**
 * Expands given abbreviation into string, formatted according to provided
 * syntax and options
 * @param  {String|Node} abbr        Abbreviation string or parsed abbreviation tree
 * @param  {String|Object} [options] Parsing and formatting options (object) or
 * abbreviation syntax (string)
 * @return {String}
 */
export function expand(abbr, options) {
	options = createOptions(options);

	return isStylesheet(options.syntax)
		? cssExpand(abbr, options)
		: htmlExpand(abbr, options);
}

/**
 * Parses given abbreviation into AST tree. This tree can be later formatted to
 * string with `expand` function
 * @param  {String} abbr             Abbreviation to parse
 * @param  {String|Object} [options] Parsing and formatting options (object) or
 * abbreviation syntax (string)
 * @return {Node}
 */
export function parse(abbr, options) {
	options = createOptions(options);

	return isStylesheet(options.syntax)
		? cssParse(abbr, options)
		: htmlParse(abbr, options);
}

/**
 * Creates snippets registry for given syntax and additional `snippets`
 * @param  {String} syntax   Snippets syntax, used for retreiving predefined snippets
 * @param  {SnippetsRegistry|Object|Object[]} [snippets] Additional snippets
 * @return {SnippetsRegistry}
 */
export function createSnippetsRegistry(syntax, snippets) {
	return snippets instanceof SnippetsRegistry
		? snippets
		: snippetsRegistryFactory(isStylesheet(syntax) ? 'css' : syntax, snippets);
}

export function createOptions(options) {
	if (typeof options === 'string') {
		options = { syntax: options };
	}

	options = Object.assign({}, defaultOptions, options);
	options.format = Object.assign({field: options.field}, options.format);
	options.profile = createProfile(options);
	options.variables = Object.assign({}, defaultVariables, options.variables);
	options.snippets = createSnippetsRegistry(isStylesheet(options.syntax) ? 'css' : options.syntax, options.snippets);

	return options;
}

/**
 * Check if given syntax belongs to stylesheet markup.
 * Emmet uses different abbreviation flavours: one is a default markup syntax,
 * used for HTML, Slim, Pug etc, the other one is used for stylesheets and
 * allows embedded values in abbreviation name
 * @param  {String}  syntax
 * @return {Boolean}
 */
export function isStylesheet(syntax) {
	return stylesheetSyntaxes.has(syntax);
}

/**
 * Creates output profile from given options
 * @param  {Object} options
 * @return {Profile}
 */
export function createProfile(options) {
	return options.profile instanceof Profile
		? options.profile
		: new Profile(options.profile);
}

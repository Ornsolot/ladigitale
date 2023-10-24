module.exports = {
	root: true,
	env: {
		browser: true,
		node: true
	},
	parserOptions: {
		parser: 'babel-eslint'
	},
	extends: [
		'@nuxtjs',
		'plugin:nuxt/recommended'
	],
	rules: {
		'object-shorthand': 'off',
		'no-prototype-builtins': 'off',
		'no-lonely-if': 'off',
		'generator-star-spacing': 'off',
		'no-irregular-whitespace': 'off',
		'vue/singleline-html-element-content-newline': 'off',
		'vue/attributes-order': 'off',
		'space-before-function-paren': 'off',
		'vue/max-attributes-per-line': 'off',
		'vue/require-default-prop': 'off',
		'vue/html-indent': [
			'error',
			'tab'
		],
		'vue/no-v-html': 'off',
		'indent': [
			'error',
			'tab'
		],
		'no-tabs': 0,
		'no-console': 0
	}
}

let hote = 'localhost'
if (process.env.NODE_ENV === 'production') {
	hote = process.env.HOST
}
let port = 3000
if (process.env.PORT) {
	port = process.env.PORT
}

module.exports = {
	head: {
		title: 'Digiboard by La Digitale',
		meta: [
			{ charset: 'utf-8' },
			{ name: 'viewport', content: 'width=device-width, height=device-height, viewport-fit=cover, initial-scale=1.0, minimum-scale=1.0, maximum-scale=1.0, user-scalable=no, shrink-to-fit=no' },
			{ name: 'apple-mobile-web-app-capable', content: 'yes' },
			{ name: 'mobile-web-app-capable', content: 'yes' },
			{ name: 'HandheldFriendly', content: 'true' },
			{ name: 'description', content: 'Un tableau blanc collaboratif proposé par La Digitale' },
			{ property: 'og:title', content: 'Digiboard by La Digitale' },
			{ property: 'og:description', content: 'Un tableau blanc collaboratif proposé par La Digitale' },
			{ property: 'og:type', content: 'website' },
			{ property: 'og:url', content: 'https://digiboard.app/' },
			{ property: 'og:image', content: 'https://digiboard.app/img/digiboard.png' },
			{ property: 'og:locale', content: 'fr_FR' }
		],
		noscript: [
			{ innerHTML: 'Vous devez activer Javascript sur votre navigateur pour utiliser cette application...' }
		],
		htmlAttrs: {
			lang: 'fr'
		},
		script: [
			{ src: '/js/qrcode.js' }
		],
		link: [
			{ rel: 'icon', type: 'image/png', href: '/favicon.png' }
		]
	},
	loading: '~/components/chargement.vue',
	css: [
		'destyle.css',
		'@/assets/css/main.css'
	],
	plugins: [
		{ src: '~/plugins/vue-socket-io', mode: 'client' },
		{ src: '~/plugins/vue-konva', mode: 'client' }
	],
	modules: [
		'nuxt-i18n'
	],
	i18n: {
		locales: [
			{
				code: 'en',
				file: 'en.js'
			},
			{
				code: 'fr',
				file: 'fr.js'
			}
		],
		defaultLocale: 'fr',
		strategy: 'no_prefix',
		lazy: true,
		langDir: 'lang/',
		vueI18n: {
			fallbackLocale: 'fr'
		}
	},
	router: {
		middleware: 'middleware'
	},
	server: {
		port: port,
		host: hote
	},
	render: {
		csp: {
			hashAlgorithm: 'sha256',
			policies: {
				'script-src': ["'self'", "'unsafe-inline'"],
				'frame-ancestors': ["'self'", 'https://ladigitale.dev', 'https://digipad.app'],	
			}
		},
		static: {
			maxAge: 1000 * 60 * 60 * 24 * 7
		}
	},axios: {
		proxyHeaders: false,
		credentials: false
	},
	/* build: {
		transpile: ['konva']
	}, */
	buildModules: [
		'@nuxtjs/eslint-module'
	]
}

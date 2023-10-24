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
		title: 'Digipad by La Digitale',
		meta: [
			{ charset: 'utf-8' },
			{ name: 'viewport', content: 'width=device-width, height=device-height, viewport-fit=cover, initial-scale=1.0, minimum-scale=1.0, maximum-scale=1.0, user-scalable=no, shrink-to-fit=no' },
			{ name: 'apple-mobile-web-app-capable', content: 'yes' },
			{ name: 'mobile-web-app-capable', content: 'yes' },
			{ name: 'HandheldFriendly', content: 'true' },
			{ name: 'description', content: 'Une application collaborative proposée par La Digitale' },
			{ property: 'og:title', content: 'Digipad by La Digitale' },
			{ property: 'og:description', content: 'Une application collaborative proposée par La Digitale' },
			{ property: 'og:type', content: 'website' },
			{ property: 'og:url', content: 'https://digipad.app/' },
			{ property: 'og:image', content: 'https://digipad.app/img/digipad.png' },
			{ property: 'og:locale', content: 'fr_FR' }
		],
		noscript: [
			{ innerHTML: 'Vous devez activer Javascript sur votre navigateur pour utiliser cette application...' }
		],
		htmlAttrs: {
			lang: 'fr'
		},
		script: [
			{ src: '/js/jspanel.js' },
			{ src: '/js/qrcode.js' },
			{ src: '/js/flex-images.js' }
		],
		link: [
			{ rel: 'icon', type: 'image/png', href: '/favicon.png' }
		]
	},
	loading: '~/components/chargement-page.vue',
	css: [
		'destyle.css',
		'@/assets/css/main.css'
	],
	plugins: [
		{ src: '~/plugins/vue-socket-io', mode: 'client' },
		{ src: '~/plugins/vue-methods', mode: 'client' },
		{ src: '~/plugins/vue-masonry-css', mode: 'client' },
		{ src: '~/plugins/matomo', mode: 'client' }
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
			},
			{
				code: 'it',
				file: 'it.js'
			},
			{
				code: 'es',
				file: 'es.js'
			},
			{
				code: 'hr',
				file: 'hr.js'
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
				'script-src': ["'self'", "'unsafe-inline'", process.env.MATOMO],
				'frame-ancestors': ["*"],
				'frame-src': ["*", "blob:"]
			}
		},
		static: {
			maxAge: 1000 * 60 * 60 * 24 * 7
		}
	},
	env: {
		etherpad: process.env.ETHERPAD,
		etherpadApi: process.env.ETHERPAD_API_KEY,
		adminPassword: process.env.ADMIN_PASSWORD,
		uploadLimit: process.env.UPLOAD_LIMIT,
		padLimit: process.env.PAD_LIMIT,
		matomo: process.env.MATOMO,
		nfsPadNumber: process.env.NFS_PAD_NUMBER,
		nfsFolder: process.env.NFS_FOLDER
	},
	buildModules: [
		'@nuxtjs/eslint-module'
	]
}

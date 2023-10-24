export default function (context) {
	const userAgent = context.userAgent = process.server ? context.req.headers['user-agent'] : navigator.userAgent
	context.store.dispatch('modifierUserAgent', userAgent)
	if (context.hasOwnProperty('req') && context.req.hasOwnProperty('session') && context.req.session.hasOwnProperty('identifiant') && context.req.session.identifiant !== '' && context.req.session.identifiant !== undefined) {
		const donnees = {}
		donnees.identifiant = context.req.session.identifiant
		donnees.nom = context.req.session.nom
		donnees.langue = context.req.session.langue
		donnees.statut = context.req.session.statut
		donnees.interactions = context.req.session.interactions
		if (context.req.session.hasOwnProperty('filtre')) {
			donnees.filtre = context.req.session.filtre
		}
		if (context.req.session.hasOwnProperty('email')) {
			donnees.email = context.req.session.email
		}
		context.store.dispatch('modifierUtilisateur', donnees)
	}
}

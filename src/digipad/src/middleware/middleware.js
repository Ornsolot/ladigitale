export default function (context) {
	const userAgent = context.userAgent = process.server ? context.req.headers['user-agent'] : navigator.userAgent
	context.store.dispatch('modifierUserAgent', userAgent)
	if (context.req && context.req.session && context.req.session.identifiant !== '' && context.req.session.identifiant !== undefined) {
		const donnees = {}
		donnees.identifiant = context.req.session.identifiant
		donnees.nom = context.req.session.nom
		donnees.langue = context.req.session.langue
		donnees.statut = context.req.session.statut
		if (context.req.session.hasOwnProperty('acces')) {
			donnees.acces = context.req.session.acces
		}
		if (context.req.session.hasOwnProperty('affichage')) {
			donnees.affichage = context.req.session.affichage
		}
		if (context.req.session.hasOwnProperty('filtre')) {
			donnees.filtre = context.req.session.filtre
		}
		if (context.req.session.hasOwnProperty('email')) {
			donnees.email = context.req.session.email
		}
		context.store.dispatch('modifierUtilisateur', donnees)
	}
}

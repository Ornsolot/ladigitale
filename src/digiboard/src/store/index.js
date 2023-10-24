let hote = 'http://localhost:3000'
if (process.env.PORT) {
	hote = 'http://localhost:' + process.env.PORT
}
if (process.env.NODE_ENV === 'production') {
	hote = process.env.DOMAIN
}

export const state = () => ({
	hote: hote,
	userAgent: '',
	message: '',
	notification: '',
	identifiant: '',
	nom: '',
	langue: 'fr',
	langues: ['fr', 'en'],
	statut: '',
	tableaux: []
})

export const mutations = {
	modifierUserAgent (state, donnees) {
		state.userAgent = donnees
	},
	modifierMessage (state, message) {
		state.message = message
	},
	modifierNotification (state, notification) {
		state.notification = notification
	},
	modifierIdentifiant (state, identifiant) {
		state.identifiant = identifiant
	},
	modifierNom (state, nom) {
		state.nom = nom
	},
	modifierLangue (state, langue) {
		state.langue = langue
	},
	modifierStatutUtilisateur (state, statut) {
		state.statut = statut
	},
	modifierTableaux (state, tableaux) {
		state.tableaux = tableaux
	}
}

export const actions = {
	modifierUserAgent ({ commit }, userAgent) {
		commit('modifierUserAgent', userAgent)
	},
	modifierMessage ({ commit }, message) {
		commit('modifierMessage', message)
	},
	modifierNotification ({ commit }, notification) {
		commit('modifierNotification', notification)
	},
	modifierUtilisateur ({ commit }, donnees) {
		commit('modifierIdentifiant', donnees.identifiant)
		commit('modifierNom', donnees.nom)
		commit('modifierLangue', donnees.langue)
		commit('modifierStatutUtilisateur', donnees.statut)
		commit('modifierTableaux', donnees.tableaux)
	},
	modifierNom ({ commit }, nom) {
		commit('modifierNom', nom)
	},
	modifierStatutUtilisateur ({ commit }, statut) {
		commit('modifierStatutUtilisateur', statut)
	},
	modifierLangue ({ commit }, langue) {
		commit('modifierLangue', langue)
	}
}

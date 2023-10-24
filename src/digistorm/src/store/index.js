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
	email: '',
	langue: 'fr',
	langues: ['fr', 'es', 'it', 'en'],
	statut: '',
	interactions: [],
	filtre: 'date-desc'
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
	modifierEmail (state, email) {
		state.email = email
	},
	modifierLangue (state, langue) {
		state.langue = langue
	},
	modifierStatut (state, statut) {
		state.statut = statut
	},
	modifierInteractions (state, interactions) {
		state.interactions = interactions
	},
	modifierFiltre (state, filtre) {
		state.filtre = filtre
	}
}

export const actions = {
	modifierUserAgent ({ commit }, userAgent) {
		commit('modifierUserAgent', userAgent)
	},
	modifierUtilisateur ({ commit }, donnees) {
		commit('modifierIdentifiant', donnees.identifiant)
		commit('modifierNom', donnees.nom)
		commit('modifierLangue', donnees.langue)
		commit('modifierStatut', donnees.statut)
		if (donnees.hasOwnProperty('interactions')) {
			commit('modifierInteractions', donnees.interactions)
		}
		if (donnees.hasOwnProperty('filtre')) {
			commit('modifierFiltre', donnees.filtre)
		}
		if (donnees.hasOwnProperty('email')) {
			commit('modifierEmail', donnees.email)
		}
	},
	modifierMessage ({ commit }, message) {
		commit('modifierMessage', message)
	},
	modifierNotification ({ commit }, notification) {
		commit('modifierNotification', notification)
	},
	modifierIdentifiant ({ commit }, identifiant) {
		commit('modifierIdentifiant', identifiant)
	},
	modifierNom ({ commit }, nom) {
		commit('modifierNom', nom)
	},
	modifierInformations ({ commit }, donnees) {
		commit('modifierNom', donnees.nom)
		commit('modifierEmail', donnees.email)
	},
	modifierLangue ({ commit }, langue) {
		commit('modifierLangue', langue)
	},
	modifierFiltre ({ commit }, filtre) {
		commit('modifierFiltre', filtre)
	},
	reinitialiser ({ commit }) {
		commit('modifierIdentifiant', '')
		commit('modifierNom', '')
		commit('modifierEmail', '')
		commit('modifierLangue', 'fr')
		commit('modifierStatut', '')
		commit('modifierFiltre', 'date-desc')
	}
}

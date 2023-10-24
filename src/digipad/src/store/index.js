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
	alerte: '',
	identifiant: '',
	nom: '',
	email: '',
	langue: 'fr',
	langues: ['fr', 'es', 'it', 'hr', 'en'],
	statut: '',
	acces: [],
	affichage: 'liste',
	filtre: 'date-asc'
})

export const mutations = {
	modifierUserAgent (state, donnees) {
		state.userAgent = donnees
	},
	modifierAlerte (state, alerte) {
		state.alerte = alerte
	},
	modifierMessage (state, message) {
		state.message = message
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
	modifierAcces (state, acces) {
		state.acces = acces
	},
	modifierAffichage (state, affichage) {
		state.affichage = affichage
	},
	modifierFiltre (state, filtre) {
		state.filtre = filtre
	}
}

export const actions = {
	modifierUserAgent ({ commit }, userAgent) {
		commit('modifierUserAgent', userAgent)
	},
	modifierAlerte ({ commit }, alerte) {
		commit('modifierAlerte', alerte)
	},
	modifierMessage ({ commit }, message) {
		commit('modifierMessage', message)
	},
	modifierUtilisateur ({ commit }, donnees) {
		commit('modifierIdentifiant', donnees.identifiant)
		commit('modifierNom', donnees.nom)
		commit('modifierLangue', donnees.langue)
		commit('modifierStatut', donnees.statut)
		if (donnees.hasOwnProperty('acces')) {
			commit('modifierAcces', donnees.acces)
		}
		if (donnees.hasOwnProperty('affichage')) {
			commit('modifierAffichage', donnees.affichage)
		}
		if (donnees.hasOwnProperty('filtre')) {
			commit('modifierFiltre', donnees.filtre)
		}
		if (donnees.hasOwnProperty('email')) {
			commit('modifierEmail', donnees.email)
		}
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
	modifierAffichage ({ commit }, affichage) {
		commit('modifierAffichage', affichage)
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
		commit('modifierAffichage', 'liste')
		commit('modifierFiltre', 'date-asc')
	}
}

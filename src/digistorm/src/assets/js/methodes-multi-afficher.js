export default {
	methods: {
		definirListe (liste) {
			liste.forEach(function (identifiant, indexIdentifiant) {
				this.utilisateurs.forEach(function (utilisateur) {
					if (identifiant === utilisateur.identifiant && utilisateur.nom !== '') {
						liste[indexIdentifiant] = utilisateur.nom
					}
				})
			}.bind(this))
			return liste.join(', ')
		},
		afficherModaleListe (liste) {
			this.modale = 'liste'
			this.liste = this.definirListe(liste)
		},
		fermerModaleListe () {
			this.modale = ''
			this.liste = ''
		},
		afficherMedia () {
			this.modale = 'media'
		},
		fermerModaleMedia () {
			this.modale = ''
		},
		afficherImage (event, image) {
			event.preventDefault()
			event.stopPropagation()
			this.image = image
			this.modale = 'image'
		},
		fermerModaleImage () {
			this.modale = ''
			this.image = ''
		}
	}
}

import axios from 'axios'

export default {
	methods: {
		afficherAjouterMedia () {
			this.modale = 'ajouter-media'
		},
		fermerModaleAjouterMedia () {
			this.modale = ''
			this.lien = ''
		},
		ajouterVideo () {
			let id
			let lien
			// eslint-disable-next-line
			const regExpIframe = RegExp('<iframe(.+)</iframe>', 'g')
			// eslint-disable-next-line
			const regExpYT = /http(?:s?):\/\/(?:www\.)?youtu(?:be\.com\/watch\?v=|\.be\/)([\w\-\_]*)(&(amp;)?[\w\?=]*)?/
			if (this.lien.includes('ladigitale.dev/digiplay/inc/video.php') && regExpIframe.test(this.lien) === true) {
				lien = this.lien.match(/<iframe [^>]*src="[^"]*"[^>]*>/g).map(x => x.replace(/.*src="([^"]*)".*/, '$1'))[0]
				if (this.verifierURL(lien) === true) {
					id = this.lien.match(/videoId=(.*?)&vignette/)[1]
					this.support = { lien: lien, vignette: 'https://i.ytimg.com/vi/' + id + '/default.jpg', fichier: '', type: 'video' }
					this.fermerModaleAjouterMedia()
				}
			} else if (this.verifierURL(this.lien) === true && regExpYT.test(this.lien) === true) {
				id = this.lien.match(/^.*(youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/)[2]
				this.support = { lien: 'https://www.youtube-nocookie.com/embed/' + id, vignette: 'https://i.ytimg.com/vi/' + id + '/default.jpg', fichier: '', type: 'video' }
				this.fermerModaleAjouterMedia()
			}
		},
		verifierURL (lien) {
			let url
			try {
				url = new URL(lien)
			} catch (_) {
				return false
			}
			return url.protocol === 'http:' || url.protocol === 'https:'
		},
		televerserMedia (event) {
			this.fermerModaleAjouterMedia()
			const champ = event.target
			const formats = ['jpg', 'jpeg', 'png', 'gif', 'mp3', 'wav', 'm4a', 'ogg']
			const extension = champ.files[0].name.substr(champ.files[0].name.lastIndexOf('.') + 1).toLowerCase()
			if (champ.files && champ.files[0] && formats.includes(extension) && champ.files[0].size < 10485760) {
				this.chargement = 'support'
				const fichier = champ.files[0]
				const formulaire = new FormData()
				formulaire.append('code', this.code)
				formulaire.append('fichier', fichier)
				axios.post(this.hote + '/api/televerser-media', formulaire, {
					headers: {
						'Content-Type': 'multipart/form-data'
					},
					onUploadProgress: function (progression) {
						const pourcentage = parseInt(Math.round((progression.loaded * 100) / progression.total))
						this.progression = pourcentage
					}.bind(this)
				}).then(function (reponse) {
					this.chargement = ''
					const donnees = reponse.data
					if (donnees === 'erreur') {
						this.$store.dispatch('modifierMessage', this.$t('erreurCommunicationServeur'))
					} else if (donnees === 'non_autorise') {
						this.$store.dispatch('modifierMessage', this.$t('pasAutoriseModifierNuageDeMots'))
					} else {
						this.support = donnees
						this.medias.push(donnees.fichier)
					}
					champ.value = ''
					this.progression = 0
				}.bind(this)).catch(function () {
					champ.value = ''
					this.chargement = ''
					this.progression = 0
					this.$store.dispatch('modifierMessage', this.$t('erreurCommunicationServeur'))
				}.bind(this))
			} else {
				if (!formats.includes(extension)) {
					this.$store.dispatch('modifierMessage', this.$t('formatImageNonAccepte'))
				} else if (champ.files[0].size >= 10485760) {
					this.$store.dispatch('modifierMessage', this.$t('tailleMaximaleFichier'))
				}
				champ.value = ''
			}
		},
		afficherMedia (media, type) {
			if (type === 'video') {
				this.media = { lien: media, type: type }
			} else {
				this.media = { fichier: media, type: type }
			}
			this.modale = 'media'
		},
		supprimerMedia () {
			this.support = {}
			this.fermerModaleMedia()
		},
		fermerModaleMedia () {
			this.modale = ''
			this.media = {}
		}
	}
}

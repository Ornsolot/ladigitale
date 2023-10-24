import axios from 'axios'

export default {
	watch: {
		accordeonOuvert: function (index) {
			const accordeons = document.querySelectorAll('.contenu-accordeon')
			accordeons.forEach(function (accordeon) {
				accordeon.style.display = 'none'
			})
			if (index !== -1) {
				const accordeon = document.querySelector('#accordeon' + index + ' .contenu-accordeon')
				accordeon.style.display = 'block'
			}
		},
		enregistrement: function (valeur) {
			if (valeur === 'enregistrement' || valeur === 'lancement') {
				if (Object.keys(this.support).length > 0 && this.medias.includes(this.support.fichier)) {
					const index = this.medias.indexOf(this.support.fichier)
					this.medias.splice(index, 1)
				}
				this.questions.forEach(function (q) {
					q.items.forEach(function (item) {
						if (item.image !== '' && this.images.includes(item.image)) {
							const index = this.images.indexOf(item.image)
							this.images.splice(index, 1)
						}
					}.bind(this))
					if (Object.keys(q.support).length > 0 && this.images.includes(q.support.image)) {
						const index = this.images.indexOf(q.support.image)
						this.images.splice(index, 1)
					}
				}.bind(this))
				this.corbeille.push(...this.images)
				this.corbeille.push(...this.medias)
				let indexQuestion = 0
				if (this.description !== '' || Object.keys(this.support).length > 0) {
					indexQuestion = -1
				}
				this.$emit('enregistrement', { description: this.description, support: this.support, options: this.options, questions: this.questions, indexQuestion: indexQuestion, copieIndexQuestion: indexQuestion })
			} else if (valeur === 'termine') {
				this.viderCorbeille()
			}
		}
	},
	methods: {
		definirTitre (indexQuestion) {
			if (this.accordeonOuvert !== indexQuestion && this.questions[indexQuestion].question !== '') {
				return this.$t('question') + ' ' + (indexQuestion + 1) + this.$t('doublePoint') + this.questions[indexQuestion].question
			} else {
				return this.$t('question') + ' ' + (indexQuestion + 1)
			}
		},
		gererAccordeon (indexQuestion) {
			if (this.accordeonOuvert === indexQuestion) {
				this.accordeonOuvert = -1
			} else {
				this.accordeonOuvert = indexQuestion
			}
			if (this.questions[indexQuestion].question === '') {
				this.$nextTick(function () {
					document.querySelector('#question' + indexQuestion + ' .question textarea').focus()
				})
			}
		},
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
		televerserMedia (event, interaction) {
			this.fermerModaleAjouterMedia()
			const champ = event.target
			const formats = ['jpg', 'jpeg', 'png', 'gif', 'mp3', 'wav', 'm4a', 'ogg']
			const extension = champ.files[0].name.substr(champ.files[0].name.lastIndexOf('.') + 1).toLowerCase()
			if (champ.files && champ.files[0] && formats.includes(extension) && champ.files[0].size < 10485760) {
				this.chargement = 'media'
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
						if (interaction === 'Sondage') {
							this.$store.dispatch('modifierMessage', this.$t('pasAutoriseModifierSondage'))
						} else if (interaction === 'Questionnaire') {
							this.$store.dispatch('modifierMessage', this.$t('pasAutoriseModifierQuestionnaire'))
						}
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
		ajouterQuestion (interaction) {
			if (interaction === 'Sondage') {
				this.questions.push({ question: '', support: {}, option: 'choix-unique', items: [{ texte: '', image: '', alt: '' }, { texte: '', image: '', alt: '' }] })
			} else if (interaction === 'Questionnaire') {
				this.questions.push({ question: '', support: {}, option: 'choix-unique', items: [{ texte: '', image: '', alt: '', reponse: false }, { texte: '', image: '', alt: '', reponse: false }], retroaction: { correcte: '', incorrecte: '' }, points: 1000 })
			}
			const indexQuestion = this.questions.length - 1
			this.$nextTick(function () {
				this.accordeonOuvert = indexQuestion
				this.$nextTick(function () {
					document.querySelector('#question' + indexQuestion + ' .question textarea').focus()
				})
			}.bind(this))
		},
		supprimerQuestion (indexQuestion) {
			this.questions[indexQuestion].items.forEach(function (item) {
				if (item.image !== '') {
					this.corbeille.push(item.image)
				}
			}.bind(this))
			this.questions.splice(indexQuestion, 1)
			this.accordeonOuvert = -1
		},
		dupliquerQuestion (indexQuestion) {
			const images = []
			if (this.questions[indexQuestion].support.image && this.questions[indexQuestion].support.image !== '') {
				images.push(this.questions[indexQuestion].support.image)
			}
			this.questions[indexQuestion].items.forEach(function (item) {
				if (item.image && item.image !== '') {
					images.push(item.image)
				}
			})
			if (images.length > 0) {
				this.chargement = 'media'
				axios.post(this.hote + '/api/dupliquer-images', {
					code: this.code,
					images: images
				}).then(function (reponse) {
					this.chargement = ''
					const donnees = reponse.data
					if (donnees === 'images_dupliquees') {
						const question = JSON.parse(JSON.stringify(this.questions[indexQuestion]))
						if (question.support.image !== '') {
							question.support.image = 'dup-' + question.support.image
							this.images.push(question.support.image)
						}
						question.items.forEach(function (item) {
							if (item.image !== '') {
								item.image = 'dup-' + item.image
								this.images.push(item.image)
							}
						}.bind(this))
						this.questions.push(question)
						const indexNouvelleQuestion = this.questions.length - 1
						this.$nextTick(function () {
							this.accordeonOuvert = indexNouvelleQuestion
						}.bind(this))
					} else {
						this.$store.dispatch('modifierMessage', this.$t('erreurCommunicationServeur'))
					}
				}.bind(this)).catch(function () {
					this.chargement = ''
					this.$store.dispatch('modifierMessage', this.$t('erreurCommunicationServeur'))
				}.bind(this))
			} else {
				const question = JSON.parse(JSON.stringify(this.questions[indexQuestion]))
				this.questions.push(question)
				const indexNouvelleQuestion = this.questions.length - 1
				this.$nextTick(function () {
					this.accordeonOuvert = indexNouvelleQuestion
				}.bind(this))
			}
		},
		ajouterItem (indexQuestion, interaction) {
			if (interaction === 'Sondage') {
				this.questions[indexQuestion].items.push({ texte: '', image: '', alt: '' })
			} else if (interaction === 'Questionnaire') {
				this.questions[indexQuestion].items.push({ texte: '', image: '', alt: '', reponse: false })
			}
			const indexItem = this.questions[indexQuestion].items.length - 1
			this.$nextTick(function () {
				document.querySelector('#item' + indexQuestion + '_' + indexItem + ' textarea').focus()
			})
		},
		supprimerItem (indexQuestion, indexItem) {
			if (this.questions[indexQuestion].items.length > 1) {
				if (this.questions[indexQuestion].items[indexItem].image !== '') {
					this.corbeille.push(this.questions[indexQuestion].items[indexItem].image)
				}
				this.questions[indexQuestion].items.splice(indexItem, 1)
			}
		},
		televerserImage (indexQuestion, type, interaction) {
			this.modale = ''
			let champ = ''
			if (type === 'support') {
				champ = document.querySelector('#televerser-support' + indexQuestion)
			} else {
				champ = document.querySelector('#televerser-image' + indexQuestion + '_' + type)
			}
			const formats = ['jpg', 'jpeg', 'png', 'gif']
			const extension = champ.files[0].name.substr(champ.files[0].name.lastIndexOf('.') + 1).toLowerCase()
			if (champ.files && champ.files[0] && formats.includes(extension) && champ.files[0].size < 5242880) {
				if (type === 'support') {
					this.chargement = 'support' + indexQuestion
				} else {
					this.chargement = 'image' + indexQuestion + '_' + type
				}
				const fichier = champ.files[0]
				const formulaire = new FormData()
				formulaire.append('code', this.code)
				formulaire.append('fichier', fichier)
				axios.post(this.hote + '/api/televerser-image', formulaire, {
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
						if (interaction === 'Sondage') {
							this.$store.dispatch('modifierMessage', this.$t('pasAutoriseModifierSondage'))
						} else if (interaction === 'Questionnaire') {
							this.$store.dispatch('modifierMessage', this.$t('pasAutoriseModifierQuestionnaire'))
						}
					} else {
						if (type === 'support') {
							this.questions[indexQuestion].support = donnees
						} else {
							this.questions[indexQuestion].items[type].image = donnees.image
							this.questions[indexQuestion].items[type].alt = donnees.alt
						}
						this.images.push(donnees.image)
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
				} else if (champ.files[0].size >= 5242880) {
					this.$store.dispatch('modifierMessage', this.$t('tailleMaximaleImage'))
				}
				champ.value = ''
			}
		},
		afficherSupport (indexQuestion, image) {
			this.indexQuestion = indexQuestion
			this.image = image
			this.modale = 'support'
		},
		afficherImage (indexQuestion, image, index) {
			this.indexQuestion = indexQuestion
			this.image = image
			this.indexImage = index
			this.modale = 'image'
		},
		supprimerImage (indexQuestion, type) {
			if (type === 'support') {
				this.questions[indexQuestion].support = {}
			} else {
				this.questions[indexQuestion].items[type].image = ''
				this.questions[indexQuestion].items[type].alt = ''
			}
			this.fermerModaleImage()
		},
		fermerModaleImage () {
			this.modale = ''
			this.image = ''
			this.indexImage = -1
			this.indexQuestion = -1
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
		},
		viderCorbeille () {
			axios.post(this.hote + '/api/supprimer-fichiers', {
				code: this.code,
				fichiers: this.corbeille
			}).then(function () {
				this.corbeille = []
				this.images = []
				this.medias = []
			}.bind(this))
		},
		quitterPage () {
			this.images.push(...this.medias)
			if (this.images.length > 0) {
				axios.post(this.hote + '/api/supprimer-fichiers', {
					code: this.code,
					fichiers: this.images
				})
			}
		}
	}
}

import axios from 'axios'
import Konva from 'konva'
import ClipboardJS from 'clipboard'
import { saveAs } from 'file-saver'
import html2canvas from 'html2canvas'
import draggable from 'vuedraggable'

export default {
	name: 'Tableau',
	components: {
		draggable
	},
	sockets: {
		connexion: function (utilisateurs) {
			this.definirUtilisateurs(utilisateurs)
		},
		deconnexion: function (identifiant) {
			const utilisateurs = this.utilisateurs
			utilisateurs.forEach(function (utilisateur, index) {
				if (utilisateur.identifiant === identifiant) {
					utilisateurs.splice(index, 1)
				}
			})
			this.utilisateurs = utilisateurs
		},
		erreur: function () {
			this.$store.dispatch('modifierMessage', this.$t('erreurCommunicationServeur'))
		},
		ajouter: function (donnees) {
			if (donnees.page === this.page) {
				if (donnees.items[0].objet === 'image' && donnees.items[0].fichier !== '') {
					const image = new window.Image()
					image.src = '/fichiers/' + this.tableau + '/' + donnees.items[0].fichier
					image.onload = function () {
						donnees.items[0].image = image
						this.items[donnees.page].push(...donnees.items)
						this.$nextTick(function () {
							const transformer = this.$refs.transformer.getNode()
							const stage = transformer.getStage()
							const objets = stage.find((item) => {
								return item.getAttrs().objet && item.getAttrs().objet === 'image'
							})
							for (let i = 0; i < objets.length; i++) {
								if (donnees.items[0].name === objets[i].getAttrs().name) {
									if (donnees.items[0].filtre === 'Aucun') {
										objets[i].filters([])
									} else {
										objets[i].cache()
										objets[i].filters([Konva.Filters[donnees.items[0].filtre]])
										if (donnees.items[0].filtre === 'Pixelate') {
											objets[i].pixelSize(10)
										}
									}
								}
							}
							this.$nextTick(function () {
								this.transformer()
							}.bind(this))
						}.bind(this))
					}.bind(this)
				} else if (donnees.items[0].objet !== 'image') {
					donnees.items.forEach(function (item) {
						if (item.objet === 'ancre') {
							item.visible = false
						}
					})
					this.items[donnees.page].push(...donnees.items)
					this.$nextTick(function () {
						this.transformer()
					}.bind(this))
				}
			} else {
				this.items[donnees.page].push(...donnees.items)
				this.$nextTick(function () {
					this.transformer()
				}.bind(this))
			}
		},
		reajouter: function (donnees) {
			if (donnees.page === this.page) {
				if (donnees.items[0].objet === 'image' && donnees.items[0].fichier !== '') {
					const image = new window.Image()
					image.src = '/fichiers/' + this.tableau + '/' + donnees.items[0].fichier
					image.onload = function () {
						donnees.items[0].image = image
						this.items[donnees.page].splice(...[donnees.index, 0].concat(donnees.items))
						this.$nextTick(function () {
							this.transformer()
						}.bind(this))
					}.bind(this)
				} else if (donnees.items[0].objet !== 'image') {
					donnees.items.forEach(function (item) {
						if (item.objet === 'ancre') {
							item.visible = false
						}
					})
					this.items[donnees.page].splice(...[donnees.index, 0].concat(donnees.items))
					this.$nextTick(function () {
						this.transformer()
					}.bind(this))
				}
			} else {
				this.items[donnees.page].splice(...[donnees.index, 0].concat(donnees.items))
				this.$nextTick(function () {
					this.transformer()
				}.bind(this))
			}
		},
		verrouiller: function (donnees) {
			for (let i = 0; i < donnees.noms.length; i++) {
				const item = this.items[this.page].find(r => r.name === donnees.noms[i])
				if (item) {
					item.draggable = false
					item.verrouille = true
				}
			}
			if (donnees.noms.includes(this.nom)) {
				this.reinitialiserSelection()
			}
			if (donnees.noms.length === 1) {
				this.transformer()
			} else {
				this.$refs.transformer.getNode().getLayer().batchDraw()
			}
		},
		deverrouiller: function (donnees) {
			for (let i = 0; i < donnees.noms.length; i++) {
				const item = this.items[this.page].find(r => r.name === donnees.noms[i])
				if (item && item.objet !== 'dessin') {
					item.draggable = true
					item.verrouille = false
				}
			}
			if (donnees.noms.length === 1) {
				this.transformer()
			} else {
				this.$refs.transformer.getNode().getLayer().batchDraw()
			}
		},
		modifierposition: function (donnees) {
			this.items[donnees.page].forEach(function (item, index) {
				if (item.name === donnees.nom) {
					this.items[donnees.page].splice(index, 1)
					this.items[donnees.page].splice(donnees.index, 0, item)
				}
			}.bind(this))
			this.$nextTick(function () {
				this.transformer()
			}.bind(this))
		},
		deplacer: function (donnees) {
			for (let i = 0; i < donnees.items.length; i++) {
				const item = this.items[this.page].find(r => r.name === donnees.items[i].nom)
				if (item) {
					item.x = donnees.items[i].x
					item.y = donnees.items[i].y
					if (donnees.items[i].hasOwnProperty('points')) {
						item.points = donnees.items[i].points
					}
				}
			}
			if (donnees.items.length === 1) {
				this.transformer()
			} else {
				this.$refs.transformer.getNode().getLayer().batchDraw()
			}
		},
		redimensionner: function (donnees) {
			this.items[donnees.page].forEach(function (item) {
				if (item.name === donnees.item.name) {
					item.x = donnees.item.x
					item.y = donnees.item.y
					item.width = donnees.item.width
					item.height = donnees.item.height
					item.scaleX = donnees.item.scaleX
					item.scaleY = donnees.item.scaleY
				}
			})
			this.$nextTick(function () {
				this.transformer()
			}.bind(this))
		},
		modifiertexte: function (donnees) {
			const type = donnees.nom.substring(0, 4)
			const item = this.items[donnees.page].find(r => r.name === donnees.nom)
			const texte = donnees.texte
			if (type === 'text') {
				item.text = texte
			} else {
				item.text.text = texte
			}
			this.$nextTick(function () {
				this.transformer()
			}.bind(this))
		},
		modifiertailletexte: function (donnees) {
			const item = this.items[donnees.page].find(r => r.name === donnees.nom)
			item.fontSize = donnees.taille
			this.$nextTick(function () {
				this.transformer()
			}.bind(this))
		},
		modifieralignementtexte: function (donnees) {
			const item = this.items[donnees.page].find(r => r.name === donnees.nom)
			item.align = donnees.alignement
			item.opacity = 0.9
			item.opacity = 1
			this.$nextTick(function () {
				this.transformer()
			}.bind(this))
		},
		modifierfiltre: function (donnees) {
			const transformer = this.$refs.transformer.getNode()
			const stage = transformer.getStage()
			const objets = stage.find((item) => {
				return item.getAttrs().objet && item.getAttrs().objet === 'image'
			})
			for (let i = 0; i < objets.length; i++) {
				if (donnees.nom === objets[i].getAttrs().name) {
					if (donnees.filtre === 'Aucun') {
						objets[i].filters([])
					} else {
						objets[i].cache()
						objets[i].filters([Konva.Filters[donnees.filtre]])
						if (donnees.filtre === 'Pixelate') {
							objets[i].pixelSize(10)
						}
					}
				}
			}
			this.$nextTick(function () {
				this.transformer()
			}.bind(this))
		},
		modifiercouleur: function (donnees) {
			const item = this.items[donnees.page].find(r => r.name === donnees.nom)
			if (item.objet === 'rectangle' || item.objet === 'cercle' || item.objet === 'dessin') {
				item.stroke = donnees.couleur
			} else if (item.objet === 'rectangle-plein' || item.objet === 'cercle-plein' || item.objet === 'etoile' || item.objet === 'surlignage' || item.objet === 'texte') {
				item.fill = donnees.couleur
			} else if (item.objet === 'ligne' || item.objet === 'fleche' || item.objet === 'ancre') {
				item.stroke = donnees.couleur
				item.fill = donnees.couleur
			} else if (item.objet === 'label') {
				item.tag.fill = donnees.couleur
			}
			this.$nextTick(function () {
				this.transformer()
			}.bind(this))
		},
		importer: function (donnees) {
			this.reinitialiserSelection()
			this.page = 0
			this.historique = []
			this.positionHistorique = 0
			this.donnees = donnees.items
			this.reinitialiserImages()
			this.chargerItems(donnees.items, this.page)
		},
		supprimer: function (donnees) {
			const type = donnees.nom.substring(0, 4)
			let items
			if (type === 'ancr') {
				items = this.items[donnees.page].filter(r => !r.name.includes(donnees.nom.split('_')[1]))
			} else {
				items = this.items[donnees.page].filter(r => !r.name.includes(donnees.nom))
			}
			this.items.splice(donnees.page, 1, items)
			if (this.nom === donnees.nom) {
				this.nom = ''
				this.objet = ''
			}
			this.$nextTick(function () {
				this.transformer()
			}.bind(this))
		},
		supprimerselection: function (donnees) {
			donnees.noms.forEach(function (nom) {
				const type = nom.substring(0, 4)
				let items
				if (type === 'ancr') {
					items = this.items[donnees.page].filter(r => !r.name.includes(nom.split('_')[1]))
				} else {
					items = this.items[donnees.page].filter(r => !r.name.includes(nom))
				}
				this.items.splice(donnees.page, 1, items)
				if (this.nom === nom) {
					this.nom = ''
					this.objet = ''
				}
			}.bind(this))
			this.$nextTick(function () {
				this.transformer()
			}.bind(this))
		},
		ajouterpage: function () {
			this.items.push([])
		},
		reajouterpage: function (donnees) {
			const images = []
			for (let i = 0; i < donnees.items.length; i++) {
				if (donnees.items[i].objet === 'image' && donnees.items[i].fichier !== '') {
					const donneesImage = new Promise(function (resolve) {
						const image = new window.Image()
						image.src = '/fichiers/' + this.tableau + '/' + donnees.items[i].fichier
						image.onload = function () {
							donnees.items[i].image = image
							resolve('termine')
						}
					}.bind(this))
					images.push(donneesImage)
				} else if (donnees.items[i].objet !== 'image') {
					images.push('termine')
				}
			}
			Promise.all(images).then(function () {
				donnees.items.forEach(function (item) {
					if (item.objet === 'ancre') {
						item.visible = false
					}
				})
				this.items.splice(donnees.page, 0, donnees.items)
				this.$nextTick(function () {
					this.transformer()
					if (donnees.page === this.page) {
						this.afficherPage(this.page)
					}
				}.bind(this))
			}.bind(this))
		},
		deplacerpage: function (donnees) {
			const donneesPage = this.items.splice(donnees.ancienIndex, 1)[0]
			this.items.splice(donnees.nouvelIndex, 0, donneesPage)
		},
		supprimerpage: function (donnees) {
			this.items.splice(donnees.page, 1)
			if (this.page === donnees.page && this.page > 0) {
				this.page--
				this.afficherPage(this.page)
			} else if (this.page === donnees.page && this.page === 0) {
				this.page = 0
				this.afficherPage(this.page)
			}
		},
		modifierfond: function (donnees) {
			this.options.fond = donnees.fond
			if (donnees.fond.substring(0, 1) === '#') {
				document.querySelector('#tableau .konvajs-content').style.backgroundColor = donnees.fond
				document.querySelector('#tableau .konvajs-content').style.backgroundImage = 'none'
			} else {
				document.querySelector('#tableau .konvajs-content').style.backgroundColor = 'transparent'
				document.querySelector('#tableau .konvajs-content').style.backgroundImage = 'url(/img/' + donnees.fond + ')'
				document.querySelector('#tableau .konvajs-content').style.backgroundRepeat = 'repeat'
			}
		},
		modifieredition: function (edition) {
			this.options.edition = edition
			this.$nuxt.$loading.finish()
			if (!this.admin && edition === 'ouverte') {
				this.activerDeplacement()
				window.addEventListener('keydown', this.gererClavier, false)
				this.reinitialiserSelection()
				this.reinitialiserOutils()
			} else if (!this.admin && edition === 'fermee') {
				this.desactiverDeplacement()
				window.removeEventListener('keydown', this.gererClavier, false)
				this.reinitialiserSelection()
				this.reinitialiserOutils()
			}
			if (this.admin && edition === 'ouverte') {
				this.$store.dispatch('modifierNotification', this.$t('editionAutorisee'))
			} else if (this.admin && edition === 'fermee') {
				this.$store.dispatch('modifierNotification', this.$t('editionBloquee'))
			}
		},
		modifiermultipage: function (multipage) {
			this.options.multipage = multipage
			this.$nuxt.$loading.finish()
			if (multipage === 'non') {
				this.page = 0
				this.afficherPage(this.page)
			}
			if (this.admin && multipage === 'oui') {
				this.$store.dispatch('modifierNotification', this.$t('modeMultiPageActive'))
			} else if (this.admin && multipage === 'non') {
				this.$store.dispatch('modifierNotification', this.$t('modeMultiPageDesactive'))
			}
		},
		modifierstatututilisateur: function (donnees) {
			if (donnees.identifiant === this.identifiant) {
				this.$store.dispatch('modifierStatutUtilisateur', donnees.statut)
				this.utilisateurs.forEach(function (utilisateur) {
					if (utilisateur.identifiant === this.identifiant) {
						utilisateur.statut = donnees.statut
					}
				}.bind(this))
				this.$socket.emit('modifierstatututilisateur', { tableau: this.tableau, identifiant: donnees.identifiant, statut: donnees.statut })
			} else if (donnees.admin === this.identifiant) {
				this.$nuxt.$loading.finish()
				this.utilisateurs.forEach(function (utilisateur) {
					if (utilisateur.identifiant === donnees.identifiant) {
						utilisateur.statut = donnees.statut
					}
				})
				this.$store.dispatch('modifierNotification', this.$t('statutUtilisateurModifie'))
			}
		},
		reinitialiser: function () {
			this.items.forEach(function (pages) {
				pages.forEach(function (item) {
					if (item.objet === 'image') {
						this.imagesASupprimer.push(item.fichier)
					}
				}.bind(this))
			}.bind(this))
			this.definirOutilPrincipal('selectionner')
			this.nom = ''
			this.objet = ''
			this.objetVerrouille = false
			this.items = [[]]
			this.page = 0
			this.modale = ''
			this.menu = ''
			this.transformer()
			this.$store.dispatch('modifierNotification', this.$t('tableauReinitialise'))
			this.$nuxt.$loading.finish()
		}
	},
	async asyncData (context) {
		const tableau = context.route.params.tableau
		const { data } = await axios.post(context.store.state.hote + '/api/recuperer-donnees-tableau', {
			tableau: tableau
		}, {
			headers: { 'Content-Type': 'application/json' }
		})
		if (data === 'erreur') {
			context.redirect('/')
		} else {
			if (data.hasOwnProperty('statut') === true && data.statut === 'ferme') {
				data.options.edition = 'fermee'
			}
			return {
				tableau: tableau,
				titre: data.titre,
				donnees: data.donnees,
				options: data.options
			}
		}
	},
	data () {
		return {
			admin: false,
			modale: '',
			menu: '',
			question: '',
			questions: ['motPrefere', 'filmPrefere', 'chansonPreferee', 'prenomMere', 'prenomPere', 'nomRue', 'nomEmployeur', 'nomAnimal'],
			reponse: '',
			nouvellequestion: '',
			nouvellereponse: '',
			largeur: 1920,
			hauteur: 1080,
			echelle: 1,
			items: [[]],
			texte: '',
			image: { html: '', fichier: '' },
			nom: '',
			objet: '',
			objetVerrouille: false,
			outilSelectionner: true,
			outilDessiner: false,
			dessin: false,
			itemsDessin: [],
			historique: [],
			positionHistorique: 0,
			selection: false,
			positionX1: 0,
			positionY1: 0,
			positionX2: 0,
			positionY2: 0,
			positionSelectionX: 0,
			positionSelectionY: 0,
			largeurSelection: 0,
			hauteurSelection: 0,
			positionStylo: [],
			couleurStylo: '#000000',
			couleurSelecteur: '#000000',
			epaisseurStylo: 2,
			outil: '',
			creation: false,
			positionObjetX: 0,
			positionObjetY: 0,
			largeurObjet: 0,
			hauteurObjet: 0,
			utilisateurs: [],
			page: 0,
			chrono: '',
			itemsDupliques: [],
			imagesASupprimer: [],
			itemCopie: {},
			codeqr: '',
			modaleCodeQr: false,
			nouveaunom: '',
			donneesStatutUtilisateur: { identifiant: '', statut: '', message: '' },
			fonds: ['points.png', 'lignes-horizontales.png', 'quadrillage.png', 'quadrillage-gris.png', 'quadrillage-grand.png', 'quadrillage-gris-grand.png', 'couleur-ffffff.png', 'couleur-00ced1.png', 'couleur-00a885.png', 'couleur-f7d000.png', 'couleur-ff2d55.png']
		}
	},
	head () {
		return {
			title: this.titre + ' - Digiboard by La Digitale'
		}
	},
	computed: {
		hote () {
			return this.$store.state.hote
		},
		identifiant () {
			return this.$store.state.identifiant
		},
		nomUtilisateur () {
			return this.$store.state.nom
		},
		langue () {
			return this.$store.state.langue
		},
		langues () {
			return this.$store.state.langues
		},
		statutUtilisateur () {
			return this.$store.state.statut
		},
		tableaux () {
			return this.$store.state.tableaux
		}
	},
	watch: {
		outilSelectionner: function (valeur) {
			if (valeur === true) {
				this.activerDeplacement()
			}
			this.reinitialiserSelection()
		},
		outilDessiner: function (valeur) {
			if (valeur === true) {
				this.desactiverDeplacement()
				this.couleurStylo = '#000000'
				this.couleurSelecteur = '#000000'
			} else {
				this.couleurSelecteur = '#000000'
			}
			this.positionStylo = []
			this.reinitialiserSelection()
		},
		outil: function (valeur) {
			if (valeur === '') {
				this.activerDeplacement()
			} else {
				this.desactiverDeplacement()
			}
		}
	},
	watchQuery: ['page'],
	created () {
		this.$nuxt.$loading.start()
		const langue = this.$route.query.lang
		const page = parseInt(this.$route.query.page)
		if (this.langues.includes(langue) === true) {
			this.$i18n.setLocale(langue)
			this.$store.dispatch('modifierLangue', langue)
			this.$socket.emit('modifierlangue', langue)
		} else {
			this.$i18n.setLocale(this.langue)
		}
		if (page && (page - 1) > -1 && (page - 1) < this.donnees.length) {
			this.page = page - 1
		}
		if (this.options.hasOwnProperty('multipage') === false) {
			this.options.multipage = 'non'
		}
		if (this.options.hasOwnProperty('edition') === false) {
			this.options.edition = 'ouverte'
		}
		this.$socket.emit('connexion', { tableau: this.tableau, identifiant: this.identifiant, nom: this.nomUtilisateur, statut: this.statutUtilisateur })
	},
	mounted () {
		if (this.statutUtilisateur === 'auteur' && this.tableaux.includes(this.tableau)) {
			this.admin = true
		}

		this.largeurInitiale = document.querySelector('#tableau').offsetWidth
		this.definirDimensions()

		this.chargerItems(this.donnees, this.page)

		if (this.options.fond.substring(0, 1) === '#') {
			document.querySelector('#tableau .konvajs-content').style.backgroundColor = this.options.fond
			document.querySelector('#tableau .konvajs-content').style.backgroundImage = 'none'
		} else {
			document.querySelector('#tableau .konvajs-content').style.backgroundColor = 'transparent'
			document.querySelector('#tableau .konvajs-content').style.backgroundImage = 'url(/img/' + this.options.fond + ')'
			document.querySelector('#tableau .konvajs-content').style.backgroundRepeat = 'repeat'
		}

		const lien = this.hote + '/b/' + this.tableau
		const clipboardLien = new ClipboardJS('#copier-lien .lien', {
			text: function () {
				return lien
			}
		})
		clipboardLien.on('success', function () {
			this.$store.dispatch('modifierNotification', this.$t('lienCopie'))
		}.bind(this))
		const iframe = '<iframe src="' + this.hote + '/b/' + this.tableau + '" frameborder="0" width="100%" height="500"></iframe>'
		const clipboardCode = new ClipboardJS('#copier-code span', {
			text: function () {
				return iframe
			}
		})
		clipboardCode.on('success', function () {
			this.$store.dispatch('modifierNotification', this.$t('codeCopie'))
		}.bind(this))

		// eslint-disable-next-line
		this.codeqr = new QRCode('qr', {
			text: lien,
			width: 360,
			height: 360,
			colorDark: '#000000',
			colorLight: '#ffffff',
			// eslint-disable-next-line
			correctLevel : QRCode.CorrectLevel.H
		})

		window.addEventListener('resize', this.definirDimensions, false)

		if (this.admin || this.statutUtilisateur === 'editeur' || this.options.edition === 'ouverte') {
			window.addEventListener('keydown', this.gererClavier, false)
		}

		window.addEventListener('beforeunload', function () {
			this.$socket.emit('supprimerimages', { tableau: this.tableau, images: this.imagesASupprimer })
			this.$socket.emit('deconnexion', this.tableau)
		}.bind(this))

		document.querySelector('#tableau').addEventListener('dragover', function (event) {
			event.preventDefault()
			event.stopPropagation()
		}, false)

		document.querySelector('#tableau').addEventListener('dragcenter', function (event) {
			event.preventDefault()
			event.stopPropagation()
		}, false)

		document.querySelector('#tableau').addEventListener('drop', function (event) {
			event.preventDefault()
			event.stopPropagation()
			if (event.dataTransfer.files && event.dataTransfer.files[0]) {
				this.televerserImage(event.dataTransfer, 'drop')
			}
		}.bind(this), false)
	},
	beforeDestroy () {
		if (document.querySelector('#couleur-selecteur')) {
			document.querySelector('#couleur-selecteur').removeEventListener('change', this.modifierCouleurSelecteur)
		}
		if (this.admin || this.statutUtilisateur === 'editeur' || this.options.edition === 'ouverte') {
			window.removeEventListener('keydown', this.gererClavier, false)
		}
		window.removeEventListener('resize', this.definirDimensions, false)
	},
	methods: {
		definirDimensions () {
			this.$nextTick(function () {
				let largeur = document.body.clientWidth - 54
				let hauteur = largeur / (16 / 9)
				if (hauteur > (document.body.clientHeight - 54)) {
					hauteur = document.body.clientHeight - 54
					largeur = hauteur * (16 / 9)
				}
				this.echelle = largeur / this.largeur
				if (document.querySelector('#tableau .konvajs-content')) {
					document.querySelector('#tableau .konvajs-content').style.transform = 'scale(' + this.echelle + ')'
				}
				if (this.items[this.page] && this.items[this.page].length > 0) {
					this.$nextTick(function () {
						this.items[this.page].forEach(function (item) {
							if (item.objet === 'ancre') {
								item.width = 10 / this.echelle
								item.height = 10 / this.echelle
								item.radius = 10 / this.echelle
							}
						}.bind(this))
						this.transformer()
					}.bind(this))
				}
			}.bind(this))
		},
		chargerItems (items, page) {
			const donnees = JSON.parse(JSON.stringify(items))
			const images = []
			for (let i = 0; i < donnees[page].length; i++) {
				if (donnees[page][i].objet === 'image' && donnees[page][i].fichier !== '') {
					const donneesImage = new Promise(function (resolve) {
						const image = new window.Image()
						image.src = '/fichiers/' + this.tableau + '/' + donnees[page][i].fichier
						image.onload = function () {
							donnees[page][i].image = image
							resolve('termine')
						}
					}.bind(this))
					images.push(donneesImage)
				}
			}
			Promise.all(images).then(function () {
				this.items = donnees
				this.$nextTick(function () {
					const transformer = this.$refs.transformer.getNode()
					const stage = transformer.getStage()
					const objets = stage.find((item) => {
						return item.getAttrs().objet && item.getAttrs().objet === 'image'
					})
					for (let i = 0; i < objets.length; i++) {
						if (objets[i].getAttrs().filtre === 'Aucun') {
							objets[i].filters([])
						} else {
							objets[i].cache()
							objets[i].filters([Konva.Filters[objets[i].getAttrs().filtre]])
							if (objets[i].getAttrs().filtre === 'Pixelate') {
								objets[i].pixelSize(10)
							}
						}
					}
					if (!this.admin && this.statutUtilisateur !== 'editeur' && this.options.edition !== 'ouverte') {
						this.desactiverDeplacement()
					}
					this.transformer()
				}.bind(this))
				this.$nextTick(function () {
					this.items[this.page].forEach(function (item) {
						if (item.objet === 'ancre') {
							item.visible = false
							item.width = 10 / this.echelle
							item.height = 10 / this.echelle
							item.radius = 10 / this.echelle
						}
					}.bind(this))
					this.transformer()
				}.bind(this))
				setTimeout(function () {
					this.$nuxt.$loading.finish()
					document.getElementsByTagName('html')[0].setAttribute('lang', this.langue)
				}.bind(this), 150)
			}.bind(this))
		},
		definirOutilPrincipal (type) {
			this.outilSelectionner = false
			this.outilDessiner = false
			if (type === 'selectionner') {
				this.outilSelectionner = true
				this.desactiverSelecteur()
			} else if (type === 'dessiner') {
				this.outilDessiner = true
				this.activerSelecteur()
			}
		},
		selectionnerOutil (type) {
			const outils = document.querySelectorAll('#outils .outil.actif')
			let actif = ''
			outils.forEach(function (outil) {
				if (outil.id) {
					actif = outil.id
				}
			})
			this.definirOutilPrincipal('selectionner')
			this.reinitialiserOutils()
			if ('outil-' + type !== actif) {
				this.outil = type
			}
		},
		ajouter (type) {
			this.definirOutilPrincipal('selectionner')
			this.objetVerrouille = false
			const id = (new Date()).getTime() + Math.random().toString(16).slice(10)
			let largeur, hauteur, ratio, items, nom, objet
			if (type === 'image') {
				largeur = this.image.html.width
				hauteur = this.image.html.height
				ratio = largeur / hauteur
				if (hauteur > this.hauteur / 3) {
					hauteur = this.hauteur / 3
					largeur = hauteur * ratio
				}
				if (largeur > this.largeur / 3) {
					largeur = this.largeur / 3
					hauteur = largeur * ratio
				}
			}
			switch (type) {
			case 'rectangle':
				items = [{ name: 'rect' + id, objet: 'rectangle', x: this.positionObjetX, y: this.positionObjetY, width: this.largeurObjet, height: this.hauteurObjet, fill: 'transparent', stroke: '#ff0000', strokeWidth: 3, strokeScaleEnabled: false, opacity: 1, draggable: true, verrouille: false }]
				nom = 'rect' + id
				objet = 'rectangle'
				break
			case 'rectangle-plein':
				items = [{ name: 'rect' + id, objet: 'rectangle-plein', x: this.positionObjetX, y: this.positionObjetY, width: this.largeurObjet, height: this.hauteurObjet, fill: '#cccccc', opacity: 1, draggable: true, verrouille: false }]
				nom = 'rect' + id
				objet = 'rectangle-plein'
				break
			case 'cercle':
				items = [{ name: 'circ' + id, objet: 'cercle', x: this.positionObjetX + (this.largeurObjet / 2), y: this.positionObjetY + (this.hauteurObjet / 2), width: this.largeurObjet, height: this.hauteurObjet, fill: 'transparent', stroke: '#ff0000', strokeWidth: 3, strokeScaleEnabled: false, opacity: 1, draggable: true, verrouille: false }]
				nom = 'circ' + id
				objet = 'cercle'
				break
			case 'cercle-plein':
				items = [{ name: 'circ' + id, objet: 'cercle-plein', x: this.positionObjetX + (this.largeurObjet / 2), y: this.positionObjetY + (this.hauteurObjet / 2), width: this.largeurObjet, height: this.hauteurObjet, fill: '#cccccc', opacity: 1, draggable: true, verrouille: false }]
				nom = 'circ' + id
				objet = 'cercle-plein'
				break
			case 'etoile':
				items = [{ name: 'star' + id, objet: 'etoile', x: this.positionX1, y: this.positionY1, width: 120, height: 120, fill: '#ffff00', stroke: 'black', strokeWidth: 3, strokeScaleEnabled: false, numPoints: 5, innerRadius: 20, outerRadius: 45, opacity: 1, draggable: true, verrouille: false }]
				nom = 'star' + id
				objet = 'etoile'
				break
			case 'surlignage':
				items = [{ name: 'rect' + id, objet: 'surlignage', x: this.positionObjetX, y: this.positionObjetY, width: this.largeurObjet, height: this.hauteurObjet, fill: '#ffff00', opacity: 0.5, draggable: true, verrouille: false }]
				nom = 'rect' + id
				objet = 'surlignage'
				break
			case 'ligne':
				items = [{ name: 'line' + id, objet: 'ligne', x: 0, y: 0, points: [this.positionX1, this.positionY1, this.positionX2, this.positionY2], fill: '#ff0000', stroke: '#ff0000', strokeWidth: 3, hitStrokeWidth: 50, opacity: 1, draggable: true, verrouille: false }, { name: 'ancr_line' + id + '_1', objet: 'ancre', x: this.positionX1, y: this.positionY1, radius: 10 / this.echelle, width: 10 / this.echelle, height: 10 / this.echelle, fill: '#ffff00', stroke: '#000000', strokeWidth: 1, visible: true, opacity: 1, draggable: true }, { name: 'ancr_line' + id + '_2', objet: 'ancre', x: this.positionX2, y: this.positionY2, radius: 10 / this.echelle, width: 10 / this.echelle, height: 10 / this.echelle, fill: '#ffff00', stroke: '#000000', strokeWidth: 1, visible: true, opacity: 1, draggable: true }]
				nom = 'line' + id
				objet = 'ligne'
				break
			case 'fleche':
				items = [{ name: 'flec' + id, objet: 'fleche', x: 0, y: 0, points: [this.positionX1, this.positionY1, this.positionX2, this.positionY2], pointerLength: 25, pointerWidth: 20, fill: '#ff0000', stroke: '#ff0000', strokeWidth: 3, hitStrokeWidth: 50, opacity: 1, draggable: true, verrouille: false }, { name: 'ancr_flec' + id + '_1', objet: 'ancre', x: this.positionX1, y: this.positionY1, radius: 10 / this.echelle, width: 10 / this.echelle, height: 10 / this.echelle, fill: '#ffff00', stroke: '#000000', strokeWidth: 1, visible: true, opacity: 1, draggable: true }, { name: 'ancr_flec' + id + '_2', objet: 'ancre', x: this.positionX2, y: this.positionY2, radius: 10 / this.echelle, width: 10 / this.echelle, height: 10 / this.echelle, fill: '#ffff00', stroke: '#000000', strokeWidth: 1, visible: true, opacity: 1, draggable: true }]
				nom = 'flec' + id
				objet = 'fleche'
				break
			case 'texte':
				items = [{ name: 'text' + id, objet: 'texte', text: this.texte, fontSize: 25, lineHeight: 1.25, verticalAlign: 'middle', padding: 10, x: this.positionX1, y: this.positionY1, fill: '#000000', opacity: 1, wrap: 'word', draggable: true, verrouille: false }]
				nom = 'text' + id
				objet = 'texte'
				break
			case 'label':
				items = [{ name: 'labl' + id, objet: 'label', x: this.positionX1, y: this.positionY1, opacity: 1, draggable: true, verrouille: false, tag: { name: 'labl' + id, objet: 'label', shadowColor: '#222222', shadowBlur: 10, shadowOffset: [7, 7], shadowOpacity: 0.2, fill: '#ffff00' }, text: { name: 'labl' + id, objet: 'label', text: this.texte, fontSize: 25, lineHeight: 1.25, verticalAlign: 'middle', fill: '#000000', padding: 20, wrap: 'word', align: 'center' } }]
				nom = 'labl' + id
				objet = 'label'
				break
			case 'image':
				items = [{ name: 'imag' + id, objet: 'image', image: this.image.html, fichier: this.image.fichier, width: largeur, height: hauteur, x: (this.largeur / 2) - (largeur / 2), y: (this.hauteur / 2) - (hauteur / 2), filtre: 'Aucun', opacity: 1, draggable: true, verrouille: false }]
				nom = 'imag' + id
				objet = 'image'
				this.image = { html: '', fichier: '' }
				break
			}
			this.items[this.page].push(...items)
			this.nom = nom
			this.objet = objet
			this.enregistrer('ajouter', '', items)
			this.$nextTick(function () {
				this.transformer()
				const copieItems = JSON.parse(JSON.stringify(items))
				copieItems.forEach(function (item) {
					if (item.objet === 'image') {
						delete item.image
					}
				})
				if (this.objet === 'image') { // fix pour sélection du filtre
					this.nom = ''
					this.objet = ''
					this.transformer()
					this.$nextTick(function () {
						this.nom = nom
						this.objet = objet
						this.transformer()
					}.bind(this))
				}
				this.$socket.emit('ajouter', { tableau: this.tableau, page: this.page, items: copieItems })
			}.bind(this))
		},
		dessinerForme (type) {
			this.ajouter(type)
			this.reinitialiserOutils()
			this.creation = false
		},
		verrouiller () {
			let item
			const noms = []
			if (this.objet !== 'selection') {
				item = this.items[this.page].find(r => r.name === this.nom)
				if (item) {
					item.draggable = false
					item.verrouille = true
					noms.push(this.nom)
				}
			} else {
				const objets = this.$refs.transformer.getNode().nodes()
				for (let i = 0; i < objets.length; i++) {
					item = this.items[this.page].find(r => r.name === objets[i].getAttrs().name)
					if (item) {
						item.draggable = false
						item.verrouille = true
						noms.push(objets[i].getAttrs().name)
					}
				}
			}
			this.objetVerrouille = true
			this.items[this.page].forEach(function (item, index) {
				if (item.objet === 'ancre') {
					this.items[this.page][index].visible = false
				}
			}.bind(this))
			if (this.objet !== 'selection') {
				this.transformer()
			} else {
				this.$refs.transformer.getNode().getLayer().batchDraw()
			}
			this.enregistrer('verrouiller', noms, '')
			this.$socket.emit('verrouiller', { tableau: this.tableau, page: this.page, noms: noms })
		},
		deverrouiller () {
			let item
			const noms = []
			if (this.objet !== 'selection') {
				item = this.items[this.page].find(r => r.name === this.nom)
				if (item && item.objet !== 'dessin') {
					item.draggable = true
					item.verrouille = false
					noms.push(this.nom)
				}
			} else {
				const objets = this.$refs.transformer.getNode().nodes()
				for (let i = 0; i < objets.length; i++) {
					item = this.items[this.page].find(r => r.name === objets[i].getAttrs().name)
					if (item && item.objet !== 'dessin') {
						item.draggable = true
						item.verrouille = false
						noms.push(objets[i].getAttrs().name)
					}
				}
			}
			this.objetVerrouille = false
			const type = item.name.substring(0, 4)
			if (type === 'flec' || type === 'line') {
				const ancre1 = this.items[this.page].find(r => r.name === 'ancr_' + item.name + '_1')
				const ancre2 = this.items[this.page].find(r => r.name === 'ancr_' + item.name + '_2')
				ancre1.visible = true
				ancre2.visible = true
			}
			if (this.objet !== 'selection') {
				this.nom = item.name
				this.objet = item.objet
				this.transformer()
			} else {
				this.reinitialiserSelection()
				this.$refs.transformer.getNode().getLayer().batchDraw()
			}
			this.enregistrer('deverrouiller', noms, '')
			this.$socket.emit('deverrouiller', { tableau: this.tableau, page: this.page, noms: noms })
		},
		mettreDevant () {
			let indexItem
			this.items[this.page].forEach(function (item, index) {
				if (item.name === this.nom && index < this.items[this.page].length) {
					this.items[this.page].splice(index, 1)
					this.items[this.page].splice(index + 1, 0, item)
					indexItem = index + 1
				}
			}.bind(this))
			this.$nextTick(function () {
				this.transformer()
			}.bind(this))
			if (this.chrono !== '') {
				clearTimeout(this.chrono)
				this.chrono = ''
			}
			this.chrono = setTimeout(function () {
				this.enregistrer('modifierposition', this.nom, indexItem)
				this.$socket.emit('modifierposition', { tableau: this.tableau, page: this.page, nom: this.nom, index: indexItem })
				this.chrono = ''
			}.bind(this), 400)
		},
		mettreDerriere () {
			let indexItem
			this.items[this.page].forEach(function (item, index) {
				if (item.name === this.nom && index > 0) {
					this.items[this.page].splice(index, 1)
					this.items[this.page].splice(index - 1, 0, item)
					indexItem = index - 1
				}
			}.bind(this))
			this.$nextTick(function () {
				this.transformer()
			}.bind(this))
			if (this.chrono !== '') {
				clearTimeout(this.chrono)
				this.chrono = ''
			}
			this.chrono = setTimeout(function () {
				this.enregistrer('modifierposition', this.nom, indexItem)
				this.$socket.emit('modifierposition', { tableau: this.tableau, page: this.page, nom: this.nom, index: indexItem })
				this.chrono = ''
			}.bind(this), 400)
		},
		ajouterTexte () {
			this.ajouter(this.outil)
			this.reinitialiserOutils()
			this.fermerModaleTexte()
			this.selection = false
			this.activerSelecteur()
		},
		modifierTexte (event) {
			const texte = event.target.text()
			this.texte = texte
			this.modale = 'texte'
			setTimeout(function () {
				document.querySelector('#texte textarea').focus()
			}, 10)
		},
		enregistrerTexte () {
			const type = this.nom.substring(0, 4)
			const item = this.items[this.page].find(r => r.name === this.nom)
			const texte = this.texte
			if (type === 'text') {
				item.text = texte
			} else {
				item.text.text = texte
				this.$nextTick(function () {
					this.transformer()
				}.bind(this))
			}
			this.fermerModaleTexte()
			this.enregistrer('modifiertexte', this.nom, texte)
			this.$socket.emit('modifiertexte', { tableau: this.tableau, page: this.page, nom: this.nom, texte: texte })
		},
		fermerModaleTexte () {
			this.texte = ''
			this.modale = ''
		},
		reduireTailleTexte () {
			const item = this.items[this.page].find(r => r.name === this.nom)
			const taille = item.fontSize
			item.fontSize = taille - 2
			if (this.chrono !== '') {
				clearTimeout(this.chrono)
				this.chrono = ''
			}
			this.chrono = setTimeout(function () {
				this.enregistrer('modifiertailletexte', this.nom, taille - 2)
				this.$socket.emit('modifiertailletexte', { tableau: this.tableau, page: this.page, nom: this.nom, taille: taille - 2 })
				this.chrono = ''
			}.bind(this), 400)
		},
		augmenterTailleTexte () {
			const item = this.items[this.page].find(r => r.name === this.nom)
			const taille = item.fontSize
			item.fontSize = taille + 2
			if (this.chrono !== '') {
				clearTimeout(this.chrono)
				this.chrono = ''
			}
			this.chrono = setTimeout(function () {
				this.enregistrer('modifiertailletexte', this.nom, taille + 2)
				this.$socket.emit('modifiertailletexte', { tableau: this.tableau, page: this.page, nom: this.nom, taille: taille + 2 })
				this.chrono = ''
			}.bind(this), 400)
		},
		alignerTexte (alignement) {
			const item = this.items[this.page].find(r => r.name === this.nom)
			item.align = alignement
			item.opacity = 0.9
			item.opacity = 1 // pour activer modif alignement...
			this.enregistrer('modifieralignementtexte', this.nom, alignement)
			this.$socket.emit('modifieralignementtexte', { tableau: this.tableau, page: this.page, nom: this.nom, alignement: alignement })
		},
		televerserImage (champ, input) {
			const formats = ['jpg', 'jpeg', 'png', 'gif', 'svg']
			const extension = champ.files[0].name.substring(champ.files[0].name.lastIndexOf('.') + 1).toLowerCase()
			if (champ.files && champ.files[0] && formats.includes(extension) && champ.files[0].size < 1024000) {
				this.$nuxt.$loading.start()
				const fichier = champ.files[0]
				const formulaire = new FormData()
				formulaire.append('tableau', this.tableau)
				formulaire.append('fichier', fichier)
				axios.post(this.hote + '/api/televerser-image', formulaire, {
					headers: {
						'Content-Type': 'multipart/form-data'
					}
				}).then(function (reponse) {
					const donnees = reponse.data
					if (donnees === 'erreur_televersement') {
						this.$nuxt.$loading.finish()
						this.$store.dispatch('modifierMessage', this.$t('erreurTeleversementImage'))
					} else if (donnees === 'erreur_type_fichier') {
						this.$nuxt.$loading.finish()
						this.$store.dispatch('modifierMessage', this.$t('formatFichierPasAccepte'))
					} else if (donnees !== '') {
						const image = new window.Image()
						image.src = '/fichiers/' + this.tableau + '/' + donnees
						image.onload = function () {
							this.image.html = image
							this.image.fichier = donnees
							this.ajouter('image')
							this.$nuxt.$loading.finish()
						}.bind(this)
					}
					if (input === 'change') {
						champ.value = ''
					}
					this.reinitialiserOutils()
				}.bind(this)).catch(function () {
					this.$nuxt.$loading.finish()
					if (input === 'change') {
						champ.value = ''
					}
					this.$store.dispatch('modifierMessage', this.$t('erreurCommunicationServeur'))
					this.reinitialiserOutils()
				}.bind(this))
			} else {
				if (formats.includes(extension) === false) {
					this.$store.dispatch('modifierMessage', this.$t('formatFichierPasAccepte'))
				} else if (champ.files[0].size > 1024000) {
					this.$store.dispatch('modifierMessage', this.$t('tailleMaximale'))
				}
				if (input === 'change') {
					champ.value = ''
				}
				this.reinitialiserOutils()
			}
		},
		modifierFiltre (filtre) {
			const objets = this.$refs.transformer.getNode().nodes()
			for (let i = 0; i < objets.length; i++) {
				if (this.nom === objets[i].getAttrs().name) {
					if (filtre === 'Aucun') {
						objets[i].filters([])
					} else {
						objets[i].cache()
						objets[i].filters([Konva.Filters[filtre]])
						if (filtre === 'Pixelate') {
							objets[i].pixelSize(10)
						}
					}
					this.$nextTick(function () {
						this.transformer()
						this.items[this.page].forEach(function (item) {
							if (item.name === this.nom) {
								item.filtre = filtre
							}
						}.bind(this))
						this.enregistrer('modifierfiltre', this.nom, filtre)
						this.$socket.emit('modifierfiltre', { tableau: this.tableau, page: this.page, nom: this.nom, filtre: filtre })
					}.bind(this))
				}
			}
		},
		definirFiltre () {
			const objets = this.$refs.transformer.getNode().nodes()
			let filtre
			for (let i = 0; i < objets.length; i++) {
				if (this.nom === objets[i].getAttrs().name && objets[i].getFilters() && objets[i].getFilters()[0]) {
					filtre = objets[i].getFilters()[0].name
				} else {
					filtre = 'Aucun'
				}
			}
			return filtre
		},
		definirCouleurSelecteur (objet, item) {
			switch (objet) {
			case 'rectangle':
			case 'cercle':
			case 'ligne':
			case 'fleche':
			case 'dessin':
				if (['#000000', '#ffffff', '#ff0000', '#ffff00', '#00ff00', '#04fdff', '#cccccc'].includes(item.stroke) === false) {
					this.couleurSelecteur = item.stroke
				}
				break
			case 'rectangle-plein':
			case 'cercle-plein':
			case 'etoile':
			case 'surlignage':
			case 'texte':
				if (['#000000', '#ffffff', '#ff0000', '#ffff00', '#00ff00', '#04fdff', '#cccccc'].includes(item.fill) === false) {
					this.couleurSelecteur = item.fill
				}
				break
			case 'label':
				if (['#000000', '#ffffff', '#ff0000', '#ffff00', '#00ff00', '#04fdff', '#cccccc'].includes(item.tag.fill) === false) {
					this.couleurSelecteur = item.tag.fill
				}
				break
			}
		},
		definirCouleur () {
			const couleur = document.querySelector('#couleur-selecteur').value
			if (this.outilDessiner && this.couleurSelecteur !== '#000000') {
				this.couleurStylo = couleur
			} else if (!this.outilDessiner && this.couleurSelecteur !== '#000000') {
				this.modifierCouleur(couleur)
			}
		},
		modifierCouleurSelecteur (event) {
			this.couleurSelecteur = event.target.value
			this.modifierCouleur(event.target.value)
		},
		modifierCouleur (couleur) {
			if (this.outilSelectionner) {
				let item = this.items[this.page].find(r => r.name === this.nom)
				if (this.objet === 'ancre') {
					item = this.items[this.page].find(r => r.name === this.nom.split('_')[1])
				}
				switch (this.objet) {
				case 'rectangle':
				case 'cercle':
				case 'dessin':
					item.stroke = couleur
					break
				case 'rectangle-plein':
				case 'cercle-plein':
				case 'etoile':
				case 'surlignage':
				case 'texte':
					item.fill = couleur
					break
				case 'ligne':
				case 'fleche':
				case 'ancre':
					item.stroke = couleur
					item.fill = couleur
					break
				case 'label':
					item.tag.fill = couleur
					break
				}
				this.enregistrer('modifiercouleur', this.nom, couleur)
				this.$socket.emit('modifiercouleur', { tableau: this.tableau, page: this.page, nom: this.nom, couleur: couleur })
			} else if (this.outilDessiner) {
				this.couleurStylo = couleur
			}
		},
		modifierEpaisseur (epaisseur) {
			this.epaisseurStylo = epaisseur
		},
		copier () {
			let itemCopie = {}
			JSON.parse(JSON.stringify(this.items[this.page])).forEach(function (item) {
				if (item.name.includes(this.nom)) {
					itemCopie = item
				}
			}.bind(this))
			this.itemCopie = itemCopie
		},
		coller () {
			if (Object.keys(this.itemCopie).length > 0) {
				const id = (new Date()).getTime() + Math.random().toString(16).slice(10)
				const items = []
				let nom, objet
				items.push(this.itemCopie)
				if (this.itemCopie.name.substring(0, 4) === 'imag') {
					this.$nuxt.$loading.start()
					const image = this.itemCopie.image
					const filtre = this.itemCopie.filtre
					axios.post(this.hote + '/api/copier-image', {
						tableau: this.tableau,
						image: image
					}).then(function (reponse) {
						const donnees = reponse.data
						if (donnees === 'erreur') {
							this.$nuxt.$loading.finish()
							this.$store.dispatch('modifierMessage', this.$t('erreurCommunicationServeur'))
						} else if (donnees !== '') {
							const image = new window.Image()
							image.src = '/fichiers/' + this.tableau + '/' + donnees
							image.onload = function () {
								this.$nuxt.$loading.finish()
								items.forEach(function (item) {
									const type = item.name.substring(0, 4)
									nom = type + id
									objet = item.objet
									item.name = nom
									item.image = image
									item.fichier = donnees
								})
								this.items[this.page].forEach(function (item, index) {
									if (item.objet === 'ancre') {
										this.items[this.page][index].visible = false
									}
								}.bind(this))
								this.$nextTick(function () {
									this.items[this.page].push(...items)
									this.nom = nom
									this.objet = objet
									this.enregistrer('ajouter', '', items)
									this.$nextTick(function () {
										const objets = this.$refs.transformer.getNode().getStage().find((item) => {
											return item.getAttrs().objet && item.getAttrs().objet === 'image'
										})
										for (let i = 0; i < objets.length; i++) {
											if (nom === objets[i].getAttrs().name) {
												if (filtre === 'Aucun') {
													objets[i].filters([])
												} else {
													objets[i].cache()
													objets[i].filters([Konva.Filters[filtre]])
													if (filtre === 'Pixelate') {
														objets[i].pixelSize(10)
													}
												}
											}
										}
										this.transformer()
										const copieItems = JSON.parse(JSON.stringify(items))
										copieItems.forEach(function (item) {
											if (item.objet === 'image') {
												delete item.image
											}
										})
										this.nom = ''
										this.objet = ''
										this.transformer()
										this.$nextTick(function () {
											this.nom = nom
											this.objet = objet
											this.transformer()
										}.bind(this))
										this.$socket.emit('ajouter', { tableau: this.tableau, page: this.page, items: copieItems })
									}.bind(this))
								}.bind(this))
							}.bind(this)
						}
					}.bind(this)).catch(function () {
						this.$store.dispatch('modifierMessage', this.$t('erreurCommunicationServeur'))
					}.bind(this))
				} else {
					items.forEach(function (item) {
						const type = item.name.substring(0, 4)
						if (type === 'ancr') {
							item.name = item.name.substring(0, 9) + id + item.name.substring(item.name.length - 2)
						} else {
							nom = type + id
							objet = item.objet
							item.name = nom
						}
						if (type === 'labl') {
							item.tag.name = type + id
							item.text.name = type + id
						}
					})
					this.items[this.page].forEach(function (item, index) {
						if (item.objet === 'ancre') {
							this.items[this.page][index].visible = false
						}
					}.bind(this))
					this.$nextTick(function () {
						this.items[this.page].push(...items)
						this.nom = nom
						this.objet = objet
						this.enregistrer('ajouter', '', items)
						this.$nextTick(function () {
							this.transformer()
							const copieItems = JSON.parse(JSON.stringify(items))
							this.itemsDupliques.push(...copieItems)
							if (this.chrono !== '') {
								clearTimeout(this.chrono)
								this.chrono = ''
							}
							this.chrono = setTimeout(function () {
								this.$socket.emit('ajouter', { tableau: this.tableau, page: this.page, items: this.itemsDupliques })
								this.chrono = ''
								this.itemsDupliques = []
							}.bind(this), 400)
						}.bind(this))
					}.bind(this))
				}
			}
		},
		dupliquer () {
			const id = (new Date()).getTime() + Math.random().toString(16).slice(10)
			const items = []
			let nom, objet
			if (this.nom.substring(0, 4) === 'imag') {
				this.$nuxt.$loading.start()
				let image, filtre
				JSON.parse(JSON.stringify(this.items[this.page])).forEach(function (item) {
					if (item.name.includes(this.nom)) {
						image = item.fichier
						filtre = item.filtre
						items.push(item)
					}
				}.bind(this))
				axios.post(this.hote + '/api/copier-image', {
					tableau: this.tableau,
					image: image
				}).then(function (reponse) {
					const donnees = reponse.data
					if (donnees === 'erreur') {
						this.$nuxt.$loading.finish()
						this.$store.dispatch('modifierMessage', this.$t('erreurCommunicationServeur'))
					} else if (donnees !== '') {
						const image = new window.Image()
						image.src = '/fichiers/' + this.tableau + '/' + donnees
						image.onload = function () {
							this.$nuxt.$loading.finish()
							items.forEach(function (item) {
								const type = item.name.substring(0, 4)
								nom = type + id
								objet = item.objet
								item.name = nom
								item.image = image
								item.fichier = donnees
								item.x = item.x + 20
								item.y = item.y + 20
							})
							this.items[this.page].forEach(function (item, index) {
								if (item.objet === 'ancre') {
									this.items[this.page][index].visible = false
								}
							}.bind(this))
							this.$nextTick(function () {
								this.items[this.page].push(...items)
								this.nom = nom
								this.objet = objet
								this.enregistrer('ajouter', '', items)
								this.$nextTick(function () {
									const objets = this.$refs.transformer.getNode().getStage().find((item) => {
										return item.getAttrs().objet && item.getAttrs().objet === 'image'
									})
									for (let i = 0; i < objets.length; i++) {
										if (nom === objets[i].getAttrs().name) {
											if (filtre === 'Aucun') {
												objets[i].filters([])
											} else {
												objets[i].cache()
												objets[i].filters([Konva.Filters[filtre]])
												if (filtre === 'Pixelate') {
													objets[i].pixelSize(10)
												}
											}
										}
									}
									this.transformer()
									const copieItems = JSON.parse(JSON.stringify(items))
									copieItems.forEach(function (item) {
										if (item.objet === 'image') {
											delete item.image
										}
									})
									this.nom = ''
									this.objet = ''
									this.transformer()
									this.$nextTick(function () {
										this.nom = nom
										this.objet = objet
										this.transformer()
									}.bind(this))
									this.$socket.emit('ajouter', { tableau: this.tableau, page: this.page, items: copieItems })
								}.bind(this))
							}.bind(this))
						}.bind(this)
					}
				}.bind(this)).catch(function () {
					this.$store.dispatch('modifierMessage', this.$t('erreurCommunicationServeur'))
				}.bind(this))
			} else {
				JSON.parse(JSON.stringify(this.items[this.page])).forEach(function (item) {
					if (item.name.includes(this.nom)) {
						items.push(item)
					}
				}.bind(this))
				items.forEach(function (item) {
					const type = item.name.substring(0, 4)
					if (type === 'ancr') {
						item.name = item.name.substring(0, 9) + id + item.name.substring(item.name.length - 2)
						item.x = item.x + 20
						item.y = item.y + 20
					} else {
						nom = type + id
						objet = item.objet
						item.name = nom
						item.x = item.x + 20
						item.y = item.y + 20
					}
					if (type === 'labl') {
						item.tag.name = type + id
						item.text.name = type + id
					}
				})
				this.items[this.page].forEach(function (item, index) {
					if (item.objet === 'ancre') {
						this.items[this.page][index].visible = false
					}
				}.bind(this))
				this.$nextTick(function () {
					this.items[this.page].push(...items)
					this.nom = nom
					this.objet = objet
					this.enregistrer('ajouter', '', items)
					this.$nextTick(function () {
						this.transformer()
						const copieItems = JSON.parse(JSON.stringify(items))
						this.itemsDupliques.push(...copieItems)
						if (this.chrono !== '') {
							clearTimeout(this.chrono)
							this.chrono = ''
						}
						this.chrono = setTimeout(function () {
							this.$socket.emit('ajouter', { tableau: this.tableau, page: this.page, items: this.itemsDupliques })
							this.chrono = ''
							this.itemsDupliques = []
						}.bind(this), 400)
					}.bind(this))
				}.bind(this))
			}
		},
		supprimer (mode) {
			const type = this.nom.substring(0, 4)
			const nom = this.nom
			if (type === 'imag') {
				this.imagesASupprimer.push(this.items[this.page].find(r => r.name === nom).fichier)
			}
			if (type === 'ancr') {
				this.items[this.page] = this.items[this.page].filter(r => !r.name.includes(nom.split('_')[1]))
			} else {
				this.items[this.page] = this.items[this.page].filter(r => !r.name.includes(nom))
			}
			this.nom = ''
			this.objet = ''
			this.transformer()
			this.enregistrer('supprimer', nom, '')
			if (mode === 'objet') {
				this.$socket.emit('supprimer', { tableau: this.tableau, page: this.page, nom: nom })
			}
		},
		supprimerSelection () {
			const objets = this.$refs.transformer.getNode().nodes()
			const noms = []
			for (let i = 0; i < objets.length; i++) {
				noms.push(objets[i].getAttrs().name)
				this.nom = objets[i].getAttrs().name
				this.supprimer('selection')
			}
			this.$socket.emit('supprimerselection', { tableau: this.tableau, page: this.page, noms: noms })
		},
		ajouterPage () {
			this.items.push([])
			this.enregistrer('ajouterpage', '', this.items.length - 1)
			this.$socket.emit('ajouterpage', { tableau: this.tableau, page: this.items.length - 1 })
		},
		afficherPage (page) {
			this.$nuxt.$loading.start()
			this.reinitialiserSelection()
			this.page = page
			this.reinitialiserImages()
			this.chargerItems(this.items, this.page)
			const urlParams = new URLSearchParams(window.location.search)
			urlParams.set('page', this.page + 1)
			window.history.replaceState('', '', this.hote + '/b/' + this.tableau + '?' + urlParams)
			if (this.menu === 'pages') {
				document.querySelector('#page' + this.page).scrollIntoView({ behavior: 'smooth', block: 'start', inline: 'center' })
			}
		},
		afficherPageSuivante () {
			this.$nuxt.$loading.start()
			this.reinitialiserSelection()
			if (this.admin && this.page + 1 === this.items.length) {
				this.ajouterPage()
			} else if (!this.admin && this.page + 1 === this.items.length) {
				return false
			}
			this.page++
			this.reinitialiserImages()
			this.chargerItems(this.items, this.page)
			const urlParams = new URLSearchParams(window.location.search)
			urlParams.set('page', this.page + 1)
			window.history.replaceState('', '', this.hote + '/b/' + this.tableau + '?' + urlParams)
			if (this.menu === 'pages') {
				document.querySelector('#page' + this.page).scrollIntoView({ behavior: 'smooth', block: 'start', inline: 'center' })
			}
		},
		afficherPagePrecedente () {
			if (this.page > 0) {
				this.$nuxt.$loading.start()
				this.reinitialiserSelection()
				this.page--
				this.reinitialiserImages()
				this.chargerItems(this.items, this.page)
				const urlParams = new URLSearchParams(window.location.search)
				urlParams.set('page', this.page + 1)
				window.history.replaceState('', '', this.hote + '/b/' + this.tableau + '?' + urlParams)
				if (this.menu === 'pages') {
					document.querySelector('#page' + this.page).scrollIntoView({ behavior: 'smooth', block: 'start', inline: 'center' })
				}
			}
		},
		deplacerPage (event) {
			this.page = event.newIndex
			this.afficherPage(this.page)
			this.$socket.emit('deplacerpage', { tableau: this.tableau, ancienIndex: event.oldIndex, nouvelIndex: event.newIndex })
		},
		supprimerPage (event, page) {
			event.preventDefault()
			event.stopPropagation()
			this.items[page].forEach(function (item) {
				if (item.objet === 'image') {
					this.imagesASupprimer.push(item.fichier)
				}
			}.bind(this))
			this.items.splice(page, 1)
			this.enregistrer('supprimerpage', '', page)
			this.$socket.emit('supprimerpage', { tableau: this.tableau, page: page })
			if (this.page === page && this.page > 0) {
				this.page--
				this.afficherPage(this.page)
			} else if (this.page === page && this.page === 0) {
				this.page = 0
				this.afficherPage(this.page)
			}
		},
		gererClavier (event) {
			if (event.ctrlKey && event.key === 'd' && this.modale !== 'texte') {
				event.preventDefault()
				this.dupliquer()
			} else if (event.ctrlKey && event.key === 'c' && this.modale !== 'texte') {
				event.preventDefault()
				this.copier()
			} else if (event.ctrlKey && event.key === 'v' && this.modale !== 'texte') {
				event.preventDefault()
				this.coller()
			} else if (event.ctrlKey && event.key === 'z' && this.modale !== 'texte') {
				event.preventDefault()
				this.defaire()
			} else if (event.ctrlKey && event.key === 'y' && this.modale !== 'texte') {
				event.preventDefault()
				this.refaire()
			} else if ((event.key === 'Backspace' || event.key === 'Delete') && this.modale !== 'texte') {
				if (this.nom !== '' && this.objet !== 'selection') {
					this.supprimer('objet')
				} else if (this.nom !== '' && this.objet === 'selection') {
					this.supprimerSelection()
				}
			} else if (event.key === 'ArrowDown' || event.key === 'ArrowUp' || event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
				const items = []
				let item, type, ancre1, ancre2
				if (this.objet !== 'selection') {
					item = this.items[this.page].find(r => r.name === this.nom)
					type = this.nom.substring(0, 4)
					if (type === 'flec' || type === 'line') {
						ancre1 = this.items[this.page].find(r => r.name === 'ancr_' + this.nom + '_1')
						ancre2 = this.items[this.page].find(r => r.name === 'ancr_' + this.nom + '_2')
					}
					if (item && event.key === 'ArrowDown') {
						item.y = item.y + 2
						if (type === 'flec' || type === 'line') {
							ancre1.y = ancre1.y + 2
							ancre2.y = ancre2.y + 2
						}
					} else if (item && event.key === 'ArrowUp') {
						item.y = item.y - 2
						if (type === 'flec' || type === 'line') {
							ancre1.y = ancre1.y - 2
							ancre2.y = ancre2.y - 2
						}
					} else if (item && event.key === 'ArrowLeft') {
						item.x = item.x - 2
						if (type === 'flec' || type === 'line') {
							ancre1.x = ancre1.x - 2
							ancre2.x = ancre2.x - 2
						}
					} else if (item && event.key === 'ArrowRight') {
						item.x = item.x + 2
						if (type === 'flec' || type === 'line') {
							ancre1.x = ancre1.x + 2
							ancre2.x = ancre2.x + 2
						}
					}
					items.push({ nom: this.nom, x: item.x, y: item.y })
					if (type === 'flec' || type === 'line') {
						items.push({ nom: 'ancr_' + this.nom + '_1', x: ancre1.x, y: ancre1.y })
						items.push({ nom: 'ancr_' + this.nom + '_2', x: ancre2.x, y: ancre2.y })
					}
				} else {
					const objets = this.$refs.transformer.getNode().nodes()
					for (let i = 0; i < objets.length; i++) {
						item = this.items[this.page].find(r => r.name === objets[i].getAttrs().name)
						type = objets[i].getAttrs().name.substring(0, 4)
						if (type === 'flec' || type === 'line') {
							ancre1 = this.items[this.page].find(r => r.name === 'ancr_' + objets[i].getAttrs().name + '_1')
							ancre2 = this.items[this.page].find(r => r.name === 'ancr_' + objets[i].getAttrs().name + '_2')
						}
						if (item && event.key === 'ArrowDown') {
							item.y = item.y + 2
							if (type === 'flec' || type === 'line') {
								ancre1.y = ancre1.y + 2
								ancre2.y = ancre2.y + 2
							}
						} else if (item && event.key === 'ArrowUp') {
							item.y = item.y - 2
							if (type === 'flec' || type === 'line') {
								ancre1.y = ancre1.y - 2
								ancre2.y = ancre2.y - 2
							}
						} else if (item && event.key === 'ArrowLeft') {
							item.x = item.x - 2
							if (type === 'flec' || type === 'line') {
								ancre1.x = ancre1.x - 2
								ancre2.x = ancre2.x - 2
							}
						} else if (item && event.key === 'ArrowRight') {
							item.x = item.x + 2
							if (type === 'flec' || type === 'line') {
								ancre1.x = ancre1.x + 2
								ancre2.x = ancre2.x + 2
							}
						}
						items.push({ nom: objets[i].getAttrs().name, x: item.x, y: item.y })
						if (type === 'flec' || type === 'line') {
							items.push({ nom: 'ancr_' + objets[i].getAttrs().name + '_1', x: ancre1.x, y: ancre1.y })
							items.push({ nom: 'ancr_' + objets[i].getAttrs().name + '_2', x: ancre2.x, y: ancre2.y })
						}
					}
				}
				if (this.chrono !== '') {
					clearTimeout(this.chrono)
					this.chrono = ''
				}
				this.chrono = setTimeout(function () {
					this.enregistrer('deplacer', '', items)
					this.$socket.emit('deplacer', { tableau: this.tableau, page: this.page, items: items })
					this.chrono = ''
				}.bind(this), 400)
			}
		},
		afficherReinitialiser () {
			this.modale = 'reinitialiser'
		},
		reinitialiser () {
			this.$nuxt.$loading.start()
			this.modale = ''
			this.$socket.emit('reinitialiser', { tableau: this.tableau })
		},
		deplacerFin (event) {
			const items = []
			let item, type, ancre1, ancre2
			if (this.objet !== 'selection') {
				item = this.items[this.page].find(r => r.name === this.nom)
				type = this.nom.substring(0, 4)
				if (item && type === 'ancr') {
					const nom = this.nom.split('_')[1]
					item = this.items[this.page].find(r => r.name === nom)
					items.push({ nom: nom, x: item.x, y: item.y, points: item.points })
					ancre1 = this.items[this.page].find(r => r.name === 'ancr_' + nom + '_1')
					ancre2 = this.items[this.page].find(r => r.name === 'ancr_' + nom + '_2')
					items.push({ nom: 'ancr_' + nom + '_1', x: ancre1.x, y: ancre1.y })
					items.push({ nom: 'ancr_' + nom + '_2', x: ancre2.x, y: ancre2.y })
				} else if (item && (type === 'flec' || type === 'line')) {
					items.push({ nom: this.nom, x: item.x, y: item.y, points: item.points })
					ancre1 = this.items[this.page].find(r => r.name === 'ancr_' + this.nom + '_1')
					ancre2 = this.items[this.page].find(r => r.name === 'ancr_' + this.nom + '_2')
					items.push({ nom: 'ancr_' + this.nom + '_1', x: ancre1.x, y: ancre1.y })
					items.push({ nom: 'ancr_' + this.nom + '_2', x: ancre2.x, y: ancre2.y })
				} else if (item) {
					item.x = event.target.x()
					item.y = event.target.y()
					items.push({ nom: this.nom, x: event.target.x(), y: event.target.y() })
				}
			} else {
				const objets = this.$refs.transformer.getNode().nodes()
				for (let i = 0; i < objets.length; i++) {
					item = this.items[this.page].find(r => r.name === objets[i].getAttrs().name)
					type = objets[i].getAttrs().name.substring(0, 4)
					if (item && (type === 'flec' || type === 'line')) {
						items.push({ nom: objets[i].getAttrs().name, x: item.x, y: item.y })
						ancre1 = this.items[this.page].find(r => r.name === 'ancr_' + objets[i].getAttrs().name + '_1')
						ancre2 = this.items[this.page].find(r => r.name === 'ancr_' + objets[i].getAttrs().name + '_2')
						items.push({ nom: 'ancr_' + objets[i].getAttrs().name + '_1', x: ancre1.x, y: ancre1.y })
						items.push({ nom: 'ancr_' + objets[i].getAttrs().name + '_2', x: ancre2.x, y: ancre2.y })
					} else if (item) {
						item.x = objets[i].getAttrs().x
						item.y = objets[i].getAttrs().y
						items.push({ nom: objets[i].getAttrs().name, x: objets[i].getAttrs().x, y: objets[i].getAttrs().y })
					}
				}
			}
			this.enregistrer('deplacer', '', items)
			this.$socket.emit('deplacer', { tableau: this.tableau, page: this.page, items: items })
		},
		redimensionnerFin (event) {
			const item = this.items[this.page].find(r => r.name === this.nom)
			if (item) {
				item.x = event.target.x()
				item.y = event.target.y()
				item.width = event.target.width()
				item.height = event.target.height()
				item.scaleX = event.target.scaleX()
				item.scaleY = event.target.scaleY()
				this.enregistrer('redimensionner', this.nom, item)
				this.$socket.emit('redimensionner', { tableau: this.tableau, page: this.page, item: item })
			}
		},
		recupererPositionPointeur (stage) {
			const position = stage.getPointerPosition()
			const attributs = stage.attrs
			const x = (position.x - attributs.x) / attributs.scaleX
			const y = (position.y - attributs.y) / attributs.scaleY
			return { x: x, y: y }
		},
		selectionnerDebut (event) {
			const stage = event.target.getStage()
			if (this.outilSelectionner) {
				if (this.outil !== '' && this.creation === true) {
					this.selectionnerFin()
					return
				}
				this.positionX1 = this.recupererPositionPointeur(stage).x
				this.positionY1 = this.recupererPositionPointeur(stage).y
				this.positionX2 = this.recupererPositionPointeur(stage).x
				this.positionY2 = this.recupererPositionPointeur(stage).y
				this.largeurSelection = 0
				this.hauteurSelection = 0
				this.largeurObjet = 0
				this.hauteurObjet = 0
				if (this.outil === '') {
					if (event.target.getParent() && event.target.getParent().className === 'Transformer') {
						return
					}
					if (event.target !== event.target.getStage()) {
						this.selectionnerObjet(event)
						return
					}
					this.selection = true
					this.nom = ''
					this.objet = ''
					this.items[this.page].forEach(function (item, index) {
						if (item.objet === 'ancre') {
							this.items[this.page][index].visible = false
						}
					}.bind(this))
					this.transformer()
				} else {
					this.creation = true
					this.nom = ''
					this.objet = ''
					this.items[this.page].forEach(function (item, index) {
						if (item.objet === 'ancre') {
							this.items[this.page][index].visible = false
						}
					}.bind(this))
					if (this.outil === 'etoile') {
						this.dessinerForme('etoile')
						this.creation = false
						this.activerSelecteur()
					} else if (this.outil === 'texte' || this.outil === 'label') {
						this.modale = 'texte'
						this.creation = false
						setTimeout(function () {
							document.querySelector('#texte textarea').focus()
						}, 10)
					}
					this.transformer()
				}
			} else if (this.outilDessiner) {
				this.dessin = true
				this.positionStylo = this.recupererPositionPointeur(stage)
				const items = []
				const id = (new Date()).getTime() + Math.random().toString(16).slice(10)
				items.push({ name: 'dess' + id, objet: 'dessin', points: [this.positionStylo.x, this.positionStylo.y], globalCompositeOperation: 'source-over', stroke: this.couleurStylo, strokeWidth: this.epaisseurStylo, hitStrokeWidth: 25, lineJoin: 'round', draggable: false, verrouille: true })
				this.items[this.page].push(...items)
				this.itemsDessin.push(...items)
				this.nom = 'dess' + id
				this.objet = 'dessin'
				this.$nextTick(function () {
					this.$refs.objets.getNode().getLayer().batchDraw()
				}.bind(this))
			}
		},
		selectionnerMouvement (event) {
			const stage = event.target.getStage()
			if (this.outilSelectionner) {
				if (this.outil === '') {
					if (!this.selection) {
						return
					}
					this.positionX2 = this.recupererPositionPointeur(stage).x
					this.positionY2 = this.recupererPositionPointeur(stage).y
					this.positionSelectionX = Math.min(this.positionX1, this.positionX2)
					this.positionSelectionY = Math.min(this.positionY1, this.positionY2)
					this.largeurSelection = Math.abs(this.positionX2 - this.positionX1)
					this.hauteurSelection = Math.abs(this.positionY2 - this.positionY1)
				} else {
					if (!this.creation) {
						return
					}
					this.positionX2 = this.recupererPositionPointeur(stage).x
					this.positionY2 = this.recupererPositionPointeur(stage).y
					this.positionObjetX = Math.min(this.positionX1, this.positionX2)
					this.positionObjetY = Math.min(this.positionY1, this.positionY2)
					this.largeurObjet = Math.abs(this.positionX2 - this.positionX1)
					this.hauteurObjet = Math.abs(this.positionY2 - this.positionY1)
				}
				this.transformer()
			} else if (this.outilDessiner) {
				if (!this.dessin) {
					return
				}
				this.positionStylo = this.recupererPositionPointeur(stage)
				const item = this.items[this.page].find(r => r.name === this.nom)
				const points = item.points.concat([this.positionStylo.x, this.positionStylo.y])
				item.points = points
				this.itemsDessin.forEach(function (dessin) {
					if (dessin.name === item.name) {
						dessin.points = points
					}
				})
				this.$refs.objets.getNode().getLayer().batchDraw()
			}
		},
		selectionnerFin () {
			if (this.outilSelectionner) {
				if (this.outil === '') {
					if (!this.selection) {
						return
					}
					if (this.largeurSelection < 10 && this.hauteurSelection < 10) {
						this.selection = false
						return
					}
					this.selection = false
					const transformer = this.$refs.transformer.getNode()
					const stage = transformer.getStage()
					const objets = stage.find((item) => {
						return item.getAttrs().objet && item.getAttrs().name.substring(0, 4) !== 'ancr' && item.getAttrs().objet !== 'dessin'
					})
					const rect = stage.findOne('.selection').getClientRect()
					const selection = objets.filter(item => Konva.Util.haveIntersection(rect, item.getClientRect()))
					if (selection.length > 1) {
						this.nom = 'selection'
						this.objet = 'selection'
						const objetsVerrouilles = selection.filter(item => item.getAttrs().verrouille === true)
						if (objetsVerrouilles.length === selection.length) {
							this.objetVerrouille = true
						} else {
							this.objetVerrouille = false
						}
						transformer.nodes(selection)
						transformer.getLayer().batchDraw()
						this.desactiverSelecteur()
					} else if (selection.length === 1) {
						const nom = selection[0].getAttrs().name
						this.selectionner(nom)
						this.transformer()
					} else {
						this.nom = ''
						this.objet = ''
						this.objetVerrouille = false
						this.desactiverSelecteur()
					}
				} else if (this.outil !== '' && this.outil !== 'etoile' && this.outil !== 'texte' && this.outil !== 'label' && this.largeurObjet > 0 && this.hauteurObjet > 0) {
					if (!this.creation) {
						return
					}
					this.dessinerForme(this.outil)
					this.desactiverSelecteur()
				}
			} else if (this.outilDessiner) {
				this.dessin = false
				this.nom = ''
				this.objet = ''
				if (this.itemsDessin.length > 0) {
					this.enregistrer('ajouter', '', this.itemsDessin)
					this.$socket.emit('ajouter', { tableau: this.tableau, page: this.page, items: this.itemsDessin })
					this.itemsDessin = []
				}
			}
		},
		selectionnerObjet (event) {
			if (this.outilSelectionner) {
				if (event.target === event.target.getStage()) {
					this.reinitialiserSelection()
					return
				}
				if (this.objet === 'selection' && event.target.getAttrs().objet && event.target.getAttrs().name.substring(0, 4) !== 'ancr') {
					return
				}
				if (event.target.getParent().className === 'Transformer') {
					this.reinitialiserSelection()
					return
				}
				this.selectionner(event.target.name())
				this.transformer()
			}
		},
		selectionner (nom) {
			let ancre1, ancre2
			const type = nom.substring(0, 4)
			const item = this.items[this.page].find(r => r.name === nom)
			if (item) {
				this.nom = nom
				this.objet = item.objet
				if (!item.draggable) {
					this.objetVerrouille = true
				} else {
					this.objetVerrouille = false
				}
				if (!this.outilDessiner) {
					this.definirCouleurSelecteur(this.objet, item)
				}
				this.activerSelecteur()
			} else {
				this.nom = ''
				this.objet = ''
				this.objetVerrouille = false
				this.desactiverSelecteur()
			}
			if (type === 'flec' || type === 'line') {
				this.items[this.page].forEach(function (item, index) {
					if (item.objet === 'ancre') {
						this.items[this.page][index].visible = false
					}
				}.bind(this))
				ancre1 = this.items[this.page].find(r => r.name === 'ancr_' + nom + '_1')
				ancre2 = this.items[this.page].find(r => r.name === 'ancr_' + nom + '_2')
				if (!item.verrouille) {
					ancre1.visible = true
					ancre2.visible = true
				} else {
					ancre1.visible = false
					ancre2.visible = false
				}
			} else if (type !== 'ancr') {
				this.items[this.page].forEach(function (item, index) {
					if (item.objet === 'ancre') {
						this.items[this.page][index].visible = false
					}
				}.bind(this))
			}
		},
		transformer () {
			const transformer = this.$refs.transformer.getNode()
			const stage = transformer.getStage()
			const noeud = stage.findOne('.' + this.nom)
			if (noeud && this.nom.substring(0, 4) !== 'ancr') {
				transformer.nodes([noeud])
			} else {
				transformer.nodes([])
			}
			transformer.getLayer().batchDraw()
		},
		reinitialiserOutils () {
			this.outil = ''
			this.largeurObjet = 0
			this.hauteurObjet = 0
			this.positionX1 = 0
			this.positionY1 = 0
			this.positionX2 = 0
			this.positionY2 = 0
		},
		reinitialiserSelection () {
			this.nom = ''
			this.objet = ''
			this.objetVerrouille = false
			this.items[this.page].forEach(function (item, index) {
				if (item.objet === 'ancre') {
					this.items[this.page][index].visible = false
				}
			}.bind(this))
			this.transformer()
		},
		reinitialiserImages () {
			this.items.forEach(function (page, indexPage) {
				page.forEach(function (item, indexItem) {
					if (item.objet === 'image' && item.hasOwnProperty('image') === true) {
						delete this.items[indexPage][indexItem].image
					}
				}.bind(this))
			}.bind(this))
		},
		definirAncres () {
			let ancres = []
			if (this.objetVerrouille === false) {
				const type = this.nom.substring(0, 4)
				switch (type) {
				case 'rect':
				case 'circ':
					ancres = ['top-left', 'top-center', 'top-right', 'middle-right', 'middle-left', 'bottom-left', 'bottom-center', 'bottom-right']
					break
				case 'labl':
				case 'imag':
				case 'star':
					ancres = ['top-left', 'top-right', 'bottom-left', 'bottom-right']
					break
				case 'text':
					ancres = []
					break
				}
			}
			return ancres
		},
		definirCouleurBordure () {
			if (!this.admin && this.statutUtilisateur !== 'editeur' && this.options.edition !== 'ouverte') {
				return 'transparent'
			} else if (!this.objetVerrouille) {
				return '#01ced1'
			} else {
				return '#aaaaaa'
			}
		},
		definirRotation () {
			if (this.items[this.page]) {
				const item = this.items[this.page].find(r => r.name === this.nom)
				if (!item || this.objet === 'selection' || this.objet === 'fleche' || this.objet === 'ligne' || (item && item.draggable === false) || (item && item.verrouille === true)) {
					return false
				} else {
					return true
				}
			} else {
				return false
			}
		},
		definirLimites (ancien, nouveau) {
			const type = this.nom.substring(0, 4)
			if (type === 'text') {
				if (nouveau.width < 70) {
					return ancien
				}
				return nouveau
			} else {
				return nouveau
			}
		},
		deplacerLigne (event) {
			let item, ancre1, ancre2
			if (this.objet !== 'selection') {
				item = this.items[this.page].find(r => r.name === this.nom)
				if (item) {
					item.points = event.target.points()
					item.x = event.target.x()
					item.y = event.target.y()
					item.scaleX = event.target.scaleX()
					item.scaleY = event.target.scaleY()
					ancre1 = this.items[this.page].find(r => r.name === 'ancr_' + this.nom + '_1')
					ancre2 = this.items[this.page].find(r => r.name === 'ancr_' + this.nom + '_2')
					ancre1.x = event.target.points()[0] + event.target.x()
					ancre1.y = event.target.points()[1] + event.target.y()
					ancre1.scaleX = event.target.scaleX()
					ancre1.scaleY = event.target.scaleY()
					ancre2.x = event.target.points()[2] + event.target.x()
					ancre2.y = event.target.points()[3] + event.target.y()
					ancre2.scaleX = event.target.scaleX()
					ancre2.scaleY = event.target.scaleY()
				}
			} else {
				const objets = this.$refs.transformer.getNode().nodes()
				for (let i = 0; i < objets.length; i++) {
					if (objets[i].getAttrs().name.substring(0, 4) === 'flec' || objets[i].getAttrs().name.substring(0, 4) === 'line') {
						item = this.items[this.page].find(r => r.name === objets[i].getAttrs().name)
					}
					if (item) {
						item.points = objets[i].getAttrs().points
						item.x = objets[i].getAttrs().x
						item.y = objets[i].getAttrs().y
						item.scaleX = objets[i].getAttrs().scaleX
						item.scaleY = objets[i].getAttrs().scaleY
						ancre1 = this.items[this.page].find(r => r.name === 'ancr_' + objets[i].getAttrs().name + '_1')
						ancre2 = this.items[this.page].find(r => r.name === 'ancr_' + objets[i].getAttrs().name + '_2')
						ancre1.x = objets[i].getAttrs().points[0] + objets[i].getAttrs().x
						ancre1.y = objets[i].getAttrs().points[1] + objets[i].getAttrs().y
						ancre1.scaleX = objets[i].getAttrs().scaleX
						ancre1.scaleY = objets[i].getAttrs().scaleY
						ancre2.x = objets[i].getAttrs().points[2] + objets[i].getAttrs().x
						ancre2.y = objets[i].getAttrs().points[3] + objets[i].getAttrs().y
						ancre2.scaleX = objets[i].getAttrs().scaleX
						ancre2.scaleY = objets[i].getAttrs().scaleY
					}
					item = null
				}
			}
		},
		deplacerAncre (event) {
			let nom, index, item, ancre, points, ancreActive
			if (this.objet !== 'selection') {
				nom = this.nom.split('_')
				index = parseInt(nom[2])
				item = this.items[this.page].find(r => r.name === nom[1])
				if (item) {
					if (index === 1) {
						ancre = this.items[this.page].find(r => r.name === 'ancr_' + nom[1] + '_2')
						points = [
							event.target.x() - item.x,
							event.target.y() - item.y,
							ancre.x - item.x,
							ancre.y - item.y
						]
					} else {
						ancre = this.items[this.page].find(r => r.name === 'ancr_' + nom[1] + '_1')
						points = [
							ancre.x - item.x,
							ancre.y - item.y,
							event.target.x() - item.x,
							event.target.y() - item.y
						]
					}
					item.points = points
					ancreActive = this.items[this.page].find(r => r.name === 'ancr_' + nom[1] + '_' + index)
					ancreActive.x = event.target.x()
					ancreActive.y = event.target.y()
					ancreActive.scaleX = event.target.scaleX()
					ancreActive.scaleY = event.target.scaleY()
				}
			} else {
				const objets = this.$refs.transformer.getNode().nodes()
				for (let i = 0; i < objets.length; i++) {
					nom = objets[i].getAttrs().name.split('_')
					index = parseInt(nom[2])
					if (nom[1].substring(0, 4) === 'flec' || nom[1].substring(0, 4) === 'line') {
						item = this.items[this.page].find(r => r.name === nom[1])
					}
					if (item) {
						if (index === 1) {
							ancre = this.items[this.page].find(r => r.name === 'ancr_' + nom[1] + '_2')
							points = [
								objets[i].getAttrs().x - item.x,
								objets[i].getAttrs().y - item.y,
								ancre.x - item.x,
								ancre.y - item.y
							]
						} else {
							ancre = this.items[this.page].find(r => r.name === 'ancr_' + nom[1] + '_1')
							points = [
								ancre.x - item.x,
								ancre.y - item.y,
								objets[i].getAttrs().x - item.x,
								objets[i].getAttrs().y - item.y
							]
						}
						item.points = points
						ancreActive = this.items[this.page].find(r => r.name === 'ancr_' + nom[1] + '_' + index)
						ancreActive.x = objets[i].getAttrs().x
						ancreActive.y = objets[i].getAttrs().y
						ancreActive.scaleX = objets[i].getAttrs().scaleX
						ancreActive.scaleY = objets[i].getAttrs().scaleY
					}
				}
			}
		},
		exporterImage () {
			this.modale = ''
			this.reinitialiserSelection()
			this.$nuxt.$loading.start()
			setTimeout(function () {
				const echelle = 1920 / (1920 * this.echelle)
				html2canvas(document.querySelector('.konvajs-content'), { useCORS: true, scale: echelle, windowWidth: 1880, windowHeight: 1040 }).then(function (canvas) {
					saveAs(canvas.toDataURL('image/jpeg', 0.95).replace('image/jpeg', 'image/octet-stream'), this.$t('tableau') + '_' + (new Date()).getTime() + '.jpg')
					this.$nuxt.$loading.finish()
					this.$store.dispatch('modifierNotification', this.$t('tableauExporteImage'))
				}.bind(this))
			}.bind(this), 10)
		},
		exporterTableau () {
			this.modale = ''
			this.$nuxt.$loading.start()
			axios.post(this.hote + '/api/exporter-tableau', {
				tableau: this.tableau,
				items: this.items
			}).then(function (reponse) {
				const donnees = reponse.data
				if (donnees === 'non_autorise') {
					this.$store.dispatch('modifierMessage', this.$t('actionNonAutorisee'))
				} else {
					saveAs('/temp/' + donnees, 'tableau-' + this.tableau + '.zip')
					this.$store.dispatch('modifierNotification', this.$t('tableauExporte'))
					this.$nuxt.$loading.finish()
				}
			}.bind(this)).catch(function () {
				this.$nuxt.$loading.finish()
				this.$store.dispatch('modifierMessage', this.$t('erreurCommunicationServeur'))
			}.bind(this))
		},
		afficherImporter () {
			this.menu = ''
			this.modale = 'importer'
		},
		importerTableau (event) {
			const fichier = event.target.files[0]
			if (fichier === null || fichier.length === 0) {
				document.querySelector('#importer').value = ''
				return false
			} else {
				const extension = fichier.name.substring(fichier.name.lastIndexOf('.') + 1).toLowerCase()
				if (extension === 'zip') {
					this.modale = ''
					this.$nuxt.$loading.start()
					const formulaire = new FormData()
					formulaire.append('tableau', this.tableau)
					formulaire.append('fichier', fichier)
					axios.post(this.hote + '/api/importer-tableau', formulaire, {
						headers: {
							'Content-Type': 'multipart/form-data'
						}
					}).then(function (reponse) {
						const donnees = reponse.data
						if (donnees === 'non_autorise') {
							this.$nuxt.$loading.finish()
							this.$store.dispatch('modifierMessage', this.$t('actionNonAutorisee'))
						} else if (donnees === 'erreur_import') {
							this.$nuxt.$loading.finish()
							this.$store.dispatch('modifierMessage', this.$t('erreurCommunicationServeur'))
						} else {
							this.reinitialiserSelection()
							this.page = 0
							this.historique = []
							this.positionHistorique = 0
							this.donnees = donnees.items
							this.reinitialiserImages()
							this.chargerItems(donnees.items, this.page)
							this.$socket.emit('importer', { tableau: this.tableau, items: donnees.items })
							this.$store.dispatch('modifierNotification', this.$t('tableauImporte'))
						}
					}.bind(this)).catch(function () {
						this.$nuxt.$loading.finish()
						this.$store.dispatch('modifierMessage', this.$t('erreurCommunicationServeur'))
					}.bind(this))
				} else {
					this.$store.dispatch('modifierNotification', this.$t('formatFichierPasAccepte'))
					document.querySelector('#importer').value = ''
				}
			}
		},
		enregistrer (type, nom, nouveau) {
			const donnees = { page: this.page, items: JSON.parse(JSON.stringify(this.items)), type: type, nom: nom, nouveau: nouveau }
			if (!this.historique.includes(donnees)) {
				this.historique.push(donnees)
				this.positionHistorique += 1
			}
		},
		defaire () {
			if (this.positionHistorique === 0) {
				return
			}
			this.positionHistorique -= 1
			const donnees = this.historique[this.positionHistorique]
			let itemsPrecedents
			if (this.positionHistorique === 0) {
				itemsPrecedents = JSON.parse(JSON.stringify(this.donnees))
			} else {
				itemsPrecedents = JSON.parse(JSON.stringify(this.historique[this.positionHistorique - 1].items))
			}
			this.page = donnees.page
			let indexPrecedent
			let items = []
			const itemPrecedent = {}
			let objets = []
			let obj
			let erreur = false
			const images = []
			this.reinitialiserSelection()
			switch (donnees.type) {
			case 'ajouter':
				donnees.nouveau.forEach(function (item) {
					if (item.name.substring(0, 4) === 'imag') {
						this.imagesASupprimer.push(this.items[this.page].find(r => r.name === item.name).fichier)
					}
					if (item.name.substring(0, 4) === 'ancr') {
						this.items[this.page] = this.items[this.page].filter(r => !r.name.includes(item.name.split('_')[1]))
					} else {
						this.items[this.page] = this.items[this.page].filter(r => !r.name.includes(item.name))
					}
					this.$socket.emit('supprimer', { tableau: this.tableau, page: this.page, nom: item.name })
				}.bind(this))
				this.transformer()
				break
			case 'supprimer':
				itemsPrecedents[this.page].forEach(function (item, index) {
					if (item.name.includes(donnees.nom) === true) {
						item.index = index
						items.push(item)
					}
				})
				items = items.filter(function (element, index, arr) {
					return arr.map(obj => obj.name).indexOf(element.name) === index
				})
				items.forEach(function (item) {
					if (item.hasOwnProperty('fichier') && item.fichier !== '') {
						this.imagesASupprimer.forEach(function (image, index) {
							if (image === item.fichier) {
								this.imagesASupprimer.splice(index, 1)
							}
						}.bind(this))
					}
					if (item.verrouille === false && item.draggable === false) {
						item.draggble = true
					}
				}.bind(this))
				if (items[0].objet === 'image' && items[0].fichier !== '') {
					const image = new window.Image()
					image.src = '/fichiers/' + this.tableau + '/' + items[0].fichier
					image.onload = function () {
						items[0].image = image
						this.items[this.page].splice(...[items[0].index, 0].concat(items))
						this.$nextTick(function () {
							this.transformer()
							this.$forceUpdate()
							const copieItems = JSON.parse(JSON.stringify(items))
							copieItems.forEach(function (item) {
								if (item.objet === 'image') {
									delete item.image
								}
								if (item.hasOwnProperty('index')) {
									delete item.index
								}
							})
							this.$nextTick(function () {
								objets = this.$refs.transformer.getNode().getStage().find((item) => {
									return item.getAttrs().objet && item.getAttrs().objet === 'image'
								})
								for (let i = 0; i < objets.length; i++) {
									if (items[0].name === objets[i].getAttrs().name) {
										if (items[0].filtre === 'Aucun') {
											objets[i].filters([])
										} else {
											objets[i].cache()
											objets[i].filters([Konva.Filters[items[0].filtre]])
											if (items[0].filtre === 'Pixelate') {
												objets[i].pixelSize(10)
											}
										}
									}
								}
								this.transformer()
								this.$socket.emit('reajouter', { tableau: this.tableau, page: this.page, items: copieItems, index: items[0].index })
							}.bind(this))
						}.bind(this))
					}.bind(this)
				} else if (items[0].objet !== 'image') {
					items.forEach(function (item) {
						if (item.objet === 'ancre') {
							item.visible = false
						}
					})
					this.items[this.page].splice(...[items[0].index, 0].concat(items))
					this.$nextTick(function () {
						this.transformer()
						this.$forceUpdate()
						const copieItems = JSON.parse(JSON.stringify(items))
						copieItems.forEach(function (item) {
							if (item.objet === 'image') {
								delete item.image
							}
							if (item.hasOwnProperty('index')) {
								delete item.index
							}
						})
						this.$socket.emit('reajouter', { tableau: this.tableau, page: this.page, items: copieItems, index: items[0].index })
					}.bind(this))
				}
				break
			case 'verrouiller':
				donnees.nom.forEach(function (nom) {
					this.items[this.page].forEach(function (item) {
						if (item.name === nom) {
							item.draggable = true
							item.verrouille = false
						}
					})
				}.bind(this))
				this.$socket.emit('deverrouiller', { tableau: this.tableau, page: this.page, noms: donnees.nom })
				break
			case 'deverrouiller':
				donnees.nom.forEach(function (nom) {
					this.items[this.page].forEach(function (item) {
						if (item.name === nom) {
							item.draggable = false
							item.verrouille = true
						}
					})
				}.bind(this))
				this.$socket.emit('verrouiller', { tableau: this.tableau, page: this.page, noms: donnees.nom })
				break
			case 'modifierposition':
				itemsPrecedents[this.page].forEach(function (item, index) {
					if (item.name === donnees.nom) {
						indexPrecedent = index
					}
				})
				this.items[this.page].forEach(function (item, index) {
					if (item.name === donnees.nom) {
						this.items[this.page].splice(index, 1)
						this.items[this.page].splice(indexPrecedent, 0, item)
					}
				}.bind(this))
				this.$socket.emit('modifierposition', { tableau: this.tableau, page: this.page, nom: this.nom, index: indexPrecedent })
				break
			case 'deplacer':
				donnees.nouveau.forEach(function (item) {
					itemsPrecedents[this.page].forEach(function (itemP) {
						if (item.nom === itemP.name) {
							items.push({ nom: itemP.name, x: itemP.x, y: itemP.y })
							if (item.hasOwnProperty('points')) {
								items.push({ nom: itemP.name, x: itemP.x, y: itemP.y, points: itemP.points })
							}
						}
					})
				}.bind(this))
				items.forEach(function (itemP) {
					this.items[this.page].forEach(function (item) {
						if (item.name === itemP.nom) {
							item.x = itemP.x
							item.y = itemP.y
							if (itemP.hasOwnProperty('points')) {
								item.points = itemP.points
							}
						}
					})
				}.bind(this))
				this.$socket.emit('deplacer', { tableau: this.tableau, page: this.page, items: items })
				break
			case 'redimensionner':
				itemsPrecedents[this.page].forEach(function (itemP) {
					if (donnees.nom === itemP.name) {
						itemPrecedent.name = donnees.nom
						itemPrecedent.x = itemP.x
						itemPrecedent.y = itemP.y
						itemPrecedent.width = itemP.width
						itemPrecedent.height = itemP.height
						itemPrecedent.scaleX = itemP.scaleX
						itemPrecedent.scaleY = itemP.scaleY
					}
				})
				this.items[this.page].forEach(function (item) {
					if (item.name === itemPrecedent.name) {
						item.x = itemPrecedent.x
						item.y = itemPrecedent.y
						item.width = itemPrecedent.width
						item.height = itemPrecedent.height
						item.scaleX = itemPrecedent.scaleX
						item.scaleY = itemPrecedent.scaleY
					}
				})
				this.$socket.emit('redimensionner', { tableau: this.tableau, page: this.page, item: itemPrecedent })
				break
			case 'modifiertexte':
				itemsPrecedents[this.page].forEach(function (itemP) {
					if (donnees.nom === itemP.name) {
						itemPrecedent.texte = itemP.text
					}
				})
				obj = this.items[this.page].find(r => r.name === donnees.nom)
				if (obj) {
					if (donnees.nom.substring(0, 4) === 'text') {
						obj.text = itemPrecedent.texte
					} else {
						obj.text.text = itemPrecedent.texte
					}
					this.$socket.emit('modifiertexte', { tableau: this.tableau, page: this.page, nom: donnees.nom, texte: itemPrecedent.texte })
				} else {
					erreur = true
				}
				break
			case 'modifiertailletexte':
				itemsPrecedents[this.page].forEach(function (itemP) {
					if (donnees.nom === itemP.name) {
						itemPrecedent.taille = itemP.fontSize
					}
				})
				obj = this.items[this.page].find(r => r.name === donnees.nom)
				if (obj) {
					obj.fontSize = itemPrecedent.taille
					this.$socket.emit('modifiertailletexte', { tableau: this.tableau, page: this.page, nom: donnees.nom, taille: itemPrecedent.taille })
				} else {
					erreur = true
				}
				break
			case 'modifieralignementtexte':
				itemsPrecedents[this.page].forEach(function (itemP) {
					if (donnees.nom === itemP.name) {
						itemPrecedent.alignement = itemP.align
					}
				})
				obj = this.items[this.page].find(r => r.name === donnees.nom)
				if (obj) {
					obj.align = itemPrecedent.alignement
					obj.opacity = 0.9
					obj.opacity = 1
					this.$socket.emit('modifieralignementtexte', { tableau: this.tableau, page: this.page, nom: donnees.nom, alignement: itemPrecedent.alignement })
				} else {
					erreur = true
				}
				break
			case 'modifierfiltre':
				itemsPrecedents[this.page].forEach(function (itemP) {
					if (donnees.nom === itemP.name) {
						itemPrecedent.filtre = itemP.filtre
					}
				})
				objets = this.$refs.transformer.getNode().getStage().find((item) => {
					return item.getAttrs().objet && item.getAttrs().objet === 'image'
				})
				for (let i = 0; i < objets.length; i++) {
					if (donnees.nom === objets[i].getAttrs().name) {
						if (itemPrecedent.filtre === 'Aucun') {
							objets[i].filters([])
						} else {
							objets[i].cache()
							objets[i].filters([Konva.Filters[itemPrecedent.filtre]])
							if (itemPrecedent.filtre === 'Pixelate') {
								objets[i].pixelSize(10)
							}
						}
					}
				}
				this.$socket.emit('modifierfiltre', { tableau: this.tableau, page: this.page, nom: donnees.nom, filtre: itemPrecedent.filtre })
				break
			case 'modifiercouleur':
				itemsPrecedents[this.page].forEach(function (itemP) {
					if (donnees.nom === itemP.name) {
						if (itemP.objet === 'rectangle' || itemP.objet === 'cercle' || itemP.objet === 'dessin') {
							itemPrecedent.couleur = itemP.stroke
						} else if (itemP.objet === 'rectangle-plein' || itemP.objet === 'cercle-plein' || itemP.objet === 'etoile' || itemP.objet === 'surlignage' || itemP.objet === 'texte' || itemP.objet === 'ligne' || itemP.objet === 'fleche' || itemP.objet === 'ancre') {
							itemPrecedent.couleur = itemP.fill
						} else if (itemP.objet === 'label') {
							itemPrecedent.couleur = itemP.tag.fill
						}
					}
				})
				obj = this.items[this.page].find(r => r.name === donnees.nom)
				if (obj) {
					if (obj.objet === 'rectangle' || obj.objet === 'cercle' || obj.objet === 'dessin') {
						obj.stroke = itemPrecedent.couleur
					} else if (obj.objet === 'rectangle-plein' || obj.objet === 'cercle-plein' || obj.objet === 'etoile' || obj.objet === 'surlignage' || obj.objet === 'texte') {
						obj.fill = itemPrecedent.couleur
					} else if (obj.objet === 'ligne' || obj.objet === 'fleche' || obj.objet === 'ancre') {
						obj.stroke = itemPrecedent.couleur
						obj.fill = itemPrecedent.couleur
					} else if (obj.objet === 'label') {
						obj.tag.fill = itemPrecedent.couleur
					}
					this.$socket.emit('modifiercouleur', { tableau: this.tableau, page: this.page, nom: donnees.nom, couleur: itemPrecedent.couleur })
				} else {
					erreur = true
				}
				break
			case 'ajouterpage':
				this.items.splice(donnees.nouveau, 1)
				this.$socket.emit('supprimerpage', { tableau: this.tableau, page: donnees.nouveau })
				if (this.page === (donnees.nouveau - 1) && this.page > 0) {
					this.afficherPage(this.page)
				} else if (this.page === (donnees.nouveau - 1) && this.page === 0) {
					this.page = 0
					this.afficherPage(this.page)
				}
				break
			case 'supprimerpage':
				itemsPrecedents[donnees.nouveau].forEach(function (item, index) {
					if (item.name.includes(donnees.nom) === true) {
						item.index = index
						items.push(item)
					}
				})
				items = items.filter(function (element, index, arr) {
					return arr.map(obj => obj.name).indexOf(element.name) === index
				})
				items.forEach(function (item) {
					if (item.hasOwnProperty('fichier') && item.fichier !== '') {
						this.imagesASupprimer.forEach(function (image, index) {
							if (image === item.fichier) {
								this.imagesASupprimer.splice(index, 1)
							}
						}.bind(this))
					}
					if (item.verrouille === false && item.draggable === false) {
						item.draggble = true
					}
				}.bind(this))
				for (let i = 0; i < items.length; i++) {
					if (items[i].objet === 'image' && items[i].fichier !== '') {
						const donneesImage = new Promise(function (resolve) {
							const image = new window.Image()
							image.src = '/fichiers/' + this.tableau + '/' + items[i].fichier
							image.onload = function () {
								items[i].image = image
								resolve('termine')
							}
						}.bind(this))
						images.push(donneesImage)
					} else {
						images.push('termine')
					}
				}
				Promise.all(images).then(function () {
					items.forEach(function (item) {
						if (item.objet === 'ancre') {
							item.visible = false
						}
					})
					this.items.splice(donnees.nouveau, 0, items)
					this.$nextTick(function () {
						this.transformer()
						this.$forceUpdate()
						const copieItems = JSON.parse(JSON.stringify(items))
						copieItems.forEach(function (item) {
							if (item.objet === 'image') {
								delete item.image
							}
							if (item.hasOwnProperty('index')) {
								delete item.index
							}
						})
						this.$nextTick(function () {
							objets = this.$refs.transformer.getNode().getStage().find((item) => {
								return item.getAttrs().objet && item.getAttrs().objet === 'image'
							})
							for (let i = 0; i < objets.length; i++) {
								if (items[0].name === objets[i].getAttrs().name) {
									if (items[0].filtre === 'Aucun') {
										objets[i].filters([])
									} else {
										objets[i].cache()
										objets[i].filters([Konva.Filters[items[0].filtre]])
										if (items[0].filtre === 'Pixelate') {
											objets[i].pixelSize(10)
										}
									}
								}
							}
							this.transformer()
							this.$socket.emit('reajouterpage', { tableau: this.tableau, page: donnees.nouveau, items: copieItems })
							if (donnees.nouveau === this.page) {
								this.afficherPage(this.page)
							}
						}.bind(this))
					}.bind(this))
				}.bind(this))
				break
			}
			if (erreur === true) {
				this.positionHistorique += 1
			}
			this.$nextTick(function () {
				this.items[this.page].forEach(function (item, index) {
					if (item.objet === 'ancre') {
						this.items[this.page][index].visible = false
					}
				}.bind(this))
				this.transformer()
				this.$forceUpdate()
			}.bind(this))
		},
		refaire () {
			if (this.positionHistorique === this.historique.length) {
				return
			}
			const donnees = this.historique[this.positionHistorique]
			this.page = donnees.page
			const items = []
			const itemPrecedent = {}
			let objets = []
			let obj
			let erreur = false
			// const images = []
			this.reinitialiserSelection()
			switch (donnees.type) {
			case 'ajouter':
				donnees.nouveau.forEach(function (item) {
					donnees.items[this.page].forEach(function (itemP, indexP) {
						if (item.name === itemP.name) {
							items.push(indexP)
						}
					})
					if (item.hasOwnProperty('fichier') && item.fichier !== '') {
						this.imagesASupprimer.forEach(function (image, index) {
							if (image === item.fichier) {
								this.imagesASupprimer.splice(index, 1)
							}
						}.bind(this))
					}
				}.bind(this))
				if (donnees.nouveau[0].objet === 'image' && donnees.nouveau[0].fichier !== '') {
					const image = new window.Image()
					image.src = '/fichiers/' + this.tableau + '/' + donnees.nouveau[0].fichier
					image.onload = function () {
						donnees.nouveau[0].image = image
						this.items[this.page].splice(...[items[0], 0].concat(donnees.nouveau))
						this.$nextTick(function () {
							this.transformer()
							this.$forceUpdate()
							const copieItems = JSON.parse(JSON.stringify(donnees.nouveau))
							copieItems.forEach(function (item) {
								if (item.objet === 'image') {
									delete item.image
								}
							})
							this.$nextTick(function () {
								objets = this.$refs.transformer.getNode().getStage().find((item) => {
									return item.getAttrs().objet && item.getAttrs().objet === 'image'
								})
								for (let i = 0; i < objets.length; i++) {
									if (donnees.nouveau[0].name === objets[i].getAttrs().name) {
										if (donnees.nouveau[0].filtre === 'Aucun') {
											objets[i].filters([])
										} else {
											objets[i].cache()
											objets[i].filters([Konva.Filters[donnees.nouveau[0].filtre]])
											if (donnees.nouveau[0].filtre === 'Pixelate') {
												objets[i].pixelSize(10)
											}
										}
									}
								}
								this.transformer()
								this.$socket.emit('reajouter', { tableau: this.tableau, page: this.page, items: copieItems, index: items[0] })
							}.bind(this))
						}.bind(this))
					}.bind(this)
				} else if (donnees.nouveau[0].objet !== 'image') {
					donnees.nouveau.forEach(function (item) {
						if (item.objet === 'ancre') {
							item.visible = false
						}
					})
					this.items[this.page].splice(...[items[0], 0].concat(donnees.nouveau))
					this.$nextTick(function () {
						this.transformer()
						this.$forceUpdate()
						const copieItems = JSON.parse(JSON.stringify(donnees.nouveau))
						copieItems.forEach(function (item) {
							if (item.objet === 'image') {
								delete item.image
							}
						})
						this.$socket.emit('reajouter', { tableau: this.tableau, page: this.page, items: copieItems, index: items[0] })
					}.bind(this))
				}
				break
			case 'supprimer':
				this.items[this.page].forEach(function (item) {
					if (item.name === donnees.nom && item.name.substring(0, 4) === 'imag') {
						obj = this.items[this.page].find(r => r.name === item.name)
						if (obj) {
							this.imagesASupprimer.push(obj.fichier)
						} else {
							erreur = true
						}
					}
					if (item.name === donnees.nom && item.name.substring(0, 4) === 'ancr') {
						this.items[this.page] = this.items[this.page].filter(r => !r.name.includes(item.name.split('_')[1]))
					} else if (item.name === donnees.nom) {
						this.items[this.page] = this.items[this.page].filter(r => !r.name.includes(item.name))
					}
				}.bind(this))
				this.$forceUpdate()
				this.$socket.emit('supprimer', { tableau: this.tableau, page: this.page, nom: donnees.nom })
				break
			case 'verrouiller':
				donnees.nom.forEach(function (nom) {
					this.items[this.page].forEach(function (item) {
						if (item.name === nom) {
							item.draggable = false
							item.verrouille = true
						}
					})
				}.bind(this))
				this.$socket.emit('deverrouiller', { tableau: this.tableau, page: this.page, noms: donnees.nom })
				break
			case 'deverrouiller':
				donnees.nom.forEach(function (nom) {
					this.items[this.page].forEach(function (item) {
						if (item.name === nom) {
							item.draggable = true
							item.verrouille = false
						}
					})
				}.bind(this))
				this.$socket.emit('verrouiller', { tableau: this.tableau, page: this.page, noms: donnees.nom })
				break
			case 'modifierposition':
				this.items[this.page].forEach(function (item, index) {
					if (item.name === donnees.nom) {
						this.items[this.page].splice(index, 1)
						this.items[this.page].splice(donnees.nouveau, 0, item)
					}
				}.bind(this))
				this.$socket.emit('modifierposition', { tableau: this.tableau, page: this.page, nom: this.nom, index: donnees.nouveau })
				break
			case 'deplacer':
				donnees.nouveau.forEach(function (itemNouveau) {
					this.items[this.page].forEach(function (item) {
						if (item.name === itemNouveau.nom) {
							item.x = itemNouveau.x
							item.y = itemNouveau.y
							if (itemNouveau.hasOwnProperty('points')) {
								item.points = itemNouveau.points
							}
						}
					})
				}.bind(this))
				this.$socket.emit('deplacer', { tableau: this.tableau, page: this.page, items: donnees.nouveau })
				break
			case 'redimensionner':
				donnees.items[this.page].forEach(function (item) {
					if (item.name === donnees.nouveau.name) {
						itemPrecedent.name = item.name
						itemPrecedent.x = item.x
						itemPrecedent.y = item.y
						itemPrecedent.width = item.width
						itemPrecedent.height = item.height
						itemPrecedent.scaleX = item.scaleX
						itemPrecedent.scaleY = item.scaleY
					}
				})
				if (itemPrecedent.hasOwnProperty('name') === true) {
					this.items[this.page].forEach(function (item) {
						if (item.name === donnees.nouveau.name) {
							item.x = itemPrecedent.x
							item.y = itemPrecedent.y
							item.width = itemPrecedent.width
							item.height = itemPrecedent.height
							item.scaleX = itemPrecedent.scaleX
							item.scaleY = itemPrecedent.scaleY
						}
					})
					this.$socket.emit('redimensionner', { tableau: this.tableau, page: this.page, item: itemPrecedent })
				}
				break
			case 'modifiertexte':
				obj = this.items[this.page].find(r => r.name === donnees.nom)
				if (obj) {
					if (donnees.nom.substring(0, 4) === 'text') {
						obj.text = donnees.nouveau
					} else {
						obj.text.text = donnees.nouveau
					}
					this.$socket.emit('modifiertexte', { tableau: this.tableau, page: this.page, nom: donnees.nom, texte: donnees.nouveau })
				} else {
					erreur = true
				}
				break
			case 'modifiertailletexte':
				obj = this.items[this.page].find(r => r.name === donnees.nom)
				if (obj) {
					obj.fontSize = donnees.nouveau
					this.$socket.emit('modifiertailletexte', { tableau: this.tableau, page: this.page, nom: donnees.nom, taille: donnees.nouveau })
				} else {
					erreur = true
				}
				break
			case 'modifieralignementtexte':
				obj = this.items[this.page].find(r => r.name === donnees.nom)
				if (obj) {
					obj.align = donnees.nouveau
					obj.opacity = 0.9
					obj.opacity = 1
					this.$socket.emit('modifieralignementtexte', { tableau: this.tableau, page: this.page, nom: donnees.nom, alignement: donnees.nouveau })
				} else {
					erreur = true
				}
				break
			case 'modifierfiltre':
				objets = this.$refs.transformer.getNode().getStage().find((item) => {
					return item.getAttrs().objet && item.getAttrs().objet === 'image'
				})
				for (let i = 0; i < objets.length; i++) {
					if (donnees.nom === objets[i].getAttrs().name) {
						if (donnees.nouveau === 'Aucun') {
							objets[i].filters([])
						} else {
							objets[i].cache()
							objets[i].filters([Konva.Filters[donnees.nouveau]])
							if (donnees.nouveau === 'Pixelate') {
								objets[i].pixelSize(10)
							}
						}
					}
				}
				this.$socket.emit('modifierfiltre', { tableau: this.tableau, page: this.page, nom: donnees.nom, filtre: donnees.nouveau })
				break
			case 'modifiercouleur':
				obj = this.items[this.page].find(r => r.name === donnees.nom)
				if (obj) {
					if (obj.objet === 'rectangle' || obj.objet === 'cercle' || obj.objet === 'dessin') {
						obj.stroke = donnees.nouveau
					} else if (obj.objet === 'rectangle-plein' || obj.objet === 'cercle-plein' || obj.objet === 'etoile' || obj.objet === 'surlignage' || obj.objet === 'texte') {
						obj.fill = donnees.nouveau
					} else if (obj.objet === 'ligne' || obj.objet === 'fleche' || obj.objet === 'ancre') {
						obj.stroke = donnees.nouveau
						obj.fill = donnees.nouveau
					} else if (obj.objet === 'label') {
						obj.tag.fill = donnees.nouveau
					}
					this.$socket.emit('modifiercouleur', { tableau: this.tableau, page: this.page, nom: donnees.nom, couleur: donnees.nouveau })
				} else {
					erreur = true
				}
				break
			case 'ajouterpage':
				this.items.splice(donnees.nouveau, 1, [])
				this.$socket.emit('ajouterpage', { tableau: this.tableau, page: donnees.nouveau })
				this.page = donnees.nouveau
				this.afficherPage(this.page)
				break
			case 'supprimerpage':
				this.items.splice(donnees.nouveau, 1)
				this.$socket.emit('supprimerpage', { tableau: this.tableau, page: donnees.nouveau })
				if (this.page === donnees.nouveau && this.page > 0) {
					this.afficherPage(this.page)
				} else if (this.page === donnees.nouveau && this.page === 0) {
					this.page = 0
					this.afficherPage(this.page)
				}
				break
			}
			if (erreur === false) {
				this.positionHistorique += 1
				this.$nextTick(function () {
					this.items[this.page].forEach(function (item, index) {
						if (item.objet === 'ancre') {
							this.items[this.page][index].visible = false
						}
					}.bind(this))
					this.transformer()
					this.$forceUpdate()
				}.bind(this))
			}
		},
		activerDeplacement () {
			this.items[this.page].forEach(function (item) {
				item.verrouille ? item.draggable = false : item.draggable = true
			})
		},
		desactiverDeplacement () {
			this.items[this.page].forEach(function (item) {
				item.draggable = false
			})
		},
		activerSelecteur () {
			this.$nextTick(function () {
				if (document.querySelector('#couleur-selecteur')) {
					document.querySelector('#couleur-selecteur').addEventListener('change', this.modifierCouleurSelecteur)
				}
			}.bind(this))
		},
		desactiverSelecteur () {
			this.$nextTick(function () {
				if (document.querySelector('#couleur-selecteur')) {
					document.querySelector('#couleur-selecteur').removeEventListener('change', this.modifierCouleurSelecteur)
				}
			}.bind(this))
		},
		gererMenuUtilisateurs () {
			if (this.menu !== 'utilisateurs') {
				this.menu = 'utilisateurs'
			} else if (this.menu === 'utilisateurs') {
				this.menu = ''
			}
		},
		definirUtilisateurs (donnees) {
			let utilisateurs = []
			const autresUtilisateurs = []
			donnees.forEach(function (utilisateur) {
				if (utilisateur.identifiant === this.identifiant && utilisateurs.length === 0) {
					utilisateurs.push(utilisateur)
				} else if (utilisateur.identifiant !== this.identifiant) {
					autresUtilisateurs.push(utilisateur)
				}
			}.bind(this))
			utilisateurs = utilisateurs.concat(autresUtilisateurs)
			this.utilisateurs = utilisateurs
		},
		afficherModifierNom () {
			this.modale = 'modifier-nom'
			this.nouveaunom = this.nomUtilisateur
		},
		modifierNom () {
			if (this.nouveaunom !== '') {
				this.$nuxt.$loading.start()
				axios.post(this.hote + '/api/modifier-nom', {
					nom: this.nouveaunom
				}).then(function (reponse) {
					this.$nuxt.$loading.finish()
					const donnees = reponse.data
					if (donnees === 'erreur') {
						this.fermerModaleModifierNom()
						this.$store.dispatch('modifierMessage', this.$t('erreurCommunicationServeur'))
					} else if (donnees === 'non_autorise') {
						this.fermerModaleModifierNom()
						this.$store.dispatch('modifierMessage', this.$t('actionNonAutorisee'))
					} else if (donnees === 'nom_modifie') {
						this.$store.dispatch('modifierNom', this.nouveaunom)
						this.utilisateurs.forEach(function (utilisateur) {
							if (utilisateur.identifiant === this.identifiant) {
								utilisateur.nom = this.nouveaunom
							}
						}.bind(this))
						this.$store.dispatch('modifierNotification', this.$t('nomModifie'))
						this.fermerModaleModifierNom()
					}
				}.bind(this)).catch(function () {
					this.$nuxt.$loading.finish()
					this.fermerModaleModifierNom()
					this.$store.dispatch('modifierMessage', this.$t('erreurCommunicationServeur'))
				}.bind(this))
			} else if (this.nouveaunom === '') {
				this.$store.dispatch('modifierMessage', this.$t('remplirNom'))
			}
		},
		fermerModaleModifierNom () {
			this.modale = ''
			this.nouveaunom = ''
		},
		afficherModaleModifierStatutUtilisateur (identifiant, statut) {
			this.modale = 'modifier-statut-utilisateur'
			let message = ''
			if (statut === 'editeur') {
				message = this.$t('confirmationAttribuerDroitsUtilisateur')
			} else {
				message = this.$t('confirmationRetirerDroitsUtilisateur')
			}
			this.donneesStatutUtilisateur = { identifiant: identifiant, statut: statut, message: message }
		},
		modifierStatutUtilisateur () {
			this.$nuxt.$loading.start()
			this.$socket.emit('modifierstatututilisateur', { tableau: this.tableau, admin: this.identifiant, identifiant: this.donneesStatutUtilisateur.identifiant, statut: this.donneesStatutUtilisateur.statut })
			this.modale = ''
			this.donneesStatutUtilisateur = { identifiant: '', statut: '', message: '' }
		},
		modifierTitre () {
			const titre = document.querySelector('#titre-tableau').value
			if (titre !== '') {
				this.$nuxt.$loading.start()
				axios.post(this.hote + '/api/modifier-titre', {
					tableau: this.tableau,
					nouveautitre: titre
				}).then(function (reponse) {
					this.$nuxt.$loading.finish()
					const donnees = reponse.data
					if (donnees === 'erreur') {
						this.fermerModaleTitre()
						this.$store.dispatch('modifierMessage', this.$t('erreurCommunicationServeur'))
					} else if (donnees === 'non_autorise') {
						this.fermerModaleTitre()
						this.$store.dispatch('modifierMessage', this.$t('actionNonAutorisee'))
					} else if (donnees === 'titre_modifie') {
						this.titre = titre
						this.$store.dispatch('modifierNotification', this.$t('titreModifie'))
						this.fermerModaleTitre()
					}
				}.bind(this)).catch(function () {
					this.$nuxt.$loading.finish()
					this.fermerModaleTitre()
					this.$store.dispatch('modifierMessage', this.$t('erreurCommunicationServeur'))
				}.bind(this))
			} else if (titre === '') {
				this.$store.dispatch('modifierMessage', this.$t('remplirNouveauTitre'))
			}
		},
		modifierLangue (langue) {
			if (this.langue !== langue) {
				axios.post(this.hote + '/api/modifier-langue', {
					langue: langue
				}).then(function () {
					this.$i18n.setLocale(langue)
					document.getElementsByTagName('html')[0].setAttribute('lang', langue)
					this.$store.dispatch('modifierLangue', langue)
					this.$store.dispatch('modifierNotification', this.$t('langueModifiee'))
				}.bind(this)).catch(function () {
					this.$store.dispatch('modifierMessage', this.$t('erreurCommunicationServeur'))
				}.bind(this))
			}
		},
		modifierFond (fond) {
			if (fond.substring(0, 8) === 'couleur-') {
				this.modifierCouleurFond('#' + fond.substring(8).replace('.png', ''))
			} else {
				this.$nuxt.$loading.start()
				axios.post(this.hote + '/api/modifier-fond', {
					tableau: this.tableau,
					fond: fond
				}).then(function (reponse) {
					this.$nuxt.$loading.finish()
					const donnees = reponse.data
					if (donnees === 'erreur') {
						this.$store.dispatch('modifierMessage', this.$t('erreurCommunicationServeur'))
					} else if (donnees === 'non_autorise') {
						this.$store.dispatch('modifierMessage', this.$t('actionNonAutorisee'))
					} else if (donnees === 'fond_modifie') {
						this.options.fond = fond
						document.querySelector('#tableau .konvajs-content').style.backgroundColor = 'transparent'
						document.querySelector('#tableau .konvajs-content').style.backgroundImage = 'url(/img/' + fond + ')'
						document.querySelector('#tableau .konvajs-content').style.backgroundRepeat = 'repeat'
						this.$store.dispatch('modifierNotification', this.$t('fondModifie'))
						this.$socket.emit('modifierfond', { tableau: this.tableau, fond: fond })
					}
				}.bind(this)).catch(function () {
					this.$nuxt.$loading.finish()
					this.$store.dispatch('modifierMessage', this.$t('erreurCommunicationServeur'))
				}.bind(this))
			}
		},
		modifierCouleurFond (couleur) {
			this.$nuxt.$loading.start()
			axios.post(this.hote + '/api/modifier-fond', {
				tableau: this.tableau,
				fond: couleur
			}).then(function (reponse) {
				this.$nuxt.$loading.finish()
				const donnees = reponse.data
				if (donnees === 'erreur') {
					this.$store.dispatch('modifierMessage', this.$t('erreurCommunicationServeur'))
				} else if (donnees === 'non_autorise') {
					this.$store.dispatch('modifierMessage', this.$t('actionNonAutorisee'))
				} else if (donnees === 'fond_modifie') {
					this.options.fond = couleur
					document.querySelector('#tableau .konvajs-content').style.backgroundColor = couleur
					document.querySelector('#tableau .konvajs-content').style.backgroundImage = 'none'
					this.$store.dispatch('modifierNotification', this.$t('fondModifie'))
					this.$socket.emit('modifierfond', { tableau: this.tableau, fond: couleur })
				}
			}.bind(this)).catch(function () {
				this.$nuxt.$loading.finish()
				this.$store.dispatch('modifierMessage', this.$t('erreurCommunicationServeur'))
			}.bind(this))
		},
		modifierMultiPage (event) {
			if (event.target.checked === true) {
				this.$socket.emit('modifiermultipage', { tableau: this.tableau, multipage: 'oui' })
			} else {
				this.$socket.emit('modifiermultipage', { tableau: this.tableau, multipage: 'non' })
			}
			this.$nuxt.$loading.start()
		},
		modifierEdition (event) {
			if (event.target.checked === true) {
				this.$socket.emit('modifieredition', { tableau: this.tableau, edition: 'ouverte' })
			} else {
				this.$socket.emit('modifieredition', { tableau: this.tableau, edition: 'fermee' })
			}
			this.$nuxt.$loading.start()
		},
		modifierAcces () {
			if (this.question !== '' && this.reponse !== '' && this.nouvellequestion !== '' && this.nouvellereponse !== '') {
				this.$nuxt.$loading.start()
				axios.post(this.hote + '/api/modifier-acces', {
					tableau: this.tableau,
					question: this.question,
					reponse: this.reponse,
					nouvellequestion: this.nouvellequestion,
					nouvellereponse: this.nouvellereponse
				}).then(function (reponse) {
					this.$nuxt.$loading.finish()
					const donnees = reponse.data
					if (donnees === 'erreur') {
						this.fermerModaleAcces()
						this.$store.dispatch('modifierMessage', this.$t('erreurCommunicationServeur'))
					} else if (donnees === 'non_autorise') {
						this.fermerModaleAcces()
						this.$store.dispatch('modifierMessage', this.$t('actionNonAutorisee'))
					} else if (donnees === 'informations_incorrectes') {
						this.fermerModaleAcces()
						this.$store.dispatch('modifierMessage', this.$t('informationsIncorrectes'))
					} else if (donnees === 'acces_modifie') {
						this.$store.dispatch('modifierNotification', this.$t('accesModifie'))
						this.fermerModaleAcces()
					}
				}.bind(this)).catch(function () {
					this.$nuxt.$loading.finish()
					this.fermerModaleAcces()
					this.$store.dispatch('modifierMessage', this.$t('erreurCommunicationServeur'))
				}.bind(this))
			} else if (this.question === '') {
				this.$store.dispatch('modifierMessage', this.$t('selectionnerQuestionSecreteActuelle'))
			} else if (this.reponse === '') {
				this.$store.dispatch('modifierMessage', this.$t('indiquerReponseSecreteActuelle'))
			} else if (this.nouvellequestion === '') {
				this.$store.dispatch('modifierMessage', this.$t('selectionnerNouvelleQuestionSecrete'))
			} else if (this.nouvellereponse === '') {
				this.$store.dispatch('modifierMessage', this.$t('indiquerNouvelleReponseSecrete'))
			}
		},
		fermerModaleAcces () {
			this.modale = ''
			this.question = ''
			this.reponse = ''
			this.nouvellequestion = ''
			this.nouvellereponse = ''
		},
		terminerSession () {
			this.$nuxt.$loading.start()
			axios.post(this.hote + '/api/terminer-session').then(function (reponse) {
				this.$nuxt.$loading.finish()
				const donnees = reponse.data
				if (donnees === 'session_terminee') {
					this.modale = ''
					this.menu = ''
					this.admin = false
					this.$store.dispatch('modifierNotification', this.$t('sessionTerminee'))
				}
			}.bind(this)).catch(function () {
				this.$nuxt.$loading.finish()
				this.modale = ''
				this.menu = ''
				this.$store.dispatch('modifierMessage', this.$t('erreurCommunicationServeur'))
			}.bind(this))
		},
		debloquerTableau () {
			if (this.question !== '' && this.reponse !== '') {
				this.$nuxt.$loading.start()
				axios.post(this.hote + '/api/debloquer-tableau', {
					tableau: this.tableau,
					question: this.question,
					reponse: this.reponse
				}).then(function (reponse) {
					this.$nuxt.$loading.finish()
					const donnees = reponse.data
					if (donnees === 'erreur') {
						this.fermerModaleDebloquer()
						this.$store.dispatch('modifierMessage', this.$t('erreurCommunicationServeur'))
					} else if (donnees === 'informations_incorrectes') {
						this.fermerModaleDebloquer()
						this.$store.dispatch('modifierMessage', this.$t('informationsIncorrectes'))
					} else if (donnees === 'tableau_debloque') {
						this.admin = true
						this.$store.dispatch('modifierNotification', this.$t('tableauDebloque'))
						this.fermerModaleDebloquer()
					}
				}.bind(this)).catch(function () {
					this.$nuxt.$loading.finish()
					this.fermerModaleDebloquer()
					this.$store.dispatch('modifierMessage', this.$t('erreurCommunicationServeur'))
				}.bind(this))
			} else if (this.question === '') {
				this.$store.dispatch('modifierMessage', this.$t('selectionnerQuestionSecrete'))
			} else if (this.reponse === '') {
				this.$store.dispatch('modifierMessage', this.$t('remplirReponseSecrete'))
			}
		},
		fermerModaleDebloquer () {
			this.modale = ''
			this.question = ''
			this.reponse = ''
		},
		supprimerTableau () {
			this.modale = ''
			this.$nuxt.$loading.start()
			axios.post(this.hote + '/api/supprimer-tableau', {
				tableau: this.tableau
			}).then(function (reponse) {
				this.$nuxt.$loading.finish()
				const donnees = reponse.data
				if (donnees === 'erreur') {
					this.modale = ''
					this.$store.dispatch('modifierMessage', this.$t('erreurCommunicationServeur'))
				} else if (donnees === 'non_autorise') {
					this.modale = ''
					this.$store.dispatch('modifierMessage', this.$t('actionNonAutorisee'))
				} else if (donnees === 'tableau_supprime') {
					this.$router.push('/')
				}
			}.bind(this)).catch(function () {
				this.$nuxt.$loading.finish()
				this.modale = ''
				this.$store.dispatch('modifierMessage', this.$t('erreurCommunicationServeur'))
			}.bind(this))
		}
	}
}

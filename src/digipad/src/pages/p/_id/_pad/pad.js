import axios from 'axios'
import imagesLoaded from 'imagesloaded'
import pell from 'pell'
import linkifyHtml from 'linkify-html'
import saveAs from 'file-saver'
import Panzoom from '@panzoom/panzoom'
import ClipboardJS from 'clipboard'
import draggable from 'vuedraggable'
import chargement from '@/components/chargement.vue'
import emojis from '@/components/emojis.vue'

export default {
	name: 'Pad',
	components: {
		draggable,
		chargement,
		emojis
	},
	sockets: {
		connexion: function (donnees) {
			this.definirUtilisateurs(donnees)
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
			this.chargement = false
			this.$store.dispatch('modifierAlerte', this.$t('erreurActionServeur'))
		},
		ajouterbloc: function (donnees) {
			this.action = 'ajouter'
			this.utilisateur = donnees.identifiant
			if (donnees.visibilite === 'visible' || this.admin || (this.pad.contributions === 'moderees' && (this.utilisateur === this.identifiant))) {
				if (this.pad.affichage === 'colonnes') {
					if (this.pad.ordre === 'croissant') {
						this.colonnes[donnees.colonne].push(donnees)
					} else {
						this.colonnes[donnees.colonne].unshift(donnees)
					}
				}
				if (this.pad.ordre === 'croissant') {
					this.blocs.push(donnees)
				} else {
					this.blocs.unshift(donnees)
				}
				if (donnees.visibilite === 'visible' || this.admin || (this.pad.contributions === 'moderees' && (this.utilisateur === this.identifiant))) {
					this.activite.unshift({ id: donnees.activiteId, bloc: donnees.bloc, identifiant: donnees.identifiant, nom: donnees.nom, titre: donnees.titre, date: donnees.date, couleur: donnees.couleur, type: 'bloc-ajoute' })
				}
				this.$nextTick(function () {
					const bloc = document.querySelector('#' + donnees.bloc)
					bloc.classList.add('anime')
					bloc.addEventListener('animationend', function () {
						bloc.classList.remove('anime')
					})
				})
				if (this.utilisateur === this.identifiant) {
					this.$nextTick(function () {
						const bloc = document.querySelector('#' + donnees.bloc)
						bloc.scrollIntoView()
					})
				}
				this.envoyerNotificationAdmins()
			}
		},
		modifierbloc: function (donnees) {
			this.action = 'modifier'
			if (this.pad.affichage === 'colonnes') {
				this.colonnes[donnees.colonne].forEach(function (item, index) {
					if (item.bloc === donnees.bloc) {
						if (donnees.visibilite === 'privee' && !this.admin) {
							this.colonnes[donnees.colonne].splice(index, 1)
						} else {
							this.colonnes[donnees.colonne][index] = { bloc: donnees.bloc, identifiant: item.identifiant, nom: item.nom, titre: donnees.titre, texte: donnees.texte, media: donnees.media, iframe: donnees.iframe, type: donnees.type, source: donnees.source, vignette: donnees.vignette, date: item.date, modifie: donnees.modifie, couleur: item.couleur, commentaires: item.commentaires, evaluations: item.evaluations, colonne: item.colonne, visibilite: donnees.visibilite }
						}
					}
				}.bind(this))
			}
			this.blocs.forEach(function (item, index) {
				if (item.bloc === donnees.bloc) {
					this.utilisateur = donnees.identifiant
					if (donnees.visibilite === 'privee' && !this.admin) {
						this.blocs.splice(index, 1)
					} else {
						this.blocs.splice(index, 1, { bloc: donnees.bloc, identifiant: item.identifiant, nom: item.nom, titre: donnees.titre, texte: donnees.texte, media: donnees.media, iframe: donnees.iframe, type: donnees.type, source: donnees.source, vignette: donnees.vignette, date: item.date, modifie: donnees.modifie, couleur: item.couleur, commentaires: item.commentaires, evaluations: item.evaluations, colonne: item.colonne, visibilite: donnees.visibilite })
					}
				}
			}.bind(this))
			if (donnees.visibilite === 'visible') {
				this.activite.unshift({ id: donnees.activiteId, bloc: donnees.bloc, identifiant: donnees.identifiant, nom: donnees.nom, titre: donnees.titre, date: donnees.date, couleur: donnees.couleur, type: 'bloc-modifie' })
			}
			this.envoyerNotificationAdmins()
		},
		autoriserbloc: function (donnees) {
			if ((this.pad.contributions === 'moderees' && (donnees.identifiant === this.identifiant)) || this.admin) {
				if (this.pad.affichage === 'colonnes') {
					this.colonnes.forEach(function (colonne, indexColonne) {
						colonne.forEach(function (item, index) {
							if (item.bloc === donnees.bloc) {
								this.colonnes[indexColonne][index].visibilite = 'visible'
								this.colonnes[indexColonne][index].date = donnees.date
								if (this.colonnes[indexColonne][index].hasOwnProperty('modifie')) {
									delete this.colonnes[indexColonne][index].modifie
								}
							}
						}.bind(this))
					}.bind(this))
				}
				this.blocs.forEach(function (item, index) {
					if (item.bloc === donnees.bloc) {
						this.blocs[index].visibilite = 'visible'
						this.blocs[index].date = donnees.date
						if (this.blocs[index].hasOwnProperty('modifie')) {
							delete this.blocs[index].modifie
						}
					}
				}.bind(this))
				this.chargement = false
			} else {
				if (this.pad.affichage === 'colonnes') {
					if (this.pad.ordre === 'croissant') {
						this.colonnes[donnees.colonne].push(donnees)
					} else {
						this.colonnes[donnees.colonne].unshift(donnees)
					}
				}
				if (this.pad.ordre === 'croissant') {
					this.blocs.push(donnees)
				} else {
					this.blocs.unshift(donnees)
				}
			}
			this.activite.unshift({ id: donnees.activiteId, bloc: donnees.bloc, identifiant: donnees.identifiant, nom: donnees.nom, titre: donnees.titre, date: donnees.date, couleur: donnees.couleur, type: 'bloc-ajoute' })
			this.$nextTick(function () {
				const bloc = document.querySelector('#' + donnees.bloc)
				if (bloc !== null) {
					bloc.classList.add('anime')
					bloc.addEventListener('animationend', function () {
						bloc.classList.remove('anime')
					})
				}
			})
			if (this.admin && this.identifiant === donnees.admin && donnees.moderation === 'moderee') {
				this.$store.dispatch('modifierMessage', this.$t('capsuleValidee'))
			} else if (this.admin && this.identifiant === donnees.admin && donnees.moderation === 'privee') {
				this.$store.dispatch('modifierMessage', this.$t('capsuleVisible'))
			} else if (!this.admin && donnees.identifiant === this.identifiant) {
				this.$store.dispatch('modifierMessage', this.$t('capsulePubliee', { titre: donnees.titre }))
			}
			if (this.modaleDiaporama) {
				this.$nextTick(function () {
					this.chargerDiapositive()
				}.bind(this))
			}
		},
		deplacerbloc: function (donnees) {
			this.utilisateur = donnees.identifiant
			const blocActif = document.querySelector('.bloc.actif')
			let blocId = ''
			if (blocActif && this.utilisateur !== this.identifiant) {
				blocId = blocActif.id
			}
			if (this.pad.affichage === 'colonnes') {
				this.definirColonnes(donnees.blocs)
			} else {
				this.blocs = donnees.blocs
			}
			this.$nextTick(function () {
				if (blocActif && this.utilisateur !== this.identifiant) {
					blocActif.classList.remove('actif')
					document.querySelector('#' + blocId).classList.add('actif')
				}
			}.bind(this))
			this.chargement = false
		},
		supprimerbloc: function (donnees) {
			this.action = 'supprimer'
			if (this.pad.affichage === 'colonnes') {
				this.colonnes[donnees.colonne].forEach(function (item, index) {
					if (item.bloc === donnees.bloc) {
						this.colonnes[donnees.colonne].splice(index, 1)
					}
				}.bind(this))
			}
			this.blocs.forEach(function (item, index) {
				if (item.bloc === donnees.bloc) {
					this.utilisateur = donnees.identifiant
					this.blocs.splice(index, 1)
				}
			}.bind(this))
			this.activite.unshift({ id: donnees.activiteId, bloc: donnees.bloc, identifiant: donnees.identifiant, nom: donnees.nom, titre: donnees.titre, date: donnees.date, couleur: donnees.couleur, type: 'bloc-supprime' })
			this.envoyerNotificationAdmins()
		},
		commenterbloc: function (donnees) {
			const blocs = this.blocs
			blocs.forEach(function (item) {
				if (item.bloc === donnees.bloc) {
					item.commentaires = donnees.commentaires
				}
			})
			this.blocs = blocs
			if ((this.modaleCommentaires && this.bloc === donnees.bloc) || (this.modaleDiaporama && this.donneesBloc.bloc === donnees.bloc)) {
				this.commentaires.unshift({ id: donnees.id, identifiant: donnees.identifiant, nom: donnees.nom, texte: donnees.texte, date: donnees.date })
			}
			this.activite.unshift({ id: donnees.activiteId, bloc: donnees.bloc, identifiant: donnees.identifiant, nom: donnees.nom, titre: donnees.titre, date: donnees.date, couleur: donnees.couleur, type: 'bloc-commente' })
			this.envoyerNotificationAdmins()
		},
		modifiercommentaire: function (donnees) {
			const commentaires = this.commentaires
			commentaires.forEach(function (commentaire) {
				if (commentaire.id === donnees.id) {
					commentaire.texte = donnees.texte
				}
			})
			this.commentaires = commentaires
		},
		supprimercommentaire: function (donnees) {
			const blocs = this.blocs
			blocs.forEach(function (item) {
				if (item.bloc === donnees.bloc) {
					item.commentaires = donnees.commentaires
				}
			})
			this.blocs = blocs
			const commentaires = this.commentaires
			commentaires.forEach(function (commentaire, index) {
				if (commentaire.id === donnees.id) {
					commentaires.splice(index, 1)
				}
			})
			this.commentaires = commentaires
		},
		commentaires: function (donnees) {
			this.commentaires = donnees.commentaires
			if (donnees.type === 'discussion') {
				this.chargement = false
				this.modaleCommentaires = true
				this.$nextTick(function () {
					this.genererEditeur()
				}.bind(this))
			} else {
				this.chargerDiapositive()
			}
		},
		evaluerbloc: function (donnees) {
			this.chargement = false
			const blocs = this.blocs
			blocs.forEach(function (item) {
				if (item.bloc === donnees.bloc) {
					item.evaluations.push(donnees.evaluation)
				}
			})
			this.blocs = blocs
			this.activite.unshift({ id: donnees.activiteId, bloc: donnees.bloc, identifiant: donnees.identifiant, nom: donnees.nom, titre: donnees.titre, date: donnees.date, couleur: donnees.couleur, type: 'bloc-evalue' })
			this.envoyerNotificationAdmins()
		},
		modifierevaluation: function (donnees) {
			this.chargement = false
			const blocs = this.blocs
			blocs.forEach(function (item, index) {
				if (item.bloc === donnees.bloc) {
					const evaluations = item.evaluations
					evaluations.forEach(function (evaluation) {
						if (evaluation.id === donnees.id) {
							evaluation.date = donnees.date
							evaluation.etoiles = donnees.etoiles
						}
					})
				}
			})
			this.blocs = blocs
		},
		supprimerevaluation: function (donnees) {
			this.chargement = false
			const blocs = this.blocs
			blocs.forEach(function (item) {
				if (item.bloc === donnees.bloc) {
					const evaluations = item.evaluations
					evaluations.forEach(function (evaluation, index) {
						if (evaluation.id === donnees.id) {
							evaluations.splice(index, 1)
						}
					})
				}
			})
			this.blocs = blocs
		},
		modifiernom: function (donnees) {
			this.modifierCaracteristique(donnees.identifiant, 'nom', donnees.nom)
			this.chargement = false
			if (donnees.identifiant === this.identifiant) {
				this.$store.dispatch('modifierNom', donnees.nom)
				this.$store.dispatch('modifierMessage', this.$t('nomModifie'))
			}
		},
		modifiercouleur: function (donnees) {
			this.modifierCaracteristique(donnees.identifiant, 'couleur', donnees.couleur)
			if (donnees.identifiant === this.identifiant) {
				this.$store.dispatch('modifierMessage', this.$t('couleurModifiee'))
			}
		},
		modifiertitre: function (titre) {
			this.pad.titre = titre
			this.chargement = false
			if (this.admin) {
				this.$store.dispatch('modifierMessage', this.$t('titrePadModifie'))
			}
		},
		modifiercodeacces: function (code) {
			this.pad.code = code
			this.chargement = false
			this.modificationCode = false
			if (this.admin) {
				this.$store.dispatch('modifierMessage', this.$t('codeAccesModifie'))
			}
		},
		modifieradmins: function (admins) {
			this.pad.admins = admins
			this.chargement = false
			if (this.admin) {
				this.$store.dispatch('modifierMessage', this.$t('listeAdminsModifiee'))
			}
		},
		modifieracces: function (donnees) {
			this.pad.acces = donnees.acces
			this.chargement = false
			if (this.admin) {
				if (donnees.acces === 'code') {
					this.pad.code = donnees.code
					this.codeVisible = true
				}
				this.$store.dispatch('modifierMessage', this.$t('accesPadModifie'))
			} else {
				if (donnees.acces === 'prive') {
					this.$socket.emit('sortie', this.pad.id, this.identifiant)
					this.$router.push('/')
				}
			}
		},
		modifiercontributions: function (donnees) {
			this.pad.contributions = donnees.contributions
			this.chargement = false
			if (this.admin) {
				this.$store.dispatch('modifierMessage', this.$t('statutPadModifie'))
			}
			if (!this.admin && donnees.contributionsPrecedentes === 'moderees') {
				this.$store.dispatch('modifierMessage', this.$t('rechargerPage'))
			}
		},
		modifieraffichage: function (affichage) {
			this.pad.affichage = affichage
			this.affichage = affichage
			this.chargement = false
			if (this.admin) {
				this.action = ''
				this.$store.dispatch('modifierMessage', this.$t('affichagePadModifie'))
			}
		},
		modifierordre: function (ordre) {
			const blocActif = document.querySelector('.bloc.actif')
			let blocId = ''
			if (blocActif) {
				blocId = blocActif.id
			}
			this.pad.ordre = ordre
			this.blocs.reverse()
			if (this.pad.affichage === 'colonnes') {
				this.definirColonnes(this.blocs)
			}
			this.$nextTick(function () {
				if (blocActif) {
					blocActif.classList.remove('actif')
					document.querySelector('#' + blocId).classList.add('actif')
				}
			})
			this.chargement = false
			if (this.admin) {
				this.$store.dispatch('modifierMessage', this.$t('parametreOrdreModifie'))
			}
		},
		modifierfond: function (fond) {
			this.pad.fond = fond
			imagesLoaded('#pad', { background: true }, function () {
				this.chargement = false
				if (this.admin) {
					this.$store.dispatch('modifierMessage', this.$t('arrierePlanModifie'))
				}
			}.bind(this))
		},
		modifiercouleurfond: function (fond) {
			this.pad.fond = fond
			this.chargement = false
			if (this.admin) {
				this.$store.dispatch('modifierMessage', this.$t('arrierePlanModifie'))
			}
		},
		modifieractivite: function (statut) {
			this.pad.registreActivite = statut
			this.chargement = false
			if (this.admin) {
				this.$store.dispatch('modifierMessage', this.$t('parametreActiviteModifie'))
			}
		},
		modifierconversation: function (statut) {
			this.pad.conversation = statut
			this.chargement = false
			if (this.admin) {
				this.$store.dispatch('modifierMessage', this.$t('parametreConversationModifie'))
			}
		},
		modifierlisteutilisateurs: function (statut) {
			this.pad.listeUtilisateurs = statut
			this.chargement = false
			if (this.admin) {
				this.$store.dispatch('modifierMessage', this.$t('parametreListeUtilisateursModifie'))
			}
		},
		modifiereditionnom: function (statut) {
			this.pad.editionNom = statut
			this.chargement = false
			if (this.admin) {
				this.$store.dispatch('modifierMessage', this.$t('parametreEditionNomModifie'))
			}
		},
		modifierfichiers: function (statut) {
			this.pad.fichiers = statut
			this.chargement = false
			if (this.admin) {
				this.$store.dispatch('modifierMessage', this.$t('parametreFichiersModifie'))
			}
		},
		modifierliens: function (statut) {
			this.pad.liens = statut
			this.chargement = false
			if (this.admin) {
				this.$store.dispatch('modifierMessage', this.$t('parametreLiensModifie'))
			}
		},
		modifierdocuments: function (statut) {
			this.pad.documents = statut
			this.chargement = false
			if (this.admin) {
				this.$store.dispatch('modifierMessage', this.$t('parametreDocumentsModifie'))
			}
		},
		modifiercommentaires: function (statut) {
			this.pad.commentaires = statut
			this.chargement = false
			if (this.admin) {
				this.$store.dispatch('modifierMessage', this.$t('parametreCommentairesModifie'))
			}
		},
		modifierevaluations: function (statut) {
			this.pad.evaluations = statut
			this.chargement = false
			if (this.admin) {
				this.$store.dispatch('modifierMessage', this.$t('parametreEvaluationModifie'))
			}
		},
		message: function (message) {
			this.messages.push(message)
			if (message.identifiant !== this.identifiant && !this.menuChat) {
				this.nouveauxMessages++
			}
		},
		reinitialisermessages: function () {
			this.messages = []
			this.nouveauxMessages = 0
			this.chargement = false
			if (this.admin) {
				this.$store.dispatch('modifierMessage', this.$t('historiqueConversationSupprime'))
			}
		},
		reinitialiseractivite: function () {
			this.activite = []
			this.chargement = false
			if (this.admin) {
				this.$store.dispatch('modifierMessage', this.$t('activiteSupprimee'))
			}
		},
		supprimeractivite: function (id) {
			this.activite.forEach(function (activite, index) {
				if (activite.id === id) {
					this.activite.splice(index, 1)
				}
			}.bind(this))
			this.chargement = false
			if (this.admin) {
				this.$store.dispatch('modifierMessage', this.$t('entreeActiviteSupprimee'))
			}
		},
		ajoutercolonne: function (donnees) {
			this.colonnes.push([])
			this.pad.colonnes = donnees.colonnes
			this.activite.unshift({ id: donnees.activiteId, identifiant: donnees.identifiant, nom: donnees.nom, titre: donnees.titre, date: donnees.date, couleur: donnees.couleur, type: 'colonne-ajoutee' })
			if (this.admin) {
				this.$store.dispatch('modifierMessage', this.$t('colonneAjoutee'))
			}
			this.chargement = false
		},
		modifiercolonne: function (colonnes) {
			this.pad.colonnes = colonnes
			if (this.admin) {
				this.$store.dispatch('modifierMessage', this.$t('nomColonneModifie'))
			}
			this.chargement = false
		},
		supprimercolonne: function (donnees) {
			this.colonnes.splice(parseInt(donnees.colonne), 1)
			const blocs = []
			this.colonnes.forEach(function (colonne, index) {
				colonne.forEach(function (bloc) {
					bloc.colonne = index
				})
				blocs.push(...colonne)
			})
			this.pad.colonnes = donnees.colonnes
			this.blocs = blocs
			this.activite.unshift({ id: donnees.activiteId, identifiant: donnees.identifiant, nom: donnees.nom, titre: donnees.titre, date: donnees.date, couleur: donnees.couleur, type: 'colonne-supprimee' })
			if (this.admin) {
				this.$store.dispatch('modifierMessage', this.$t('colonneSupprimee'))
			} else if (!this.admin && this.modaleBloc && parseInt(this.colonne) === parseInt(donnees.colonne)) {
				this.fermerModaleBlocSansEnregistrement()
				this.$store.dispatch('modifierMessage', this.$t('colonneActuelleSupprimee'))
			}
			this.chargement = false
		},
		deplacercolonne: function (donnees) {
			const blocs = []
			const donneesColonnes = this.colonnes[parseInt(donnees.colonne)]
			if (donnees.direction === 'gauche') {
				this.colonnes.splice((parseInt(donnees.colonne) - 1), 0, donneesColonnes)
				this.colonnes.splice((parseInt(donnees.colonne) + 1), 1)
			} else if (donnees.direction === 'droite') {
				const donneesColonneDeplacee = this.colonnes[parseInt(donnees.colonne) + 1]
				this.colonnes.splice((parseInt(donnees.colonne) + 1), 0, donneesColonnes)
				this.colonnes.splice(parseInt(donnees.colonne), 1, donneesColonneDeplacee)
				this.colonnes.splice((parseInt(donnees.colonne) + 2), 1)
			}
			this.colonnes.forEach(function (colonne, index) {
				colonne.forEach(function (bloc) {
					bloc.colonne = index
				})
				blocs.push(...colonne)
			})
			this.pad.colonnes = donnees.colonnes
			this.blocs = blocs
			this.activite.unshift({ id: donnees.activiteId, identifiant: donnees.identifiant, nom: donnees.nom, titre: donnees.titre, date: donnees.date, couleur: donnees.couleur, type: 'colonne-deplacee' })
			if (this.admin) {
				this.$store.dispatch('modifierMessage', this.$t('colonneDeplacee'))
			} else {
				if (this.modaleBloc && parseInt(this.colonne) === parseInt(donnees.colonne) && donnees.direction === 'gauche') {
					this.colonne = parseInt(donnees.colonne) - 1
				} else if (this.modaleBloc && parseInt(this.colonne) === parseInt(donnees.colonne) && donnees.direction === 'droite') {
					this.colonne = parseInt(donnees.colonne) + 1
				} else if (this.modaleBloc && parseInt(this.colonne) === (parseInt(donnees.colonne) - 1) && donnees.direction === 'gauche') {
					this.colonne = parseInt(donnees.colonne)
				} else if (this.modaleBloc && parseInt(this.colonne) === (parseInt(donnees.colonne) + 1) && donnees.direction === 'droite') {
					this.colonne = parseInt(donnees.colonne)
				}
			}
			this.chargement = false
		},
		debloquerpad: function (donnees) {
			this.chargement = false
			this.modifierCaracteristique(this.identifiant, 'identifiant', donnees.identifiant)
			this.modifierCaracteristique(donnees.identifiant, 'nom', donnees.nom)
			this.modifierCaracteristique(donnees.identifiant, 'couleur', donnees.couleur)
			this.$store.dispatch('modifierUtilisateur', { identifiant: donnees.identifiant, nom: donnees.nom, langue: donnees.langue, statut: 'auteur' })
			this.$store.dispatch('modifierMessage', this.$t('padDebloque'))
		},
		modifiernotification: function (donnees) {
			this.pad.notification = donnees
		},
		verifiermodifierbloc: function (donnees) {
			if (this.modaleBloc === true && this.bloc === donnees.bloc) {
				this.$socket.emit('reponsemodifierbloc', this.pad.id, donnees.identifiant, true)
			} else {
				this.$socket.emit('reponsemodifierbloc', this.pad.id, donnees.identifiant, false)
			}
		},
		reponsemodifierbloc: function (donnees) {
			if (this.identifiant === donnees.identifiant && donnees.reponse === true) {
				this.$store.dispatch('modifierMessage', this.$t('capsuleEnCoursModification'))
			}
		},
		deconnecte: function () {
			this.chargement = false
			this.$store.dispatch('modifierMessage', this.$t('problemeConnexion'))
		}
	},
	async asyncData (context) {
		const id = context.route.params.id
		const token = context.route.params.pad
		const identifiant = context.store.state.identifiant
		const statut = context.store.state.statut
		const { data } = await axios.post(context.store.state.hote + '/api/recuperer-donnees-pad', {
			id: id,
			token: token,
			identifiant: identifiant,
			statut: statut
		}, {
			headers: { 'Content-Type': 'application/json' }
		})
		if (data === 'erreur_pad' && context.store.state.statut === 'utilisateur') {
			context.redirect('/u/' + context.store.state.identifiant)
		} else if (data === 'erreur_pad' && (context.store.state.statut === 'invite' || context.store.state.statut === 'auteur' || context.store.state.statut === '')) {
			context.redirect('/')
		} else {
			return {
				pad: data.pad,
				blocs: data.blocs,
				activite: data.activite
			}
		}
	},
	data () {
		return {
			chargement: false,
			modaleBloc: false,
			titreModale: '',
			action: '',
			mode: '',
			affichage: '',
			colonnes: [],
			colonne: 0,
			modaleColonne: false,
			titreModaleColonne: '',
			modeColonne: '',
			titreColonne: '',
			bloc: '',
			titre: '',
			texte: '',
			media: '',
			lien: '',
			iframe: '',
			vignette: '',
			vignetteDefaut: '',
			source: '',
			type: '',
			progressionFichier: 0,
			progressionVignette: 0,
			progressionFond: 0,
			fichiers: [],
			vignettes: [],
			visibilite: false,
			chargementLien: false,
			chargementMedia: false,
			menuActivite: false,
			menuChat: false,
			menuOptions: false,
			menuUtilisateurs: false,
			modaleCommentaires: false,
			commentaires: [],
			commentaire: '',
			commentaireId: '',
			commentaireModifie: '',
			editeurCommentaire: '',
			editionCommentaire: false,
			emojis: '',
			modaleEvaluations: false,
			evaluations: [],
			evaluation: 0,
			evaluationId: '',
			messages: [],
			message: '',
			nouveauxMessages: 0,
			utilisateurs: [],
			utilisateur: '',
			modaleModifierNom: false,
			nomUtilisateur: '',
			couleur: '',
			couleurs: ['#f76707', '#f59f00', '#74b816', '#37b24d', '#0ca678', '#1098ad', '#1c7ed6', '#4263eb', '#7048e8', '#ae3ec9', '#d6336c', '#f03e3e', '#495057'],
			listeCouleurs: false,
			panneaux: [],
			fonds: ['fond1.png', 'fond2.png', 'fond3.png', 'fond4.png', 'fond5.png', 'fond6.png', 'fond7.png', 'fond8.png', 'fond9.png', 'fond10.png', 'fond11.png'],
			modaleConfirmer: false,
			messageConfirmation: '',
			typeConfirmation: '',
			modaleDiaporama: false,
			donneesBloc: {},
			motDePasse: '',
			modaleMotDePasse: false,
			modaleModifierMotDePasse: false,
			nouveauMotDePasse: '',
			defilement: false,
			depart: 0,
			distance: 0,
			resultats: {},
			page: 1,
			accesAutorise: false,
			codeAcces: '',
			codeVisible: false,
			modificationCode: false,
			modaleCodeAcces: false,
			codeqr: '',
			modaleCodeQR: false,
			recherche: false,
			requete: '',
			chargementVignette: false,
			modaleAdmins: false,
			admins: []
		}
	},
	head () {
		return {
			title: this.pad.hasOwnProperty('titre') ? this.pad.titre + ' - Digipad by La Digitale' : 'Digipad by La Digitale',
			meta: [
				{
					hid: 'robots',
					name: 'robots',
					content: 'noindex, nofollow'
				}
			]
		}
	},
	computed: {
		hote () {
			return this.$store.state.hote
		},
		userAgent () {
			return this.$store.state.userAgent
		},
		identifiant () {
			return this.$store.state.identifiant
		},
		nom () {
			return this.$store.state.nom
		},
		langue () {
			return this.$store.state.langue
		},
		langues () {
			return this.$store.state.langues
		},
		admin () {
			return this.pad.identifiant === this.identifiant || this.pad.admins.includes(this.identifiant)
		},
		statut () {
			return this.$store.state.statut
		},
		acces () {
			return this.$store.state.acces
		},
		etherpad () {
			return process.env.etherpad
		},
		etherpadApi () {
			return process.env.etherpadApi
		},
		limite () {
			return process.env.uploadLimit
		},
		blocsRecherche () {
			let resultats = []
			let blocs = []
			switch (this.requete) {
			case '!eval+':
				this.blocs.forEach(function (bloc) {
					bloc.evaluation = this.definirEvaluationCapsule(bloc.evaluations)
				}.bind(this))
				blocs = this.blocs.sort(function (a, b) {
					return b.evaluation - a.evaluation
				})
				break
			case '!eval-':
				this.blocs.forEach(function (bloc) {
					bloc.evaluation = this.definirEvaluationCapsule(bloc.evaluations)
				}.bind(this))
				blocs = this.blocs.sort(function (a, b) {
					return a.evaluation - b.evaluation
				})
				break
			case '!mod':
				blocs = this.blocs.filter(function (element) {
					return element.visibilite === 'masquee'
				})
				break
			case '!priv':
				blocs = this.blocs.filter(function (element) {
					return element.visibilite === 'privee'
				})
				break
			case '!comm+':
				blocs = this.blocs.sort(function (a, b) {
					return b.commentaires - a.commentaires
				})
				break
			case '!comm-':
				blocs = this.blocs.sort(function (a, b) {
					return a.commentaires - b.commentaires
				})
				break
			default:
				blocs = this.blocs.filter(function (element) {
					return element.titre.toLowerCase().includes(this.requete.toLowerCase()) || element.texte.toLowerCase().includes(this.requete.toLowerCase()) || element.media.toLowerCase().includes(this.requete.toLowerCase()) || element.iframe.toLowerCase().includes(this.requete.toLowerCase() || element.source.toLowerCase().includes(this.requete.toLowerCase()))
				}.bind(this))
			}
			if (this.pad.affichage === 'colonnes') {
				if (this.pad.colonnes && this.pad.colonnes.length > 0) {
					this.pad.colonnes.forEach(function () {
						resultats.push([])
					})
					blocs.forEach(function (bloc, index) {
						if (bloc.colonne !== undefined) {
							resultats[bloc.colonne].push(bloc)
						} else {
							blocs[index].colonne = 0
							resultats[bloc.colonne].push(bloc)
						}
					})
				} else {
					this.pad.colonnes.push(this.$t('colonneSansTitre'))
					resultats.push([])
					blocs.forEach(function (bloc, index) {
						blocs[index].colonne = 0
						resultats[0].push(bloc)
					})
				}
			} else {
				resultats = blocs
			}
			return resultats
		}
	},
	watch: {
		affichage: function (affichage) {
			if (affichage === 'colonnes') {
				this.definirColonnes(this.blocs)
				this.$nextTick(function () {
					this.activerDefilementHorizontal()
				}.bind(this))
			} else {
				this.desactiverDefilementHorizontal()
			}
		},
		blocs: function () {
			imagesLoaded('#pad', { background: true }, function () {
				this.$nextTick(function () {
					this.chargement = false
					let auteur = false
					if (this.utilisateur === this.identifiant) {
						auteur = true
					}
					const blocActif = document.querySelector('.bloc.actif')
					if (blocActif && this.action !== 'modifier' && this.bloc !== '' && auteur === true) {
						blocActif.classList.remove('actif')
					}
					if (this.action === 'ajouter' && auteur === true) {
						this.$store.dispatch('modifierMessage', this.$t('capsuleAjoutee'))
						document.querySelector('#' + this.bloc).classList.add('actif')
					} else if (this.action === 'modifier' && auteur === true) {
						this.$store.dispatch('modifierMessage', this.$t('capsuleModifiee'))
						this.fichiers.forEach(function (item, index) {
							if (this.media === item) {
								this.fichiers.splice(index, 1)
							}
						}.bind(this))
						if (this.fichiers.length > 0) {
							this.$socket.emit('supprimerfichiers', { pad: this.pad.id, fichiers: this.fichiers })
						}
						this.vignettes.forEach(function (item, index) {
							if (this.vignette === item) {
								this.vignettes.splice(index, 1)
							}
						}.bind(this))
						if (this.vignettes.length > 0) {
							this.$socket.emit('supprimervignettes', { pad: this.pad, vignettes: this.vignettes })
						}
					} else if (this.action === 'supprimer' && auteur === true) {
						this.$store.dispatch('modifierMessage', this.$t('capsuleSupprimee'))
					}
					this.utilisateur = ''
					if (this.action !== 'organiser' && auteur === true) {
						this.fermerModaleBloc()
					}
				}.bind(this))
			}.bind(this))
		},
		messages: function () {
			this.$nextTick(function () {
				document.querySelector('#messages').scrollIntoView({ behavior: 'smooth', block: 'end' })
			})
		},
		page: function (page) {
			this.rechercherImage(page)
		},
		recherche: function (valeur) {
			if (valeur === true) {
				this.$nextTick(function () {
					document.querySelector('#champ-recherche input').focus()
				})
			} else {
				this.requete = ''
			}
		}
	},
	watchQuery: ['page'],
	created () {
		if (this.pad.affichage === 'colonnes') {
			this.definirColonnes(this.blocs)
		}
		if (this.pad.acces === 'public' || (this.pad.acces === 'prive' && this.admin)) {
			this.$nuxt.$loading.start()
			this.accesAutorise = true
			this.$socket.emit('connexion', { pad: this.pad.id, identifiant: this.identifiant, nom: this.nom })
		} else if (this.pad.acces === 'code') {
			this.$nuxt.$loading.start()
			let autorisation = false
			this.acces.forEach(function (acces) {
				if (acces.hasOwnProperty('code') && acces.code === this.pad.code && acces.hasOwnProperty('pad') && acces.pad === this.pad.id) {
					autorisation = true
				}
			}.bind(this))
			const code = this.$route.query.code
			if (code === this.pad.code) {
				autorisation = true
			}
			if (this.admin || autorisation === true) {
				this.accesAutorise = true
				this.$socket.emit('connexion', { pad: this.pad.id, identifiant: this.identifiant, nom: this.nom })
			}
			if (!this.accesAutorise) {
				this.modaleCodeAcces = true
			}
		} else if (this.statut === 'utilisateur') {
			this.$router.push('/u/' + this.identifiant)
		} else {
			this.$router.push('/')
		}
		const langue = this.$route.query.lang
		if (this.langues.includes(langue) === true) {
			this.$i18n.setLocale(langue)
			this.$store.dispatch('modifierLangue', langue)
			this.$socket.emit('modifierlangue', langue)
		} else {
			this.$i18n.setLocale(this.langue)
		}
	},
	mounted () {
		imagesLoaded('#pad', { background: true }, function () {
			document.documentElement.setAttribute('lang', this.langue)
			document.addEventListener('mousedown', this.surlignerBloc, false)
			window.addEventListener('beforeunload', this.quitterPage, false)
			window.addEventListener('resize', this.redimensionner, false)
			window.addEventListener('message', this.ecouterMessage, false)

			if (this.pad.affichage === 'colonnes') {
				this.activerDefilementHorizontal()
			}
			const lien = this.hote + '/p/' + this.pad.id + '/' + this.pad.token
			const clipboardLien = new ClipboardJS('#copier-lien .lien', {
				text: function () {
					return lien
				}
			})
			clipboardLien.on('success', function () {
				this.$store.dispatch('modifierMessage', this.$t('lienCopie'))
			}.bind(this))
			const iframe = '<iframe src="' + this.hote + '/p/' + this.pad.id + '/' + this.pad.token + '" frameborder="0" width="100%" height="500"></iframe>'
			const clipboardCode = new ClipboardJS('#copier-code span', {
				text: function () {
					return iframe
				}
			})
			clipboardCode.on('success', function () {
				this.$store.dispatch('modifierMessage', this.$t('codeCopie'))
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

			setTimeout(function () {
				this.$nuxt.$loading.finish()
				document.getElementsByTagName('html')[0].setAttribute('lang', this.langue)
			}.bind(this), 100)

			document.querySelector('#pad').addEventListener('dragover', function (event) {
				event.preventDefault()
				event.stopPropagation()
			}, false)

			document.querySelector('#pad').addEventListener('dragcenter', function (event) {
				event.preventDefault()
				event.stopPropagation()
			}, false)

			document.querySelector('#pad').addEventListener('drop', function (event) {
				event.preventDefault()
				event.stopPropagation()
				if (event.dataTransfer.files && event.dataTransfer.files[0]) {
					let indexColonne = 0
					if (this.pad.affichage === 'colonnes') {
						this.pad.colonnes.forEach(function (colonne, index) {
							if (document.querySelector('#colonne' + index).contains(event.target) === true) {
								indexColonne = index
							}
						})
					}
					this.ouvrirModaleBloc('creation', '', indexColonne)
					this.ajouterFichier(event.dataTransfer)
				}
			}.bind(this), false)
		}.bind(this))
	},
	beforeDestroy () {
		this.panneaux.forEach(function (panneau) {
			panneau.close()
		})
		this.panneaux = []
		document.removeEventListener('mousedown', this.surlignerBloc, false)
		window.removeEventListener('beforeunload', this.quitterPage, false)
		window.removeEventListener('resize', this.redimensionner, false)
		window.removeEventListener('message', this.ecouterMessage, false)
	},
	methods: {
		allerAccueil () {
			if (this.statut === 'invite' || this.statut === 'auteur') {
				this.quitterPage()
				this.$router.push('/')
			}
		},
		allerCompte () {
			this.quitterPage()
			this.$router.push('/u/' + this.identifiant)
		},
		ecouterMessage (event) {
			if (this.source === 'digiplay') {
				this.vignette = event.data
				this.vignetteDefaut = event.data
			}
		},
		gererRecherche () {
			if (this.action !== 'organiser') {
				this.recherche = !this.recherche
			}
		},
		definirFond (fond) {
			if (fond.substring(0, 1) === '#') {
				return { backgroundColor: fond }
			} else {
				return { backgroundImage: 'url(' + fond + ')' }
			}
		},
		definirUtilisateurs (donnees) {
			let utilisateurs = []
			const autresUtilisateurs = []
			donnees.forEach(function (utilisateur) {
				if (utilisateur.identifiant === this.identifiant && utilisateurs.length === 0) {
					utilisateurs.push(utilisateur)
					this.couleur = utilisateur.couleur
				} else if (utilisateur.identifiant !== this.identifiant) {
					autresUtilisateurs.push(utilisateur)
				}
			}.bind(this))
			utilisateurs = utilisateurs.concat(autresUtilisateurs)
			this.utilisateurs = utilisateurs
		},
		definirNom (donnees) {
			if (donnees.nom === '') {
				return donnees.identifiant
			} else {
				return donnees.nom
			}
		},
		definirColonnes (blocs) {
			const colonnes = []
			if (this.pad.colonnes && this.pad.colonnes.length > 0) {
				this.pad.colonnes.forEach(function () {
					colonnes.push([])
				})
				blocs.forEach(function (bloc, index) {
					if (bloc.colonne !== undefined) {
						colonnes[bloc.colonne].push(bloc)
					} else {
						blocs[index].colonne = 0
						colonnes[bloc.colonne].push(bloc)
					}
				})
			} else {
				this.pad.colonnes.push(this.$t('colonneSansTitre'))
				colonnes.push([])
				blocs.forEach(function (bloc, index) {
					blocs[index].colonne = 0
					colonnes[0].push(bloc)
				})
			}
			this.blocs = blocs
			this.colonnes = colonnes
		},
		definirVignette (item) {
			let vignette
			if (item.vignette && item.vignette !== '') {
				vignette = item.vignette
			} else {
				switch (item.type) {
				case 'audio':
					vignette = '/img/audio.png'
					break
				case 'video':
					vignette = '/img/video.png'
					break
				case 'pdf':
					vignette = '/' + this.definirDossierFichiers(this.pad.id) + '/' + this.pad.id + '/' + item.fichier.replace(/\.[^/.]+$/, '') + '.jpg'
					break
				case 'document':
					vignette = '/img/document.png'
					break
				case 'office':
					vignette = '/img/office.png'
					break
				case 'lien':
					vignette = '/img/lien.png'
					break
				case 'embed':
					if (item.source === 'peertube') {
						vignette = item.media.replace('/videos/watch/', '/static/thumbnails/') + '.jpg'
					} else if (item.source === 'h5p') {
						vignette = '/img/h5p.png'
					} else if (item.source === 'digiplay') {
						vignette = '/img/digiplay.png'
					} else if (item.source === 'youtube') {
						vignette = '/img/youtube.png'
					} else if (item.source === 'vimeo') {
						vignette = '/img/vimeo.png'
					} else if (item.source === 'dailymotion') {
						vignette = '/img/dailymotion.png'
					} else if (item.source === 'slideshare') {
						vignette = '/img/slideshare.png'
					} else if (item.source === 'flickr') {
						vignette = '/img/flickr.png'
					} else if (item.source === 'soundcloud') {
						vignette = '/img/soundcloud.png'
					} else if (item.source === 'twitter') {
						vignette = '/img/twitter.png'
					} else if (item.source === 'etherpad') {
						vignette = '/img/etherpad.png'
					} else if (item.media.includes('facebook.com')) {
						vignette = '/img/facebook.png'
					} else if (item.media.includes('vocaroo.com') || item.media.includes('voca.ro')) {
						vignette = '/img/vocaroo.png'
					} else if (item.media.includes('drive.google.com')) {
						vignette = '/img/google-drive.png'
					} else if (item.media.includes('docs.google.com/document')) {
						vignette = '/img/google-docs.png'
					} else if (item.media.includes('docs.google.com/presentation')) {
						vignette = '/img/google-slides.png'
					} else if (item.media.includes('docs.google.com/spreadsheets')) {
						vignette = '/img/google-sheets.png'
					} else if (item.media.includes('docs.google.com/forms')) {
						vignette = '/img/google-forms.png'
					} else if (item.media.includes('docs.google.com/drawings')) {
						vignette = '/img/google-drawings.png'
					} else if (item.media.includes('google.com/maps')) {
						vignette = '/img/google-maps.png'
					} else if (item.media.includes('wikipedia.org')) {
						vignette = '/img/wikipedia.png'
					} else if (item.media.includes('quizlet.com')) {
						vignette = '/img/quizlet.png'
					} else if (item.media.includes('genial.ly')) {
						vignette = '/img/genially.png'
					} else if (item.media.includes('ladigitale.dev/digitools/')) {
						vignette = '/img/digitools.png'
					} else if (item.media.includes('framapad.org')) {
						vignette = '/img/framapad.png'
					} else {
						vignette = '/img/code.png'
					}
					break
				default:
					vignette = '/img/telechargement.png'
					break
				}
			}
			return vignette
		},
		definirIconeMedia (item) {
			let icone
			switch (item.type) {
			case 'image':
			case 'lien-image':
				icone = 'image'
				break
			case 'audio':
				icone = 'volume_up'
				break
			case 'video':
				icone = 'movie'
				break
			case 'pdf':
			case 'document':
			case 'office':
				icone = 'description'
				break
			case 'lien':
				icone = 'link'
				break
			case 'embed':
				if (item.source === 'youtube' || item.source === 'vimeo' || item.source === 'dailymotion' || item.source === 'digiplay') {
					icone = 'movie'
				} else if (item.source === 'slideshare' || item.media.includes('wikipedia.org') || item.media.includes('drive.google.com') || item.media.includes('docs.google.com')) {
					icone = 'description'
				} else if (item.source === 'flickr') {
					icone = 'image'
				} else if (item.source === 'soundcloud' || item.media.includes('vocaroo.com') || item.media.includes('voca.ro')) {
					icone = 'volume_up'
				} else if (item.media.includes('google.com/maps')) {
					icone = 'place'
				} else if (item.source === 'etherpad' || item.media.includes('framapad.org')) {
					icone = 'group_work'
				} else {
					icone = 'web'
				}
				break
			default:
				icone = 'save_alt'
				break
			}
			return icone
		},
		definirDescription (item) {
			if (item.hasOwnProperty('modifie')) {
				return this.$t('creeeLe') + ' ' + this.$formaterDate(item.date, this.langue) + ' ' + this.$t('par') + ' ' + this.definirNom(item) + '. ' + this.$t('modifieeLe') + ' ' + this.$formaterDate(item.modifie, this.langue) + '.'
			} else {
				return this.$t('creeeLe') + ' ' + this.$formaterDate(item.date, this.langue) + ' ' + this.$t('par') + ' ' + this.definirNom(item) + '.'
			}
		},
		ouvrirModaleColonne (type, index) {
			if (type === 'edition') {
				this.colonne = index
				this.titreModaleColonne = this.$t('modifierColonne')
				this.titreColonne = this.pad.colonnes[index]
			} else {
				this.titreModaleColonne = this.$t('ajouterColonne')
			}
			this.modeColonne = type
			this.modaleColonne = true
			this.$nextTick(function () {
				document.querySelector('#champ-nom-colonne').focus()
			})
		},
		ajouterColonne () {
			if (this.titreColonne !== '') {
				this.chargement = true
				this.$socket.emit('ajoutercolonne', this.pad.id, this.titreColonne, this.pad.colonnes, this.couleur, this.identifiant, this.nom)
				this.fermerModaleColonne()
			}
		},
		modifierColonne () {
			if (this.titreColonne !== '') {
				this.chargement = true
				this.$socket.emit('modifiercolonne', this.pad.id, this.titreColonne, this.colonne, this.identifiant)
				this.fermerModaleColonne()
			}
		},
		afficherSupprimerColonne (index) {
			this.colonne = index
			this.titreColonne = this.pad.colonnes[index]
			this.messageConfirmation = this.$t('confirmationSupprimerColonne')
			this.typeConfirmation = 'supprimer-colonne'
			this.modaleConfirmer = true
		},
		supprimerColonne () {
			this.modaleConfirmer = false
			this.chargement = true
			this.$socket.emit('supprimercolonne', this.pad.id, this.titreColonne, this.colonne, this.couleur, this.identifiant, this.nom)
			this.fermerModaleColonne()
		},
		fermerModaleColonne () {
			this.modaleColonne = false
			this.titreModaleColonne = ''
			this.titreColonne = ''
			this.modeColonne = ''
			this.colonne = 0
		},
		deplacerColonne (direction, colonne) {
			this.chargement = true
			this.$socket.emit('deplacercolonne', this.pad.id, this.pad.colonnes[colonne], direction, colonne, this.couleur, this.identifiant, this.nom)
		},
		ouvrirModaleBloc (mode, item, colonne) {
			this.mode = mode
			if (mode === 'creation') {
				this.titreModale = this.$t('ajouterCapsule')
			} else {
				this.$socket.emit('verifiermodifierbloc', this.pad.id, item.bloc, this.identifiant)
				this.titreModale = this.$t('modifierCapsule')
				this.donneesBloc = item
				this.bloc = item.bloc
				this.titre = item.titre
				this.texte = item.texte
				this.media = item.media
				this.iframe = item.iframe
				this.type = item.type
				this.source = item.source
				if (item.vignette && item.vignette !== '') {
					this.vignette = item.vignette
					this.vignetteDefaut = this.vignette
				} else if (item.type !== 'image' && (!item.vignette || item.vignette === '')) {
					this.vignette = this.definirVignette(item)
					this.vignetteDefaut = this.vignette
				}
				if (item.hasOwnProperty('visibilite') && item.visibilite === 'privee') {
					this.visibilite = true
				} else {
					this.visibilite = false
				}
			}
			if (this.pad.affichage === 'colonnes') {
				this.colonne = colonne
			}
			this.menuActivite = false
			this.menuChat = false
			this.menuOptions = false
			this.modaleBloc = true
			this.$nextTick(function () {
				if (mode === 'creation') {
					document.querySelector('#champ-titre').focus()
				}
				const that = this
				const editeur = pell.init({
					element: document.querySelector('#texte'),
					onChange: function (html) {
						let texte = html.replace(/(<a [^>]*)(target="[^"]*")([^>]*>)/gi, '$1$3')
						texte = texte.replace(/(<a [^>]*)(>)/gi, '$1 target="_blank"$2')
						texte = linkifyHtml(texte, {
							defaultProtocol: 'https',
							target: '_blank'
						})
						this.texte = texte
					}.bind(this),
					actions: [
						{ name: 'gras', title: that.$t('gras'), icon: '<i class="material-icons">format_bold</i>', result: () => pell.exec('bold') },
						{ name: 'italique', title: that.$t('italique'), icon: '<i class="material-icons">format_italic</i>', result: () => pell.exec('italic') },
						{ name: 'souligne', title: that.$t('souligne'), icon: '<i class="material-icons">format_underlined</i>', result: () => pell.exec('underline') },
						{ name: 'barre', title: that.$t('barre'), icon: '<i class="material-icons">format_strikethrough</i>', result: () => pell.exec('strikethrough') },
						{ name: 'listeordonnee', title: that.$t('listeOrdonnee'), icon: '<i class="material-icons">format_list_numbered</i>', result: () => pell.exec('insertOrderedList') },
						{ name: 'liste', title: that.$t('liste'), icon: '<i class="material-icons">format_list_bulleted</i>', result: () => pell.exec('insertUnorderedList') },
						{ name: 'couleur', title: that.$t('couleurTexte'), icon: '<label for="couleur-texte"><i class="material-icons">format_color_text</i></label><input id="couleur-texte" type="color">', result: () => undefined },
						{ name: 'lien', title: that.$t('lien'), icon: '<i class="material-icons">link</i>', result: () => { const url = window.prompt(that.$t('adresseLien')); if (url) { pell.exec('createLink', url) } } }
					],
					classes: { actionbar: 'boutons-editeur', button: 'bouton-editeur', content: 'contenu-editeur', selected: 'bouton-actif' }
				})
				editeur.content.innerHTML = this.texte
				editeur.onpaste = function (event) {
					event.preventDefault()
					event.stopPropagation()
					const texte = event.clipboardData.getData('text/plain')
					pell.exec('insertText', texte)
				}
				document.querySelector('#texte .contenu-editeur').addEventListener('focus', function () {
					document.querySelector('#texte').classList.add('focus')
				})
				document.querySelector('#texte .contenu-editeur').addEventListener('blur', function () {
					document.querySelector('#texte').classList.remove('focus')
				})
				document.querySelector('#couleur-texte').addEventListener('change', this.modifierCouleurTexte)
			}.bind(this))
		},
		modifierCouleurTexte (event) {
			pell.exec('foreColor', event.target.value)
		},
		modifierCouleurCommentaire (event) {
			pell.exec('foreColor', event.target.value)
		},
		modifierCouleurCommentaireModifie (event) {
			pell.exec('foreColor', event.target.value)
		},
		ajouterFichier (champ) {
			const formats = ['jpg', 'jpeg', 'png', 'gif', 'mp4', 'm4v', 'mp3', 'm4a', 'ogg', 'wav', 'pdf', 'ppt', 'pptx', 'odp', 'doc', 'docx', 'odt', 'ods', 'odg', 'xls', 'xlsx', 'flipchart', 'notebook', 'ubz', 'ipynb', 'dgs', 'dgc', 'dgb', 'sb3', 'epub', 'sprite3', 'pages', 'numbers', 'keynote', 'csv', 'python', 'ltp']
			const extension = champ.files[0].name.substring(champ.files[0].name.lastIndexOf('.') + 1).toLowerCase()
			if (champ.files && champ.files[0] && formats.includes(extension) && champ.files[0].size < this.limite * 1024000) {
				const fichier = champ.files[0]
				const formulaire = new FormData()
				formulaire.append('pad', this.pad.id)
				formulaire.append('fichier', fichier)
				axios.post(this.hote + '/api/televerser-fichier', formulaire, {
					headers: {
						'Content-Type': 'multipart/form-data'
					},
					onUploadProgress: function (progression) {
						const pourcentage = parseInt(Math.round((progression.loaded * 100) / progression.total))
						this.progressionFichier = pourcentage
					}.bind(this)
				}).then(function (reponse) {
					const donnees = reponse.data
					if (donnees === 'non_connecte') {
						this.$router.push('/')
					} else if (donnees === 'erreur_televersement') {
						champ.value = ''
						this.progressionFichier = 0
						this.$store.dispatch('modifierAlerte', this.$t('erreurTeleversementFichier'))
					} else {
						this.chargementMedia = true
						this.media = donnees.fichier
						this.type = donnees.mimetype.split('/')[0]
						donnees.type = this.type
						const vignette = this.definirVignette(donnees)
						if (this.type !== 'image') {
							this.vignette = vignette
							this.vignetteDefaut = vignette
						}
						if (this.mode === 'edition') {
							this.fichiers.push(donnees.fichier)
							if (vignette !== '' && vignette.substring(1, this.definirDossierFichiers(this.pad.id).length + 1) === this.definirDossierFichiers(this.pad.id)) {
								this.vignettes.push(vignette)
							}
						}
						switch (this.type) {
						case 'image':
							this.$nextTick(function () {
								imagesLoaded('#media', function () {
									this.chargementMedia = false
								}.bind(this))
							}.bind(this))
							break
						case 'video':
							this.$nextTick(function () {
								const video = document.querySelector('#video')
								video.addEventListener('loadedmetadata', function () {
									imagesLoaded('#vignette', function () {
										this.chargementMedia = false
									}.bind(this))
								}.bind(this))
							}.bind(this))
							break
						case 'audio':
							this.$nextTick(function () {
								const audio = document.querySelector('#audio')
								audio.addEventListener('loadedmetadata', function () {
									imagesLoaded('#vignette', function () {
										this.chargementMedia = false
									}.bind(this))
								}.bind(this))
							}.bind(this))
							break
						case 'pdf':
						case 'document':
						case 'office':
							this.$nextTick(function () {
								const iframe = document.querySelector('#document')
								iframe.addEventListener('load', function () {
									imagesLoaded('#vignette', function () {
										this.chargementMedia = false
									}.bind(this))
								}.bind(this))
							}.bind(this))
							break
						default:
							this.chargementMedia = false
						}
					}
					this.progressionFichier = 0
					champ.value = ''
				}.bind(this)).catch(function () {
					champ.value = ''
					this.progressionFichier = 0
					this.$store.dispatch('modifierAlerte', this.$t('erreurCommunicationServeur'))
				}.bind(this))
			} else {
				if (formats.includes(extension) === false) {
					this.$store.dispatch('modifierAlerte', this.$t('formatFichierPasAccepte'))
				} else if (champ.files[0].size > this.limite * 1024000) {
					this.$store.dispatch('modifierAlerte', this.$t('tailleMaximale', { taille: this.limite }))
				}
				champ.value = ''
			}
		},
		definirExtensionFichier (fichier) {
			return fichier.substring(fichier.lastIndexOf('.') + 1)
		},
		definirNomFichier (fichier) {
			return fichier.substring(0, fichier.lastIndexOf('.'))
		},
		supprimerFichier () {
			if (this.mode === 'creation') {
				if (this.verifierURL(this.media) === false) {
					this.$socket.emit('supprimerfichier', { pad: this.pad.id, fichier: this.media, vignette: this.vignette })
				}
			} else if (this.mode === 'edition') {
				if (this.verifierURL(this.media) === false) {
					this.fichiers.push(this.media)
				}
				if (this.vignette !== '' && this.vignette.substring(1, this.definirDossierFichiers(this.pad.id).length + 1) === this.definirDossierFichiers(this.pad.id)) {
					this.vignettes.push(this.vignette)
				}
			}
			if (this.verifierURL(this.media) === true && this.media.includes(this.etherpad)) {
				const etherpadId = this.media.replace(this.etherpad + '/p/', '')
				const url = this.etherpad + '/api/1/deletePad?apikey=' + this.etherpadApi + '&padID=' + etherpadId
				axios.get(url)
			}
			this.media = ''
			this.lien = ''
			this.type = ''
			this.vignette = ''
			this.vignetteDefaut = ''
			this.resultats = {}
		},
		ajouterLien () {
			if (this.lien !== '') {
				const regex = /<iframe(.+)<\/iframe>/g
				if (regex.test(this.lien) === true) {
					this.lien = this.lien.match(/<iframe [^>]*src="[^"]*"[^>]*>/g).map(x => x.replace(/.*src="([^"]*)".*/, '$1'))[0]
				}
				if (this.verifierURL(this.lien) === true && this.lien.match(/\.(jpeg|jpg|gif|png)$/) === null) {
					this.chargementLien = true
					axios.get('https://noembed.com/embed?url=' + this.lien).then(function (reponse) {
						let donnees = reponse.data
						if (donnees.hasOwnProperty('error')) {
							this.iframe = this.lien
							this.$nextTick(function () {
								this.media = this.lien
								this.source = 'web'
								if (this.lien.includes('tube.ac-lyon.fr')) {
									this.source = 'peertube'
								} else if (this.lien.includes('ladigitale.dev/digiquiz/')) {
									this.source = 'h5p'
								} else if (this.lien.includes('ladigitale.dev/digiplay/')) {
									this.source = 'digiplay'
								}
								this.type = 'embed'
								donnees = {}
								donnees.media = this.media
								donnees.source = this.source
								donnees.type = this.type
								if (this.source === 'web' && !this.media.includes('facebook.com') && !this.media.includes('vocaroo.com') && !this.media.includes('drive.google.com') && !this.media.includes('docs.google.com') && !this.media.includes('google.com/maps') && !this.media.includes('wikipedia.org') && !this.media.includes('genial.ly') && !this.media.includes('ladigitale.dev/digitools/') && !this.media.includes('framapad.org')) {
									this.chargementLien = false
									this.chargementVignette = true
									let domaine = new URL(this.lien)
									domaine = domaine.hostname
									const xhr = new XMLHttpRequest()
									xhr.onload = function () {
										if (xhr.readyState === xhr.DONE && xhr.status === 200) {
											const reponse = xhr.responseText
											if (reponse !== '') {
												this.chargementVignette = false
												this.vignette = 'https://ladigitale.dev/favicons' + reponse.substring(1)
												this.vignetteDefaut = 'https://ladigitale.dev/favicons' + reponse.substring(1)
												this.$nextTick(function () {
													const vignette = document.querySelector('#vignette img')
													vignette.onerror = function() {
														this.vignette = this.definirVignette(donnees)
														this.vignetteDefaut = this.definirVignette(donnees)
													}.bind(this)
												}.bind(this))
											} else {
												this.vignette = this.definirVignette(donnees)
												this.vignetteDefaut = this.definirVignette(donnees)
												this.chargementVignette = false
											}
										} else {
											this.vignette = this.definirVignette(donnees)
											this.vignetteDefaut = this.definirVignette(donnees)
											this.chargementVignette = false
										}
									}.bind(this)
									xhr.open('POST', 'https://ladigitale.dev/favicons/recuperer_icone.php', true)
									xhr.setRequestHeader('Content-type', 'application/x-www-form-urlencoded')
									xhr.send('lien=' + domaine)
									xhr.onerror = function () {
										this.vignette = this.definirVignette(donnees)
										this.vignetteDefaut = this.definirVignette(donnees)
										this.chargementVignette = false
									}.bind(this)
								} else {
									this.vignette = this.definirVignette(donnees)
									this.vignetteDefaut = this.definirVignette(donnees)
									this.chargementLien = false
								}
							}.bind(this))
						} else {
							if (donnees.provider_name.toLowerCase() === 'learningapps.org') {
								donnees.html = donnees.html.replace('http://LearningApps.org', 'https://learningapps.org')
							}
							if (regex.test(donnees.html) === true) {
								this.iframe = donnees.html.match(/<iframe [^>]*src="[^"]*"[^>]*>/g).map(x => x.replace(/.*src="([^"]*)".*/, '$1'))[0]
							} else {
								this.iframe = donnees.html
							}
							this.media = this.lien
							this.source = donnees.provider_name.toLowerCase()
							this.type = 'embed'
							if (donnees.thumbnail_url && donnees.thumbnail_url !== '') {
								this.vignette = donnees.thumbnail_url
								this.vignetteDefaut = donnees.thumbnail_url
							} else {
								donnees.media = this.media
								donnees.source = this.source
								donnees.type = this.type
								this.vignette = this.definirVignette(donnees)
								this.vignetteDefaut = this.definirVignette(donnees)
							}
							this.chargementLien = false
						}
					}.bind(this)).catch(function () {
						this.chargementLien = false
						this.lien = ''
						this.$store.dispatch('modifierAlerte', this.$t('erreurRecuperationContenu'))
					}.bind(this))
				} else if (this.verifierURL(this.lien) === true && this.lien.match(/\.(jpeg|jpg|gif|png)$/) !== null) {
					this.chargementMedia = true
					this.media = this.lien
					this.type = 'lien-image'
					this.$nextTick(function () {
						imagesLoaded('#media', function () {
							this.chargementMedia = false
						}.bind(this))
					}.bind(this))
				} else {
					this.rechercherImage(1)
				}
			}
		},
		rechercherImage (page) {
			if (this.lien !== '') {
				this.chargementLien = true
				const requete = this.lien.replace(/\s+/g, '+')
				if (page === 1) {
					this.page = page
				}
				axios.get('https://pixabay.com/api/?key=17995783-8722cfb0d46adc88b39d0bb64&q=' + requete + '&image_type=photo&lang=' + this.langue + '&orientation=horizontal&safesearch=true&per_page=16&page=' + page).then(function (reponse) {
					this.chargementLien = false
					const donnees = reponse.data
					if (donnees && donnees.total > 0) {
						this.resultats = donnees
						this.$nextTick(function () {
							// eslint-disable-next-line
							new flexImages({ selector: '#resultats', rowHeight: 60 })
						})
					}
				}.bind(this)).catch(function () {
					this.chargementLien = false
					this.lien = ''
					this.$store.dispatch('modifierAlerte', this.$t('erreurRecuperationContenu'))
				}.bind(this))
			}
		},
		modifierPage (type) {
			if (type === 'suivante' && this.page < (this.resultats.total / 12)) {
				this.page++
			} else if (type === 'precedente' && this.page > 1) {
				this.page--
			}
		},
		selectionnerImage (image) {
			this.chargementMedia = true
			this.media = image
			this.type = 'lien-image'
			this.$nextTick(function () {
				imagesLoaded('#media', function () {
					this.chargementMedia = false
				}.bind(this))
			}.bind(this))
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
		convertirEnLien () {
			this.iframe = ''
			this.media = this.lien
			this.source = 'web'
			this.type = 'lien'
		},
		supprimerLien () {
			if (this.iframe.includes(this.etherpad)) {
				const etherpadId = this.iframe.replace(this.etherpad + '/p/', '')
				const url = this.etherpad + '/api/1/deletePad?apikey=' + this.etherpadApi + '&padID=' + etherpadId
				axios.get(url)
			}
			if (this.mode === 'creation' && this.vignette !== '' && this.vignette.substring(1, this.definirDossierFichiers(this.pad.id).length + 1) === this.definirDossierFichiers(this.pad.id)) {
				this.$socket.emit('supprimerfichier', { pad: this.pad.id, fichier: this.media, vignette: this.vignette })
			} else if (this.mode === 'edition' && this.vignette !== '' && this.vignette.substring(1, this.definirDossierFichiers(this.pad.id).length + 1) === this.definirDossierFichiers(this.pad.id)) {
				this.vignettes.push(this.vignette)
			}
			this.media = ''
			this.lien = ''
			this.iframe = ''
			this.type = ''
			this.source = ''
			this.vignette = ''
			this.vignetteDefaut = ''
			this.resultats = {}
			this.chargementVignette = false
		},
		ajouterDocument () {
			this.chargementLien = true
			this.lien = this.etherpad + '/p/pad-' + this.pad.id + '-' + Math.random().toString(16).slice(2)
			this.iframe = this.lien
			this.$nextTick(function () {
				this.media = this.lien
				this.source = 'etherpad'
				this.type = 'embed'
				const donnees = {}
				donnees.media = this.media
				donnees.source = this.source
				donnees.type = this.type
				this.vignette = this.definirVignette(donnees)
				this.vignetteDefaut = this.definirVignette(donnees)
				this.chargementLien = false
			}.bind(this))
		},
		ajouterVignette () {
			const champ = document.querySelector('#televerser-vignette')
			const formats = ['jpg', 'jpeg', 'png', 'gif']
			const extension = champ.files[0].name.substring(champ.files[0].name.lastIndexOf('.') + 1).toLowerCase()
			if (champ.files && champ.files[0] && formats.includes(extension) && champ.files[0].size < 3072000) {
				const fichier = champ.files[0]
				const formulaire = new FormData()
				formulaire.append('pad', this.pad.id)
				formulaire.append('fichier', fichier)
				axios.post(this.hote + '/api/televerser-vignette', formulaire, {
					headers: {
						'Content-Type': 'multipart/form-data'
					},
					onUploadProgress: function (progression) {
						const pourcentage = parseInt(Math.round((progression.loaded * 100) / progression.total))
						this.progressionVignette = pourcentage
					}.bind(this)
				}).then(function (reponse) {
					if (this.mode === 'creation' && this.vignette !== '' && this.vignette.substring(1, this.definirDossierFichiers(this.pad.id).length + 1) === this.definirDossierFichiers(this.pad.id)) {
						this.$socket.emit('supprimervignette', { pad: this.pad, vignette: this.vignette })
					} else if (this.mode === 'edition' && this.vignette !== '' && this.vignette.substring(1, this.definirDossierFichiers(this.pad.id).length + 1) === this.definirDossierFichiers(this.pad.id)) {
						this.vignettes.push(this.vignette)
					}
					const donnees = reponse.data
					if (donnees === 'non_connecte') {
						this.$router.push('/')
					} else if (donnees === 'erreur_televersement') {
						champ.value = ''
						this.progressionFichier = 0
						this.$store.dispatch('modifierAlerte', this.$t('erreurTeleversementVignette'))
					} else {
						this.vignette = donnees
						this.$nextTick(function () {
							imagesLoaded('#vignette', function () {
								this.progressionVignette = 0
								this.$nextTick(function () {
									const modaleBloc = document.querySelector('#bloc')
									modaleBloc.scrollTop = modaleBloc.scrollHeight
								})
							}.bind(this))
						}.bind(this))
					}
					champ.value = ''
				}.bind(this)).catch(function () {
					champ.value = ''
					this.progressionVignette = 0
					this.$store.dispatch('modifierAlerte', this.$t('erreurCommunicationServeur'))
				}.bind(this))
			} else {
				if (formats.includes(extension) === false) {
					this.$store.dispatch('modifierAlerte', this.$t('formatFichierPasAccepte'))
				} else if (champ.files[0].size > 3072000) {
					this.$store.dispatch('modifierAlerte', this.$t('tailleMaximale', { taille: 3 }))
				}
				champ.value = ''
			}
		},
		remettreVignetteDefaut () {
			const vignette = this.vignette
			this.vignette = this.vignetteDefaut
			if (vignette.substring(1, this.definirDossierFichiers(this.pad.id).length + 1) === this.definirDossierFichiers(this.pad.id)) {
				this.$socket.emit('supprimervignette', { pad: this.pad, vignette: vignette })
			}
			this.vignettes.forEach(function (item, index) {
				if (item === this.vignetteDefaut) {
					this.vignettes.splice(index, 1)
				}
			}.bind(this))
		},
		modifierVisibiliteCapsule () {
			this.visibilite = !this.visibilite
		},
		ajouterBloc () {
			this.bloc = 'bloc-id-' + (new Date()).getTime() + Math.random().toString(16).slice(10)
			if (this.titre !== '' || this.texte !== '' || this.media !== '') {
				this.chargement = true
				this.$socket.emit('ajouterbloc', this.bloc, this.pad.id, this.pad.token, this.titre, this.texte, this.media, this.iframe, this.type, this.source, this.vignette, this.couleur, this.colonne, this.visibilite, this.identifiant, this.nom)
				this.modaleBloc = false
			}
		},
		modifierBloc () {
			if (this.titre !== '' || this.texte !== '' || this.media !== '') {
				this.chargement = true
				this.$socket.emit('modifierbloc', this.bloc, this.pad.id, this.pad.token, this.titre, this.texte, this.media, this.iframe, this.type, this.source, this.vignette, this.couleur, this.colonne, this.visibilite, this.identifiant, this.nom)
				this.modaleBloc = false
			}
		},
		autoriserBloc (bloc, moderation) {
			this.chargement = true
			this.$socket.emit('autoriserbloc', this.pad.id, this.pad.token, bloc, moderation, this.identifiant)
		},
		fermerModaleBloc () {
			this.modaleBloc = false
			this.mode = ''
			this.action = ''
			this.titreModale = ''
			this.colonne = 0
			this.bloc = ''
			this.titre = ''
			this.texte = ''
			this.iframe = ''
			this.vignette = ''
			this.vignetteDefaut = ''
			this.type = ''
			this.source = ''
			this.media = ''
			this.lien = ''
			this.progressionFichier = 0
			this.progressionVignette = 0
			this.chargementLien = false
			this.chargementMedia = false
			this.chargementVignette = false
			this.fichiers = []
			this.vignettes = []
			this.resultats = {}
			this.visibilite = false
			this.donneesBloc = {}
		},
		fermerModaleBlocSansEnregistrement () {
			this.modaleBloc = false
			this.titreModale = ''
			if (this.mode === 'creation' && this.media !== '' && this.lien === '') {
				this.$socket.emit('supprimerfichier', { pad: this.pad.id, fichier: this.media, vignette: this.vignette })
			} else if (this.mode === 'edition') {
				this.fichiers.forEach(function (item, index) {
					if (Object.keys(this.donneesBloc).length > 0 && this.donneesBloc.hasOwnProperty('media') && item === this.donneesBloc.media) {
						this.fichiers.splice(index, 1)
					}
				}.bind(this))
				if (this.fichiers.length > 0) {
					this.$socket.emit('supprimerfichiers', { pad: this.pad.id, fichiers: this.fichiers })
				}
				this.vignettes.forEach(function (item, index) {
					if (Object.keys(this.donneesBloc).length > 0 && this.donneesBloc.hasOwnProperty('vignette') && item === this.donneesBloc.vignette) {
						this.vignettes.splice(index, 1)
					}
				}.bind(this))
				if (this.vignette !== this.vignetteDefaut && this.vignette.substring(1, this.definirDossierFichiers(this.pad.id).length + 1) === this.definirDossierFichiers(this.pad.id)) {
					this.vignettes.push(this.vignette)
				}
				if (this.vignettes.length > 0) {
					this.$socket.emit('supprimervignettes', { pad: this.pad, vignettes: this.vignettes })
				}
			}
			this.fermerModaleBloc()
		},
		afficherSupprimerBloc (bloc, titre, colonne) {
			this.bloc = bloc
			this.titre = titre
			this.colonne = colonne
			this.messageConfirmation = this.$t('confirmationSupprimerCapsule')
			this.typeConfirmation = 'supprimer-bloc'
			this.modaleConfirmer = true
		},
		supprimerBloc () {
			this.modaleConfirmer = false
			this.chargement = true
			this.$socket.emit('supprimerbloc', this.bloc, this.pad.id, this.pad.token, this.titre, this.couleur, this.colonne, this.identifiant, this.nom)
		},
		fermerModaleConfirmer () {
			this.modaleConfirmer = false
			this.commentaireId = ''
			this.titre = ''
			this.messageConfirmation = ''
			this.typeConfirmation = ''
		},
		afficherVisionneuse (item) {
			if (this.panneaux.map(function (e) { return e.id }).includes('panneau_' + item.bloc) === false) {
				const imageId = 'image-' + (new Date()).getTime()
				let html
				switch (item.type) {
				case 'image':
					html = '<span id="' + imageId + '" class="image"><img src="/' + this.definirDossierFichiers(this.pad.id) + '/' + this.pad.id + '/' + item.media + '"></span>'
					break
				case 'lien-image':
					html = '<span id="' + imageId + '" class="image"><img src="' + item.media + '"></span>'
					break
				case 'audio':
					html = '<audio controls preload="metadata" src="/' + this.definirDossierFichiers(this.pad.id) + '/' + this.pad.id + '/' + item.media + '"></audio>'
					break
				case 'video':
					html = '<video controls playsinline crossOrigin="anonymous" src="/' + this.definirDossierFichiers(this.pad.id) + '/' + this.pad.id + '/' + item.media + '"></video>'
					break
				case 'pdf':
					html = '<iframe src="/pdfjs/web/viewer.html?file=../../' + this.definirDossierFichiers(this.pad.id) + '/' + this.pad.id + '/' + item.media + '" allowfullscreen></iframe>'
					break
				case 'document':
				case 'office':
					html = '<iframe src="https://view.officeapps.live.com/op/embed.aspx?src=' + this.hote + '/' + this.definirDossierFichiers(this.pad.id) + '/' + this.pad.id + '/' + item.media + '" allowfullscreen></iframe>'
					break
				case 'embed':
					if (item.source === 'etherpad') {
						html = '<iframe src="' + item.media + '?userName=' + this.nom + '&userColor=' + this.couleur + '" allowfullscreen></iframe>'
					} else if (this.verifierURL(item.iframe) === true) {
						html = '<iframe src="' + item.iframe + '" allowfullscreen></iframe>'
					} else {
						html = '<div class="html">' + item.iframe + '</div>'
					}
					break
				}
				this.$nextTick(function () {
					const that = this
					let largeurPanneau = '308px'
					let hauteurPanneau = '300px'
					if (document.querySelector('#page').offsetWidth > 580 && document.querySelector('#page').offsetHeight > 580) {
						largeurPanneau = '508px'
						hauteurPanneau = '500px'
					}
					const snapOptions = this.definirOptionsSnap()
					// eslint-disable-next-line no-undef
					const panneau = jsPanel.create({
						id: 'panneau_' + item.bloc,
						animateIn: 'jsPanelFadeIn',
						animateOut: 'jsPanelFadeOut',
						iconfont: 'material-icons',
						closeOnEscape: true,
						border: '4px solid ' + item.couleur,
						headerTitle: item.titre,
						position: 'center',
						maximizedMargin: 0,
						syncMargins: true,
						resizeit: {
							minWidth: 200,
							minHeight: 150
						},
						panelSize: {
							width: largeurPanneau,
							height: hauteurPanneau
						},
						content: html,
						callback: function (panel) {
							panel.setControlStatus('normalize', 'hide')
							panel.setControlStatus('minimize', 'remove')
							document.querySelector('#masque').classList.add('ouvert')
							if (item.type === 'image' || item.type === 'lien-image') {
								document.querySelector('#' + imageId + ' img').style.maxHeight = document.querySelector('#' + panel.id + ' .jsPanel-content').clientHeight + 'px'
								const image = document.querySelector('#' + imageId)
								// eslint-disable-next-line no-undef
								const panzoom = Panzoom(image, {
									maxScale: 10,
									minScale: 0.5,
									panOnlyWhenZoomed: true
								})
								image.parentElement.addEventListener('wheel', panzoom.zoomWithWheel)
								panel.addControl({
									html: '<span class="material-icons">adjust</span>',
									name: 'dezoom',
									handler: function () {
										document.querySelector('#' + imageId + ' img').style.maxHeight = document.querySelector('#' + panel.id + ' .jsPanel-content').clientHeight + 'px'
										panzoom.reset()
									}
								})
							} else if (item.type === 'audio') {
								panel.resize({
									width: largeurPanneau,
									height: '150px'
								}).reposition()
							} else if (item.type === 'embed') {
								panel.addControl({
									html: '<span class="material-icons lien">link</span>',
									name: 'copier-lien',
									handler: function () {
										let lien
										if (item.source === 'etherpad') {
											lien = item.media
										} else if (that.verifierURL(item.iframe) === true) {
											lien = item.iframe
										} else {
											lien = item.iframe.match(/<iframe [^>]*src="[^"]*"[^>]*>/g).map(x => x.replace(/.*src="([^"]*)".*/, '$1'))[0]
										}
										const clipboardLien = new ClipboardJS('#panneau_' + item.bloc + ' .lien', {
											text: function () {
												return lien
											}
										})
										clipboardLien.on('success', function () {
											that.$store.dispatch('modifierMessage', that.$t('lienCopie'))
										})
									}
								})
							} else if (item.type === 'pdf' || item.type === 'document' || item.type === 'office') {
								panel.addControl({
									html: '<a class="material-icons telecharger" href="/' + that.definirDossierFichiers(that.pad.id) + '/' + that.pad.id + '/' + item.media + '" target="_blank">file_download</a>',
									name: 'telecharger'
								})
							}
						},
						onmaximized: function(panel) {
							if (item.type === 'image' || item.type === 'lien-image') {
								document.querySelector('#' + imageId + ' img').style.maxHeight = document.querySelector('#' + panel.id + ' .jsPanel-content').clientHeight + 'px'
							}
						},
						onbeforeclose: function (panel) {
							const panneaux = document.querySelectorAll('.jsPanel')
							if (document.querySelector('#masque') && panneaux.length === 1) {
								document.querySelector('#masque').classList.remove('ouvert')
							}
							this.panneaux.forEach(function (panneau, index) {
								if (panneau.id === panel.id) {
									this.panneaux.splice(index, 1)
								}
							}.bind(this))
							return true
						}.bind(this),
						dragit: {
							snap: snapOptions
						}
					})
					this.panneaux.push(panneau)
				}.bind(this))
			}
		},
		definirOptionsSnap () {
			let snapOptions
			if (window.innerHeight < window.innerWidth) {
				snapOptions = {
					sensitivity: 40,
					repositionOnSnap: true,
					resizeToPreSnap: true,
					snapLeftTop: function (panel) {
						panel.resize({ width: '50%', height: '100%' })
					},
					snapRightTop: function (panel) {
						panel.resize({ width: '50%', height: '100%' })
					},
					snapLeftBottom: function (panel) {
						panel.resize({ width: '50%', height: '100%' })
					},
					snapRightBottom: function (panel) {
						panel.resize({ width: '50%', height: '100%' })
					},
					snapCenterTop: false,
					snapRightCenter: false,
					snapCenterBottom: false,
					snapLeftCenter: false
				}
			} else {
				snapOptions = {
					sensitivity: 15,
					repositionOnSnap: true,
					resizeToPreSnap: true,
					snapCenterTop: function (panel) {
						panel.resize({ width: '100%', height: '50%' })
					},
					snapCenterBottom: function (panel) {
						panel.resize({ width: '100%', height: '50%' })
					},
					snapLeftTop: false,
					snapRightCenter: false,
					snapRightBottom: false,
					snapRightTop: false,
					snapLeftBottom: false,
					snapLeftCenter: false
				}
			}
			return snapOptions
		},
		activerDefilementHorizontal () {
			const pad = document.querySelector('#pad')
			pad.addEventListener('mousedown', this.defilementHorizontalDebut)
			pad.addEventListener('mouseleave', this.defilementHorizontalFin)
			pad.addEventListener('mouseup', this.defilementHorizontalFin)
			pad.addEventListener('mousemove', this.defilementHorizontalEnCours)
		},
		desactiverDefilementHorizontal () {
			const pad = document.querySelector('#pad')
			pad.removeEventListener('mousedown', this.defilementHorizontalDebut)
			pad.removeEventListener('mouseleave', this.defilementHorizontalFin)
			pad.removeEventListener('mouseup', this.defilementHorizontalFin)
			pad.removeEventListener('mousemove', this.defilementHorizontalEnCours)
		},
		defilementHorizontalDebut (event) {
			const pad = document.querySelector('#pad')
			this.defilement = true
			this.depart = event.pageX - pad.offsetLeft
			this.distance = pad.scrollLeft
		},
		defilementHorizontalFin () {
			this.defilement = false
		},
		defilementHorizontalEnCours (event) {
			if (!this.defilement) { return }
			event.preventDefault()
			const pad = document.querySelector('#pad')
			const x = event.pageX - pad.offsetLeft
			const delta = (x - this.depart) * 1.5
			pad.scrollLeft = this.distance - delta
		},
		definirClasseOrganiser () {
			if (this.blocs.length > 1 || (this.pad.affichage === 'colonnes' && this.pad.colonnes.length > 1)) {
				return true
			} else {
				return false
			}
		},
		activerModeOrganiser () {
			if (this.blocs.length > 1 || (this.pad.affichage === 'colonnes' && this.pad.colonnes.length > 1)) {
				this.menuActivite = false
				this.menuChat = false
				this.menuOptions = false
				this.recherche = false
				this.action = 'organiser'
				this.$store.dispatch('modifierMessage', this.$t('modeOrganiserActive'))
			}
		},
		desactiverModeOrganiser () {
			this.menuActivite = false
			this.menuChat = false
			this.menuOptions = false
			this.recherche = false
			this.action = ''
			this.$store.dispatch('modifierMessage', this.$t('modeOrganiserDesactive'))
		},
		afficherModaleDiaporama () {
			if (this.blocs.length > 0) {
				this.panneaux.forEach(function (panneau) {
					panneau.close()
				})
				this.panneaux = []
				this.chargement = true
				let donneesBloc = {}
				const blocActif = document.querySelector('.bloc.actif')
				if (blocActif) {
					const bloc = blocActif.id
					this.blocs.forEach(function (item) {
						if (item.bloc === bloc) {
							donneesBloc = item
						}
					})
				} else {
					donneesBloc = this.blocs[0]
					this.definirBlocActif(donneesBloc.bloc)
				}
				this.donneesBloc = donneesBloc
				this.menuActivite = false
				this.menuChat = false
				this.menuOptions = false
				this.modaleDiaporama = true
				if (this.pad.commentaires === 'actives') {
					this.$socket.emit('commentaires', donneesBloc.bloc, 'diapositive')
				} else {
					this.$nextTick(function () {
						this.chargerDiapositive()
					}.bind(this))
				}
			}
		},
		afficherBlocPrecedent () {
			this.chargement = true
			this.commentaire = ''
			const bloc = this.donneesBloc.bloc
			let indexBloc = 0
			this.blocs.forEach(function (item, index) {
				if (item.bloc === bloc) {
					indexBloc = index
				}
			})
			indexBloc--
			if (indexBloc === -1) {
				this.donneesBloc = this.blocs[this.blocs.length - 1]
			} else {
				this.donneesBloc = this.blocs[indexBloc]
			}
			this.definirBlocActif(this.donneesBloc.bloc)
			if (this.pad.commentaires === 'actives') {
				this.$socket.emit('commentaires', this.donneesBloc.bloc, 'diapositive')
			} else {
				this.chargerDiapositive()
			}
		},
		afficherBlocSuivant () {
			this.chargement = true
			this.commentaire = ''
			const bloc = this.donneesBloc.bloc
			let indexBloc = 0
			this.blocs.forEach(function (item, index) {
				if (item.bloc === bloc) {
					indexBloc = index
				}
			})
			indexBloc++
			if (indexBloc === this.blocs.length) {
				this.donneesBloc = this.blocs[0]
			} else {
				this.donneesBloc = this.blocs[indexBloc]
			}
			this.definirBlocActif(this.donneesBloc.bloc)
			if (this.pad.commentaires === 'actives') {
				this.$socket.emit('commentaires', this.donneesBloc.bloc, 'diapositive')
			} else {
				this.chargerDiapositive()
			}
		},
		definirBlocActif (bloc) {
			const blocActif = document.querySelector('.bloc.actif')
			if (blocActif) {
				blocActif.classList.remove('actif')
			}
			if (document.querySelector('#' + bloc)) {
				document.querySelector('#' + bloc).classList.add('actif')
			}
		},
		definirTypeMedia () {
			if (this.donneesBloc.source === 'youtube' || this.donneesBloc.source === 'vimeo' || this.donneesBloc.source === 'dailymotion' || this.donneesBloc.source === 'digiplay') {
				return 'video'
			} else if (this.donneesBloc.source === 'slideshare' || this.donneesBloc.source === 'soundcloud' || this.donneesBloc.media.includes('clyp.it') || this.donneesBloc.media.includes('vocaroo.com') || this.donneesBloc.media.includes('voca.ro')) {
				return 'embed'
			} else {
				return 'document'
			}
		},
		chargerDiapositive () {
			const contenuCharge = function () {
				this.chargement = false
				this.$nextTick(function () {
					document.querySelector('#diapositive .contenu').style.height = document.querySelector('#diapositive').clientHeight - this.convertirRem(5) + 'px'
					if (this.pad.commentaires === 'actives') {
						this.genererEditeur()
					}
				}.bind(this))
			}.bind(this)
			if (document.querySelector('#diapositive')) {
				document.querySelector('#diapositive .contenu').removeAttribute('style')
				switch (this.donneesBloc.type) {
				case 'audio':
					this.$nextTick(function () {
						const audio = document.querySelector('#diapositive audio')
						audio.addEventListener('loadedmetadata', function () {
							contenuCharge()
						})
						if (audio.readyState >= 2) {
							contenuCharge()
						}
					})
					break
				case 'video':
					this.$nextTick(function () {
						const video = document.querySelector('#diapositive video')
						video.addEventListener('loadedmetadata', function () {
							contenuCharge()
						})
						if (video.readyState >= 2) {
							contenuCharge()
						}
					})
					break
				default:
					this.$nextTick(function () {
						imagesLoaded('#diapositive', function () {
							contenuCharge()
						})
					})
					break
				}
			} else {
				this.chargement = false
			}
		},
		fermerModaleDiaporama () {
			this.modaleDiaporama = false
			this.commentaires = []
			this.commentaire = ''
			this.commentaireId = ''
			this.commentaireModifie = ''
			this.editeurCommentaire = ''
			this.emojis = ''
			this.donneesBloc = {}
		},
		ouvrirModaleAdmins () {
			this.menuOptions = false
			this.admins = JSON.parse(JSON.stringify(this.pad.admins))
			this.modaleAdmins = true
		},
		ajouterAdmin () {
			const identifiantAdmin = document.querySelector('#ajouter-admin input').value.trim()
			if (identifiantAdmin !== '' && this.identifiant !== identifiantAdmin && !this.admins.includes(identifiantAdmin)) {
				this.chargement = true
				axios.post(this.hote + '/api/verifier-identifiant', {
					identifiant: identifiantAdmin
				}).then(function (reponse) {
					this.chargement = false
					const donnees = reponse.data
					if (donnees === 'erreur') {
						this.$store.dispatch('modifierAlerte', this.$t('erreurCommunicationServeur'))
					} else if (donnees === 'identifiant_non_valide') {
						this.$store.dispatch('modifierAlerte', this.$t('identifiantNonValide'))
					} else {
						this.admins.push(identifiantAdmin)
					}
					document.querySelector('#ajouter-admin input').value = ''
				}.bind(this)).catch(function () {
					this.chargement = false
					this.$store.dispatch('modifierAlerte', this.$t('erreurCommunicationServeur'))
				}.bind(this))
			}
		},
		supprimerAdmin (identifiantAdmin) {
			const index = this.admins.indexOf(identifiantAdmin)
			this.admins.splice(index, 1)
		},
		modifierAdmins () {
			if (this.admins.toString() !== this.pad.admins.toString()) {
				this.modaleAdmins = false
				this.$socket.emit('modifieradmins', this.pad.id, this.admins, this.identifiant)
				this.chargement = true
			}
		},
		fermerModaleAdmins () {
			this.modaleAdmins = false
			this.admins = []
		},
		ouvrirModaleCommentaires (bloc, titre) {
			this.chargement = true
			this.bloc = bloc
			this.titre = titre
			this.$socket.emit('commentaires', bloc, 'discussion')
		},
		envoyerCommentaire (event) {
			event.preventDefault()
			let bloc = this.bloc
			if (Object.keys(this.donneesBloc).length > 0) {
				bloc = this.donneesBloc.bloc
			}
			if (this.commentaire !== '') {
				this.$socket.emit('commenterbloc', bloc, this.pad.id, this.titre, this.commentaire, this.couleur, this.identifiant, this.nom)
				this.commentaire = ''
				this.commentaireId = ''
				this.commentaireModifie = ''
				this.editeurCommentaire.content.innerHTML = ''
				this.emojis = ''
			}
		},
		afficherModifierCommentaire (id, texte) {
			this.commentaireId = id
			this.commentaireModifie = texte
			this.editionCommentaire = true
			this.emojis = ''
			this.$nextTick(function () {
				const actions = this.definirActionsEditeur('commentaire-modifie')
				const editeur = pell.init({
					element: document.querySelector('#commentaire-modifie'),
					onChange: function (html) {
						let commentaire = html.replace(/(<a [^>]*)(target="[^"]*")([^>]*>)/gi, '$1$3')
						commentaire = commentaire.replace(/(<a [^>]*)(>)/gi, '$1 target="_blank"$2')
						commentaire = linkifyHtml(commentaire, {
							defaultProtocol: 'https',
							target: '_blank'
						})
						this.commentaireModifie = commentaire
					}.bind(this),
					actions: actions,
					classes: { actionbar: 'boutons-editeur-commentaire', button: 'bouton-editeur', content: 'contenu-editeur-commentaire', selected: 'bouton-actif' }
				})
				editeur.content.innerHTML = this.commentaireModifie
				editeur.onpaste = function (event) {
					event.preventDefault()
					event.stopPropagation()
					const texte = event.clipboardData.getData('text/plain')
					pell.exec('insertText', texte)
				}
				document.querySelector('#couleur-texte-commentaire-modifie').addEventListener('change', this.modifierCouleurCommentaireModifie)
			}.bind(this))
		},
		annulerModifierCommentaire () {
			this.commentaireId = ''
			this.commentaireModifie = ''
			this.editionCommentaire = false
			this.emojis = ''
		},
		modifierCommentaire () {
			let bloc = this.bloc
			if (Object.keys(this.donneesBloc).length > 0) {
				bloc = this.donneesBloc.bloc
			}
			this.$socket.emit('modifiercommentaire', bloc, this.pad.id, this.commentaireId, this.commentaireModifie, this.identifiant)
			this.commentaireId = ''
			this.commentaireModifie = ''
			this.editionCommentaire = false
			this.emojis = ''
		},
		afficherSupprimerCommentaire (id) {
			this.editionCommentaire = false
			this.commentaireId = id
			this.messageConfirmation = this.$t('confirmationSupprimerCommentaire')
			this.typeConfirmation = 'supprimer-commentaire'
			this.modaleConfirmer = true
		},
		supprimerCommentaire () {
			this.modaleConfirmer = false
			let bloc = this.bloc
			if (Object.keys(this.donneesBloc).length > 0) {
				bloc = this.donneesBloc.bloc
			}
			this.$socket.emit('supprimercommentaire', bloc, this.pad.id, this.commentaireId, this.identifiant)
			this.fermerModaleConfirmer()
		},
		genererEditeur () {
			if (this.editeurCommentaire === '') {
				const actions = this.definirActionsEditeur('commentaire')
				this.editeurCommentaire = pell.init({
					element: document.querySelector('#commentaire'),
					onChange: function (html) {
						let commentaire = html.replace(/(<a [^>]*)(target="[^"]*")([^>]*>)/gi, '$1$3')
						commentaire = commentaire.replace(/(<a [^>]*)(>)/gi, '$1 target="_blank"$2')
						commentaire = linkifyHtml(commentaire, {
							defaultProtocol: 'https',
							target: '_blank'
						})
						this.commentaire = commentaire
					}.bind(this),
					actions: actions,
					classes: { actionbar: 'boutons-editeur-commentaire', button: 'bouton-editeur', content: 'contenu-editeur-commentaire', selected: 'bouton-actif' }
				})
				this.editeurCommentaire.onpaste = function (event) {
					event.preventDefault()
					event.stopPropagation()
					const texte = event.clipboardData.getData('text/plain')
					pell.exec('insertText', texte)
				}
				document.querySelector('#couleur-texte-commentaire').addEventListener('change', this.modifierCouleurCommentaire)
			}
		},
		definirActionsEditeur (type) {
			let actions = [
				{ name: 'gras', title: this.$t('gras'), icon: '<i class="material-icons">format_bold</i>', result: () => pell.exec('bold') },
				{ name: 'italique', title: this.$t('italique'), icon: '<i class="material-icons">format_italic</i>', result: () => pell.exec('italic') },
				{ name: 'souligne', title: this.$t('souligne'), icon: '<i class="material-icons">format_underlined</i>', result: () => pell.exec('underline') },
				{ name: 'barre', title: this.$t('barre'), icon: '<i class="material-icons">format_strikethrough</i>', result: () => pell.exec('strikethrough') },
				{ name: 'couleur', title: this.$t('couleurTexte'), icon: '<label for="couleur-texte-' + type + '"><i class="material-icons">format_color_text</i></label><input id="couleur-texte-' + type + '" type="color">', result: () => undefined },
				{ name: 'lien', title: this.$t('lien'), icon: '<i class="material-icons">link</i>', result: () => { const url = window.prompt(this.$t('adresseLien')); if (url) { pell.exec('createLink', url) } } },
				{ name: 'emojis', title: this.$t('emoticones'), icon: '<i class="material-icons">insert_emoticon</i>', result: function () { this.afficherEmojis(type) }.bind(this) }
			]
			if (((this.userAgent.match(/iPhone/i) || this.userAgent.match(/iPad/i) || this.userAgent.match(/iPod/i)) && this.userAgent.match(/Mobile/i)) || this.userAgent.match(/Android/i)) {
				actions = [{ name: 'gras', title: this.$t('gras'), icon: '<i class="material-icons">format_bold</i>', result: () => pell.exec('bold') }, { name: 'italique', title: this.$t('italique'), icon: '<i class="material-icons">format_italic</i>', result: () => pell.exec('italic') }, { name: 'souligne', title: this.$t('souligne'), icon: '<i class="material-icons">format_underlined</i>', result: () => pell.exec('underline') }, { name: 'barre', title: this.$t('barre'), icon: '<i class="material-icons">format_strikethrough</i>', result: () => pell.exec('strikethrough') }]
			}
			return actions
		},
		afficherEmojis (type) {
			if (type === 'commentaire' && this.emojis !== 'commentaire') {
				this.emojis = 'commentaire'
			} else if (type === 'commentaire' && this.emojis === 'commentaire') {
				this.emojis = ''
			} else if (type === 'commentaire-modifie' && this.emojis !== 'commentaire-modifie') {
				this.emojis = 'commentaire-modifie'
			} else if (type === 'commentaire-modifie' && this.emojis === 'commentaire-modifie') {
				this.emojis = ''
			}
		},
		insererEmoji (emoji) {
			pell.exec('insertText', emoji)
		},
		fermerModaleCommentaire () {
			this.modaleCommentaires = false
			this.commentaires = []
			this.commentaire = ''
			this.commentaireId = ''
			this.commentaireModifie = ''
			this.editeurCommentaire = ''
			this.editionCommentaire = false
			this.emojis = ''
			this.bloc = ''
			this.titre = ''
		},
		verifierUtilisateurEvaluation (evaluations) {
			if (evaluations && evaluations.length > 0) {
				let capsuleEvaluee = false
				evaluations.forEach(function (evaluation) {
					if (evaluation.identifiant === this.identifiant) {
						capsuleEvaluee = true
					}
				}.bind(this))
				return capsuleEvaluee
			} else {
				return false
			}
		},
		definirEvaluationCapsule (evaluations) {
			if (evaluations && evaluations.length > 0) {
				let note = 0
				evaluations.forEach(function (evaluation) {
					note = note + evaluation.etoiles
				})
				if (note > 0) {
					return Math.round(note / evaluations.length)
				} else {
					return 0
				}
			} else {
				return 0
			}
		},
		ouvrirModaleEvaluations (bloc, titre, evaluations) {
			this.bloc = bloc
			this.titre = titre
			if (evaluations !== '') {
				this.evaluations = evaluations
				evaluations.forEach(function (evaluation) {
					if (evaluation.identifiant === this.identifiant) {
						this.evaluationId = evaluation.id
						this.evaluation = evaluation.etoiles
					}
				}.bind(this))
			}
			this.modaleEvaluations = true
		},
		envoyerEvaluation () {
			let bloc = this.bloc
			if (Object.keys(this.donneesBloc).length > 0) {
				bloc = this.donneesBloc.bloc
			} else {
				this.chargement = true
			}
			this.$socket.emit('evaluerbloc', bloc, this.pad.id, this.titre, this.evaluation, this.couleur, this.identifiant, this.nom)
			this.fermerModaleEvaluations()
		},
		modifierEvaluation () {
			let bloc = this.bloc
			if (Object.keys(this.donneesBloc).length > 0) {
				bloc = this.donneesBloc.bloc
			} else {
				this.chargement = true
			}
			if (this.evaluation === 0) {
				this.$socket.emit('supprimerevaluation', bloc, this.pad.id, this.evaluationId, this.identifiant)
			} else {
				this.$socket.emit('modifierevaluation', bloc, this.pad.id, this.evaluationId, this.evaluation, this.identifiant)
			}
			this.fermerModaleEvaluations()
		},
		fermerModaleEvaluations () {
			this.modaleEvaluations = false
			this.evaluations = []
			this.evaluation = 0
			this.evaluationId = ''
			this.bloc = ''
			this.titre = ''
		},
		demarrerDeplacerBloc () {
			if (this.pad.affichage === 'colonnes') {
				this.desactiverDefilementHorizontal()
				this.defilement = false
				this.depart = 0
				this.distance = 0
			}
		},
		deplacerBloc (event) {
			this.chargement = true
			if (this.pad.affichage === 'colonnes') {
				this.activerDefilementHorizontal()
				const blocs = []
				this.colonnes.forEach(function (colonne, indexColonne) {
					colonne.forEach(function (bloc, indexBloc) {
						colonne[indexBloc].colonne = indexColonne
					})
					blocs.push(...colonne)
				})
				this.blocs = blocs
			}
			let ordre = 'croissant'
			if (this.pad.hasOwnProperty('ordre')) {
				ordre = this.pad.ordre
			}
			this.$socket.emit('deplacerbloc', this.blocs, this.pad.id, this.pad.affichage, ordre, this.identifiant)
			this.$nextTick(function () {
				const blocsActifs = document.querySelectorAll('.bloc.actif')
				if (blocsActifs.length > 0) {
					blocsActifs.forEach(function (bloc) {
						bloc.classList.remove('actif')
					})
				}
				let indexBloc
				if (this.pad.affichage === 'colonnes') {
					const indexColonne = event.to.getAttribute('data-index')
					indexBloc = event.newIndex
					if (this.colonnes[indexColonne][indexBloc] && this.colonnes[indexColonne][indexBloc].bloc) {
						document.querySelector('#' + this.colonnes[indexColonne][indexBloc].bloc).classList.add('actif')
					}
				} else {
					indexBloc = event.newIndex
					if (this.blocs[indexBloc] && this.blocs[indexBloc].bloc) {
						document.querySelector('#' + this.blocs[indexBloc].bloc).classList.add('actif')
					}
				}
			}.bind(this))
		},
		surlignerBloc (event) {
			const blocActif = document.querySelector('.bloc.actif')
			if (blocActif && document.querySelector('#pad').contains(event.target)) {
				blocActif.classList.remove('actif')
			}
			const element = event.target.closest('.bloc') || event.target.closest('li')
			if (element && element.hasAttribute('data-bloc')) {
				if (blocActif) {
					blocActif.classList.remove('actif')
				}
				const id = element.getAttribute('data-bloc')
				if (document.querySelector('#' + id)) {
					document.querySelector('#' + id).classList.add('actif')
					if (document.querySelector('#entrees') && document.querySelector('#entrees').contains(event.target)) {
						document.querySelector('#' + id).scrollIntoView()
					}
				}
			}
		},
		redimensionner () {
			const diapositive = document.querySelector('#diapositive')
			if (diapositive) {
				const contenuDiapositive = document.querySelector('#diapositive .contenu')
				contenuDiapositive.removeAttribute('style')
				this.$nextTick(function () {
					contenuDiapositive.style.height = diapositive.clientHeight - this.convertirRem(5) + 'px'
				}.bind(this))
			}
			const blocs = document.querySelector('#blocs')
			if (blocs) {
				this.$nextTick(function () {
					blocs.classList.add('anime')
					blocs.addEventListener('animationend', function () {
						blocs.classList.remove('anime')
					})
				})
			}
		},
		afficherActivite () {
			this.menuUtilisateurs = false
			this.menuChat = false
			this.menuOptions = false
			this.menuActivite = !this.menuActivite
		},
		afficherChat () {
			this.menuUtilisateurs = false
			this.menuActivite = false
			this.menuOptions = false
			this.menuChat = !this.menuChat
			this.nouveauxMessages = 0
		},
		afficherOptions () {
			this.menuUtilisateurs = false
			this.menuActivite = false
			this.menuChat = false
			this.menuOptions = !this.menuOptions
		},
		afficherUtilisateurs () {
			this.menuActivite = false
			this.menuChat = false
			this.menuOptions = false
			this.listeCouleurs = false
			this.menuUtilisateurs = !this.menuUtilisateurs
		},
		envoyerMessage () {
			if (this.message !== '') {
				this.$socket.emit('message', this.pad.id, this.message, this.identifiant, this.nom)
				this.message = ''
			}
		},
		afficherReinitialiserMessages () {
			this.messageConfirmation = this.$t('confirmationSupprimerMessages')
			this.typeConfirmation = 'reinitialiser-messages'
			this.modaleConfirmer = true
		},
		reinitialiserMessages () {
			this.$socket.emit('reinitialisermessages', this.pad.id, this.identifiant)
			this.chargement = true
			this.menuChat = false
			this.fermerModaleConfirmer()
		},
		afficherReinitialiserActivite () {
			this.messageConfirmation = this.$t('confirmationSupprimerActivite')
			this.typeConfirmation = 'reinitialiser-activite'
			this.modaleConfirmer = true
		},
		reinitialiserActivite () {
			this.$socket.emit('reinitialiseractivite', this.pad.id, this.identifiant)
			this.chargement = true
			this.menuActivite = false
			this.fermerModaleConfirmer()
		},
		supprimerActivite (id) {
			this.$socket.emit('supprimeractivite', this.pad.id, id, this.identifiant)
			this.chargement = true
		},
		modifierTitre () {
			const titre = document.querySelector('#titre-pad').value
			if (this.pad.titre !== titre && titre !== '') {
				this.$socket.emit('modifiertitre', this.pad.id, titre, this.identifiant)
				this.chargement = true
			}
		},
		modifierLangue (langue) {
			if (this.langue !== langue) {
				axios.post(this.hote + '/api/modifier-langue', {
					identifiant: this.identifiant,
					langue: langue
				}).then(function () {
					this.$i18n.setLocale(langue)
					document.getElementsByTagName('html')[0].setAttribute('lang', langue)
					this.$store.dispatch('modifierLangue', langue)
					this.$store.dispatch('modifierMessage', this.$t('langueModifiee'))
				}.bind(this)).catch(function () {
					this.$store.dispatch('modifierAlerte', this.$t('erreurCommunicationServeur'))
				}.bind(this))
			}
		},
		afficherCodeQR () {
			this.modaleCodeQR = true
		},
		fermerModaleCodeQR () {
			this.modaleCodeQR = false
		},
		modifierAcces (acces) {
			if (this.pad.acces !== acces) {
				this.$socket.emit('modifieracces', this.pad.id, acces, this.identifiant)
				this.chargement = true
			}
		},
		afficherCodeAcces () {
			this.codeVisible = true
		},
		masquerCodeAcces () {
			this.modificationCode = false
			this.codeVisible = false
		},
		afficherModifierCodeAcces () {
			this.codeVisible = true
			this.modificationCode = true
		},
		annulerModifierCodeAcces () {
			this.codeVisible = false
			this.modificationCode = false
		},
		modifierCodeAcces () {
			const code = document.querySelector('#code-acces input').value
			if (this.pad.code !== code && code !== '') {
				this.$socket.emit('modifiercodeacces', this.pad.id, code, this.identifiant)
				this.chargement = true
			}
		},
		verifierCodeAcces () {
			this.chargement = true
			axios.post(this.hote + '/api/verifier-code-acces', {
				pad: this.pad.id,
				code: this.codeAcces
			}).then(function (reponse) {
				const donnees = reponse.data
				if (donnees === 'code_incorrect') {
					this.chargement = false
					this.$store.dispatch('modifierAlerte', this.$t('codePasCorrect'))
				} else if (donnees === 'erreur') {
					this.chargement = false
					this.$store.dispatch('modifierAlerte', this.$t('erreurCommunicationServeur'))
				} else {
					this.chargement = false
					this.accesAutorise = true
					this.$socket.emit('connexion', { pad: this.pad.id, identifiant: this.identifiant, nom: this.nom })
					this.fermerModaleCodeAcces()
				}
			}.bind(this)).catch(function () {
				this.chargement = false
				this.$store.dispatch('modifierAlerte', this.$t('erreurCommunicationServeur'))
			}.bind(this))
		},
		fermerModaleCodeAcces () {
			this.codeAcces = ''
			this.modaleCodeAcces = false
		},
		modifierContributions (contributions) {
			if (this.pad.contributions !== contributions) {
				this.$socket.emit('modifiercontributions', this.pad.id, contributions, this.pad.contributions, this.identifiant)
				this.chargement = true
			}
		},
		modifierAffichage (affichage) {
			if (this.pad.affichage !== affichage) {
				this.$socket.emit('modifieraffichage', this.pad.id, affichage, this.identifiant)
				this.chargement = true
			}
		},
		modifierOrdre (ordre) {
			if (this.pad.ordre !== ordre) {
				this.$socket.emit('modifierordre', this.pad.id, ordre, this.identifiant)
				this.chargement = true
			}
		},
		modifierFond (fond) {
			if (this.pad.fond !== fond) {
				this.$socket.emit('modifierfond', this.pad.id, '/img/' + fond, this.pad.fond, this.identifiant)
				this.chargement = true
			}
		},
		modifierCouleurFond (event) {
			if (this.pad.fond !== event.target.value) {
				this.$socket.emit('modifiercouleurfond', this.pad.id, event.target.value, this.pad.fond, this.identifiant)
				this.chargement = true
			}
		},
		ajouterFond () {
			const champ = document.querySelector('#televerser-fond')
			const formats = ['jpg', 'jpeg', 'png', 'gif']
			const extension = champ.files[0].name.substring(champ.files[0].name.lastIndexOf('.') + 1).toLowerCase()
			if (champ.files && champ.files[0] && formats.includes(extension)) {
				this.chargement = true
				const fichier = champ.files[0]
				const formulaire = new FormData()
				formulaire.append('pad', this.pad.id)
				formulaire.append('fichier', fichier)
				axios.post(this.hote + '/api/televerser-fond', formulaire, {
					headers: {
						'Content-Type': 'multipart/form-data'
					},
					onUploadProgress: function (progression) {
						const pourcentage = parseInt(Math.round((progression.loaded * 100) / progression.total))
						this.progressionFond = pourcentage
					}.bind(this)
				}).then(function (reponse) {
					const donnees = reponse.data
					if (donnees === 'non_connecte') {
						this.$router.push('/')
					} else if (donnees === 'erreur_televersement') {
						champ.value = ''
						this.progressionFond = 0
						this.$store.dispatch('modifierAlerte', this.$t('erreurTeleversementFichier'))
					} else {
						this.$socket.emit('modifierfond', this.pad.id, donnees, this.pad.fond, this.identifiant)
					}
					this.progressionFond = 0
					champ.value = ''
				}.bind(this)).catch(function () {
					champ.value = ''
					this.progressionFond = 0
					this.$store.dispatch('modifierAlerte', this.$t('erreurCommunicationServeur'))
				}.bind(this))
			} else {
				this.$store.dispatch('modifierAlerte', this.$t('formatFichierPasAccepte'))
				champ.value = ''
			}
		},
		modifierActivite (event) {
			if (event.target.checked === true) {
				this.$socket.emit('modifieractivite', this.pad.id, 'active', this.identifiant)
			} else {
				this.$socket.emit('modifieractivite', this.pad.id, 'desactive', this.identifiant)
			}
			this.chargement = true
		},
		modifierConversation (event) {
			if (event.target.checked === true) {
				this.$socket.emit('modifierconversation', this.pad.id, 'activee', this.identifiant)
			} else {
				this.$socket.emit('modifierconversation', this.pad.id, 'desactivee', this.identifiant)
			}
			this.chargement = true
		},
		modifierListeUtilisateurs (event) {
			if (event.target.checked === true) {
				this.$socket.emit('modifierlisteutilisateurs', this.pad.id, 'activee', this.identifiant)
			} else {
				this.$socket.emit('modifierlisteutilisateurs', this.pad.id, 'desactivee', this.identifiant)
			}
			this.chargement = true
		},
		modifierEditionNom (event) {
			if (event.target.checked === true) {
				this.$socket.emit('modifiereditionnom', this.pad.id, 'activee', this.identifiant)
			} else {
				this.$socket.emit('modifiereditionnom', this.pad.id, 'desactivee', this.identifiant)
			}
			this.chargement = true
		},
		modifierFichiers (event) {
			if (event.target.checked === true) {
				this.$socket.emit('modifierfichiers', this.pad.id, 'actives', this.identifiant)
			} else {
				this.$socket.emit('modifierfichiers', this.pad.id, 'desactives', this.identifiant)
			}
			this.chargement = true
		},
		modifierLiens (event) {
			if (event.target.checked === true) {
				this.$socket.emit('modifierliens', this.pad.id, 'actives', this.identifiant)
			} else {
				this.$socket.emit('modifierliens', this.pad.id, 'desactives', this.identifiant)
			}
			this.chargement = true
		},
		modifierDocuments (event) {
			if (event.target.checked === true) {
				this.$socket.emit('modifierdocuments', this.pad.id, 'actives', this.identifiant)
			} else {
				this.$socket.emit('modifierdocuments', this.pad.id, 'desactives', this.identifiant)
			}
			this.chargement = true
		},
		modifierCommentaires (event) {
			if (event.target.checked === true) {
				this.$socket.emit('modifiercommentaires', this.pad.id, 'actives', this.identifiant)
			} else {
				this.$socket.emit('modifiercommentaires', this.pad.id, 'desactives', this.identifiant)
			}
			this.chargement = true
		},
		modifierEvaluations (event) {
			if (event.target.checked === true) {
				this.$socket.emit('modifierevaluations', this.pad.id, 'activees', this.identifiant)
			} else {
				this.$socket.emit('modifierevaluations', this.pad.id, 'desactivees', this.identifiant)
			}
			this.chargement = true
		},
		fermerMenuOptions () {
			this.menuOptions = false
			if (document.querySelector('#titre-pad')) {
				document.querySelector('#titre-pad').value = this.pad.titre
			}
			this.codeVisible = false
		},
		modifierCouleur (couleur) {
			this.listeCouleurs = false
			this.couleur = couleur
			this.$socket.emit('modifiercouleur', this.pad.id, couleur, this.identifiant)
		},
		afficherModifierNom () {
			this.nomUtilisateur = this.nom
			this.modaleModifierNom = true
			this.$nextTick(function () {
				document.querySelector('#champ-nom').focus()
			})
		},
		modifierNom () {
			const nom = this.nomUtilisateur
			if (nom !== '') {
				this.$socket.emit('modifiernom', this.pad.id, nom, this.statut, this.identifiant)
				this.chargement = true
				this.fermerModaleModifierNom()
			}
		},
		fermerModaleModifierNom () {
			this.modaleModifierNom = false
			this.nomUtilisateur = ''
		},
		modifierCaracteristique (identifiant, caracteristique, valeur) {
			this.blocs.forEach(function (item) {
				if (item.identifiant === identifiant && item.hasOwnProperty(caracteristique)) {
					item[caracteristique] = valeur
				}
			})
			this.commentaires.forEach(function (commentaire) {
				if (commentaire.identifiant === identifiant && commentaire.hasOwnProperty(caracteristique)) {
					commentaire[caracteristique] = valeur
				}
			})
			this.activite.forEach(function (entree) {
				if (entree.identifiant === identifiant && entree.hasOwnProperty(caracteristique)) {
					entree[caracteristique] = valeur
				}
			})
			this.messages.forEach(function (message) {
				if (message.identifiant === identifiant && message.hasOwnProperty(caracteristique)) {
					message[caracteristique] = valeur
				}
			})
			this.utilisateurs.forEach(function (utilisateur) {
				if (utilisateur.identifiant === identifiant && utilisateur.hasOwnProperty(caracteristique)) {
					utilisateur[caracteristique] = valeur
				}
			})
		},
		eclaircirCouleur (hex) {
			if (hex && hex.substring(0, 1) === '#') {
				const r = parseInt(hex.slice(1, 3), 16)
				const v = parseInt(hex.slice(3, 5), 16)
				const b = parseInt(hex.slice(5, 7), 16)
				return 'rgba(' + r + ', ' + v + ', ' + b + ', ' + 0.15 + ')'
			} else {
				return 'transparent'
			}
		},
		convertirRem (rem) {
			return rem * parseFloat(getComputedStyle(document.documentElement).fontSize)
		},
		deconnexion () {
			const identifiant = this.identifiant
			axios.post(this.hote + '/api/deconnexion').then(function () {
				this.$socket.emit('deconnexion', identifiant)
				this.$store.dispatch('reinitialiser')
				this.$router.push('/')
			}.bind(this)).catch(function () {
				this.$store.dispatch('modifierAlerte', this.$t('erreurCommunicationServeur'))
			}.bind(this))
		},
		afficherModaleModifierMotDePasse () {
			this.menuOptions = false
			this.modaleModifierMotDePasse = true
			this.$nextTick(function () {
				document.querySelector('#champ-motdepasse-actuel').focus()
			})
		},
		modifierMotDePasse () {
			const motDePasse = this.motDePasse
			const nouveauMotDePasse = this.nouveauMotDePasse
			if (motDePasse !== '' && nouveauMotDePasse !== '') {
				this.modaleModifierMotDePasse = false
				this.chargement = true
				axios.post(this.hote + '/api/modifier-mot-de-passe-pad', {
					pad: this.pad.id,
					identifiant: this.identifiant,
					motdepasse: motDePasse,
					nouveaumotdepasse: nouveauMotDePasse
				}).then(function (reponse) {
					const donnees = reponse.data
					if (donnees === 'non_connecte') {
						this.$router.push('/')
					} else if (donnees === 'motdepasse_incorrect') {
						this.chargement = false
						this.$store.dispatch('modifierAlerte', this.$t('motDePasseActuelPasCorrect'))
					} else if (donnees === 'erreur') {
						this.chargement = false
						this.$store.dispatch('modifierAlerte', this.$t('erreurCommunicationServeur'))
					} else {
						this.$store.dispatch('modifierMessage', this.$t('motDePasseModifie'))
						this.fermerModaleModifierMotDePasse()
						this.chargement = false
					}
				}.bind(this)).catch(function () {
					this.chargement = false
					this.$store.dispatch('modifierAlerte', this.$t('erreurCommunicationServeur'))
				}.bind(this))
			} else {
				this.$store.dispatch('modifierAlerte', this.$t('remplirChamps'))
			}
		},
		fermerModaleModifierMotDePasse () {
			this.modaleModifierMotDePasse = false
			this.motDePasse = ''
			this.nouveauMotDePasse = ''
		},
		afficherModaleMotDePasse () {
			this.modaleCodeAcces = false
			this.modaleMotDePasse = true
			this.$nextTick(function () {
				document.querySelector('#champ-motdepasse').focus()
			})
		},
		verifierMotDePasse () {
			this.chargement = true
			axios.post(this.hote + '/api/verifier-mot-de-passe', {
				pad: this.pad.id,
				motdepasse: this.motDePasse
			}).then(function (reponse) {
				const donnees = reponse.data
				if (donnees === 'motdepasse_incorrect') {
					this.chargement = false
					this.$store.dispatch('modifierAlerte', this.$t('motDePassePasCorrect'))
				} else if (donnees === 'erreur') {
					this.chargement = false
					this.$store.dispatch('modifierAlerte', this.$t('erreurCommunicationServeur'))
				} else {
					this.accesAutorise = true
					this.$socket.emit('debloquerpad', this.pad.id, this.pad.identifiant)
					this.fermerModaleMotDePasse()
				}
			}.bind(this)).catch(function () {
				this.chargement = false
				this.$store.dispatch('modifierAlerte', this.$t('erreurCommunicationServeur'))
			}.bind(this))
		},
		fermerModaleMotDePasse () {
			this.motDePasse = ''
			this.modaleMotDePasse = false
		},
		afficherSeDeconnecterPad () {
			this.messageConfirmation = this.$t('confirmationSeDeconnecterPad')
			this.typeConfirmation = 'deconnecter-pad'
			this.modaleConfirmer = true
		},
		seDeconnecterPad () {
			this.modaleConfirmer = false
			this.chargement = true
			axios.post(this.hote + '/api/deconnecter-pad', {
				identifiant: this.identifiant
			}).then(function (reponse) {
				const donnees = reponse.data
				if (donnees === 'deconnecte') {
					this.$router.go()
				}
				this.chargement = false
			}.bind(this)).catch(function () {
				this.chargement = false
				this.$store.dispatch('modifierAlerte', this.$t('erreurCommunicationServeur'))
			}.bind(this))
		},
		afficherExporterPad () {
			this.messageConfirmation = this.$t('confirmationExporterPad')
			this.typeConfirmation = 'exporter-pad'
			this.modaleConfirmer = true
		},
		exporterPad () {
			this.modaleConfirmer = false
			this.chargement = true
			axios.post(this.hote + '/api/exporter-pad', {
				padId: this.pad.id,
				identifiant: this.identifiant
			}).then(function (reponse) {
				const donnees = reponse.data
				if (donnees === 'erreur_export') {
					this.chargement = false
					this.$store.dispatch('modifierAlerte', this.$t('erreurExportPad'))
				} else {
					saveAs('/temp/' + donnees, 'pad-' + this.pad.id + '.zip')
					this.chargement = false
				}
			}.bind(this)).catch(function () {
				this.chargement = false
				this.$store.dispatch('modifierAlerte', this.$t('erreurCommunicationServeur'))
			}.bind(this))
		},
		afficherSupprimerPad () {
			this.messageConfirmation = this.$t('confirmationSupprimerPad')
			this.typeConfirmation = 'supprimer-pad'
			this.modaleConfirmer = true
		},
		supprimerPad () {
			this.modaleConfirmer = false
			this.chargement = true
			axios.post(this.hote + '/api/supprimer-pad', {
				padId: this.pad.id,
				identifiant: this.identifiant
			}).then(function (reponse) {
				const donnees = reponse.data
				if (donnees === 'erreur_suppression') {
					this.chargement = false
					this.$store.dispatch('modifierAlerte', this.$t('erreurSuppressionPad'))
				} else {
					this.$router.push('/')
				}
			}.bind(this)).catch(function () {
				this.chargement = false
				this.$store.dispatch('modifierAlerte', this.$t('erreurCommunicationServeur'))
			}.bind(this))
		},
		envoyerNotificationAdmins () {
			if (this.identifiant !== this.pad.identifiant) {
				const adminsNonConnectes = []
				let notification = []
				if (this.pad.hasOwnProperty('notification')) {
					notification = this.pad.notification
				}
				if (!this.utilisateurs.map(function (e) { return e.identifiant }).includes(this.pad.identifiant) && !notification.includes(this.pad.identifiant)) {
					adminsNonConnectes.push(this.pad.identifiant)
				}
				this.pad.admins.forEach(function (admin) {
					if (!this.utilisateurs.map(function (e) { return e.identifiant }).includes(admin) && !notification.includes(admin)) {
						adminsNonConnectes.push(admin)
					}
				}.bind(this))
				if (adminsNonConnectes.length > 0) {
					this.$socket.emit('modifiernotification', this.pad.id, adminsNonConnectes)
				}
			}
		},
		definirDossierFichiers (id) {
			if (process.env.nfsPadNumber && process.env.nfsPadNumber !== '' && process.env.nfsFolder && process.env.nfsFolder !== '' && parseInt(id) > parseInt(process.env.nfsPadNumber)) {
				return process.env.nfsFolder
			} else {
				return 'fichiers'
			}
		},
		quitterPage () {
			this.$socket.emit('sortie', this.pad.id, this.identifiant)
			this.fermerModaleBlocSansEnregistrement()
		}
	}
}

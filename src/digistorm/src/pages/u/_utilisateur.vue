<template>
	<div id="page" v-if="identifiant !== '' && statutUtilisateur === 'utilisateur'">
		<div id="compte">
			<header>
				<div id="conteneur-header">
					<a id="logo" :href="hote" />

					<div id="titre">
						<span class="titre">{{ $t('monCompte') }}</span>
					</div>

					<div id="parametres">
						<span class="parametres" role="button" tabindex="0" :title="$t('afficherParametres')" @click="afficherModaleParametres"><i class="material-icons">settings</i></span>
						<span class="deconnexion" role="button" tabindex="0" :title="$t('seDeconnecter')" @click="seDeconnecter"><i class="material-icons">power_settings_new</i></span>
					</div>
				</div>
			</header>

			<div id="conteneur" class="ascenseur">
				<div class="section">
					<div id="boutons">
						<span id="bouton-creer" role="button" tabindex="0" @click="afficherModaleCreer">{{ $t('creer') }}</span>
						<span id="bouton-importer" role="button" tabindex="0" @click="afficherModaleImporter">{{ $t('importer') }}</span>
					</div>
					<div id="filtrer">
						<div class="rechercher">
							<span><i class="material-icons">search</i></span>
							<input type="search" :value="requete" :placeholder="$t('rechercher')" @input="requete = $event.target.value">
						</div>
						<div class="filtrer">
							<span><i class="material-icons">sort</i></span>
							<select id="champ-filtrer" @change="modifierFiltre($event.target.value)">
								<option value="date-desc" :selected="filtre === 'date-desc'">{{ $t('dateDesc') }}</option>
								<option value="date-asc" :selected="filtre === 'date-asc'">{{ $t('dateAsc') }}</option>
								<option value="alpha-desc" :selected="filtre === 'alpha-desc'">{{ $t('alphaDesc') }}</option>
								<option value="alpha-asc" :selected="filtre === 'alpha-asc'">{{ $t('alphaAsc') }}</option>
							</select>
						</div>
					</div>
					<div class="interactions" v-if="interactions.length > 0 && requete === ''">
						<div class="interaction" :class="{'ouvert': interaction.statut === 'ouvert'}" v-for="(interaction, indexInteraction) in interactions" :key="'interaction_' + indexInteraction">
							<a class="type" :href="'/c/' + interaction.code">
								<span>{{ interaction.type.substring(0, 1) }}</span>
							</a>
							<a class="meta" :href="'/c/' + interaction.code">
								<span class="titre">{{ interaction.titre }}</span>
								<span class="date">{{ $t('creeLe') }} {{ $formaterDate(interaction.date, langue) }}</span>
							</a>
							<div class="actions">
								<span class="dupliquer" @click="afficherModaleConfirmation(interaction.code, 'dupliquer')" :title="$t('dupliquer')"><i class="material-icons">content_copy</i></span>
								<span class="exporter" @click="afficherModaleConfirmation(interaction.code, 'exporter')" :title="$t('exporter')"><i class="material-icons">get_app</i></span>
								<span class="supprimer" @click="afficherModaleConfirmation(interaction.code, 'supprimer')" :title="$t('supprimer')"><i class="material-icons">delete</i></span>
							</div>
						</div>
					</div>
					<div class="vide" v-else-if="interactions.length === 0 && requete === ''">
						{{ $t('aucuneInteraction') }}
					</div>
					<div class="interactions" v-else-if="resultats.length > 0 && requete !== ''">
						<div class="interaction" :class="{'ouvert': interaction.statut === 'ouvert'}" v-for="(interaction, indexInteraction) in resultats" :key="'interaction_' + indexInteraction">
							<a class="type" :href="'/c/' + interaction.code">
								<span>{{ interaction.type.substring(0, 1) }}</span>
							</a>
							<a class="meta" :href="'/c/' + interaction.code">
								<span class="titre">{{ interaction.titre }}</span>
								<span class="date">{{ $t('creeLe') }} {{ $formaterDate(interaction.date, langue) }}</span>
							</a>
							<div class="actions">
								<span class="dupliquer" @click="afficherModaleConfirmation(interaction.code, 'dupliquer')" :title="$t('dupliquer')"><i class="material-icons">content_copy</i></span>
								<span class="exporter" @click="afficherModaleConfirmation(interaction.code, 'exporter')" :title="$t('exporter')"><i class="material-icons">get_app</i></span>
								<span class="supprimer" @click="afficherModaleConfirmation(interaction.code, 'supprimer')" :title="$t('supprimer')"><i class="material-icons">delete</i></span>
							</div>
						</div>
					</div>
					<div class="vide" v-else-if="resultats.length === 0 && requete !== ''">
						{{ $t('aucunResultat') }}
					</div>
				</div>
			</div>
		</div>

		<div class="conteneur-modale" v-if="modale === 'parametres'">
			<div id="modale-parametres" class="modale">
				<header>
					<span class="titre">{{ $t('parametresCompte') }}</span>
					<span class="fermer" role="button" tabindex="0" @click="fermerModaleParametres"><i class="material-icons">close</i></span>
				</header>
				<div class="conteneur">
					<div class="contenu">
						<label>{{ $t('langue') }}</label>
						<div class="langue">
							<span role="button" tabindex="0" :class="{'selectionne': langue === 'fr'}" @click="modifierLangue('fr')">FR</span>
							<span role="button" tabindex="0" :class="{'selectionne': langue === 'es'}" @click="modifierLangue('es')">ES</span>
							<span role="button" tabindex="0" :class="{'selectionne': langue === 'it'}" @click="modifierLangue('it')">IT</span>
							<span role="button" tabindex="0" :class="{'selectionne': langue === 'en'}" @click="modifierLangue('en')">EN</span>
						</div>
						<label for="nom">{{ $t('nomOuPseudo') }}</label>
						<input id="nom" type="text" :value="nom">
						<label for="email">{{ $t('email') }}</label>
						<input id="email" type="text" :value="email">
						<div class="actions modifier">
							<span class="bouton" role="button" tabindex="0" @click="modifierInformations">{{ $t('enregistrer') }}</span>
						</div>
						<label>{{ $t('motDePasse') }}</label>
						<div class="actions modifier">
							<span class="bouton" role="button" tabindex="0" @click="afficherModaleMotDePasse">{{ $t('modifierMotDePasse') }}</span>
						</div>
						<label>{{ $t('supprimerCompte') }}</label>
						<div class="actions supprimer">
							<span class="bouton" role="button" tabindex="0" @click="afficherModaleConfirmation('', 'supprimer-compte')">{{ $t('supprimer') }}</span>
						</div>
					</div>
				</div>
			</div>
		</div>

		<div class="conteneur-modale" v-else-if="modale === 'motdepasse'">
			<div id="modale-motdepasse" class="modale">
				<header>
					<span class="titre">{{ $t('modifierMotDePasse') }}</span>
					<span class="fermer" role="button" tabindex="0" @click="fermerModaleMotDePasse"><i class="material-icons">close</i></span>
				</header>
				<div class="conteneur">
					<div class="contenu">
						<label for="champ-motdepasse-actuel">{{ $t('motDePasseActuel') }}</label>
						<input id="champ-motdepasse-actuel" type="password" maxlength="48" :value="motDePasse" @input="motDePasse = $event.target.value">
						<label for="champ-nouveau-motdepasse">{{ $t('nouveauMotDePasse') }}</label>
						<input id="champ-nouveau-motdepasse" type="password" maxlength="48" :value="nouveauMotDePasse" @input="nouveauMotDePasse = $event.target.value">
						<label for="champ-confirmation-motdepasse">{{ $t('confirmationNouveauMotDePasse') }}</label>
						<input id="champ-confirmation-motdepasse" type="password" maxlength="48" :value="confirmationNouveauMotDePasse" @input="confirmationNouveauMotDePasse = $event.target.value" @keydown.enter="modifierMotDePasse">
						<div class="actions">
							<span role="button" tabindex="0" class="bouton" @click="modifierMotDePasse">{{ $t('modifier') }}</span>
						</div>
					</div>
				</div>
			</div>
		</div>

		<div class="conteneur-modale" v-else-if="modale === 'creer'">
			<div id="modale-creer" class="modale">
				<header>
					<span class="titre">{{ $t('creerInteraction') }}</span>
					<span class="fermer" role="button" tabindex="0" @click="fermerModaleCreer"><i class="material-icons">close</i></span>
				</header>
				<div class="conteneur">
					<div class="contenu">
						<label>{{ $t('titre') }}</label>
						<input type="text" :value="titre" @input="titre = $event.target.value" @keydown.enter="creer">
						<label>{{ $t('typeInteraction') }}</label>
						<select value="Sondage" @change="type = $event.target.value">
							<option value="Sondage">{{ $t('sondage') }}</option>
							<option value="Questionnaire">{{ $t('questionnaire') }}</option>
							<option value="Remue-méninges">{{ $t('remueMeninges') }}</option>
							<option value="Nuage-de-mots">{{ $t('nuageDeMots') }}</option>
						</select>
						<div class="actions">
							<span class="bouton" role="button" tabindex="0" @click="creer">{{ $t('creer') }}</span>
						</div>
					</div>
				</div>
			</div>
		</div>

		<div class="conteneur-modale" v-else-if="modale === 'importer'">
			<div id="modale-importer" class="modale">
				<header>
					<span class="titre">{{ $t('importerInteraction') }}</span>
					<span class="fermer" role="button" tabindex="0" @click="fermerModaleImporter"><i class="material-icons">close</i></span>
				</header>
				<div class="conteneur">
					<div class="contenu">
						<div class="conteneur-interrupteur" v-if="progressionImport === 0">
							<span>{{ $t('importerResultats') }}</span>
							<label class="bouton-interrupteur">
								<input type="checkbox" :checked="parametresImport.resultats" @change="modifierParametresImport($event, 'resultats')">
								<span class="barre" />
							</label>
						</div>
						<label for="importer-interaction" class="bouton" v-show="progressionImport === 0">{{ $t('selectionnerArchive') }}</label>
						<input id="importer-interaction" type="file" style="display: none" accept=".zip" @change="importer">
						<div class="conteneur-chargement progression" v-if="progressionImport > 0">
							<progress class="barre-progression" max="100" :value="progressionImport" />
							<div class="chargement" />
						</div>
					</div>
				</div>
			</div>
		</div>

		<div class="conteneur-modale" v-if="modaleConfirmation !== ''">
			<div id="modale-confirmation" class="modale">
				<div class="conteneur">
					<div class="contenu">
						<p v-html="$t('confirmationDupliquerInteraction')" v-if="modaleConfirmation === 'dupliquer'" />
						<p v-html="$t('confirmationExporterInteraction')" v-else-if="modaleConfirmation === 'exporter'" />
						<p v-html="$t('confirmationSupprimerInteraction')" v-else-if="modaleConfirmation === 'supprimer'" />
						<p v-html="$t('confirmationSupprimerCompte')" v-else-if="modaleConfirmation === 'supprimer-compte'" />
						<div class="actions">
							<span role="button" class="bouton" tabindex="0" @click="fermerModaleConfirmation">{{ $t('non') }}</span>
							<span role="button" class="bouton" tabindex="0" @click="dupliquer" v-if="modaleConfirmation === 'dupliquer'">{{ $t('oui') }}</span>
							<span role="button" class="bouton" tabindex="0" @click="exporter" v-else-if="modaleConfirmation === 'exporter'">{{ $t('oui') }}</span>
							<span role="button" class="bouton" tabindex="0" @click="supprimer" v-else-if="modaleConfirmation === 'supprimer'">{{ $t('oui') }}</span>
							<span role="button" class="bouton" tabindex="0" @click="supprimerCompte" v-else-if="modaleConfirmation === 'supprimer-compte'">{{ $t('oui') }}</span>
						</div>
					</div>
				</div>
			</div>
		</div>

		<chargement :chargement="chargement" v-if="chargement" />
	</div>
</template>

<script>
import axios from 'axios'
import saveAs from 'file-saver'
import chargement from '../../components/chargement.vue'

export default {
	name: 'Utilisateur',
	components: {
		chargement
	},
	async asyncData (context) {
		const { data } = await axios.post(context.store.state.hote + '/api/recuperer-donnees-utilisateur', {
			identifiant: context.store.state.identifiant
		}, {
			headers: { 'Content-Type': 'application/json' }
		})
		return {
			interactions: data.interactions
		}
	},
	data () {
		return {
			chargement: false,
			modale: '',
			titre: '',
			type: 'Sondage',
			progressionImport: 0,
			modaleConfirmation: '',
			motDePasse: '',
			nouveauMotDePasse: '',
			confirmationNouveauMotDePasse: '',
			requete: '',
			resultats: [],
			parametresImport: {
				resultats: false
			}
		}
	},
	head () {
		return {
			title: this.identifiant + ' - Digistorm'
		}
	},
	computed: {
		hote () {
			return this.$store.state.hote
		},
		identifiant () {
			return this.$store.state.identifiant
		},
		nom () {
			return this.$store.state.nom
		},
		email () {
			return this.$store.state.email
		},
		langue () {
			return this.$store.state.langue
		},
		statutUtilisateur () {
			return this.$store.state.statut
		},
		filtre () {
			return this.$store.state.filtre
		}
	},
	watch: {
		requete: function () {
			this.rechercher()
		}
	},
	watchQuery: ['page'],
	created () {
		if (this.identifiant === '' || this.statutUtilisateur !== 'utilisateur') {
			this.$router.push('/')
		}
		this.$nuxt.$loading.start()
		this.$i18n.setLocale(this.langue)
		this.filtrer(this.filtre)
	},
	mounted () {
		setTimeout(function () {
			this.$nuxt.$loading.finish()
			document.getElementsByTagName('html')[0].setAttribute('lang', this.langue)
		}.bind(this), 100)
	},
	methods: {
		afficherModaleParametres () {
			this.modale = 'parametres'
		},
		fermerModaleParametres () {
			this.modale = ''
		},
		afficherModaleCreer () {
			this.modale = 'creer'
			this.$nextTick(function () {
				document.querySelector('#modale-creer input').focus()
			})
		},
		fermerModaleCreer () {
			this.modale = ''
			this.titre = ''
			this.type = 'Sondage'
		},
		creer () {
			if (this.titre !== '' && this.type !== '') {
				this.chargement = true
				axios.post(this.hote + '/api/creer-interaction', {
					identifiant: this.identifiant,
					titre: this.titre,
					type: this.type
				}).then(function (reponse) {
					this.chargement = false
					const donnees = reponse.data
					if (donnees === 'erreur') {
						this.$store.dispatch('modifierMessage', this.$t('erreurCommunicationServeur'))
					} else if (donnees === 'existe_deja') {
						this.$store.dispatch('modifierMessage', this.$t('interactionExisteDeja'))
					} else {
						this.$router.push('/c/' + donnees.code)
					}
				}.bind(this)).catch(function () {
					this.chargement = false
					this.fermerModaleCreer()
					this.$store.dispatch('modifierMessage', this.$t('erreurCommunicationServeur'))
				}.bind(this))
			} else {
				if (this.titre === '') {
					this.$store.dispatch('modifierMessage', this.$t('completerChampTitre'))
				}
				if (this.type === '') {
					this.$store.dispatch('modifierMessage', this.$t('selectionnerTypeInteraction'))
				}
			}
		},
		afficherModaleImporter () {
			this.modale = 'importer'
		},
		modifierParametresImport (event, type) {
			this.parametresImport[type] = event.target.checked
		},
		importer () {
			const champ = document.querySelector('#importer-interaction')
			const extension = champ.files[0].name.substring(champ.files[0].name.lastIndexOf('.') + 1).toLowerCase()
			if (champ.files && champ.files[0] && extension === 'zip') {
				const formulaire = new FormData()
				formulaire.append('parametres', JSON.stringify(this.parametresImport))
				formulaire.append('fichier', champ.files[0])
				axios.post(this.hote + '/api/importer-interaction', formulaire, {
					headers: {
						'Content-Type': 'multipart/form-data'
					},
					onUploadProgress: function (progression) {
						const pourcentage = parseInt(Math.round((progression.loaded * 100) / progression.total))
						this.progressionImport = pourcentage
					}.bind(this)
				}).then(function (reponse) {
					this.fermerModaleImporter()
					const donnees = reponse.data
					if (donnees === 'erreur') {
						this.$store.dispatch('modifierMessage', this.$t('erreurCommunicationServeur'))
					} else if (donnees === 'existe_deja') {
						this.$store.dispatch('modifierMessage', this.$t('interactionExisteDeja'))
					} else if (donnees === 'donnees_corrompues') {
						this.$store.dispatch('modifierMessage', this.$t('donneesCorrompuesImport'))
					} else {
						this.interactions.push(donnees)
						this.filtrer(this.filtre)
						this.$store.dispatch('modifierNotification', this.$t('interactionImportee'))
					}
				}.bind(this)).catch(function () {
					this.fermerModaleImporter()
					this.$store.dispatch('modifierMessage', this.$t('erreurCommunicationServeur'))
				}.bind(this))
			} else {
				this.$store.dispatch('modifierMessage', this.$t('formatFichierPasAccepte'))
				champ.value = ''
			}
		},
		fermerModaleImporter () {
			this.modale = ''
			this.parametresImport.resultats = false
			this.progressionImport = 0
			document.querySelector('#importer-interaction').value = ''
		},
		afficherModaleConfirmation (code, type) {
			if (type !== 'supprimer-compte') {
				this.code = code
			}
			this.modaleConfirmation = type
		},
		fermerModaleConfirmation () {
			this.modaleConfirmation = ''
			this.code = ''
		},
		dupliquer () {
			this.modaleConfirmation = ''
			this.chargement = true
			axios.post(this.hote + '/api/dupliquer-interaction', {
				code: this.code,
				identifiant: this.identifiant
			}).then(function (reponse) {
				this.chargement = false
				const donnees = reponse.data
				if (donnees === 'erreur') {
					this.$store.dispatch('modifierMessage', this.$t('erreurCommunicationServeur'))
				} else if (donnees === 'erreur_code') {
					this.$store.dispatch('modifierMessage', this.$t('codeNonValide'))
				} else if (donnees === 'non_autorise') {
					this.$store.dispatch('modifierMessage', this.$t('actionNonAutorisee'))
				} else {
					this.interactions.push(donnees)
					this.filtrer(this.filtre)
					this.$store.dispatch('modifierNotification', this.$t('interactionDupliquee'))
					this.code = ''
				}
			}.bind(this)).catch(function () {
				this.chargement = false
				this.$store.dispatch('modifierMessage', this.$t('erreurCommunicationServeur'))
			}.bind(this))
		},
		exporter () {
			this.modaleConfirmation = ''
			this.chargement = true
			axios.post(this.hote + '/api/exporter-interaction', {
				code: this.code,
				identifiant: this.identifiant
			}).then(function (reponse) {
				this.chargement = false
				const donnees = reponse.data
				if (donnees === 'erreur') {
					this.$store.dispatch('modifierMessage', this.$t('erreurCommunicationServeur'))
				} else if (donnees === 'erreur_donnees') {
					this.$store.dispatch('modifierMessage', this.$t('aucuneDonneesExport'))
				} else if (donnees === 'erreur_code') {
					this.$store.dispatch('modifierMessage', this.$t('codeNonValide'))
				} else if (donnees === 'non_autorise') {
					this.$store.dispatch('modifierMessage', this.$t('actionNonAutorisee'))
				} else {
					saveAs('/temp/' + donnees, this.code + '.zip')
				}
			}.bind(this)).catch(function () {
				this.chargement = false
				this.$store.dispatch('modifierMessage', this.$t('erreurCommunicationServeur'))
			}.bind(this))
		},
		supprimer () {
			this.modaleConfirmation = ''
			this.chargement = true
			axios.post(this.hote + '/api/supprimer-interaction', {
				identifiant: this.identifiant,
				code: this.code
			}).then(function (reponse) {
				const donnees = reponse.data
				if (donnees === 'erreur') {
					this.$store.dispatch('modifierMessage', this.$t('erreurCommunicationServeur'))
				} else if (donnees === 'erreur_code') {
					this.$store.dispatch('modifierMessage', this.$t('codeNonValide'))
				} else if (donnees === 'non_autorise') {
					this.$store.dispatch('modifierMessage', this.$t('actionNonAutorisee'))
				} else {
					this.interactions.forEach(function (interaction, index) {
						if (interaction.code === this.code) {
							this.interactions.splice(index, 1)
						}
					}.bind(this))
					this.$store.dispatch('modifierNotification', this.$t('interactionSupprimee'))
					this.code = ''
					this.chargement = false
				}
			}.bind(this)).catch(function () {
				this.chargement = false
				this.$store.dispatch('modifierMessage', this.$t('erreurCommunicationServeur'))
			}.bind(this))
		},
		rechercher () {
			const resultats = this.interactions.filter(function (element) {
				return element.titre.toLowerCase().includes(this.requete.toLowerCase())
			}.bind(this))
			this.resultats = resultats
		},
		filtrer (filtre) {
			let interactions = this.interactions
			if (this.requete !== '') {
				interactions = this.resultats
			}
			switch (filtre) {
			case 'date-asc':
				interactions.sort(function (a, b) {
					const dateA = new Date(a.date).getTime()
					const dateB = new Date(b.date).getTime()
					return dateA > dateB ? 1 : -1
				})
				break
			case 'date-desc':
				interactions.sort(function (a, b) {
					const dateA = new Date(a.date).getTime()
					const dateB = new Date(b.date).getTime()
					return dateA < dateB ? 1 : -1
				})
				break
			case 'alpha-asc':
				interactions.sort(function (a, b) {
					const a1 = a.titre.toLowerCase()
					const b1 = b.titre.toLowerCase()
					return a1 < b1 ? -1 : a1 > b1 ? 1 : 0
				})
				break
			case 'alpha-desc':
				interactions.sort(function (a, b) {
					const a1 = a.titre.toLowerCase()
					const b1 = b.titre.toLowerCase()
					return a1 > b1 ? -1 : a1 < b1 ? 1 : 0
				})
				break
			}
			if (this.requete === '') {
				this.interactions = interactions
			} else {
				this.resultats = interactions
			}
		},
		modifierFiltre (filtre) {
			if (this.filtre !== filtre) {
				this.chargement = true
				axios.post(this.hote + '/api/modifier-filtre', {
					identifiant: this.identifiant,
					filtre: filtre
				}).then(function (reponse) {
					this.chargement = false
					const donnees = reponse.data
					if (donnees === 'non_connecte') {
						this.$router.push('/')
					} else {
						this.filtrer(filtre)
						this.$store.dispatch('modifierFiltre', filtre)
						this.$store.dispatch('modifierNotification', this.$t('filtreModifie'))
					}
				}.bind(this)).catch(function () {
					this.chargement = false
					this.$store.dispatch('modifierMessage', this.$t('erreurCommunicationServeur'))
				}.bind(this))
			}
		},
		modifierInformations () {
			const nom = document.querySelector('#nom').value.trim()
			const email = document.querySelector('#email').value.trim()
			if ((nom !== '' && nom !== this.nom) || (email !== '' && email !== this.email)) {
				if (email !== '' && this.$verifierEmail(email) === false) {
					this.$store.dispatch('modifierMessage', this.$t('erreurEmail'))
					return false
				}
				this.chargement = true
				axios.post(this.hote + '/api/modifier-informations-utilisateur', {
					identifiant: this.identifiant,
					nom: nom,
					email: email
				}).then(function (reponse) {
					this.chargement = false
					const donnees = reponse.data
					if (donnees === 'non_connecte') {
						this.$router.push('/')
					} else {
						this.$store.dispatch('modifierInformations', { nom: nom, email: email })
						this.$store.dispatch('modifierNotification', this.$t('informationsModifiees'))
					}
				}.bind(this)).catch(function () {
					this.chargement = false
					this.$store.dispatch('modifierMessage', this.$t('erreurCommunicationServeur'))
				}.bind(this))
			}
		},
		afficherModaleMotDePasse () {
			this.modale = 'motdepasse'
		},
		modifierMotDePasse () {
			const motDePasse = this.motDePasse
			const nouveauMotDePasse = this.nouveauMotDePasse
			const confirmationNouveauMotDePasse = this.confirmationNouveauMotDePasse
			if (nouveauMotDePasse === confirmationNouveauMotDePasse) {
				this.modaleMotDePasse = false
				this.chargement = true
				axios.post(this.hote + '/api/modifier-mot-de-passe-utilisateur', {
					identifiant: this.identifiant,
					motdepasse: motDePasse,
					nouveaumotdepasse: nouveauMotDePasse
				}).then(function (reponse) {
					const donnees = reponse.data
					this.chargement = false
					if (donnees === 'non_connecte') {
						this.$router.push('/')
					} else if (donnees === 'motdepasse_incorrect') {
						this.$store.dispatch('modifierMessage', this.$t('motDePasseActuelPasCorrect'))
					} else if (donnees === 'erreur') {
						this.$store.dispatch('modifierMessage', this.$t('erreurCommunicationServeur'))
					} else {
						this.$store.dispatch('modifierNotification', this.$t('motDePasseModifie'))
						this.fermerModaleMotDePasse()
					}
				}.bind(this)).catch(function () {
					this.chargement = false
					this.$store.dispatch('modifierMessage', this.$t('erreurCommunicationServeur'))
				}.bind(this))
			} else {
				this.$store.dispatch('modifierMessage', this.$t('nouveauxMotsDePasseCorrespondentPas'))
			}
		},
		fermerModaleMotDePasse () {
			this.modale = ''
			this.motDePasse = ''
			this.nouveauMotDePasse = ''
			this.confirmationNouveauMotDePasse = ''
		},
		modifierLangue (langue) {
			if (this.langue !== langue) {
				this.chargement = true
				axios.post(this.hote + '/api/modifier-langue-utilisateur', {
					identifiant: this.identifiant,
					langue: langue
				}).then(function (reponse) {
					const donnees = reponse.data
					if (donnees === 'non_connecte') {
						this.$router.push('/')
					} else {
						this.$i18n.setLocale(langue)
						document.getElementsByTagName('html')[0].setAttribute('lang', langue)
						this.$store.dispatch('modifierLangue', langue)
						this.$store.dispatch('modifierNotification', this.$t('langueModifiee'))
						this.chargement = false
					}
				}.bind(this)).catch(function () {
					this.chargement = false
					this.$store.dispatch('modifierMessage', this.$t('erreurCommunicationServeur'))
				}.bind(this))
			}
		},
		supprimerCompte () {
			this.chargement = true
			axios.post(this.hote + '/api/supprimer-compte', {
				identifiant: this.identifiant
			}).then(function (reponse) {
				const donnees = reponse.data
				if (donnees === 'erreur') {
					this.chargement = false
					this.$store.dispatch('modifierMessage', this.$t('erreurCommunicationServeur'))
				} else {
					this.$store.dispatch('reinitialiser')
					this.$router.push('/')
				}
			}.bind(this)).catch(function () {
				this.chargement = false
				this.$store.dispatch('modifierMessage', this.$t('erreurCommunicationServeur'))
			}.bind(this))
		},
		seDeconnecter () {
			axios.post(this.hote + '/api/se-deconnecter').then(function () {
				this.$store.dispatch('reinitialiser')
				this.$router.push('/')
			}.bind(this)).catch(function () {
				this.$store.dispatch('modifierMessage', this.$t('erreurCommunicationServeur'))
			}.bind(this))
		}
	}
}
</script>

<style scoped>
#parametres {
	display: flex;
	justify-content: flex-end;
	align-items: center;
	font-size: 24px;
	margin-left: 20px;
	cursor: pointer;
}

#parametres span:last-child {
	margin-left: 20px;
	color: #ff6259;
}

#boutons {
	display: flex;
	justify-content: center;
	flex-wrap: wrap;
	margin-bottom: 25px;
	padding: 0 1.5rem;
}

#bouton-importer,
#bouton-creer {
	display: inline-flex;
	justify-content: center;
	align-items: center;
	width: 150px;
    line-height: 1;
    font-size: 16px;
    font-weight: 700;
    text-transform: uppercase;
	padding: 1em 1.5em;
    border: 2px solid #00ced1;
	border-radius: 2em;
	margin-bottom: 15px;
	background: #46fbff;
	cursor: pointer;
    transition: all ease-in 0.1s;
}

#bouton-creer {
	margin-right: 1em;
}

#bouton-importer:hover,
#bouton-creer:hover {
	text-shadow: 1px 1px 1px rgba(0, 0, 0, 0.2);
	background: #fff;
}

.vide {
	text-align: center;
	font-size: 16px;
    padding: 25px 0;
    border-top: 1px dotted #ddd;
    border-bottom: 1px dotted #ddd;
    margin: 25px 0 40px;
}

#filtrer {
	display: flex;
	justify-content: flex-end;
	align-items: center;
	margin-bottom: 20px;
	width: 100%;
}

#filtrer .rechercher,
#filtrer .filtrer {
	display: flex;
	align-items: center;
	width: 48%;
}

#filtrer .rechercher {
	margin-right: 4%;
}

#filtrer .filtrer span,
#filtrer .rechercher span {
	font-size: 24px;
	margin-right: 10px;
}

#filtrer .filtrer select,
#filtrer .rechercher input {
	width: calc(100% - 34px);
}

#filtrer select,
#filtrer input[type="search"] {
	font-size: 16px;
	border: 1px solid #ddd;
	border-radius: 4px;
	padding: 10px 15px;
	text-align: left;
}

#filtrer select {
	background: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" height="14" viewBox="0 0 29 14" width="29"><path fill="%23000000" d="M9.37727 3.625l5.08154 6.93523L19.54036 3.625" /></svg>') center right no-repeat;
	padding-right: 30px;
}

.interactions {
	margin-bottom: 40px;
}

.interaction {
	border-top: 1px solid #ddd;
	padding: 20px 0;
	display: flex;
	align-items: center;
}

.interaction:last-child {
	border-bottom: 1px solid #ddd;
}

.interaction.ouvert .type {
	background: #232f3c;
	color: #fff;
}

.interaction .type {
	width: 40px;
	height: 40px;
	line-height: 40px;
	border-radius: 50%;
	background: #00ced1;
	text-align: center;
	font-weight: 700;
	font-size: 20px;
	margin-right: 20px;
}

.interaction .meta {
	width: calc(100% - 182px);
}

.interaction .titre {
	font-size: 18px;
	font-weight: 700;
}

.interaction .date {
	font-size: 12px;
	color: #777;
}

.interaction .actions {
	display: flex;
	margin-left: 5px;
}

.interaction .actions span {
	margin-left: 15px;
	font-size: 24px;
	cursor: pointer;
}

.interaction .actions span.supprimer {
	color: #ff6259;
}

.progression .chargement {
	border-top: 4px solid #00ced1;
	margin-top: 10px;
}

#modale-importer label.bouton {
	width: 100%;
	text-align: center;
	margin-bottom: 0;
}

#modale-importer .contenu {
	font-size: 0;
}

.modale .conteneur-interrupteur {
	display: flex;
	justify-content: space-between;
	margin-bottom: 20px;
	line-height: 22px;
}

.modale .conteneur-interrupteur > span {
	font-size: 16px;
}

.modale .bouton-interrupteur {
	position: relative;
	display: inline-block!important;
	width: 38px!important;
	height: 22px;
	margin: 0;
}

.modale .bouton-interrupteur input {
	opacity: 0;
	width: 0;
	height: 0;
}

.modale .bouton-interrupteur .barre {
	position: absolute;
	cursor: pointer;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	background-color: #ccc;
	transition: 0.3s;
	border-radius: 30px;
}

.modale .bouton-interrupteur .barre:before {
	position: absolute;
	content: '';
	height: 16px;
	width: 16px;
	left: 3px;
	bottom: 3px;
	background-color: #fff;
	transition: 0.3s;
	border-radius: 50%;
}

.modale .bouton-interrupteur input:checked + .barre {
	background-color: #00ced1;
}

.modale .bouton-interrupteur input:focus + .barre {
	box-shadow: 0 0 1px #00ced1;
}

.modale .bouton-interrupteur input:checked + .barre:before {
	transform: translateX(16px);
}

#modale-confirmation {
	text-align: center;
	max-width: 500px;
}

#modale-confirmation .conteneur {
	padding: 30px 25px;
}

#modale-parametres .bouton {
	width: 100%;
}

#modale-parametres #nom {
	margin-bottom: 10px;
}

#modale-parametres .modifier {
	margin-bottom: 20px;
}

#modale-parametres .supprimer .bouton {
	color: #fff;
	background: #ff6259;
	margin-bottom: 0;
}

#modale-parametres .supprimer .bouton:hover {
	background: #d70b00;
}

@media screen and (orientation: landscape) and (max-height: 359px) {
	#modale-creer {
		height: 90%;
	}
}

@media screen and (orientation: landscape) and (max-height: 479px) {
	#modale-parametres,
	#modale-motdepasse {
		height: 90%;
	}
}

@media screen and (max-width: 399px) {
	#bouton-importer,
	#bouton-creer {
		width: 200px;
	}

	#bouton-creer {
		margin-right: 0;
	}

	#filtrer {
		flex-wrap: wrap;
	}

	#filtrer .rechercher {
		width: 100%;
		margin-right: 0;
		margin-bottom: 15px;
	}

	#filtrer .filtrer {
		width: 100%;
		margin-right: 0;
		margin-bottom: 15px;
	}
}

@media screen and (max-width: 599px) {
	.interaction {
		flex-wrap: wrap;
		padding: 20px 0 10px;
	}

	.interaction .meta {
		width: calc(100% - 60px);
	}

	.interaction .actions {
		width: 100%;
		justify-content: space-around;
		margin-left: 0;
		margin-top: 20px;
		padding-top: 10px;
		border-top: 1px dotted #ddd;
	}

	.interaction .actions span {
		margin-left: 0;
	}
}
</style>

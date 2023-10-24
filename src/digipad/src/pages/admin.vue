<template>
	<main id="page" v-if="acces">
		<div id="accueil">
			<div id="langues">
				<span class="bouton" role="button" tabindex="0" :class="{'selectionne': langue === 'fr'}" @click="modifierLangue('fr')">FR</span>
				<span class="bouton" role="button" tabindex="0" :class="{'selectionne': langue === 'es'}" @click="modifierLangue('es')">ES</span>
				<span class="bouton" role="button" tabindex="0" :class="{'selectionne': langue === 'it'}" @click="modifierLangue('it')">IT</span>
				<span class="bouton" role="button" tabindex="0" :class="{'selectionne': langue === 'hr'}" @click="modifierLangue('hr')">HR</span>
				<span class="bouton" role="button" tabindex="0" :class="{'selectionne': langue === 'en'}" @click="modifierLangue('en')">EN</span>
			</div>
			<div id="conteneur">
				<h1>
					<span>{{ $t('informationsGenerales') }}</span>
				</h1>
				<div class="conteneur">
					<div><b>{{ $t('nombrePads') }} :</b> {{ nombrePads }}</div>
					<div><b>{{ $t('nombreUtilisateurs') }} :</b> {{ nombreUtilisateurs }}</div>
					<div><b>{{ $t('nombreComptes') }} :</b> {{ nombreComptes }}</div>
					<div><b>{{ $t('nombreSessions') }} :</b> {{ nombreSessions }}</div>
				</div>
				<h1>
					<span>{{ $t('modifierMotDePasseUtilisateur') }}</span>
				</h1>
				<div class="conteneur">
					<label>{{ $t('identifiant') }}</label>
					<input type="text" :value="identifiant" @input="identifiant = $event.target.value">
				</div>
				<div class="conteneur">
					<label>{{ $t('email') }}</label>
					<input type="text" :value="email" @input="email = $event.target.value">
				</div>
				<div class="conteneur">
					<label>{{ $t('motDePasse') }}</label>
					<input type="text" maxlength="48" :value="motdepasse" @input="motdepasse = $event.target.value">
				</div>
				<div class="actions">
					<span class="bouton" role="button" tabindex="0" @click="modifierMotDePasse">{{ $t('valider') }}</span>
				</div>
				<h1>
					<span>{{ $t('recupererDonneesPad') }}</span>
				</h1>
				<div class="conteneur">
					<label>{{ $t('numeroPad') }}</label>
					<input type="number" :value="padId" @input="padId = $event.target.value">
				</div>
				<div class="conteneur" v-if="donneesPad !== ''">
					<span class="donnees">{{ donneesPad }}</span>
				</div>
				<div class="actions">
					<span class="bouton" role="button" tabindex="0" @click="recupererDonneesPad">{{ $t('valider') }}</span>
				</div>
				<h1>
					<span>{{ $t('modifierDonneesPad') }}</span>
				</h1>
				<div class="conteneur">
					<label>{{ $t('numeroPad') }}</label>
					<input type="number" :value="padIdM" @input="padIdM = $event.target.value">
				</div>
				<div class="conteneur">
					<label>{{ $t('champ') }}</label>
					<select @change="champ = $event.target.value">
						<option value="" :selected="champ === ''">-</option>
						<option value="code" :selected="champ === 'code'">{{ $t('codeAcces') }}</option>
						<option value="motdepasse" :selected="champ === 'motdepasse'">{{ $t('motDePasse') }}</option>
					</select>
				</div>
				<div class="conteneur">
					<label>{{ $t('valeur') }}</label>
					<input type="text" :value="valeur" :maxlength="4" @input="valeur = $event.target.value" v-if="champ === 'code'">
					<input type="text" :value="valeur" @input="valeur = $event.target.value" v-else>
				</div>
				<div class="actions">
					<span class="bouton" role="button" tabindex="0" @click="modifierDonneesPad">{{ $t('valider') }}</span>
				</div>
				<h1>
					<span>{{ $t('supprimerPad') }}</span>
				</h1>
				<div class="conteneur">
					<label>{{ $t('numeroPad') }}</label>
					<input type="number" :value="padIdS" @input="padIdS = $event.target.value">
				</div>
				<div class="actions">
					<span class="bouton" role="button" tabindex="0" @click="modale = 'supprimer-pad'">{{ $t('valider') }}</span>
				</div>
				<h1>
					<span>{{ $t('supprimerCompte') }}</span>
				</h1>
				<div class="conteneur">
					<label>{{ $t('identifiant') }}</label>
					<input type="text" :value="identifiantS" @input="identifiantS = $event.target.value">
				</div>
				<div class="actions">
					<span class="bouton" role="button" tabindex="0" @click="modale = 'supprimer-compte'">{{ $t('valider') }}</span>
				</div>
			</div>
		</div>

		<div class="conteneur-modale alerte" v-if="modale !== ''">
			<div class="modale">
				<div class="conteneur">
					<div class="contenu">
						<div class="message" v-html="$t('confirmationSupprimerPad')" v-if="modale === 'supprimer-pad'" />
						<div class="message" v-html="$t('confirmationSupprimerCompteAdmin')" v-else-if="modale === 'supprimer-compte'" />
						<div class="actions">
							<span role="button" tabindex="0" class="bouton" @click="modale = ''">{{ $t('non') }}</span>
							<span role="button" tabindex="0" class="bouton" @click="supprimerPad" v-if="modale === 'supprimer-pad'">{{ $t('oui') }}</span>
							<span role="button" tabindex="0" class="bouton" @click="supprimerCompte" v-else-if="modale === 'supprimer-compte'">{{ $t('oui') }}</span>
						</div>
					</div>
				</div>
			</div>
		</div>
	</main>
</template>

<script>
import axios from 'axios'

export default {
	name: 'Admin',
	async asyncData (context) {
		const { data } = await axios.post(context.store.state.hote + '/api/recuperer-donnees-admin', {
			headers: { 'Content-Type': 'application/json' }
		})
		if (data !== 'erreur') {
			return {
				nombrePads: data.pads,
				nombreUtilisateurs: data.utilisateurs,
				nombreSessions: data.sessions,
				nombreComptes: data.comptes
			}
		}
	},
	data () {
		return {
			acces: false,
			admin: '',
			modale: '',
			identifiant: '',
			email: '',
			motdepasse: '',
			padId: '',
			padIdS: '',
			padIdM: '',
			donneesPad: '',
			identifiantS: '',
			champ: '',
			valeur: ''
		}
	},
	head () {
		return {
			title: 'Admin - Digipad by La Digitale'
		}
	},
	computed: {
		hote () {
			return this.$store.state.hote
		},
		langue () {
			return this.$store.state.langue
		}
	},
	created () {
		this.$i18n.setLocale(this.langue)
	},
	mounted () {
		const motdepasse = prompt(this.$t('motDePasse'), '')
		if (motdepasse === process.env.adminPassword) {
			this.acces = true
			this.admin = motdepasse
		}
	},
	methods: {
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
		modifierMotDePasse () {
			if (this.motdepasse !== '' && (this.identifiant !== '' || this.email !== '')) {
				this.chargement = true
				axios.post(this.hote + '/api/modifier-mot-de-passe-admin', {
					admin: this.admin,
					identifiant: this.identifiant,
					email: this.email,
					motdepasse: this.motdepasse
				}).then(function (reponse) {
					this.chargement = false
					const donnees = reponse.data
					if (donnees === 'erreur') {
						this.$store.dispatch('modifierAlerte', this.$t('erreurActionServeur'))
					} else if (donnees === 'identifiant_non_valide') {
						this.$store.dispatch('modifierAlerte', this.$t('identifiantNonValide'))
					} else if (donnees === 'email_non_valide') {
						this.$store.dispatch('modifierAlerte', this.$t('erreurEmail'))
					} else {
						this.$store.dispatch('modifierMessage', this.$t('motDePasseModifie'))
					}
					this.identifiant = ''
					this.motdepasse = ''
					this.email = ''
				}.bind(this)).catch(function () {
					this.chargement = false
					this.$store.dispatch('modifierAlerte', this.$t('erreurCommunicationServeur'))
				}.bind(this))
			}
		},
		recupererDonneesPad () {
			if (this.padId !== '') {
				this.chargement = true
				axios.post(this.hote + '/api/recuperer-donnees-pad-admin', {
					padId: this.padId
				}).then(function (reponse) {
					this.chargement = false
					const donnees = reponse.data
					if (donnees === 'erreur') {
						this.$store.dispatch('modifierAlerte', this.$t('erreurActionServeur'))
					} else {
						this.donneesPad = donnees
					}
					this.padId = ''
				}.bind(this)).catch(function () {
					this.chargement = false
					this.$store.dispatch('modifierAlerte', this.$t('erreurCommunicationServeur'))
				}.bind(this))
			}
		},
		modifierDonneesPad () {
			if (this.padIdM !== '' && this.champ !== '' && this.valeur !== '') {
				this.chargement = true
				axios.post(this.hote + '/api/modifier-donnees-pad-admin', {
					padId: this.padIdM,
					champ: this.champ,
					valeur: this.valeur
				}).then(function (reponse) {
					this.chargement = false
					const donnees = reponse.data
					if (donnees === 'erreur') {
						this.$store.dispatch('modifierAlerte', this.$t('erreurActionServeur'))
					} else {
						this.$store.dispatch('modifierMessage', this.$t('donneesModifiees'))
					}
					this.padIdM = ''
					this.champ = ''
					this.valeur = ''
				}.bind(this)).catch(function () {
					this.chargement = false
					this.$store.dispatch('modifierAlerte', this.$t('erreurCommunicationServeur'))
				}.bind(this))
			}
		},
		supprimerPad () {
			if (this.padIdS !== '') {
				this.modale = ''
				this.chargement = true
				axios.post(this.hote + '/api/recuperer-donnees-pad-admin', {
					padId: this.padIdS
				}).then(function (reponse) {
					this.chargement = false
					const donnees = reponse.data
					if (donnees === 'erreur') {
						this.$store.dispatch('modifierAlerte', this.$t('erreurActionServeur'))
					} else {
						const identifiant = donnees.identifiant
						axios.post(this.hote + '/api/supprimer-pad', {
							padId: this.padIdS,
							type: 'pad',
							identifiant: identifiant
						}).then(function (reponse) {
							this.chargement = false
							const donnees = reponse.data
							if (donnees === 'erreur_suppression') {
								this.$store.dispatch('modifierAlerte', this.$t('erreurSuppressionPad'))
							} else {
								this.$store.dispatch('modifierMessage', this.$t('padSupprime'))
								this.padIdS = ''
							}
						}.bind(this)).catch(function () {
							this.chargement = false
							this.padIdS = ''
							this.$store.dispatch('modifierAlerte', this.$t('erreurCommunicationServeur'))
						}.bind(this))
					}
				}.bind(this)).catch(function () {
					this.chargement = false
					this.padIdS = ''
					this.$store.dispatch('modifierAlerte', this.$t('erreurCommunicationServeur'))
				}.bind(this))
			}
		},
		supprimerCompte () {
			if (this.identifiantS !== '') {
				this.modale = ''
				this.chargement = true
				axios.post(this.hote + '/api/supprimer-compte', {
					identifiant: this.identifiantS,
					type: 'admin'
				}).then(function (reponse) {
					this.chargement = false
					const donnees = reponse.data
					if (donnees === 'erreur') {
						this.$store.dispatch('modifierAlerte', this.$t('erreurActionServeur'))
					} else {
						this.$store.dispatch('modifierMessage', this.$t('compteSupprime'))
						this.identifiantS = ''
					}
				}.bind(this)).catch(function () {
					this.chargement = false
					this.$store.dispatch('modifierAlerte', this.$t('erreurCommunicationServeur'))
				}.bind(this))
			}
		}
	}
}
</script>

<style scoped>
#page,
#accueil {
	width: 100%;
	height: 100%;
}

#page {
	overflow: auto;
}

#langues {
	position: fixed;
	display: flex;
	top: 1rem;
	right: 0.5rem;
	z-index: 10;
}

#langues span {
    display: flex;
    justify-content: center;
	align-items: center;
	font-size: 1.4rem;
    width: 3rem;
	height: 3rem;
	background: #fff;
    border-radius: 50%;
    border: 1px solid #ddd;
    margin-right: 1rem;
	cursor: pointer;
}

#langues span.selectionne {
    background: #242f3d;
    color: #fff;
    border: 1px solid #222;
    cursor: default;
}

#conteneur {
    width: 100%;
	max-width: 500px;
	margin: auto;
	padding-top: 5em;
	padding-bottom: 5em;
}

#conteneur h1 {
    font-family: 'HKGroteskWide-ExtraBold', 'HKGrotesk-ExtraBold', sans-serif;
    font-size: 2rem;
	font-weight: 900;
	margin: 0 1.5rem 0.85em;
    line-height: 1.4;
}

#conteneur .conteneur {
    margin: 2rem 1.5rem;
}

#conteneur .conteneur-bouton {
	font-size: 0;
}

#conteneur .conteneur label {
    font-size: 14px;
    display: block;
	margin-bottom: 10px;
	line-height: 1.15;
	font-weight: 700;
}

#conteneur .conteneur select,
#conteneur .conteneur input {
	display: block;
    width: 100%;
    font-size: 16px;
    border: 1px solid #ddd;
    border-radius: 4px;
	padding: 7px 15px;
	line-height: 1.5;
}

#conteneur .conteneur select {
	background: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" height="14" viewBox="0 0 29 14" width="29"><path fill="%23000000" d="M9.37727 3.625l5.08154 6.93523L19.54036 3.625" /></svg>') center right no-repeat;
	padding-right: 30px;
}

#conteneur .conteneur div {
    margin-bottom: 10px;
}

#conteneur .conteneur div:last-child {
    margin-bottom: 3rem;
}

#conteneur .conteneur .donnees {
	user-select: text!important;
	-webkit-user-select: text!important;
	-webkit-touch-callout: default!important;
}

#conteneur .actions {
	display: flex;
	justify-content: center;
	flex-wrap: wrap;
	margin-bottom: 4rem;
}

#conteneur .actions .bouton {
	display: inline-block;
	width: 180px;
    line-height: 1;
    font-size: 1em;
    font-weight: 700;
    text-transform: uppercase;
	text-align: center;
	padding: 1em 1.5em;
	margin-right: 1em;
    border: 2px solid #00ced1;
	border-radius: 2em;
    background: #46fbff;
	cursor: pointer;
    transition: all 0.1s ease-in;
}

#conteneur .actions .bouton:hover {
    color: #fff;
	text-shadow: 1px 1px 1px rgba(0, 0, 0, 0.3);
	background: #00ced1;
}

#conteneur .actions .bouton:last-child {
	margin-right: 0;
}

@media screen and (max-width: 359px) {
	#conteneur .actions .bouton {
		font-size: 0.75em!important;
		width: 130px;
		padding: 1em 0.5em;
	}
}

@media screen and (min-width: 360px) and (max-width: 599px) {
	#conteneur .actions .bouton {
		width: 145px;
	}
}

@media screen and (max-width: 399px) {
	#conteneur h1 span {
		display: block;
	}
}

@media screen and (max-width: 599px) {
	#conteneur h1 {
		font-size: 2em;
		margin-bottom: 1em;
	}

	#conteneur .actions .bouton {
		font-size: 0.85em;
		margin-bottom: 1em;
	}
}

@media screen and (max-width: 850px) and (max-height: 500px) {
	#conteneur h1 {
		font-size: 2em;
		margin-bottom: 1em;
	}

	#conteneur .actions .bouton {
		font-size: 0.85em!important;
	}
}
</style>

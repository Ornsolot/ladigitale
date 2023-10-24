<template>
	<main id="page">
		<div id="accueil" :style="{'background-image': 'url(./img/fond.png)'}">
			<div id="langues">
				<span class="bouton" role="button" tabindex="0" :class="{'selectionne': langue === 'fr'}" @click="modifierLangue('fr')">FR</span>
				<span class="bouton" role="button" tabindex="0" :class="{'selectionne': langue === 'es'}" @click="modifierLangue('es')">ES</span>
				<span class="bouton" role="button" tabindex="0" :class="{'selectionne': langue === 'it'}" @click="modifierLangue('it')">IT</span>
				<span class="bouton" role="button" tabindex="0" :class="{'selectionne': langue === 'hr'}" @click="modifierLangue('hr')">HR</span>
				<span class="bouton" role="button" tabindex="0" :class="{'selectionne': langue === 'en'}" @click="modifierLangue('en')">EN</span>
			</div>
			<div id="conteneur">
				<div id="contenu">
					<h1>
						<span>Digipad</span> <span>by La Digitale</span>
					</h1>
					<div>
						<p v-html="$t('slogan')" />
						<div id="actions">
							<span class="bouton" role="button" tabindex="0" @click="afficherModaleConnexion">{{ $t('seConnecter') }}</span>
							<span class="bouton" role="button" tabindex="1" @click="afficherModaleInscription">{{ $t('sInscrire') }}</span>
							<span class="bouton" role="button" tabindex="2" @click="afficherModaleCreer">{{ $t('creerPad') }}</span>
						</div>
					</div>
				</div>
				<div id="credits">
					<p><span class="mentions-legales" @click="modaleMentionsLegales = true">{{ $t('mentionsLegales') }}</span> - <a href="https://opencollective.com/ladigitale" target="_blank">{{ $t('soutien') }} ❤️.</a></p>
					<p>{{ new Date().getFullYear() }} - <a href="https://ladigitale.dev" target="_blank" rel="noreferrer">La Digitale</a> - <a href="https://codeberg.org/ladigitale/digipad" target="_blank" rel="noreferrer">{{ $t('codeSource') }}</a> - <span class="hub" @click="ouvrirHub"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#001d1d" width="36px" height="36px"><path d="M0 0h24v24H0z" fill="none" /><path d="M4 8h4V4H4v4zm6 12h4v-4h-4v4zm-6 0h4v-4H4v4zm0-6h4v-4H4v4zm6 0h4v-4h-4v4zm6-10v4h4V4h-4zm-6 4h4V4h-4v4zm6 6h4v-4h-4v4zm0 6h4v-4h-4v4z" /></svg></span></p>
				</div>
			</div>
		</div>

		<div class="conteneur-modale" v-if="modaleCreer">
			<div id="creation" class="modale">
				<div class="en-tete">
					<span class="titre">{{ $t('creerPad') }}</span>
					<span role="button" tabindex="0" class="fermer" @click="fermerModaleCreer"><i class="material-icons">close</i></span>
				</div>
				<div class="conteneur">
					<div class="contenu">
						<label for="champ-titre-pad">{{ $t('titrePad') }}</label>
						<input id="champ-titre-pad" type="text" maxlength="48" :value="titre" @input="titre = $event.target.value">
						<label for="champ-motdepasse-pad">{{ $t('motDePassePad') }}</label>
						<p class="information">{{ $t('infoMotDePassePad') }}</p>
						<input id="champ-motdepasse-pad" type="text" maxlength="48" :value="motDePassePad" @input="motDePassePad = $event.target.value" @keydown.enter="creerPad">
						<div class="actions">
							<span role="button" tabindex="0" class="bouton" @click="creerPad" v-if="!chargement">{{ $t('creer') }}</span>
							<div class="conteneur-chargement" v-else>
								<div class="chargement" />
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>

		<div class="conteneur-modale" v-if="modaleConnexion">
			<div id="connexion" class="modale">
				<div class="en-tete">
					<span class="titre">{{ $t('seConnecter') }}</span>
					<span role="button" tabindex="0" class="fermer" @click="fermerModaleConnexion"><i class="material-icons">close</i></span>
				</div>
				<div class="conteneur">
					<div class="contenu">
						<label for="champ-identifiant">{{ $t('identifiant') }}</label>
						<input id="champ-identifiant" type="text" maxlength="48" :value="identifiant" @input="identifiant = $event.target.value">
						<label for="champ-motdepasse">{{ $t('motDePasse') }}</label>
						<input id="champ-motdepasse" type="password" maxlength="48" :value="motDePasse" @input="motDePasse = $event.target.value" @keydown.enter="seConnecter">
						<div class="mot-de-passe-oublie" @click="afficherModaleMotDePasseOublie" v-html="$t('motDePasseOublie')" />
						<div class="actions">
							<span role="button" tabindex="0" class="bouton" @click="seConnecter" v-if="!chargement">{{ $t('valider') }}</span>
							<div class="conteneur-chargement" v-else>
								<div class="chargement" />
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>

		<div class="conteneur-modale" v-if="modaleMotDePasseOublie">
			<div class="modale">
				<div class="en-tete">
					<span class="titre">{{ $t('motDePasseOublie') }}</span>
					<span class="fermer" @click="fermerModaleMotDePasseOublie"><i class="material-icons">close</i></span>
				</div>
				<div class="conteneur">
					<div class="contenu">
						<label for="champ-identifiant">{{ $t('identifiant') }}</label>
						<input id="champ-identifiant" type="text" maxlength="48" :value="identifiant" @input="identifiant = $event.target.value">
						<label for="champ-email">{{ $t('email') }}</label>
						<input id="champ-email" type="text" :value="email" @input="email = $event.target.value" @keydown.enter="envoyerMotDePasse">
						<div class="actions">
							<span role="button" tabindex="0" class="bouton" @click="envoyerMotDePasse" v-if="!chargement">{{ $t('valider') }}</span>
							<div class="conteneur-chargement" v-else>
								<div class="chargement" />
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>

		<div class="conteneur-modale" v-if="modaleInscription">
			<div id="inscription" class="modale">
				<div class="en-tete">
					<span class="titre">{{ $t('sInscrire') }}</span>
					<span class="fermer" @click="fermerModaleInscription"><i class="material-icons">close</i></span>
				</div>
				<div class="conteneur">
					<div class="contenu">
						<label for="champ-identifiant">{{ $t('identifiant') }}</label>
						<p class="information">{{ $t('infoIdentifiant') }}</p>
						<input id="champ-identifiant" type="text" maxlength="48" :value="identifiant" @input="identifiant = $event.target.value">
						<label for="champ-motdepasse">{{ $t('motDePasse') }}</label>
						<p class="information">{{ $t('infoMotDePasse') }}</p>
						<input id="champ-motdepasse" type="password" maxlength="48" :value="motDePasse" @input="motDePasse = $event.target.value">
						<label for="champ-confirmation-motdepasse">{{ $t('confirmationMotDePasse') }}</label>
						<input id="champ-confirmation-motdepasse" type="password" maxlength="48" :value="confirmationMotDePasse" @input="confirmationMotDePasse = $event.target.value" @keydown.enter="sInscrire">
						<div class="actions">
							<span role="button" tabindex="0" class="bouton" @click="sInscrire" v-if="!chargement">{{ $t('valider') }}</span>
							<div class="conteneur-chargement" v-else>
								<div class="chargement" />
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>

		<div class="conteneur-modale" v-if="modaleMentionsLegales">
			<div id="mentions-legales" class="modale">
				<div class="en-tete">
					<span class="titre">{{ $t('mentionsLegales') }}</span>
					<span class="fermer" @click="modaleMentionsLegales = false"><i class="material-icons">close</i></span>
				</div>
				<div class="conteneur">
					<div class="contenu">
						<p>{{ $t('mentionsLegales1') }}</p>
						<label>{{ $t('administrationEtDeveloppement') }}</label>
						<p>La Digitale - Emmanuel ZIMMERT</p>
						<label>{{ $t('contact') }}</label>
						<p>{{ $t('courriel') }} ez@ladigitale.dev – {{ $t('siteWeb') }} https://ladigitale.dev</p>
						<label>{{ $t('proprieteIntellectuelle') }}</label>
						<p>{{ $t('mentionsLegales2') }}</p>
						<p>{{ $t('mentionsLegales3') }}</p>
						<label>{{ $t('politiqueConfidentialite') }}</label>
						<p>{{ $t('mentionsLegales4') }}</p>
						<p>{{ $t('mentionsLegales5') }}</p>
						<label>{{ $t('hebergement') }}</label>
						<p>{{ $t('mentionsLegales6') }}</p>
					</div>
				</div>
			</div>
		</div>

		<div id="hub" :class="{'ouvert': hub}">
			<span @click="fermerHub"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#fff" width="36px" height="36px"><path d="M0 0h24v24H0z" fill="none" /><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" /></svg></span>
			<iframe src="https://ladigitale.dev/hub.html" />
		</div>
	</main>
</template>

<script>
import axios from 'axios'

export default {
	name: 'Accueil',
	data () {
		return {
			chargement: false,
			titre: '',
			motDePassePad: '',
			modaleCreer: false,
			modaleConnexion: false,
			modaleInscription: false,
			modaleMotDePasseOublie: false,
			identifiant: '',
			motDePasse: '',
			confirmationMotDePasse: '',
			email: '',
			modaleMentionsLegales: false,
			hub: false
		}
	},
	head () {
		return {
			title: 'Digipad by La Digitale'
		}
	},
	computed: {
		hote () {
			return this.$store.state.hote
		},
		langue () {
			return this.$store.state.langue
		},
		langues () {
			return this.$store.state.langues
		}
	},
	created () {
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
		setTimeout(function () {
			document.getElementsByTagName('html')[0].setAttribute('lang', this.langue)
		}.bind(this), 100)
	},
	methods: {
		afficherModaleCreer () {
			this.modaleCreer = true
			this.$nextTick(function () {
				document.querySelector('input').focus()
			})
		},
		creerPad () {
			if (this.titre.trim() !== '' && this.motDePassePad.trim() !== '') {
				this.chargement = true
				axios.post(this.hote + '/api/creer-pad-sans-compte', {
					titre: this.titre.trim(),
					motdepasse: this.motDePassePad.trim()
				}).then(function (reponse) {
					const donnees = reponse.data
					if (donnees === 'erreur_creation') {
						this.chargement = false
						this.$store.dispatch('modifierAlerte', this.$t('erreurCreationPad'))
					} else {
						this.$store.dispatch('modifierUtilisateur', donnees)
						window.location = '/p/' + donnees.id + '/' + donnees.token
					}
				}.bind(this)).catch(function () {
					this.chargement = false
					this.$store.dispatch('modifierAlerte', this.$t('erreurCommunicationServeur'))
				}.bind(this))
			} else {
				this.$store.dispatch('modifierAlerte', this.$t('remplirChamps'))
			}
		},
		fermerModaleCreer () {
			this.modaleCreer = false
			this.titre = ''
		},
		afficherModaleConnexion () {
			this.modaleConnexion = true
			this.$nextTick(function () {
				document.querySelector('input').focus()
			})
		},
		seConnecter () {
			if (this.identifiant !== '' && this.motDePasse !== '') {
				this.chargement = true
				axios.post(this.hote + '/api/connexion', {
					identifiant: this.identifiant,
					motdepasse: this.motDePasse
				}).then(function (reponse) {
					this.chargement = false
					const donnees = reponse.data
					if (donnees === 'erreur_connexion') {
						this.$store.dispatch('modifierAlerte', this.$t('informationsConnexionIncorrectes'))
					} else {
						this.$store.dispatch('modifierUtilisateur', donnees)
						this.$router.push('/u/' + donnees.identifiant)
					}
				}.bind(this)).catch(function () {
					this.chargement = false
					this.$store.dispatch('modifierAlerte', this.$t('erreurCommunicationServeur'))
				}.bind(this))
			} else {
				this.$store.dispatch('modifierAlerte', this.$t('remplirChamps'))
			}
		},
		afficherModaleInscription () {
			this.modaleInscription = true
			this.$nextTick(function () {
				document.querySelector('input').focus()
			})
		},
		sInscrire () {
			if (this.identifiant.trim() !== '' && this.motDePasse.trim() !== '' && this.motDePasse.trim() === this.confirmationMotDePasse.trim()) {
				this.chargement = true
				axios.post(this.hote + '/api/inscription', {
					identifiant: this.identifiant.trim(),
					motdepasse: this.motDePasse.trim()
				}).then(function (reponse) {
					this.chargement = false
					const donnees = reponse.data
					if (donnees === 'utilisateur_existe_deja') {
						this.$store.dispatch('modifierAlerte', this.$t('identifiantExisteDeja', { identifiant: this.identifiant }))
					} else {
						this.$store.dispatch('modifierUtilisateur', donnees)
						this.$router.push('/u/' + donnees.identifiant)
					}
				}.bind(this)).catch(function () {
					this.chargement = false
					this.$store.dispatch('modifierAlerte', this.$t('erreurCommunicationServeur'))
				}.bind(this))
			} else if (this.identifiant.trim() === '' || this.motDePasse.trim() === '' || this.confirmationMotDePasse.trim() === '') {
				this.$store.dispatch('modifierAlerte', this.$t('remplirChamps'))
			} else if (this.motDePasse.trim() !== this.confirmationMotDePasse.trim()) {
				this.$store.dispatch('modifierAlerte', this.$t('motsDePassePasIdentiques'))
			}
		},
		afficherModaleMotDePasseOublie () {
			this.motDePasse = ''
			this.modaleConnexion = false
			this.modaleMotDePasseOublie = true
			this.$nextTick(function () {
				document.querySelector('input').focus()
			})
		},
		envoyerMotDePasse () {
			if (this.identifiant.trim() !== '' && this.email.trim() !== '' && this.$verifierEmail(this.email.trim()) === true) {
				this.chargement = true
				axios.post(this.hote + '/api/mot-de-passe-oublie', {
					identifiant: this.identifiant.trim(),
					email: this.email.trim()
				}).then(function (reponse) {
					this.chargement = false
					const donnees = reponse.data
					if (donnees === 'erreur') {
						this.$store.dispatch('modifierAlerte', this.$t('erreurCommunicationServeur'))
					} else if (donnees === 'identifiant_invalide') {
						this.$store.dispatch('modifierAlerte', this.$t('identifiantNonValide'))
					} else if (donnees === 'email_invalide') {
						this.$store.dispatch('modifierAlerte', this.$t('emailNonValide'))
					} else {
						this.fermerModaleMotDePasseOublie()
						this.$store.dispatch('modifierMessage', this.$t('emailEnvoye'))
					}
				}.bind(this)).catch(function () {
					this.chargement = false
					this.$store.dispatch('modifierAlerte', this.$t('erreurCommunicationServeur'))
				}.bind(this))
			} else if (this.identifiant.trim() === '' || this.email.trim() === '') {
				this.$store.dispatch('modifierAlerte', this.$t('remplirChamps'))
			} else if (this.$verifierEmail(this.email.trim()) === false) {
				this.$store.dispatch('modifierAlerte', this.$t('erreurEmail'))
			}
		},
		fermerModaleConnexion () {
			this.modaleConnexion = false
			this.identifiant = ''
			this.motDePasse = ''
		},
		fermerModaleInscription () {
			this.modaleInscription = false
			this.identifiant = ''
			this.motDePasse = ''
			this.confirmationMotDePasse = ''
		},
		fermerModaleMotDePasseOublie () {
			this.modaleMotDePasseOublie = false
			this.identifiant = ''
			this.email = ''
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
		ouvrirHub () {
			this.hub = true
		},
		fermerHub () {
			this.hub = false
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

#accueil {
	background-size: cover;
	background-position: center;
	background-repeat: no-repeat;
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
	position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    width: 100%;
    height: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
	flex-wrap: wrap;
	overflow: auto;
}

#contenu {
	max-width: 76em;
	text-align: center;
	padding: 12em 1em 6em;
	margin: auto;
}

#conteneur h1 {
    font-family: 'HKGroteskWide-ExtraBold', 'HKGrotesk-ExtraBold', sans-serif;
    font-size: 3em;
	font-weight: 900;
    margin-bottom: 0.85em;
    line-height: 1.4;
}

#conteneur p {
    font-size: 1.25em;
    line-height: 1.4;
    margin-bottom: 1.5em;
}

#actions {
	display: flex;
	justify-content: center;
	flex-wrap: wrap;
}

#actions .bouton {
	display: flex;
	justify-content: center;
	align-items: center;
	width: 180px;
    line-height: 1;
    font-size: 1em;
    font-weight: 700;
    text-transform: uppercase;
	padding: 1em 1.5em;
	margin-right: 1em;
    border: 2px solid #00ced1;
	border-radius: 2em;
    background: #46fbff;
	cursor: pointer;
    transition: all 0.1s ease-in;
	text-align: center;
}

#actions .bouton:hover {
	text-shadow: 1px 1px 1px rgba(0, 0, 0, 0.2);
	background: #fff;
}

#actions .bouton:last-child {
	margin-right: 0;
}

#credits {
	width: 100%;
	margin: 0 auto 0.75em;
}

#credits p {
    font-size: 1em;
    line-height: 1.2;
    margin-bottom: 1em;
	text-align: center;
}

#credits p:last-child {
	display: flex;
	justify-content: center;
	align-items: center;
}

#credits p:last-child a {
	margin: 0 5px;
}

#credits .mentions-legales {
	cursor: pointer;
}

#credits .hub {
	font-size: 0;
	cursor: pointer;
}

#hub {
	position: fixed;
	visibility: hidden;
	opacity: 0;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
	z-index: -1;
}

#hub.ouvert {
	visibility: visible;
	opacity: 1;
    animation: fonduEntrant linear 0.1s;
	z-index: 100000;
}

#hub iframe {
	width: 100%;
    height: 100%;
}

#hub span {
	font-size: 0;
	color: #fff;
	position: absolute;
	top: 15px;
	right: 15px;
	cursor: pointer;
}

#mentions-legales {
	max-width: 700px;
	height: 500px;
	max-height: 90%;
}

#connexion #champ-motdepasse {
	margin-bottom: 10px;
}

.modale .contenu .mot-de-passe-oublie {
	font-size: 12px;
    margin-bottom: 20px;
	cursor: pointer;
}

@media screen and (max-width: 359px) {
	#contenu {
		padding: 4em 1em 2em;
	}

	#actions .bouton {
		font-size: 0.75em!important;
		width: 130px;
		padding: 1em 0.5em;
	}
}

@media screen and (orientation: landscape) and (max-height: 479px) {
	#creation,
	#connexion,
	#inscription {
		height: 90%;
	}
}

@media screen and (min-width: 360px) and (max-width: 599px) {
	#contenu {
		padding: 5em 1em 2.5em;
	}

	#actions .bouton {
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

	#conteneur p {
		font-size: 1em;
		margin-bottom: 1.2em;
	}

	#actions .bouton {
		font-size: 0.85em;
		margin-bottom: 1em;
	}

	#credits p {
		font-size: 0.85em;
	}

	#hub span {
		top: 5px;
		right: 5px;
	}

	#hub span svg {
		width: 24px;
		height: 24px;
	}
}

@media screen and (max-width: 599px) and (orientation: landscape) {
	#contenu {
		padding: 2em 1em 1.5em!important;
	}
}

@media screen and (min-width: 600px) and (max-width: 820px) and (orientation: landscape) {
	#contenu {
		padding: 3em 1em 1.5em!important;
	}
}

@media screen and (max-width: 820px) and (orientation: landscape) {
	#conteneur p {
		font-size: 1em!important;
	}

	#credits p {
		font-size: 0.85em!important;
		margin-bottom: 0.85em!important;
	}
}

@media screen and (max-width: 1023px) and (orientation: landscape) {
	#contenu {
		padding: 7em 1em 3.5em;
	}
}

@media screen and (max-width: 850px) and (max-height: 500px) {
	#conteneur h1 {
		font-size: 2em;
		margin-bottom: 1em;
	}

	#conteneur p {
		font-size: 1em;
		margin-bottom: 1.2em;
	}

	#credits p {
		font-size: 0.85em!important;
	}

	#actions .bouton {
		font-size: 0.85em!important;
	}
}
</style>

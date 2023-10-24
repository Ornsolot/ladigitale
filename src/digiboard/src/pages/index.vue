<template>
	<div id="page">
		<div id="accueil" :style="{'background-image': 'url(./img/fond.png)'}">
			<div id="langues">
				<span class="bouton" role="button" tabindex="0" :class="{'selectionne': langue === 'fr'}" @click="modifierLangue('fr')">FR</span>
				<span class="bouton" role="button" tabindex="0" :class="{'selectionne': langue === 'en'}" @click="modifierLangue('en')">EN</span>
			</div>
			<div id="conteneur">
				<div id="contenu">
					<h1>
						<span>Digiboard</span> <span>by La Digitale</span>
					</h1>
					<div>
						<p v-html="$t('slogan')" />
						<span id="bouton" role="button" tabindex="0" @click="ouvrirModaleTableau">{{ $t('creerTableau') }}</span>
					</div>
				</div>
				<div id="credits">
					<p><span class="mentions-legales" @click="modale = 'mentions-legales'">{{ $t('mentionsLegales') }}</span> - <a href="https://opencollective.com/ladigitale" target="_blank">{{ $t('soutien') }} ❤️.</a></p>
					<p>{{ new Date().getFullYear() }} - <a href="https://ladigitale.dev" target="_blank" rel="noreferrer">La Digitale</a> - <a href="https://codeberg.org/ladigitale/digiboard" target="_blank" rel="noreferrer">{{ $t('codeSource') }}</a> - <span class="hub" @click="ouvrirHub"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#001d1d" width="36px" height="36px"><path d="M0 0h24v24H0z" fill="none" /><path d="M4 8h4V4H4v4zm6 12h4v-4h-4v4zm-6 0h4v-4H4v4zm0-6h4v-4H4v4zm6 0h4v-4h-4v4zm6-10v4h4V4h-4zm-6 4h4V4h-4v4zm6 6h4v-4h-4v4zm0 6h4v-4h-4v4z" /></svg></span></p>
				</div>
			</div>
		</div>

		<div class="conteneur-modale" v-if="modale === 'tableau'">
			<div class="modale">
				<header>
					<span class="titre">{{ $t('nouveauTableau') }}</span>
					<span class="fermer" role="button" tabindex="0" @click="fermerModaleTableau"><i class="material-icons">close</i></span>
				</header>
				<div class="conteneur">
					<div class="contenu">
						<label>{{ $t('titreTableau') }}</label>
						<input type="text" :value="titre" @input="titre = $event.target.value">
						<label>{{ $t('questionSecrete') }}</label>
						<select :value="question" @change="question = $event.target.value">
							<option value="" selected>-</option>
							<option v-for="(item, index) in questions" :value="item" :key="'option_' + index">{{ $t(item) }}</option>
						</select>
						<label>{{ $t('reponseSecreteEdition') }}</label>
						<input type="text" :value="reponse" @input="reponse = $event.target.value" @keydown.enter="creerTableau">
						<div class="actions">
							<span class="bouton" role="button" tabindex="0" @click="creerTableau">{{ $t('creer') }}</span>
						</div>
					</div>
				</div>
			</div>
		</div>

		<div class="conteneur-modale" v-else-if="modale === 'mentions-legales'">
			<div id="mentions-legales" class="modale">
				<header>
					<span class="titre">{{ $t('mentionsLegales') }}</span>
					<span class="fermer" @click="modale = ''"><i class="material-icons">close</i></span>
				</header>
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
	</div>
</template>

<script>
import axios from 'axios'

export default {
	name: 'Accueil',
	data () {
		return {
			modale: '',
			titre: '',
			question: '',
			questions: ['motPrefere', 'filmPrefere', 'chansonPreferee', 'prenomMere', 'prenomPere', 'nomRue', 'nomEmployeur', 'nomAnimal'],
			reponse: '',
			hub: false
		}
	},
	head () {
		return {
			title: 'Digiboard by La Digitale'
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
		this.$nuxt.$loading.start()
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
		this.$nuxt.$loading.finish()
		setTimeout(function () {
			document.getElementsByTagName('html')[0].setAttribute('lang', this.langue)
		}.bind(this), 100)
	},
	methods: {
		ouvrirModaleTableau () {
			this.modale = 'tableau'
		},
		fermerModaleTableau () {
			this.modale = ''
			this.titre = ''
			this.question = ''
			this.reponse = ''
		},
		creerTableau () {
			if (this.titre !== '' && this.question !== '' && this.reponse !== '') {
				this.$nuxt.$loading.start()
				axios.post(this.hote + '/api/creer-tableau', {
					titre: this.titre,
					question: this.question,
					reponse: this.reponse
				}).then(function (reponse) {
					const donnees = reponse.data
					this.fermerModaleTableau()
					if (donnees !== 'erreur') {
						window.location = '/b/' + donnees
					} else {
						this.$nuxt.$loading.finish()
						this.$store.dispatch('modifierMessage', this.$t('erreurCommunicationServeur'))
					}
				}.bind(this)).catch(function () {
					this.$nuxt.$loading.finish()
					this.fermerModaleTableau()
					this.$store.dispatch('modifierMessage', this.$t('erreurCommunicationServeur'))
				}.bind(this))
			} else if (this.titre === '') {
				this.$store.dispatch('modifierMessage', this.$t('remplirTitre'))
			} else if (this.question === '') {
				this.$store.dispatch('modifierMessage', this.$t('selectionnerQuestionSecrete'))
			} else if (this.reponse === '') {
				this.$store.dispatch('modifierMessage', this.$t('remplirReponseSecrete'))
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

#accueil {
	background-size: cover;
	background-position: center;
	background-repeat: no-repeat;
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
    font-family: 'HKGroteskWide-ExtraBold', sans-serif;
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

#bouton {
	display: inline-block;
    line-height: 1;
    font-size: 1em;
    font-weight: 700;
    text-transform: uppercase;
    padding: 1em 1.5em;
	border: 2px solid #00ced1;
	border-radius: 2em;
    background: #46fbff;
    cursor: pointer;
    transition: all ease-in .1s;
}

#bouton:hover {
	text-shadow: 1px 1px 1px rgba(0, 0, 0, 0.2);
	background: #fff;
}

#credits {
	width: 100%;
	margin: 0 auto 0.75em;
}

#credits p {
    font-size: 1.1em;
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

@media screen and (max-width: 359px) {
	#contenu {
		padding: 4em 1em 2em;
	}

	#bouton {
		font-size: 0.75em!important;
	}
}

@media screen and (min-width: 360px) and (max-width: 599px) {
	#contenu {
		padding: 5em 1em 2.5em;
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

	#bouton {
		font-size: 0.85em;
	}

	#credits p {
		font-size: 0.85em;
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
		font-size: 0.85em;
	}

	#bouton {
		font-size: 0.85em!important;
	}
}
</style>

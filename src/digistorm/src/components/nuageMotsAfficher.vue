<template>
	<div id="nuage-de-mots">
		<div id="question">
			<div class="question-et-support" v-if="question !== '' && Object.keys(support).length > 0">
				<span class="question">{{ question }}</span>

				<span class="support" v-if="support.lien && support.lien !== ''" @click="afficherMedia($event, support.lien, 'video')" :title="$t('afficherSupport')"><img :src="support.vignette" :alt="support.vignette"></span>
				<span class="support" v-else-if="support.fichier && support.fichier !== '' && support.type === 'image'" @click="afficherMedia($event, '/fichiers/' + code + '/' + support.fichier, 'image')" :title="$t('afficherSupport')"><img :src="'/fichiers/' + code + '/' + support.fichier" :alt="support.alt"></span>
				<span class="support" v-else-if="support.fichier && support.fichier !== '' && support.type === 'audio'" @click="afficherMedia($event, '/fichiers/' + code + '/' + support.fichier, 'audio')" :title="$t('afficherSupport')"><span><i class="material-icons">audiotrack</i></span></span>
			</div>
			<div class="question" v-else-if="question !== ''">
				{{ question }}
			</div>
			<div class="support seul" v-else-if="Object.keys(support).length > 0">
				<img :src="support.vignette" :alt="support.vignette" v-if="support.lien && support.lien !== ''" @click="afficherMedia($event, support.lien, 'video')" :title="$t('afficherSupport')">
				<img :src="'/fichiers/' + code + '/' + support.fichier" :alt="support.alt" v-else-if="support.fichier && support.fichier !== '' && support.type === 'image'" @click="afficherMedia($event, '/fichiers/' + code + '/' + support.fichier, 'image')" :title="$t('afficherSupport')">
				<audio v-else-if="support.fichier && support.fichier !== '' && support.type === 'audio'" controls :src="'/fichiers/' + code + '/' + support.fichier" />
			</div>
		</div>

		<div id="conteneur-nuage" :style="{'top': hauteurQuestion + 'px', 'height': hauteurConteneur + 'px'}">
			<vue-word-cloud :animation-duration="350" animation-easing="ease-in-out" :animation-overlap="1" color="#00ced1" font-family="HKGrotesk-ExtraBold" :spacing="1/2" :words="mots" @update:progress="modifierProgression">
				<template slot-scope="{text, weight, word}">
					<div :title="text + ' (' + weight + ')'" style="cursor: pointer;" @click="afficherMot(word)">
						{{ text }}
					</div>
				</template>
			</vue-word-cloud>
		</div>

		<div class="conteneur-modale" v-if="modale === 'media'">
			<div id="modale-media" class="modale">
				<div class="conteneur">
					<div class="contenu">
						<img v-if="media.type === 'image'" :src="media.fichier" :alt="$t('image')">
						<audio v-else-if="media.type === 'audio'" controls :src="media.fichier" />
						<div class="video" v-else-if="media.type === 'video'">
							<iframe :src="media.lien" allowfullscreen />
						</div>
						<div class="actions">
							<span class="bouton" role="button" tabindex="0" @click="fermerModaleMedia">{{ $t('fermer') }}</span>
						</div>
					</div>
				</div>
			</div>
		</div>

		<div class="conteneur-modale" v-else-if="modale === 'mot'">
			<div id="modale-mot" class="modale">
				<div class="conteneur">
					<div class="contenu">
						<p :style="{'color': mot.color}">{{ mot.text }}</p>
						<div class="actions">
							<input type="color" :value="mot.color" @change="modifierCouleurMot">
							<span class="bouton" role="button" tabindex="0" @click="supprimerMot">{{ $t('supprimer') }}</span>
							<span class="bouton" role="button" tabindex="0" @click="fermerModaleMot">{{ $t('fermer') }}</span>
						</div>
					</div>
				</div>
			</div>
		</div>

		<chargement :chargement="chargement" v-if="chargement" />
	</div>
</template>

<script>
import fitty from 'fitty'
import latinise from 'voca/latinise'
import imagesLoaded from 'imagesloaded'
import chargement from '@/components/chargement.vue'

export default {
	name: 'NuageMotsAfficher',
	components: {
		chargement
	},
	props: {
		code: String,
		donnees: Object,
		reponses: Array,
		statut: String,
		session: Number
	},
	data () {
		return {
			chargement: false,
			question: '',
			support: {},
			options: {},
			modale: '',
			media: {},
			mots: [],
			mot: '',
			progression: '',
			hauteurQuestion: 0,
			hauteurConteneur: 0
		}
	},
	computed: {
		hote () {
			return this.$store.state.hote
		}
	},
	watch: {
		reponses: function () {
			this.definirMots()
		},
		progression: function (progression) {
			if (progression === '' || progression === null) {
				this.chargement = true
				setTimeout(function () {
					this.chargement = false
				}.bind(this), 350)
			} else {
				setTimeout(function () {
					this.chargement = false
				}.bind(this), 350)
			}
		}
	},
	created () {
		this.question = this.donnees.question
		this.support = this.donnees.support
		if (this.donnees.hasOwnProperty('options')) {
			this.options = this.donnees.options
		}
		this.definirMots()
	},
	mounted () {
		imagesLoaded('#question', function () {
			this.$nextTick(function () {
				window.MathJax.typeset()
				this.$nextTick(function () {
					this.verifierConteneur()
				}.bind(this))
			}.bind(this))
		}.bind(this))
		window.addEventListener('resize', this.verifierConteneur, false)
	},
	beforeDestroy () {
		window.removeEventListener('resize', this.verifierConteneur, false)
	},
	methods: {
		definirMots () {
			const mots = []
			this.reponses.forEach(function (item) {
				if (item.reponse.visible && (Object.keys(this.options).length === 0 || (this.options.hasOwnProperty('casse') && this.options.casse === 'non'))) {
					if (mots.map(mot => mot.text).includes(item.reponse.texte) === true) {
						mots.forEach(function (mot, indexMot) {
							if (mot.text === item.reponse.texte) {
								mots[indexMot].weight = mot.weight + 1
							}
						})
					} else {
						const id = Math.random().toString(16).slice(3)
						mots.push({ id: id, text: item.reponse.texte, weight: 1, number: 1, rotation: 0, fontFamily: 'HKGrotesk-ExtraBold', color: item.reponse.couleur })
					}
				} else if (item.reponse.visible && this.options.hasOwnProperty('casse') && this.options.casse === 'oui') {
					if (mots.map(mot => latinise(mot.text.toLowerCase())).includes(latinise(item.reponse.texte.toLowerCase())) === true) {
						mots.forEach(function (mot, indexMot) {
							if (latinise(mot.text.toLowerCase()) === latinise(item.reponse.texte.toLowerCase())) {
								mots[indexMot].weight = mot.weight + 1
							}
						})
					} else {
						const id = Math.random().toString(16).slice(3)
						mots.push({ id: id, text: item.reponse.texte, weight: 1, number: 1, rotation: 0, fontFamily: 'HKGrotesk-ExtraBold', color: item.reponse.couleur })
					}
				}
			}.bind(this))
			this.mots = mots
		},
		modifierProgression (progression) {
			this.progression = progression
		},
		afficherMot (mot) {
			let taille = 40
			if (window.innerWidth < 400) {
				taille = 25
			} else if (window.innerWidth > 399 && window.innerWidth < 599) {
				taille = 32
			}
			this.mot = mot
			this.modale = 'mot'
			this.$nextTick(function () {
				fitty('#modale-mot p', {
					minSize: taille,
					maxSize: 200,
					multiLine: true
				})
			})
		},
		modifierCouleurMot (event) {
			const couleur = event.target.value
			const id = this.mot.id
			this.mots.forEach(function (mot, index) {
				if (mot.id === id) {
					this.mots[index].color = couleur
				}
			}.bind(this))
			this.$socket.emit('modifiercouleurmot', { code: this.code, session: this.session, mot: this.mot.text, couleur: couleur })
		},
		supprimerMot () {
			if (Object.keys(this.options).length === 0 || (this.options.hasOwnProperty('casse') && this.options.casse === 'non')) {
				const id = this.mot.id
				this.mots.forEach(function (mot, index) {
					if (mot.id === id) {
						this.mots.splice(index, 1)
					}
				}.bind(this))
				this.$socket.emit('supprimermot', { code: this.code, session: this.session, mot: this.mot.text })
			} else if (this.options.hasOwnProperty('casse') && this.options.casse === 'oui') {
				const mots = []
				const texte = latinise(this.mot.text.toLowerCase())
				const id = this.mot.id
				this.reponses.forEach(function (item) {
					if (latinise(item.reponse.texte.toLowerCase()) === texte) {
						mots.push(item.reponse.texte)
					}
				})
				this.mots.forEach(function (mot, index) {
					if (mot.id === id) {
						this.mots.splice(index, 1)
					}
				}.bind(this))
				this.$socket.emit('supprimermots', { code: this.code, session: this.session, mots: mots })
			}
			this.fermerModaleMot()
		},
		fermerModaleMot () {
			this.modale = ''
			this.mot = ''
		},
		afficherMedia (event, media, type) {
			event.preventDefault()
			event.stopPropagation()
			if (type === 'video') {
				this.media = { lien: media, type: type }
			} else {
				this.media = { fichier: media, type: type }
			}
			this.modale = 'media'
		},
		fermerModaleMedia () {
			this.modale = ''
			this.media = {}
		},
		verifierConteneur () {
			const hauteurConteneur = document.querySelector('#conteneur').offsetHeight - (document.querySelector('#question').offsetHeight + 80)
			const hauteurQuestion = document.querySelector('#question').offsetHeight + 80
			this.hauteurConteneur = hauteurConteneur
			this.hauteurQuestion = hauteurQuestion
		}
	}
}
</script>

<style scoped src="@/assets/css/styles-mono-afficher.css"></style>

<style scoped>
#conteneur-nuage {
	position: absolute;
	left: 0;
	right: 0;
	width: 100%;
}

#modale-media img {
	max-height: calc(90vh - 100px);
}

#modale-mot  {
	text-align: center;
	max-width: 984px;
}

#modale-mot .conteneur {
	padding: 30px 25px;
}

#modale-mot p {
    font-weight: 700;
}

#modale-mot .actions {
	display: flex;
	justify-content: center;
	align-items: center;
	flex-wrap: wrap;
}

#modale-mot .actions .bouton:first-of-type {
	margin-right: 20px;
}

#modale-mot input[type="color"] {
	width: 30px;
	height: 30px;
	margin-right: 20px;
	border: none;
	cursor: pointer;
}

#modale-mot input[type="color"]::-moz-color-swatch {
	border: 1px solid #ddd;
	border-radius: 50%;
}

#modale-mot input[type="color"]::-webkit-color-swatch {
	border: 1px solid #ddd;
	border-radius: 50%;
}

#modale-mot input[type="color"]::-webkit-color-swatch-wrapper {
	padding: 0;
}

@media screen and (max-width: 399px) {
	#modale-mot .actions input {
		margin-bottom: 15px;
	}

	#modale-mot .actions .bouton:first-of-type {
		margin-right: 0;
		margin-bottom: 15px;
	}
}
</style>

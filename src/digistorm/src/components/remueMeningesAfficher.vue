<template>
	<div id="remue-meninges">
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

		<div id="conteneur-categories" class="ascenseur" :class="{'scroll': ascenseur}" :style="{'top': hauteurQuestion + 'px', 'height': hauteurConteneur + 'px'}">
			<div id="categories" v-if="categories.length > 0">
				<template v-for="(categorie, index) in categories">
					<div :id="'categorie' + index" class="conteneur-categorie" v-if="categorie.texte !== '' || categorie.image !== ''" :key="'categorie_' + index">
						<div class="categorie" :style="{'border-color': couleurs[index]}">
							<div class="categorie-header">
								<span class="image" @click="afficherImage($event, '/fichiers/' + code + '/' + categorie.image)" v-if="categorie.image !== ''"><img :src="'/fichiers/' + code + '/' + categorie.image" :alt="categorie.alt"></span>
								<span class="texte" v-if="categorie.texte !== ''">{{ categorie.texte }}</span>
							</div>
							<div class="categorie-contenu">
								<draggable class="items" v-model="messages[index]" tag="ul" group="categorie" draggable="li" filter=".actions" :animation="150" :scroll="true" :force-fallback="true" :scroll-speed="40" @start="defilement = false" @sort="reorganiserMessages">
									<li v-for="(item, indexMessage) in messages[index]" :style="{'color': couleurs[index], 'background': eclaircirCouleur(couleurs[index])}" :key="'message_' + indexMessage">
										<span class="message">{{ item.reponse.texte }}</span>
										<span class="actions">
											<i class="material-icons" role="button" tabindex="0" :title="$t('afficherMessage')" @click="afficherMessage(item.reponse.texte)">zoom_in</i>
											<i class="material-icons supprimer" role="button" tabindex="0" :title="$t('supprimerMessage')" @click="supprimerMessage(item.reponse.id)">delete</i>
										</span>
									</li>
								</draggable>
							</div>
						</div>
					</div>
				</template>
			</div>
			<div id="categorie" v-else>
				<div class="categorie">
					<div class="categorie-contenu">
						<draggable class="items" v-model="messages" tag="ul" draggable="li" filter=".actions" :animation="150" :scroll="true" :force-fallback="true" @sort="reorganiserMessages">
							<li v-for="(item, indexMessage) in messages" :key="'message_' + indexMessage">
								<span class="message">{{ item.reponse.texte }}</span>
								<span class="actions">
									<i class="material-icons" role="button" tabindex="0" :title="$t('afficherMessage')" @click="afficherMessage(item.reponse.texte)">zoom_in</i>
									<i class="material-icons supprimer" role="button" tabindex="0" :title="$t('supprimerMessage')" @click="supprimerMessage(item.reponse.id)">delete</i>
								</span>
							</li>
						</draggable>
					</div>
				</div>
			</div>
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

		<div class="conteneur-modale" v-else-if="modale === 'image'">
			<div id="modale-image" class="modale">
				<div class="conteneur">
					<div class="contenu">
						<img :src="image" :alt="$t('image')">
						<div class="actions">
							<span class="bouton" role="button" tabindex="0" @click="fermerModaleImage">{{ $t('fermer') }}</span>
						</div>
					</div>
				</div>
			</div>
		</div>

		<div class="conteneur-modale" v-else-if="modale === 'message'">
			<div id="modale-message" class="modale">
				<div class="conteneur">
					<div class="contenu">
						<p>{{ message }}</p>
						<div class="actions">
							<span class="bouton" role="button" tabindex="0" @click="fermerModaleMessage">{{ $t('fermer') }}</span>
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>
</template>

<script>
import fitty from 'fitty'
import draggable from 'vuedraggable'
import imagesLoaded from 'imagesloaded'

export default {
	name: 'RemueMeningesAfficher',
	components: {
		draggable
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
			question: '',
			support: {},
			categories: [],
			couleurs: ['#27ae60', '#2980b9', '#8e44ad', '#f39c12', '#d35400', '#b71540', '#535c68', '#273c75'],
			modale: '',
			media: {},
			image: '',
			messages: [],
			message: '',
			hauteurQuestion: 0,
			hauteurConteneur: 0,
			ascenseur: false,
			defilement: false,
			depart: 0,
			distance: 0
		}
	},
	computed: {
		hote () {
			return this.$store.state.hote
		}
	},
	watch: {
		reponses: function () {
			this.definirMessages()
		}
	},
	created () {
		this.question = this.donnees.question
		this.support = this.donnees.support
		this.categories = this.donnees.categories.filter(function (categorie) {
			return categorie.texte !== '' || categorie.image !== ''
		})
		this.definirMessages()
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
		afficherMessage (message) {
			let taille = 40
			if (window.innerWidth < 400) {
				taille = 25
			} else if (window.innerWidth > 399 && window.innerWidth < 599) {
				taille = 32
			}
			this.message = message
			this.modale = 'message'
			this.$nextTick(function () {
				fitty('#modale-message p', {
					minSize: taille,
					maxSize: 200,
					multiLine: true
				})
			})
		},
		fermerModaleMessage () {
			this.modale = ''
			this.message = ''
		},
		supprimerMessage (id) {
			this.$socket.emit('supprimermessage', { code: this.code, session: this.session, id: id })
		},
		definirMessages () {
			const messages = []
			for (let i = 0; i < this.categories.length; i++) {
				messages.push([])
			}
			if (messages.length > 0) {
				this.reponses.forEach(function (item) {
					let index = -1
					this.categories.forEach(function (categorie, indexCategorie) {
						if (item.reponse.categorie === categorie.texte || item.reponse.categorie === categorie.image) {
							index = indexCategorie
						}
					})
					if (item.reponse.visible && index > -1) {
						messages[index].push(item)
					}
				}.bind(this))
			} else {
				this.reponses.forEach(function (item) {
					if (item.reponse.visible) {
						messages.push(item)
					}
				})
			}
			this.messages = messages
		},
		reorganiserMessages () {
			const messages = this.messages
			let reponses = []
			if (this.categories.length > 0) {
				messages.forEach(function (items, index) {
					let categorie = ''
					if (this.categories[index].texte !== '') {
						categorie = this.categories[index].texte
					} else if (this.categories[index].image !== '') {
						categorie = this.categories[index].image
					}
					items.forEach(function (message) {
						message.reponse.categorie = categorie
						reponses.push(message)
					})
				}.bind(this))
			} else {
				reponses = messages
			}
			this.$socket.emit('reorganisermessages', { code: this.code, session: this.session, reponses: reponses })
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
		afficherImage (event, image) {
			event.preventDefault()
			event.stopPropagation()
			this.image = image
			this.modale = 'image'
		},
		fermerModaleImage () {
			this.modale = ''
			this.image = ''
		},
		verifierConteneur () {
			const hauteurConteneur = document.querySelector('#conteneur').offsetHeight - (document.querySelector('#question').offsetHeight + 80)
			const hauteurQuestion = document.querySelector('#question').offsetHeight + 80
			const ascenseur = document.querySelector('#conteneur-categories').scrollWidth > document.querySelector('#conteneur-categories').offsetWidth
			this.hauteurConteneur = hauteurConteneur
			this.hauteurQuestion = hauteurQuestion
			this.ascenseur = ascenseur
			if (this.ascenseur) {
				this.activerDefilementHorizontal()
			} else {
				this.desactiverDefilementHorizontal()
			}
		},
		activerDefilementHorizontal () {
			const element = document.querySelector('#conteneur-categories')
			element.addEventListener('mousedown', this.defilementHorizontalDebut)
			element.addEventListener('mouseleave', this.defilementHorizontalFin)
			element.addEventListener('mouseup', this.defilementHorizontalFin)
			element.addEventListener('mousemove', this.defilementHorizontalEnCours)
		},
		desactiverDefilementHorizontal () {
			const element = document.querySelector('#conteneur-categories')
			element.removeEventListener('mousedown', this.defilementHorizontalDebut)
			element.removeEventListener('mouseleave', this.defilementHorizontalFin)
			element.removeEventListener('mouseup', this.defilementHorizontalFin)
			element.removeEventListener('mousemove', this.defilementHorizontalEnCours)
		},
		defilementHorizontalDebut (event) {
			const element = document.querySelector('#conteneur-categories')
			this.defilement = true
			this.depart = event.pageX - element.offsetLeft
			this.distance = element.scrollLeft
		},
		defilementHorizontalFin () {
			this.defilement = false
		},
		defilementHorizontalEnCours (event) {
			if (!this.defilement) { return }
			event.preventDefault()
			const element = document.querySelector('#conteneur-categories')
			const x = event.pageX - element.offsetLeft
			const delta = (x - this.depart) * 1.5
			element.scrollLeft = this.distance - delta
		},
		eclaircirCouleur (hex) {
			const r = parseInt(hex.slice(1, 3), 16)
			const v = parseInt(hex.slice(3, 5), 16)
			const b = parseInt(hex.slice(5, 7), 16)
			return 'rgba(' + r + ', ' + v + ', ' + b + ', ' + 0.1 + ')'
		}
	}
}
</script>

<style scoped src="@/assets/css/styles-mono-afficher.css"></style>

<style scoped>
#conteneur-categories {
	position: absolute;
	left: 0;
	width: 100%;
	overflow: auto;
	-webkit-overflow-scrolling: touch;
}

#categories {
	display: flex;
    flex-direction: row;
    justify-content: center;
    align-content: flex-start;
    align-items: flex-start;
    flex-wrap: nowrap;
	padding: 0 20px;
	margin-bottom: 20px;
}

.scroll #categories {
	justify-content: flex-start;
}

#categorie {
	display: flex;
	justify-content: center;
	flex-wrap: wrap;
	width: 100%;
	max-width: 1024px;
	padding: 0 20px;
	margin: 0 auto 20px;
}

#conteneur-categories .categorie {
	position: relative;
	border: 2px solid #ddd;
	padding: 15px 20px 5px;
	border-radius: 1em;
	margin: 0 0 20px;
    width: 40rem;
	min-height: 25rem;
	flex-shrink: 0;
}

#categories .conteneur-categorie {
	padding-right: 20px;
}

#categories .conteneur-categorie:last-child {
	padding-right: 0;
}

.scroll #categories .conteneur-categorie {
	padding-right: 20px;
}

#categorie .categorie {
	max-width: 70rem;
	width: 100%;
}

#conteneur-categories .categorie-header {
	position: relative;
	display: flex;
	justify-content: flex-start;
	align-items: center;
	border-bottom: 1px solid #ddd;
	padding-bottom: 15px;
	width: 100%;
}

#conteneur-categories .categorie-header .image {
	display: flex;
	justify-content: center;
	align-items: center;
	font-size: 0;
	width: 7rem;
	height: 7rem;
	margin-right: 20px;
	cursor: zoom-in;
}

#conteneur-categories .categorie-header .image img {
	max-width: 7rem;
	max-height: 7rem;
	border-radius: 5px;
}

#conteneur-categories .categorie-header .texte {
	font-size: 2.3rem;
	font-weight: 400;
	line-height: 1.25;
}

#conteneur-categories .categorie-header .image + .texte {
	width: calc(100% - (7rem + 20px));
}

#categories .categorie-contenu ul {
	padding: 15px 0 0;
}

#conteneur-categories .categorie-contenu li {
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 5px 10px;
	background: #eee;
	border-radius: 4px;
	margin-bottom: 10px;
	cursor: move;
}

#conteneur-categories .categorie-contenu li .message {
	font-size: 2rem;
	font-weight: 400;
	width: calc(100% - 67px);
}

#conteneur-categories .categorie-contenu li .actions {
	display: flex;
	visibility: hidden;
	margin-left: 11px;
	cursor: pointer;
}

#conteneur-categories .categorie-contenu li .actions i {
	font-size: 24px;
	margin-left: 4px;
	color: #242f3d;
}

#conteneur-categories .categorie-contenu li .actions i.supprimer {
	color: #ff6259;
}

#conteneur-categories .categorie-contenu li:hover .actions {
	visibility: visible;
}

#modale-image img {
	max-height: calc(90vh - 100px);
}

#modale-message  {
	text-align: center;
	max-width: 984px;
}

#modale-message .conteneur {
	padding: 30px 25px;
}

#modale-message p {
    font-weight: 400;
}

@media screen and (max-width: 767px) {
	#categories .conteneur-categorie {
		width: 100%!important;
		padding-right: 0!important;
	}

	#conteneur-categories .categorie {
		width: 100%;
		margin-right: 0;
	}

	#categories {
		flex-wrap: wrap;
	}
}
</style>

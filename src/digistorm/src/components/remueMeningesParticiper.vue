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

		<div id="message">
			<div class="conteneur-textarea">
				<textarea-autosize v-model="texte" :rows="2" :min-height="46" :max-height="124" :placeholder="$t('votreMessage')" />
			</div>
			<div id="categories" v-if="categories.length > 0">
				<h3>{{ $t('categorie') }}</h3>
				<div id="conteneur-categories" v-if="categories.length > 0">
					<template v-for="(cat, indexCat) in categories">
						<label class="bouton-radio avec-image" v-if="cat.texte !== '' && cat.image !== ''" :key="'categorie_' + indexCat"><span class="image"><img :src="'/fichiers/' + code + '/' + cat.image" :alt="cat.alt" :style="{'border': '2px solid' + couleurs[indexCat]}" @click="afficherImage($event, '/fichiers/' + code + '/' + cat.image)" :title="$t('afficherImage')"></span><span class="texte" :style="{'color': couleurs[indexCat]}">{{ cat.texte }}</span>
							<input type="radio" name="categorie" :checked="categorie === cat.texte" @change="categorie = cat.texte">
							<span class="coche" />
						</label>

						<label class="bouton-radio" v-else-if="cat.texte !== ''" :style="{'color': couleurs[indexCat]}" :key="'categorie_' + indexCat">{{ cat.texte }}
							<input type="radio" name="categorie" :checked="categorie === cat.texte" @change="categorie = cat.texte">
							<span class="coche" />
						</label>

						<label class="bouton-radio avec-image" v-else-if="cat.image !== ''" :key="'categorie_' + indexCat"><span class="image"><img :src="'/fichiers/' + code + '/' + cat.image" :alt="cat.alt" :style="{'border': '2px solid' + couleurs[indexCat]}" @click="afficherImage($event, '/fichiers/' + code + '/' + cat.image)" :title="$t('afficherImage')"></span>
							<input type="radio" name="categorie" :checked="categorie === cat.image" @change="categorie = cat.image">
							<span class="coche" />
						</label>
					</template>
				</div>
			</div>
			<div class="actions">
				<span class="bouton" role="button" tabindex="0" @click="envoyerReponse" v-if="statut !== 'verrouille'">{{ $t('envoyer') }}</span>
				<span class="bouton desactive" role="button" tabindex="0" v-else>{{ $t('envoyer') }}</span>
			</div>
		</div>

		<div id="messages" v-if="messages.length > 0">
			<h3 v-if="messages.length === 1">{{ $t('messageEnvoye') }}</h3>
			<h3 v-else>{{ $t('messagesEnvoyes') }}</h3>
			<ul v-if="categories.length > 0">
				<li v-for="(message, indexMessage) in messages" :style="{'color': definirCouleurCategorie(message.categorie), 'background': eclaircirCouleur(definirCouleurCategorie(message.categorie))}" :key="'message_' + indexMessage">
					<span v-if="message.visible">{{ message.texte }}</span>
					<span v-else><del>{{ message.texte }}</del></span>
				</li>
			</ul>
			<ul v-else>
				<li v-for="(message, indexMessage) in messages" :key="'message_' + indexMessage">
					<span v-if="message.visible">{{ message.texte }}</span>
					<span v-else><del>{{ message.texte }}</del></span>
				</li>
			</ul>
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
	</div>
</template>

<script>
export default {
	name: 'RemueMeningesParticiper',
	props: {
		code: String,
		donnees: Object,
		reponses: Array,
		statut: String,
		session: Number
	},
	sockets: {
		reponseenvoyee: function () {
			this.texte = ''
		}
	},
	data () {
		return {
			question: '',
			support: {},
			categories: [],
			couleurs: ['#27ae60', '#2980b9', '#8e44ad', '#f39c12', '#d35400', '#b71540', '#535c68', '#273c75'],
			categorie: '',
			texte: '',
			modale: '',
			media: {},
			image: ''
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
		messages () {
			const messages = []
			this.reponses.forEach(function (item) {
				if (item.identifiant === this.identifiant) {
					messages.push({ texte: item.reponse.texte, categorie: item.reponse.categorie, visible: item.reponse.visible })
				}
			}.bind(this))
			return messages
		}
	},
	created () {
		this.question = this.donnees.question
		if (this.donnees.support.hasOwnProperty('image')) {
			this.support = { fichier: this.donnees.support.image, alt: this.donnees.support.alt, type: 'image' }
		} else {
			this.support = this.donnees.support
		}
		this.categories = this.donnees.categories.filter(function (categorie) {
			return categorie.texte !== '' || categorie.image !== ''
		})
		if (this.categories.length > 0 && this.categories[0].texte !== '') {
			this.categorie = this.categories[0].texte
		} else if (this.categories.length > 0 && this.categories[0].image !== '') {
			this.categorie = this.categories[0].image
		}
	},
	methods: {
		envoyerReponse () {
			if (this.texte.trim() !== '') {
				const id = Date.now().toString(36) + Math.random().toString(36).substr(2)
				this.$emit('validation', { reponse: { id: id, texte: this.texte.trim(), categorie: this.categorie, visible: true }, identifiant: this.identifiant, nom: this.nom })
				this.texte = ''
			}
		},
		definirCouleurCategorie (categorie) {
			let couleur
			this.categories.forEach(function (item, index) {
				if (item.texte === categorie || item.image === categorie) {
					couleur = this.couleurs[index]
				}
			}.bind(this))
			return couleur
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
		eclaircirCouleur (hex) {
			const r = parseInt(hex.slice(1, 3), 16)
			const v = parseInt(hex.slice(3, 5), 16)
			const b = parseInt(hex.slice(5, 7), 16)
			return 'rgba(' + r + ', ' + v + ', ' + b + ', ' + 0.1 + ')'
		}
	}
}
</script>

<style scoped src="@/assets/css/styles-mono-participer.css"></style>

<style scoped>
#message .conteneur-textarea {
    position: relative;
    min-height: 46px;
    max-height: 124px;
}

#message .conteneur-textarea > textarea {
	display: block;
    width: 100%;
    font-weight: 400;
    font-size: 16px;
    text-align: left;
    border-radius: 4px;
    cursor: text;
    background: #fff;
    resize: none;
    max-width: 100%;
    border: 1px solid #ddd;
    padding: 10px 15px;
}

#messages > h3,
#categories > h3 {
	font-size: 16px;
    font-weight: 700;
    display: block;
    margin: 20px 0 10px;
}

#message .bouton-radio {
	font-weight: 400;
}

#message #conteneur-categories {
	display: inline-flex;
	justify-content: flex-start;
}

#message .bouton-radio.avec-image {
	display: inline-flex;
	justify-content: flex-start;
	align-items: center;
	height: 5rem;
}

#message .bouton-radio.avec-image .coche {
	top: 50%;
	margin-top: -11px;
}

#message .bouton-radio .image {
	display: flex;
	justify-content: flex-start;
	align-items: center;
	height: 5rem;
	max-width: 5rem;
}

#message .bouton-radio .image img {
	max-height: 5rem;
	max-width: 5rem;
	border-radius: 4px;
	cursor: zoom-in;
}

#message .bouton-radio .texte {
	margin-left: 5px;
}

#message .actions {
	text-align: center;
	margin-top: 5px;
}

#message .bouton {
	display: inline-block;
	font-weight: 700;
	font-size: 18px;
	text-transform: uppercase;
	height: 40px;
	line-height: 40px;
	padding: 0 50px;
	cursor: pointer;
	color: #fff;
	text-shadow: 1px 1px 1px rgba(0, 0, 0, 0.3);
	background: #009688;
	border-radius: 2em;
	letter-spacing: 1px;
	text-indent: 1px;
	transition: all 0.1s ease-in;
}

#message .bouton:hover {
	background: #00a695;
}

#message .bouton.desactive:hover,
#message .bouton.desactive {
	background: #aaa!important;
}

#message #categories + .actions {
	margin-top: 10px;
}

#message .conteneur-textarea + .actions {
	margin-top: 20px;
}

#messages {
	margin-top: 40px;
	margin-bottom: 30px;
}

#messages ul {
	padding: 5px 0 0;
}

#messages li {
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 5px 10px;
	background: #eee;
	border-radius: 4px;
	margin-bottom: 10px;
	font-size: 16px;
	font-weight: 400;
}
</style>

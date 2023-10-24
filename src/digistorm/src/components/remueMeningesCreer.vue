<template>
	<div id="remue-meninges">
		<div id="question" class="section">
			<h2>{{ $t('question') }}</h2>
			<div class="question">
				<div class="conteneur-textarea" :class="{'media': Object.keys(support).length > 0}">
					<textarea-autosize v-model="question" :rows="1" :min-height="46" :max-height="94" :placeholder="$t('question')" />
				</div>
				<span class="actions" v-if="chargement === 'support'">
					<span class="conteneur-chargement">
						<span class="chargement" />
						<span class="progression">{{ progression }} %</span>
					</span>
				</span>
				<span class="actions" v-else-if="chargement !== 'support' && Object.keys(support).length === 0">
					<span @click="afficherAjouterMedia" :title="$t('ajouterSupport')"><i class="material-icons">library_add</i></span>
				</span>
				<span class="actions media" v-else-if="chargement !== 'support' && Object.keys(support).length > 0 && support.lien && support.lien !== ''" @click="afficherMedia(support.lien, 'video')" :title="$t('afficherSupport')" :style="{'background-image': 'url(' + support.vignette + ')'}" />
				<span class="actions media" v-else-if="chargement !== 'support' && Object.keys(support).length > 0 && support.fichier && support.fichier !== '' && support.type === 'image'" @click="afficherMedia('/fichiers/' + code + '/' + support.fichier, 'image')" :title="$t('afficherSupport')" :style="{'background-image': 'url(/fichiers/' + code + '/' + support.fichier + ')'}" />
				<span class="actions media audio" v-else-if="chargement !== 'support' && Object.keys(support).length > 0 && support.fichier && support.fichier !== '' && support.type === 'audio'" @click="afficherMedia('/fichiers/' + code + '/' + support.fichier, 'audio')" :title="$t('afficherSupport')">
					<span><i class="material-icons">audiotrack</i></span>
				</span>
			</div>
		</div>

		<div id="categories" class="section">
			<h2>{{ $t('categories') }}</h2>
			<p>{{ $t('ajouterCategories') }}</p>
			<draggable class="categories" v-model="categories" draggable=".categorie" handle=".poignee" filter=".desactive" :animation="150" :scroll="true" :force-fallback="true">
				<div :id="'categorie' + index" class="categorie" v-for="(categorie, index) in categories" :key="'categorie_' + index">
					<span class="poignee" :class="{'desactive': chargement.substring(0, 5) === 'image' || categories.length === 1}">
						<i class="material-icons">drag_indicator</i>
					</span>
					<div class="conteneur-textarea" :class="{'image': categorie.image !== ''}">
						<textarea-autosize v-model="categories[index].texte" :rows="1" :min-height="46" :max-height="94" :placeholder="$t('categorie') + ' ' + (index + 1)" />
					</div>
					<span class="actions" v-if="chargement === 'image' + index">
						<span class="conteneur-chargement">
							<span class="chargement" />
							<span class="progression">{{ progression }} %</span>
						</span>
						<span @click="supprimerCategorie(index)" :class="{'desactive': categories.length === 1}" :title="$t('supprimerCategorie')"><i class="material-icons">delete</i></span>
					</span>
					<span class="actions" v-else-if="chargement !== 'image' + index && categorie.image === ''">
						<label :for="'televerser-image' + index" :title="$t('ajouterImage')"><i class="material-icons">add_photo_alternate</i></label>
						<input :id="'televerser-image' + index" type="file" @change="televerserImage(index)" style="display: none" accept=".jpg, .jpeg, .png, .gif">
						<span @click="supprimerCategorie(index)" :class="{'desactive': categories.length === 1}" :title="$t('supprimerCategorie')"><i class="material-icons">delete</i></span>
					</span>
					<span class="actions" v-else-if="chargement !== 'image' + index && categorie.image !== ''">
						<span class="image" @click="afficherImage('/fichiers/' + code + '/' + categorie.image, index)" :title="$t('afficherImage')" :style="{'background-image': 'url(/fichiers/' + code + '/' + categorie.image + ')'}" />
						<span @click="supprimerCategorie(index)" :class="{'desactive': categories.length === 1}" :title="$t('supprimerCategorie')"><i class="material-icons">delete</i></span>
					</span>
				</div>
			</draggable>

			<span id="ajouter" role="button" tabindex="0" :title="$t('ajouterCategorie')" @click="ajouterCategorie" v-if="categories.length < 8"><i class="material-icons">add_circle_outline</i></span>
		</div>

		<div class="conteneur-modale" v-if="modale === 'ajouter-media'">
			<div id="modale-ajouter-media" class="modale">
				<header>
					<span class="titre">{{ $t('ajouterMedia') }}</span>
					<span class="fermer" role="button" tabindex="0" @click="fermerModaleAjouterMedia"><i class="material-icons">close</i></span>
				</header>
				<div class="conteneur">
					<div class="contenu" v-if="chargement !== 'support'">
						<label>{{ $t('lienVideo') }}</label>
						<div class="valider">
							<input type="text" :value="lien" @input="lien = $event.target.value" @keydown.enter="ajouterVideo">
							<span role="button" tabindex="0" :title="$t('valider')" class="bouton-secondaire" @click="ajouterVideo"><i class="material-icons">search</i></span>
						</div>
						<div class="separateur"><span>{{ $t('ou') }}</span></div>
						<label>{{ $t('fichierImageAudio') }}</label>
						<label class="bouton" role="button" tabindex="0" for="selectionner-media">{{ $t('selectionnerFichier') }}</label>
						<input id="selectionner-media" type="file" @change="televerserMedia" style="display: none" accept=".jpg, .jpeg, .png, .gif, .mp3, .wav, .m4a, .ogg">
					</div>
					<div class="contenu" v-else>
						<div class="conteneur-chargement">
							<div class="chargement" />
						</div>
					</div>
				</div>
			</div>
		</div>

		<div class="conteneur-modale" v-else-if="modale === 'media'">
			<div id="modale-media" class="modale">
				<header>
					<span class="titre" />
					<span class="fermer" role="button" tabindex="0" @click="fermerModaleMedia"><i class="material-icons">close</i></span>
				</header>
				<div class="conteneur">
					<div class="contenu">
						<img v-if="media.type === 'image'" :src="media.fichier" :alt="$t('image')">
						<audio v-else-if="media.type === 'audio'" controls :src="media.fichier" />
						<div class="video" v-else-if="media.type === 'video'">
							<iframe :src="media.lien" allowfullscreen />
						</div>
						<div class="actions">
							<span class="bouton" role="button" tabindex="0" @click="afficherAjouterMedia">{{ $t('modifier') }}</span>
							<span class="bouton" role="button" tabindex="0" @click="supprimerMedia">{{ $t('supprimer') }}</span>
						</div>
					</div>
				</div>
			</div>
		</div>

		<div class="conteneur-modale" v-else-if="modale === 'image'">
			<div id="modale-image" class="modale">
				<header>
					<span class="titre" />
					<span class="fermer" role="button" tabindex="0" @click="fermerModaleImage"><i class="material-icons">close</i></span>
				</header>
				<div class="conteneur">
					<div class="contenu">
						<img :src="image" :alt="$t('image')">
						<div class="actions">
							<label :for="'televerser-image' + indexImage" class="bouton" role="button" tabindex="0">{{ $t('modifier') }}</label>
							<input :id="'televerser-image' + indexImage" type="file" @change="televerserImage(indexImage)" style="display: none" accept=".jpg, .jpeg, .png, .gif">
							<span class="bouton" role="button" tabindex="0" @click="supprimerImage(indexImage)">{{ $t('supprimer') }}</span>
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>
</template>

<script>
import axios from 'axios'
import draggable from 'vuedraggable'
import methodesMonoCreer from '@/assets/js/methodes-mono-creer'

export default {
	name: 'RemueMeningesCreer',
	components: {
		draggable
	},
	extends: methodesMonoCreer,
	props: {
		code: String,
		donnees: Object,
		statut: String,
		enregistrement: String
	},
	data () {
		return {
			question: '',
			support: {},
			categories: [{ texte: '', image: '', alt: '' }, { texte: '', image: '', alt: '' }],
			chargement: '',
			modale: '',
			lien: '',
			media: {},
			medias: [],
			image: '',
			indexImage: -1,
			images: [],
			corbeille: [],
			progression: 0
		}
	},
	computed: {
		hote () {
			return this.$store.state.hote
		}
	},
	watch: {
		enregistrement: function (valeur) {
			if (valeur === 'enregistrement' || valeur === 'lancement') {
				this.categories.forEach(function (categorie) {
					if (categorie.image !== '' && this.images.includes(categorie.image)) {
						const index = this.images.indexOf(categorie.image)
						this.images.splice(index, 1)
					}
				}.bind(this))
				if (Object.keys(this.support).length > 0 && this.medias.includes(this.support.fichier)) {
					const index = this.medias.indexOf(this.support.fichier)
					this.medias.splice(index, 1)
				}
				this.corbeille.push(...this.images)
				this.$emit('enregistrement', { question: this.question, support: this.support, categories: this.categories })
			} else if (valeur === 'termine') {
				this.viderCorbeille()
			}
		}
	},
	created () {
		if (Object.keys(this.donnees).length > 0) {
			this.question = this.donnees.question
			if (this.donnees.support.hasOwnProperty('image')) {
				this.support = { fichier: this.donnees.support.image, alt: this.donnees.support.alt, type: 'image' }
			} else {
				this.support = this.donnees.support
			}
			this.categories = this.donnees.categories
		}
	},
	mounted () {
		this.$nextTick(function () {
			if (this.question === '') {
				document.querySelector('#question textarea').focus()
			}
		}.bind(this))
		window.addEventListener('beforeunload', this.quitterPage, false)
	},
	beforeDestroy () {
		window.removeEventListener('beforeunload', this.quitterPage, false)
	},
	methods: {
		ajouterCategorie () {
			if (this.categories.length < 8) {
				this.categories.push({ texte: '', image: '', alt: '' })
				const index = this.categories.length - 1
				this.$nextTick(function () {
					document.querySelector('#categorie' + index + ' textarea').focus()
				})
			}
		},
		supprimerCategorie (index) {
			if (this.categories.length > 1) {
				if (this.categories[index].image !== '') {
					this.corbeille.push(this.categories[index].image)
				}
				this.categories.splice(index, 1)
			}
		},
		televerserImage (index) {
			this.modale = ''
			const champ = document.querySelector('#televerser-image' + index)
			const formats = ['jpg', 'jpeg', 'png', 'gif']
			const extension = champ.files[0].name.substr(champ.files[0].name.lastIndexOf('.') + 1).toLowerCase()
			if (champ.files && champ.files[0] && formats.includes(extension) && champ.files[0].size < 5242880) {
				this.chargement = 'image' + index
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
						this.$store.dispatch('modifierMessage', this.$t('pasAutoriseModifierRemueMeninges'))
					} else {
						this.categories[index].image = donnees.image
						this.categories[index].alt = donnees.alt
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
		afficherImage (image, index) {
			this.image = image
			this.indexImage = index
			this.modale = 'image'
		},
		supprimerImage (index) {
			this.categories[index].image = ''
			this.categories[index].alt = ''
			this.fermerModaleImage()
		},
		fermerModaleImage () {
			this.modale = ''
			this.image = ''
			this.indexImage = -1
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
</script>

<style scoped src="@/assets/css/styles-mono-creer.css"></style>

<style scoped>
.categorie .conteneur-textarea.image textarea{
	border-top-right-radius: 0!important;
	border-bottom-right-radius: 0!important;
}

#categories p {
	margin-bottom: 15px;
}

.categorie {
	position: relative;
	display: flex;
	justify-content: center;
	align-items: center;
	margin-bottom: 15px;
	z-index: 1;
}

.categorie.sortable-chosen.sortable-ghost {
	opacity: 0!important;
}

.categorie.sortable-chosen.sortable-drag {
	z-index: 2!important;
}

.categorie .poignee {
	text-align: center;
	font-size: 24px;
	width: 24px;
	cursor: move;
}

.categorie .conteneur-textarea {
	width: calc(100% - 84px);
}

.categorie .actions {
	display: flex;
	justify-content: space-evenly;
	align-items: center;
	font-size: 24px;
	width: 60px;
}

.categorie .actions label,
.categorie .actions span {
	cursor: pointer;
}

.categorie .actions .image {
	position: absolute;
	width: 30px;
    right: 30px;
	background-size: cover;
	background-position: center;
	background-repeat: no-repeat;
	border-top-right-radius: 4px;
	border-bottom-right-radius: 4px;
	height: 100%;
	cursor: pointer;
}

.categorie .actions .image + span {
	margin-left: 28px;
}

.categorie .poignee.desactive,
.categorie .actions span.desactive {
	color: #aaa;
	cursor: default;
}

#ajouter {
	display: block;
	text-align: center;
	width: 60px;
    font-size: 36px;
	cursor: pointer;
	line-height: 1;
    color: #00ced1;
    margin: 0 auto;
	cursor: pointer;
}

#modale-image label {
    display: inline-block;
    width: auto;
    margin-bottom: 0;
}

#modale-image img {
    max-height: calc(90vh - 145px);
}
</style>

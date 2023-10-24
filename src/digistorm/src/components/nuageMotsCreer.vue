<template>
	<div id="nuage-de-mots">
		<div id="parametres" class="section">
			<h2>{{ $t('parametresNuage') }}</h2>
			<div class="conteneur-parametres">
				<div class="parametre">
					<h3>{{ $t('casseEtAccents') }}</h3>
					<label class="bouton-radio">{{ $t('oui') }}
						<input type="radio" name="casse" :checked="options.casse === 'oui'" @change="modifierParametres('casse', 'oui')">
						<span class="coche" />
					</label>
					<label class="bouton-radio">{{ $t('non') }}
						<input type="radio" name="casse" :checked="options.casse === 'non'" @change="modifierParametres('casse', 'non')">
						<span class="coche" />
					</label>
				</div>
			</div>
		</div>

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
	</div>
</template>

<script>
import axios from 'axios'
import methodesMonoCreer from '@/assets/js/methodes-mono-creer'

export default {
	name: 'NuageMotsCreer',
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
			options: {
				casse: 'non'
			},
			chargement: '',
			modale: '',
			lien: '',
			media: {},
			medias: [],
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
				if (Object.keys(this.support).length > 0 && this.medias.includes(this.support.fichier)) {
					const index = this.medias.indexOf(this.support.fichier)
					this.medias.splice(index, 1)
				}
				this.corbeille.push(...this.medias)
				this.$emit('enregistrement', { question: this.question, options: this.options, support: this.support })
			} else if (valeur === 'termine') {
				this.viderCorbeille()
			}
		}
	},
	created () {
		if (Object.keys(this.donnees).length > 0) {
			this.question = this.donnees.question
			this.support = this.donnees.support
			if (this.donnees.hasOwnProperty('options')) {
				this.options = this.donnees.options
			}
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
		modifierParametres (type, valeur) {
			this.options[type] = valeur
		},
		viderCorbeille () {
			axios.post(this.hote + '/api/supprimer-fichiers', {
				code: this.code,
				fichiers: this.corbeille
			}).then(function () {
				this.corbeille = []
				this.medias = []
			}.bind(this))
		},
		quitterPage () {
			if (this.medias.length > 0) {
				axios.post(this.hote + '/api/supprimer-fichiers', {
					code: this.code,
					fichiers: this.medias
				})
			}
		}
	}
}
</script>

<style scoped src="@/assets/css/styles-mono-creer.css"></style>

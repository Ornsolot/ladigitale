<template>
	<div id="sondage">
		<div id="description" class="section">
			<h2>{{ $t('descriptionEtSupportFacultatifs') }}</h2>
			<div class="description">
				<div class="conteneur-textarea" :class="{'media': Object.keys(support).length > 0}">
					<textarea-autosize v-model="description" :rows="1" :min-height="46" :max-height="94" :placeholder="$t('description')" />
				</div>
				<span class="actions" v-if="chargement === 'media'">
					<span class="conteneur-chargement">
						<span class="chargement" />
						<span class="progression">{{ progression }} %</span>
					</span>
				</span>
				<span class="actions" v-else-if="chargement !== 'media' && Object.keys(support).length === 0">
					<span @click="afficherAjouterMedia" :title="$t('ajouterSupport')"><i class="material-icons">library_add</i></span>
				</span>
				<span class="actions media" v-else-if="chargement !== 'media' && Object.keys(support).length > 0 && support.lien && support.lien !== ''" @click="afficherMedia(support.lien, 'video')" :title="$t('afficherSupport')" :style="{'background-image': 'url(' + support.vignette + ')'}" />
				<span class="actions media" v-else-if="chargement !== 'media' && Object.keys(support).length > 0 && support.fichier && support.fichier !== '' && support.type === 'image'" @click="afficherMedia('/fichiers/' + code + '/' + support.fichier, 'image')" :title="$t('afficherSupport')" :style="{'background-image': 'url(/fichiers/' + code + '/' + support.fichier + ')'}" />
				<span class="actions media audio" v-else-if="chargement !== 'media' && Object.keys(support).length > 0 && support.fichier && support.fichier !== '' && support.type === 'audio'" @click="afficherMedia('/fichiers/' + code + '/' + support.fichier, 'audio')" :title="$t('afficherSupport')">
					<span><i class="material-icons">audiotrack</i></span>
				</span>
			</div>
		</div>

		<div id="parametres" class="section">
			<h2>{{ $t('parametresSondage') }}</h2>
			<div class="conteneur-parametres">
				<div class="parametre">
					<h3>{{ $t('progression') }}</h3>
					<label class="bouton-radio">{{ $t('progressionLibre') }}
						<input type="radio" name="progression" :checked="options.progression === 'libre'" @change="modifierParametres('progression', 'libre')">
						<span class="coche" />
					</label>
					<label class="bouton-radio">{{ $t('progressionAnimateur') }}
						<input type="radio" name="progression" :checked="options.progression === 'animateur'" @change="modifierParametres('progression', 'animateur')">
						<span class="coche" />
					</label>
				</div>
				<div class="parametre">
					<h3>{{ $t('nomOuPseudo') }}</h3>
					<label class="bouton-radio">{{ $t('obligatoire') }}
						<input type="radio" name="nom" :checked="options.nom === 'obligatoire'" @change="modifierParametres('nom', 'obligatoire')">
						<span class="coche" />
					</label>
					<label class="bouton-radio">{{ $t('facultatif') }}
						<input type="radio" name="nom" :checked="options.nom === 'facultatif'" @change="modifierParametres('nom', 'facultatif')">
						<span class="coche" />
					</label>
				</div>
			</div>
		</div>

		<draggable id="questions" v-model="questions" draggable=".accordeon" handle=".poignee-accordeon" filter=".desactive" :animation="150" :scroll="true" :force-fallback="true">
			<template v-for="(q, indexQ) in questions">
				<div :id="'accordeon' + indexQ" class="section accordeon" role="button" tabindex="0" :key="'accordeon_' + indexQ">
					<div class="conteneur-accordeon">
						<div class="en-tete-accordeon">
							<div class="titre">
								<span class="poignee poignee-accordeon" :class="{'desactive': questions.length === 1}">
									<i class="material-icons">drag_indicator</i>
								</span>
								<span class="titre-question" @click="gererAccordeon(indexQ)">
									{{ definirTitre(indexQ) }}
								</span>
							</div>
							<span class="statut" @click="gererAccordeon(indexQ)">
								<i class="material-icons" v-if="accordeonOuvert !== indexQ" :title="$t('ouvrir')">add</i>
								<i class="material-icons" v-else :title="$t('fermer')">remove</i>
							</span>
						</div>

						<div class="contenu-accordeon">
							<div :id="'question' + indexQ" class="section" :key="'question_' + indexQ">
								<h2>{{ $t('question') }}</h2>
								<div class="question">
									<div class="conteneur-textarea" :class="{'image': Object.keys(q.support).length > 0}">
										<textarea-autosize v-model="q.question" :rows="1" :min-height="46" :max-height="94" :placeholder="$t('question')" />
									</div>
									<span class="actions" v-if="chargement === 'support' + indexQ">
										<span class="conteneur-chargement">
											<span class="chargement" />
											<span class="progression">{{ progression }} %</span>
										</span>
									</span>
									<span class="actions" role="button" tabindex="0" :title="$t('ajouterImage')" v-else-if="chargement !== 'support' + indexQ && Object.keys(q.support).length === 0">
										<label :for="'televerser-support' + indexQ"><i class="material-icons">add_photo_alternate</i></label>
										<input :id="'televerser-support' + indexQ" type="file" @change="televerserImage(indexQ, 'support', 'Sondage')" style="display: none" accept=".jpg, .jpeg, .png, .gif">
									</span>
									<span class="actions image" role="button" tabindex="0" :title="$t('afficherImage')" v-else-if="chargement !== 'support' + indexQ && Object.keys(q.support).length > 0" @click="afficherSupport(indexQ, '/fichiers/' + code + '/' + q.support.image)" :style="{'background-image': 'url(/fichiers/' + code + '/' + q.support.image + ')'}" />
								</div>
							</div>

							<div :id="'items' + indexQ" class="section" :key="'items_' + indexQ">
								<h2>{{ $t('reponses') }}</h2>
								<div class="options">
									<label class="bouton-radio">{{ $t('choixUnique') }}
										<input type="radio" :name="'option' + indexQ" :checked="q.option === 'choix-unique'" @change="modifierOption(indexQ, 'choix-unique')">
										<span class="coche" />
									</label>
									<label class="bouton-radio">{{ $t('choixMultiples') }}
										<input type="radio" :name="'option' + indexQ" :checked="q.option === 'choix-multiples'" @change="modifierOption(indexQ, 'choix-multiples')">
										<span class="coche" />
									</label>
								</div>
								<draggable class="items" v-model="q.items" draggable=".item" handle=".poignee" filter=".desactive" :animation="150" :scroll="true" :force-fallback="true">
									<div :id="'item' + indexQ + '_' + index" class="item" v-for="(item, index) in q.items" :key="'item_' + index">
										<span class="poignee" :class="{'desactive': chargement.substring(0, 5) === 'image' || q.items.length === 1}">
											<i class="material-icons">drag_indicator</i>
										</span>
										<div class="conteneur-textarea" :class="{'image': item.image !== ''}">
											<textarea-autosize v-model="q.items[index].texte" :rows="1" :min-height="46" :max-height="94" :placeholder="'Choix ' + (index + 1)" />
										</div>
										<span class="actions" v-if="chargement === 'image' + indexQ + '_' + index">
											<span class="conteneur-chargement">
												<span class="chargement" />
												<span class="progression">{{ progression }} %</span>
											</span>
											<span @click="supprimerItem(indexQ, index)" :class="{'desactive': q.items.length === 1}" :title="$t('supprimerReponse')"><i class="material-icons">delete</i></span>
										</span>
										<span class="actions" v-else-if="chargement !== 'image' + indexQ + '_' + index && item.image === ''">
											<label role="button" tabindex="0" :for="'televerser-image' + indexQ + '_' + index" :title="$t('ajouterImage')"><i class="material-icons">add_photo_alternate</i></label>
											<input :id="'televerser-image' + indexQ + '_' + index" type="file" @change="televerserImage(indexQ, index, 'Sondage')" style="display: none" accept=".jpg, .jpeg, .png, .gif">
											<span @click="supprimerItem(indexQ, index)" :class="{'desactive': q.items.length === 1}" :title="$t('supprimerReponse')"><i class="material-icons">delete</i></span>
										</span>
										<span class="actions" v-else-if="chargement !== 'image' + indexQ + '_' + index && item.image !== ''">
											<span class="image" @click="afficherImage(indexQ, '/fichiers/' + code + '/' + item.image, index)" :title="$t('afficherImage')" :style="{'background-image': 'url(/fichiers/' + code + '/' + item.image + ')'}" />
											<span @click="supprimerItem(indexQ, index)" :class="{'desactive': q.items.length === 1}" :title="$t('supprimerReponse')"><i class="material-icons">delete</i></span>
										</span>
									</div>
								</draggable>

								<span :id="'ajouter' + indexQ" class="ajouter" role="button" tabindex="0" :title="$t('ajouterReponse')" @click="ajouterItem(indexQ, 'Sondage')" v-if="q.items.length < 26"><i class="material-icons">add_circle_outline</i></span>
							</div>

							<div :id="'actions' + indexQ" class="section" :key="'actions_' + indexQ">
								<span class="bouton supprimer" role="button" tabindex="0" @click="supprimerQuestion(indexQ)" v-if="questions.length > 1">{{ $t('supprimer') }}</span>
								<span class="bouton dupliquer" role="button" tabindex="0" @click="dupliquerQuestion(indexQ)">{{ $t('dupliquer') }}</span>
							</div>
						</div>
					</div>
				</div>
			</template>
		</draggable>

		<div class="section">
			<span id="ajouter-question" class="bouton" role="button" tabindex="0" @click="ajouterQuestion('Sondage')">{{ $t('ajouterQuestion') }}</span>
		</div>

		<div class="conteneur-modale" v-if="modale === 'ajouter-media'">
			<div id="modale-ajouter-media" class="modale">
				<header>
					<span class="titre">{{ $t('ajouterMedia') }}</span>
					<span class="fermer" role="button" tabindex="0" @click="fermerModaleAjouterMedia"><i class="material-icons">close</i></span>
				</header>
				<div class="conteneur">
					<div class="contenu" v-if="chargement === ''">
						<label>{{ $t('lienVideo') }}</label>
						<div class="valider">
							<input type="text" :value="lien" @input="lien = $event.target.value" @keydown.enter="ajouterVideo">
							<span role="button" tabindex="0" :title="$t('valider')" class="bouton-secondaire" @click="ajouterVideo"><i class="material-icons">search</i></span>
						</div>
						<div class="separateur"><span>{{ $t('ou') }}</span></div>
						<label>{{ $t('fichierImageAudio') }}</label>
						<label class="bouton" role="button" tabindex="0" for="selectionner-media">{{ $t('selectionnerFichier') }}</label>
						<input id="selectionner-media" type="file" @change="televerserMedia($event, 'Sondage')" style="display: none" accept=".jpg, .jpeg, .png, .gif, .mp3, .wav, .m4a, .ogg">
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

		<div class="conteneur-modale" v-else-if="modale === 'support'">
			<div id="modale-image" class="modale">
				<header>
					<span class="titre" />
					<span class="fermer" role="button" tabindex="0" @click="fermerModaleImage"><i class="material-icons">close</i></span>
				</header>
				<div class="conteneur">
					<div class="contenu">
						<img :src="image" :alt="$t('image')">
						<div class="actions">
							<label :for="'televerser-support' + indexQuestion" class="bouton" role="button" tabindex="0">{{ $t('modifier') }}</label>
							<input :id="'televerser-support' + indexQuestion" type="file" @change="televerserImage(indexQuestion, 'support', 'Sondage')" style="display: none" accept=".jpg, .jpeg, .png, .gif">
							<span class="bouton" role="button" tabindex="0" @click="supprimerImage(indexQuestion, 'support')">{{ $t('supprimer') }}</span>
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
							<label :for="'televerser-image' + indexQuestion + '_' + indexImage" class="bouton" role="button" tabindex="0">{{ $t('modifier') }}</label>
							<input :id="'televerser-image' + indexQuestion + '_' + indexImage" type="file" @change="televerserImage(indexQuestion, indexImage, 'Sondage')" style="display: none" accept=".jpg, .jpeg, .png, .gif">
							<span class="bouton" role="button" tabindex="0" @click="supprimerImage(indexQuestion, indexImage)">{{ $t('supprimer') }}</span>
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>
</template>

<script>
import draggable from 'vuedraggable'
import methodesMultiCreer from '@/assets/js/methodes-multi-creer'

export default {
	name: 'SondageCreer',
	components: {
		draggable
	},
	extends: methodesMultiCreer,
	props: {
		code: String,
		donnees: Object,
		statut: String,
		enregistrement: String
	},
	data () {
		return {
			description: '',
			support: {},
			options: {
				progression: 'libre',
				nom: 'facultatif'
			},
			questions: [
				{
					question: '',
					support: {},
					option: 'choix-unique',
					items: [{ texte: '', image: '', alt: '' }, { texte: '', image: '', alt: '' }]
				}
			],
			accordeonOuvert: 0,
			indexQuestion: 0,
			chargement: '',
			modale: '',
			image: '',
			indexImage: -1,
			images: [],
			corbeille: [],
			progression: 0,
			lien: '',
			media: {},
			medias: []
		}
	},
	computed: {
		hote () {
			return this.$store.state.hote
		}
	},
	created () {
		if (Object.keys(this.donnees).length > 0 && this.donnees.hasOwnProperty('questions')) {
			this.description = this.donnees.description
			this.support = this.donnees.support
			this.options = this.donnees.options
			this.questions = this.donnees.questions
		} else if (Object.keys(this.donnees).length > 0 && this.donnees.hasOwnProperty('question')) { // compatibilité avec l'ancien type de sondage
			this.questions = []
			this.questions.push(this.donnees)
		}
	},
	mounted () {
		this.$nextTick(function () {
			const accordeon = document.querySelector('#accordeon0 .contenu-accordeon')
			accordeon.style.display = 'block'
			if (this.description === '') {
				document.querySelector('#description textarea').focus()
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
		modifierOption (indexQuestion, option) {
			this.questions[indexQuestion].option = option
		}
	}
}
</script>

<style scoped src="@/assets/css/styles-multi-creer.css"></style>

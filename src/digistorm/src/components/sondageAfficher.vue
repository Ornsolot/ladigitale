<template>
	<div id="sondage" :class="{'avec-actions': (options.progression === 'animateur' && (statut === 'attente' || (statut === 'ouvert' && (((description !== '' || Object.keys(support).length > 0) && indexQuestion === -1) || questions.length > 1)))) || (options.progression === 'libre' && ((description !== '' || Object.keys(support).length > 0) || (description === '' && Object.keys(support).length === 0 && questions.length > 1)))}">
		<div id="attente" v-if="statut === 'attente'">
			<h2>{{ $t('sondageEnAttenteDemarrage') }}</h2>
			<div class="info-attente" v-html="$t('infoSondageEnAttenteDemarrage')" />
			<div class="points">
				<span class="point" />
				<span class="point" />
				<span class="point" />
			</div>
			<h2 v-if="options.nom === 'obligatoire'">{{ $t('listeParticipants') }}</h2>
			<div class="utilisateurs-connectes" v-if="options.nom === 'obligatoire' && utilisateurs.length > 0">
				<template v-for="(utilisateur, indexUtilisateur) in utilisateurs">
					<div class="utilisateur" v-if="utilisateur.nom !== '' && utilisateur.connecte !== false" :key="'utilisateur_' + indexUtilisateur">
						<span>{{ utilisateur.nom }}</span>
					</div>
				</template>
			</div>
			<div class="vide" v-else-if="options.nom === 'obligatoire' && utilisateurs.length === 0">
				{{ $t('aucunParticipant') }}
			</div>
		</div>

		<div class="sondage" v-else-if="statut === 'ouvert'">
			<div id="progression" v-if="indexQuestion > -1 && questions.length > 1">
				{{ $t('question') }} {{ indexQuestion + 1 }} / {{ questions.length }}
			</div>
			<div id="progression" v-else-if="indexQuestion === -1 && description !=='' && Object.keys(support).length === 0">
				{{ $t('description') }}
			</div>
			<div id="progression" v-else-if="indexQuestion === -1 && description ==='' && Object.keys(support).length > 0">
				{{ $t('support') }}
			</div>
			<div id="progression" v-else-if="indexQuestion === -1 && description !=='' && Object.keys(support).length > 0">
				{{ $t('descriptionEtSupport') }}
			</div>

			<div id="support" v-if="indexQuestion > -1 && Object.keys(support).length > 0">
				<span class="bouton" role="button" tabindex="0" @click="afficherMedia">{{ $t('afficherSupport') }}</span>
			</div>

			<div id="description" v-if="description !== '' || Object.keys(support).length > 0" v-show="indexQuestion === -1">
				<div class="description" v-if="description !== ''" v-html="description" />

				<div class="support" v-if="Object.keys(support).length > 0">
					<img v-if="support.type === 'image'" :src="'/fichiers/' + code + '/' + support.fichier" :alt="support.alt" @click="afficherImage($event, '/fichiers/' + code + '/' + support.fichier)">
					<audio v-else-if="support.type === 'audio'" controls :src="'/fichiers/' + code + '/' + support.fichier" />
					<div class="video" v-else-if="support.type === 'video'">
						<iframe :src="support.lien" allowfullscreen />
					</div>
				</div>
			</div>

			<div id="questions" :class="{'avec-progression': indexQuestion > -1 && questions.length > 1}">
				<transition-group name="fondu">
					<div class="q" v-for="(q, indexQ) in questions" v-show="indexQuestion === indexQ" :key="'q_' + indexQ">
						<div :id="'question' + indexQ">
							<div class="question-et-support" v-if="q.question !== '' && Object.keys(q.support).length > 0">
								<span class="question">{{ q.question }}</span>
								<span class="support" @click="afficherImage($event, '/fichiers/' + code + '/' + q.support.image)" :title="$t('afficherImage')"><img :src="'/fichiers/' + code + '/' + q.support.image" :alt="q.support.alt"></span>
							</div>
							<div class="question" v-else-if="q.question !== ''" v-html="q.question" />
							<div class="support" v-else-if="Object.keys(q.support).length > 0">
								<img :src="'/fichiers/' + code + '/' + q.support.image" :alt="q.support.alt" @click="afficherImage($event, '/fichiers/' + code + '/' + q.support.image)" :title="$t('afficherImage')">
							</div>
						</div>

						<div :id="'items' + indexQ" class="items resultats" v-if="resultats && !classementResultats">
							<template v-for="(item, index) in q.items">
								<div :id="'item' + indexQ + '_' + index" class="item" :class="{'reponse': statistiques[indexQ].pourcentages[index] > 0}" v-if="item.texte !== '' || item.image !== ''" :key="'item_' + indexQ + '_' + index">
									<div class="progression" :style="{'width': statistiques[indexQ].pourcentages[index] + '%'}" />
									<div class="contenu">
										<span class="index">{{ alphabet[index].toUpperCase() }}</span>
										<span class="image" @click="afficherImage($event, '/fichiers/' + code + '/' + item.image)" v-if="item.image !== ''"><img :src="'/fichiers/' + code + '/' + item.image" :alt="item.alt"></span>
										<span class="texte" v-if="item.texte !== ''">{{ item.texte }}</span>
									</div>
									<div class="statistiques">
										<span class="personnes curseur" @click="afficherModaleListe(statistiques[indexQ].liste[index])" v-if="options.nom === 'obligatoire' && statistiques[indexQ].personnes[index] > 0">{{ statistiques[indexQ].personnes[index] }} <i class="material-icons">person</i></span>
										<span class="personnes" v-else>{{ statistiques[indexQ].personnes[index] }} <i class="material-icons">person</i></span>
										<span class="pourcentages">{{ statistiques[indexQ].pourcentages[index] }}%</span>
									</div>
								</div>
							</template>
						</div>
						<div :id="'items' + indexQ" class="items resultats" v-else-if="resultats && classementResultats">
							<template v-for="(item, index) in itemsClasses">
								<div :id="'item' + indexQ + '_' + index" class="item" :class="{'reponse': item.pourcentages > 0}" v-if="item.texte !== '' || item.image !== ''" :key="'item_' + indexQ + '_' + index">
									<div class="progression" :style="{'width': item.pourcentages + '%'}" />
									<div class="contenu">
										<span class="index">{{ item.alphabet.toUpperCase() }}</span>
										<span class="image" @click="afficherImage($event, '/fichiers/' + code + '/' + item.image)" v-if="item.image !== ''"><img :src="'/fichiers/' + code + '/' + item.image" :alt="item.alt"></span>
										<span class="texte" v-if="item.texte !== ''">{{ item.texte }}</span>
									</div>
									<div class="statistiques">
										<span class="personnes curseur" @click="afficherModaleListe(item.liste)" v-if="options.nom === 'obligatoire' && item.liste.length > 0">{{ item.personnes }} <i class="material-icons">person</i></span>
										<span class="personnes" v-else>{{ item.personnes }} <i class="material-icons">person</i></span>
										<span class="pourcentages">{{ item.pourcentages }}%</span>
									</div>
								</div>
							</template>
						</div>
						<div :id="'items' + indexQ" class="items" v-else>
							<div :id="'item' + indexQ + '_' + index" class="item" v-for="(item, index) in q.items" :key="'item_' + indexQ + '_' + index">
								<span class="index">{{ alphabet[index].toUpperCase() }}</span>
								<span class="image" @click="afficherImage($event, '/fichiers/' + code + '/' + item.image)" v-if="item.image !== ''"><img :src="'/fichiers/' + code + '/' + item.image" :alt="item.alt"></span>
								<span class="texte" v-if="item.texte !== ''">{{ item.texte }}</span>
							</div>
						</div>
					</div>
				</transition-group>
			</div>
		</div>

		<div id="actions" v-if="options.progression === 'animateur' && (statut === 'attente' || (statut === 'ouvert' && (((description !== '' || Object.keys(support).length > 0) && indexQuestion === -1) || questions.length > 1)))">
			<div class="section">
				<span class="bouton" role="button" tabindex="0" @click="$emit('demarrer')" v-if="statut === 'attente'">{{ $t('demarrerSondage') }}</span>

				<span class="bouton" role="button" tabindex="0" @click="modifierIndexQuestion('suivant')" v-if="statut === 'ouvert' && indexQuestion < (questions.length - 1)">{{ $t('suivant') }}</span>

				<span class="bouton" role="button" tabindex="0" @click="afficherModaleQuestion" v-if="statut === 'ouvert' && indexQuestion === (questions.length - 1)">{{ $t('afficherResultats') }}</span>
			</div>
		</div>
		<div id="actions" v-else-if="options.progression === 'libre' && ((description !== '' || Object.keys(support).length > 0) || (description === '' && Object.keys(support).length === 0 && questions.length > 1))">
			<div class="section">
				<span class="bouton" role="button" tabindex="0" @click="modifierIndexQuestion('precedent')" v-if="statut === 'ouvert' && indexQuestion > -1 && (description !== '' || Object.keys(support).length > 0)">{{ $t('precedent') }}</span>

				<span class="bouton" role="button" tabindex="0" @click="modifierIndexQuestion('precedent')" v-else-if="statut === 'ouvert' && indexQuestion > 0 && description === '' && Object.keys(support).length === 0">{{ $t('precedent') }}</span>

				<span class="bouton" role="button" tabindex="0" @click="modifierIndexQuestion('suivant')" v-if="statut === 'ouvert' && indexQuestion < (questions.length - 1)">{{ $t('suivant') }}</span>
			</div>
		</div>

		<div class="conteneur-modale" v-if="modaleQuestion">
			<div id="modale-question" class="modale">
				<header>
					<span class="titre" v-if="indexQuestionModale === -1 && description !== '' && Object.keys(support).length === 0">{{ $t('description') }}</span>
					<span class="titre" v-else-if="indexQuestionModale === -1 && description === '' && Object.keys(support).length > 0">{{ $t('support') }}</span>
					<span class="titre" v-else-if="indexQuestionModale === -1 && description !== '' && Object.keys(support).length > 0">{{ $t('descriptionEtSupport') }}</span>
					<span class="titre" v-else>{{ $t('question') }} {{ indexQuestionModale + 1 }}</span>
					<span class="fermer" role="button" tabindex="0" @click="fermerModaleQuestion"><i class="material-icons">close</i></span>
				</header>
				<div class="conteneur">
					<div class="contenu" v-if="indexQuestionModale > -1">
						<div id="m_questions">
							<transition-group name="fondu">
								<div class="m_q" v-for="(q, indexQ) in questions" v-show="indexQuestionModale === indexQ" :key="'m_q_' + indexQ">
									<div :id="'m_question' + indexQ">
										<div class="question-et-support" v-if="q.question !== '' && Object.keys(q.support).length > 0">
											<span class="question">{{ q.question }}</span>
											<span class="support" @click="afficherImage($event, '/fichiers/' + code + '/' + q.support.image)" :title="$t('afficherImage')"><img :src="'/fichiers/' + code + '/' + q.support.image" :alt="q.support.alt"></span>
										</div>
										<div class="question" v-else-if="q.question !== ''" v-html="q.question" />
										<div class="support" v-else-if="Object.keys(q.support).length > 0">
											<img :src="'/fichiers/' + code + '/' + q.support.image" :alt="q.support.alt" @click="afficherImage($event, '/fichiers/' + code + '/' + q.support.image)" :title="$t('afficherImage')">
										</div>
									</div>
									<div id="m_items" class="items resultats">
										<template v-for="(item, index) in itemsClassesModale">
											<div :id="'m_item' + indexQ + '_' + index" class="item" :class="{'reponse': item.pourcentages > 0}" :key="'m_item' + indexQ + '_' + index">
												<div class="progression" :style="{'width': item.pourcentages + '%'}" />
												<div class="contenu">
													<span class="index">{{ item.alphabet.toUpperCase() }}</span>
													<span class="image" @click="afficherImage($event, '/fichiers/' + code + '/' + item.image)" v-if="item.image !== ''"><img :src="'/fichiers/' + code + '/' + item.image" :alt="item.alt"></span>
													<span class="texte" v-if="item.texte !== ''">{{ item.texte }}</span>
												</div>
												<div class="statistiques">
													<span class="personnes" :title="definirListe(item.liste)" v-if="options.nom === 'obligatoire' && item.liste.length > 0">{{ item.personnes }} <i class="material-icons">person</i></span>
													<span class="personnes" v-else>{{ item.personnes }} <i class="material-icons">person</i></span>
													<span class="pourcentages">{{ item.pourcentages }}%</span>
												</div>
											</div>
										</template>
									</div>
								</div>
							</transition-group>
						</div>
					</div>
					<div class="contenu" v-else>
						<div id="m_description">
							<div class="description" v-if="description !== ''" v-html="description" />
							<div class="support" v-if="Object.keys(support).length > 0">
								<img v-if="support.type === 'image'" :src="'/fichiers/' + code + '/' + support.fichier" :alt="support.alt" @click="afficherImage($event, '/fichiers/' + code + '/' + support.fichier)">
								<audio v-else-if="support.type === 'audio'" controls :src="'/fichiers/' + code + '/' + support.fichier" />
								<div class="video" v-else-if="support.type === 'video'">
									<iframe :src="support.lien" allowfullscreen />
								</div>
							</div>
						</div>
					</div>
				</div>
				<footer class="footer">
					<span class="bouton icone" role="button" tabindex="0" :title="$t('questionPrecedente')" :class="{'invisible': (indexQuestionModale === -1 && (description !== '' || Object.keys(support).length > 0)) || (indexQuestionModale === 0 && description === '' && Object.keys(support).length === 0)}" @click="modifierIndexQuestionModale('precedente')"><i class="material-icons">arrow_back</i></span>

					<span class="bouton icone" role="button" tabindex="0" :title="$t('questionSuivante')" :class="{'invisible': indexQuestionModale === (donnees.questions.length - 1)}" @click="modifierIndexQuestionModale('suivante')"><i class="material-icons">arrow_forward</i></span>
				</footer>
			</div>
		</div>

		<div class="conteneur-modale" v-else-if="modale === 'liste'">
			<div id="modale-liste" class="modale">
				<header>
					<span class="titre">{{ $t('listeRepondants') }}</span>
					<span class="fermer" role="button" tabindex="0" @click="fermerModaleListe"><i class="material-icons">close</i></span>
				</header>
				<div class="conteneur">
					<div class="contenu">
						<div class="liste">
							{{ liste }}
						</div>
					</div>
				</div>
			</div>
		</div>

		<div class="conteneur-modale" v-if="modale === 'image'">
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

		<div class="conteneur-modale" v-else-if="modale === 'media'">
			<div id="modale-media" class="modale">
				<div class="conteneur">
					<div class="contenu">
						<img v-if="support.type === 'image'" :src="'/fichiers/' + code + '/' + support.fichier" :alt="$t('image')">
						<audio v-else-if="support.type === 'audio'" controls :src="'/fichiers/' + code + '/' + support.fichier" />
						<div class="video" v-else-if="support.type === 'video'">
							<iframe :src="support.lien" allowfullscreen />
						</div>
						<div class="actions">
							<span class="bouton" role="button" tabindex="0" @click="fermerModaleMedia">{{ $t('fermer') }}</span>
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>
</template>

<script>
import methodesMultiAfficher from '@/assets/js/methodes-multi-afficher'

export default {
	name: 'SondageAfficher',
	extends: methodesMultiAfficher,
	props: {
		code: String,
		donnees: Object,
		reponses: Array,
		statut: String,
		resultats: Boolean,
		utilisateurs: Array,
		classementResultats: Boolean,
		indexQuestion: Number
	},
	data () {
		return {
			description: '',
			support: {},
			options: {},
			questions: [],
			modale: '',
			image: '',
			alphabet: ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z'],
			modaleQuestion: false,
			indexQuestionModale: -1,
			liste: ''
		}
	},
	computed: {
		hote () {
			return this.$store.state.hote
		},
		statistiques () {
			const statistiques = []
			this.questions.forEach(function (question, indexQuestion) {
				const personnes = []
				const pourcentages = []
				const liste = []
				for (let i = 0; i < question.items.length; i++) {
					personnes.push(0)
					pourcentages.push(0)
					liste.push([])
				}
				question.items.forEach(function (item, index) {
					let reponses = 0
					const utilisateurs = []
					this.reponses.forEach(function (donnees) {
						if (this.donnees.hasOwnProperty('questions')) {
							donnees.reponse[indexQuestion].forEach(function (reponse) {
								if (reponse === item.texte || reponse === item.image) {
									reponses++
									utilisateurs.push(donnees.identifiant)
								}
							})
						} else if (this.donnees.hasOwnProperty('question')) {
							donnees.reponse.forEach(function (reponse) {
								if (reponse === item.texte || reponse === item.image) {
									reponses++
									utilisateurs.push(donnees.identifiant)
								}
							})
						}
					}.bind(this))
					if (reponses > 0) {
						personnes[index] = reponses
						const pourcentage = (reponses / this.reponses.length) * 100
						pourcentages[index] = Math.round(pourcentage)
						liste[index] = utilisateurs
					}
				}.bind(this))
				statistiques.push({ personnes: personnes, pourcentages: pourcentages, liste: liste })
			}.bind(this))
			return statistiques
		},
		itemsClasses () {
			const items = JSON.parse(JSON.stringify(this.questions[this.indexQuestion].items))
			items.forEach(function (item, index) {
				item.personnes = this.statistiques[this.indexQuestion].personnes[index]
				item.pourcentages = this.statistiques[this.indexQuestion].pourcentages[index]
				item.liste = this.statistiques[this.indexQuestion].liste[index]
				item.alphabet = this.alphabet[index]
			}.bind(this))
			items.sort(function (a, b) {
				return b.personnes - a.personnes
			})
			return items
		},
		itemsClassesModale () {
			const items = JSON.parse(JSON.stringify(this.questions[this.indexQuestionModale].items))
			items.forEach(function (item, index) {
				item.personnes = this.statistiques[this.indexQuestionModale].personnes[index]
				item.pourcentages = this.statistiques[this.indexQuestionModale].pourcentages[index]
				item.liste = this.statistiques[this.indexQuestionModale].liste[index]
				item.alphabet = this.alphabet[index]
			}.bind(this))
			items.sort(function (a, b) {
				return b.personnes - a.personnes
			})
			return items
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
			this.$emit('index', 0)
		}
	},
	mounted () {
		this.$nextTick(function () {
			window.MathJax.typeset()
		})
	},
	methods: {
		modifierIndexQuestion (direction) {
			let indexQuestion
			if (direction === 'suivant') {
				indexQuestion = this.indexQuestion + 1
			} else {
				indexQuestion = this.indexQuestion - 1
			}
			this.$emit('index', indexQuestion)
			this.$nextTick(function () {
				window.MathJax.typeset()
			})
		},
		afficherModaleQuestion () {
			if (this.description === '' && Object.keys(this.support).length === 0) {
				this.indexQuestionModale = 0
			} else {
				this.indexQuestionModale = -1
			}
			this.modaleQuestion = true
			this.$nextTick(function () {
				window.MathJax.typeset()
			})
		},
		fermerModaleQuestion () {
			this.modaleQuestion = false
			this.indexQuestionModale = -1
		},
		modifierIndexQuestionModale (direction) {
			if (direction === 'precedente') {
				this.indexQuestionModale--
			} else if (direction === 'suivante') {
				this.indexQuestionModale++
			}
			this.$nextTick(function () {
				window.MathJax.typeset()
			})
		}
	}
}
</script>

<style scoped src="@/assets/css/styles-multi-afficher.css"></style>

<style>
#attente .info-attente p {
	margin-bottom: 5px;
}

#attente .info-attente p:last-child {
	margin-bottom: 0;
}
</style>

<template>
	<div id="questionnaire" :class="{'avec-actions': options.progression === 'animateur'}">
		<div id="attente" v-if="statut === 'attente'">
			<h2>{{ $t('questionnaireEnAttenteDemarrage') }}</h2>
			<div class="info-attente" v-html="$t('infoQuestionnaireEnAttenteDemarrage')" />
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

		<div id="tableau" v-if="statut === 'ouvert' && (options.progression === 'libre' || tableauResultats === true)">
			<div class="tableau">
				<h2>{{ $t('tableauResultats') }}</h2>
				<table>
					<thead>
						<tr>
							<td class="utilisateurs">
								<span role="button" tabindex="0" @click="cacherNoms" v-if="nomsVisible">{{ $t('cacherNoms') }}</span>
								<span role="button" tabindex="0" @click="afficherNoms" v-else>{{ $t('afficherNoms') }}</span>
								<select v-model="triTableau">
									<option value="nom">{{ $t('nomOuPseudo') }}</option>
									<option value="score">{{ $t('score') }}</option>
									<option value="progression">{{ $t('progression') }}</option>
								</select>
							</td>
							<td class="score">
								<span>{{ $t('points') }}</span>
							</td>
							<td class="question" @click="afficherSupport" v-if="description !== '' || Object.keys(support).length > 0">
								<span class="index">&nbsp;</span>
								<span class="type">
									<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#00ced1" width="24" height="24"><path d="M0 0h24v24H0z" fill="none" /><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" /></svg>
								</span>
							</td>
							<td class="question" v-for="(q, indexQ) in questions" @click="afficherQuestion(q, indexQ)" :key="'question_' + indexQ">
								<span class="index">{{ indexQ + 1 }}</span>
								<span class="type" v-if="q.option === 'choix-unique'">
									<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 32 32"><path fill="#00ced1" d="M1.333 30.667h29.333V1.334H1.333v29.333zM0 0h32v32H0V0z" /><path fill="#00ced1" d="M5.333 8A2.66 2.66 0 018 5.333 2.66 2.66 0 0110.667 8 2.66 2.66 0 018 10.667 2.66 2.66 0 015.333 8zm1.334 8c0 .742.593 1.333 1.333 1.333.742 0 1.333-.593 1.333-1.333 0-.742-.593-1.333-1.333-1.333-.742 0-1.333.593-1.333 1.333zm-1.334 0A2.66 2.66 0 018 13.333 2.66 2.66 0 0110.667 16 2.66 2.66 0 018 18.667 2.66 2.66 0 015.333 16zm1.334 8c0 .742.593 1.333 1.333 1.333.742 0 1.333-.593 1.333-1.333 0-.742-.593-1.333-1.333-1.333-.742 0-1.333.593-1.333 1.333zm-1.334 0A2.66 2.66 0 018 21.333 2.66 2.66 0 0110.667 24 2.66 2.66 0 018 26.667 2.66 2.66 0 015.333 24zm8-14.667h13.333V6.666H13.333zm0 8h13.333v-2.667H13.333zm0 8h13.333v-2.667H13.333z" /></svg>
								</span>
								<span class="type" v-else>
									<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 32 32"><path fill="#00ced1" d="M1.333 30.667h29.333V1.334H1.333v29.333zM0 0h32v32H0V0z" /><path fill="#00ced1" d="M13.333 9.333h13.333V6.666H13.333zm0 8h13.333v-2.667H13.333zm0 8h13.333v-2.667H13.333zM6.667 6.667v2.667h2.667V6.667H6.667zM5.333 5.333h5.333v5.333H5.333V5.333zm0 8h5.333v5.333H5.333zm0 8h5.333v5.333H5.333z" /></svg>
								</span>
							</td>
						</tr>
					</thead>
					<tbody>
						<tr v-for="(u, indexU) in utilisateursTableau" :key="'utilisateur_' + indexU">
							<td class="utilisateur">
								<span class="nom" v-if="((options.nom === 'obligatoire') || (options.nom !== 'obligatoire' && u.nom !== '')) && nomsVisible">{{ u.nom }}</span>
								<span class="masque" v-else-if="!nomsVisible" />
								<span class="nom" v-else-if="options.nom !== 'obligatoire' && nomsVisible && u.nom === ''">{{ $t('participant') }} {{ indexU + 1 }}</span>
							</td>
							<td class="score">
								{{ definirScore(u.identifiant) }}
							</td>
							<td class="question" v-if="description !== '' || Object.keys(support).length > 0">
								<span>-</span>
							</td>
							<td class="question" :class="{'correct': definirReponseQuestion(u.identifiant, indexQ).bonneReponse === true, 'partiellement-correct': definirReponseQuestion(u.identifiant, indexQ).reponsePartielle === true, 'incorrect': definirReponseQuestion(u.identifiant, indexQ).bonneReponse === false && definirReponseQuestion(u.identifiant, indexQ).reponsePartielle === false && definirReponseQuestion(u.identifiant, indexQ).reponses > 0}" v-for="(q, indexQ) in questions" :key="'question_' + indexQ">
								<span v-if="definirReponseQuestion(u.identifiant, indexQ).bonneReponse === true || definirReponseQuestion(u.identifiant, indexQ).reponsePartielle === true"><i class="material-icons">done</i></span>
								<span v-else-if="definirReponseQuestion(u.identifiant, indexQ).bonneReponse === false && definirReponseQuestion(u.identifiant, indexQ).reponses > 0"><i class="material-icons">close</i></span>
								<span v-else>-</span>
								<span class="points">{{ definirReponseQuestion(u.identifiant, indexQ).score }}</span>
							</td>
						</tr>
					</tbody>
				</table>
			</div>
		</div>

		<div class="questionnaire" v-else-if="statut === 'ouvert' && options.progression === 'animateur'">
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

						<div :id="'items' + indexQ" class="items resultats" v-if="resultats">
							<template v-for="(item, index) in q.items">
								<div :id="'item' + indexQ + '_' + index" class="item" :class="{'reponse': statistiques[indexQ].pourcentages[index] > 0, 'correct': reponseVisible && item.reponse}" v-if="item.texte !== '' || item.image !== ''" :key="'item_' + indexQ + '_' + index">
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
						<div :id="'items' + indexQ" class="items" v-else>
							<div :id="'item' + indexQ + '_' + index" class="item" v-for="(item, index) in q.items" :class="{'correct': reponseVisible && item.reponse}" :key="'item_' + indexQ + '_' + index">
								<span class="index">{{ alphabet[index].toUpperCase() }}</span>
								<span class="image" @click="afficherImage($event, '/fichiers/' + code + '/' + item.image)" v-if="item.image !== ''"><img :src="'/fichiers/' + code + '/' + item.image" :alt="item.alt"></span>
								<span class="texte" v-if="item.texte !== ''">{{ item.texte }}</span>
							</div>
						</div>
					</div>
				</transition-group>
			</div>
		</div>

		<div id="actions" v-if="options.progression === 'animateur'">
			<div class="section">
				<span class="bouton" role="button" tabindex="0" @click="$emit('demarrer')" v-if="statut === 'attente'">{{ $t('demarrerQuestionnaire') }}</span>

				<span class="bouton" role="button" tabindex="0" @click="modifierIndexQuestion" v-if="statut === 'ouvert' && indexQuestion === -1 && donnees.options.classement === true">{{ $t('suivant') }}</span>

				<span class="bouton" role="button" tabindex="0" @click="modifierIndexQuestion" v-else-if="statut === 'ouvert' && indexQuestion < (questions.length - 1) && donnees.options.classement === false">{{ $t('suivant') }}</span>

				<span class="bouton" role="button" tabindex="0" @click="afficherClassement" v-else-if="statut === 'ouvert' && indexQuestion < (questions.length - 1) && donnees.options.classement === true">{{ $t('suivant') }}</span>

				<span class="bouton" role="button" tabindex="0" @click="afficherClassement" v-else-if="statut === 'ouvert' && indexQuestion === (questions.length - 1) && donnees.options.classement === true">{{ $t('podium') }}</span>

				<span class="bouton" role="button" tabindex="0" @click="afficherResultats" v-if="statut === 'ouvert' && indexQuestion === (questions.length - 1) && !tableauResultats">{{ $t('tableauResultats') }}</span>

				<span class="bouton" role="button" tabindex="0" @click="afficherResultats" v-if="statut === 'ouvert' && indexQuestion === (questions.length - 1) && tableauResultats">{{ $t('retour') }}</span>
			</div>
		</div>

		<div class="conteneur-modale" v-if="modaleQuestion">
			<div id="modale-question" class="modale">
				<header>
					<span class="titre" v-if="indexQuestionTableau === -1 && description !== '' && Object.keys(support).length === 0">{{ $t('description') }}</span>
					<span class="titre" v-else-if="indexQuestionTableau === -1 && description === '' && Object.keys(support).length > 0">{{ $t('support') }}</span>
					<span class="titre" v-else-if="indexQuestionTableau === -1 && description !== '' && Object.keys(support).length > 0">{{ $t('descriptionEtSupport') }}</span>
					<span class="titre" v-else>{{ $t('question') }} {{ indexQuestionTableau + 1 }}</span>
					<span class="fermer" role="button" tabindex="0" @click="fermerModaleQuestion"><i class="material-icons">close</i></span>
				</header>
				<div class="conteneur">
					<div class="contenu" v-if="donneesQuestion.type === 'question'">
						<div id="question">
							<div class="question-et-support" v-if="donneesQuestion.question !== '' && Object.keys(donneesQuestion.support).length > 0">
								<span class="question">{{ donneesQuestion.question }}</span>
								<span class="support" @click="afficherImage($event, '/fichiers/' + code + '/' + donneesQuestion.support.image)" :title="$t('afficherImage')"><img :src="'/fichiers/' + code + '/' + donneesQuestion.support.image" :alt="donneesQuestion.support.alt"></span>
							</div>
							<div class="question" v-else-if="donneesQuestion.question !== ''" v-html="donneesQuestion.question" />
							<div class="support" v-else-if="Object.keys(donneesQuestion.support).length > 0">
								<img :src="'/fichiers/' + code + '/' + donneesQuestion.support.image" :alt="donneesQuestion.support.alt" @click="afficherImage($event, '/fichiers/' + code + '/' + donneesQuestion.support.image)" :title="$t('afficherImage')">
							</div>
						</div>

						<div id="items" class="items resultats" v-if="resultatsVisiblesModale">
							<div :id="'m_item' + index" class="item" v-for="(item, index) in donneesQuestion.items" :class="{'reponse': statistiques[indexQuestionTableau].pourcentages[index] > 0, 'correct': reponseVisibleModale && item.reponse}" :key="'m_item_' + index">
								<div class="progression" :style="{'width': statistiques[indexQuestionTableau].pourcentages[index] + '%'}" />
								<div class="contenu">
									<span class="index">{{ alphabet[index].toUpperCase() }}</span>
									<span class="image" @click="afficherImage($event, '/fichiers/' + code + '/' + item.image)" v-if="item.image !== ''"><img :src="'/fichiers/' + code + '/' + item.image" :alt="item.alt"></span>
									<span class="texte" v-if="item.texte !== ''">{{ item.texte }}</span>
								</div>
								<div class="statistiques">
									<span class="personnes">{{ statistiques[indexQuestionTableau].personnes[index] }} <i class="material-icons">person</i></span>
									<span class="pourcentages">{{ statistiques[indexQuestionTableau].pourcentages[index] }}%</span>
								</div>
							</div>
						</div>

						<div id="items" class="items" v-else>
							<div :id="'m_item_' + index" class="item" v-for="(item, index) in donneesQuestion.items" :class="{'correct': reponseVisibleModale && item.reponse}" :key="'m_item_' + index">
								<span class="index">{{ alphabet[index].toUpperCase() }}</span>
								<span class="image" @click="afficherImage($event, '/fichiers/' + code + '/' + item.image)" v-if="item.image !== ''"><img :src="'/fichiers/' + code + '/' + item.image" :alt="item.alt"></span>
								<span class="texte" v-if="item.texte !== ''">{{ item.texte }}</span>
							</div>
						</div>
					</div>
					<div class="contenu" v-else>
						<div id="description">
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
					<span class="bouton icone" role="button" tabindex="0" :title="$t('questionPrecedente')" :class="{'invisible': (indexQuestionTableau === -1 && (description !== '' || Object.keys(support).length > 0)) || (indexQuestionTableau === 0 && description === '' && Object.keys(support).length === 0)}" @click="modifierIndexQuestionTableau('precedente')"><i class="material-icons">arrow_back</i></span>

					<span class="bouton icone" role="button" tabindex="0" :title="$t('afficherReponse')" @click="reponseVisibleModale = true" v-if="!reponseVisibleModale && indexQuestionTableau > -1"><i class="material-icons">unpublished</i></span>
					<span class="bouton icone" role="button" tabindex="0" :title="$t('masquerReponse')" @click="reponseVisibleModale = false" v-else-if="reponseVisibleModale && indexQuestionTableau > -1"><i class="material-icons">check_circle</i></span>

					<span class="bouton icone" role="button" tabindex="0" :title="$t('afficherResultats')" @click="resultatsVisiblesModale = true" v-if="!resultatsVisiblesModale && indexQuestionTableau > -1"><i class="material-icons">visibility_off</i></span>
					<span class="bouton icone" role="button" tabindex="0" :title="$t('masquerResultats')" @click="resultatsVisiblesModale = false" v-else-if="resultatsVisiblesModale && indexQuestionTableau > -1"><i class="material-icons">visibility</i></span>

					<span class="bouton icone" role="button" tabindex="0" :title="$t('questionSuivante')" :class="{'invisible': indexQuestionTableau === (donnees.questions.length - 1)}" @click="modifierIndexQuestionTableau('suivante')"><i class="material-icons">arrow_forward</i></span>
				</footer>
			</div>
		</div>

		<div class="conteneur-modale" v-if="modale === 'liste'">
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
	name: 'QuestionnaireAfficher',
	extends: methodesMultiAfficher,
	props: {
		code: String,
		donnees: Object,
		reponses: Array,
		statut: String,
		resultats: Boolean,
		utilisateurs: Array,
		classement: Array,
		indexQuestion: Number,
		reponseVisible: Boolean
	},
	data () {
		return {
			description: '',
			support: {},
			options: {},
			questions: [],
			tableauResultats: false,
			modale: '',
			image: '',
			alphabet: ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z'],
			modaleQuestion: false,
			donneesQuestion: {},
			indexQuestionTableau: -1,
			reponseVisibleModale: false,
			resultatsVisiblesModale: false,
			triTableau: 'nom',
			nomsVisible: true,
			liste: ''
		}
	},
	computed: {
		hote () {
			return this.$store.state.hote
		},
		utilisateursTableau () {
			const utilisateurs = []
			this.reponses.forEach(function (reponse) {
				utilisateurs.push({ identifiant: reponse.identifiant, nom: reponse.nom })
			})
			if (this.triTableau === 'score') {
				utilisateurs.forEach(function (utilisateur, index) {
					this.classement.forEach(function (u) {
						if (u.identifiant === utilisateur.identifiant) {
							utilisateurs[index].score = u.score
						}
					})
				}.bind(this))
				utilisateurs.forEach(function (utilisateur, index) {
					if (!utilisateur.hasOwnProperty('score')) {
						utilisateurs[index].score = 0
					}
				})
				utilisateurs.sort(function (a, b) {
					return b.score - a.score
				})
			} else if (this.triTableau === 'progression') {
				utilisateurs.forEach(function (utilisateur, index) {
					this.reponses.forEach(function (item) {
						if (item.identifiant === utilisateur.identifiant) {
							let reponses = 0
							item.reponse.forEach(function (reponse) {
								if (reponse.length > 0) {
									reponses++
								}
							})
							utilisateurs[index].reponses = reponses
						}
					})
				}.bind(this))
				utilisateurs.forEach(function (utilisateur, index) {
					if (!utilisateur.hasOwnProperty('reponses')) {
						utilisateurs[index].reponses = 0
					}
				})
				utilisateurs.sort(function (a, b) {
					return b.reponses - a.reponses
				})
			}
			return utilisateurs
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
					let total = 0
					let reponses = 0
					const utilisateurs = []
					this.reponses.forEach(function (donnees) {
						donnees.reponse[indexQuestion].forEach(function (reponse) {
							if (reponse === item.texte || reponse === item.image) {
								reponses++
								utilisateurs.push(donnees.identifiant)
							}
							total++
						})
					})
					if (reponses > 0) {
						personnes[index] = reponses
						const pourcentage = (reponses / total) * 100
						pourcentages[index] = Math.round(pourcentage)
						liste[index] = utilisateurs
					}
				}.bind(this))
				statistiques.push({ personnes: personnes, pourcentages: pourcentages, liste: liste })
			}.bind(this))
			return statistiques
		}
	},
	watch: {
		indexQuestionTableau: function () {
			this.reponseVisibleModale = false
		}
	},
	created () {
		this.description = this.donnees.description
		this.support = this.donnees.support
		this.options = this.donnees.options
		this.questions = this.donnees.questions
	},
	mounted () {
		this.$nextTick(function () {
			window.MathJax.typeset()
		})
	},
	methods: {
		modifierIndexQuestion () {
			const indexQuestion = this.indexQuestion + 1
			this.$emit('index', indexQuestion)
			this.$nextTick(function () {
				window.MathJax.typeset()
			})
		},
		afficherClassement () {
			this.$emit('classement')
		},
		afficherResultats () {
			this.tableauResultats = !this.tableauResultats
			this.$emit('tableau-resultats', this.tableauResultats)
			this.$nextTick(function () {
				window.MathJax.typeset()
			})
		},
		definirScore (identifiant) {
			let score = 0
			this.classement.forEach(function (utilisateur) {
				if (utilisateur.identifiant === identifiant) {
					score = utilisateur.score
				}
			})
			return score
		},
		definirReponseQuestion (identifiant, indexQuestion) {
			const reponseCorrecte = []
			let bonneReponse = false
			let reponsePartielle = false
			let reponses = 0
			let score = 0
			this.questions[indexQuestion].items.forEach(function (item) {
				if (item.reponse === true && item.texte !== '') {
					reponseCorrecte.push(item.texte)
				} else if (item.reponse === true && item.image !== '') {
					reponseCorrecte.push(item.image)
				}
			})
			const bonnesReponses = []
			const mauvaisesReponses = []
			this.questions[indexQuestion].items.forEach(function (question) {
				if (question.reponse === true) {
					this.reponses.forEach(function (item) {
						if (item.identifiant === identifiant && (item.reponse[indexQuestion].includes(question.texte) || item.reponse[indexQuestion].includes(question.image))) {
							bonnesReponses.push(question)
						}
					})
				} else if (question.reponse === false) {
					this.reponses.forEach(function (item) {
						if (item.identifiant === identifiant && (item.reponse[indexQuestion].includes(question.texte) || item.reponse[indexQuestion].includes(question.image))) {
							mauvaisesReponses.push(question)
						}
					})
				}
			}.bind(this))
			this.reponses.forEach(function (item) {
				if (item.identifiant === identifiant) {
					if (reponseCorrecte.every(i => item.reponse[indexQuestion].includes(i)) === true && mauvaisesReponses.length === 0) {
						bonneReponse = true
					} else if (bonnesReponses.length > mauvaisesReponses.length) {
						reponsePartielle = true
					}
					reponses = item.reponse[indexQuestion].length

					if (item.hasOwnProperty('score') && this.options.points !== 'classique') {
						score = item.score[indexQuestion]
					} else {
						const question = this.questions[indexQuestion]
						if (((question.option === 'choix-unique' && bonnesReponses.length > 0) || (question.option === 'choix-multiples' && reponseCorrecte.every(i => item.reponse[indexQuestion].includes(i)) === true && mauvaisesReponses.length === 0)) && this.options.points === 'classique' && question.hasOwnProperty('points')) {
							score = question.points
						} else if (((question.option === 'choix-unique' && bonnesReponses.length > 0) || (question.option === 'choix-multiples' && reponseCorrecte.every(i => item.reponse[indexQuestion].includes(i)) === true && mauvaisesReponses.length === 0)) && this.options.points === 'classique' && !question.hasOwnProperty('points')) {
							score = 1000
						} else if (((question.option === 'choix-unique' && bonnesReponses.length > 0) || (question.option === 'choix-multiples' && reponseCorrecte.every(i => item.reponse[indexQuestion].includes(i)) === true && mauvaisesReponses.length === 0)) && this.options.points !== 'classique' && question.hasOwnProperty('points')) {
							score = Math.round(question.points - (item.temps[indexQuestion] * 10))
						} else if (((question.option === 'choix-unique' && bonnesReponses.length > 0) || (question.option === 'choix-multiples' && reponseCorrecte.every(i => item.reponse[indexQuestion].includes(i)) === true && mauvaisesReponses.length === 0)) && this.options.points !== 'classique' && !question.hasOwnProperty('points')) {
							score = Math.round(1000 - (item.temps[indexQuestion] * 10))
						} else if ((bonnesReponses.length - mauvaisesReponses.length) > 0 && this.options.points === 'classique' && question.hasOwnProperty('points')) {
							score = ((question.points / reponseCorrecte.length) * (bonnesReponses.length - mauvaisesReponses.length))
						} else if ((bonnesReponses.length - mauvaisesReponses.length) > 0 && this.options.points === 'classique' && !question.hasOwnProperty('points')) {
							score = ((1000 / reponseCorrecte.length) * (bonnesReponses.length - mauvaisesReponses.length))
						} else if ((bonnesReponses.length - mauvaisesReponses.length) > 0 && this.options.points !== 'classique' && question.hasOwnProperty('points')) {
							score = ((Math.round(question.points - (item.temps[indexQuestion] * 10)) / reponseCorrecte.length) * (bonnesReponses.length - mauvaisesReponses.length))
						} else if ((bonnesReponses.length - mauvaisesReponses.length) > 0 && this.options.points !== 'classique' && !question.hasOwnProperty('points')) {
							score = score + ((Math.round(1000 - (item.temps[indexQuestion] * 10)) / reponseCorrecte.length) * (bonnesReponses.length - mauvaisesReponses.length))
						} else {
							score = score + 0
						}
					}
				}
			}.bind(this))
			return { bonneReponse: bonneReponse, reponsePartielle: reponsePartielle, reponses: reponses, score: score }
		},
		afficherSupport () {
			this.donneesQuestion.type = 'support'
			this.indexQuestionTableau = -1
			this.modaleQuestion = true
			this.$nextTick(function () {
				window.MathJax.typeset()
			})
		},
		afficherQuestion (donneesQuestion, indexQuestionTableau) {
			this.donneesQuestion = donneesQuestion
			this.donneesQuestion.type = 'question'
			this.indexQuestionTableau = indexQuestionTableau
			this.modaleQuestion = true
			this.$nextTick(function () {
				window.MathJax.typeset()
			})
		},
		fermerModaleQuestion () {
			this.modaleQuestion = false
			this.donneesQuestion = {}
			this.indexQuestionTableau = -1
			this.reponseVisibleModale = false
			this.resultatsVisiblesModale = false
		},
		modifierIndexQuestionTableau (direction) {
			if (direction === 'precedente') {
				this.indexQuestionTableau--
			} else if (direction === 'suivante') {
				this.indexQuestionTableau++
			}
			this.reponseVisibleModale = false
			this.resultatsVisiblesModale = false
			if (this.indexQuestionTableau === -1) {
				this.donneesQuestion.type = 'support'
			} else {
				this.donneesQuestion = this.donnees.questions[this.indexQuestionTableau]
				this.donneesQuestion.type = 'question'
			}
			this.$nextTick(function () {
				window.MathJax.typeset()
			})
		},
		cacherNoms () {
			this.nomsVisible = false
		},
		afficherNoms () {
			this.nomsVisible = true
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

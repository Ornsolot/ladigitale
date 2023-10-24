<template>
	<div id="page" v-if="(statutUtilisateur === 'auteur' && interactions.map(item => item.code).includes(parseInt(code))) || (statutUtilisateur === 'utilisateur' && proprietaire === identifiant)">
		<div id="interaction" v-if="statut === '' || statut === 'termine'">
			<header>
				<div id="conteneur-header">
					<a id="logo" :href="hote" />

					<div id="titre" class="edition" :class="{'utilisateur': statutUtilisateur === 'utilisateur'}" @click="afficherModaleTitre">
						<span class="titre">{{ titre }}</span>
						<span class="modifier" role="button" tabindex="0" :title="$t('modifierTitre')"><i class="material-icons">edit</i></span>
					</div>

					<div id="parametres">
						<span class="parametres" role="button" tabindex="0" :title="$t('afficherParametres')" @click="afficherModaleParametres"><i class="material-icons">settings</i></span>
						<span class="compte" role="button" tabindex="0" :title="$t('monCompte')" @click="$router.push('/u/' + identifiant)" v-if="statutUtilisateur === 'utilisateur'"><i class="material-icons">account_circle</i></span>
						<span class="deconnexion" role="button" tabindex="0" :title="$t('seDeconnecter')" @click="seDeconnecter" v-if="statutUtilisateur === 'utilisateur'"><i class="material-icons">power_settings_new</i></span>
					</div>
				</div>
			</header>

			<div id="conteneur" class="ascenseur">
				<div class="section">
					<div class="informations">
						<div class="code" :class="{'seul': statutUtilisateur === 'utilisateur'}">
							<span>{{ $t('codeParticipants') }}:</span>
							<span class="information">{{ code }}</span>
							<span id="copier" class="icone" role="button" tabindex="0" :title="$t('copierLien')"><i class="material-icons">content_copy</i></span>
							<span id="afficher" class="icone" role="button" tabindex="0" :title="$t('afficherCodeQR')" @click="afficherModaleCodeQR"><i class="material-icons">qr_code</i></span>
						</div>
						<div class="motdepasse" v-if="statutUtilisateur === 'auteur'">
							<span>{{ $t('motDePasseAdministration') }}:</span>
							<span class="information" v-if="visible">{{ motdepasse }}</span>
							<span class="information" v-else>****</span>
							<span class="icone" role="button" tabindex="0" :title="$t('afficherMotDePasse')" @click="visible = true" v-if="!visible"><i class="material-icons">visibility_off</i></span>
							<span class="icone" role="button" tabindex="0" :title="$t('cacherMotDePasse')" @click="visible = false" v-else><i class="material-icons">visibility</i></span>
						</div>
					</div>
					<div class="telecharger" v-if="statutUtilisateur === 'auteur'">
						<span role="button" tabindex="0" @click="telecharger">{{ $t('telechargerCodeEtMotDePasse') }}</span>
					</div>
				</div>

				<sondageCreer :code="code" :donnees="donnees" :statut="statut" :enregistrement="enregistrement" @enregistrement="enregistrerDonnees" v-if="type === 'Sondage'" />

				<questionnaireCreer :code="code" :donnees="donnees" :statut="statut" :enregistrement="enregistrement" @enregistrement="enregistrerDonnees" v-else-if="type === 'Questionnaire'" />

				<remueMeningesCreer :code="code" :donnees="donnees" :statut="statut" :enregistrement="enregistrement" @enregistrement="enregistrerDonnees" v-else-if="type === 'Remue-méninges'" />

				<nuageMotsCreer :code="code" :donnees="donnees" :statut="statut" :enregistrement="enregistrement" @enregistrement="enregistrerDonnees" v-else-if="type === 'Nuage-de-mots'" />
			</div>

			<footer>
				<div class="section">
					<div class="gauche">
						<span class="bouton mobile" role="button" tabindex="0" :title="$t('afficherResultats')" @click="afficherModaleResultats" v-if="definirNombreReponses() > 0"><i class="material-icons">equalizer</i><span>{{ $t('resultats') }}</span></span>
					</div>
					<div class="droite">
						<span class="bouton mobile" role="button" tabindex="0" @click="enregistrer('enregistrement')"><i class="material-icons">save</i><span>{{ $t('enregistrer') }}</span></span>
						<span class="bouton" role="button" tabindex="0" @click="enregistrer('lancement')">{{ $t('lancer') }}</span>
					</div>
				</div>
			</footer>
		</div>

		<div id="interaction" v-else>
			<header>
				<div id="conteneur-header">
					<a id="logo" :href="hote" />

					<div id="titre" :class="{'utilisateur': statutUtilisateur === 'utilisateur'}">
						<span class="code" @click="afficherModaleLien">{{ code }}</span>
						<span id="copier" class="icone" role="button" tabindex="0" :title="$t('copierLien')"><i class="material-icons">content_copy</i></span>
						<span id="afficher" class="icone" role="button" tabindex="0" :title="$t('afficherCodeQR')" @click="afficherModaleCodeQR"><i class="material-icons">qr_code</i></span>
					</div>

					<div id="parametres">
						<span class="parametres" role="button" tabindex="0" :title="$t('afficherParametres')"><i class="material-icons" @click="afficherModaleParametres">settings</i></span>
						<span class="compte" role="button" tabindex="0" :title="$t('monCompte')" v-if="statutUtilisateur === 'utilisateur'"><i class="material-icons" @click="$router.push('/u/' + identifiant)">account_circle</i></span>
						<span class="deconnexion" role="button" tabindex="0" :title="$t('seDeconnecter')" v-if="statutUtilisateur === 'utilisateur'"><i class="material-icons" @click="seDeconnecter">power_settings_new</i></span>
					</div>
				</div>
			</header>

			<div id="conteneur" class="interaction-ouverte">
				<sondageAfficher :code="code" :donnees="donnees" :reponses="reponsesSession" :statut="statut" :resultats="resultats" :utilisateurs="utilisateurs" :classement-resultats="classementResultats" :index-question="indexQuestion" @demarrer="demarrer" @index="modifierIndexQuestion" v-if="type === 'Sondage'" />

				<questionnaireAfficher :code="code" :donnees="donnees" :reponses="reponsesSession" :statut="statut" :resultats="resultats" :utilisateurs="utilisateurs" :classement="classement" :index-question="indexQuestion" :reponse-visible="reponseVisible" @demarrer="demarrer" @index="modifierIndexQuestion" @classement="afficherClassementCollectif" @tableau-resultats="modifierTableauResultats" v-else-if="type === 'Questionnaire'" />

				<remueMeningesAfficher :code="code" :donnees="donnees" :reponses="reponsesSession" :statut="statut" :session="session" v-else-if="type === 'Remue-méninges'" />

				<nuageMotsAfficher :code="code" :donnees="donnees" :reponses="reponsesSession" :statut="statut" :session="session" v-else-if="type === 'Nuage-de-mots'" />
			</div>

			<footer>
				<div class="section">
					<span class="utilisateurs" role="button" tabindex="0" :title="$t('afficherListeParticipants')" @click="afficherModaleUtilisateurs" v-if="(type === 'Sondage' || type === 'Questionnaire') && donnees.hasOwnProperty('options') && donnees.options.nom === 'obligatoire'">{{ utilisateursConnectes.length }} <i class="material-icons">people</i></span>
					<span class="utilisateurs" v-else>{{ utilisateursConnectes.length }} <i class="material-icons">people</i></span>

					<span class="bouton icone" role="button" tabindex="0" :title="$t('afficherReponse')" @click="reponseVisible = !reponseVisible" v-if="type === 'Questionnaire' && donnees.options.progression === 'animateur' && statut === 'ouvert' && indexQuestion > -1 && !reponseVisible && !tableauResultats"><i class="material-icons">unpublished</i></span>
					<span class="bouton icone affiche" role="button" tabindex="0" :title="$t('masquerReponse')" @click="reponseVisible = !reponseVisible" v-else-if="type === 'Questionnaire' && donnees.options.progression === 'animateur' && statut === 'ouvert' && indexQuestion > -1 && reponseVisible && !tableauResultats"><i class="material-icons">check_circle</i></span>

					<span class="bouton icone masque" role="button" tabindex="0" :title="$t('afficherResultats')" @click="afficherResultats" v-if="(type === 'Sondage' || type === 'Questionnaire' && donnees.options.progression === 'animateur') && !resultats && !tableauResultats && indexQuestion > -1"><i class="material-icons">visibility_off</i></span>
					<span class="bouton icone" role="button" tabindex="0" :title="$t('masquerResultats')" @click="masquerResultats" v-else-if="(type === 'Sondage' || (type === 'Questionnaire' && donnees.options.progression === 'animateur' && statut !== 'attente')) && resultats && !tableauResultats && indexQuestion > -1"><i class="material-icons">visibility</i></span>

					<span class="bouton icone" role="button" tabindex="0" :title="$t('trierResultats')" @click="classerResultats(true)" v-if="type === 'Sondage' && resultats && !classementResultats && indexQuestion > -1"><i class="material-icons">equalizer</i></span>

					<span class="bouton icone masque" role="button" tabindex="0" :title="$t('masquerResultatsTries')" @click="classerResultats(false)" v-else-if="type === 'Sondage' && resultats && classementResultats && indexQuestion > -1"><i class="material-icons">equalizer</i></span>

					<span class="bouton icone verrouille" role="button" tabindex="0" :title="$t('deverrouillerInteraction')" @click="deverrouiller" v-if="type !== 'Sondage' && type !== 'Questionnaire' && statut === 'verrouille'"><i class="material-icons">lock</i></span>

					<span class="bouton icone" role="button" tabindex="0" :title="$t('verrouillerInteraction')" @click="verrouiller" v-else-if="type !== 'Sondage' && type !== 'Questionnaire' && statut !== 'verrouille'"><i class="material-icons">lock_open</i></span>

					<span class="bouton icone" role="button" tabindex="0" :title="$t('afficherClassement')" @click="afficherClassement" v-if="type === 'Questionnaire' && donnees.options.progression === 'animateur' && donnees.options.nom === 'obligatoire' && donnees.options.classement === false && classement.length > 0"><i class="material-icons">emoji_events</i></span>

					<span class="bouton icone masque" role="button" tabindex="0" :title="$t('masquerNuage')" @click="masquerNuage" v-if="type === 'Nuage-de-mots' && statut === 'nuage-affiche'"><i class="material-icons">visibility</i></span>
					<span class="bouton icone" role="button" tabindex="0" :title="$t('afficherNuage')" @click="afficherNuage" v-if="type === 'Nuage-de-mots' && statut !== 'nuage-affiche'"><i class="material-icons">visibility_off</i></span>

					<span class="bouton icone" role="button" tabindex="0" :title="$t('exporterNuage')" @click="exporterNuage" v-if="type === 'Nuage-de-mots'"><i class="material-icons">camera</i></span>

					<span class="bouton" role="button" tabindex="0" @click="quitter">{{ $t('quitter') }}</span>
				</div>
			</footer>
		</div>

		<div class="conteneur-modale" v-if="modale === 'titre'">
			<div id="modale-titre" class="modale">
				<header>
					<span class="titre">{{ $t('modifierTitre') }}</span>
					<span class="fermer" role="button" tabindex="0" @click="fermerModale"><i class="material-icons">close</i></span>
				</header>
				<div class="conteneur">
					<div class="contenu">
						<label>{{ $t('titre') }}</label>
						<input type="text" :value="titre">
						<div class="actions">
							<span class="bouton" role="button" tabindex="0" @click="modifierTitre">{{ $t('valider') }}</span>
						</div>
					</div>
				</div>
			</div>
		</div>

		<div class="conteneur-modale" v-else-if="modale === 'lien'">
			<div id="modale-lien" class="modale">
				<div class="conteneur">
					<div class="contenu">
						<p>{{ domaine.replace('https://', '').replace('http://', '') }}/p/<br v-if="largeur < 600">{{ code }}</p>
						<div class="actions">
							<span class="bouton" role="button" tabindex="0" @click="fermerModale">{{ $t('fermer') }}</span>
						</div>
					</div>
				</div>
			</div>
		</div>

		<div class="conteneur-modale" v-else-if="modale === 'parametres'">
			<div id="modale-parametres" class="modale">
				<header>
					<span class="titre">{{ $t('parametres') }}</span>
					<span class="fermer" role="button" tabindex="0" @click="fermerModale"><i class="material-icons">close</i></span>
				</header>
				<div class="conteneur">
					<div class="contenu">
						<label>{{ $t('langue') }}</label>
						<div class="langue">
							<span role="button" tabindex="0" :class="{'selectionne': langue === 'fr'}" @click="modifierLangue('fr')">FR</span>
							<span role="button" tabindex="0" :class="{'selectionne': langue === 'es'}" @click="modifierLangue('es')">ES</span>
							<span role="button" tabindex="0" :class="{'selectionne': langue === 'it'}" @click="modifierLangue('it')">IT</span>
							<span role="button" tabindex="0" :class="{'selectionne': langue === 'en'}" @click="modifierLangue('en')">EN</span>
						</div>
						<label v-if="(statut === '' || statut === 'termine') && type === 'Sondage'">{{ $t('exporterSondage') }}</label>
						<label v-else-if="(statut === '' || statut === 'termine') && type === 'Questionnaire'">{{ $t('exporterQuestionnaire') }}</label>
						<label v-else-if="(statut === '' || statut === 'termine') && type === 'Remue-méninges'">{{ $t('exporterRemueMeninges') }}</label>
						<label v-else-if="(statut === '' || statut === 'termine') && type === 'Nuage-de-mots'">{{ $t('exporterNuageDeMots') }}</label>
						<p v-if="(statut === '' || statut === 'termine')">{{ $t('messageExport') }}</p>
						<div class="actions" v-if="(statut === '' || statut === 'termine')">
							<span class="bouton" role="button" tabindex="0" @click="exporter">{{ $t('exporter') }}</span>
						</div>
						<label v-if="(statut === '' || statut === 'termine') && type === 'Sondage'">{{ $t('supprimerSondage') }}</label>
						<label v-else-if="(statut === '' || statut === 'termine') && type === 'Questionnaire'">{{ $t('supprimerQuestionnaire') }}</label>
						<label v-else-if="(statut === '' || statut === 'termine') && type === 'Remue-méninges'">{{ $t('supprimerRemueMeninges') }}</label>
						<label v-else-if="(statut === '' || statut === 'termine') && type === 'Nuage-de-mots'">{{ $t('supprimerNuageDeMots') }}</label>
						<div class="actions" v-if="(statut === '' || statut === 'termine')">
							<span class="bouton supprimer" role="button" tabindex="0" @click="afficherModaleConfirmation('supprimer-interaction', '')">{{ $t('supprimer') }}</span>
						</div>
					</div>
				</div>
			</div>
		</div>

		<div class="conteneur-modale" v-else-if="modale === 'resultats'">
			<div id="modale-resultats" class="modale">
				<header>
					<span class="titre">{{ $t('exporterResultats') }}</span>
					<span class="fermer" role="button" tabindex="0" @click="fermerModale"><i class="material-icons">close</i></span>
				</header>
				<div class="conteneur">
					<div class="contenu">
						<template v-for="(resultatsSession, numeroResultatsSession, indexResultatsSession) in reponses">
							<div class="resultat" v-if="resultatsSession.length > 0 && sessions.hasOwnProperty(numeroResultatsSession)" :key="'session_' + indexResultatsSession">
								<span class="session">{{ $t('sessionDu') }} {{ $formaterDate(sessions[numeroResultatsSession].debut, langue) }}</span>
								<span class="actions">
									<i class="material-icons" role="button" tabindex="0" @click="exporterResultat(numeroResultatsSession)" :title="$t('exporterResultats')">get_app</i>
									<i class="material-icons" role="button" tabindex="0" @click="exporterResultatIndividuel(numeroResultatsSession)" :title="$t('exporterResultatsIndividuels')">assignment_ind</i>
									<i class="material-icons supprimer" role="button" tabindex="0" @click="afficherModaleConfirmation('supprimer-resultat', numeroResultatsSession)" :title="$t('supprimer')">delete</i>
								</span>
							</div>
						</template>
					</div>
				</div>
			</div>
		</div>

		<div class="conteneur-modale" v-else-if="modale === 'utilisateurs'">
			<div id="modale-utilisateurs" class="modale">
				<header>
					<span class="titre">{{ $t('listeParticipants') }}</span>
					<span class="fermer" role="button" tabindex="0" @click="fermerModale"><i class="material-icons">close</i></span>
				</header>
				<div class="conteneur">
					<div class="contenu">
						<div class="utilisateurs-connectes">
							<template v-for="(utilisateur, indexUtilisateur) in utilisateurs">
								<div class="utilisateur" v-if="utilisateur.connecte === true && utilisateur.nom !== ''" :key="'utilisateur_' + indexUtilisateur">
									<span>{{ utilisateur.nom }}</span>
								</div>
							</template>
						</div>
					</div>
				</div>
			</div>
		</div>

		<div class="conteneur-modale" v-else-if="modale === 'classement'">
			<div id="modale-classement" class="modale">
				<header>
					<span class="titre">{{ $t('classement') }}</span>
					<span class="fermer" role="button" tabindex="0" @click="fermerModale"><i class="material-icons">close</i></span>
				</header>
				<div class="conteneur">
					<div class="contenu">
						<ul class="classement">
							<li v-for="(utilisateur, index) in classement" :key="'utilisateur_' + index">
								<div class="utilisateur">
									<span class="index">{{ index + 1 }}</span>
									<span class="nom">{{ utilisateur.nom }}</span>
								</div>
								<div class="score">{{ utilisateur.score }}</div>
							</li>
						</ul>
					</div>
				</div>
			</div>
		</div>

		<div class="conteneur-modale" v-else-if="modale === 'classement-collectif'">
			<div id="modale-classement" class="modale avec-footer">
				<header>
					<span class="titre">{{ $t('classement') }}</span>
					<span class="fermer" role="button" tabindex="0" @click="fermerModale"><i class="material-icons">close</i></span>
				</header>
				<div class="conteneur">
					<div class="contenu">
						<ul class="classement">
							<li v-for="(utilisateur, index) in classement" :key="'utilisateur_' + index">
								<div class="utilisateur">
									<span class="index">{{ index + 1 }}</span>
									<span class="nom">{{ utilisateur.nom }}</span>
								</div>
								<div class="score">{{ utilisateur.score }}</div>
							</li>
						</ul>
					</div>
				</div>
				<footer>
					<span class="bouton" role="button" tabindex="0" @click="modifierIndexQuestion(indexQuestion + 1)" v-if="indexQuestion < (donnees.questions.length - 1)">{{ $t('suivant') }}</span>
					<span class="bouton" role="button" tabindex="0" @click="fermerModale" v-else>{{ $t('fermer') }}</span>
				</footer>
			</div>
		</div>

		<div class="conteneur-modale" v-if="modaleConfirmation !== ''">
			<div id="modale-confirmation" class="modale">
				<div class="conteneur">
					<div class="contenu">
						<p v-html="message" />
						<div class="actions">
							<span class="bouton" role="button" tabindex="0" @click="fermerModaleConfirmation">{{ $t('non') }}</span>
							<span class="bouton" role="button" tabindex="0" @click="supprimerResultat" v-if="modaleConfirmation === 'supprimer-resultat'">{{ $t('oui') }}</span>
							<span class="bouton" role="button" tabindex="0" @click="supprimer" v-if="modaleConfirmation === 'supprimer-interaction'">{{ $t('oui') }}</span>
						</div>
					</div>
				</div>
			</div>
		</div>

		<div class="conteneur-modale" v-show="modale === 'codeqr'">
			<div id="modale-codeqr" class="modale">
				<header>
					<span class="titre">{{ $t('codeQR') }}</span>
					<span class="fermer" role="button" tabindex="0" @click="fermerModale"><i class="material-icons">close</i></span>
				</header>
				<div class="conteneur">
					<div class="contenu">
						<div id="qr" />
					</div>
				</div>
			</div>
		</div>

		<chargement :chargement="chargement" v-if="chargement" />
	</div>

	<div id="page" v-else>
		<div class="conteneur-modale">
			<div id="se-connecter" class="modale">
				<header>
					<span class="titre">{{ $t('consulterInteraction') }}</span>
				</header>
				<div class="conteneur">
					<div class="contenu">
						<label for="code">{{ $t('codeInteraction') }}</label>
						<input id="code" type="text" disabled :value="$route.params.code">
						<label for="motdepasse">{{ $t('motDePasseAdministration') }}</label>
						<input id="motdepasse" type="password" @keydown.enter="seConnecterInteraction">
						<div class="actions">
							<span class="bouton" role="button" tabindex="0" @click="seConnecterInteraction" v-if="!chargementModale">{{ $t('valider') }}</span>
							<div class="conteneur-chargement" v-else>
								<div class="chargement" />
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>
</template>

<script>
import axios from 'axios'
import ClipboardJS from 'clipboard'
import { saveAs } from 'file-saver'
import domtoimage from 'dom-to-image'
import chargement from '@/components/chargement.vue'
import sondageCreer from '@/components/sondageCreer.vue'
import questionnaireCreer from '@/components/questionnaireCreer.vue'
import remueMeningesCreer from '@/components/remueMeningesCreer.vue'
import nuageMotsCreer from '@/components/nuageMotsCreer.vue'
import sondageAfficher from '@/components/sondageAfficher.vue'
import questionnaireAfficher from '@/components/questionnaireAfficher.vue'
import remueMeningesAfficher from '@/components/remueMeningesAfficher.vue'
import nuageMotsAfficher from '@/components/nuageMotsAfficher.vue'

export default {
	name: 'Creer',
	components: {
		chargement,
		sondageCreer,
		questionnaireCreer,
		remueMeningesCreer,
		nuageMotsCreer,
		sondageAfficher,
		questionnaireAfficher,
		remueMeningesAfficher,
		nuageMotsAfficher
	},
	sockets: {
		connexion: function (donnees) {
			const utilisateurs = donnees.filter(function (utilisateur) {
				return utilisateur.identifiant !== this.identifiant
			}.bind(this))
			utilisateurs.forEach(function (utilisateur) {
				utilisateur.connecte = true
			})
			this.utilisateurs = utilisateurs
		},
		deconnexion: function (identifiant) {
			const utilisateurs = this.utilisateurs
			utilisateurs.forEach(function (utilisateur, index) {
				if (utilisateur.identifiant === identifiant) {
					utilisateurs.splice(index, 1, { identifiant: utilisateur.identifiant, nom: utilisateur.nom, connecte: false })
				}
			})
			this.utilisateurs = utilisateurs
		},
		reponse: function (reponse) {
			if (reponse.code === this.code && reponse.session === this.session) {
				if (this.type === 'Sondage') {
					if (this.reponsesSession.map(function (e) { return e.identifiant }).includes(reponse.donnees.identifiant) === true) {
						this.reponsesSession.forEach(function (item) {
							if (item.identifiant === reponse.donnees.identifiant) {
								item.reponse = reponse.donnees.reponse
								if (item.nom !== reponse.donnees.nom && reponse.donnees.nom !== '') {
									item.nom = reponse.donnees.nom
								}
							}
						})
					} else {
						this.reponsesSession.push(reponse.donnees)
					}
				} else if (this.type === 'Questionnaire') {
					if (this.reponsesSession.map(function (e) { return e.identifiant }).includes(reponse.donnees.identifiant) === true) {
						this.reponsesSession.forEach(function (item) {
							if (item.identifiant === reponse.donnees.identifiant) {
								item.reponse = reponse.donnees.reponse
								if (reponse.donnees.hasOwnProperty('temps')) {
									item.temps = reponse.donnees.temps
								}
								if (item.nom !== reponse.donnees.nom && reponse.donnees.nom !== '') {
									item.nom = reponse.donnees.nom
								}
							}
						})
					} else {
						this.reponsesSession.push(reponse.donnees)
					}
				} else if (this.type === 'Remue-méninges' || this.type === 'Nuage-de-mots') {
					this.reponsesSession.push(reponse.donnees)
				}
			}
		},
		reponses: function (donnees) {
			if (donnees.code === this.code && donnees.session === this.session) {
				this.reponsesSession = donnees.reponses
			}
		},
		modifiernom: function (donnees) {
			const utilisateurs = this.utilisateurs
			utilisateurs.forEach(function (utilisateur, index) {
				if (utilisateur.identifiant === donnees.identifiant) {
					utilisateurs[index].nom = donnees.nom
				}
			})
			this.utilisateurs = utilisateurs
		}
	},
	async asyncData (context) {
		const code = context.route.params.code
		const { data } = await axios.post(context.store.state.hote + '/api/recuperer-donnees-interaction', {
			code: code
		}, {
			headers: { 'Content-Type': 'application/json' }
		})
		if (data === 'erreur') {
			context.redirect('/')
		} else {
			return {
				code: code,
				type: data.type,
				titre: data.titre,
				motdepasse: data.motdepasse,
				proprietaire: data.identifiant,
				donnees: data.donnees,
				reponses: data.reponses,
				sessions: data.sessions,
				statut: data.statut,
				session: data.session
			}
		}
	},
	data () {
		return {
			chargement: false,
			modale: '',
			visible: true,
			enregistrement: '',
			utilisateurs: [],
			resultats: true,
			classementResultats: false,
			tableauResultats: false,
			reponseVisible: false,
			reponsesSession: [],
			largeur: 0,
			modaleConfirmation: '',
			message: '',
			numeroSession: 0,
			indexQuestion: -1,
			codeqr: '',
			chargementModale: false,
			domaine: ''
		}
	},
	head () {
		return {
			title: this.titre + ' - Digistorm by La Digitale'
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
		langue () {
			return this.$store.state.langue
		},
		langues () {
			return this.$store.state.langues
		},
		statutUtilisateur () {
			return this.$store.state.statut
		},
		interactions () {
			return this.$store.state.interactions
		},
		utilisateursConnectes () {
			const utilisateurs = []
			if (this.type === 'Questionnaire' && this.donnees.hasOwnProperty('options') && this.donnees.options.hasOwnProperty('modalite') && this.donnees.options.modalite === 'asynchrone') {
				this.reponsesSession.forEach(function (reponse) {
					utilisateurs.push({ identifiant: reponse.identifiant, nom: reponse.nom })
				})
			} else {
				this.utilisateurs.forEach(function (utilisateur) {
					if (utilisateur.connecte) {
						utilisateurs.push(utilisateur)
					}
				})
			}
			return utilisateurs
		},
		classement () {
			const classement = []
			if (this.type === 'Questionnaire') {
				this.reponsesSession.forEach(function (item) {
					const scoreTotal = this.definirScore(item, this.donnees)
					classement.push({ identifiant: item.identifiant, score: scoreTotal })
				}.bind(this))
				classement.forEach(function (utilisateur) {
					this.utilisateurs.forEach(function (u) {
						if (u.identifiant === utilisateur.identifiant) {
							utilisateur.nom = u.nom
						}
					})
				}.bind(this))
				classement.sort(function (a, b) {
					return b.score - a.score
				})
			}
			return classement
		}
	},
	watch: {
		indexQuestion: function () {
			this.reponseVisible = false
		}
	},
	watchQuery: ['page'],
	created () {
		this.$nuxt.$loading.start()
		if (this.reponses[this.session]) {
			this.reponsesSession = this.reponses[this.session]
		}
		if (this.type === 'Sondage' || this.type === 'Questionnaire') {
			this.indexQuestion = parseInt(this.donnees.indexQuestion)
		}
		const langue = this.$route.query.lang
		if (this.langues.includes(langue) === true) {
			this.$i18n.setLocale(langue)
			this.$store.dispatch('modifierLangue', langue)
			this.$socket.emit('modifierlangue', langue)
		} else {
			this.$i18n.setLocale(this.langue)
		}
		if ((this.statutUtilisateur === 'auteur' && this.interactions.map(item => item.code).includes(parseInt(this.code))) || (this.statutUtilisateur === 'utilisateur' && this.proprietaire === this.identifiant)) {
			this.$socket.emit('connexion', { code: this.code, identifiant: this.identifiant, nom: this.nom })
		}
		if (this.motdepasse === '' && this.proprietaire !== this.identifiant) {
			this.$router.push('/')
		}
	},
	mounted () {
		if ((this.statutUtilisateur === 'auteur' && this.interactions.map(item => item.code).includes(parseInt(this.code))) || (this.statutUtilisateur === 'utilisateur' && this.proprietaire === this.identifiant)) {
			setTimeout(function () {
				this.$nuxt.$loading.finish()
				this.initialiser()
				document.getElementsByTagName('html')[0].setAttribute('lang', this.langue)
			}.bind(this), 100)
		} else {
			this.$nextTick(function () {
				this.$nuxt.$loading.finish()
				document.querySelector('#motdepasse').focus()
				setTimeout(function () {
					document.getElementsByTagName('html')[0].setAttribute('lang', this.langue)
				}.bind(this), 100)
			})
		}
	},
	beforeDestroy () {
		window.removeEventListener('resize', this.verifierLargeur, false)
	},
	methods: {
		initialiser () {
			const lien = this.hote + '/p/' + this.code
			const clipboard = new ClipboardJS('#copier', {
				text: function () {
					return lien
				}
			})
			clipboard.on('success', function () {
				this.$store.dispatch('modifierNotification', this.$t('lienCopie'))
			}.bind(this))
			// eslint-disable-next-line
			this.codeqr = new QRCode('qr', {
				text: lien,
				width: 360,
				height: 360,
				colorDark: '#000000',
				colorLight: '#ffffff',
				// eslint-disable-next-line
				correctLevel : QRCode.CorrectLevel.H
			})
			this.verifierLargeur()
			this.domaine = window.location.href.split('/c/')[0]
			window.addEventListener('resize', this.verifierLargeur, false)
		},
		afficherModaleLien () {
			this.modale = 'lien'
		},
		afficherModaleCodeQR () {
			this.modale = 'codeqr'
		},
		fermerModale () {
			this.modale = ''
		},
		afficherModaleTitre () {
			this.modale = 'titre'
			this.$nextTick(function () {
				document.querySelector('#modale-titre input').focus()
			})
		},
		modifierTitre () {
			const titre = document.querySelector('#modale-titre input').value
			if (titre !== '') {
				this.titre = titre
				this.fermerModale()
			}
		},
		afficherModaleParametres () {
			this.modale = 'parametres'
		},
		afficherModaleUtilisateurs () {
			this.modale = 'utilisateurs'
		},
		modifierLangue (langue) {
			if (this.langue !== langue) {
				this.chargement = true
				axios.post(this.hote + '/api/modifier-langue', {
					identifiant: this.identifiant,
					langue: langue
				}).then(function () {
					this.$i18n.setLocale(langue)
					document.getElementsByTagName('html')[0].setAttribute('lang', langue)
					this.$store.dispatch('modifierLangue', langue)
					this.$store.dispatch('modifierNotification', this.$t('langueModifiee'))
					this.chargement = false
				}.bind(this)).catch(function () {
					this.chargement = false
					this.$store.dispatch('modifierMessage', this.$t('erreurCommunicationServeur'))
				}.bind(this))
			}
		},
		telecharger () {
			this.chargement = true
			axios.post(this.hote + '/api/telecharger-informations-interaction', {
				identifiant: this.identifiant,
				code: this.code,
				motdepasse: this.motdepasse,
				type: this.type,
				titre: this.titre,
				domaine: this.domaine
			}).then(function (reponse) {
				this.chargement = false
				const donnees = reponse.data
				if (donnees === 'non_autorise') {
					this.$store.dispatch('modifierMessage', this.$t('actionNonAutorisee'))
				} else {
					const fichier = this.code + '.pdf'
					saveAs('/fichiers/' + this.code + '/' + donnees, fichier)
					setTimeout(function () {
						axios.post(this.hote + '/api/supprimer-informations-interaction', {
							code: this.code,
							fichier: donnees
						})
					}.bind(this), 10000)
				}
			}.bind(this)).catch(function () {
				this.chargement = false
				this.$store.dispatch('modifierMessage', this.$t('erreurCommunicationServeur'))
			}.bind(this))
		},
		enregistrer (type) {
			this.enregistrement = type
		},
		enregistrerDonnees (donneesInteraction) {
			this.chargement = true
			axios.post(this.hote + '/api/modifier-interaction', {
				identifiant: this.identifiant,
				code: this.code,
				titre: this.titre,
				donnees: donneesInteraction
			}).then(function (reponse) {
				const donnees = reponse.data
				if (donnees === 'erreur') {
					this.chargement = false
					this.$store.dispatch('modifierMessage', this.$t('erreurCommunicationServeur'))
				} else if (donnees === 'erreur_code') {
					this.chargement = false
					this.$store.dispatch('modifierMessage', this.$t('codeNonValide'))
				} else if (donnees === 'non_autorise') {
					this.chargement = false
					if (this.type === 'Sondage') {
						this.$store.dispatch('modifierMessage', this.$t('pasAutoriseModifierSondage'))
					} else if (this.type === 'Questionnaire') {
						this.$store.dispatch('modifierMessage', this.$t('pasAutoriseModifierQuestionnaire'))
					} else if (this.type === 'Remue-méninges') {
						this.$store.dispatch('modifierMessage', this.$t('pasAutoriseModifierRemueMeninges'))
					} else if (this.type === 'Nuage-de-mots') {
						this.$store.dispatch('modifierMessage', this.$t('pasAutoriseModifierNuageDeMots'))
					}
				} else if (donnees === 'donnees_enregistrees') {
					this.donnees = donneesInteraction
					if (this.enregistrement === 'enregistrement') {
						this.chargement = false
						if (this.type === 'Sondage') {
							this.$store.dispatch('modifierNotification', this.$t('sondageEnregistre'))
						} else if (this.type === 'Questionnaire') {
							this.$store.dispatch('modifierNotification', this.$t('questionnaireEnregistre'))
						} else if (this.type === 'Remue-méninges') {
							this.$store.dispatch('modifierNotification', this.$t('remueMeningesEnregistre'))
						} else if (this.type === 'Nuage-de-mots') {
							this.$store.dispatch('modifierNotification', this.$t('nuageDeMotsEnregistre'))
						}
					} else if (this.enregistrement === 'lancement') {
						this.lancer()
					}
					this.enregistrement = 'termine'
				}
			}.bind(this)).catch(function () {
				this.chargement = false
				this.enregistrement = ''
				this.$store.dispatch('modifierMessage', this.$t('erreurCommunicationServeur'))
			}.bind(this))
		},
		verifierDonnees (donnees) {
			if (this.type === 'Sondage') {
				let donneesQuestions = true
				for (let i = 0; i < donnees.questions.length; i++) {
					let donneesQuestion = false
					let donneesSupport = false
					let items = 0
					const itemsTexte = []
					if (donnees.questions[i].question !== '') {
						donneesQuestion = true
					}
					if (Object.keys(donnees.questions[i].support).length > 0) {
						donneesSupport = true
					}
					if (!donneesQuestion && !donneesSupport) {
						donneesQuestions = { erreur: 'aucune-question', index: i }
						break
					}
					donnees.questions[i].items.forEach(function (item) {
						if (item.texte !== '' || item.image !== '') {
							items++
						}
						if (item.texte !== '') {
							itemsTexte.push(item.texte)
						}
					})
					if ((new Set(itemsTexte)).size !== itemsTexte.length) {
						donneesQuestions = { erreur: 'doublons-texte', index: i }
						break
					}
					if (items < 2) {
						donneesQuestions = { erreur: 'aucun-item', index: i }
						break
					}
				}
				return donneesQuestions
			} else if (this.type === 'Questionnaire') {
				let donneesQuestions = true
				for (let i = 0; i < donnees.questions.length; i++) {
					let donneesQuestion = false
					let donneesSupport = false
					let items = 0
					let reponses = 0
					const itemsTexte = []
					if (donnees.questions[i].question !== '') {
						donneesQuestion = true
					}
					if (Object.keys(donnees.questions[i].support).length > 0) {
						donneesSupport = true
					}
					if (!donneesQuestion && !donneesSupport) {
						donneesQuestions = { erreur: 'aucune-question', index: i }
						break
					}
					donnees.questions[i].items.forEach(function (item) {
						if (item.texte !== '' || item.image !== '') {
							items++
						}
						if (item.texte !== '') {
							itemsTexte.push(item.texte)
						}
						if (item.reponse) {
							reponses++
						}
					})
					if ((new Set(itemsTexte)).size !== itemsTexte.length) {
						donneesQuestions = { erreur: 'doublons-texte', index: i }
						break
					}
					if (items < 2) {
						donneesQuestions = { erreur: 'aucun-item', index: i }
						break
					}
					if (reponses === 0) {
						donneesQuestions = { erreur: 'aucune-reponse', index: i }
						break
					}
				}
				return donneesQuestions
			} else if (this.type === 'Remue-méninges') {
				let donneesQuestion = false
				let donneesSupport = false
				const categories = []
				if (donnees.question !== '') {
					donneesQuestion = true
				}
				if (Object.keys(donnees.support).length > 0) {
					donneesSupport = true
				}
				donnees.categories.forEach(function (categorie) {
					if (categorie.texte !== '') {
						categories.push(categorie.texte)
					} else if (categorie.image !== '') {
						categories.push(categorie.image)
					}
				})
				if ((new Set(categories)).size !== categories.length) {
					return 'doublons-categorie'
				}
				if (donneesQuestion || donneesSupport) {
					return true
				} else {
					return false
				}
			} else if (this.type === 'Nuage-de-mots') {
				let donneesQuestion = false
				let donneesSupport = false
				if (donnees.question !== '') {
					donneesQuestion = true
				}
				if (Object.keys(donnees.support).length > 0) {
					donneesSupport = true
				}
				if (donneesQuestion || donneesSupport) {
					return true
				} else {
					return false
				}
			}
		},
		lancer () {
			const verificationDonnees = this.verifierDonnees(this.donnees)
			if (Object.keys(this.donnees).length > 0 && verificationDonnees === true) {
				let statut = 'ouvert'
				if ((this.type === 'Questionnaire' || this.type === 'Sondage') && this.donnees.options.progression === 'animateur') {
					statut = 'attente'
				}
				axios.post(this.hote + '/api/modifier-statut-interaction', {
					identifiant: this.identifiant,
					code: this.code,
					statut: statut
				}).then(function (reponse) {
					this.chargement = false
					this.enregistrement = ''
					const donnees = reponse.data
					if (donnees === 'erreur') {
						this.$store.dispatch('modifierMessage', this.$t('erreurCommunicationServeur'))
					} else if (donnees === 'erreur_code') {
						this.$store.dispatch('modifierMessage', this.$t('codeNonValide'))
					} else if (donnees === 'non_autorise') {
						this.$store.dispatch('modifierMessage', this.$t('actionNonAutorisee'))
					} else if (donnees === 'statut_modifie') {
						this.statut = statut
						if (this.type === 'Sondage' && this.donnees.options.progression === 'libre') {
							this.$store.dispatch('modifierNotification', this.$t('sondageOuvert'))
						} else if (this.type === 'Sondage' && this.donnees.options.progression === 'animateur') {
							this.$store.dispatch('modifierNotification', this.$t('questionnaireEnAttente'))
						} else if (this.type === 'Questionnaire' && this.donnees.options.progression === 'libre') {
							this.$store.dispatch('modifierNotification', this.$t('questionnaireOuvert'))
						} else if (this.type === 'Questionnaire' && this.donnees.options.progression === 'animateur') {
							this.$store.dispatch('modifierNotification', this.$t('questionnaireEnAttente'))
						} else if (this.type === 'Remue-méninges') {
							this.$store.dispatch('modifierNotification', this.$t('remueMeningesOuvert'))
						} else if (this.type === 'Nuage-de-mots') {
							this.$store.dispatch('modifierNotification', this.$t('nuageDeMotsOuvert'))
						}
						if ((this.type === 'Questionnaire' || this.type === 'Sondage') && this.donnees.options.progression === 'animateur') {
							this.indexQuestion = this.donnees.copieIndexQuestion
							this.$socket.emit('interactionenattente', this.code, this.donnees)
						} else if (this.type === 'Sondage' && this.donnees.options.progression === 'libre') {
							this.indexQuestion = this.donnees.copieIndexQuestion
							this.$socket.emit('interactionouverte', { code: this.code, session: this.session, titre: this.titre, donnees: this.donnees })
						} else {
							this.$socket.emit('interactionouverte', { code: this.code, session: this.session, titre: this.titre, donnees: this.donnees })
						}
					}
				}.bind(this)).catch(function () {
					this.chargement = false
					this.enregistrement = ''
					this.$store.dispatch('modifierMessage', this.$t('erreurCommunicationServeur'))
				}.bind(this))
			} else {
				this.chargement = false
				if (this.type === 'Sondage' || this.type === 'Questionnaire') {
					if (Object.keys(this.donnees).length === 0) {
						if (this.type === 'Sondage') {
							this.$store.dispatch('modifierMessage', this.$t('sondageSansContenu'))
						} else {
							this.$store.dispatch('modifierMessage', this.$t('questionnaireSansContenu'))
						}
					} else if (verificationDonnees.erreur === 'doublons-texte') {
						this.$store.dispatch('modifierMessage', this.$t('questionDoublons', { question: verificationDonnees.index + 1 }))
					} else if (verificationDonnees.erreur === 'aucune-question') {
						this.$store.dispatch('modifierMessage', this.$t('questionSansQuestion', { question: verificationDonnees.index + 1 }))
					} else if (verificationDonnees.erreur === 'aucun-item') {
						this.$store.dispatch('modifierMessage', this.$t('questionSansReponse', { question: verificationDonnees.index + 1 }))
					} else if (verificationDonnees.erreur === 'aucune-reponse') {
						this.$store.dispatch('modifierMessage', this.$t('questionSansBonneReponse', { question: verificationDonnees.index + 1 }))
					}
				} else if (this.type === 'Remue-méninges') {
					if (Object.keys(this.donnees).length === 0 || (this.donnees.question === '' && Object.keys(this.donnees.support).length === 0)) {
						this.$store.dispatch('modifierMessage', this.$t('remueMeningesSansContenu'))
					} else if (verificationDonnees === 'doublons-categorie') {
						this.$store.dispatch('modifierMessage', this.$t('remueMeningesDoublons'))
					}
				} else if (this.type === 'Nuage-de-mots') {
					if (Object.keys(this.donnees).length === 0 || (this.donnees.question === '' && Object.keys(this.donnees.support).length === 0)) {
						this.$store.dispatch('modifierMessage', this.$t('nuageDeMotsSansContenu'))
					}
				}
			}
		},
		demarrer () {
			this.chargement = true
			axios.post(this.hote + '/api/modifier-statut-interaction', {
				identifiant: this.identifiant,
				code: this.code,
				statut: 'ouvert'
			}).then(function (reponse) {
				this.chargement = false
				const donnees = reponse.data
				if (donnees === 'erreur') {
					this.$store.dispatch('modifierMessage', this.$t('erreurCommunicationServeur'))
				} else if (donnees === 'erreur_code') {
					this.$store.dispatch('modifierMessage', this.$t('codeNonValide'))
				} else if (donnees === 'non_autorise') {
					this.$store.dispatch('modifierMessage', this.$t('actionNonAutorisee'))
				} else if (donnees === 'statut_modifie') {
					const date = new Date().getTime()
					this.statut = 'ouvert'
					if (this.type === 'Sondage') {
						this.$store.dispatch('modifierNotification', this.$t('sondageOuvert'))
					} else if (this.type === 'Questionnaire') {
						this.$store.dispatch('modifierNotification', this.$t('questionnaireOuvert'))
					}
					this.$socket.emit('interactionouverte', { code: this.code, session: this.session, titre: this.titre, donnees: this.donnees, date: date })
					this.$nextTick(function () {
						window.MathJax.typeset()
					})
				}
			}.bind(this)).catch(function () {
				this.chargement = false
				this.$store.dispatch('modifierMessage', this.$t('erreurCommunicationServeur'))
			}.bind(this))
		},
		modifierIndexQuestion (indexQuestion) {
			if (this.modale === 'classement-collectif') {
				this.modale = ''
			}
			if (this.type === 'Sondage' && this.donnees.options.progression === 'libre') {
				this.indexQuestion = indexQuestion
			} else {
				this.chargement = true
				axios.post(this.hote + '/api/modifier-index-question', {
					identifiant: this.identifiant,
					code: this.code,
					indexQuestion: indexQuestion
				}).then(function (reponse) {
					this.chargement = false
					const donnees = reponse.data
					if (donnees === 'erreur') {
						this.$store.dispatch('modifierMessage', this.$t('erreurCommunicationServeur'))
					} else if (donnees === 'erreur_code') {
						this.$store.dispatch('modifierMessage', this.$t('codeNonValide'))
					} else if (donnees === 'non_autorise') {
						this.$store.dispatch('modifierMessage', this.$t('actionNonAutorisee'))
					} else if (donnees === 'index_modifie') {
						this.indexQuestion = indexQuestion
						const date = new Date().getTime()
						this.$socket.emit('questionsuivante', { code: this.code, date: date, index: indexQuestion })
					}
				}.bind(this)).catch(function () {
					this.chargement = false
					this.$store.dispatch('modifierMessage', this.$t('erreurCommunicationServeur'))
				}.bind(this))
			}
		},
		modifierTableauResultats (bool) {
			this.tableauResultats = bool
		},
		afficherClassement () {
			this.modale = 'classement'
		},
		afficherClassementCollectif () {
			this.modale = 'classement-collectif'
			this.$socket.emit('classement', this.code, this.classement)
		},
		afficherResultats () {
			this.resultats = true
		},
		masquerResultats () {
			this.resultats = false
			this.classementResultats = false
		},
		classerResultats (bool) {
			this.classementResultats = bool
		},
		verrouiller () {
			this.chargement = true
			const statut = 'verrouille'
			axios.post(this.hote + '/api/modifier-statut-interaction', {
				identifiant: this.identifiant,
				code: this.code,
				statut: statut
			}).then(function (reponse) {
				this.chargement = false
				const donnees = reponse.data
				if (donnees === 'erreur') {
					this.$store.dispatch('modifierMessage', this.$t('erreurCommunicationServeur'))
				} else if (donnees === 'erreur_code') {
					this.$store.dispatch('modifierMessage', this.$t('codeNonValide'))
				} else if (donnees === 'non_autorise') {
					this.$store.dispatch('modifierMessage', this.$t('actionNonAutorisee'))
				} else if (donnees === 'statut_modifie') {
					this.statut = statut
					if (this.type === 'Remue-méninges') {
						this.$store.dispatch('modifierNotification', this.$t('remueMeningesVerrouille'))
					} else if (this.type === 'Nuage-de-mots') {
						this.$store.dispatch('modifierNotification', this.$t('nuageDeMotsVerrouille'))
					}
					this.$socket.emit('interactionverrouillee', this.code)
				}
			}.bind(this)).catch(function () {
				this.chargement = false
				this.$store.dispatch('modifierMessage', this.$t('erreurCommunicationServeur'))
			}.bind(this))
		},
		deverrouiller () {
			this.chargement = true
			const statut = 'ouvert'
			axios.post(this.hote + '/api/modifier-statut-interaction', {
				identifiant: this.identifiant,
				code: this.code,
				statut: statut
			}).then(function (reponse) {
				this.chargement = false
				const donnees = reponse.data
				if (donnees === 'erreur') {
					this.$store.dispatch('modifierMessage', this.$t('erreurCommunicationServeur'))
				} else if (donnees === 'erreur_code') {
					this.$store.dispatch('modifierMessage', this.$t('codeNonValide'))
				} else if (donnees === 'non_autorise') {
					this.$store.dispatch('modifierMessage', this.$t('actionNonAutorisee'))
				} else if (donnees === 'statut_modifie') {
					this.statut = statut
					if (this.type === 'Remue-méninges') {
						this.$store.dispatch('modifierNotification', this.$t('remueMeningesDeverrouille'))
					} else if (this.type === 'Nuage-de-mots') {
						this.$store.dispatch('modifierNotification', this.$t('nuageDeMotsDeverrouille'))
					}
					this.$socket.emit('interactiondeverrouillee', this.code)
				}
			}.bind(this)).catch(function () {
				this.chargement = false
				this.$store.dispatch('modifierMessage', this.$t('erreurCommunicationServeur'))
			}.bind(this))
		},
		afficherNuage () {
			this.chargement = true
			const statut = 'nuage-affiche'
			axios.post(this.hote + '/api/modifier-statut-interaction', {
				identifiant: this.identifiant,
				code: this.code,
				statut: statut
			}).then(function (reponse) {
				this.chargement = false
				const donnees = reponse.data
				if (donnees === 'erreur') {
					this.$store.dispatch('modifierMessage', this.$t('erreurCommunicationServeur'))
				} else if (donnees === 'erreur_code') {
					this.$store.dispatch('modifierMessage', this.$t('codeNonValide'))
				} else if (donnees === 'non_autorise') {
					this.$store.dispatch('modifierMessage', this.$t('actionNonAutorisee'))
				} else if (donnees === 'statut_modifie') {
					this.statut = statut
					this.$store.dispatch('modifierNotification', this.$t('nuageDeMotsAffiche'))
					this.$socket.emit('nuageaffiche', this.code)
				}
			}.bind(this)).catch(function () {
				this.chargement = false
				this.$store.dispatch('modifierMessage', this.$t('erreurCommunicationServeur'))
			}.bind(this))
		},
		masquerNuage () {
			this.chargement = true
			const statut = 'ouvert'
			axios.post(this.hote + '/api/modifier-statut-interaction', {
				identifiant: this.identifiant,
				code: this.code,
				statut: statut
			}).then(function (reponse) {
				this.chargement = false
				const donnees = reponse.data
				if (donnees === 'erreur') {
					this.$store.dispatch('modifierMessage', this.$t('erreurCommunicationServeur'))
				} else if (donnees === 'erreur_code') {
					this.$store.dispatch('modifierMessage', this.$t('codeNonValide'))
				} else if (donnees === 'non_autorise') {
					this.$store.dispatch('modifierMessage', this.$t('actionNonAutorisee'))
				} else if (donnees === 'statut_modifie') {
					this.statut = statut
					this.$store.dispatch('modifierNotification', this.$t('nuageDeMotsMasque'))
					this.$socket.emit('nuagemasque', this.code)
				}
			}.bind(this)).catch(function () {
				this.chargement = false
				this.$store.dispatch('modifierMessage', this.$t('erreurCommunicationServeur'))
			}.bind(this))
		},
		exporterNuage () {
			domtoimage.toJpeg(document.querySelector('#conteneur-nuage div'), { bgcolor: '#fff', quality: 1 }).then(function (image) {
				saveAs(image, this.code + '_' + this.session + '_' + (new Date()).getTime() + '.jpg')
			}.bind(this))
		},
		quitter () {
			this.chargement = true
			axios.post(this.hote + '/api/fermer-interaction', {
				identifiant: this.identifiant,
				code: this.code,
				classement: this.classement
			}).then(function (reponse) {
				this.chargement = false
				const donnees = reponse.data
				if (donnees === 'erreur') {
					this.$store.dispatch('modifierMessage', this.$t('erreurCommunicationServeur'))
				} else if (donnees === 'erreur_code') {
					this.$store.dispatch('modifierMessage', this.$t('codeNonValide'))
				} else if (donnees === 'non_autorise') {
					if (this.type === 'Sondage') {
						this.$store.dispatch('modifierMessage', this.$t('pasAutoriseModifierSondage'))
					} else if (this.type === 'Questionnaire') {
						this.$store.dispatch('modifierMessage', this.$t('pasAutoriseModifierQuestionnaire'))
					} else if (this.type === 'Remue-méninges') {
						this.$store.dispatch('modifierMessage', this.$t('pasAutoriseModifierRemueMeninges'))
					} else if (this.type === 'Nuage-de-mots') {
						this.$store.dispatch('modifierMessage', this.$t('pasAutoriseModifierNuageDeMots'))
					}
				} else {
					this.statut = 'termine'
					this.reponsesSession = []
					this.session = donnees.session
					this.reponses = donnees.reponses
					this.sessions = donnees.sessions
					if (this.type === 'Sondage') {
						this.$store.dispatch('modifierNotification', this.$t('sondageFerme'))
					} else if (this.type === 'Questionnaire') {
						this.$store.dispatch('modifierNotification', this.$t('questionnaireFerme'))
					} else if (this.type === 'Remue-méninges') {
						this.$store.dispatch('modifierNotification', this.$t('remueMeningesFerme'))
					} else if (this.type === 'Nuage-de-mots') {
						this.$store.dispatch('modifierNotification', this.$t('nuageDeMotsFerme'))
					}
					this.$socket.emit('interactionfermee', this.code)
				}
			}.bind(this)).catch(function () {
				this.chargement = false
				this.$store.dispatch('modifierMessage', this.$t('erreurCommunicationServeur'))
			}.bind(this))
		},
		definirNombreReponses () {
			if (Object.keys(this.reponses).length > 0) {
				let nombreSessions = 0
				for (const reponse in this.reponses) {
					if (this.sessions.hasOwnProperty(reponse)) {
						nombreSessions++
					}
				}
				return nombreSessions
			} else {
				return 0
			}
		},
		afficherModaleResultats () {
			this.modale = 'resultats'
		},
		exporterResultat (session) {
			this.modale = ''
			this.chargement = true
			let classement = []
			if (this.type === 'Questionnaire') {
				classement = this.sessions[session].classement
			}
			const dateDebut = this.$formaterDate(this.sessions[session].debut, this.langue)
			const dateFin = this.$formaterDate(this.sessions[session].fin, this.langue)
			axios.post(this.hote + '/api/exporter-resultat', {
				identifiant: this.identifiant,
				code: this.code,
				type: this.type,
				titre: this.titre,
				donnees: this.sessions[session].donnees,
				reponses: this.reponses[session],
				classement: classement,
				dateDebut: dateDebut,
				dateFin: dateFin
			}).then(function (reponse) {
				this.chargement = false
				const donnees = reponse.data
				if (donnees === 'non_autorise') {
					this.$store.dispatch('modifierMessage', this.$t('actionNonAutorisee'))
				} else if (donnees === 'resultat_exporte') {
					const fichier = this.code + '_' + session + '.pdf'
					saveAs('/fichiers/' + this.code + '/resultats.pdf?v=' + new Date().getTime(), fichier)
				}
			}.bind(this)).catch(function () {
				this.chargement = false
				this.$store.dispatch('modifierMessage', this.$t('erreurCommunicationServeur'))
			}.bind(this))
		},
		exporterResultatIndividuel (session) {
			this.modale = ''
			let texte = ''
			const reponses = this.reponses[session]
			const utilisateurs = []
			reponses.forEach(function (item) {
				if (this.type === 'Questionnaire') {
					const score = this.definirScores(item, this.sessions[session].donnees)
					utilisateurs.push({ identifiant: item.identifiant, nom: item.nom, reponse: item.reponse, score: score })
				} else if (this.type === 'Sondage' && this.sessions[session].donnees.hasOwnProperty('question')) {
					utilisateurs.push({ identifiant: item.identifiant, nom: item.nom, reponse: [item.reponse] })
				} else if (this.type === 'Remue-méninges' || this.type === 'Nuage-de-mots') {
					if (utilisateurs.map(function (e) { return e.identifiant }).includes(item.identifiant) === false) {
						utilisateurs.push({ identifiant: item.identifiant, nom: item.nom, reponse: [item.reponse] })
					} else {
						utilisateurs.forEach(function (utilisateur) {
							if (utilisateur.identifiant === item.identifiant) {
								utilisateur.reponse.push(item.reponse)
							}
						})
					}
				} else {
					utilisateurs.push({ identifiant: item.identifiant, nom: item.nom, reponse: item.reponse })
				}
			}.bind(this))
			if (utilisateurs.length > 0) {
				const totalQuestions = utilisateurs[0].reponse.length
				if (this.type === 'Sondage') {
					texte += this.$t('identifiant') + ',' + this.$t('nom') + ','
					for (let i = 0; i < totalQuestions; i++) {
						if (i < (totalQuestions - 1)) {
							texte += this.$t('reponse') + ' ' + (i + 1) + ','
						} else {
							texte += this.$t('reponse') + ' ' + (i + 1) + '\n'
						}
					}
					utilisateurs.forEach(function (utilisateur) {
						texte += utilisateur.identifiant + ',' + utilisateur.nom + ','
						utilisateur.reponse.forEach(function (item, indexItem) {
							item.forEach(function (reponse, indexReponse) {
								if ((indexReponse + 1) === item.length) {
									texte += reponse.replace(/[,";]/g, '').replace(/\n/g, ' ')
								} else {
									texte += reponse.replace(/[,";]/g, '').replace(/\n/g, ' ') + ' | '
								}
							})
							if (indexItem < (totalQuestions - 1)) {
								texte += ','
							} else {
								texte += '\n'
							}
						})
					})
				} else if (this.type === 'Questionnaire') {
					utilisateurs.forEach(function (utilisateur, index) {
						let score = 0
						utilisateur.score.forEach(function (points) {
							score = score + points
						})
						utilisateurs[index].total = score
					})
					texte += this.$t('identifiant') + ',' + this.$t('nom') + ',' + this.$t('scoreTotal') + ','
					for (let i = 0; i < totalQuestions; i++) {
						if (i < (totalQuestions - 1)) {
							texte += this.$t('reponse') + ' ' + (i + 1) + ','
							texte += this.$t('score') + ' ' + (i + 1) + ','
						} else {
							texte += this.$t('reponse') + ' ' + (i + 1) + ','
							texte += this.$t('score') + ' ' + (i + 1) + '\n'
						}
					}
					utilisateurs.forEach(function (utilisateur) {
						texte += utilisateur.identifiant + ',' + utilisateur.nom + ',' + utilisateur.total + ','
						utilisateur.reponse.forEach(function (item, indexItem) {
							item.forEach(function (reponse, indexReponse) {
								if ((indexReponse + 1) === item.length) {
									texte += reponse.replace(/[,";]/g, '').replace(/\n/g, ' ')
								} else {
									texte += reponse.replace(/[,";]/g, '').replace(/\n/g, ' ') + ' | '
								}
							})
							texte += ',' + utilisateur.score[indexItem]
							if (indexItem < (totalQuestions - 1)) {
								texte += ','
							} else {
								texte += '\n'
							}
						})
					})
				} else if (this.type === 'Remue-méninges') {
					texte += this.$t('identifiant') + ',' + this.$t('nom') + ','
					const categories = []
					if (this.sessions[session].donnees.hasOwnProperty('categories')) {
						this.sessions[session].donnees.categories.forEach(function (categorie) {
							if (categorie.texte !== '') {
								categories.push(categorie.texte)
							} else if (categorie.image !== '') {
								categories.push(categorie.image)
							}
						})
					}
					if (categories.length > 0) {
						categories.forEach(function (categorie, indexCategorie) {
							if (indexCategorie < (categories.length - 1)) {
								texte += this.$t('categorie') + ' ' + (indexCategorie + 1) + ' - ' + categorie.replace(/[,";]/g, '').replace(/\n/g, ' ') + ','
							} else {
								texte += this.$t('categorie') + ' ' + (indexCategorie + 1) + ' - ' + categorie.replace(/[,";]/g, '').replace(/\n/g, ' ') + '\n'
							}
						}.bind(this))
					} else {
						texte += this.$t('messages') + '\n'
					}
					utilisateurs.forEach(function (utilisateur) {
						texte += utilisateur.identifiant + ',' + utilisateur.nom + ','
						if (categories.length > 0) {
							categories.forEach(function (categorie, indexCategorie) {
								let messages = ''
								utilisateur.reponse.forEach(function (item) {
									if (categorie === item.categorie) {
										if (!item.visible) {
											messages += item.texte.replace(/[,";]/g, '').replace(/\n/g, ' ') + ' (' + this.$t('supprime') + ')' + ' | '
										} else {
											messages += item.texte.replace(/[,";]/g, '').replace(/\n/g, ' ') + ' | '
										}
									}
								}.bind(this))
								if (indexCategorie < (categories.length - 1)) {
									texte += messages.substring(0, messages.length - 3) + ','
								} else {
									texte += messages.substring(0, messages.length - 3) + '\n'
								}
							}.bind(this))
						} else {
							utilisateur.reponse.forEach(function (item, indexItem) {
								if ((indexItem + 1) === utilisateur.reponse.length) {
									if (!item.visible) {
										texte += item.texte.replace(/[,";]/g, '').replace(/\n/g, ' ') + ' (' + this.$t('supprime') + ')' + '\n'
									} else {
										texte += item.texte.replace(/[,";]/g, '').replace(/\n/g, ' ') + '\n'
									}
								} else {
									if (!item.visible) {
										texte += item.texte.replace(/[,";]/g, '').replace(/\n/g, ' ') + ' (' + this.$t('supprime') + ')' + ' | '
									} else {
										texte += item.texte.replace(/[,";]/g, '').replace(/\n/g, ' ') + ' | '
									}
								}
							}.bind(this))
						}
					}.bind(this))
				} else if (this.type === 'Nuage-de-mots') {
					texte += this.$t('identifiant') + ',' + this.$t('nom') + ',' + this.$t('mots') + '\n'
					utilisateurs.forEach(function (utilisateur) {
						texte += utilisateur.identifiant + ',' + utilisateur.nom + ','
						utilisateur.reponse.forEach(function (item, indexItem) {
							if ((indexItem + 1) === utilisateur.reponse.length) {
								if (!item.visible) {
									texte += item.texte.replace(/[,";]/g, '') + ' (' + this.$t('supprime') + ')' + '\n'
								} else {
									texte += item.texte.replace(/[,";]/g, '') + '\n'
								}
							} else {
								if (!item.visible) {
									texte += item.texte.replace(/[,";]/g, '') + ' (' + this.$t('supprime') + ')' + ' | '
								} else {
									texte += item.texte.replace(/[,";]/g, '') + ' | '
								}
							}
						}.bind(this))
					}.bind(this))
				}
				const blob = new Blob([texte], { type: 'text/csv;charset=utf-8' })
				const fichier = this.code + '_' + session + '.csv'
				saveAs(blob, fichier)
			} else {
				this.$store.dispatch('modifierMessage', this.$t('erreurExportResultat'))
			}
		},
		afficherModaleConfirmation (typeConfirmation, session) {
			if (typeConfirmation === 'supprimer-resultat') {
				this.message = this.$t('confirmationSupprimerResultats')
				this.numeroSession = session
			} else if (typeConfirmation === 'supprimer-interaction' && this.type === 'Sondage') {
				this.message = this.$t('confirmationSupprimerSondage')
			} else if (typeConfirmation === 'supprimer-interaction' && this.type === 'Questionnaire') {
				this.message = this.$t('confirmationSupprimerQuestionnaire')
			} else if (typeConfirmation === 'supprimer-interaction' && this.type === 'Remue-méninges') {
				this.message = this.$t('confirmationSupprimerRemueMeninges')
			} else if (typeConfirmation === 'supprimer-interaction' && this.type === 'Nuage-de-mots') {
				this.message = this.$t('confirmationSupprimerNuageDeMots')
			}
			this.modaleConfirmation = typeConfirmation
		},
		fermerModaleConfirmation () {
			this.modaleConfirmation = ''
			this.message = ''
			this.numeroSession = 0
		},
		supprimerResultat () {
			this.modaleConfirmation = ''
			this.chargement = true
			axios.post(this.hote + '/api/supprimer-resultat', {
				identifiant: this.identifiant,
				code: this.code,
				session: this.numeroSession
			}).then(function (reponse) {
				this.chargement = false
				const donnees = reponse.data
				if (donnees === 'erreur') {
					this.$store.dispatch('modifierMessage', this.$t('erreurCommunicationServeur'))
				} else if (donnees === 'erreur_code') {
					this.$store.dispatch('modifierMessage', this.$t('codeNonValide'))
				} else if (donnees === 'non_autorise') {
					this.$store.dispatch('modifierMessage', this.$t('actionNonAutorisee'))
				} else {
					this.reponses = donnees.reponses
					this.sessions = donnees.sessions
					this.numeroSession = 0
					this.$store.dispatch('modifierNotification', this.$t('resultatsSupprimes'))
					if (Object.keys(this.reponses).length === 0) {
						this.fermerModale()
					}
				}
				this.fermerModaleConfirmation()
			}.bind(this)).catch(function () {
				this.chargement = false
				this.$store.dispatch('modifierMessage', this.$t('erreurCommunicationServeur'))
				this.fermerModaleConfirmation()
			}.bind(this))
		},
		verifierLargeur () {
			this.largeur = window.innerWidth
		},
		definirScore (item, donnees) {
			let scoreTotal = 0
			if (item.hasOwnProperty('score') && donnees.options.points !== 'classique') {
				item.score.forEach(function (score) {
					scoreTotal = scoreTotal + score
				})
			} else {
				donnees.questions.forEach(function (question, indexQuestion) {
					const reponseCorrecte = []
					question.items.forEach(function (i) {
						if (i.reponse === true && i.texte !== '') {
							reponseCorrecte.push(i.texte)
						} else if (i.reponse === true && i.image !== '') {
							reponseCorrecte.push(i.image)
						}
					})
					const bonnesReponses = []
					const mauvaisesReponses = []
					question.items.forEach(function (i) {
						if (i.reponse === true && (item.reponse[indexQuestion].includes(i.texte) || item.reponse[indexQuestion].includes(i.image))) {
							bonnesReponses.push(i)
						} else if (i.reponse === false && (item.reponse[indexQuestion].includes(i.texte) || item.reponse[indexQuestion].includes(i.image))) {
							mauvaisesReponses.push(i)
						}
					})
					if (((question.option === 'choix-unique' && bonnesReponses.length > 0) || (question.option === 'choix-multiples' && reponseCorrecte.every(i => item.reponse[indexQuestion].includes(i)) === true && mauvaisesReponses.length === 0)) && donnees.options.points === 'classique' && question.hasOwnProperty('points')) {
						scoreTotal = scoreTotal + question.points
					} else if (((question.option === 'choix-unique' && bonnesReponses.length > 0) || (question.option === 'choix-multiples' && reponseCorrecte.every(i => item.reponse[indexQuestion].includes(i)) === true && mauvaisesReponses.length === 0)) && donnees.options.points === 'classique' && !question.hasOwnProperty('points')) {
						scoreTotal = scoreTotal + 1000
					} else if (((question.option === 'choix-unique' && bonnesReponses.length > 0) || (question.option === 'choix-multiples' && reponseCorrecte.every(i => item.reponse[indexQuestion].includes(i)) === true && mauvaisesReponses.length === 0)) && donnees.options.points !== 'classique' && question.hasOwnProperty('points')) {
						scoreTotal = scoreTotal + Math.round(question.points - (item.temps[indexQuestion] * 10))
					} else if (((question.option === 'choix-unique' && bonnesReponses.length > 0) || (question.option === 'choix-multiples' && reponseCorrecte.every(i => item.reponse[indexQuestion].includes(i)) === true && mauvaisesReponses.length === 0)) && donnees.options.points !== 'classique' && !question.hasOwnProperty('points')) {
						scoreTotal = scoreTotal + Math.round(1000 - (item.temps[indexQuestion] * 10))
					} else if ((bonnesReponses.length - mauvaisesReponses.length) > 0 && donnees.options.points === 'classique' && question.hasOwnProperty('points')) {
						scoreTotal = scoreTotal + ((question.points / reponseCorrecte.length) * (bonnesReponses.length - mauvaisesReponses.length))
					} else if ((bonnesReponses.length - mauvaisesReponses.length) > 0 && donnees.options.points === 'classique' && !question.hasOwnProperty('points')) {
						scoreTotal = scoreTotal + ((1000 / reponseCorrecte.length) * (bonnesReponses.length - mauvaisesReponses.length))
					} else if ((bonnesReponses.length - mauvaisesReponses.length) > 0 && donnees.options.points !== 'classique' && question.hasOwnProperty('points')) {
						scoreTotal = scoreTotal + ((Math.round(question.points - (item.temps[indexQuestion] * 10)) / reponseCorrecte.length) * (bonnesReponses.length - mauvaisesReponses.length))
					} else if ((bonnesReponses.length - mauvaisesReponses.length) > 0 && donnees.options.points !== 'classique' && !question.hasOwnProperty('points')) {
						scoreTotal = scoreTotal + ((Math.round(1000 - (item.temps[indexQuestion] * 10)) / reponseCorrecte.length) * (bonnesReponses.length - mauvaisesReponses.length))
					} else {
						scoreTotal = scoreTotal + 0
					}
				})
			}
			return scoreTotal
		},
		definirScores (item, donnees) {
			let score = []
			if (item.hasOwnProperty('score') && donnees.options.points !== 'classique') {
				score = item.score
			} else {
				donnees.questions.forEach(function (question, indexQuestion) {
					const reponseCorrecte = []
					question.items.forEach(function (i) {
						if (i.reponse === true && i.texte !== '') {
							reponseCorrecte.push(i.texte)
						} else if (i.reponse === true && i.image !== '') {
							reponseCorrecte.push(i.image)
						}
					})
					const bonnesReponses = []
					const mauvaisesReponses = []
					question.items.forEach(function (i) {
						if (i.reponse === true && (item.reponse[indexQuestion].includes(i.texte) || item.reponse[indexQuestion].includes(i.image))) {
							bonnesReponses.push(i)
						} else if (i.reponse === false && (item.reponse[indexQuestion].includes(i.texte) || item.reponse[indexQuestion].includes(i.image))) {
							mauvaisesReponses.push(i)
						}
					})
					if (((question.option === 'choix-unique' && bonnesReponses.length > 0) || (question.option === 'choix-multiples' && reponseCorrecte.every(i => item.reponse[indexQuestion].includes(i)) === true && mauvaisesReponses.length === 0)) && donnees.options.points === 'classique' && question.hasOwnProperty('points')) {
						score.push(question.points)
					} else if (((question.option === 'choix-unique' && bonnesReponses.length > 0) || (question.option === 'choix-multiples' && reponseCorrecte.every(i => item.reponse[indexQuestion].includes(i)) === true && mauvaisesReponses.length === 0)) && donnees.options.points === 'classique' && !question.hasOwnProperty('points')) {
						score.push(1000)
					} else if (((question.option === 'choix-unique' && bonnesReponses.length > 0) || (question.option === 'choix-multiples' && reponseCorrecte.every(i => item.reponse[indexQuestion].includes(i)) === true && mauvaisesReponses.length === 0)) && donnees.options.points !== 'classique' && question.hasOwnProperty('points')) {
						score.push(Math.round(question.points - (item.temps[indexQuestion] * 10)))
					} else if (((question.option === 'choix-unique' && bonnesReponses.length > 0) || (question.option === 'choix-multiples' && reponseCorrecte.every(i => item.reponse[indexQuestion].includes(i)) === true && mauvaisesReponses.length === 0)) && donnees.options.points !== 'classique' && !question.hasOwnProperty('points')) {
						score.push(Math.round(1000 - (item.temps[indexQuestion] * 10)))
					} else if ((bonnesReponses.length - mauvaisesReponses.length) > 0 && donnees.options.points === 'classique' && question.hasOwnProperty('points')) {
						score.push((question.points / reponseCorrecte.length) * (bonnesReponses.length - mauvaisesReponses.length))
					} else if ((bonnesReponses.length - mauvaisesReponses.length) > 0 && donnees.options.points === 'classique' && !question.hasOwnProperty('points')) {
						score.push((1000 / reponseCorrecte.length) * (bonnesReponses.length - mauvaisesReponses.length))
					} else if ((bonnesReponses.length - mauvaisesReponses.length) > 0 && donnees.options.points !== 'classique' && question.hasOwnProperty('points')) {
						score.push((Math.round(question.points - (item.temps[indexQuestion] * 10)) / reponseCorrecte.length) * (bonnesReponses.length - mauvaisesReponses.length))
					} else if ((bonnesReponses.length - mauvaisesReponses.length) > 0 && donnees.options.points !== 'classique' && !question.hasOwnProperty('points')) {
						score.push((Math.round(1000 - (item.temps[indexQuestion] * 10)) / reponseCorrecte.length) * (bonnesReponses.length - mauvaisesReponses.length))
					} else {
						score.push(0)
					}
				})
			}
			return score
		},
		exporter () {
			this.modaleConfirmation = ''
			this.chargement = true
			axios.post(this.hote + '/api/exporter-interaction', {
				identifiant: this.identifiant,
				code: this.code
			}).then(function (reponse) {
				const donnees = reponse.data
				this.chargement = false
				if (donnees === 'erreur') {
					this.$store.dispatch('modifierMessage', this.$t('erreurCommunicationServeur'))
				} else if (donnees === 'erreur_donnees') {
					this.$store.dispatch('modifierMessage', this.$t('aucuneDonneesExport'))
				} else if (donnees === 'erreur_code') {
					this.$store.dispatch('modifierMessage', this.$t('codeNonValide'))
				} else if (donnees === 'non_autorise') {
					this.$store.dispatch('modifierMessage', this.$t('actionNonAutorisee'))
				} else {
					saveAs('/temp/' + donnees, this.code + '.zip')
				}
			}.bind(this)).catch(function () {
				this.chargement = false
				this.$store.dispatch('modifierAlerte', this.$t('erreurCommunicationServeur'))
			}.bind(this))
		},
		supprimer () {
			this.modaleConfirmation = ''
			this.chargement = true
			axios.post(this.hote + '/api/supprimer-interaction', {
				identifiant: this.identifiant,
				code: this.code
			}).then(function (reponse) {
				this.chargement = false
				const donnees = reponse.data
				if (donnees === 'erreur') {
					this.$store.dispatch('modifierMessage', this.$t('erreurCommunicationServeur'))
				} else if (donnees === 'erreur_code') {
					this.$store.dispatch('modifierMessage', this.$t('codeNonValide'))
				} else if (donnees === 'non_autorise') {
					this.$store.dispatch('modifierMessage', this.$t('actionNonAutorisee'))
				} else {
					if (this.statutUtilisateur === 'utilisateur') {
						this.$router.push('/u/' + this.identifiant)
					} else {
						this.$router.push('/')
					}
				}
			}.bind(this)).catch(function () {
				this.chargement = false
				this.$store.dispatch('modifierMessage', this.$t('erreurCommunicationServeur'))
				this.fermerModaleConfirmation()
			}.bind(this))
		},
		seDeconnecter () {
			axios.post(this.hote + '/api/se-deconnecter').then(function () {
				this.$store.dispatch('reinitialiser')
				this.$router.push('/')
			}.bind(this)).catch(function () {
				this.$store.dispatch('modifierMessage', this.$t('erreurCommunicationServeur'))
			}.bind(this))
		},
		seConnecterInteraction () {
			const code = document.querySelector('#code').value
			const motdepasse = document.querySelector('#motdepasse').value
			if (code !== '' && motdepasse !== '') {
				this.chargementModale = true
				axios.post(this.hote + '/api/se-connecter-interaction', {
					code: code,
					motdepasse: motdepasse
				}).then(function (reponse) {
					this.chargementModale = false
					const donnees = reponse.data
					if (donnees === 'erreur_code') {
						this.$store.dispatch('modifierMessage', this.$t('codeNonValide'))
					} else if (donnees === 'erreur') {
						this.$store.dispatch('modifierMessage', this.$t('erreurCommunicationServeur'))
					} else if (donnees === 'non_autorise') {
						this.$store.dispatch('modifierMessage', this.$t('pasAutoriseModifierInteraction'))
					} else {
						this.$store.dispatch('modifierUtilisateur', donnees)
						this.$socket.emit('connexion', { code: this.code, identifiant: this.identifiant, nom: this.nom })
						this.$nextTick(function () {
							this.initialiser()
						}.bind(this))
					}
				}.bind(this)).catch(function () {
					this.chargementModale = false
					this.$store.dispatch('modifierMessage', this.$t('erreurCommunicationServeur'))
				}.bind(this))
			} else if (motdepasse === '') {
				this.$store.dispatch('modifierMessage', this.$t('indiquerMotDePasse'))
			}
		}
	}
}
</script>

<style scoped>
#titre.edition {
	cursor: pointer;
}

#parametres {
	display: flex;
	justify-content: flex-end;
	align-items: center;
	font-size: 24px;
	margin-left: 20px;
	cursor: pointer;
}

#parametres span.compte {
	margin-left: 15px;
}

#parametres span.deconnexion {
	margin-left: 15px;
	color: #ff6259;
}

#titre span.code,
#titre span.titre {
	display: inline-block;
	max-width: calc(100% - 23px);
	overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

#titre span.code {
	text-transform: lowercase;
	cursor: pointer;
}

#titre span.modifier {
	display: inline-block;
	margin-left: 5px;
	visibility: hidden;
}

#titre:hover span.modifier {
	visibility: visible;
}

#titre span#afficher,
#titre span#copier {
	display: inline-block;
	font-size: 24px;
	margin-left: 10px;
	cursor: pointer;
}

.informations {
	display: flex;
	flex-wrap: wrap;
	font-weight: 700;
	border: 2px solid #242f3d;
	border-radius: 0.5em;
	background: #e3e9f0;
	padding: 15px 20px;
}

.informations .code {
	display: flex;
	align-items: center;
	width: 50%;
}

.informations .code.seul {
	width: 100%;
}

.informations .code .information {
	font-family: 'Roboto Slab';
	font-size: 23px;
	line-height: 1;
	user-select: text!important;
	margin-left: 5px;
}

.informations .motdepasse {
	display: flex;
	align-items: center;
	width: 50%;
}

.informations .motdepasse .information {
	font-family: 'Roboto Slab';
	font-size: 20px;
	line-height: 1;
	user-select: text!important;
	margin-left: 5px;
}

.informations .icone {
	display: inline-block;
	font-size: 24px;
	font-weight: 400;
	margin-left: 10px;
	line-height: 1;
	cursor: pointer;
}

.telecharger {
	display: flex;
	justify-content: flex-end;
	font-size: 14px;
	font-weight: 400;
	color: #00ced1;
	margin-top: 7px;
	cursor: pointer;
}

#conteneur.interaction-ouverte {
	overflow: hidden!important;
}

#afficher:active,
#copier:active {
	opacity: 0.7;
}

#interaction footer .section {
	justify-content: space-between;
}

#interaction footer .gauche .bouton.mobile {
	margin-right: 15px;
}

#interaction footer .droite {
	display: flex;
	justify-content: flex-end;
}

#interaction footer .bouton.mobile i {
	display: none;
	font-size: 24px;
}

#interaction footer .bouton.icone.affiche,
#interaction footer .bouton.icone.masque,
#interaction footer .bouton.icone.verrouille {
	color: #ff7b3c;
}

.utilisateurs[role="button"] {
	cursor: pointer;
}

#modale-confirmation,
#modale-lien {
	text-align: center;
	max-width: 500px;
}

#modale-confirmation .conteneur,
#modale-lien .conteneur {
	padding: 30px 25px;
}

#modale-lien p {
	font-family: 'Roboto Slab';
	font-size: 3.7rem;
	font-weight: 400;
	word-break: break-all;
}

#modale-resultats {
	max-width: 500px;
    height: 400px;
    max-height: 90%;
}

#modale-resultats .resultat {
	display: flex;
	justify-content: space-between;
    align-items: center;
	padding: 5px 10px;
    background: #eee;
    border-radius: 4px;
    margin-bottom: 10px;
}

#modale-resultats .session {
	width: calc(100% - 67px);
}

#modale-resultats .actions {
	display: flex;
	margin-left: 11px;
}

#modale-resultats .actions i {
	font-size: 24px;
	margin-left: 15px;
	color: #242f3d;
	cursor: pointer;
}

#modale-resultats .resultat .actions i.supprimer {
	color: #ff6259;
}

#modale-classement.avec-footer {
	max-width: 700px;
	height: 380px;
    max-height: 90%;
}

#modale-classement.avec-footer .conteneur {
    height: calc(100% - 110px);
}

#modale-parametres .actions span {
	width: 100%;
}

#modale-parametres .actions span {
	margin-bottom: 20px;
}

#modale-parametres .actions span.supprimer {
	color: #fff;
	background: #ff6259;
	text-shadow: 1px 1px 1px rgba(0, 0, 0, 0.3);
	margin-bottom: 0;
}

#modale-parametres .actions span.supprimer:hover {
	background: #d70b00;
}

#modale-parametres .conteneur p {
    font-size: 14px;
    margin-bottom: 15px;
}

#modale-parametres .langue:last-of-type {
	margin-bottom: 0;
}

#modale-codeqr .contenu {
	text-align: center;
}

#modale-codeqr #qr {
	display: inline-block;
}

@media screen and (max-width: 359px) {
	.telecharger {
		font-size: 12px;
	}
}

@media screen and (max-width: 479px) {
	#interaction footer .bouton.mobile i {
		display: block;
	}

	#interaction footer .bouton.mobile span {
		display: none;
	}

	#modale-lien p {
		font-size: 3rem;
	}
}

@media screen and (orientation: landscape) and (max-height: 479px) {
	#modale-parametres {
		height: 90%;
	}
}

@media screen and (max-width: 359px) {
	.informations .code .information {
		font-size: 18px;
	}

	.informations .motdepasse .information {
		font-size: 16px;
	}
}

@media screen and (max-width: 599px) {
	.informations .code {
		width: 100%;
		margin-bottom: 5px;
	}

	.informations .motdepasse {
		width: 100%;
	}
}

@media screen and (max-width: 768px) {
	.informations .motdepasse,
	.informations .code {
		font-size: 14px;
	}
}
</style>

<style>
#modale-codeqr #qr img {
	max-width: 100%;
	height: auto;
	max-height: 60vh;
}
</style>

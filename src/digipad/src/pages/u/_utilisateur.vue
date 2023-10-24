<template>
	<main id="page" v-if="identifiant !== '' && statut === 'utilisateur'">
		<header>
			<span id="conteneur-logo">
				<span id="logo" />
			</span>
			<span id="titre">{{ $t('monCompte') }}</span>
		</header>

		<nav id="nav">
			<span id="compte" role="button" tabindex="0" :title="$t('parametresCompte')" @click="menu = !menu"><i class="material-icons">account_circle</i></span>
			<span id="deconnexion" role="button" tabindex="0" :title="$t('deconnexion')" @click="deconnexion"><i class="material-icons">power_settings_new</i></span>
		</nav>

		<div class="menu gauche" :class="{'ouvert': menu}">
			<div class="en-tete">
				<span class="titre">{{ $t('parametresCompte') }}</span>
				<span role="button" tabindex="0" class="fermer" @click="menu = false"><i class="material-icons">close</i></span>
			</div>
			<div class="contenu ascenseur">
				<div class="conteneur">
					<label>{{ $t('langue') }}</label>
					<div id="langues">
						<span role="button" tabindex="0" :class="{'selectionne': langue === 'fr'}" @click="modifierLangue('fr')">FR</span>
						<span role="button" tabindex="0" :class="{'selectionne': langue === 'es'}" @click="modifierLangue('es')">ES</span>
						<span role="button" tabindex="0" :class="{'selectionne': langue === 'it'}" @click="modifierLangue('it')">IT</span>
						<span role="button" tabindex="0" :class="{'selectionne': langue === 'hr'}" @click="modifierLangue('hr')">HR</span>
						<span role="button" tabindex="0" :class="{'selectionne': langue === 'en'}" @click="modifierLangue('en')">EN</span>
					</div>
				</div>
				<div class="conteneur">
					<label for="identifiant">{{ $t('identifiant') }}</label>
					<input id="identifiant" type="text" readonly :value="identifiant">
				</div>
				<div class="conteneur">
					<label for="nom">{{ $t('nom') }}</label>
					<input id="nom" type="text" maxlength="48" :value="nom" @keydown.enter="modifierInformations">
				</div>
				<div class="conteneur">
					<label for="email">{{ $t('email') }}</label>
					<input id="email" type="text" :value="email" @keydown.enter="modifierInformations">
				</div>
				<div class="conteneur conteneur-bouton">
					<span role="button" tabindex="0" class="bouton-vert" @click="modifierInformations">{{ $t('enregistrer') }}</span>
				</div>
				<div class="conteneur conteneur-bouton">
					<span role="button" tabindex="0" class="bouton-bleu" @click="afficherModaleMotDePasse">{{ $t('modifierMotDePasse') }}</span>
				</div>
				<div class="conteneur conteneur-bouton">
					<span role="button" tabindex="0" class="bouton-rouge" @click="afficherModaleConfirmation($event, '', 'supprimer-compte')">{{ $t('supprimerCompte') }}</span>
				</div>
			</div>
		</div>

		<div id="onglets" class="ascenseur">
			<div class="onglet" :class="{'actif': onglet === 'pads-crees'}" @click="onglet = 'pads-crees'">
				<span>{{ $t('padsCrees') }}</span>
				<span class="badge">{{ padsCrees.length }}</span>
			</div>
			<div class="onglet" :class="{'actif': onglet === 'pads-rejoints'}" @click="onglet = 'pads-rejoints'">
				<span>{{ $t('padsRejoints') }}</span>
				<span class="badge">{{ padsRejoints.length }}</span>
			</div>
			<div class="onglet" :class="{'actif': onglet === 'pads-admins'}" @click="onglet = 'pads-admins'">
				<span>{{ $t('padsAdmins') }}</span>
				<span class="badge">{{ padsAdmins.length }}</span>
			</div>
			<div class="onglet" :class="{'actif': onglet === 'pads-favoris'}" @click="onglet = 'pads-favoris'">
				<span>{{ $t('favoris') }}</span>
				<span class="badge">{{ padsFavoris.length }}</span>
			</div>
			<div class="onglet" v-for="(item, indexItem) in dossiers" :class="{'actif': onglet === item.id}" @click="onglet = item.id" :key="'dossier_' + indexItem">
				<span>{{ item.nom }}</span>
				<span class="badge">{{ item.pads.length }}</span>
				<div class="menu-dossier">
					<span role="button" tabindex="0" class="bouton" :title="$t('modifierDossier')" @click="afficherModaleModifierDossier($event, item.id)"><i class="material-icons">edit</i></span>
					<span role="button" tabindex="0" class="bouton supprimer" :title="$t('supprimerDossier')" @click="afficherModaleConfirmation($event, item.id, 'supprimer-dossier')"><i class="material-icons">delete</i></span>
				</div>
			</div>
			<span class="bouton-ajouter" role="button" tabindex="0" @click="afficherModaleAjouterDossier">{{ $t('ajouterDossier') }}</span>
		</div>

		<div id="pads" class="ascenseur" :class="affichage">
			<div class="section">
				<div id="boutons">
					<span id="bouton-creer" :class="{'desactive': padsCrees.length >= limite}" role="button" tabindex="0" @click="afficherModaleCreerPad">{{ $t('creerPad') }}</span>
					<span id="bouton-importer" :class="{'desactive': padsCrees.length >= limite}" role="button" tabindex="0" @click="afficherModaleImporterPad">{{ $t('importerPad') }}</span>
				</div>
				<div id="filtrer">
					<div class="rechercher">
						<span><i class="material-icons">search</i></span>
						<input type="search" :value="requete" :placeholder="$t('rechercher')" @input="requete = $event.target.value">
					</div>
					<div class="filtrer">
						<span><i class="material-icons">sort</i></span>
						<select id="champ-filtrer" @change="modifierFiltre($event.target.value)">
							<option value="date-asc" :selected="filtre === 'date-asc'">{{ $t('dateAsc') }}</option>
							<option value="date-desc" :selected="filtre === 'date-desc'">{{ $t('dateDesc') }}</option>
							<option value="alpha-asc" :selected="filtre === 'alpha-asc'">{{ $t('alphaAsc') }}</option>
							<option value="alpha-desc" :selected="filtre === 'alpha-desc'">{{ $t('alphaDesc') }}</option>
						</select>
					</div>
					<div class="afficher">
						<span role="button" tabindex="0" :title="$t('affichageListe')" @click="modifierAffichage('liste')"><i class="material-icons">view_list</i></span>
						<span role="button" tabindex="0" :title="$t('affichageMosaique')" @click="modifierAffichage('mosaique')"><i class="material-icons">view_module</i></span>
					</div>
				</div>
				<div id="actions-dossier" v-if="onglet !== 'pads-crees' && onglet !== 'pads-rejoints' && onglet !== 'pads-admins' && onglet !== 'pads-favoris'">
					<div class="conteneur">
						<label>{{ $t('actionsDossier') }}</label>
						<span role="button" tabindex="0" class="bouton" :title="$t('modifierDossier')" @click="afficherModaleModifierDossier($event, onglet)"><i class="material-icons">edit</i></span>
						<span role="button" tabindex="0" class="bouton supprimer" :title="$t('supprimerDossier')" @click="afficherModaleConfirmation($event, onglet, 'supprimer-dossier')"><i class="material-icons">delete</i></span>
					</div>
				</div>
				<div class="pads" v-if="pads.length > 0 && requete === ''">
					<template v-for="(pad, indexPad) in pads">
						<div class="pad liste" v-if="affichage === 'liste'" :key="'pad_' + indexPad">
							<a class="fond" :href="'/p/' + pad.id + '/' + pad.token" :class="{'fond-personnalise': pad.fond.substring(1, 9) === 'fichiers'}" :style="definirFond(pad.fond)" />
							<a class="meta" :class="{'pad-rejoint': pad.identifiant !== identifiant, 'deplacer': dossiers.length > 0}" :href="'/p/' + pad.id + '/' + pad.token">
								<span class="mise-a-jour" v-if="pad.hasOwnProperty('notification') && pad.notification.includes(identifiant)" />
								<span class="titre">{{ pad.titre }}</span>
								<span class="date">{{ $t('creeLe') }} {{ $formaterDate(pad.date, langue) }}</span>
								<span class="auteur" v-if="pad.identifiant !== identifiant">{{ $t('par') }} {{ pad.identifiant }}</span>
								<span class="vues" v-if="pad.hasOwnProperty('vues') && pad.vues > 1">- {{ pad.vues }} {{ $t('vues') }}</span>
								<span class="vues" v-else-if="pad.hasOwnProperty('vues') && pad.vues < 2">- {{ pad.vues }} {{ $t('vue') }}</span>
								<span class="vues" v-else-if="!pad.hasOwnProperty('vues')">- 0 {{ $t('vue') }}</span>
							</a>
							<div class="actions" v-if="pad.identifiant === identifiant">
								<span class="ajouter-favori" role="button" tabindex="0" @click="ajouterFavori(pad)" :title="$t('ajouterFavori')" v-if="!favoris.includes(pad.id)"><i class="material-icons">star_outline</i></span>
								<span class="supprimer-favori" role="button" tabindex="0" @click="supprimerFavori(pad.id)" :title="$t('supprimerFavori')" v-else><i class="material-icons">star</i></span>
								<span class="deplacer" role="button" tabindex="0" @click="afficherModaleDeplacerPad(pad.id)" :title="$t('ajouterDansDossier')" :class="{'actif': verifierDossierPad(pad.id)}" v-if="dossiers.length > 0"><i class="material-icons">drive_file_move</i></span>
								<span class="dupliquer" role="button" tabindex="0" @click="afficherModaleConfirmation($event, pad.id, 'dupliquer')" :title="$t('dupliquerPad')"><i class="material-icons">content_copy</i></span>
								<span class="exporter" role="button" tabindex="0" @click="afficherModaleConfirmation($event, pad.id, 'exporter')" :title="$t('exporterPad')"><i class="material-icons">get_app</i></span>
								<span class="supprimer" role="button" tabindex="0" @click="afficherModaleConfirmation($event, pad.id, 'supprimer')" :title="$t('supprimerPad')"><i class="material-icons">delete</i></span>
							</div>
							<div class="actions" v-else>
								<span class="ajouter-favori" role="button" tabindex="0" @click="ajouterFavori(pad)" :title="$t('ajouterFavori')" v-if="!favoris.includes(pad.id)"><i class="material-icons">star_outline</i></span>
								<span class="supprimer-favori" role="button" tabindex="0" @click="supprimerFavori(pad.id)" :title="$t('supprimerFavori')" v-else><i class="material-icons">star</i></span>
								<span class="deplacer" role="button" tabindex="0" @click="afficherModaleDeplacerPad(pad.id)" :title="$t('ajouterDansDossier')" :class="{'actif': verifierDossierPad(pad.id)}" v-if="dossiers.length > 0"><i class="material-icons">drive_file_move</i></span>
								<span class="supprimer" role="button" tabindex="0" @click="afficherModaleConfirmation($event, pad.id, 'supprimer')" :title="$t('supprimerPad')" v-if="definirTypePad(pad.id) === 'pad-rejoint'"><i class="material-icons">delete</i></span>
								<span class="supprimer" role="button" tabindex="0" @click="afficherModaleConfirmation($event, pad.id, 'supprimer-admin')" :title="$t('quitterPad')" v-else-if="definirTypePad(pad.id) === 'pad-admin'"><i class="material-icons">logout</i></span>
								<span class="admin" :title="$t('admin')" v-if="definirTypePad(pad.id) === 'pad-admin'"><i class="material-icons">admin_panel_settings</i></span>
							</div>
						</div>

						<div class="pad mosaique" v-else :key="'pad_' + indexPad">
							<a class="conteneur" :class="{'fond-personnalise': pad.fond.substring(1, 9) === 'fichiers'}" :style="definirFond(pad.fond)" :href="'/p/' + pad.id + '/' + pad.token">
								<div class="meta">
									<span class="titre"><span class="mise-a-jour" v-if="pad.hasOwnProperty('notification') && pad.notification.includes(identifiant)" />{{ pad.titre }}</span>
									<span class="date">{{ $t('creeLe') }} {{ $formaterDate(pad.date, langue) }}</span>
									<span class="auteur" v-if="pad.identifiant !== identifiant">{{ $t('par') }} {{ pad.identifiant }}</span>
									<span class="vues" v-if="pad.hasOwnProperty('vues') && pad.vues > 1">- {{ pad.vues }} {{ $t('vues') }}</span>
									<span class="vues" v-else-if="pad.hasOwnProperty('vues') && pad.vues < 2">- {{ pad.vues }} {{ $t('vue') }}</span>
									<span class="vues" v-else-if="!pad.hasOwnProperty('vues')">- 0 {{ $t('vue') }}</span>
								</div>
							</a>
							<div class="actions" v-if="pad.identifiant === identifiant">
								<span class="ajouter-favori" role="button" tabindex="0" @click="ajouterFavori(pad)" :title="$t('ajouterFavori')" v-if="!favoris.includes(pad.id)"><i class="material-icons">star_outline</i></span>
								<span class="supprimer-favori" role="button" tabindex="0" @click="supprimerFavori(pad.id)" :title="$t('supprimerFavori')" v-else><i class="material-icons">star</i></span>
								<span class="deplacer" role="button" tabindex="0" @click="afficherModaleDeplacerPad(pad.id)" :title="$t('ajouterDansDossier')" :class="{'actif': verifierDossierPad(pad.id)}" v-if="dossiers.length > 0"><i class="material-icons">drive_file_move</i></span>
								<span class="dupliquer" role="button" tabindex="0" @click="afficherModaleConfirmation($event, pad.id, 'dupliquer')" :title="$t('dupliquerPad')"><i class="material-icons">content_copy</i></span>
								<span class="exporter" role="button" tabindex="0" @click="afficherModaleConfirmation($event, pad.id, 'exporter')" :title="$t('exporterPad')"><i class="material-icons">get_app</i></span>
								<span class="supprimer" role="button" tabindex="0" @click="afficherModaleConfirmation($event, pad.id, 'supprimer')" :title="$t('supprimerPad')"><i class="material-icons">delete</i></span>
							</div>
							<div class="actions" v-else>
								<span class="ajouter-favori" role="button" tabindex="0" @click="ajouterFavori(pad)" :title="$t('ajouterFavori')" v-if="!favoris.includes(pad.id)"><i class="material-icons">star_outline</i></span>
								<span class="supprimer-favori" role="button" tabindex="0" @click="supprimerFavori(pad.id)" :title="$t('supprimerFavori')" v-else><i class="material-icons">star</i></span>
								<span class="deplacer" role="button" tabindex="0" @click="afficherModaleDeplacerPad(pad.id)" :title="$t('ajouterDansDossier')" :class="{'actif': verifierDossierPad(pad.id)}" v-if="dossiers.length > 0"><i class="material-icons">drive_file_move</i></span>
								<span class="supprimer" role="button" tabindex="0" @click="afficherModaleConfirmation($event, pad.id, 'supprimer')" :title="$t('supprimerPad')" v-if="definirTypePad(pad.id) === 'pad-rejoint'"><i class="material-icons">delete</i></span>
								<span class="supprimer" role="button" tabindex="0" @click="afficherModaleConfirmation($event, pad.id, 'supprimer-admin')" :title="$t('quitterPad')" v-else-if="definirTypePad(pad.id) === 'pad-admin'"><i class="material-icons">logout</i></span>
								<span class="admin" :title="$t('admin')" v-if="definirTypePad(pad.id) === 'pad-admin'"><i class="material-icons">admin_panel_settings</i></span>
							</div>
						</div>
					</template>
				</div>
				<div class="vide" v-else-if="pads.length === 0 && requete === ''">
					<span v-if="onglet === 'pads-crees'">{{ $t('aucunPadCree') }}</span>
					<span v-else-if="onglet === 'pads-rejoints'">{{ $t('aucunPadRejoint') }}</span>
					<span v-else-if="onglet === 'pads-favoris'">{{ $t('aucunFavori') }}</span>
					<span v-else>{{ $t('aucunPadDossier') }}</span>
				</div>
				<div class="pads" v-else-if="resultats.length > 0 && requete !== ''">
					<template v-for="(pad, indexPad) in resultats">
						<div class="pad liste" v-if="affichage === 'liste'" :key="'pad_' + indexPad">
							<a class="fond" :href="'/p/' + pad.id + '/' + pad.token" :class="{'fond-personnalise': pad.fond.substring(1, 9) === 'fichiers'}" :style="definirFond(pad.fond)" />
							<a class="meta" :class="{'pad-rejoint': pad.identifiant !== identifiant, 'deplacer': dossiers.length > 0}" :href="'/p/' + pad.id + '/' + pad.token">
								<span class="mise-a-jour" v-if="pad.hasOwnProperty('notification') && pad.notification.includes(identifiant)" />
								<span class="titre">{{ pad.titre }}</span>
								<span class="date">{{ $t('creeLe') }} {{ $formaterDate(pad.date, langue) }}</span>
								<span class="auteur" v-if="pad.identifiant !== identifiant">{{ $t('par') }} {{ pad.identifiant }}</span>
								<span class="vues" v-if="pad.hasOwnProperty('vues') && pad.vues > 1">- {{ pad.vues }} {{ $t('vues') }}</span>
								<span class="vues" v-else-if="pad.hasOwnProperty('vues') && pad.vues < 2">- {{ pad.vues }} {{ $t('vue') }}</span>
								<span class="vues" v-else-if="!pad.hasOwnProperty('vues')">- 0 {{ $t('vue') }}</span>
							</a>
							<div class="actions" v-if="pad.identifiant === identifiant">
								<span class="ajouter-favori" role="button" tabindex="0" @click="ajouterFavori(pad)" :title="$t('ajouterFavori')" v-if="!favoris.includes(pad.id)"><i class="material-icons">star_outline</i></span>
								<span class="supprimer-favori" role="button" tabindex="0" @click="supprimerFavori(pad.id)" :title="$t('supprimerFavori')" v-else><i class="material-icons">star</i></span>
								<span class="deplacer" role="button" tabindex="0" @click="afficherModaleDeplacerPad(pad.id)" :title="$t('ajouterDansDossier')" :class="{'actif': verifierDossierPad(pad.id)}" v-if="dossiers.length > 0"><i class="material-icons">drive_file_move</i></span>
								<span class="dupliquer" role="button" tabindex="0" @click="afficherModaleConfirmation($event, pad.id, 'dupliquer')" :title="$t('dupliquerPad')"><i class="material-icons">content_copy</i></span>
								<span class="exporter" role="button" tabindex="0" @click="afficherModaleConfirmation($event, pad.id, 'exporter')" :title="$t('exporterPad')"><i class="material-icons">get_app</i></span>
								<span class="supprimer" role="button" tabindex="0" @click="afficherModaleConfirmation($event, pad.id, 'supprimer')" :title="$t('supprimerPad')"><i class="material-icons">delete</i></span>
							</div>
							<div class="actions" v-else>
								<span class="ajouter-favori" role="button" tabindex="0" @click="ajouterFavori(pad)" :title="$t('ajouterFavori')" v-if="!favoris.includes(pad.id)"><i class="material-icons">star_outline</i></span>
								<span class="supprimer-favori" role="button" tabindex="0" @click="supprimerFavori(pad.id)" :title="$t('supprimerFavori')" v-else><i class="material-icons">star</i></span>
								<span class="deplacer" role="button" tabindex="0" @click="afficherModaleDeplacerPad(pad.id)" :title="$t('ajouterDansDossier')" :class="{'actif': verifierDossierPad(pad.id)}" v-if="dossiers.length > 0"><i class="material-icons">drive_file_move</i></span>
								<span class="supprimer" role="button" tabindex="0" @click="afficherModaleConfirmation($event, pad.id, 'supprimer')" :title="$t('supprimerPad')" v-if="definirTypePad(pad.id) === 'pad-rejoint'"><i class="material-icons">delete</i></span>
								<span class="supprimer" role="button" tabindex="0" @click="afficherModaleConfirmation($event, pad.id, 'supprimer-admin')" :title="$t('quitterPad')" v-else-if="definirTypePad(pad.id) === 'pad-admin'"><i class="material-icons">logout</i></span>
								<span class="admin" :title="$t('admin')" v-if="definirTypePad(pad.id) === 'pad-admin'"><i class="material-icons">admin_panel_settings</i></span>
							</div>
						</div>

						<div class="pad mosaique" v-else :key="'pad_' + indexPad">
							<a class="conteneur" :class="{'fond-personnalise': pad.fond.substring(1, 9) === 'fichiers'}" :style="definirFond(pad.fond)" :href="'/p/' + pad.id + '/' + pad.token">
								<div class="meta">
									<span class="titre"><span class="mise-a-jour" v-if="pad.hasOwnProperty('notification') && pad.notification.includes(identifiant)" />{{ pad.titre }}</span>
									<span class="date">{{ $t('creeLe') }} {{ $formaterDate(pad.date, langue) }}</span>
									<span class="auteur" v-if="pad.identifiant !== identifiant">{{ $t('par') }} {{ pad.identifiant }}</span>
									<span class="vues" v-if="pad.hasOwnProperty('vues') && pad.vues > 1">- {{ pad.vues }} {{ $t('vues') }}</span>
									<span class="vues" v-else-if="pad.hasOwnProperty('vues') && pad.vues < 2">- {{ pad.vues }} {{ $t('vue') }}</span>
									<span class="vues" v-else-if="!pad.hasOwnProperty('vues')">- 0 {{ $t('vue') }}</span>
								</div>
							</a>
							<div class="actions" v-if="pad.identifiant === identifiant">
								<span class="ajouter-favori" role="button" tabindex="0" @click="ajouterFavori(pad)" :title="$t('ajouterFavori')" v-if="!favoris.includes(pad.id)"><i class="material-icons">star_outline</i></span>
								<span class="supprimer-favori" role="button" tabindex="0" @click="supprimerFavori(pad.id)" :title="$t('supprimerFavori')" v-else><i class="material-icons">star</i></span>
								<span class="deplacer" role="button" tabindex="0" @click="afficherModaleDeplacerPad(pad.id)" :title="$t('ajouterDansDossier')" :class="{'actif': verifierDossierPad(pad.id)}" v-if="dossiers.length > 0"><i class="material-icons">drive_file_move</i></span>
								<span class="dupliquer" role="button" tabindex="0" @click="afficherModaleConfirmation($event, pad.id, 'dupliquer')" :title="$t('dupliquerPad')"><i class="material-icons">content_copy</i></span>
								<span class="exporter" role="button" tabindex="0" @click="afficherModaleConfirmation($event, pad.id, 'exporter')" :title="$t('exporterPad')"><i class="material-icons">get_app</i></span>
								<span class="supprimer" role="button" tabindex="0" @click="afficherModaleConfirmation($event, pad.id, 'supprimer')" :title="$t('supprimerPad')"><i class="material-icons">delete</i></span>
							</div>
							<div class="actions" v-else>
								<span class="ajouter-favori" role="button" tabindex="0" @click="ajouterFavori(pad)" :title="$t('ajouterFavori')" v-if="!favoris.includes(pad.id)"><i class="material-icons">star_outline</i></span>
								<span class="supprimer-favori" @click="supprimerFavori(pad.id)" :title="$t('supprimerFavori')" v-else><i class="material-icons">star</i></span>
								<span class="deplacer" role="button" tabindex="0" @click="afficherModaleDeplacerPad(pad.id)" :title="$t('ajouterDansDossier')" :class="{'actif': verifierDossierPad(pad.id)}" v-if="dossiers.length > 0"><i class="material-icons">drive_file_move</i></span>
								<span class="supprimer" role="button" tabindex="0" @click="afficherModaleConfirmation($event, pad.id, 'supprimer')" :title="$t('supprimerPad')" v-if="definirTypePad(pad.id) === 'pad-rejoint'"><i class="material-icons">delete</i></span>
								<span class="supprimer" role="button" tabindex="0" @click="afficherModaleConfirmation($event, pad.id, 'supprimer-admin')" :title="$t('quitterPad')" v-else-if="definirTypePad(pad.id) === 'pad-admin'"><i class="material-icons">logout</i></span>
								<span class="admin" :title="$t('admin')" v-if="definirTypePad(pad.id) === 'pad-admin'"><i class="material-icons">admin_panel_settings</i></span>
							</div>
						</div>
					</template>
				</div>
				<div class="vide" v-else-if="resultats.length === 0 && requete !== ''">
					{{ $t('aucunResultat') }}
				</div>
			</div>
		</div>

		<div class="conteneur-modale" v-if="modaleMotDePasse">
			<div id="motdepasse" class="modale">
				<div class="en-tete">
					<span class="titre">{{ $t('modifierMotDePasse') }}</span>
					<span role="button" tabindex="0" class="fermer" @click="fermerModaleMotDePasse"><i class="material-icons">close</i></span>
				</div>
				<div class="conteneur">
					<div class="contenu">
						<label for="champ-motdepasse-actuel">{{ $t('motDePasseActuel') }}</label>
						<input id="champ-motdepasse-actuel" type="password" maxlength="48" :value="motDePasse" @input="motDePasse = $event.target.value">
						<label for="champ-nouveau-motdepasse">{{ $t('nouveauMotDePasse') }}</label>
						<input id="champ-nouveau-motdepasse" type="password" maxlength="48" :value="nouveauMotDePasse" @input="nouveauMotDePasse = $event.target.value">
						<label for="champ-confirmation-motdepasse">{{ $t('confirmationNouveauMotDePasse') }}</label>
						<input id="champ-confirmation-motdepasse" type="password" maxlength="48" :value="confirmationNouveauMotDePasse" @input="confirmationNouveauMotDePasse = $event.target.value" @keydown.enter="modifierMotDePasse">
						<div class="actions">
							<span role="button" tabindex="0" class="bouton" @click="modifierMotDePasse">{{ $t('modifier') }}</span>
						</div>
					</div>
				</div>
			</div>
		</div>

		<div class="conteneur-modale" v-if="modaleCreerPad">
			<div id="creation" class="modale">
				<div class="en-tete">
					<span class="titre">{{ $t('creerPad') }}</span>
					<span role="button" class="fermer" @click="fermerModaleCreerPad"><i class="material-icons">close</i></span>
				</div>
				<div class="conteneur">
					<div class="contenu">
						<label for="champ-titre-pad">{{ $t('titrePad') }}</label>
						<input id="champ-titre-pad" type="text" maxlength="48" :value="titre" @input="titre = $event.target.value" @keydown.enter="creerPad">
						<div class="actions">
							<span role="button" tabindex="0" class="bouton" @click="creerPad">{{ $t('creer') }}</span>
						</div>
					</div>
				</div>
			</div>
		</div>

		<div class="conteneur-modale" v-else-if="modaleDeplacerPad">
			<div id="creation" class="modale">
				<div class="en-tete">
					<span class="titre">{{ $t('ajouterDansDossier') }}</span>
					<span role="button" class="fermer" @click="fermerModaleDeplacerPad"><i class="material-icons">close</i></span>
				</div>
				<div class="conteneur">
					<div class="contenu">
						<label for="champ-dossier-actuel">{{ $t('dossierActuel') }}</label>
						<input type="text" :value="$t('aucunDossier')" disabled v-if="dossierActuel.id === 'aucun'">
						<input type="text" :value="dossierActuel.nom" disabled v-else>
						<label for="champ-dossier-pad">{{ $t('dossierDestination') }}</label>
						<select id="champ-dossier-pad">
							<option value="aucun" v-if="dossierActuel.id !== 'aucun'">{{ $t('aucunDossier') }}</option>
							<template v-for="(item, indexItem) in dossiers">
								<option :value="item.id" v-if="dossierActuel.id !== item.id" :key="'dossier_' + indexItem">{{ item.nom }}</option>
							</template>
						</select>
						<div class="actions">
							<span role="button" tabindex="0" class="bouton" @click="deplacerPad">{{ $t('valider') }}</span>
						</div>
					</div>
				</div>
			</div>
		</div>

		<div class="conteneur-modale" v-else-if="modaleImporterPad">
			<div id="import" class="modale">
				<div class="en-tete">
					<span class="titre">{{ $t('importerPad') }}</span>
					<span role="button" tabindex="0" class="fermer" @click="fermerModaleImporterPad"><i class="material-icons">close</i></span>
				</div>
				<div class="conteneur">
					<div class="contenu">
						<div class="conteneur-interrupteur" v-if="progressionImport === 0">
							<span>{{ $t('importerCommentaires') }}</span>
							<label class="bouton-interrupteur">
								<input type="checkbox" :checked="parametresImport.commentaires" @change="modifierParametresImport($event, 'commentaires')">
								<span class="barre" />
							</label>
						</div>
						<div class="conteneur-interrupteur" v-if="progressionImport === 0">
							<span>{{ $t('importerEvaluations') }}</span>
							<label class="bouton-interrupteur">
								<input type="checkbox" :checked="parametresImport.evaluations" @change="modifierParametresImport($event, 'evaluations')">
								<span class="barre" />
							</label>
						</div>
						<div class="conteneur-interrupteur" v-if="progressionImport === 0">
							<span>{{ $t('importerActivite') }}</span>
							<label class="bouton-interrupteur">
								<input type="checkbox" :checked="parametresImport.activite" @change="modifierParametresImport($event, 'activite')">
								<span class="barre" />
							</label>
						</div>
						<label for="importer-pad" class="bouton" v-show="progressionImport === 0">{{ $t('selectionnerPad') }}</label>
						<input id="importer-pad" type="file" style="display: none" accept=".zip" @change="importerPad">
						<div class="conteneur-chargement progression" v-if="progressionImport > 0">
							<progress class="barre-progression" max="100" :value="progressionImport" />
							<div class="chargement" />
						</div>
					</div>
				</div>
			</div>
		</div>

		<div class="conteneur-modale" v-else-if="modaleAjouterDossier">
			<div id="ajout-dossier" class="modale">
				<div class="en-tete">
					<span class="titre">{{ $t('ajouterDossier') }}</span>
					<span role="button" class="fermer" @click="fermerModaleAjouterDossier"><i class="material-icons">close</i></span>
				</div>
				<div class="conteneur">
					<div class="contenu">
						<label for="champ-nom-dossier">{{ $t('nomDossier') }}</label>
						<input id="champ-nom-dossier" type="text" maxlength="48" :value="dossier" @input="dossier = $event.target.value" @keydown.enter="ajouterDossier">
						<div class="actions">
							<span role="button" tabindex="0" class="bouton" @click="ajouterDossier">{{ $t('valider') }}</span>
						</div>
					</div>
				</div>
			</div>
		</div>

		<div class="conteneur-modale" v-else-if="modaleModifierDossier">
			<div id="modification-dossier" class="modale">
				<div class="en-tete">
					<span class="titre">{{ $t('modifierDossier') }}</span>
					<span role="button" class="fermer" @click="fermerModaleModifierDossier"><i class="material-icons">close</i></span>
				</div>
				<div class="conteneur">
					<div class="contenu">
						<label for="champ-nom-dossier">{{ $t('nomDossier') }}</label>
						<input id="champ-nom-dossier" type="text" maxlength="48" :value="dossier" @input="dossier = $event.target.value" @keydown.enter="modifierDossier">
						<div class="actions">
							<span role="button" tabindex="0" class="bouton" @click="modifierDossier">{{ $t('valider') }}</span>
						</div>
					</div>
				</div>
			</div>
		</div>

		<div class="conteneur-modale alerte" v-if="modaleConfirmation !== ''">
			<div class="modale">
				<div class="conteneur">
					<div class="contenu">
						<div class="message" v-html="$t('confirmationDupliquerPad')" v-if="modaleConfirmation === 'dupliquer'" />
						<div class="message" v-html="$t('confirmationExporterPad')" v-else-if="modaleConfirmation === 'exporter'" />
						<div class="message" v-html="$t('confirmationSupprimerPad')" v-else-if="modaleConfirmation === 'supprimer'" />
						<div class="message" v-html="$t('confirmationSupprimerPadAdmin')" v-else-if="modaleConfirmation === 'supprimer-admin'" />
						<div class="message" v-html="$t('confirmationSupprimerCompte')" v-else-if="modaleConfirmation === 'supprimer-compte'" />
						<div class="message" v-html="$t('confirmationSupprimerDossier')" v-else-if="modaleConfirmation === 'supprimer-dossier'" />
						<div class="actions">
							<span role="button" tabindex="0" class="bouton" @click="fermerModaleConfirmation">{{ $t('non') }}</span>
							<span role="button" tabindex="0" class="bouton" @click="dupliquerPad" v-if="modaleConfirmation === 'dupliquer'">{{ $t('oui') }}</span>
							<span role="button" tabindex="0" class="bouton" @click="exporterPad" v-else-if="modaleConfirmation === 'exporter'">{{ $t('oui') }}</span>
							<span role="button" tabindex="0" class="bouton" @click="supprimerPad" v-else-if="modaleConfirmation === 'supprimer'">{{ $t('oui') }}</span>
							<span role="button" tabindex="0" class="bouton" @click="supprimerPad" v-else-if="modaleConfirmation === 'supprimer-admin'">{{ $t('oui') }}</span>
							<span role="button" tabindex="0" class="bouton" @click="supprimerCompte" v-else-if="modaleConfirmation === 'supprimer-compte'">{{ $t('oui') }}</span>
							<span role="button" tabindex="0" class="bouton" @click="supprimerDossier" v-else-if="modaleConfirmation === 'supprimer-dossier'">{{ $t('oui') }}</span>
						</div>
					</div>
				</div>
			</div>
		</div>

		<chargement :chargement="chargement" v-if="chargement" />
	</main>
</template>

<script>
import axios from 'axios'
import imagesLoaded from 'imagesloaded'
import saveAs from 'file-saver'
import chargement from '../../components/chargement.vue'

export default {
	name: 'Utilisateur',
	components: {
		chargement
	},
	async asyncData (context) {
		const { data } = await axios.post(context.store.state.hote + '/api/recuperer-donnees-utilisateur', {
			identifiant: context.store.state.identifiant
		}, {
			headers: { 'Content-Type': 'application/json' }
		})
		return {
			padsCrees: data.padsCrees,
			padsRejoints: data.padsRejoints,
			padsAdmins: data.padsAdmins,
			padsFavoris: data.padsFavoris,
			dossiers: data.dossiers
		}
	},
	data () {
		return {
			chargement: false,
			onglet: 'pads-crees',
			titre: '',
			menu: false,
			modaleCreerPad: false,
			modaleImporterPad: false,
			progressionImport: 0,
			modaleConfirmation: '',
			padId: '',
			modaleMotDePasse: false,
			motDePasse: '',
			nouveauMotDePasse: '',
			confirmationNouveauMotDePasse: '',
			pads: [],
			requete: '',
			resultats: [],
			favoris: [],
			parametresImport: {
				commentaires: false,
				evaluations: false,
				activite: false
			},
			modaleAjouterDossier: false,
			modaleModifierDossier: false,
			dossier: '',
			dossierId: '',
			modaleDeplacerPad: false,
			dossierActuel: {}
		}
	},
	head () {
		return {
			title: this.identifiant + ' - Digipad by La Digitale'
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
		email () {
			return this.$store.state.email
		},
		langue () {
			return this.$store.state.langue
		},
		statut () {
			return this.$store.state.statut
		},
		affichage () {
			return this.$store.state.affichage
		},
		filtre () {
			return this.$store.state.filtre
		},
		limite () {
			return process.env.padLimit
		}
	},
	watch: {
		onglet: function (onglet) {
			let pads = []
			if (onglet === 'pads-crees') {
				pads = this.padsCrees
			} else if (onglet === 'pads-rejoints') {
				pads = this.padsRejoints
			} else if (onglet === 'pads-admins') {
				pads = this.padsAdmins
			} else if (onglet === 'pads-favoris') {
				pads = this.padsFavoris
			} else {
				let listePads = []
				this.dossiers.forEach(function (dossier) {
					if (dossier.id === onglet) {
						listePads = dossier.pads
					}
				})
				const padsTous = this.padsCrees.concat(this.padsRejoints, this.padsAdmins)
				padsTous.forEach(function (pad) {
					if (listePads.includes(pad.id)) {
						pads.push(pad)
					}
				})
			}
			this.pads = pads
			this.requete = ''
		},
		requete: function () {
			this.rechercher()
		}
	},
	watchQuery: ['page'],
	created () {
		if (this.identifiant === '' || this.statut === 'invite') {
			this.$router.push('/')
		}
		this.pads = this.padsCrees
		const favoris = []
		this.padsFavoris.forEach(function (pad) {
			favoris.push(pad.id)
		})
		this.favoris = favoris
		this.filtrer(this.filtre)
		this.$nuxt.$loading.start()
		this.$i18n.setLocale(this.langue)
	},
	mounted () {
		imagesLoaded('#pads', { background: true }, function () {
			setTimeout(function () {
				this.$nuxt.$loading.finish()
				document.getElementsByTagName('html')[0].setAttribute('lang', this.langue)
			}.bind(this), 100)
		}.bind(this))
	},
	methods: {
		definirFond (fond) {
			if (fond.substring(0, 1) === '#') {
				return { backgroundColor: fond }
			} else {
				return { backgroundImage: 'url(' + fond + ')' }
			}
		},
		afficherModaleCreerPad () {
			if (this.padsCrees.length < this.limite) {
				this.modaleCreerPad = true
				this.$nextTick(function () {
					document.querySelector('#creation input').focus()
				})
			} else {
				this.$store.dispatch('modifierAlerte', this.$t('limitePad', { limite: this.limite }))
			}
		},
		creerPad () {
			if (this.titre !== '') {
				axios.post(this.hote + '/api/creer-pad', {
					titre: this.titre,
					identifiant: this.identifiant
				}).then(function (reponse) {
					const donnees = reponse.data
					if (donnees === 'non_connecte') {
						this.$router.push('/')
					} else if (donnees === 'erreur_creation') {
						this.$store.dispatch('modifierAlerte', this.$t('erreurCreationPad'))
					} else {
						this.padsCrees.push(donnees)
						this.$router.push('/p/' + donnees.id + '/' + donnees.token)
					}
				}.bind(this)).catch(function () {
					this.$store.dispatch('modifierAlerte', this.$t('erreurCommunicationServeur'))
				}.bind(this))
			}
		},
		fermerModaleCreerPad () {
			this.modaleCreerPad = false
			this.titre = ''
		},
		afficherModaleImporterPad () {
			if (this.padsCrees.length < this.limite) {
				this.modaleImporterPad = true
			} else {
				this.$store.dispatch('modifierAlerte', this.$t('limitePad', { limite: this.limite }))
			}
		},
		modifierParametresImport (event, type) {
			this.parametresImport[type] = event.target.checked
		},
		importerPad () {
			const champ = document.querySelector('#importer-pad')
			const extension = champ.files[0].name.substring(champ.files[0].name.lastIndexOf('.') + 1).toLowerCase()
			if (champ.files && champ.files[0] && extension === 'zip') {
				const formulaire = new FormData()
				formulaire.append('parametres', JSON.stringify(this.parametresImport))
				formulaire.append('fichier', champ.files[0])
				axios.post(this.hote + '/api/importer-pad', formulaire, {
					headers: {
						'Content-Type': 'multipart/form-data'
					},
					onUploadProgress: function (progression) {
						const pourcentage = parseInt(Math.round((progression.loaded * 100) / progression.total))
						this.progressionImport = pourcentage
					}.bind(this)
				}).then(function (reponse) {
					this.fermerModaleImporterPad()
					const donnees = reponse.data
					if (donnees === 'non_connecte') {
						this.$router.push('/')
					} else if (donnees === 'erreur_import') {
						this.$store.dispatch('modifierAlerte', this.$t('erreurImportPad'))
					} else if (donnees === 'donnees_corrompues') {
						this.$store.dispatch('modifierAlerte', this.$t('donneesCorrompuesImportPad'))
					} else {
						this.onglet = 'pads-crees'
						this.padsCrees.push(donnees)
						this.$store.dispatch('modifierMessage', this.$t('padImporte'))
					}
				}.bind(this)).catch(function () {
					this.fermerModaleImporterPad()
					this.$store.dispatch('modifierAlerte', this.$t('erreurCommunicationServeur'))
				}.bind(this))
			} else {
				this.$store.dispatch('modifierAlerte', this.$t('formatFichierPasAccepte'))
				champ.value = ''
			}
		},
		fermerModaleImporterPad () {
			this.modaleImporterPad = false
			this.parametresImport.commentaires = false
			this.parametresImport.evaluations = false
			this.parametresImport.activite = false
			this.progressionImport = 0
			document.querySelector('#importer-pad').value = ''
		},
		afficherModaleConfirmation (event, id, type) {
			event.preventDefault()
			event.stopPropagation()
			if (type === 'supprimer-compte') {
				this.menu = false
			} else if (type === 'supprimer-dossier') {
				this.dossierId = id
			} else {
				this.padId = id
			}
			this.modaleConfirmation = type
		},
		fermerModaleConfirmation () {
			this.modaleConfirmation = ''
			this.padId = ''
			this.dossierId = ''
		},
		ajouterFavori (pad) {
			this.chargement = true
			axios.post(this.hote + '/api/ajouter-pad-favoris', {
				padId: pad.id,
				identifiant: this.identifiant
			}).then(function (reponse) {
				this.chargement = false
				const donnees = reponse.data
				if (donnees === 'non_connecte') {
					this.$router.push('/')
				} else if (donnees === 'erreur_ajout_favori') {
					this.$store.dispatch('modifierAlerte', this.$t('erreurAjoutFavoris'))
				} else {
					this.padsFavoris.push(pad)
					this.favoris.push(pad.id)
					this.$store.dispatch('modifierMessage', this.$t('padAjouteFavoris'))
				}
			}.bind(this)).catch(function () {
				this.chargement = false
				this.$store.dispatch('modifierAlerte', this.$t('erreurCommunicationServeur'))
			}.bind(this))
		},
		supprimerFavori (padId) {
			this.chargement = true
			axios.post(this.hote + '/api/supprimer-pad-favoris', {
				padId: padId,
				identifiant: this.identifiant
			}).then(function (reponse) {
				this.chargement = false
				const donnees = reponse.data
				if (donnees === 'non_connecte') {
					this.$router.push('/')
				} else if (donnees === 'erreur_suppression_favori') {
					this.$store.dispatch('modifierAlerte', this.$t('erreurSuppressionFavoris'))
				} else {
					this.padsFavoris.forEach(function (pad, indexPad) {
						if (pad.id === padId) {
							this.padsFavoris.splice(indexPad, 1)
						}
					}.bind(this))
					this.favoris.forEach(function (favori, indexFavori) {
						if (favori === padId) {
							this.favoris.splice(indexFavori, 1)
						}
					}.bind(this))
					this.$store.dispatch('modifierMessage', this.$t('padSupprimeFavoris'))
				}
			}.bind(this)).catch(function () {
				this.chargement = false
				this.$store.dispatch('modifierAlerte', this.$t('erreurCommunicationServeur'))
			}.bind(this))
		},
		verifierDossierPad (padId) {
			let padDansDossier = false
			this.dossiers.forEach(function (dossier) {
				if (dossier.pads.includes(padId)) {
					padDansDossier = true
				}
			})
			return padDansDossier
		},
		afficherModaleDeplacerPad (padId) {
			this.padId = padId
			let dossierActuel = { id: 'aucun', nom: '' }
			this.dossiers.forEach(function (dossier) {
				if (dossier.pads.includes(this.padId)) {
					dossierActuel = { id: dossier.id, nom: dossier.nom }
				}
			}.bind(this))
			this.dossierActuel = dossierActuel
			this.modaleDeplacerPad = true
		},
		deplacerPad () {
			const destination = document.querySelector('#champ-dossier-pad').value
			if (destination !== this.dossierActuel.id) {
				this.chargement = true
				this.modaleDeplacerPad = false
				axios.post(this.hote + '/api/deplacer-pad', {
					padId: this.padId,
					destination: destination,
					identifiant: this.identifiant
				}).then(function (reponse) {
					this.chargement = false
					const donnees = reponse.data
					if (donnees === 'non_connecte') {
						this.$router.push('/')
					} else if (donnees === 'erreur_deplacement') {
						this.$store.dispatch('modifierAlerte', this.$t('erreurDeplacementPad'))
					} else {
						this.dossiers.forEach(function (dossier, indexDossier) {
							if (dossier.pads.includes(this.padId)) {
								const indexPad = dossier.pads.indexOf(this.padId)
								this.dossiers[indexDossier].pads.splice(indexPad, 1)
							}
							if (dossier.id === destination) {
								this.dossiers[indexDossier].pads.push(this.padId)
							}
						}.bind(this))
						if (this.onglet === this.dossierActuel.id) {
							this.pads.forEach(function (pad, indexPad) {
								if (pad.id === this.padId) {
									this.pads.splice(indexPad, 1)
								}
							}.bind(this))
						}
						this.$store.dispatch('modifierMessage', this.$t('padDeplace'))
						this.fermerModaleDeplacerPad()
					}
				}.bind(this)).catch(function () {
					this.chargement = false
					this.fermerModaleDeplacerPad()
					this.$store.dispatch('modifierAlerte', this.$t('erreurCommunicationServeur'))
				}.bind(this))
			}
		},
		fermerModaleDeplacerPad () {
			this.modaleDeplacerPad = false
			this.padId = ''
			this.dossierActuel = {}
		},
		dupliquerPad () {
			this.modaleConfirmation = ''
			this.chargement = true
			axios.post(this.hote + '/api/dupliquer-pad', {
				padId: this.padId,
				identifiant: this.identifiant
			}).then(function (reponse) {
				this.chargement = false
				const donnees = reponse.data
				if (donnees === 'non_connecte') {
					this.$router.push('/')
				} else if (donnees === 'erreur_duplication') {
					this.$store.dispatch('modifierAlerte', this.$t('erreurDuplicationPad'))
				} else {
					this.padsCrees.push(donnees)
					this.$store.dispatch('modifierMessage', this.$t('padDuplique'))
					this.padId = ''
					this.onglet = 'pads-crees'
				}
			}.bind(this)).catch(function () {
				this.chargement = false
				this.padId = ''
				this.$store.dispatch('modifierAlerte', this.$t('erreurCommunicationServeur'))
			}.bind(this))
		},
		exporterPad () {
			this.modaleConfirmation = ''
			this.chargement = true
			axios.post(this.hote + '/api/exporter-pad', {
				padId: this.padId,
				identifiant: this.identifiant
			}).then(function (reponse) {
				this.chargement = false
				const donnees = reponse.data
				if (donnees === 'non_connecte') {
					this.$router.push('/')
				} else if (donnees === 'erreur_export') {
					this.$store.dispatch('modifierAlerte', this.$t('erreurExportPad'))
				} else {
					saveAs('/temp/' + donnees, 'pad-' + this.padId + '.zip')
				}
				this.padId = ''
			}.bind(this)).catch(function () {
				this.chargement = false
				this.padId = ''
				this.$store.dispatch('modifierAlerte', this.$t('erreurCommunicationServeur'))
			}.bind(this))
		},
		supprimerPad () {
			this.modaleConfirmation = ''
			this.chargement = true
			const type = this.definirTypePad(this.padId)
			axios.post(this.hote + '/api/supprimer-pad', {
				padId: this.padId,
				type: type,
				identifiant: this.identifiant
			}).then(function (reponse) {
				this.chargement = false
				const donnees = reponse.data
				if (donnees === 'non_connecte') {
					this.$router.push('/')
				} else if (donnees === 'erreur_suppression') {
					this.$store.dispatch('modifierAlerte', this.$t('erreurSuppressionPad'))
				} else {
					this.padsCrees.forEach(function (pad, index) {
						if (pad.id === this.padId) {
							this.padsCrees.splice(index, 1)
						}
					}.bind(this))
					this.padsRejoints.forEach(function (pad, index) {
						if (pad.id === this.padId) {
							this.padsRejoints.splice(index, 1)
						}
					}.bind(this))
					this.padsAdmins.forEach(function (pad, index) {
						if (pad.id === this.padId) {
							this.padsAdmins.splice(index, 1)
						}
					}.bind(this))
					this.padsFavoris.forEach(function (pad, index) {
						if (pad.id === this.padId) {
							this.padsFavoris.splice(index, 1)
						}
					}.bind(this))
					this.favoris.forEach(function (favori, index) {
						if (favori === this.padId) {
							this.favoris.splice(index, 1)
						}
					}.bind(this))
					this.pads.forEach(function (pad, index) {
						if (pad.id === this.padId) {
							this.pads.splice(index, 1)
						}
					}.bind(this))
					this.dossiers.forEach(function (dossier, indexDossier) {
						if (dossier.pads.includes(this.padId)) {
							const indexPad = dossier.pads.indexOf(this.padId)
							this.dossiers[indexDossier].pads.splice(indexPad, 1)
						}
					}.bind(this))
					this.$store.dispatch('modifierMessage', this.$t('padSupprime'))
					this.padId = ''
				}
			}.bind(this)).catch(function () {
				this.chargement = false
				this.padId = ''
				this.$store.dispatch('modifierAlerte', this.$t('erreurCommunicationServeur'))
			}.bind(this))
		},
		definirTypePad (padId) {
			let type = ''
			this.padsRejoints.forEach(function (pad) {
				if (pad.id === padId) {
					type = 'pad-rejoint'
				}
			})
			this.padsAdmins.forEach(function (pad) {
				if (pad.id === padId) {
					type = 'pad-admin'
				}
			})
			return type
		},
		rechercher () {
			let resultats = []
			if (this.requete === '!maj') {
				resultats = this.pads.filter(function (element) {
					return element.notification && element.notification.includes(this.identifiant)
				}.bind(this))
			} else {
				resultats = this.pads.filter(function (element) {
					return element.titre.toLowerCase().includes(this.requete.toLowerCase())
				}.bind(this))
			}
			this.resultats = resultats
		},
		filtrer (filtre) {
			let pads = this.pads
			if (this.requete !== '') {
				pads = this.resultats
			}
			switch (filtre) {
			case 'date-asc':
				pads.sort(function (a, b) {
					const dateA = new Date(a.date).getTime()
					const dateB = new Date(b.date).getTime()
					return dateA > dateB ? 1 : -1
				})
				break
			case 'date-desc':
				pads.sort(function (a, b) {
					const dateA = new Date(a.date).getTime()
					const dateB = new Date(b.date).getTime()
					return dateA < dateB ? 1 : -1
				})
				break
			case 'alpha-asc':
				pads.sort(function (a, b) {
					const a1 = a.titre.toLowerCase()
					const b1 = b.titre.toLowerCase()
					return a1 < b1 ? -1 : a1 > b1 ? 1 : 0
				})
				break
			case 'alpha-desc':
				pads.sort(function (a, b) {
					const a1 = a.titre.toLowerCase()
					const b1 = b.titre.toLowerCase()
					return a1 > b1 ? -1 : a1 < b1 ? 1 : 0
				})
				break
			}
			if (this.requete === '') {
				this.pads = pads
			} else {
				this.resultats = pads
			}
		},
		modifierFiltre (filtre) {
			if (this.filtre !== filtre) {
				this.chargement = true
				axios.post(this.hote + '/api/modifier-filtre', {
					identifiant: this.identifiant,
					filtre: filtre
				}).then(function (reponse) {
					this.chargement = false
					const donnees = reponse.data
					if (donnees === 'non_connecte') {
						this.$router.push('/')
					} else {
						this.filtrer(filtre)
						this.$store.dispatch('modifierFiltre', filtre)
						this.$store.dispatch('modifierMessage', this.$t('filtreModifie'))
					}
				}.bind(this)).catch(function () {
					this.chargement = false
					this.$store.dispatch('modifierAlerte', this.$t('erreurCommunicationServeur'))
				}.bind(this))
			}
		},
		modifierInformations () {
			const nom = document.querySelector('#nom').value.trim()
			const email = document.querySelector('#email').value.trim()
			if ((nom !== '' && nom !== this.nom) || (email !== '' && email !== this.email)) {
				if (email !== '' && this.$verifierEmail(email) === false) {
					this.$store.dispatch('modifierAlerte', this.$t('erreurEmail'))
					return false
				}
				this.menu = false
				this.chargement = true
				axios.post(this.hote + '/api/modifier-informations', {
					identifiant: this.identifiant,
					nom: nom,
					email: email
				}).then(function (reponse) {
					this.chargement = false
					const donnees = reponse.data
					if (donnees === 'non_connecte') {
						this.$router.push('/')
					} else {
						this.$store.dispatch('modifierInformations', { nom: nom, email: email })
						this.$store.dispatch('modifierMessage', this.$t('informationsModifiees'))
					}
				}.bind(this)).catch(function () {
					this.chargement = false
					this.$store.dispatch('modifierAlerte', this.$t('erreurCommunicationServeur'))
				}.bind(this))
			}
		},
		afficherModaleMotDePasse () {
			this.menu = false
			this.modaleMotDePasse = true
		},
		modifierMotDePasse () {
			const motDePasse = this.motDePasse
			const nouveauMotDePasse = this.nouveauMotDePasse.trim()
			const confirmationNouveauMotDePasse = this.confirmationNouveauMotDePasse.trim()
			if (nouveauMotDePasse === confirmationNouveauMotDePasse && nouveauMotDePasse !== '') {
				this.modaleMotDePasse = false
				this.chargement = true
				axios.post(this.hote + '/api/modifier-mot-de-passe', {
					identifiant: this.identifiant,
					motdepasse: motDePasse,
					nouveaumotdepasse: nouveauMotDePasse
				}).then(function (reponse) {
					this.chargement = false
					const donnees = reponse.data
					if (donnees === 'non_connecte') {
						this.$router.push('/')
					} else if (donnees === 'motdepasse_incorrect') {
						this.$store.dispatch('modifierAlerte', this.$t('motDePasseActuelPasCorrect'))
					} else if (donnees === 'erreur') {
						this.$store.dispatch('modifierAlerte', this.$t('erreurCommunicationServeur'))
					} else {
						this.$store.dispatch('modifierMessage', this.$t('motDePasseModifie'))
					}
					this.fermerModaleMotDePasse()
				}.bind(this)).catch(function () {
					this.chargement = false
					this.fermerModaleMotDePasse()
					this.$store.dispatch('modifierAlerte', this.$t('erreurCommunicationServeur'))
				}.bind(this))
			} else if (nouveauMotDePasse !== confirmationNouveauMotDePasse) {
				this.$store.dispatch('modifierAlerte', this.$t('nouveauxMotsDePasseCorrespondentPas'))
			}
		},
		fermerModaleMotDePasse () {
			this.modaleMotDePasse = false
			this.motDePasse = ''
			this.nouveauMotDePasse = ''
			this.confirmationNouveauMotDePasse = ''
		},
		modifierLangue (langue) {
			if (this.langue !== langue) {
				axios.post(this.hote + '/api/modifier-langue', {
					identifiant: this.identifiant,
					langue: langue
				}).then(function (reponse) {
					const donnees = reponse.data
					if (donnees === 'non_connecte') {
						this.$router.push('/')
					} else {
						this.$i18n.setLocale(langue)
						document.getElementsByTagName('html')[0].setAttribute('lang', langue)
						this.$store.dispatch('modifierLangue', langue)
						this.$store.dispatch('modifierMessage', this.$t('langueModifiee'))
					}
				}.bind(this)).catch(function () {
					this.$store.dispatch('modifierAlerte', this.$t('erreurCommunicationServeur'))
				}.bind(this))
			}
		},
		modifierAffichage (affichage) {
			if (this.affichage !== affichage) {
				this.chargement = true
				axios.post(this.hote + '/api/modifier-affichage', {
					identifiant: this.identifiant,
					affichage: affichage
				}).then(function (reponse) {
					this.chargement = false
					const donnees = reponse.data
					if (donnees === 'non_connecte') {
						this.$router.push('/')
					} else {
						this.$store.dispatch('modifierAffichage', affichage)
						this.$store.dispatch('modifierMessage', this.$t('affichageModifie'))
					}
				}.bind(this)).catch(function () {
					this.chargement = false
					this.$store.dispatch('modifierAlerte', this.$t('erreurCommunicationServeur'))
				}.bind(this))
			}
		},
		afficherModaleAjouterDossier () {
			this.modaleAjouterDossier = true
			this.$nextTick(function () {
				document.querySelector('#ajout-dossier input').focus()
			})
		},
		ajouterDossier () {
			if (this.dossier !== '') {
				this.modaleAjouterDossier = false
				this.chargement = true
				axios.post(this.hote + '/api/ajouter-dossier', {
					dossier: this.dossier,
					identifiant: this.identifiant
				}).then(function (reponse) {
					this.chargement = false
					const donnees = reponse.data
					if (donnees === 'non_connecte') {
						this.$router.push('/')
					} else if (donnees === 'erreur_ajout_dossier') {
						this.$store.dispatch('modifierAlerte', this.$t('erreurAjoutDossier'))
					} else {
						this.dossiers.push(donnees)
						this.$store.dispatch('modifierMessage', this.$t('dossierAjoute'))
					}
					this.dossier = ''
				}.bind(this)).catch(function () {
					this.chargement = false
					this.dossier = ''
					this.$store.dispatch('modifierAlerte', this.$t('erreurCommunicationServeur'))
				}.bind(this))
			}
		},
		fermerModaleAjouterDossier () {
			this.modaleAjouterDossier = false
			this.dossier = ''
		},
		afficherModaleModifierDossier (event, id) {
			event.preventDefault()
			event.stopPropagation()
			this.dossiers.forEach(function (dossier) {
				if (dossier.id === id) {
					this.dossier = dossier.nom
				}
			}.bind(this))
			this.dossierId = id
			this.modaleModifierDossier = true
			this.$nextTick(function () {
				document.querySelector('#modification-dossier input').focus()
			})
		},
		modifierDossier () {
			if (this.dossier !== '') {
				this.modaleModifierDossier = false
				this.chargement = true
				axios.post(this.hote + '/api/modifier-dossier', {
					dossier: this.dossier,
					dossierId: this.dossierId,
					identifiant: this.identifiant
				}).then(function (reponse) {
					this.chargement = false
					const donnees = reponse.data
					if (donnees === 'non_connecte') {
						this.$router.push('/')
					} else if (donnees === 'erreur_modification_dossier') {
						this.$store.dispatch('modifierAlerte', this.$t('erreurModificationDossier'))
					} else {
						this.dossiers.forEach(function (dossier, index) {
							if (dossier.id === this.dossierId) {
								this.dossiers[index].nom = this.dossier
							}
						}.bind(this))
						this.$store.dispatch('modifierMessage', this.$t('dossierModifie'))
					}
					this.fermerModaleModifierDossier()
				}.bind(this)).catch(function () {
					this.chargement = false
					this.fermerModaleModifierDossier()
					this.$store.dispatch('modifierAlerte', this.$t('erreurCommunicationServeur'))
				}.bind(this))
			}
		},
		fermerModaleModifierDossier () {
			this.modaleModifierDossier = false
			this.dossier = ''
			this.dossierId = ''
		},
		supprimerDossier () {
			this.modaleConfirmation = ''
			this.chargement = true
			axios.post(this.hote + '/api/supprimer-dossier', {
				dossierId: this.dossierId,
				identifiant: this.identifiant
			}).then(function (reponse) {
				this.chargement = false
				const donnees = reponse.data
				if (donnees === 'non_connecte') {
					this.$router.push('/')
				} else if (donnees === 'erreur_suppression_dossier') {
					this.$store.dispatch('modifierAlerte', this.$t('erreurSuppressionDossier'))
				} else {
					this.dossiers.forEach(function (dossier, index) {
						if (dossier.id === this.dossierId) {
							this.dossiers.splice(index, 1)
						}
					}.bind(this))
					this.onglet = 'pads-crees'
					this.$store.dispatch('modifierMessage', this.$t('dossierSupprime'))
					this.dossierId = ''
				}
			}.bind(this)).catch(function () {
				this.chargement = false
				this.dossierId = ''
				this.$store.dispatch('modifierAlerte', this.$t('erreurCommunicationServeur'))
			}.bind(this))
		},
		supprimerCompte () {
			this.chargement = true
			const identifiant = this.identifiant
			axios.post(this.hote + '/api/supprimer-compte', {
				identifiant: identifiant,
				type: 'utilisateur'
			}).then(function (reponse) {
				this.chargement = false
				const donnees = reponse.data
				if (donnees === 'erreur') {
					this.$store.dispatch('modifierAlerte', this.$t('erreurCommunicationServeur'))
				} else {
					this.$socket.emit('deconnexion', identifiant)
					this.$store.dispatch('reinitialiser')
					this.$router.push('/')
				}
			}.bind(this)).catch(function () {
				this.chargement = false
				this.$store.dispatch('modifierAlerte', this.$t('erreurCommunicationServeur'))
			}.bind(this))
		},
		deconnexion () {
			const identifiant = this.identifiant
			axios.post(this.hote + '/api/deconnexion').then(function () {
				this.$socket.emit('deconnexion', identifiant)
				this.$store.dispatch('reinitialiser')
				this.$router.push('/')
			}.bind(this)).catch(function () {
				this.$store.dispatch('modifierAlerte', this.$t('erreurCommunicationServeur'))
			}.bind(this))
		}
	}
}
</script>

<style scoped>
#page {
	width: 100%;
	height: 100%;
}

#boutons {
	display: flex;
	justify-content: center;
	flex-wrap: wrap;
	margin-bottom: 1.5rem;
}

#bouton-importer,
#bouton-creer {
	display: inline-flex;
	justify-content: center;
	align-items: center;
	width: 220px;
    line-height: 1;
    font-size: 1.6rem;
    font-weight: 700;
    text-transform: uppercase;
	padding: 1em 1.5em;
    border: 2px solid #00ced1;
	border-radius: 2em;
	margin-bottom: 1.5rem;
	background: #46fbff;
	cursor: pointer;
    transition: all 0.1s ease-in;
	text-align: center;
}

#bouton-importer.desactive,
#bouton-creer.desactive {
	border: 2px solid #777;
	background: #aaa;
	cursor: default;
}

#bouton-creer {
	margin-right: 1.5rem;
}

#bouton-importer:not(.desactive):hover,
#bouton-creer:not(.desactive):hover {
	text-shadow: 1px 1px 1px rgba(0, 0, 0, 0.2);
	background: #fff;
}

#identifiant {
	background: #e9e9e9;
}

#deconnexion {
	color: #ff6259;
	margin-bottom: 3rem;
}

.menu .bouton-rouge,
.menu .bouton-bleu {
	margin-top: 3rem;
}

.menu .bouton-rouge {
	margin-bottom: 3rem;
}

#onglets {
	position: absolute;
    top: 4rem;
	left: 4rem;
    height: calc(100% - 4rem);
	width: 30rem;
	padding: 3rem 1.5rem;
	border-right: 1px solid #ddd;
	overflow: auto;
	-webkit-overflow-scrolling: touch;
}

#onglets .onglet {
	position: relative;
	display: block;
	text-align: left;
	padding-bottom: 0.5rem;
	margin-bottom: 2rem;
	font-size: 1.8rem;
	border-bottom: 3px solid transparent;
	cursor: pointer;
}

#onglets .onglet.actif {
	font-weight: 700;
	border-bottom: 3px solid #00ced1;
}

#onglets .bouton-ajouter {
	display: inline-block;
	font-weight: 700;
	font-size: 12px;
	text-transform: uppercase;
	height: 32px;
	line-height: 32px;
	padding: 0 20px;
	cursor: pointer;
	color: #001d1d;
	text-shadow: 1px 1px 1px rgba(0, 0, 0, 0.1);
	background: #00ced1;
	border-radius: 5px;
	letter-spacing: 1px;
	text-indent: 1px;
	text-align: center;
	transition: all 0.1s ease-in;
	white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    width: 100%;
	margin-bottom: 3rem;
}

#onglets .bouton-ajouter:hover {
	color: #fff;
	background: #001d1d;
}

#onglets .onglet .menu-dossier {
	visibility: hidden;
	position: absolute;
	color: #fff;
	top: 0;
	right: 0;
	line-height: 1;
	font-size: 24px;
	padding: 3px 1rem;
	background: rgba(0, 0, 0, 0.25);
	border-radius: 4px;
	opacity: 0;
	transition: opacity 0.25s ease-in-out;
}

#onglets .onglet:hover .menu-dossier {
	visibility: visible;
	opacity: 1;
}

#onglets .onglet .menu-dossier span.supprimer {
	color: #ff6259;
	cursor: pointer;
}

#onglets .onglet .menu-dossier span + span {
	margin-left: 0.7rem;
}

#onglets .onglet > span {
	vertical-align: middle;
}

#onglets .onglet .badge {
	display: inline-block;
	width: 2rem;
	height: 2rem;
	background: #e32f6c;
	border-radius: 50%;
	font-size: 1.2rem;
	color: #fff;
	line-height: 2rem;
	text-align: center;
	vertical-align: middle;
}

#pads {
	position: absolute;
    top: 4rem;
	left: 34rem;
	padding: 3rem 1.5rem;
	height: calc(100% - 4rem);
	width: calc(100% - 34rem);
	overflow: auto;
	-webkit-overflow-scrolling: touch;
}

#pads.liste {
	padding: 3rem 1.5rem;
}

#pads.mosaique {
	padding: 3rem 0.75rem;
}

.vide {
	text-align: center;
	font-size: 1.7rem;
    padding: 2.5rem 0;
    border-top: 1px dotted #ddd;
    border-bottom: 1px dotted #ddd;
    margin: 0 0 3rem;
}

#filtrer {
	display: flex;
	justify-content: flex-end;
	align-items: center;
	margin-bottom: 3rem;
	width: 100%;
	font-size: 0;
}

.mosaique #actions-dossier,
.mosaique #filtrer {
	padding: 0 0.75rem;
}

#filtrer .rechercher,
#filtrer .filtrer {
	display: flex;
	align-items: center;
	width: calc(50% - (24px + 2.5rem));
}

#filtrer .filtrer,
#filtrer .rechercher {
	margin-right: 2rem;
}

#filtrer .afficher span,
#filtrer .filtrer span,
#filtrer .rechercher span {
	font-size: 24px;
	margin-right: 1rem;
}

#filtrer .filtrer select,
#filtrer .rechercher input {
	width: calc(100% - (24px + 1rem));
}

#filtrer select,
#filtrer input[type="search"] {
	font-size: 16px;
	border: 1px solid #ddd;
	border-radius: 4px;
	padding: 1rem 1.5rem;
	text-align: left;
}

#filtrer select {
	background: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" height="14" viewBox="0 0 29 14" width="29"><path fill="%23000000" d="M9.37727 3.625l5.08154 6.93523L19.54036 3.625" /></svg>') center right no-repeat;
	padding-right: 3rem;
}

#filtrer .afficher span {
	cursor: pointer;
}

#filtrer .afficher span:last-child {
	margin-right: 0;
}

#actions-dossier {
	display: flex;
	justify-content: flex-end;
	align-items: center;
	font-size: 16px;
	margin-bottom: 3rem;
}

#actions-dossier .conteneur {
	display: flex;
	justify-content: flex-start;
	align-items: center;
	padding: 3px 1rem;
	background: rgba(0, 0, 0, 0.25);
	border-radius: 4px;
}

#actions-dossier span {
	color: #fff;
	font-size: 24px;
	margin-left: 1.5rem;
	cursor: pointer;
}

#actions-dossier span.supprimer {
	color: #ff6259;
	cursor: pointer;
}

.pads {
	margin-bottom: 3rem;
}

.mosaique .pads {
	display: flex;
	flex-wrap: wrap;
}

.pad.liste {
	border-top: 1px solid #ddd;
	padding: 2rem 0;
	display: flex;
	align-items: center;
}

.pad.liste:last-child {
	border-bottom: 1px solid #ddd;
}

.pad.liste .fond {
	width: 5rem;
	height: 5rem;
	line-height: 5rem;
	border-radius: 50%;
	background-size: cover;
	background-position: center;
	background-repeat: no-repeat;
	margin-right: 2rem;
}

.pad.liste .meta {
	width: calc(100% - (96px + 13.5rem));
}

.pad.liste .meta.pad-rejoint {
	width: calc(100% - (48px + 10.5rem));
}

.pad.liste .meta.deplacer {
	width: calc(100% - (120px + 15rem));
}

.pad.liste .meta.pad-rejoint.deplacer {
	width: calc(100% - (72px + 12rem));
}

.pad.liste .titre {
	font-size: 1.8rem;
	font-weight: 700;
}

.pad.liste .vues,
.pad.liste .auteur,
.pad.liste .date {
	font-size: 1.2rem;
	color: #777;
}

.pad.liste .actions {
	display: flex;
	margin-left: 0.5rem;
}

.pad.liste .actions span {
	margin-left: 1.5rem;
	font-size: 24px;
	color: #001d1d;
	cursor: pointer;
}

.pad.mosaique .actions span.supprimer-favori,
.pad.liste .actions span.supprimer-favori {
	color: #fdcc33;
}

.pad.mosaique .actions span.deplacer.actif,
.pad.liste .actions span.deplacer.actif {
	color: #e32f6c;
}

.conteneur-pads {
	display: flex;
	flex-wrap: wrap;
	padding: 0 0.75rem;
}

.pad.mosaique {
    padding: 0 0 4rem;
	width: calc(50% - 1.5rem);
	height: 20rem;
    border: 2px solid #001d1d;
    margin: 0 0.75rem 1.5rem;
	position: relative;
	border-radius: 1rem;
}

.pad.mosaique .conteneur {
	display: flex;
	justify-content: center;
	align-items: center;
	padding: 0;
	width: 100%;
	height: 100%;
	cursor: pointer;
	border-top-left-radius: 1rem;
	border-top-right-radius: 1rem;
}

.pad.mosaique .conteneur.fond-personnalise {
	background-size: cover;
	background-repeat: no-repeat;
	background-position: center;
}

.pad.mosaique .meta {
	width: 100%;
	padding: 1.5rem;
    background: rgba(0, 0, 0, 0.7);
	text-align: center;
}

.pad.mosaique .titre {
	display: block;
	color: #fff;
	text-shadow: 1px 1px 1px rgba(0, 0, 0, 0.3);
    font-size: 2rem;
	line-height: 1.4;
	font-weight: 700;
}

.pad.mosaique .vues,
.pad.mosaique .auteur,
.pad.mosaique .date {
    margin-top: 0.5rem;
    color: #ddd;
    font-size: 1.2rem;
    display: inline-block;
}

.pad.mosaique .actions {
	position: absolute;
	display: flex;
	justify-content: space-evenly;
	align-items: center;
	height: 4rem;
	left: 0;
	right: 0;
	bottom: 0;
	width: 100%;
    font-size: 24px;
	border-top: 1px dashed #ddd;
	line-height: 1;
}

.pad.mosaique .actions span {
	color: #001d1d;
	cursor: pointer;
	text-align: center;
	display: inline-block;
}

.pad.liste .actions .supprimer,
.pad.mosaique .actions .supprimer {
	color: #ff6259;
}

.pad.liste .actions .admin,
.pad.mosaique .actions .admin {
	color: #00ced1;
}

.pad .mise-a-jour {
	width: 1rem;
	height: 1rem;
	display: inline-block;
	border-radius: 50%;
	background: #e32f6c;
}

.pad.mosaique .mise-a-jour {
	margin-right: 5px;
}

#import label:not(.bouton-interrupteur) {
	width: 100%;
	text-align: center;
	margin-top: 10px;
}

.progression .chargement {
	border-top: 0.7rem solid #00ced1;
	margin-top: 1rem;
}

.modale .conteneur-interrupteur {
	display: flex;
	justify-content: space-between;
	margin-bottom: 1rem;
	line-height: 2.2rem;
}

.modale .conteneur-interrupteur > span {
	font-size: 16px;
}

.modale .bouton-interrupteur {
	position: relative;
	display: inline-block!important;
	width: 3.8rem!important;
	height: 2.2rem;
	margin: 0;
}

.modale .bouton-interrupteur input {
	opacity: 0;
	width: 0;
	height: 0;
}

.modale .bouton-interrupteur .barre {
	position: absolute;
	cursor: pointer;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	background-color: #ccc;
	transition: 0.2s;
	border-radius: 3rem;
}

.modale .bouton-interrupteur .barre:before {
	position: absolute;
	content: '';
	height: 1.6rem;
	width: 1.6rem;
	left: 0.3rem;
	bottom: 0.3rem;
	background-color: #fff;
	transition: 0.2s;
	border-radius: 50%;
}

.modale .bouton-interrupteur input:checked + .barre {
	background-color: #00ced1;
}

.modale .bouton-interrupteur input:focus + .barre {
	box-shadow: 0 0 1px #00ced1;
}

.modale .bouton-interrupteur input:checked + .barre:before {
	transform: translateX(1.6rem);
}

@media screen and (max-width: 479px) {
	#filtrer {
		flex-wrap: wrap;
	}

	#filtrer .rechercher {
		width: 100%;
		margin-right: 0;
		margin-bottom: 1.5rem;
	}

	#filtrer .filtrer {
		width: 100%;
		margin-right: 0;
		margin-bottom: 1.5rem;
	}

	#filtrer .afficher {
		line-height: 1;
	}
}

@media screen and (orientation: landscape) and (max-height: 479px) {
	#motdepasse {
		height: 90%;
	}
}

@media screen and (max-width: 479px) {
	#bouton-creer {
		margin-right: 0;
	}
}

@media screen and (max-width: 575px) {
	#onglets .onglet {
		font-size: 16px;
	}

	#pads .vide {
		font-size: 16px;
	}

	.pad.liste .titre {
		font-size: 16px;
	}

	.pad.mosaique .titre {
		font-size: 1.7rem;
	}
}

@media screen and (max-width: 599px) {
	.pad.liste {
		flex-wrap: wrap;
		padding: 2rem 0 1rem;
	}

	.pad.liste .fond {
		width: 35px;
		height: 35px;
		line-height: 35px;
		margin-right: 15px;
	}

	.pad.liste .meta {
		width: calc(100% - 50px)!important;
	}

	.pad.liste .actions {
		width: 100%;
		justify-content: space-around;
		margin-left: 0;
		margin-top: 2rem;
		padding-top: 1rem;
		border-top: 1px dotted #ddd;
	}

	.pad.liste .actions span {
		margin-left: 0;
	}
}

@media screen and (max-width: 1023px) {
	#onglets {
		position: absolute;
		top: 4rem;
		left: 4rem;
		height: 5rem;
		width: calc(100% - 4rem);
		display: flex;
		align-items: center;
		padding: 0 1.5rem;
		border-bottom: 1px solid #ddd;
	}

	#onglets .onglet {
		text-align: left;
		padding-bottom: 0;
		margin-right: 2rem;
		margin-bottom: 0;
		border-bottom: 3px solid transparent;
		flex: 0 0 auto;
	}

	#onglets .onglet:hover .menu-dossier,
	#onglets .onglet .menu-dossier {
		display: none;
	}

	#onglets .bouton-ajouter {
		min-width: 200px;
		max-width: 250px;
		margin-bottom: 0!important;
	}

	#pads {
		position: absolute;
		top: 9rem;
		left: 4rem;
		padding: 3rem 1.5rem;
		height: calc(100% - 9rem);
		width: calc(100% - 4rem);
	}
}

@media screen and (min-width: 1024px) and (max-width: 1439px) {
	#onglets {
		width: 23rem;
	}

	#pads {
		left: 27rem;
		width: calc(100% - 27rem);
	}
}

@media screen and (max-width: 767px) {
	.pad.mosaique {
		width: calc(100% - 1.5rem);
	}
}

@media screen and (min-width: 768px) and (max-width: 1439px) {
	.pad.mosaique {
		width: calc(50% - 1.5rem);
	}
}

@media screen and (min-width: 1440px) {
	.pad.mosaique {
		width: calc(33.333333333% - 1.5rem);
	}
}
</style>

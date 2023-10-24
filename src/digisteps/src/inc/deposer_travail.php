<?php

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Max-Age: 1000');
header('Access-Control-Allow-Headers: Content-Type, X-Requested-With');

$_POST = json_decode(file_get_contents('php://input'), true);

if (!empty($_POST['parcours']) && !empty($_POST['id']) && !empty($_POST['motdepasse'])) {
	require 'db.php';
	$parcours = $_POST['parcours'];
	$stmt = $db->prepare('SELECT donnees FROM digisteps_parcours WHERE url = :url');
	if ($stmt->execute(array('url' => $parcours))) {
		$resultat = $stmt->fetchAll();
		$donnees = $resultat[0]['donnees'];
		$donnees = json_decode(json_decode($donnees));
		$id = $_POST['id'];
		$mode = $_POST['mode'];
		$motdepasse = $_POST['motdepasse'];
		$pseudo = $_POST['pseudo'];
		$lien = $_POST['lien'];
		$fichier = $_POST['fichier'];
		$date = $_POST['date'];
		foreach ($donnees->blocs as $bloc) {
			if ($bloc->id === $id) {
				if ($mode === 'deposer') {
					array_push($bloc->travaux, (object)[
						'motdepasse' => $motdepasse,
						'pseudo' => $pseudo,
						'lien' => $lien,
						'fichier' => $fichier,
						'retroaction' => '',
						'date' => $date
					]);
				} else if ($mode === 'afficher') {
					foreach ($bloc->travaux as $travail) {
						if (intval($travail->motdepasse) === intval($motdepasse)) {
							$travail->pseudo = $pseudo;
							$travail->lien = $lien;
							$travail->fichier = $fichier;
							$travail->date = $date;
						}
					}
				}
			}
		}
		$stmt = $db->prepare('UPDATE digisteps_parcours SET donnees = :donnees WHERE url = :url');
		if ($stmt->execute(array('donnees' => json_encode(json_encode($donnees)), 'url' => $parcours))) {
			if (!empty($_POST['fichierasupprimer']) && $_POST['fichierasupprimer'] !== '') {
				if (file_exists('../fichiers/' . $parcours . '/' . $_POST['fichierasupprimer'])) {
					unlink('../fichiers/' . $parcours . '/' . $_POST['fichierasupprimer']);
				}
			}
			echo 'travail_depose';
		} else {
			echo 'erreur';
		}
	} else {
		echo 'erreur';
	}
	$db = null;
	exit();
} else {
	header('Location: /');
}

?>

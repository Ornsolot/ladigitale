<?php

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Max-Age: 1000');
header('Access-Control-Allow-Headers: Content-Type, X-Requested-With');

$_POST = json_decode(file_get_contents('php://input'), true);

session_start();

if (!empty($_POST['parcours']) && !empty($_POST['donnees'])) {
	require 'db.php';
	$reponse = '';
	$parcours = $_POST['parcours'];
	if (isset($_SESSION['digisteps'][$parcours]['reponse'])) {
		$reponse = $_SESSION['digisteps'][$parcours]['reponse'];
	}
	$stmt = $db->prepare('SELECT reponse FROM digisteps_parcours WHERE url = :url');
	if ($stmt->execute(array('url' => $parcours))) {
		$resultat = $stmt->fetchAll();
		if ($resultat[0]['reponse'] === $reponse) {
			$donnees = $_POST['donnees'];
			$stmt = $db->prepare('UPDATE digisteps_parcours SET donnees = :donnees WHERE url = :url');
			if ($stmt->execute(array('donnees' => json_encode($donnees), 'url' => $parcours))) {
				if (!empty($_POST['fichiers'])) {
					$fichiers = json_decode($_POST['fichiers'], true);
					foreach ($fichiers as $fichier) {
						if (file_exists('../fichiers/' . $parcours . '/' . $fichier)) {
							unlink('../fichiers/' . $parcours . '/' . $fichier);
						}
						if (file_exists('../fichiers/' . $parcours . '/vignette_' . $fichier)) {
							unlink('../fichiers/' . $parcours . '/vignette_' . $fichier);
						}
					}
				}
				echo 'parcours_modifie';
			} else {
				echo 'erreur';
			}
		} else {
			echo 'non_autorise';
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

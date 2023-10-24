<?php

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Max-Age: 1000');
header('Access-Control-Allow-Headers: Content-Type, X-Requested-With');

session_start();

if (!empty($_POST['serie']) && !empty($_POST['nouveaunom'])) {
	require 'db.php';
	$reponse = '';
	$serie = $_POST['serie'];
	if (isset($_SESSION['digiflashcards'][$serie]['reponse'])) {
		$reponse = $_SESSION['digiflashcards'][$serie]['reponse'];
	}
	$stmt = $db->prepare('SELECT reponse FROM digiflashcards_series WHERE url = :url');
	if ($stmt->execute(array('url' => $serie))) {
		$resultat = $stmt->fetchAll();
		if ($resultat[0]['reponse'] === $reponse) {
			$nouveaunom = $_POST['nouveaunom'];
			$stmt = $db->prepare('UPDATE digiflashcards_series SET nom = :nouveaunom WHERE url = :url');
			if ($stmt->execute(array('nouveaunom' => $nouveaunom, 'url' => $serie))) {
				echo 'nom_modifie';
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

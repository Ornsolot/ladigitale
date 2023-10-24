<?php

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Max-Age: 1000');
header('Access-Control-Allow-Headers: Content-Type, X-Requested-With');

session_start();

if (!empty($_POST['nuage'])) {
	require 'db.php';
	$reponse = '';
	$nuage = $_POST['nuage'];
	if (isset($_SESSION['digiwords'][$nuage]['reponse'])) {
		$reponse = $_SESSION['digiwords'][$nuage]['reponse'];
	}
	$stmt = $db->prepare('SELECT reponse FROM digiwords_nuages WHERE url = :url');
	if ($stmt->execute(array('url' => $nuage))) {
		$resultat = $stmt->fetchAll();
		if ($resultat[0]['reponse'] === $reponse) {
			$stmt = $db->prepare('DELETE FROM digiwords_nuages WHERE url = :url');
			if ($stmt->execute(array('url' => $nuage))) {
				echo 'nuage_supprime';
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

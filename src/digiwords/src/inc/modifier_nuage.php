<?php

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Max-Age: 1000');
header('Access-Control-Allow-Headers: Content-Type, X-Requested-With');

$_POST = json_decode(file_get_contents('php://input'), true);

session_start();

if (!empty($_POST['nuage']) && !empty($_POST['donnees'])) {
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
			$donnees = $_POST['donnees'];
			$stmt = $db->prepare('UPDATE digiwords_nuages SET donnees = :donnees WHERE url = :url');
			if ($stmt->execute(array('donnees' => json_encode($donnees), 'url' => $nuage))) {
				echo 'nuage_modifie';
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

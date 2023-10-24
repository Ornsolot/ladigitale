<?php

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Max-Age: 1000');
header('Access-Control-Allow-Headers: Content-Type, X-Requested-With');

session_start();

if (!empty($_POST['carte'])) {
	require 'db.php';
	$reponse = '';
	$carte = $_POST['carte'];
	if (isset($_SESSION['digimindmap'][$carte]['reponse'])) {
		$reponse = $_SESSION['digimindmap'][$carte]['reponse'];
	}
	$stmt = $db->prepare('SELECT reponse FROM digimindmap_cartes WHERE url = :url');
	if ($stmt->execute(array('url' => $carte))) {
		$resultat = $stmt->fetchAll();
		if ($resultat[0]['reponse'] === $reponse) {
			$stmt = $db->prepare('DELETE FROM digimindmap_cartes WHERE url = :url');
			if ($stmt->execute(array('url' => $carte))) {
				echo 'carte_supprimee';
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

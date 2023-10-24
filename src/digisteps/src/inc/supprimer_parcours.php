<?php

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Max-Age: 1000');
header('Access-Control-Allow-Headers: Content-Type, X-Requested-With');

session_start();

if (!empty($_POST['parcours'])) {
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
			$stmt = $db->prepare('DELETE FROM digisteps_parcours WHERE url = :url');
			if ($stmt->execute(array('url' => $parcours))) {
				if (file_exists('../fichiers/' . $parcours)) {
					supprimer('../fichiers/' . $parcours);
				}
				echo 'parcours_supprime';
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

function supprimer($path) {
	if (is_dir($path) === true) {
		$files = array_diff(scandir($path), array('.', '..'));
		foreach ($files as $file) {
			supprimer(realpath($path) . '/' . $file);
		}
		return rmdir($path);
	} else if (is_file($path) === true) {
		return unlink($path);
	}
	return false;
}

?>

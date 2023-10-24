<?php

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Max-Age: 1000');
header('Access-Control-Allow-Headers: Content-Type, X-Requested-With');

session_start();

if (!empty($_POST['id'])) {
	require 'db.php';
	$reponse = '';
	$id = $_POST['id'];
	if (isset($_SESSION['digiflashcards'][$id]['reponse'])) {
		$reponse = $_SESSION['digiflashcards'][$id]['reponse'];
	}
	$stmt = $db->prepare('SELECT * FROM digiflashcards_series WHERE url = :url');
	if ($stmt->execute(array('url' => $id))) {
		$serie = $stmt->fetchAll();
		$admin = false;
		if (count($serie, COUNT_NORMAL) > 0 && $serie[0]['reponse'] === $reponse) {
			$admin = true;
		}
		$donnees = $serie[0]['donnees'];
		if ($donnees !== '') {
			$donnees = json_decode($donnees);
		}
		echo json_encode(array('nom' => $serie[0]['nom'], 'donnees' => $donnees, 'admin' =>  $admin));
	} else {
		echo 'erreur';
	}
	$db = null;
	exit();
} else {
	header('Location: /');
}

?>

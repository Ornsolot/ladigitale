<?php

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Max-Age: 1000');
header('Access-Control-Allow-Headers: Content-Type, X-Requested-With');

session_start();

if (!empty($_POST['nom']) && !empty($_POST['question']) && !empty($_POST['reponse'])) {
	require 'db.php';
	$serie = uniqid('', false);
	$nom = $_POST['nom'];
	$question = $_POST['question'];
	$reponse = password_hash(strtolower($_POST['reponse']), PASSWORD_DEFAULT);
	$donnees = '';
	$date = date('Y-m-d H:i:s');
	$stmt = $db->prepare('INSERT INTO digiflashcards_series (url, nom, question, reponse, donnees, date) VALUES (:url, :nom, :question, :reponse, :donnees, :date)');
	if ($stmt->execute(array('url' => $serie, 'nom' => $nom, 'question' => $question, 'reponse' => $reponse, 'donnees' => $donnees, 'date' => $date))) {
		$_SESSION['digiflashcards'][$serie]['reponse'] = $reponse;
		echo $serie;
	} else {
		echo 'erreur';
	}
	$db = null;
	exit();
} else {
	header('Location: /');
}

?>

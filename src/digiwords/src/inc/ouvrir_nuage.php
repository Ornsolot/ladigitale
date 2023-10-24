<?php

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Max-Age: 1000');
header('Access-Control-Allow-Headers: Content-Type, X-Requested-With');

session_start();

if (!empty($_POST['nuage']) && !empty($_POST['question']) && !empty($_POST['reponse'])) {
	require 'db.php';
	$nuage = $_POST['nuage'];
	$question = $_POST['question'];
	$reponse = strtolower($_POST['reponse']);
	$stmt = $db->prepare('SELECT question, reponse FROM digiwords_nuages WHERE url = :url');
	if ($stmt->execute(array('url' => $nuage))) {
		$resultat = $stmt->fetchAll();
		$questionSecrete = '';
		switch ($resultat[0]['question']) {
			case 'Quel est mon mot préféré ?':
				$questionSecrete = 'motPrefere';
				break;
			case 'Quel est mon film préféré ?':
				$questionSecrete = 'filmPrefere';
				break;
			case 'Quelle est ma chanson préférée ?':
				$questionSecrete = 'chansonPreferee';
				break;
			case 'Quel est le prénom de ma mère ?':
				$questionSecrete = 'prenomMere';
				break;
			case 'Quel est le prénom de mon père ?':
				$questionSecrete = 'prenomPere';
				break;
			case 'Quel est le nom de ma rue ?':
				$questionSecrete = 'nomRue';
				break;
			case 'Quel est le nom de mon employeur ?':
				$questionSecrete = 'nomEmployeur';
				break;
			case 'Quel est le nom de mon animal de compagnie ?':
				$questionSecrete = 'nomAnimal';
				break;
			default:
				$questionSecrete = $resultat[0]['question'];
		}
		$reponseSecrete = $resultat[0]['reponse'];
		if ($question === $questionSecrete && password_verify($reponse, $reponseSecrete)) {
			$_SESSION['digiwords'][$nuage]['reponse'] = $reponseSecrete;
			echo 'nuage_debloque';
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

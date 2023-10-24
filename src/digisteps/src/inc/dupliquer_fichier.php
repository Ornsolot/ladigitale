<?php

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Max-Age: 1000');
header('Access-Control-Allow-Headers: Content-Type, X-Requested-With');

$_POST = json_decode(file_get_contents('php://input'), true);

if (!empty($_POST['parcours'])) {
    $parcours = $_POST['parcours'];
	$fichier = $_POST['fichier'];
	if (file_exists('../fichiers/' . $parcours . '/' . $fichier)) {
        $nom = rand() . $fichier;
		copy('../fichiers/' . $parcours . '/' . $fichier, '../fichiers/' . $parcours . '/' . $nom);
        if (file_exists('../fichiers/' . $parcours . '/vignette_' . $fichier)) {
            copy('../fichiers/' . $parcours . '/vignette_' . $fichier, '../fichiers/' . $parcours . '/vignette_' . $nom);
        }
        echo $nom;
    } else {
		echo 'erreur';
	}
	exit();
} else {
	header('Location: /');
}

?>

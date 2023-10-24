<?php

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Max-Age: 1000');
header('Access-Control-Allow-Headers: Content-Type, X-Requested-With');

if (!empty($_FILES['blob']) && !empty($_POST['parcours'])) {
	$ancienfond = $_POST['ancienfond'];
	$parcours = $_POST['parcours'];
	$extension = pathinfo($_FILES['blob']['name'], PATHINFO_EXTENSION);
	if (!file_exists('../fichiers/' . $parcours)) {
		mkdir('../fichiers/' . $parcours, 0775, true);
	}
	$nom = hash('md5', $_FILES['blob']['tmp_name']) . time() . '.' . $extension;
	$chemin = '../fichiers/' . $parcours . '/' . $nom;
	if (move_uploaded_file($_FILES['blob']['tmp_name'], $chemin)) {
		if ($ancienfond !== '') {
			if (file_exists('../fichiers/' . $parcours . '/' . $ancienfond)) {
				unlink('../fichiers/' . $parcours . '/' . $ancienfond);
			}
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

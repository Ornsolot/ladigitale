<?php

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Max-Age: 1000');
header('Access-Control-Allow-Headers: Content-Type, X-Requested-With');

if (!empty($_FILES['blob']) && !empty($_POST['serie'])) {
	$ancienfichier = $_POST['ancienfichier'];
	$serie = $_POST['serie'];
	$extension = pathinfo($_FILES['blob']['name'], PATHINFO_EXTENSION);
	if (!file_exists('../fichiers/' . $serie)) {
		mkdir('../fichiers/' . $serie, 0775, true);
	}
	$nom = hash('md5', $_FILES['blob']['tmp_name']) . time() . '.' . $extension;
	$chemin = '../fichiers/' . $serie . '/' . $nom;
	if (move_uploaded_file($_FILES['blob']['tmp_name'], $chemin)) {
		if ($ancienfichier !== '') {
			if (file_exists('../fichiers/' . $serie . '/' . $ancienfichier)) {
				unlink('../fichiers/' . $serie . '/' . $ancienfichier);
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

<?php

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Max-Age: 1000');
header('Access-Control-Allow-Headers: Content-Type, X-Requested-With');

if (!empty($_POST['serie'])) {
	$serie = $_POST['serie'];
	if (file_exists('../fichiers/' . $serie)) {
		$fichiers = glob('../fichiers/' . $serie . '/' . '*.*');
		foreach ($fichiers as $f) {
			unlink($f);
		}
	}
	echo 'dossier_vide';
	exit();
} else {
	header('Location: /');
}

?>

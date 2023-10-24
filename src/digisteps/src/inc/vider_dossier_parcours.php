<?php

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Max-Age: 1000');
header('Access-Control-Allow-Headers: Content-Type, X-Requested-With');

if (!empty($_POST['parcours'])) {
	$parcours = $_POST['parcours'];
	if (file_exists('../fichiers/' . $parcours)) {
		$fichiers = glob('../fichiers/' . $parcours . '/' . '*.*');
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

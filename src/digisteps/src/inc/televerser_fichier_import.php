<?php

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Max-Age: 1000');
header('Access-Control-Allow-Headers: Content-Type, X-Requested-With');

if (!empty($_FILES['blob']) && !empty($_POST['parcours'])) {
	$index = $_POST['index'];
	$parametre = $_POST['parametre'];
	$fichier = $_POST['fichier'];
	$parcours = $_POST['parcours'];
	$extension = pathinfo($fichier, PATHINFO_EXTENSION);
	if (file_exists('../fichiers/' . $parcours) && intval($index) === 1 && $parametre === 'remplacer') {
		$fichiers = glob('../fichiers/' . $parcours . '/' . '*.*');
		foreach ($fichiers as $f) {
			unlink($f);
		}
	}
	if (!file_exists('../fichiers/' . $parcours)) {
		mkdir('../fichiers/' . $parcours, 0775, true);
	}
	$chemin = '../fichiers/' . $parcours . '/' . $fichier;
	if (move_uploaded_file($_FILES['blob']['tmp_name'], $chemin)) {
		if (in_array($extension, array('jpg', 'jpeg', 'png', 'gif'))) {
			$cheminvignette = '../fichiers/' . $parcours . '/vignette_' . $fichier;
			creer_vignette($chemin, $cheminvignette, 250);
		}
		echo 'fichier_importe';
	} else {
		echo 'erreur';
	}
	exit();
} else {
	header('Location: /');
}

function creer_vignette ($src, $dest, $h) {
    $fparts = pathinfo($src);
    $ext = strtolower($fparts['extension']);
    if ($ext == 'gif') {
        $resource = imagecreatefromgif($src);
	} else if ($ext === 'png') {
        $resource = imagecreatefrompng($src);
	} else if ($ext === 'jpg' || $ext === 'jpeg') {
        $resource = imagecreatefromjpeg($src);
	}
    $width  = imagesx($resource);
    $height = imagesy($resource);
    $w  = floor($width * ($h / $height));
    $img = imagecreatetruecolor($w, $h);
	if ($ext === 'png') {
		imagealphablending($img, false);
		imagesavealpha($img, true);
	}
    imagecopyresampled($img, $resource, 0, 0, 0, 0, $w, $h, $width, $height);
    $fparts = pathinfo($dest);
    $ext = strtolower($fparts['extension']);
    if (!in_array($ext, array('jpg', 'jpeg', 'png', 'gif'))) {
		$ext = 'jpg';
	}
    $dest = $fparts['dirname'] . '/' . $fparts['filename'] . '.' . $ext;
    if ($ext == 'gif') {
        imagegif($img, $dest);
	} else if ($ext === 'png') {
        imagepng($img, $dest, 1);
	} else if ($ext === 'jpg' || $ext === 'jpeg') {
        imagejpeg($img, $dest, 85);
	}
}

?>

<?php

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Max-Age: 1000');
header('Access-Control-Allow-Headers: Content-Type, X-Requested-With');

session_start();

if (!empty($_POST['parcours'])) {
	$parcours = $_POST['parcours'];
	unset($_SESSION['digisteps'][$parcours]['reponse']);
	echo 'session_terminee';
	exit();
} else {
	header('Location: /');
}

?>

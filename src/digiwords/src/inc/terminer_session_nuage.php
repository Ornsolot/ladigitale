<?php

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Max-Age: 1000');
header('Access-Control-Allow-Headers: Content-Type, X-Requested-With');

session_start();

if (!empty($_POST['nuage'])) {
	$nuage = $_POST['nuage'];
	unset($_SESSION['digiwords'][$nuage]['reponse']);
	echo 'session_terminee';
	exit();
} else {
	header('Location: /');
}

?>

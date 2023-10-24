<?php

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Max-Age: 1000');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');

if (!empty($_POST['dgs'])) {
	echo recuperer_donnees($_POST['dgs']);
} else {
	echo '';
}

function recuperer_donnees ($url) {
    $url = strtolower($url);
	$donnees = charger($url);
    return $donnees;
}

function charger ($url) {
    if (function_exists('curl_version')) {
        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $url);
		curl_setopt($ch, CURLOPT_USERAGENT, 'Mozilla/5.0');
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 10);
		curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
		curl_setopt($ch, CURLOPT_CUSTOMREQUEST, 'GET'); 
        $content = curl_exec($ch);
        curl_close($ch);
        unset($ch);
    } else {
        $context = array ('http' => array ('user_agent' => 'Mozilla/5.0'));
        $context = stream_context_create($context);
        if (!function_exists('file_get_contents')) {
            $fh = fopen($url, 'r', FALSE, $context);
            $content = '';
            while (!feof($fh)) {
                $content .= fread($fh, 128);
            }
            fclose($fh);
        } else {
            $content = file_get_contents($url, NULL, $context);
        }
    }
    return $content;
}

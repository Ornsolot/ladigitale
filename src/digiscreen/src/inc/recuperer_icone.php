<?php

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Max-Age: 1000');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');

if (!empty($_POST['lien'])) {
	echo recuperer_icone($_POST['lien']);
} else {
	echo '';
}

function recuperer_icone ($url) {
    $url = strtolower($url);
	$favicon = '';
	$domaine = parse_url($url, PHP_URL_HOST);
	$html = charger($url);
	$regExPattern = '/((<link[^>]+rel=.(apple-touch-icon|fluid-icon)[^>]+>))/i';
	if (@preg_match($regExPattern, $html, $matchTag)) {
		$regExPattern = '/href=(\'|\")(.*?)\1/i';
		if (isset($matchTag[1]) and @preg_match($regExPattern, $matchTag[1], $matchUrl)) {
			if (isset($matchUrl[2]) ) {
				$favicon = trim($matchUrl[2]);
			}
		}
	} else {
		$regExPattern = '/((<link[^>]+rel=.(icon|shortcut icon|alternate icon)[^>]+>))/i';
		if (@preg_match($regExPattern, $html, $matchTag)) {
			$regExPattern = '/href=(\'|\")(.*?)\1/i';
			if (isset($matchTag[1]) and @preg_match($regExPattern, $matchTag[1], $matchUrl)) {
				if (isset($matchUrl[2]) ) {
					$favicon = trim($matchUrl[2]);
				}
			}
		}
	}
	if ($favicon === '') { 
		$favicon = 'https://' . $domaine . '/favicon.ico';
		if (!@getimagesize($favicon)) {
			$favicon = '';
		}
	}
    return $favicon;
}

function charger ($url) {
    if (function_exists('curl_version')) {
        $ch = curl_init($url);
        curl_setopt($ch, CURLOPT_USERAGENT, 'FaviconBot/1.0 (+http://' . $_SERVER['SERVER_NAME'] . '/');
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
        $content = curl_exec($ch);
        curl_close($ch);
        unset($ch);
    } else {
        $context = array ('http' => array ('user_agent' => 'FaviconBot/1.0 (+http://' . $_SERVER['SERVER_NAME'] . '/)'));
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

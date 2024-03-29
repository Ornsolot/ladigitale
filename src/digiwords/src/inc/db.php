<?php

if (!file_exists('../inc/digiwords.db')) {
    $db = new PDO('sqlite:'. dirname(__FILE__) . '/digiwords.db');
    $db->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
    $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $table = "CREATE TABLE digiwords_nuages (
        id INTEGER PRIMARY KEY AUTOINCREMENT UNIQUE,
        url TEXT NOT NULL,
        nom TEXT NOT NULL,
        question TEXT NOT NULL,
        reponse TEXT NOT NULL,
        donnees	TEXT NOT NULL,
        date TEXT NOT NULL
    )";
    $db->exec($table);
} else {
    $db = new PDO('sqlite:'. dirname(__FILE__) . '/digiwords.db');
    $db->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
    $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
}

?>

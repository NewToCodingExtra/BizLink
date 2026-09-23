<?php
$mysqli = new mysqli("127.0.0.1", "bizlink", "bizlink", "bizlink", 3307);

if ($mysqli->connect_error) {
    // try no password
    $mysqli = new mysqli("127.0.0.1", "root", "", "bizlink", 3307);
}
if ($mysqli->connect_error) {
    // try 3306
    $mysqli = new mysqli("127.0.0.1", "root", "", "bizlink", 3306);
}

if ($mysqli->connect_error) {
    die("Connection failed: " . $mysqli->connect_error);
}

$queries = [
    "CREATE TABLE IF NOT EXISTS story_user_likes (
        id bigint unsigned NOT NULL AUTO_INCREMENT,
        story_id bigint unsigned NOT NULL,
        user_id bigint unsigned NOT NULL,
        created_at timestamp NULL DEFAULT NULL,
        updated_at timestamp NULL DEFAULT NULL,
        PRIMARY KEY (id),
        UNIQUE KEY (story_id, user_id),
        FOREIGN KEY (story_id) REFERENCES stories(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;",
    
    "ALTER TABLE stories ADD COLUMN IF NOT EXISTS likes_count INT UNSIGNED DEFAULT 0;"
];

foreach ($queries as $q) {
    if (!$mysqli->query($q)) {
        echo "Error: " . $mysqli->error . "\n";
    } else {
        echo "Success: " . $q . "\n";
    }
}
$mysqli->close();

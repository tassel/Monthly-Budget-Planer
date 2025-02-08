<?php
// load_budget.php - Loads budget data from JSON file

$file = "budget.json";
if (file_exists($file)) {
    echo file_get_contents($file);
} else {
    echo json_encode(["categories" => []]); // Return an empty structure if no file exists
}
?>

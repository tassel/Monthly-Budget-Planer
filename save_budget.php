<?php
// save_budget.php - Saves budget data to a JSON file

$data = file_get_contents("php://input"); // Get the raw POST data
if ($data) {
    file_put_contents("budget.json", $data); // Save to file
    echo json_encode(["status" => "success", "message" => "Data saved successfully"]);
} else {
    echo json_encode(["status" => "error", "message" => "No data received"]);
}
?>

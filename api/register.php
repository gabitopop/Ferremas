<?php
header('Content-Type: application/json');
require_once 'db.php';

$data = json_decode(file_get_contents("php://input"), true);
$name = trim($data['name'] ?? '');
$email = trim($data['email'] ?? '');
$password = $data['password'] ?? '';

if (!$name || !$email || !$password) {
    echo json_encode(['success' => false, 'message' => 'Todos los campos son obligatorios.']);
    exit;
}

// Verificar si el usuario ya existe
$stmt = $pdo->prepare("SELECT id FROM usuarios WHERE email = ?");
$stmt->execute([$email]);
if ($stmt->rowCount() > 0) {
    echo json_encode(['success' => false, 'message' => 'El correo ya está registrado.']);
    exit;
}

// Insertar nuevo usuario
$hashedPassword = password_hash($password, PASSWORD_DEFAULT);
$stmt = $pdo->prepare("INSERT INTO usuarios (nombre, email, password) VALUES (?, ?, ?)");
try {
    $stmt->execute([$name, $email, $hashedPassword]);
    echo json_encode(['success' => true, 'message' => 'Usuario registrado con éxito.']);
} catch (PDOException $e) {
    echo json_encode(['success' => false, 'message' => 'Error al registrar: ' . $e->getMessage()]);
}

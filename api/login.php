<?php

header('Content-Type: application/json');

$data = json_decode(file_get_contents('php://input'), true);

if (!$data || !isset($data['email']) || !isset($data['password'])) {
    echo json_encode(['success' => false, 'message' => 'Datos incompletos.']);
    exit;
}

$email = $data['email'];
$password = $data['password'];

require 'db.php'; 

$stmt = $pdo->prepare("SELECT * FROM usuarios WHERE email = :email");
$stmt->execute(['email' => $email]);
$user = $stmt->fetch();

if ($user && password_verify($password, $user['password'])) {
    // Aquí podrías iniciar una sesión si deseas
    echo json_encode(['success' => true]);
} else {
    echo json_encode(['success' => false, 'message' => 'Correo o contraseña incorrectos.']);
}

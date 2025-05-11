const express = require('express');
const mysql = require('mysql');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());


const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'ferremas'
});


app.post('/api/register', (req, res) => {
  const { nombre, correo, password } = req.body;

  const query = "INSERT INTO usuarios (nombre, correo, password) VALUES (?, ?, ?)";
  db.query(query, [nombre, correo, password], (err, result) => {
    if (err) {
      return res.status(500).json({ error: "Error al registrar usuario" });
    }
    res.status(200).json({ message: "Usuario registrado exitosamente" });
  });
});

app.listen(3000, () => {
  console.log('Servidor corriendo en http://localhost:3000');
});

const express = require('express');
const mysql = require('mysql');
const cors = require('cors');
const bcrypt = require('bcrypt');

const app = express();
app.use(cors());
app.use(express.json());

const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'ferremas'
});


app.post('/api/register', async (req, res) => {
  const { nombre, correo, password } = req.body;

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    const query = "INSERT INTO usuarios (nombre, email, password) VALUES (?, ?, ?)";
    db.query(query, [nombre, correo, hashedPassword], (err, result) => {
      if (err) {
        console.error('Error en la base de datos:', err);
        return res.status(500).json({ success: false, message: "Error al registrar usuario" });
      }
      res.status(200).json({ success: true, message: "Usuario registrado exitosamente" });
    });
  } catch (error) {
    console.error('Error en hash:', error);
    res.status(500).json({ success: false, message: "Error interno del servidor" });
  }
});

app.post('/api/login', (req, res) => {
  const { email, password } = req.body;

  const query = "SELECT * FROM usuarios WHERE email = ?";
  db.query(query, [email], async (err, results) => {
    if (err) {
      console.error('Error en la base de datos:', err);
      return res.status(500).json({ success: false, message: 'Error en el servidor' });
    }
    if (results.length === 0) {

      return res.status(401).json({ success: false, message: 'Correo o contraseña incorrectos' });
    }

    const user = results[0];

    const match = await bcrypt.compare(password, user.password);

    if (match) {
      res.status(200).json({ success: true, message: 'Login exitoso', user });
    } else {
      res.status(401).json({ success: false, message: 'Correo o contraseña incorrectos' });
    }
  });
});

app.post('/api/productos', (req, res) => {
  const { nombre, precio, descripcion } = req.body;

  const query = 'INSERT INTO productos (nombre, precio, descripcion) VALUES (?, ?, ?)';
  db.query(query, [nombre, precio, descripcion], (err, result) => {
    if (err) {
      console.error('Error BD:', err);
      return res.status(500).json({ success: false, message: 'Error al agregar producto' });
    }
    res.json({ success: true, message: 'Producto agregado correctamente' });
  });
});

// Obtener todos los productos
app.get('/api/productos', (req, res) => {
  db.query('SELECT * FROM productos', (err, results) => {
    if (err) return res.status(500).json({ error: 'Error al obtener productos' });
    res.json(results);
  });
});


app.put('/api/productos/:id', (req, res) => {
  const { id } = req.params;
  const { nombre, precio, descripcion } = req.body;

  const query = 'UPDATE productos SET nombre = ?, precio = ?, descripcion = ? WHERE id = ?';
  db.query(query, [nombre, precio, descripcion, id], (err) => {
    if (err) return res.status(500).json({ error: 'Error al actualizar producto' });
    res.json({ message: 'Producto actualizado correctamente' });
  });
});

app.delete('/api/productos/:id', (req, res) => {
  const { id } = req.params;

  db.query('DELETE FROM productos WHERE id = ?', [id], (err) => {
    if (err) return res.status(500).json({ error: 'Error al eliminar producto' });
    res.json({ message: 'Producto eliminado correctamente' });
  });
});



app.listen(3000, () => {
  console.log('Servidor corriendo en http://localhost:3000');
});

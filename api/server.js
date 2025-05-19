const express = require('express');
const mysql = require('mysql');
const cors = require('cors');
const bcrypt = require('bcrypt');

const app = express();
app.use(cors());
app.use(express.json());

// Conexión a base de datos
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'ferremas'
});

// Transbank SDK
const { WebpayPlus } = require('transbank-sdk');
const { Options, IntegrationApiKeys, IntegrationCommerceCodes } = require('transbank-sdk');
const { Transaction } = WebpayPlus;

// Configurar transacción de prueba
const webpay = new Transaction(
  new Options(
    IntegrationCommerceCodes.WEBPAY_PLUS,
    IntegrationApiKeys.WEBPAY,
    'https://webpay3gint.transbank.cl/'
  )
);

// Crear transacción
app.post('/api/crear-transaccion', async (req, res) => {
  const { idProducto } = req.body;

  db.query('SELECT * FROM productos WHERE id = ?', [idProducto], async (err, results) => {
    if (err || results.length === 0) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }

    const producto = results[0];
    const buyOrder = 'orden-' + Math.floor(Math.random() * 1000000);
    const sessionId = 'sesion-' + Date.now();
    const returnUrl = 'http://localhost:5500/html/resultado.html';

    try {
      const response = await webpay.create(
        buyOrder,
        sessionId,
        producto.precio,
        returnUrl
      );

      res.json({ url: response.url, token: response.token });
    } catch (e) {
      console.error('Error creando transacción:', e);
      res.status(500).json({ error: 'No se pudo iniciar la transacción' });
    }
  });
});

// Confirmar transacción
app.post('/api/confirmar-transaccion', async (req, res) => {
  const { token } = req.body;

  try {
    const result = await webpay.commit(token);
    res.json({ status: result.status, amount: result.amount });
  } catch (e) {
    console.error('Error confirmando pago:', e);
    res.status(500).json({ error: 'No se pudo confirmar la transacción' });
  }
});

// Registro de usuario con contraseña encriptada
app.post('/api/register', async (req, res) => {
  const { nombre, correo, password } = req.body;

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const query = "INSERT INTO usuarios (nombre, email, password) VALUES (?, ?, ?)";
    db.query(query, [nombre, correo, hashedPassword], (err) => {
      if (err) {
        console.error('Error BD:', err);
        return res.status(500).json({ success: false, message: "Error al registrar usuario" });
      }
      res.status(200).json({ success: true, message: "Usuario registrado exitosamente" });
    });
  } catch (error) {
    console.error('Error en hash:', error);
    res.status(500).json({ success: false, message: "Error interno del servidor" });
  }
});

// Login
app.post('/api/login', (req, res) => {
  const { email, password } = req.body;
  const query = "SELECT * FROM usuarios WHERE email = ?";
  db.query(query, [email], async (err, results) => {
    if (err || results.length === 0) {
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

// Productos CRUD
app.post('/api/productos', (req, res) => {
  const { nombre, precio, descripcion } = req.body;
  db.query('INSERT INTO productos (nombre, precio, descripcion) VALUES (?, ?, ?)',
    [nombre, precio, descripcion],
    (err) => {
      if (err) return res.status(500).json({ error: 'Error al agregar producto' });
      res.json({ success: true, message: 'Producto agregado' });
    });
});

app.get('/api/productos', (req, res) => {
  db.query('SELECT * FROM productos', (err, results) => {
    if (err) return res.status(500).json({ error: 'Error al obtener productos' });
    res.json(results);
  });
});

// Iniciar servidor
app.listen(3000, () => {
  console.log('Servidor corriendo en http://localhost:3000');
});

const express = require('express');
const path = require('path');
const app = express();
const PORT = 3000;

// Middleware para procesar JSON y formularios
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Servir archivos estáticos (como gracias.html)
app.use(express.static(path.join(__dirname, 'public')));

// Ruta de prueba que simula creación de una transacción Webpay
app.post('/webpay/create', async (req, res) => {
  try {
    // Simula crear una transacción
    const returnUrl = "http://localhost:3000/webpay/response";
    const token = "TOKEN_EJEMPLO_WEBPAY"; // ← reemplázalo por el token real desde Webpay

    // Responde una página HTML que:
    // - abre gracias.html en nueva pestaña
    // - redirige la actual a returnUrl con el token
    res.send(`
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <title>Redirigiendo...</title>
      </head>
      <body>
        <p>Redirigiendo al portal de pago...</p>

        <script>
          // Abrir gracias.html en una nueva pestaña
          window.open('/gracias.html', '_blank');

          // Redirigir a Webpay con el token usando POST
          const form = document.createElement('form');
          form.method = 'POST';
          form.action = '${returnUrl}';

          const input = document.createElement('input');
          input.type = 'hidden';
          input.name = 'token_ws';
          input.value = '${token}';
          form.appendChild(input);

          document.body.appendChild(form);
          form.submit();
        </script>
      </body>
      </html>
    `);
  } catch (error) {
    console.error("Error al crear la transacción:", error);
    res.status(500).send("Error al crear la transacción");
  }
});

// Ruta de ejemplo que podría recibir la respuesta de Webpay (solo para ver que redirige bien)
app.post('/webpay/response', (req, res) => {
  res.send("¡Respuesta de Webpay recibida! Token: " + req.body.token_ws);
});

// Iniciar el servidor
app.listen(PORT, () => {
  console.log(`Servidor iniciado en http://localhost:${PORT}`);
});



/** 
const express = require('express');
const mysql = require('mysql');
const cors = require('cors');
const bcrypt = require('bcrypt');
const { WebpayPlus, IntegrationApiKeys, IntegrationCommerceCodes, Environment } = require('transbank-sdk');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true })); // Necesario para leer token_ws
app.use(express.static('public'));

// ========================================================================
//  Configuración de la Base de Datos
// ========================================================================
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'ferremas' // Asegúrate de que este nombre de base de datos sea correcto
});

db.connect((err) => {
    if (err) {
        console.error('Error al conectar a la base de datos:', err);
        return;
    }
    console.log('Conexión a la base de datos establecida');
});

// ========================================================================
//  Configuración de Webpay Plus (Modo Integración)
// ========================================================================
const webpay = new WebpayPlus.Transaction({
    commerceCode: IntegrationCommerceCodes.WEBPAY_PLUS,
    apiKey: IntegrationApiKeys.WEBPAY,
    environment: Environment.Integration
});

// ========================================================================
//  Rutas de Webpay Plus
// ========================================================================

// Ruta para crear la transacción
app.post("/webpay/create", async (req, res) => {
    const { monto } = req.body;

    if (!monto || isNaN(monto) || monto <= 0) {
        return res.status(400).json({ error: 'Monto inválido o no recibido' });
    }

    const buyOrder = "orden_" + Math.floor(Math.random() * 1000000);
    const sessionId = "session_" + Math.floor(Math.random() * 1000000);
    const returnUrl = "http://localhost:3000/webpay/response"; // SIN ESPACIOS

    try {
        const response = await webpay.create(buyOrder, sessionId, monto, returnUrl);
        res.json({ url: response.url, token: response.token });
    } catch (error) {
        console.error('Error al crear la transacción:', error);
        res.status(500).json({ error: 'No se pudo iniciar la transacción: ' + error.message });
    }
});

// Ruta para confirmar la transacción (recibe la respuesta de Transbank - YA NO SE USA DIRECTAMENTE)
app.post('/webpay/response', async (req, res) => {
    // Esta ruta ya no se espera que Transbank la llame directamente con POST.
    // Se mantiene por si acaso o para otras lógicas.
    console.log('Petición POST inesperada a /webpay/response', req.body);
    res.status(400).send('Petición inesperada');
});

// Ruta para confirmar la transacción (desde el frontend después de la redirección)
app.post('/webpay/confirm', async (req, res) => {
    const { token_ws } = req.body;
    if (!token_ws) {
        return res.status(400).json({ error: 'Token WS no recibido para confirmar' });
    }
    try {
        const result = await webpay.commit(token_ws);
        console.log('Resultado de webpay.commit:', result);

        // Guardar la venta en la base de datos
        const query = "INSERT INTO ventas (buy_order, amount, status, transaction_date) VALUES (?, ?, ?, ?)";
        db.query(query, [result.buyOrder, result.amount, result.status, result.transactionDate], (err) => {
            if (err) {
                console.error('Error al guardar la venta:', err);
                return res.status(500).json({ error: 'Error al guardar la venta en la base de datos' });
            }
            res.json({ success: true, message: 'Venta guardada', result: result });
        });
    } catch (error) {
        console.error('Error al confirmar la transacción:', error);
        res.status(500).json({ error: 'Error al confirmar la transacción con Transbank' });
    }
});
app.post('/webpay/confirm', async (req, res) => {
    const { token_ws } = req.body;
    if (!token_ws) {
        return res.status(400).json({ error: 'Token WS no recibido para confirmar' });
    }
    try {
        const result = await webpay.commit(token_ws);
        console.log('Resultado de webpay.commit:', result);

        // Guardar la venta en la base de datos
        const query = "INSERT INTO ventas (buy_order, amount, status, transaction_date) VALUES (?, ?, ?, ?)";
        db.query(query, [result.buyOrder, result.amount, result.status, result.transactionDate], (err) => { // <--- REVISA ESTA LÍNEA
            if (err) {
                console.error('Error al guardar la venta:', err);
                return res.status(500).json({ error: 'Error al guardar la venta en la base de datos' });
            }
            res.json({ success: true, message: 'Venta guardada', result: result });
        });
    } catch (error) {
        console.error('Error al confirmar la transacción:', error);
        res.status(500).json({ error: 'Error al confirmar la transacción con Transbank' });
    }
});

// ========================================================================
//  Rutas de Usuario (Registro y Login)
// ========================================================================

// Registro de usuario
app.post('/api/register', async (req, res) => {
    const { nombre, correo, password } = req.body;

    if (!nombre || !correo || !password) {
        return res.status(400).json({ success: false, message: "Faltan datos para el registro" });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)){
        return res.status(400).json({ success: false, message: "Correo electrónico inválido" });
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const query = "INSERT INTO usuarios (nombre, email, password) VALUES (?, ?, ?)";
        db.query(query, [nombre, correo, hashedPassword], (err) => {
            if (err) {
                console.error('Error al registrar usuario en la base de datos:', err);
                if (err.code === 'ER_DUP_ENTRY') {
                    return res.status(409).json({ success: false, message: "El correo electrónico ya está registrado" });
                }
                return res.status(500).json({ success: false, message: "Error interno del servidor al registrar usuario" });
            }
            res.status(200).json({ success: true, message: "Usuario registrado exitosamente" });
        });
    } catch (error) {
        console.error('Error al hashear la contraseña:', error);
        res.status(500).json({ success: false, message: "Error interno del servidor al procesar la contraseña" });
    }
});

// Login de usuario
app.post('/api/login', (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ success: false, message: "Faltan correo y/o contraseña" });
    }

    const query = "SELECT * FROM usuarios WHERE email = ?";
    db.query(query, [email], async (err, results) => {
        if (err) {
            console.error('Error al buscar usuario:', err);
            return res.status(500).json({ success: false, message: "Error interno del servidor al buscar usuario" });
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

// ========================================================================
//  Rutas de Productos
// ========================================================================

// Agregar un nuevo producto
app.post('/api/productos', (req, res) => {
    const { nombre, precio, descripcion } = req.body;

     if (!nombre || !precio || !descripcion) {
        return res.status(400).json({ success: false, message: "Faltan datos del producto" });
    }

    if (isNaN(precio) || precio <= 0) {
        return res.status(400).json({success: false, message: "Precio inválido"});
    }
    db.query('INSERT INTO productos (nombre, precio, descripcion) VALUES (?, ?, ?)',
        [nombre, precio, descripcion],
        (err) => {
            if (err) {
                console.error('Error al agregar producto:', err);
                return res.status(500).json({ error: 'Error al agregar producto a la base de datos' });
            }
            res.json({ success: true, message: 'Producto agregado correctamente' });
        });
});

// Obtener todos los productos
app.get('/api/productos', (req, res) => {
    db.query('SELECT * FROM productos', (err, results) => {
        if (err) {
            console.error('Error al obtener productos:', err);
            return res.status(500).json({ error: 'Error al obtener productos de la base de datos' });
        }
        res.json(results);
    });
});

// ========================================================================
//  Iniciar el Servidor
// ========================================================================

const port = 3000;
app.listen(port, () => {
    console.log(`🚀 Servidor corriendo en http://localhost:${port}`);
});
*/
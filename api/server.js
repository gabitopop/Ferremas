const express = require('express');
const mysql = require('mysql');
const cors = require('cors');
const bcrypt = require('bcrypt');
const { WebpayPlus, IntegrationApiKeys, IntegrationCommerceCodes, Environment } = require('transbank-sdk');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true })); // Necesario para leer token_ws

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
        // En una aplicación real, aquí deberías manejar el error de manera más robusta
        // (por ejemplo, detener la aplicación o intentar reconectar).
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

    // Validación del monto
    if (!monto || isNaN(monto) || monto <= 0) {
        return res.status(400).json({ error: 'Monto inválido o no recibido' });
    }

    const buyOrder = "orden_" + Math.floor(Math.random() * 1000000);
    const sessionId = "session_" + Math.floor(Math.random() * 1000000);
    const returnUrl = "http://localhost:3000/webpay/response"; // IMPORTANTE: Ajusta esto a tu URL

    try {
        const response = await webpay.create(buyOrder, sessionId, monto, returnUrl);
        res.json({ url: response.url, token: response.token });
    } catch (error) {
        console.error('Error al crear la transacción:', error);
        res.status(500).json({ error: 'No se pudo iniciar la transacción: ' + error.message }); // Incluye el mensaje de error
    }
});

// Ruta para confirmar la transacción (recibe la respuesta de Transbank)
app.post('/webpay/response', async (req, res) => {
    const token_ws = req.body.token_ws;

    if (!token_ws) {
        return res.status(400).send('Token no recibido desde Webpay');
    }

    try {
        const result = await webpay.commit(token_ws);

        // Guardar la venta en la base de datos
        const query = "INSERT INTO ventas (buy_order, amount, status, transaction_date) VALUES (?, ?, ?, ?)";
        db.query(query, [result.buyOrder, result.amount, result.status, result.transactionDate], (err) => {
            if (err) {
                console.error('Error al guardar la venta en la base de datos:', err);
                // No debes redirigir al usuario aquí si falla la base de datos.  Es un error del servidor.
                // Considera loggear el error y mostrar un mensaje genérico de error al usuario.
                return res.status(500).send('Error al guardar la transacción en la base de datos.');
            }
            console.log('Venta guardada en la base de datos:', result);
        });

        // Redirigir al frontend (éxito o fallo, basado en el estado de la transacción)
        if (result.status === 'AUTHORIZED') {
             res.redirect(`http://localhost:3000/exito?monto=${result.amount}`); //TODO: Cambiar esto
        }
        else{
            res.redirect(`http://localhost:3000/error?status=${result.status}`);
        }


    } catch (error) {
        console.error('Error al confirmar la transacción (commit):', error);
        res.redirect('http://localhost:3000/error'); // Redirige a una página de error en tu frontend
    }
});

// Ruta para confirmar la transacción (desde el frontend - Opcional)
app.post('/webpay/commit', async (req, res) => {
    const { token } = req.body;

    if (!token) {
        return res.status(400).json({ error: 'Token no recibido' });
    }

    try {
        const result = await webpay.commit(token);
        res.json({ status: result.status, amount: result.amount });
    } catch (error) {
        console.error('Error al confirmar la transacción:', error);
        res.status(500).json({ error: 'No se pudo confirmar la transacción: ' + error.message }); // Incluye el mensaje
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

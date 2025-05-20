let productosCache = [];

document.addEventListener('DOMContentLoaded', async () => {
  const contenedor = document.getElementById('productos');

  try {
    const response = await fetch('http://localhost:3000/api/productos');
    const productos = await response.json();

    if (!Array.isArray(productos)) throw new Error('No se pudo cargar la lista');

    productosCache = productos; // Guardamos los productos para usarlos después

    productos.forEach(producto => {
      const div = document.createElement('div');
      div.classList.add('producto');
      div.innerHTML = `
        <h3>${producto.nombre}</h3>
        <p><strong>Precio:</strong> $${producto.precio}</p>
        <p>${producto.descripcion}</p>
        <button onclick="pagar(${producto.id})">Comprar</button>
      `;
      contenedor.appendChild(div);
    });
  } catch (err) {
    contenedor.innerHTML = '<p>Error al cargar productos.</p>';
    console.error('Error:', err);
  }
});

async function pagar(idProducto) {
  const producto = productosCache.find(p => p.id === idProducto);
  if (!producto) {
    alert('Producto no encontrado');
    return;
  }

  try {
    const res = await fetch('http://localhost:3000/webpay/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ monto: producto.precio }) // nuevo formato
    });

    const data = await res.json();
    if (data.url && data.token) {
      const form = document.createElement('form');
      form.action = data.url;
      form.method = 'POST';

      const input = document.createElement('input');
      input.type = 'hidden';
      input.name = 'token_ws';
      input.value = data.token;

      form.appendChild(input);
      document.body.appendChild(form);
      form.submit();
    } else {
      alert('Error al iniciar transacción');
    }
  } catch (err) {
    console.error('Error en pago:', err);
    alert('Error al conectar con el servidor');
  }
}

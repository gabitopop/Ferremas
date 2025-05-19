document.addEventListener('DOMContentLoaded', async () => {
  const contenedor = document.getElementById('productos');

  try {
    const response = await fetch('http://localhost:3000/api/productos');
    const productos = await response.json();

    if (!Array.isArray(productos)) throw new Error('No se pudo cargar la lista');

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
  try {
    const res = await fetch('http://localhost:3000/api/crear-transaccion', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idProducto })
    });

    const data = await res.json();
    if (data.url && data.token) {
      // Redirige automáticamente al formulario de pago de Transbank
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

function pagarCarrito() {
  // En este ejemplo, asumimos que carrito ya está en memoria
  fetch('http://localhost:3000/api/crear-transaccion', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ carrito }) // Envías el array con id y cantidad
  })
  .then(res => res.json())
  .then(data => {
    const form = document.createElement('form');
    form.method = 'POST';
    form.action = data.url;

    const input = document.createElement('input');
    input.type = 'hidden';
    input.name = 'token_ws';
    input.value = data.token;

    form.appendChild(input);
    document.body.appendChild(form);
    form.submit();
  });
}


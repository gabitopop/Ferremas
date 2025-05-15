async function cargarProductos() {
  try {
    const res = await fetch('http://localhost:3000/api/productos');
    const productos = await res.json();

    const tbody = document.querySelector('#productosTable tbody');
    tbody.innerHTML = ''; // Limpiar

    productos.forEach(producto => {
      const fila = document.createElement('tr');

      fila.innerHTML = `
        <td><input value="${producto.nombre}" data-id="${producto.id}" class="nombre" /></td>
        <td><input type="number" value="${producto.precio}" class="precio" /></td>
        <td><textarea class="descripcion">${producto.descripcion}</textarea></td>
        <td>
          <button class="guardar">Guardar</button>
          <button class="borrar">Eliminar</button>
        </td>
      `;

      // Eventos de botones
      fila.querySelector('.guardar').addEventListener('click', async () => {
        const id = producto.id;
        const nombre = fila.querySelector('.nombre').value.trim();
        const precio = parseFloat(fila.querySelector('.precio').value);
        const descripcion = fila.querySelector('.descripcion').value.trim();

        await fetch(`http://localhost:3000/api/productos/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ nombre, precio, descripcion })
        });

        alert('Producto actualizado');
        cargarProductos();
      });

      fila.querySelector('.borrar').addEventListener('click', async () => {
        const confirmar = confirm('¿Eliminar este producto?');
        if (!confirmar) return;

        await fetch(`http://localhost:3000/api/productos/${producto.id}`, {
          method: 'DELETE'
        });

        alert('Producto eliminado');
        cargarProductos();
      });

      tbody.appendChild(fila);
    });

  } catch (err) {
    console.error('Error al cargar productos:', err);
  }
}

cargarProductos();

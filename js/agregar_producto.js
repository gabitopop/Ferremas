document.getElementById('productoForm').addEventListener('submit', async function(e) {
  e.preventDefault();

  const nombre = document.getElementById('nombre').value.trim();
  const precio = parseFloat(document.getElementById('precio').value);
  const descripcion = document.getElementById('descripcion').value.trim();

  try {
    const response = await fetch('http://localhost:3000/api/productos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nombre, precio, descripcion })
    });

    const result = await response.json();

    const msg = document.getElementById('msg');
    msg.textContent = result.message;
    msg.style.color = result.success ? 'green' : 'red';

    if (result.success) {
      document.getElementById('productoForm').reset();
    }

  } catch (error) {
    console.error(error);
    const msg = document.getElementById('msg');
    msg.textContent = 'Error al agregar producto. Intenta nuevamente.';
    msg.style.color = 'red';
  }
});

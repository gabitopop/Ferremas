// main.js

document.addEventListener('DOMContentLoaded', () => {
  actualizarCantidadCarrito();
});

/**
 * Actualiza el número de productos en el badge del carrito
 */
function actualizarCantidadCarrito() {
  const spanCantidad = document.getElementById('carrito-cantidad');
  if (!spanCantidad) return;

  const carrito = JSON.parse(localStorage.getItem('carrito')) || [];
  
  // Sumar todas las cantidades de productos
  const cantidadTotal = carrito.reduce((total, producto) => total + producto.cantidad, 0);
  
  // Mostrar la cantidad en el badge
  spanCantidad.textContent = cantidadTotal;

  // Opcional: ocultar el badge si el carrito está vacío
  if (cantidadTotal === 0) {
    spanCantidad.style.display = 'none';
  } else {
    spanCantidad.style.display = 'inline-block';
  }
}



/** poner <script src="/js/main.js"></script> en toda wea abajo  */
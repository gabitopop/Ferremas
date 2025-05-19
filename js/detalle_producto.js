document.addEventListener("DOMContentLoaded", () => {
  const botonAgregar = document.getElementById("btn-agregar-carrito");

  botonAgregar.addEventListener("click", () => {
    const cantidadInput = document.getElementById("cantidad");
    const cantidad = parseInt(cantidadInput.value);

    // Definimos el producto manualmente (puedes automatizar esto luego con PHP o backend)
    const producto = {
      id: "3",
      nombre: "Sierra Circular",
      precio: 45000,
      imagen: "../docs/IMG/IMGPROD/ESAW1.png",
      cantidad: cantidad
    };

    // Obtener el carrito actual
    let carrito = JSON.parse(localStorage.getItem("carrito")) || [];

    // Verificar si el producto ya está en el carrito
    const existente = carrito.find(p => p.id === producto.id);

    if (existente) {
      existente.cantidad += cantidad;
    } else {
      carrito.push(producto);
    }

    // Guardar carrito actualizado
    localStorage.setItem("carrito", JSON.stringify(carrito));

    // Confirmación visual
    alert("Producto agregado al carrito");
  });
});

document.addEventListener('DOMContentLoaded', () => {
    let carrito = JSON.parse(localStorage.getItem('carrito')) || [];
    const tbody = document.getElementById('carrito-body');
    const totalSpan = document.querySelector('.total');
    let total = 0;

    // Mostrar productos en la tabla
    carrito.forEach(producto => {
        const subtotal = producto.precio * producto.cantidad;
        total += subtotal;

        const fila = `
            <tr>
                <td>${producto.nombre}</td>
                <td>$${producto.precio.toLocaleString()}</td>
                <td><input type="number" value="${producto.cantidad}" min="1" data-id="${producto.id}" class="form-control cantidad-input" /></td>
                <td>$${subtotal.toLocaleString()}</td>
                <td><button class="btn btn-danger btn-sm btn-delete" data-id="${producto.id}">Eliminar</button></td>
            </tr>
        `;
        tbody.insertAdjacentHTML('beforeend', fila);
    });

    totalSpan.textContent = `$${total.toLocaleString()}`;

    // Eliminar producto
    document.querySelectorAll('.btn-delete').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = btn.getAttribute('data-id');
            carrito = carrito.filter(p => p.id !== id);
            localStorage.setItem('carrito', JSON.stringify(carrito));
            location.reload();
        });
    });

    // Botón de pago
    const btnPagar = document.getElementById('btn-pagar');
    if (btnPagar) {
        btnPagar.addEventListener('click', async () => {
            if (carrito.length === 0) {
                alert("Tu carrito está vacío.");
                return;
            }

            try {
                // Obtener el total desde el DOM y limpiar formato
                const totalTexto = document.querySelector('.total').textContent;
                const monto = parseInt(totalTexto.replace(/\$|\./g, ''));

                if (isNaN(monto) || monto <= 0) {
                    alert("Monto no válido para el pago.");
                    return;
                }

                localStorage.setItem('ultimoPago', JSON.stringify(carrito));

                // **SIMULACIÓN PARA PRUEBAS - ENVÍO DIRECTO A /webpay/response (COMENTADO)**
                /*
                const tokenWsPruebaExito = 'TOKEN_PRUEBA_EXITO';
                const tokenWsPruebaRechazo = 'TOKEN_PRUEBA_RECHAZO';

                // Elige un token de prueba para simular un escenario
                const tokenWsSimulado = tokenWsPruebaExito; // O tokenWsPruebaRechazo

                fetch('http://localhost:3000/webpay/response', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                    body: `token_ws=${tokenWsSimulado}&monto_prueba=${monto}` // Envía también el monto para la simulación
                })
                .then(response => {
                    if (response.redirected) {
                        window.location.href = response.url; // Redirige a éxito o error según la simulación
                    } else {
                        console.error('No hubo redirección desde /webpay/response simulado');
                    }
                })
                .catch(error => {
                    console.error('Error al enviar a /webpay/response simulado:', error);
                });
                */
                // **FIN DE SIMULACIÓN PARA PRUEBAS**

                // **CÓDIGO ORIGINAL PARA INTEGRACIÓN REAL (DESCOMENTADO)**
                const response = await fetch('http://localhost:3000/webpay/create', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ monto })
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    alert('Error al crear transacción: ' + (errorData.error || 'Desconocido'));
                    return;
                }

                const data = await response.json();
                console.log('Respuesta de /webpay/create:', data);

                const form = document.createElement('form');
                form.method = 'POST';
                form.action = data.url;

                const tokenInput = document.createElement('input');
                tokenInput.type = 'hidden';
                tokenInput.name = 'token_ws';
                tokenInput.value = data.token;

                form.appendChild(tokenInput);
                document.body.appendChild(form);

                console.log('Form action:', form.action);
                console.log('Form data (token_ws):', tokenInput.value);

                form.submit();
                // **FIN DEL CÓDIGO ORIGINAL**

            } catch (error) {
                console.error('Error en pago:', error);
                alert('Error al procesar el pago');
            }
        });
    }
});
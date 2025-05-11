document.getElementById('registerForm').addEventListener('submit', async function (e) {
  e.preventDefault(); 

const nombre = document.getElementById('name').value.trim();   
const correo = document.getElementById('email').value.trim();  
const password = document.getElementById('password').value;   


  try {

    const response = await fetch('http://localhost:3000/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nombre, correo, password })
    });

    const result = await response.json();

    // Mostrar mensaje de respuesta
    const msg = document.getElementById('msg');
    msg.textContent = result.message;
    msg.style.color = result.success ? 'green' : 'red';


    if (result.success) {
      document.getElementById('registerForm').reset();
    }
  } catch (err) {
    console.error(err);
    const msg = document.getElementById('msg');
    msg.textContent = 'Error al registrar. Intenta nuevamente.';
    msg.style.color = 'red';
  }
});

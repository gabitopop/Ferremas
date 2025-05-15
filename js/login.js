document.getElementById('loginForm').addEventListener('submit', async function(e) {
  e.preventDefault();

  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;

  try {
    const response = await fetch('http://localhost:3000/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    const text = await response.text();
    console.log(text);

    let result;
    try {
      result = JSON.parse(text);
    } catch (err) {
      console.error('No es JSON:', text);
      throw new Error('Respuesta del servidor no es JSON');
    }

    const msg = document.getElementById('msg');
    msg.textContent = result.message;
    msg.style.color = result.success ? 'green' : 'red';

    if (result.success) {
      window.location.href = 'principal.html';  
    }

  } catch (err) {
    console.error(err);
    const msg = document.getElementById('msg');
    msg.textContent = 'Error de conexión. Intenta nuevamente.';
    msg.style.color = 'red';
  }
});

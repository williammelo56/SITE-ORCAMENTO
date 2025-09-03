// auth.js
// Verifica token e redireciona para login.html se não autenticado.
// Requisitos: window.API_BASE definido (ou ajustar para http://localhost:3000)

(function () {
  const API_BASE = (typeof window !== 'undefined' && window.API_BASE) ? window.API_BASE : 'http://localhost:3000';
  const PUBLIC_PAGES = ['/login.html', '/register.html', '/']; // ajustar se necessário
  const pathname = window.location.pathname;
  const page = pathname.substring(pathname.lastIndexOf('/') + 1) || '/';

  function isPublicPage(p) {
    // aceitar variações com/sem barra
    return PUBLIC_PAGES.some(pub => pub === page || pub === pathname);
  }

  function getToken() {
    return localStorage.getItem('authToken');
  }

  function redirectToLogin() {
    const next = encodeURIComponent(window.location.pathname + window.location.search);
    window.location.replace(`login.html?next=${next}`);
  }

  async function validateToken(token) {
    try {
      const resp = await fetch(`${API_BASE}/me`, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      return resp.ok;
    } catch (e) {
      return false;
    }
  }

  // Se for página pública, não bloquear
  if (isPublicPage(page) || isPublicPage(pathname)) return;

  const token = getToken();
  if (!token) {
    redirectToLogin();
    return;
  }

  // validação opcional com backend para garantir token válido (empurra logout se inválido)
  validateToken(token).then(valid => {
    if (!valid) {
      localStorage.removeItem('authToken');
      redirectToLogin();
    }
  }).catch(() => {
    localStorage.removeItem('authToken');
    redirectToLogin();
  });
})();
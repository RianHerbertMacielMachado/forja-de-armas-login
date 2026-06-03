// Sem credenciais — tudo passa pelo servidor
window.API_URL = window.location.hostname === "127.0.0.1" || window.location.hostname === "localhost"
  ? "http://localhost:3000/api"
  : "/api";

window._firebaseReady = true;
document.dispatchEvent(new Event("firebaseReady"));
window._appLoaded = true;

// Sem credenciais de admin — tudo passa pelo servidor
window.API_URL = "/api";

window._firebaseReady = true;
document.dispatchEvent(new Event("firebaseReady"));
window._appLoaded = true;

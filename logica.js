const boton = document.getElementById("btn");
const mensaje = document.getElementById("mensaje");

boton.addEventListener("click", () => {
    mensaje.textContent = "🚀 JavaScript funcionando correctamente en la nube!";
});
const { ipcRenderer } = require("electron");

console.log("[renderer] Cargado renderer.js");

// Utilidad: enviar presencia con manejo de errores
function updatePresence(details, state) {
  try {
    ipcRenderer.send("set-presence", { details, state });
    console.log(`[renderer] set-presence enviado → ${details} | ${state}`);
  } catch (err) {
    console.error("[renderer] Error enviando set-presence:", err);
  }
}

// 🔹 Estado inicial al cargar el launcher
window.addEventListener("DOMContentLoaded", () => {
  updatePresence("En el launcher", "Esperando acción");

  const exists = !!document.querySelector(".play-btn");
  console.log(`[renderer] DOMContentLoaded. play-btn presente: ${exists}`);
});

// Delegación de eventos: captura clic en .play-btn aunque se renderice luego
document.addEventListener("click", (e) => {
  const playBtn = e.target.closest(".play-btn");
  if (!playBtn) return;

  console.log("[renderer] Click en .play-btn detectado");

  // 🔹 Cambia a Jugando
  updatePresence("Jugando", "ChambaGames");

  // 🔹 Avisamos al proceso principal que debe lanzar Minecraft
  ipcRenderer.send("launch-minecraft");
});

// Observa cambios en .panels para verificar que el botón exista cuando se inyecte
const panels = document.querySelector(".panels");
if (panels) {
  const observer = new MutationObserver(() => {
    const exists = !!document.querySelector(".play-btn");
    console.log(`[renderer] Mutación en .panels. play-btn presente: ${exists}`);
  });
  observer.observe(panels, { childList: true, subtree: true });
} else {
  console.warn("[renderer] No se encontró .panels en el DOM.");
}
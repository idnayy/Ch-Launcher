const RPC = require("discord-rpc");
const clientId = "1445338510180614249"; // tu Client ID

RPC.register(clientId);
const rpc = new RPC.Client({ transport: "ipc" });

let isReady = false;

rpc.on("ready", () => {
  isReady = true;
  console.log("Rich Presence conectado a Discord.");
  
  // Estado inicial al abrir el launcher
  setPresence("En el launcher");
});

rpc.login({ clientId }).catch(console.error);

// 🔹 Función para actualizar dinámicamente el estado
function setPresence(details, state) {
  if (!isReady) return;
  rpc.setActivity({
    details,              // línea superior
    state,                // línea inferior
    startTimestamp: Date.now(),
    largeImageKey: "chlauncher", // nombre exacto del asset subido
    largeImageText: "CH Launcher",
    instance: false,
  });
}

// Exportamos la función para usarla desde index.js
module.exports = { setPresence };
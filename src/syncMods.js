const fs = require("fs");
const path = require("path");
const fetch = require("node-fetch");

const localModsPath = path.join(process.env.APPDATA, ".ChLauncher", "instances", "Forge-1.20.1", "mods");
const manifestURL = "http://104.250.132.27/files/instances/Forge-1.20.1/manifest.json";
const modsBaseURL = "http://104.250.132.27/files/instances/Forge-1.20.1/mods/";

async function syncMods() {
  try {
    const response = await fetch(manifestURL);
    const manifest = await response.json();

    const localMods = fs.readdirSync(localModsPath).filter(f => f.endsWith(".jar"));

    // Eliminar mods sobrantes
    localMods.forEach(mod => {
      if (!manifest.mods.find(m => m.name === mod)) {
const fullPath = path.join(localModsPath, mod);
try {
  fs.unlinkSync(fullPath);
  console.log(`✅ Eliminado mod excedente: ${mod}`);
} catch (err) {
  console.error(`❌ No se pudo eliminar ${mod}:`, err.message);
}
      }
    });

    // Descargar mods faltantes
    for (const m of manifest.mods) {
      const modPath = path.join(localModsPath, m.name);
      if (!fs.existsSync(modPath)) {
        console.log(`Descargando mod: ${m.name}`);
        const fileRes = await fetch(modsBaseURL + m.name);
        const buffer = await fileRes.buffer();
        fs.writeFileSync(modPath, buffer);
        console.log(`Descargado mod: ${m.name}`);
      }
    }

    console.log("✅ Sincronización de mods completada.");
  } catch (err) {
    console.error("Error en la sincronización:", err);
  }
}

module.exports = { syncMods };
/**
 * @author Luuxis
 * Licencia Luuxis v1.0 (ver archivo LICENSE para detalles en FR/EN)
 */

const { ipcRenderer, shell } = require('electron');
const pkg = require('./package.json');
const os = require('os');
import { config, database } from './utils.js';

class Splash {
    constructor() {
        this.splash = document.querySelector(".splash");
        this.splashMessage = document.querySelector(".splash-message");
        this.splashAuthor = document.querySelector(".splash-author");
        this.message = document.querySelector(".message");
        this.progress = document.querySelector(".progress");

        document.addEventListener('DOMContentLoaded', async () => {
            let databaseLauncher = new database();
            let configClient = await databaseLauncher.readData('configClient');
            let theme = configClient?.launcher_config?.theme || "auto";
            let isDarkTheme = await ipcRenderer.invoke('is-dark-theme', theme).then(res => res);
            document.body.className = isDarkTheme ? 'dark global' : 'light global';
            if (process.platform == 'win32') ipcRenderer.send('update-window-progress-load');
            this.startAnimation();
        });
    }

    async startAnimation() {
        let frases = [
            { "message": "Yo... vivo...", "author": "Luuxis" },
            { "message": "Hola, soy código.", "author": "Luuxis" },
            { "message": "Linux no es un sistema operativo, sino un kernel.", "author": "Luuxis" }
        ];
        let frase = frases[Math.floor(Math.random() * frases.length)];
        this.splashMessage.textContent = frase.message;
        this.splashAuthor.children[0].textContent = "@" + frase.author;

        await dormir(100);
        document.querySelector("#splash").style.display = "block";
        await dormir(500);
        this.splash.classList.add("opacity");
        await dormir(500);
        this.splash.classList.add("translate");
        this.splashMessage.classList.add("opacity");
        this.splashAuthor.classList.add("opacity");
        this.message.classList.add("opacity");
        await dormir(1000);
        this.checkUpdate();
    }

    async checkUpdate() {
        this.setStatus(`Buscando actualización...`);

        ipcRenderer.invoke('update-app').then().catch(err => {
            return this.shutdown(`Error al buscar actualización:<br>${err.message}`);
        });

        ipcRenderer.on('updateAvailable', () => {
            this.setStatus(`¡Actualización disponible!`);
            if (os.platform() == 'win32') {
                this.toggleProgress();
                ipcRenderer.send('start-update');
            }
            else return this.dowloadUpdate();
        });

        ipcRenderer.on('error', (event, err) => {
            if (err) return this.shutdown(`${err.message}`);
        });

        ipcRenderer.on('download-progress', (event, progress) => {
            ipcRenderer.send('update-window-progress', { progress: progress.transferred, size: progress.total });
            this.setProgress(progress.transferred, progress.total);
        });

        ipcRenderer.on('update-not-available', () => {
            console.error("No hay actualización disponible");
            this.maintenanceCheck();
        });
    }

    getLatestReleaseForOS(os, formatoPreferido, asset) {
        return asset.filter(asset => {
            const nombre = asset.name.toLowerCase();
            const coincideOS = nombre.includes(os);
            const coincideFormato = nombre.endsWith(formatoPreferido);
            return coincideOS && coincideFormato;
        }).sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0];
    }

    async dowloadUpdate() {
        const repoURL = pkg.repository.url.replace("git+", "").replace(".git", "").replace("https://github.com/", "").split("/");
        const githubAPI = await nodeFetch('https://api.github.com').then(res => res.json()).catch(err => err);

        const githubAPIRepoURL = githubAPI.repository_url.replace("{owner}", repoURL[0]).replace("{repo}", repoURL[1]);
        const githubAPIRepo = await nodeFetch(githubAPIRepoURL).then(res => res.json()).catch(err => err);

        const releases_url = await nodeFetch(githubAPIRepo.releases_url.replace("{/id}", '')).then(res => res.json()).catch(err => err);
        const latestRelease = releases_url[0].assets;
        let latest;

        if (os.platform() == 'darwin') latest = this.getLatestReleaseForOS('mac', '.dmg', latestRelease);
        else if (os == 'linux') latest = this.getLatestReleaseForOS('linux', '.appimage', latestRelease);

        this.setStatus(`¡Actualización disponible!<br><div class="download-update">Descargar</div>`);
        document.querySelector(".download-update").addEventListener("click", () => {
            shell.openExternal(latest.browser_download_url);
            return this.shutdown("Descarga en curso...");
        });
    }

    async maintenanceCheck() {
        config.GetConfig().then(res => {
            if (res.maintenance) return this.shutdown(res.maintenance_message);
            this.startLauncher();
        }).catch(e => {
            console.error(e);
            return this.shutdown("No se detectó conexión a internet,<br>por favor inténtalo más tarde.");
        });
    }

    startLauncher() {
        this.setStatus(`Iniciando el launcher`);
        ipcRenderer.send('main-window-open');
        ipcRenderer.send('update-window-close');
    }

    shutdown(texto) {
        this.setStatus(`${texto}<br>Apagando en 5s`);
        let i = 4;
        setInterval(() => {
            this.setStatus(`${texto}<br>Apagando en ${i--}s`);
            if (i < 0) ipcRenderer.send('update-window-close');
        }, 1000);
    }

    setStatus(texto) {
        this.message.innerHTML = texto;
    }

    toggleProgress() {
        if (this.progress.classList.toggle("show")) this.setProgress(0, 1);
    }

    setProgress(valor, max) {
        this.progress.value = valor;
        this.progress.max = max;
    }
}

function dormir(ms) {
    return new Promise(r => setTimeout(r, ms));
}

document.addEventListener("keydown", (e) => {
    if (e.ctrlKey && e.shiftKey && e.keyCode == 73 || e.keyCode == 123) {
        ipcRenderer.send("update-window-dev-tools");
    }
});

new Splash();
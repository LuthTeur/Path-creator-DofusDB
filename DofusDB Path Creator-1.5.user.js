// ==UserScript==
// @name         DofusDB Path Creator
// @namespace    http://tampermonkey.net/
// @version      1.5
// @description  Crée un chemin pour le botting sur la carte de DofusDB
// @author       LuthTeur
// @match        https://dofusdb.fr/fr/tools/map
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    let pathData = [];
    let selectedCoord = null;
    const arrowSymbols = {
        up: '↑',
        down: '↓',
        left: '←',
        right: '→'
    };

    function addArrow(direction) {
        if (!selectedCoord) return;
        let { x, y } = selectedCoord;
        let mapCoord = `${x},${y}`;
        let entry = pathData.find(p => p.map === mapCoord);

        if (entry) {
            entry.path = direction;
        } else {
            pathData.push({ map: mapCoord, path: direction, gather: false });
        }

        renderArrows();
        updateUI();
    }

    function toggleGather() {
        if (!selectedCoord) return;
        let { x, y } = selectedCoord;
        let mapCoord = `${x},${y}`;
        let entry = pathData.find(p => p.map === mapCoord);
        if (entry) {
            entry.gather = !entry.gather;
        } else {
            pathData.push({ map: mapCoord, path: "", gather: true });
        }
        renderArrows();
        updateUI();
    }

    function updateUI() {
        console.clear();
        console.log("Path Data:", JSON.stringify(pathData, null, 2));
    }

    function renderArrows() {
        // Suppression des anciennes flèches
        document.querySelectorAll('.path-arrow').forEach(el => el.remove());

        pathData.forEach(({ map, path }) => {
            let [x, y] = map.split(",").map(Number);
            let cell = document.querySelector(`[data-coords='${x},${y}']`);

            console.log(`Trying to add arrow at ${x},${y}:`, cell);

            if (cell && path) { // Vérification que la cellule existe et qu'il y a une direction
                let arrow = document.createElement("div");
                arrow.classList.add("path-arrow");
                arrow.innerText = arrowSymbols[path] || '';

                // Assurez-vous que la cellule est en position relative
                cell.style.position = "relative";

                // Style de la flèche
                arrow.style.position = "absolute";
                arrow.style.fontSize = "20px";
                arrow.style.fontWeight = "bold";
                arrow.style.color = "black";
                arrow.style.top = "50%";
                arrow.style.left = "50%";
                arrow.style.transform = "translate(-50%, -50%)";
                arrow.style.pointerEvents = "none";

                cell.appendChild(arrow);
                console.log(`Arrow added at ${x},${y} with direction ${path}`);
            }
        });
    }

    function exportToLua() {
        let luaData = pathData.map(p => `{ map = "${p.map}", path = "${p.path}", gather = ${p.gather} }`).join(',\n');
        let luaContent = `return {\n${luaData}\n}`;

        let blob = new Blob([luaContent], { type: "text/plain" });
        let a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = "path.lua";
        a.click();
    }

    function injectUI() {
        let container = document.createElement("div");
        container.style.position = "absolute";
        container.style.bottom = "10px";
        container.style.right = "10px";
        container.style.zIndex = "1000";
        container.style.background = "rgba(0,0,0,0.7)";
        container.style.padding = "10px";
        container.style.borderRadius = "5px";
        container.style.display = "flex";
        container.style.flexDirection = "column";
        container.style.alignItems = "center";

        let directions = ["up", "left", "right", "down"];
        directions.forEach(dir => {
            let btn = document.createElement("button");
            btn.innerText = arrowSymbols[dir];
            btn.style.margin = "5px";
            btn.onclick = () => {
                addArrow(dir);
                btn.style.backgroundColor = "#4CAF50"; // Changement de couleur pour indication visuelle
                setTimeout(() => { btn.style.backgroundColor = ""; }, 500);
            };
            container.appendChild(btn);
        });

        let gatherBtn = document.createElement("button");
        gatherBtn.innerText = "Toggle Gather";
        gatherBtn.onclick = () => {
            toggleGather();
            gatherBtn.style.backgroundColor = gatherBtn.style.backgroundColor ? "" : "#FFD700";
        };
        container.appendChild(gatherBtn);

        let exportBtn = document.createElement("button");
        exportBtn.innerText = "Exporter LUA";
        exportBtn.onclick = exportToLua;
        container.appendChild(exportBtn);

        document.body.appendChild(container);
    }

    document.addEventListener("click", (event) => {
        let gridCell = event.target.closest("[data-coords]");
        if (gridCell) {
            let [x, y] = gridCell.dataset.coords.split(",").map(Number);
            selectedCoord = { x, y };
            console.log("Selected Cell:", selectedCoord);
        }
    });

    injectUI();
})();

const Points = document.getElementById("Points_Counter");
const Points_2 = document.getElementById("Points_Counter_2");
const Poppup = document.getElementById("Poppup_bg");
const Poppup_Screen = document.getElementById("Poppup");
const Shop = document.getElementById("Shop");
const Close_Shop = document.getElementById("Close_Poppup");
const Skin_Shop = document.getElementById("Skin_Shop");
const AI_img = document.getElementById("AI_Assistant");
const AIBG = document.getElementById("AIBG");
const Shopping_Input = document.getElementById("Shopping_Input");
const Shopping_Add_Btn = document.getElementById("Shopping_Add_Btn");
const Shopping_List_Container = document.getElementById("Shopping_List_Container");

const AI_Images = {
    Cat: "/static/ai_assets/CatAI.png",
    Top: "/static/ai_assets/TopHatAI.png",
    Chef: "/static/ai_assets/ChefHatAI.png",
    Robo: "/static/ai_assets/RoboChefAI.png",
    Default: "/static/ai_assets/AbstractAI_GIF_Cropped.gif"
};

const Skin_Prices = {
    Cat: 100,
    Top: 200,
    Chef: 300,
    Robo: 500
};

let Equipped_AI = "Default";
let CurrentPoints = 0;
let Owned = ["Default"];
const AllSkins = ["Cat", "Top", "Chef", "Robo", "Default"];

async function loadData() {
    const response = await fetch("/get_data");
    const data = await response.json();
    CurrentPoints = data.points;
    Equipped_AI = data.equipped_ai;
    Owned = data.owned;
    updatePoints();
    applySkin();
    createShop();
}

async function saveData() {
    const response = await fetch("/get_data");
    const oldData = await response.json();
    oldData.equipped_ai = Equipped_AI;
    oldData.points = CurrentPoints;
    oldData.owned = Owned;
    await fetch("/save_data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(oldData)
    });
}

function applySkin() {
    AI_img.src = AI_Images[Equipped_AI];
    if (Equipped_AI === "Cat") {
        AIBG.className = "visible uncolored downies";
        AI_img.className = "Hover downies";
    } else if (Equipped_AI === "Top") {
        AIBG.className = "visible colored downies";
        AI_img.className = "Hover downies";
    } else if (Equipped_AI === "Chef" || Equipped_AI === "Robo") {
        AIBG.className = "hidden uppies";
        AI_img.className = "Hover uppies";
    } else {
        AIBG.className = "hidden";
        AI_img.className = "Hover uppies";
    }
}

function updatePoints() {
    Points.textContent = CurrentPoints;
    Points_2.textContent = CurrentPoints;
}

function createShop() {
    Skin_Shop.innerHTML = "";
    AllSkins.forEach(function (skin) {
        const item = document.createElement("div");
        item.classList.add("Skin_Item");
        const owned = Owned.includes(skin);
        let buttonText = owned ? (Equipped_AI === skin ? "Equipped" : "Equip") : "Buy";
        let priceText = owned ? "" : Skin_Prices[skin] + " Coins";
        item.innerHTML = `
            <div class="Skin_Info">
                <img src="${AI_Images[skin]}" class="Hover">
                <div><h2>${skin}</h2><p>${priceText}</p></div>
            </div>
            <button class="Skin_Button">${buttonText}</button>
        `;
        const button = item.querySelector(".Skin_Button");
        button.addEventListener("click", async function () {
            if (!owned) {
                if (CurrentPoints >= Skin_Prices[skin]) {
                    CurrentPoints -= Skin_Prices[skin];
                    Owned.push(skin);
                    Equipped_AI = skin;
                    updatePoints();
                    applySkin();
                    await saveData();
                    createShop();
                }
                if (Owned.length >= 3) {
                    Poppup_Screen.classList.remove("lround");
                    Poppup_Screen.classList.add("rround");
                }
            } else {
                Equipped_AI = skin;
                applySkin();
                await saveData();
                createShop();
            }
        });
        Skin_Shop.appendChild(item);
    });
}

Shop.addEventListener("click", function () {
    Poppup.classList.remove("hidden");
    Poppup.classList.add("visible");
    if (Owned.length >= 3) {
        Poppup_Screen.classList.remove("lround");
        Poppup_Screen.classList.add("rround");
    }
});

Close_Shop.addEventListener("click", function () {
    Poppup.classList.remove("visible");
    Poppup.classList.add("hidden");
});

Poppup.classList.add("hidden");

// ── Shopping list logic ──

async function loadShoppingList() {
    const response = await fetch("/Shopping/get_list");
    const data = await response.json();
    renderList(data.items);
}

async function addItem(name) {
    if (!name.trim()) return;
    const response = await fetch("/Shopping/add_item", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim() })
    });
    const data = await response.json();
    renderList(data.items);
}

async function toggleItem(index) {
    const response = await fetch("/Shopping/toggle_item", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ index: index })
    });
    const data = await response.json();
    renderList(data.items);
}

async function deleteItem(index) {
    const response = await fetch("/Shopping/delete_item", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ index: index })
    });
    const data = await response.json();
    renderList(data.items);
}

async function clearChecked() {
    const response = await fetch("/Shopping/clear_checked", { method: "POST" });
    const data = await response.json();
    renderList(data.items);
}

function renderList(items) {
    Shopping_List_Container.innerHTML = "";

    const unchecked = items.filter(i => !i.checked);
    const checked = items.filter(i => i.checked);

    if (items.length === 0) {
        Shopping_List_Container.innerHTML = `<p class="Shopping_Empty">Your list is empty.<br>Add something above!</p>`;
        return;
    }

    unchecked.forEach(function (item) {
        Shopping_List_Container.appendChild(createItemEl(item));
    });

    if (checked.length > 0) {
        const divider = document.createElement("div");
        divider.classList.add("Shopping_Divider");
        divider.innerHTML = `<span>Checked off (${checked.length})</span><button class="Shopping_Clear_Btn">Clear</button>`;
        divider.querySelector(".Shopping_Clear_Btn").addEventListener("click", clearChecked);
        Shopping_List_Container.appendChild(divider);

        checked.forEach(function (item) {
            Shopping_List_Container.appendChild(createItemEl(item));
        });
    }
}

function createItemEl(item) {
    const el = document.createElement("div");
    el.classList.add("Shopping_Item");
    if (item.checked) el.classList.add("checked");

    el.innerHTML = `
        <button class="Shopping_Check_Btn ${item.checked ? "is-checked" : ""}">
            <span class="checkmark">✓</span>
        </button>
        <span class="Shopping_Item_Name">${escapeHTML(item.name)}</span>
        <button class="Shopping_Delete_Btn">✕</button>
    `;

    el.querySelector(".Shopping_Check_Btn").addEventListener("click", function () {
        toggleItem(item.index);
    });
    el.querySelector(".Shopping_Delete_Btn").addEventListener("click", function () {
        deleteItem(item.index);
    });

    return el;
}

function escapeHTML(str) {
    return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

Shopping_Add_Btn.addEventListener("click", async function () {
    await addItem(Shopping_Input.value);
    Shopping_Input.value = "";
});

Shopping_Input.addEventListener("keydown", async function (e) {
    if (e.key === "Enter") {
        await addItem(Shopping_Input.value);
        Shopping_Input.value = "";
    }
});

loadData();
loadShoppingList();
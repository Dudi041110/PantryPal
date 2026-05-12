const AI_img = document.getElementById("AI_Assistant");
const AIBG = document.getElementById("AIBG");
const D_Challenge = document.getElementById("Main");
const Points = document.getElementById("Points_Counter");
const Points_2 = document.getElementById("Points_Counter_2");
const Poppup = document.getElementById("Poppup_bg");
const Poppup_Screen = document.getElementById("Poppup");
const Shop = document.getElementById("Shop");
const Close_Shop = document.getElementById("Close_Poppup");
const Skin_Shop = document.getElementById("Skin_Shop");
const Nearing_Expiry = document.getElementById("Nearing_Expiry");
const Challenge_btn = document.getElementById("Challenge");

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
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(oldData)
    });
}

function applySkin() {
    AI_img.src = AI_Images[Equipped_AI];
    if (Equipped_AI === "Cat") {
        AIBG.className = "visible uncolored downies";
        AI_img.className = "Hover downies";
        D_Challenge.classList.remove("top", "robo", "def");
        D_Challenge.classList.add("cat");
    }

    else if (Equipped_AI === "Top") {
        AIBG.className = "visible colored downies";
        AI_img.className = "Hover downies";
        D_Challenge.classList.remove("cat", "robo", "def");
        D_Challenge.classList.add("top");
    }

    else if (Equipped_AI === "Chef") {
        AIBG.className = "hidden uppies";
        AI_img.className = "Hover uppies";
        D_Challenge.classList.remove("cat", "top", "robo", "def");
    }

    else if (Equipped_AI === "Robo") {
        AIBG.className = "hidden uppies";
        AI_img.className = "Hover uppies";
        D_Challenge.classList.remove("cat", "top", "def");
        D_Challenge.classList.add("robo");
    }

    else {
        AIBG.className = "hidden";
        AI_img.className = "Hover uppies";
        D_Challenge.classList.remove("cat", "top", "robo");
        D_Challenge.classList.add("def");
    }
}

function updatePoints() {
    Points.textContent = CurrentPoints;
    Points_2.textContent = CurrentPoints;
};

async function loadExpiry() {
    const response = await fetch("/get_expiry");
    const data = await response.json();
    const oldItems = Nearing_Expiry.querySelectorAll(".Expiry_Item");
    oldItems.forEach(function (item) {
        item.remove();
    });
    const sorted = Object.entries(data).sort(function (a, b) {
        return a[1] - b[1];
    });
    const closest = sorted.slice(0, 2);
    closest.forEach(function ([product, days]) {
        const item = document.createElement("div");
        item.classList.add("Expiry_Item");
        let width = 100 - (days / 7) * 100;
        if (width < 15) {
            width = 15;
        }
        item.innerHTML = `
            <div class="Expiry_Left">
                <div class="Expiry_Product">
                    ${product}
                </div>
                <div class="Expiry_Bar_BG">
                    <div
                        class="Expiry_Bar"
                        style="transform: scaleX(${width / 100});"
                    ></div>
                </div>
            </div>
            <div class="Expiry_Days">
                ${days} day${days !== 1 ? "s" : ""}
            </div>
        `;
        Nearing_Expiry.appendChild(item);
    });
}

function createShop() {
    Skin_Shop.innerHTML = "";
    AllSkins.forEach(function (skin) {
        const item = document.createElement("div");
        item.classList.add("Skin_Item");
        const owned = Owned.includes(skin);
        let buttonText = "";
        let priceText = "";
        if (owned) {
            buttonText = Equipped_AI === skin ? "Equipped" : "Equip";
        }
        else {
            buttonText = "Buy";
            priceText = Skin_Prices[skin] + " Coins";
        }
        item.innerHTML = `
            <div class="Skin_Info">
                <img src="${AI_Images[skin]}" class="Hover">
                <div>
                    <h2>${skin}</h2>
                    <p>${priceText}</p>
                </div>
            </div>

            <button class="Skin_Button">
                ${buttonText}
            </button>
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
            }
            else {
                Equipped_AI = skin;
                applySkin();
                await saveData();
                createShop();
            }
        });
        Skin_Shop.appendChild(item);
    });
};

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

Challenge_btn.addEventListener("click", function () {
    window.location.href = "/Challenge";
});

Nearing_Expiry.addEventListener("click", function () {
    window.location.href = "/Expiry";
});

Poppup.classList.add("hidden");

loadData();
loadExpiry();
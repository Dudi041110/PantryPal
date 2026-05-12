const Main = document.getElementById("Main");
const Points = document.getElementById("Points_Counter");
const Points_2 = document.getElementById("Points_Counter_2");
const Poppup = document.getElementById("Poppup_bg");
const Poppup_Screen = document.getElementById("Poppup");
const Shop = document.getElementById("Shop");
const Close_Shop = document.getElementById("Close_Poppup");
const Skin_Shop = document.getElementById("Skin_Shop");
const AI_img = document.getElementById("AI_Assistant");
const AIBG = document.getElementById("AIBG");

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

let CurrentPoints = 1000;

let Owned = ["Default"];

const AllSkins = ["Cat", "Top", "Chef", "Robo", "Default"];

async function loadData() {
    const response = await fetch("/Challenge/get_data");
    const data = await response.json();

    CurrentPoints = data.points;
    Equipped_AI = data.equipped_ai;
    Owned = data.owned;

    updatePoints();
    applySkin();
    createShop();

    setupRedeemButtons();

    if (data.redeemed_challenges) {
        data.redeemed_challenges.forEach(function(challengeID) {
            const button = document.querySelector(
                `[data-challenge="${challengeID}"]`
            );

            if (button) {
                button.textContent = "Redeemed";
                button.disabled = true;
            }
        });
    }
}

async function saveData() {
    const currentResponse = await fetch("/Challenge/get_data");
    const currentData = await currentResponse.json();

    await fetch("/Challenge/save_data", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            equipped_ai: Equipped_AI,
            points: CurrentPoints,
            owned: Owned,
            redeemed_challenges: currentData.redeemed_challenges || []
        })
    });
}

function applySkin() {
    AI_img.src = AI_Images[Equipped_AI];
    if (Equipped_AI === "Cat") {
        AIBG.className = "visible uncolored downies";
        AI_img.className = "Hover downies";
    }
    else if (Equipped_AI === "Top") {
        AIBG.className = "visible colored downies";
        AI_img.className = "Hover downies";
    }
    else if (Equipped_AI === "Chef") {
        AIBG.className = "hidden uppies";
        AI_img.className = "Hover uppies";
    }
    else if (Equipped_AI === "Robo") {
        AIBG.className = "hidden uppies";
        AI_img.className = "Hover uppies";
    }
    else {
        AIBG.className = "hidden";
        AI_img.className = "Hover uppies";
    }
}

function updatePoints() {
    Points.textContent = CurrentPoints;
    Points_2.textContent = CurrentPoints;
};

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

Poppup.classList.add("hidden");

async function loadExpiryItems() {
    const response = await fetch("/get_expiry");

    const data = await response.json();

    const sorted = Object.entries(data).sort(function(a, b) {
        return a[1] - b[1];
    });

    sorted.forEach(function([product, days]) {

        const card = document.createElement("div");

        card.classList.add("Challenge_Card");
        card.classList.add("Hover");

        let width = 100 - (days / 7) * 100;

        if (width < 15) {
            width = 15;
        }

        card.innerHTML = `
            <h1>${product}</h1>

            <p>
                ${days} day${days !== 1 ? "s" : ""} remaining
            </p>

            <div class="Expiry_Bar_BG"
                 style="
                    width: 85%;
                    margin-left: 27px;
                    margin-top: 10px;
                 ">

                <div
                    class="Expiry_Bar"
                    style="transform: scaleX(${width / 100});"
                ></div>

            </div>
        `;

        Main.appendChild(card);
    });
}

loadExpiryItems();
loadData();
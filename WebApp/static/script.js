const AI_img = document.getElementById("AI_Assistant");
const AIBG = document.getElementById("AIBG");

const AI_Images = {
    Cat: "/static/ai_assets/CatAI.png",
    Top: "/static/ai_assets/TopHatAI.png",
    Chef: "/static/ai_assets/ChefHatAI.png",
    Robo: "/static/ai_assets/RoboChefAI.png",
    Default: "/static/ai_assets/AbstractAI.png"
};

function getResult() {
    fetch("/get_result")
        .then(response => response.json())
        .then(data => {
            AI_img.src = AI_Images[data.result] || AI_Images.Default;
            if (AI_img.src === "/static/ai_assets/CatAI.png") {
                AIBG.classList.remove("hidden");
                AIBG.classList.add("visible");
            }
            else {
                AIBG.classList.remove("visible");
                AIBG.classList.add("hidden");
            }
        });
}

getResult();
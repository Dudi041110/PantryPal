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

            if (data.result === "Cat") {
                AIBG.classList.remove("hidden");
                AIBG.classList.remove("colored");
                AIBG.classList.remove("uppies");
                AIBG.classList.add("visible");
                AIBG.classList.add("uncolored");
                AIBG.classList.add("downies");

                AI_img.classList.remove("uppies");
                AI_img.classList.add("downies");
            }
            else if (data.result === "Top") {
                AIBG.classList.remove("hidden");
                AIBG.classList.remove("uncolored");
                AIBG.classList.remove("uppies");
                AIBG.classList.add("visible");
                AIBG.classList.add("colored");
                AIBG.classList.add("downies");

                AI_img.classList.remove("uppies");
                AI_img.classList.add("downies");
            }
            else if (data.result === "Chef") {
                AIBG.classList.remove("visible");
                AIBG.classList.add("hidden");
                AIBG.classList.add("uppies");
                AIBG.classList.remove("downies");

                AI_img.classList.remove("downies");
                AI_img.classList.add("uppies");
            }
            else if (data.result === "Robo") {
                AIBG.classList.remove("visible");
                AIBG.classList.add("hidden");
                AIBG.classList.add("uppies");
                AIBG.classList.remove("downies");

                AI_img.classList.remove("downies");
                AI_img.classList.add("uppies");
            }
            else {
                AIBG.classList.remove("visible");
                AIBG.classList.add("hidden");
            }
        });
}

getResult();
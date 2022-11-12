const accountPic = document.querySelector(".account-picture");
const accountName = document.getElementById("account-name");
const accountEmail = document.getElementById("account-email");
const pageTitle = document.querySelector("title");
const profileRedirect = document.getElementById("profile");
const addToFavorites = document.getElementById("add-to-favorites");
const removeFromFavorites = document.getElementById("remove-from-favorites");
const noPredictions = document.querySelector(".noPrediction"); 

const predictionCardContainer= document.querySelector("[data-prediction-cards-container]");
const publicPredictionsCount = document.getElementById("public-predictions-count");
const privatePredictionsCount = document.getElementById("private-predictions-count");
const noPredictionsPara = document.getElementById("no-predictions-account");
const userCardTemplate= document.querySelector("[data-predictions-template]");
var publicPredictionsCountRef = 0, privatePredictionsCountRef = 0;
var userPredictions, userName, favouritesData;

if(window.location.search == "") window.location.href = pageBaseURL+prefix+"/404"+suffix;
const userUID = window.location.search.slice(1,);
auth.onAuthStateChanged(user => {
    if(!user) window.location.href = `${prefix}/account${suffix}?profile-rd-${userUID}`;
    if(window.location.search.includes(user.uid)) window.location.href = pageBaseURL+prefix+"/account"+suffix;
    favourites();
});

var userRef  = database.ref(`/users/${userUID}/`);
userRef.once("value", data => {
    userPredictions = data.val();
    if(userPredictions == null) window.location.href = pageBaseURL+prefix+"/404"+suffix;

    for (const [idx, value] of Object.entries(userPredictions)){
        if(idx == "userData"){
            var displayName_formated = [];
            var displayName = value.displayName.split(" ");
            displayName.forEach(e => displayName_formated.push(e.slice(0,1).toUpperCase() + e.slice(1,)));
            userName = displayName_formated.join(" ").trim();

            accountPic.src = pageBaseURL+"/images/userProfilePicDefault.png";
            accountPic.src = value.photoURL;
            accountName.textContent =  userName;
            accountEmail.textContent = value.email;
            pageTitle.textContent = userName + " - Predictions";

        }else{
            if(value.password.password == "") publicPredictionsCountRef += 1;
            else privatePredictionsCountRef += 1;

            publicPredictionsCount.textContent = publicPredictionsCountRef;
            privatePredictionsCount.textContent = privatePredictionsCountRef;
            if(publicPredictionsCountRef + privatePredictionsCountRef === 0) noPredictionsPara.classList.remove("hide");
            else noPredictionsPara.classList.add("hide");
            
            const card = userCardTemplate.content.cloneNode(true).children[0];
            const predictionIdCard = card.querySelector("[data-prediction-id]");
            const predictionCard = card.querySelector("[data-prediction]");
            const releaseDateCard = card.querySelector("[data-release-date]");
            const predictionLock = card.querySelector("[data-lock]");
            const releasedIcon = card.querySelector("[data-released]");

            const Local_ReleaseDate = new Date(new Date(value.public.releaseTimestamp));
            const Local_ReleaseTime = Local_ReleaseDate.toTimeString().split(":");
            var prediction = value.predictionData.prediction;
            prediction = prediction.length>80 ? prediction.slice(0,78)+"..." : prediction;
            console.log(value);

            predictionIdCard.textContent = idx;
            predictionCard.textContent = "Prediction: "+ prediction;
            predictionCard.title = value.predictionData.prediction;
            releaseDateCard.textContent = `Release Date: ${Local_ReleaseDate.toDateString()}, at ${Local_ReleaseTime[0]}:${Local_ReleaseTime[1]}`;
                            
            if(value.password.password != ""){
                predictionLock.classList.add("fa-lock");
                predictionLock.title = "Prediction is Private";
            }else{
                predictionLock.classList.add("fa-unlock");
                predictionLock.title = "Prediction is Public";
            }
            if(Local_ReleaseDate < new Date()){
                releasedIcon.src = pageBaseURL+"/images/released-symbol.png";
                releasedIcon.title = "Prediction has been released";
            }else{
                releasedIcon.src = pageBaseURL+"/images/notReleased-symbol.png";
                releasedIcon.title = "Prediction has not been released";
            }

            card.href = `${prefix}/prediction${suffix}?id=${idx}&user=${userUID}`;
            console.log(card, predictionCardContainer);
            predictionCardContainer.append(card);
        }

        if(publicPredictionsCountRef+privatePredictionsCountRef == 0){
            noPredictions.classList.remove("hide");
        }
    }
}).then(() => {
    document.getElementById("load").remove();
    document.querySelector("template").remove();
});

// Add/Remove from favourites
function favourites(){

    var favouritesRef  = database.ref(`/users/${auth.currentUser.uid}/userData/favourites`);
    favouritesRef.once("value",(data) => {
        favouritesData = data.val();
        if(favouritesData != null && favouritesData.hasOwnProperty(userUID)){
            removeFromFavorites.removeAttribute("disabled");
            removeFromFavorites.classList.toggle("hide", false);
            addToFavorites.classList.toggle("hide", true);
        }else addToFavorites.removeAttribute("disabled");
    })

    addToFavorites.addEventListener('click', () => {
        database.ref(`/users/${auth.currentUser.uid}/userData/favourites`).update({ [userUID]: userName });
        removeFromFavorites.classList.toggle("hide", false);
        addToFavorites.classList.toggle("hide", true);
        removeFromFavorites.removeAttribute("disabled");
    })

    removeFromFavorites.addEventListener('click', () => {
        database.ref(`/users/${auth.currentUser.uid}/userData/favourites/${userUID}`).remove();
        removeFromFavorites.classList.toggle("hide", true);
        addToFavorites.classList.toggle("hide", false);
        addToFavorites.removeAttribute("disabled");
    })
}
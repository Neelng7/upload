const userCardTemplate= document.querySelector("[data-template]");
const predictionCardContainer= document.querySelector("[data-prediction-cards-container]");
const searchLoad = document.getElementById("search-load");
const noPredictionFound = document.querySelector(".no-prediction-found");
var dbData, dbPrediction, dbUser;
var filterOnlyArray = ["released", "unreleased", "public", "private"];
getData();

function getData(){
    searchLoad.classList.toggle("hide", false);
    noPredictionFound.classList.toggle("hide", true);
    predictionCardContainer.innerHTML = "";
    var dbDataRef  = database.ref('/data/');
    dbDataRef.once("value",(data) => {
        dbData = data.val();
        for (const [idx, value] of Object.entries(dbData)){
            if(idx === "user-data") return;
            if(idx.includes("@")){

            }else displayPredictions(idx, value)
        }
    });
}

function displayPredictions(id, uid){
    if(auth.currentUser && auth.currentUser.uid == uid) return;

    var dbUserRef  = database.ref(`/users/${uid}/userData/`);
    dbUserRef.once("value",(data) => {
        dbUser = data.val();
    })

    var dbPredictionRef  = database.ref(`/users/${uid}/${id}/`);
    dbPredictionRef.once("value",(data) => {
        dbPrediction = data.val();
        if(!dbPrediction) return;

        const card = userCardTemplate.content.cloneNode(true).children[0];
        const predictionIdCard = card.querySelector("[data-prediction-id]");
        const UserNameCard = card.querySelector("[data-user-name]");
        const UserEmailCard = card.querySelector("[data-user-email]");
        const releaseDateCard = card.querySelector("[data-release-date]");
        const predictionLock = card.querySelector("[data-lock]");
        const releasedIcon = card.querySelector("[data-released]");
        const publicTags = card.querySelector("[data-tags]");

        const Local_ReleaseDate = new Date(dbPrediction.public.releaseTimestamp);
        const Local_ReleaseTime = Local_ReleaseDate.toTimeString().split(":");

        predictionIdCard.textContent = id;
        releaseDateCard.textContent = `Release Date: ${Local_ReleaseDate.toDateString()}, at ${Local_ReleaseTime[0]}:${Local_ReleaseTime[1]}`;

        UserNameCard.textContent = "Name: " + dbUser.displayName;
        UserEmailCard.textContent = "Email: " + dbUser.email;

        if(dbPrediction.password.password != ""){
            predictionLock.classList.add("fa-lock");
            predictionLock.title = "Prediction is Private";
            if(!filterOnlyArray.includes("private")) return;
        }else{
            predictionLock.classList.add("fa-unlock");
            predictionLock.title = "Prediction is Public";
            publicTags.textContent = dbPrediction.public.tags;
            if(!filterOnlyArray.includes("public")) return;
        }
        if(Local_ReleaseDate < new Date()){
            releasedIcon.src = pageBaseURL+"/images/released-symbol.png";
            releasedIcon.title = "Prediction has been released";
            if(!filterOnlyArray.includes("released")) return;
        }else{
            releasedIcon.src = pageBaseURL+"/images/notReleased-symbol.png";
            releasedIcon.title = "Prediction has not been released";
            if(!filterOnlyArray.includes("unreleased")) return;
        }

        card.href = `${prefix}/prediction${suffix}?id=${id}&user=${uid}`;
        predictionCardContainer.append(card);
    }).then(() => {
        searchLoad.classList.toggle("hide", true);
        if(predictionCardContainer.children.length == 0) noPredictionFound.classList.toggle("hide", false);
        else noPredictionFound.classList.toggle("hide", true);
    });
}

//Search Only Filters
const searchOnlyFilters = document.querySelectorAll(".search-only-filter");
const searchOnlyReleased = document.getElementById("search-only-filters-released");
const searchOnlyUnreleased = document.getElementById("search-only-filters-unreleased");
const searchOnlyPublic = document.getElementById("search-only-filters-public");
const searchOnlyPrivate = document.getElementById("search-only-filters-private");

searchOnlyFilters.forEach(elm => {
    elm.checked = true;
    elm.addEventListener("change",  () => {
        filterOnlyArray[0] = searchOnlyReleased.checked ? "released" : null;
        filterOnlyArray[1] = searchOnlyUnreleased.checked ? "unreleased" : null;
        filterOnlyArray[2] = searchOnlyPublic.checked ? "public" : null;
        filterOnlyArray[3] = searchOnlyPrivate.checked ? "private" : null;
        getData();
    })
})

/*
Search Filters

Radio- search predictions/users/public tags
checkbox- only show- released predictions, public predictions , private predictions, 
*/

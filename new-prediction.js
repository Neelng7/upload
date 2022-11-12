auth.onAuthStateChanged(user => {
    if(!user) window.location.href = pageBaseURL+`${prefix}/account${suffix}?new-rd`;
});

//Toggle public/private visibility
const predictionVisibility = document.getElementById("prediction-visibility");
const publicContainer = document.querySelector(".public");
const privateContainer = document.querySelector(".private");

predictionVisibility.addEventListener('change', () => {
    publicContainer.classList.toggle("hide");
    privateContainer.classList.toggle("hide");
})

var today = new Date();
//convert timestamp to date by
new Date("timestamp");

var date = new Date("2022-4-5T18:48+05:30") > new Date("2022-04-05T18:47+04:00");
// Above date is 5th April 2022, at 6:48 PM, and it will convert the time from GMT+04:00 to GMT+05:30(a.k.a IST);

// All dates (upload + release) are converted are stored in GMT
// So not upload timezone - only release
//timediff is just calculated by adding/subtracting the GMT diff of the current timezone
/* GMT and UTC are the same:
    getTimezoneOffset() returns the difference between UTC time and local time.
    getTimezoneOffset() returns the difference in minutes.
    For example, if your time zone is GMT+2, -120 will be returned.
    eg var currentDiff = new Date().getTimezoneOffset();    return -330, so -330/-60 = 5.5
*/
//new Date().toDateString(); && new Date().toLocaleTimeString(); to get a display date.
//var localTimezone = "(" + new Date().toString().split("(")[1];

const newPredictionContainer = document.querySelector(".new-prediction-container");
const containerAlert = document.getElementById("alert");
const newPredictionSubmit = document.getElementById("new-prediction-submit");
const predictionID = document.getElementById("predictionID");
const prediction = document.getElementById("prediction");
const releaseDate = document.getElementById("release-date");
const releaseTime = document.getElementById("release-time");
const publicTags = document.getElementById("public-tags");
const password = document.getElementById("password");
var prohibitedSymbols = [".", "#", "$", "/", "[", "]", "\\", "@"];
var predictionIDs = [], tomorrow = today, users;

releaseDate.setAttribute("min", today.toISOString().split("T")[0]);
tomorrow.setDate(tomorrow.getDate() + 1);
releaseDate.value = tomorrow.toISOString().split("T")[0];
releaseTime.value = "00:00";

//Get all prediction IDs
var usersRef  = database.ref('/data/');
usersRef.once("value",(data) => {
    users = data.val();
    for (const [idx, value] of Object.entries(users)) predictionIDs.push(idx);
})

//Enter Button
document.addEventListener('keydown', (click) => {
    if(click.key == "Enter"){
        switch(document.activeElement){
            case publicTags: newPredictionSubmit.click(); break;
            case password: newPredictionSubmit.click(); break;
            default: break;
        }
    }
})

newPredictionSubmit.addEventListener('click', () => {
    var stopFn = 0
    prohibitedSymbols.forEach(e => {
        if(predictionID.value.includes(e)){
            containerAlert.innerHTML = `Prediction Id is invalid.<br> Prediction Id cannot contain "${e}"`;
            predictionID.focus();
            stopFn -= 1;
        }else stopFn += 1;
    })
    if(stopFn != prohibitedSymbols.length);
    else if(predictionID.value.trim() == ""){
        containerAlert.textContent = "Enter a prediction Id";
        predictionID.focus();
    }else if(predictionID.value.includes(" ")){
        containerAlert.textContent = "Prediction Id cannot contain a space";
        predictionID.focus(); 
    }else if(prediction.value.trim() == ""){
        containerAlert.textContent = "Enter a prediction";
        prediction.focus();
    }else if(releaseDate.value == ""){
        containerAlert.textContent = "Enter the release date";
        releaseDate.focus();
    }else if(releaseTime.value == ""){
        containerAlert.textContent = "Enter the release time";
        releaseTime.focus();
    }else if(predictionVisibility.value == "Private" && password.value == ""){
        containerAlert.textContent = "Please enter a password";
        password.focus();
    }else if(predictionVisibility.value == "Private" && password.value.includes(" ")){
        containerAlert.textContent = "Password cannot contain a space";
        password.focus();
    }else if(predictionIDs.includes(predictionID.value.trim())){
        containerAlert.innerHTML = "Prediction Id is already taken.<br> Please enter a unique ID.";
        predictionID.focus();
    }else uploadData();
})

async function uploadData(){
    if(predictionVisibility.value == "Public") password.value = "";
    var today = new Date();
    var releaseDateModified = new Date(releaseDate.value+"T"+releaseTime.value).toGMTString();
    var uploadDateModified = today.toGMTString();

    database.ref("/data/").update({
        [predictionID.value]: auth.currentUser.uid
    })

    await database.ref(`/users/${auth.currentUser.uid}/${predictionID.value}/private`).set({
        uploadDate: new Date(uploadDateModified).getTime()
    });
    await database.ref(`/users/${auth.currentUser.uid}/${predictionID.value}/password`).set({
        password: password.value
    });
    await database.ref(`/users/${auth.currentUser.uid}/${predictionID.value}/predictionData`).set({
        prediction: prediction.value
    });
    await database.ref(`/users/${auth.currentUser.uid}/${predictionID.value}/public`).set({
        releaseTimestamp: new Date(releaseDateModified).getTime(),
        tags: publicTags.value
    });

    console.log("Prediction Uploaded.")
    console.log(new Date(uploadDateModified).getTime(), uploadDateModified);
    alert("Prediction Uploaded");
    window.location.reload();
}

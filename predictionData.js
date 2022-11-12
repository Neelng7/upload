if(window.location.search == "") window.location.href = pageBaseURL+prefix+"/404"+suffix;
const pageTitle = document.querySelector("title");
pageTitle.textContent = "Predictions - " + window.location.search.slice(1,);

const accountPic = document.querySelector(".account-picture");
const accountName = document.getElementById("account-name");
const accountEmail = document.getElementById("account-email");
const profileRedirect = document.getElementById("profile");

const predictionWrapper = document.querySelector(".prediction-wrapper");
const editingOptionsSec = document.querySelector(".edit-section");
const lineSeparator = document.querySelector(".line-seperator");
const loadingIcon = document.getElementById("load");
const notReleasedFieldset = document.getElementById("notReleased");
const predictionPasswordContainer = document.getElementById("prediction-password-verification");
const notReleasedWrapper = document.querySelector(".not-released-wrapper");
const predictionId_h3 = document.getElementById("prediction-id");
const uploadDateSpan = document.getElementById("upload-date");
const releaseDateSpan = document.getElementById("release-date");
const mainPredictionTextarea = document.getElementById("main-prediction");

const predictionCardContainer= document.querySelector("[data-prediction-cards-container]");
const publicPredictionsCount = document.getElementById("public-predictions-count");
const privatePredictionsCount = document.getElementById("private-predictions-count");
const noPredictionsPara = document.getElementById("no-predictions-account");
const userCardTemplate= document.querySelector("[data-predictions-template]");
var publicPredictionsCountRef = 0, privatePredictionsCountRef = 0;
var userUID, userData, predictionData, myUID, predictionId, passwordDB;

const URLparameters = new URLSearchParams(window.location.search);
if(URLparameters.has('user')){
    userUID = URLparameters.get('user');
    predictionId = URLparameters.get('id');
    pageTitle.textContent = "Predictions - " + predictionId;
    predictionId_h3.textContent = predictionId;
    displayUserData(userUID);
    displayPrediction(userUID);
}

const viewProfile = document.getElementById("view-profile");
const editPredictionBtn = document.getElementById("edit-prediction");
const cacelEditBtn = document.getElementById("cacel-edit");
if(viewProfile) viewProfile.addEventListener('click', () => window.location.href = `${prefix}/user${suffix}?${userUID}`);

auth.onAuthStateChanged(user => {
    if(!user) return;
    myUID = user.uid;
    if(userUID == myUID){
        viewProfile.remove()
        editPredictionBtn.classList.toggle("hide", false);
    }else {
        editPredictionBtn.remove();
        cacelEditBtn.remove();
    }
}); 

//Enter Button
document.addEventListener('keydown', (click) => {
    if(click.key == "Enter" && document.activeElement == password) passwordSubmit.click();
})


function displayPrediction(userUID){
    var predictionDataRef  = database.ref(`/users/${userUID}/${predictionId}/`);
    predictionDataRef.once("value", data => {
        predictionData = data.val();

        var isOwner = false;
        if(auth.currentUser) isOwner = userUID == auth.currentUser.uid;
        if(predictionData == null) window.location.href = pageBaseURL+prefix+"/404"+suffix;

        const Local_UploadDate = new Date(new Date(predictionData.private.uploadDate));
        const Local_UplaodTime = Local_UploadDate.toTimeString().split(":");
        uploadDateSpan.textContent = `This prediction was uploaded on 
            ${Local_UploadDate.toDateString()}, at ${Local_UplaodTime[0]}:${Local_UplaodTime[1]}`;
        
        const Local_ReleaseDate = new Date(new Date(predictionData.public.releaseTimestamp));
        const Local_ReleaseTime = Local_ReleaseDate.toTimeString().split(":");

        if(Local_ReleaseDate <= new Date()){
            releaseDateSpan.textContent = `This prediction was released on
                ${Local_ReleaseDate.toDateString()}, at ${Local_ReleaseTime[0]}:${Local_ReleaseTime[1]}`;

            if(predictionData.password.password != ""){
                if(!auth.currentUser) window.location.href = pageBaseURL+`${prefix}/account${suffix}?private-rd-?id=${predictionId}&user=${userUID}`;
                if(isOwner){
                    mainPredictionTextarea.textContent = predictionData.predictionData.prediction;
                    notReleasedFieldset.remove();                    
                }else{
                    mainPredictionTextarea.classList.toggle("hide", true);
                    if(predictionPasswordContainer) predictionPasswordContainer.classList.toggle("hide", false);
                    notReleasedWrapper.classList.toggle("hide", true);
                }
            }else{
                mainPredictionTextarea.textContent = predictionData.predictionData.prediction;
                notReleasedFieldset.remove();
            }
        }else{
            releaseDateSpan.textContent = `This prediction will be released on
                ${Local_ReleaseDate.toDateString()}, at ${Local_ReleaseTime[0]}:${Local_ReleaseTime[1]}`;
            releaseDateSpan.style.color = "red";
            if(isOwner){
                mainPredictionTextarea.textContent = predictionData.predictionData.prediction;
                notReleasedFieldset.remove();
            }else mainPredictionTextarea.classList.toggle("hide", true);
        }
        if(isOwner){
            displayEditDetailts(predictionData);
            saveEditedChanges();
        }
    }).then(() => {
        predictionWrapper.classList.remove("hide");
        loadingIcon.remove();
        lineSeparator.classList.toggle("hide", true);
    });
}

function displayUserData(userUID){
    var userRef  = database.ref(`/users/${userUID}/`);
    userRef.once("value", data => {
        userPredictions = data.val();
        if(userPredictions == null) window.location.href = pageBaseURL+prefix+"/404"+suffix;

        for (const [idx, value] of Object.entries(userPredictions)){
            if(idx == "userData"){
                var displayName_formated = [];
                var displayName = value.displayName.split(" ");
                displayName.forEach(e => displayName_formated.push(e.slice(0,1).toUpperCase() + e.slice(1,)));

                accountPic.src = pageBaseURL+"/images/userProfilePicDefault.png";
                accountPic.src = value.photoURL;
                accountName.textContent =  displayName_formated.join(" ").trim();
                accountEmail.textContent = value.email;
                profileRedirect.href = `${prefix}/user${suffix}?${userUID}`;

            }else{
                if(value.password.password == "") publicPredictionsCountRef += 1;
                else privatePredictionsCountRef += 1;
                publicPredictionsCount.textContent = publicPredictionsCountRef;
                privatePredictionsCount.textContent = privatePredictionsCountRef;
            }
        }
    })
}

const passwordReveal = document.querySelector(".password-reveal");
const password = document.getElementById("password-verification-inp");
const passwordSubmit = document.getElementById("password-submit");

if(passwordReveal) passwordReveal.addEventListener('click', () => {
    passwordReveal.classList.toggle("fa-eye");
    passwordReveal.classList.toggle("fa-eye-slash");
    password.type = password.type == "password" ? "text" : "password";
});

if(passwordSubmit) passwordSubmit.addEventListener('click', () => {
    database.ref(`/users/${userUID}/${predictionId}/password-verify/`).update({
        [auth.currentUser.uid]: password.value
    }).then(() => {
        var passwordDBRef  = database.ref(`/users/${userUID}/${predictionId}/`);
        passwordDBRef.once("value", data => {
            passwordDB = data.val();
            if(password.value == passwordDB.password.password){
                mainPredictionTextarea.textContent = predictionData.predictionData.prediction;
                notReleasedFieldset.remove();
                mainPredictionTextarea.classList.remove("hide");
                database.ref(`/users/${userUID}/${predictionId}/password-verify/${auth.currentUser.uid}`).remove();
            }else{
                document.getElementById("password-alert").textContent = "Password is invalid";
                password.focus();
            }
        })
    })
})

const predictionVisibility = document.getElementById("prediction-visibility");
const publicContainer = document.querySelector(".public");
const privateContainer = document.querySelector(".private");

predictionVisibility.addEventListener('change', () => {
    publicContainer.classList.toggle("hide");
    privateContainer.classList.toggle("hide");
})

//Edit section
const subheading = document.getElementById("subheading");
const releaseDate_edit = document.getElementById("release-date-edit");
const releaseTime_edit = document.getElementById("release-time");
const visibility_edit = document.getElementById("prediction-visibility");
const publicTags_edit = document.getElementById("public-tags");
const password_edit = document.getElementById("password-edit");
const editElms = document.querySelectorAll(".edit");
const saveEditedChangesBtn = document.getElementById("save-edited-changes");
var isEdited = false

const copyLink = document.getElementById("copy-link");
if(copyLink) copyLink.addEventListener('click', () => {;
    window.navigator.clipboard.writeText("https://neelng7.github.io/prefute/prediction"+window.location.search);
    copyLink.textContent = "Copied!";
    setTimeout(() => {copyLink.innerHTML = 'Copy <i class="fa-solid fa-copy"></i'}, 3000);
})

if(cacelEditBtn) cacelEditBtn.addEventListener('click', () => {
    if(!isEdited) cancelEditSec();
    else if(confirm("Leave unsaved changes?")){
        displayEditDetailts(predictionData);
        cancelEditSec();
    }
})

function cancelEditSec(){
    subheading.textContent = "";
    lineSeparator.classList.toggle("hide", true);
    predictionWrapper.style.border = "1px solid black";
    cacelEditBtn.classList.toggle("hide", true);
    editPredictionBtn.classList.toggle("hide", false);
    editingOptionsSec.classList.toggle("hide", true);
    editPasswordReveal.classList.toggle("fa-eye", true);
    editPasswordReveal.classList.toggle("fa-eye-slash", false);
    password_edit.type = "password";
}

if(editPredictionBtn) editPredictionBtn.addEventListener('click', () => {
    subheading.textContent = "Edit Prediction";
    lineSeparator.classList.toggle("hide", false);
    predictionWrapper.style.border = "none";
    cacelEditBtn.classList.toggle("hide", false);
    editPredictionBtn.classList.toggle("hide", true);
    editingOptionsSec.classList.toggle("hide", false);
})

function displayEditDetailts(predictionData){
    predictionPasswordContainer.remove();
    const Local_ReleaseDate = new Date(predictionData.public.releaseTimestamp);
    const Local_ReleaseTime = Local_ReleaseDate.toTimeString().split(":");

    releaseDate_edit.value = Local_ReleaseDate.toISOString().split("T")[0];
    releaseTime_edit.value = Local_ReleaseTime[0] +":"+ Local_ReleaseTime[1];
    if(predictionData.password.password != ""){
        visibility_edit.value = "Private";
        publicContainer.classList.toggle("hide", true);
        privateContainer.classList.toggle("hide", false);
        password_edit.value = predictionData.password.password;
    }else publicTags_edit.value = predictionData.public.tags;
}

const editPasswordReveal = document.querySelector(".password-reveal#reveal-edit");
editPasswordReveal.addEventListener("click", () => {
    editPasswordReveal.classList.toggle("fa-eye");
    editPasswordReveal.classList.toggle("fa-eye-slash");
    password_edit.type = password_edit.type == "password" ? "text" : "password";
})

function saveEditedChanges(){
    editElms.forEach(inp => {
        inp.addEventListener('change', () => { isEdited = true });
    })
    saveEditedChangesBtn.addEventListener('click', uploadData);
}

async function uploadData(){
    if(visibility_edit.value == "Public") password_edit.value = "";
    else if(visibility_edit.value == "Private"){
        if(password_edit.value == "" || password_edit.includes(" ")){
            alert("Please enter a valid password");
            password_edit.focus();
            return;
        }
    }
    var releaseDateModified = new Date(releaseDate_edit.value+"T"+releaseTime_edit.value).toGMTString();

    await database.ref(`/users/${auth.currentUser.uid}/${predictionId}/password`).set({
        password: password_edit.value
    });
    await database.ref(`/users/${auth.currentUser.uid}/${predictionId}/public`).update({
        releaseTimestamp: new Date(releaseDateModified).getTime(),
    });
    if(visibility_edit.value == "Public") await database.ref(`/users/${auth.currentUser.uid}/${predictionId}/public`).update({
        tags: publicTags_edit.value
    });
    console.log("Prediction Edited");
    window.location.reload();
}

//delete Prediction
const deletePredictionBtn = document.getElementById("delete-prediction");
if(deletePredictionBtn) deletePredictionBtn.addEventListener('click', () => {
    var conformation = prompt("Enter prediction Id to delete prediction");
    if(conformation != null){
        if(conformation == predictionId){
            database.ref(`/users/${auth.currentUser.uid}/${predictionId}/public`).remove().then(() => {
                database.ref(`/users/${auth.currentUser.uid}/${predictionId}`).remove().then(() => {
                }).then(() => {
                        database.ref(`/data/${predictionId}`).remove().then(() => {
                            console.log("Prediction Deleted");
                            alert("Prediction Deleted");
                            window.location.href = pageBaseURL+"/account"+suffix;
                    })
                })
            })
        }else{
            alert("Prediction Id is incorrect\nPrediction not deleted");
        }
    }
})


//check if passs is correct in firebae only - them read and write should be user uid == uid

//Rules
// add read access if password is correct
// firbase: uid: password
// rules: if ...parent().child(auth.uid).val() == password.val() ....

// only read prediction password if auth.uid == user.uid
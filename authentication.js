const accountTitle = document.getElementById("account-title");
const accountDetailsContainer = document.querySelector(".account-details-container");
const signInContainer = document.querySelector(".signin-field");
const signUpContainer = document.querySelector(".signUp-field");

const emailSignIn = document.getElementById("email-signIn");
const passwordSignIn = document.getElementById("password-signIn");
const confirmPassword = document.getElementById("confirmPassword");
const emailSignUp = document.getElementById("email-signUp");
const passwordSignUp = document.getElementById("password-signUp");
const signUpName = document.getElementById("signup-name");
const DOBsignUp = document.getElementById("signup-dob");
const phoneNoSignUp = document.getElementById("phone");
const passwordReveal = document.querySelectorAll(".password-reveal");
const predictionCardContainer= document.querySelector("[data-prediction-cards-container]");
const userCardTemplate= document.querySelector("[data-predictions-template]");
var storage = firebase.storage().ref(), redirect = "";

auth.onAuthStateChanged(user => {
    if (user) {
        if(redirect === "delete-account") deleteUserAccount(user);
        else if(redirect === "change-password") changeUserPassword();
        else if(redirect === "new-precition") window.location.href = pageBaseURL+prefix+"/new"+suffix;
        else if(redirect.includes("profile-rd")){
            if(redirect.split("-")[2] != user.uid) window.open(`${prefix}/user${suffix}?${redirect.split("-")[2]}`);
            window.location.href = pageBaseURL+prefix+"/account"+suffix;
        }else if(window.location.search.includes("private-rd")) window.location.href = pageBaseURL+prefix+"/prediction"+suffix+redirect.split("-")[2];
        else {
            hideAllElements(accountDetailsContainer, "My Account");
            diplayAccountDetails(user);
            isEmailVerified();
            populateFavourites();
        }
    }else{
        hideAllElements(signInContainer, "Sign In");
        if(window.location.search == "?new-rd"){
            signinAlert.textContent = "Sign In to make a new prediction";
            signinMssg.classList.add("hide");
            redirect = "new-precition";
        }else if(window.location.search.includes("profile-rd")){
            signinAlert.textContent = "Sign In to view a profile";
            signinMssg.classList.add("hide");
            redirect = window.location.search;
        }else if(window.location.search.includes("private-rd")){
            signinAlert.textContent = "Sign In to view a private prediction";
            signinMssg.classList.add("hide");
            redirect = window.location.search;
        }
    }
});

//set max date attribute
var dateLimit = new Date(); 
dateLimit.setFullYear(dateLimit.getFullYear() - 10);
var dateLimit_day = dateLimit.getDate()<10 ? `0${dateLimit.getDate()}` : dateLimit.getDate();
var dateLimit_month = dateLimit.getMonth()<10 ? `0${dateLimit.getMonth()}` : dateLimit.getMonth();
dateLimit = dateLimit.getFullYear() +'-'+ dateLimit_month +'-'+ dateLimit_day;
DOBsignUp.setAttribute('max', dateLimit);


// Sign in/ Sign up/ Sign out -
const signUpButton = document.getElementById("signup-btn");
const signInButton = document.getElementById("signin-btn");
const signOutButton = document.getElementById("signout-btn");
const signinAlert = document.getElementById("signin-alert");

signUpButton.addEventListener("click", signup_verify);
signInButton.addEventListener("click", signInUser);
signOutButton.addEventListener("click", () => {
   if(confirm("Sign out of account?")) auth.signOut();
});

function signInUser(){
    if(emailSignIn.value.trim()==""||passwordSignIn.value.trim()=="") signinAlert.textContent = "Enter all the given info";
    else{
        auth.signInWithEmailAndPassword(emailSignIn.value, passwordSignIn.value)
        .then(() => signinAlert.textContent = "")
        .catch((error) => {
            if(error.code = "auth/wrong-password"){
                signinAlert.textContent = "Password is invalid.";
                passwordSignIn.focus();
            }else signinAlert.textContent = error.message;
        });
    }
}

const callSignUpBtn = document.getElementById("call-signup-btn");
const callSignInBtn = document.getElementById("call-signin-btn");
callSignUpBtn.addEventListener("click", () => {hideAllElements(signUpContainer, "Sign Up"); redirect="";});
callSignInBtn.addEventListener("click", () => {hideAllElements(signInContainer, "Sign In"); redirect="";});

const signupAlert = document.getElementById("signup-alert");

//Enter Button
document.addEventListener('keydown', (click) => {
    if(click.key == "Enter"){
        switch(document.activeElement){
            case passwordSignIn: signInUser(); break;
            case confirmPassword: signup_verify(); break;
            case sendForgotPasswordEmail: sendForgotPasswordEmail.click(); break;
            case resetPasswordNewConfirm: saveNewPassword.click(); break;
            default: break;
        }
    }
})

function signup_verify(){
    if(signUpName.value.trim() == ""){
        signupAlert.textContent = "Please enter a name";
        signUpName.focus();
    }else if(signUpName.value.length > 50){
        signupAlert.textContent = "Name must be less than 50 characters";
        signUpName.focus();
    }else if(DOBsignUp.value == ""){
        signupAlert.textContent = "Please enter your date of birth";
        DOBsignUp.focus();
    }else if(emailSignUp.value.trim() == ""){
        signupAlert.textContent = "Please enter an email";
        emailSignUp.focus();
    }else if(validateEmail(emailSignUp.value.trim()) == ""){
        signupAlert.textContent = "Email is badly formatted";
        emailSignUp.focus();
    }else if(passwordSignUp.value.trim() == ""){
        signupAlert.textContent = "Please enter a password";
        passwordSignUp.focus();
    }else if(confirmPassword.value.trim() == ""){
        signupAlert.textContent = "Please enter your password again";
        confirmPassword.focus();
    }else if(passwordSignUp.value != confirmPassword.value){ 
        signupAlert.textContent = "Passwords do not match";
        passwordSignUp.focus();
    }else{
        signupAlert.textContent = "";
        signup();}
}

//Sign Up with email
function signup(){   
    auth.createUserWithEmailAndPassword(emailSignUp.value, passwordSignUp.value)
    .then(userCredential => addUserInfo(userCredential))
    .catch((error) => {
        const errorMessage = error.message;
        alert(errorMessage);
    })   
}

async function addUserInfo(userCredential){
    const user = userCredential.user;
    const file = await fetch(`https://ui-avatars.com/api/?background=random&name=${signUpName.value.split(" ").join("+")}`);
    const imageBlob = await file.blob()
    const reader = new FileReader();
    reader.readAsDataURL(imageBlob);
    reader.onloadend = async () => {
        await user.updateProfile({
            displayName: signUpName.value,
            photoURL: reader.result
        })
        await database.ref(`/users/${userCredential.user.uid}/userData/`).update({
            displayName: signUpName.value,
            photoURL: reader.result,
            email: emailSignUp.value,
            birthDate: DOBsignUp.value
        });
        await database.ref("/data/").update({
            [`+${emailSignUp.value.split(".").join("!")}`]: auth.currentUser.uid
        })
        window.location.reload();   
    }
}

//reveal password - toggle input type
passwordReveal.forEach(icon => {
    icon.addEventListener("click", () => {
        icon.classList.toggle("fa-eye");
        icon.classList.toggle("fa-eye-slash");
        var inpReveal = document.getElementById(icon.id.split("_")[1]);
        inpReveal.type = inpReveal.type == "password" ? "text" : "password";
    })
})

//Account Info
const accountPic = document.querySelectorAll(".account-picture");
const accountName = document.getElementById("account-name");
const accountEmail = document.getElementById("account-email");

const forgotPasswordBtn = document.getElementById("forgot-password");
const forgotPasswordContainer = document.querySelector(".forgot-password-container");
const forgotPasswordInp = document.getElementById("forgot-pass-inp");
const sendForgotPasswordEmail = document.getElementById("send-forgotP-email");
const forgotPasswordAlert = document.getElementById("forgot-password-alert");

const changePasswordContainer = document.querySelector(".change-password-container");
const resetPasswordNew = document.getElementById("reset-pass-new");
const resetPasswordNewConfirm = document.getElementById("reset-pass-new-confirm");
const saveNewPassword = document.getElementById("save-new-password");
const changePasswordAlert = document.getElementById("change-password-alert");

const editDisplayNameInp = document.getElementById("edit-display-name");
const editDob = document.getElementById("edit-dob");
const editEmailInp = document.getElementById("edit-email");

const publicPredictionsCount = document.getElementById("public-predictions-count");
const privatePredictionsCount = document.getElementById("private-predictions-count");
const noPredictionsPara = document.getElementById("no-predictions-account");
const loadSpan = document.getElementById("load");
var userPredictions, userDOB;

function diplayAccountDetails(user){
    var publicPredictionsCountRef = 0, privatePredictionsCountRef = 0;

    predictionCardContainer.innerHTML = "";
    var displayName_formated = [];
    var displayName = user.displayName.split(" ");
    displayName.forEach(e => displayName_formated.push(e.slice(0,1).toUpperCase() + e.slice(1,)));
    
    accountPic[0].src = pageBaseURL+"/images/userProfilePicDefault.png";
    accountPic[0].src = user.photoURL;
    accountName.textContent =  displayName_formated.join(" ").trim();
    accountEmail.textContent = user.email;

    editDisplayNameInp.value = displayName_formated.join(" ").trim();
    editEmailInp.value = user.email;
    editEmailInp.title = user.email;
    accountPic[1].src = user.photoURL;

    const localPublicCount = window.localStorage.getItem('public');
    const localPrivateCount = window.localStorage.getItem('private');
    if(localPublicCount) publicPredictionsCount.textContent = localPublicCount;
    if(localPrivateCount) privatePredictionsCount.textContent = localPrivateCount;

    var userPredictionsRef  = database.ref(`/users/${user.uid}/`);
    userPredictionsRef.once("value",(data) => {
        userPredictions = data.val();
        userDOB = userPredictions.userData.birthDate;

        for (const [idx, value] of Object.entries(userPredictions)){
            if(idx != "userData"){
                if(value.password.password == "") publicPredictionsCountRef += 1;
                else privatePredictionsCountRef += 1;
            }
        }
        publicPredictionsCount.textContent = publicPredictionsCountRef;
        privatePredictionsCount.textContent = privatePredictionsCountRef;
        if(publicPredictionsCountRef + privatePredictionsCountRef === 0) noPredictionsPara.classList.remove("hide");
        else noPredictionsPara.classList.add("hide");
        window.localStorage.setItem('public', publicPredictionsCountRef);
        window.localStorage.setItem('private', privatePredictionsCountRef);
    }).then(() => {
        editDob.value = userDOB;
        displayUserPredictions();
    })
}

function displayUserPredictions(){
    var userPredictionsRef  = database.ref(`/users/${auth.currentUser.uid}/`);
    userPredictionsRef.once("value", data => {
        userPredictions = data.val();
        for (const [idx, value] of Object.entries(userPredictions)){
            if(idx != "userData"){
                const card = userCardTemplate.content.cloneNode(true).children[0];
                const predictionIdCard = card.querySelector("[data-prediction-id]");
                const predictionCard = card.querySelector("[data-prediction]");
                const releaseDateCard = card.querySelector("[data-release-date]");
                const predictionLock = card.querySelector("[data-lock]");
                const releasedIcon = card.querySelector("[data-released]");

                const Local_ReleaseDate = new Date(value.public.releaseTimestamp);
                const Local_ReleaseTime = Local_ReleaseDate.toTimeString().split(":");
                var prediction = value.predictionData.prediction;
                prediction = prediction.length>80 ? prediction.slice(0,78)+"..." : prediction;

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

                card.href = `${prefix}/prediction${suffix}?id=${idx}&user=${auth.currentUser.uid}`;
                predictionCardContainer.append(card);
            }
        }
    }).then(() => {
        if(loadSpan) loadSpan.remove();
    });
}

//fogot password
var actionCodeSettings = {
    url: 'https://neelng7.github.io/prefute/account',
    handleCodeInApp: true
}

const backButtonFP = document.getElementById("back-button-fp");
const backButtonCP = document.getElementById("back-button-cp");
backButtonFP.addEventListener('click', () => hideAllElements(signInContainer, "Sign In"));
backButtonCP.addEventListener('click', () => hideAllElements(accountDetailsContainer, "My Account"));

forgotPasswordBtn.addEventListener('click', () => hideAllElements(forgotPasswordContainer, "Forgot Password"));

sendForgotPasswordEmail.addEventListener('click', () => {
    if(validateEmail(forgotPasswordInp.value) != ""){editProfileModal
        auth.sendPasswordResetEmail(forgotPasswordInp.value, actionCodeSettings).then(() => {
            forgotPasswordAlert.textContent = "An email has been sent to you with instrustions on how to reset your password.";
        });
    }else forgotPasswordAlert.textContent = "An Error Occured. Please try again later.";
})

const validateEmail = (email) => {
    return String(email).toLowerCase().match(
        /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
      );
}


//Edit Profile
const editProfileBtn = document.getElementById("edit-profile-btn");
const editProfileContainer = document.querySelector(".edit-profile-container");
const editProfileModal = document.getElementById("edit-profile-dialog");
const exitModal = document.getElementById("exit-modal");
const accountChangePasswordBtn = document.getElementById("edit-account-change-password");
const deleteAccButton = document.getElementById("delete-account");

const edit_AccountSignoutBtn = document.getElementById("edit-account-signout-btn");
edit_AccountSignoutBtn.addEventListener('click', () => {
    if(confirm("Sign Out of Account?")) auth.signOut();
})

editProfileBtn.addEventListener('click', () => editProfileModal.showModal());
exitModal.addEventListener("click", () => {
    if(accountEditChanges.file != null || accountEditChanges.name != null || accountEditChanges.dob != null){
        if(confirm("Leave Unsaved Changes?")){
            editProfileModal.close();
            resetAccountChanges();
            }
    }else editProfileModal.close();
});

//delete user
const signinMssg = document.getElementById("signin-mssg");
deleteAccButton.addEventListener('click', () => {
    auth.signOut();
    emailSignIn.value = auth.currentUser.email;
    passwordSignIn.value = "";
    signinMssg.textContent = ""
    passwordSignIn.focus();
    signinAlert.classList.toggle("alert", true);
    signinAlert.textContent = "Please sign in to delete your account.";
    redirect = "delete-account";  
})

function deleteUserAccount(user){
    if(confirm("Delete Account?")){
        user.delete()
        .then(() => {
            console.log('Successfully deleted user');
            alert("Account Deleted");
            window.location.reload();
        })
        .catch((error) => {
            alert("Error. Account could not de deleted. Please Try again later.\
            \nIf the error persists, you can contact us or report the problem.");
            console.log("Error. User not deleted", error.message);
            console.error(error);
        });
    }else window.location.reload();
    redirect = "";
}

//change password
accountChangePasswordBtn.addEventListener('click', () => {
    auth.signOut();
    signinAlert.textContent = "Please sign in again to change your password.";
    signinMssg.textContent = "";
    emailSignIn.value = auth.currentUser.email;
    passwordSignIn.value = "";
    passwordSignIn.focus();
    redirect = "change-password";
});

function changeUserPassword(){
    hideAllElements(changePasswordContainer, "Change Password");
    redirect = "";
}

saveNewPassword.addEventListener('click', () => {
    var user = auth.currentUser;
    if(resetPasswordNew.value == resetPasswordNewConfirm.value){
        user.updatePassword(resetPasswordNew.value).then(() => {
            alert("Password has been changed.");
            window.location.reload();
        })
    }else changePasswordAlert.textContent = "Passwords do not match";
})

//email verification
const isEmailVerifiedSpan = document.getElementById("is-email-verified");
const verifyEmailContainer = document.querySelector(".verify-email-container");
const verifyEmail = document.getElementById("verify-email");

function isEmailVerified(){
    var user = auth.currentUser;
    if(!user.emailVerified){
        isEmailVerifiedSpan.textContent = "Email is not verified: ";
        verifyEmail.classList.remove("hide");
        // document.getElementById("exclamation").innerHTML = "&#xf06a";
    }else{
        verifyEmail.classList.add("hide");
        isEmailVerifiedSpan.textContent = "Email Verified"; 
        document.getElementById("check-icon").innerHTML = "&#xf058;";
    }
}

verifyEmail.addEventListener('click', () => {
    if(confirm("Verify Email?")){
        var user = auth.currentUser
        auth.currentUser.sendEmailVerification(actionCodeSettings).then(() => {
            alert(`An email has been sent to ${user.email}`);
        }).catch(error => console.error("error sending, link: "+error));
    } 
});

//Change display name and Profile Pic
const uploadProfilePicLabel = document.getElementById("upload-profile-pic-label");
const imageName = document.getElementById("imageName");
const uploadProfilePic = document.getElementById("upload-profile-pic-inp");
const deleteProfilePic = document.getElementById("delete-profile-pic");
const editDisplayName = document.getElementById("edit-display-name");
const saveAccountChanges = document.getElementById("save-account-changes");
var accountEditChanges = {file: null, name: null, dob: null};

editDisplayName.addEventListener("input", () => accountEditChanges.name = editDisplayName.value);
editDob.addEventListener('input', () => accountEditChanges.dob = editDob.value);

uploadProfilePic.addEventListener("change", () => {
    var file = uploadProfilePic.files[0];
    
    if(file.type == "image/jpeg" || file.type == "image/jpg" || file.type == "image/png"){
    accountEditChanges.file = uploadProfilePic.files[0];

    const reader = new FileReader();
    imageName.innerText = file.name;
    
    reader.addEventListener("load", () => {
        const uploaded_image = reader.result;
        accountPic[1].src = uploaded_image.toString();
    });
    reader.readAsDataURL(uploadProfilePic.files[0]);
    
    }else alert("File Type is inavlid \nUploaded file is not an image");
})

function resetAccountChanges(){
    accountEditChanges.file = null;
    accountEditChanges.name = null;
    accountEditChanges.dob = null;

    editDob.value = userDOB;
    accountPic[1].src = auth.currentUser.photoURL;
    editDisplayNameInp.value = auth.currentUser.displayName;
    imageName.textContent = "";
}

deleteProfilePic.addEventListener('click',() =>{
    if(accountEditChanges.file){
        accountEditChanges.file = null;
        accountPic[1].src = pageBaseURL+"/images/userProfilePicDefault.png";
        accountPic[1].src = auth.currentUser.photoURL;
        imageName.textContent = "";
        return;
    }

    if(!auth.currentUser.photoURL.includes("firebasestorage")){
        alert("No profile picture found.\nFile not deleted.");
    }else if(confirm("Delete Image?")){
        var user = auth.currentUser;
        var imageRef = storage.child('profile-picture/' + user.uid);
        imageRef.delete().then(async function(){
            console.log("Image Deleted");
            const file = await fetch(`https://ui-avatars.com/api/?background=random&name=${user.displayName.split(" ").join("+")}`);
            const imageBlob = await file.blob()
            const reader = new FileReader();
            reader.readAsDataURL(imageBlob);
            reader.onloadend = () => {
                user.updateProfile({
                    photoURL: reader.result
                }).then(() => { 
                    alert("Image Deleted");
                    window.location.reload()});
            }
        }).catch(error => {if(error.code == 404) alert("No file deleted")});
    }
})

//Save Changes - Edit Account
saveAccountChanges.addEventListener('click', () => {
    var user = auth.currentUser;
    
    if(accountEditChanges.dob){
        saveAccountChanges.setAttribute("disabled", '');

        database.ref(`/users/${user.uid}/userData`).update({
            birthDate: accountEditChanges.dob
        }).then(() => {
            if(accountEditChanges.name == null && accountEditChanges.file == null) window.location.reload();
        });
    }

    if(accountEditChanges.name){ 
        saveAccountChanges.setAttribute("disabled", '');

        if(user.photoURL.includes("firebasestorage") || accountEditChanges.file){
            user.updateProfile({displayName: accountEditChanges.name}).then(() => {
                database.ref("/users/"+user.uid+"/userData/").update({displayName: accountEditChanges.name}).then(() => {
                    if(accountEditChanges.file) uploadProfilePic_Storage();
                    else window.location.reload();
                })
            });
        }else{
            fetch(`https://ui-avatars.com/api/?background=random&name=${accountEditChanges.name.split(" ").join("+")}`)
                .then(file => {
                    const reader = new FileReader();
                    file.blob().then(imageBlob => {
                        reader.readAsDataURL(imageBlob);
                        reader.onloadend = () => {
                            user.updateProfile({
                                displayName: accountEditChanges.name,
                                photoURL: reader.result
                            }).then(() => {
                                database.ref("/users/"+user.uid+"/userData/").update({
                                    displayName: accountEditChanges.name,
                                    photoURL: reader.result
                                }).then(() => window.location.reload());
                            });
                        }
                    })
                })
        }
    }else if(accountEditChanges.file) uploadProfilePic_Storage();
    else alert("No unsaved changes");
})

function uploadProfilePic_Storage(){
    var user = auth.currentUser;
    var file = accountEditChanges.file;
    const fileName = "profile-picture/" +user.uid;
    const metadata = { contentType: file.type };

    saveAccountChanges.setAttribute("disabled", '');

    storage.child(fileName).put(file, metadata)
        .then(snapshot => {
            var urlRef = snapshot.ref.getDownloadURL();
            urlRef.then(url => {
                user.updateProfile({photoURL: url}).then(() => {
                    database.ref("/users/"+user.uid+"/userData/").update({photoURL: url})
                        .then(() => window.location.reload());
                });
            }) 
        })
        .catch(err => console.log(err));
}

//View Favourites 
const viewFavouritesBtn = document.getElementById("view-favourites");
const favouriteDialog = document.getElementById("favourites-dialog");
const exitFavourtiesModal = document.getElementById("exit-favourties-modal");
const favouritesCardTemplate = document.querySelector("[data-favourites-template]");
const favouritesCardContainer = document.querySelector("[data-favourite-cards-container]");
const noFavourites = document.getElementById("noFavourites");
var favouritesData, allfavouritesData;

exitFavourtiesModal.addEventListener('click', () => favouriteDialog.close());
viewFavouritesBtn.addEventListener('click', () => favouriteDialog.showModal());

function populateFavourites(){
    favouritesCardContainer.innerHTML = ""; 
    var allfavouritesRef  = database.ref(`/users/${auth.currentUser.uid}/userData/favourites`);
    allfavouritesRef.once("value",(data) => {
        allfavouritesData = data.val();
        if(allfavouritesData == null){
            noFavourites.classList.toggle("hide", false);
            return;
        }noFavourites.classList.add("hide");

        for (const [idx, value] of Object.entries(allfavouritesData)){
            
            const favcard = favouritesCardTemplate.content.cloneNode(true).children[0];
            const favUserPfp = favcard.querySelector("[data-user-pfp]");
            const favUserName = favcard.querySelector("[data-user-name]");
            const faveUserEmail = favcard.querySelector("[data-email]");
            const faveUser_viewProfile = favcard.querySelector("[data-view-profile]");
            const removeFromFavorites = favcard.querySelector("[data-remove-profile]");

            faveUser_viewProfile.href = pageBaseURL+`/user${suffix}?${idx}`;
            removeFromFavorites.addEventListener('click', () => {
                database.ref(`/users/${auth.currentUser.uid}/userData/favourites/${idx}`).remove();
                removeFromFavorites.classList.toggle("hide", true);
                faveUser_viewProfile.textContent = "User Removed";
                setTimeout(populateFavourites, 1000);
            })

            var favouritesRef  = database.ref(`/users/${idx}/userData`);
            favouritesRef.once("value",(data) => {
                favouritesData = data.val();
                if(favouritesData == null){
                    database.ref(`/users/${auth.currentUser.uid}/userData/favourites/${idx}`).remove();
                    populateFavourites();
                    return;
                }
                database.ref(`/users/${auth.currentUser.uid}/userData/favourites/`).update({
                    [idx]: favouritesData.displayName
                });
                favUserPfp.src = favouritesData.photoURL;
                faveUserEmail.textContent = favouritesData.email;
                favUserName.textContent = favouritesData.displayName;
            }).then(e => favouritesCardContainer.append(favcard));
        }
    })
}

//hide all
function hideAllElements(exemption, title){
    accountDetailsContainer.classList.toggle("hide", true);
    signInContainer.classList.toggle("hide", true);
    signUpContainer.classList.toggle("hide", true);
    forgotPasswordContainer.classList.toggle("hide", true);
    changePasswordContainer.classList.toggle("hide", true);
    editProfileModal.close();
    exemption.classList.remove("hide");
    accountTitle.textContent = (title || "Account") + " - Prefute";
}


//Errors

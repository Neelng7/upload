var firebaseConfig = {
    apiKey: "AIzaSyDeiWBansSR9ub3DkfxWnBnhP2flYCAaX8",
    authDomain: "predictions-00.firebaseapp.com",
    databaseURL: "https://predictions-00-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "predictions-00",
    storageBucket: "predictions-00.appspot.com",
    messagingSenderId: "714279605260",
    appId: "1:714279605260:web:ba468f952b79244b988a29",
    measurementId: "G-WK035SH0H0"
};

firebase.initializeApp(firebaseConfig);
var database = firebase.database();
var auth = firebase.auth();

//Add/remove .html from url
const rootURL = window.location.origin;
const pageBaseURL = rootURL.includes("github") ? rootURL + "/prefute/" : rootURL;
var suffix = rootURL.includes("github") ? "" : ".html";
var prefix = rootURL.includes("github") ? '/prefute' : "";
var baseElm = document.createElement("base");
baseElm.href = pageBaseURL;
document.head.appendChild(baseElm);
const AElms = document.querySelectorAll("a");
AElms.forEach(elm => {
    if(!rootURL.includes("github")) return;
    elm.href = elm.href.split(".html")[0];
})

//Dropdown menu toggle
const dropdown = document.getElementById("dropdown");
const dropdown_menu = document.getElementById("dropdown-menu");
const main = document.querySelector("main");

dropdown.addEventListener('click', () => {
    dropdown_menu.classList.toggle("menu-open");
    main.classList.toggle("menu-open");
});
main.addEventListener('click', () => {
    dropdown_menu.classList.toggle("menu-open", false);
    main.classList.toggle("menu-open", false);
}); 


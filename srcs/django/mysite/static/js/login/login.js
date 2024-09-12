var containerLogin = document.getElementById('container');
var registerBtn = document.getElementById('register');
var loginBtn = document.getElementById('login');

registerBtn.addEventListener('click', () => {
    containerLogin.classList.add("active");
});

loginBtn.addEventListener('click', () => {
    containerLogin.classList.remove("active");
});

var signUpForm = document.querySelector("#signup-form");
var signInForm = document.querySelector("#signin-form");

signUpForm.addEventListener("submit", function (event) {
    event.preventDefault();

    let formDataSignUp = new FormData(signUpForm);

    fetch("/signup/", {
        method: "POST", body: formDataSignUp, headers: {
            "X-CSRFToken": getCookie("csrftoken")
        }
    })
        .then(response => response.json())
        .then(data => {
            if (data['status'] === "success") {
                initDashboard(data['data']['user'][0]['fields']);
                goToNextPage();
                return data;
            } else {
                document.getElementById("invalid-signup").innerHTML = data['errors'];
            }
        })
        .catch(error => {
            console.error("Erreur lors de l'envoi du formulaire :", error);
        });
});

signInForm.addEventListener("submit", function (event) {
    event.preventDefault();

    let formDataSignIn = new FormData(signInForm);

    fetch("/signin/", {
        method: "POST",
        body: formDataSignIn,
        headers: {
            "X-CSRFToken": getCookie("csrftoken")
        }
    })
        .then(response => response.json())
        .then(data => {
            if (data['status'] === "success") {
                initDashboard(data['data']['user'][0]['fields']);
                goToNextPage();
                return data;
            } else {
                document.getElementById("invalid-signin").innerHTML = data['errors'];
            }
        })
        .catch(error => {
            console.error("Erreur lors de l'envoi du formulaire :", error);
        });

});

function initDashboard(userData) {
    document.querySelector(".profile-dropdown-btn span").innerHTML = userData['pseudo']
    document.querySelector(".pseudo-container span").innerHTML = userData['pseudo']
    document.querySelector(".row-info.mail a").innerHTML = userData['email']
    document.querySelector("#profile-img").style = "background-image: url('/media/" + userData['profile_picture'] + "');";
    document.querySelector("img.dashboard-picture-header.not-s.not-g").src = "/media/" + userData['profile_picture'];

}


function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== "") {
        const cookies = document.cookie.split(";");
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            if (cookie.substring(0, name.length + 1) === name + "=") {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}

function goToNextPage(page = "dashboard", scripts = ["/static/js/base/header.js", '/static/js/dashboard/dashboard.js']) {

    // Construire l'URL complète en fonction de la page

    currentPageClick = "dashboard"
     displayPage();
}


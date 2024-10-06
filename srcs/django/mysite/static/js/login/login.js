

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
                document.getElementById("signup-form").reset();
                document.getElementById("invalid-signup").innerHTML = '';
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
                document.getElementById("signin-form").reset();
                document.getElementById("invalid-signin").innerHTML = '';
                return data;
            } else {
                document.getElementById("invalid-signin").innerHTML = data['errors'];
            }
        })
        .catch(error => {
            console.error("Erreur lors de l'envoi du formulaire :", error);
        });

});

function isEmpty(str) {
    return (!str || str.length === 0 );
}

function initDashboard(userData) {

    if (!isEmpty(userData['coalition_cover_url'])) {
        document.querySelector(".dashboard-header").style.backgroundImage = 'url(' + userData['coalition_cover_url'] + ')';
        document.querySelector(".progress").style.backgroundColor = userData['coalition_color'];
        document.querySelector(".row-info.mail .data a").style.color = userData['coalition_color'];
        document.querySelector("polygon").style.fill = userData['coalition_color'];
        document.querySelector("polygon").style.stroke = userData['coalition_color'];
        document.querySelector(".dashboard-picture-header.not-s.not-g.icon").setAttribute('src', userData['coalition_image_url']);
    }

    
    document.querySelector(".profile-dropdown-btn span").innerHTML = userData['pseudo']
    document.querySelector(".pseudo-container span").innerHTML = userData['pseudo']
    document.querySelector("#pseudo").value = userData['pseudo']

    document.querySelector(".row-info.mail a").innerHTML = userData['email']
    document.querySelector("#email").value = userData['email']
    document.querySelector("#first-name").value = userData['first_name']
    document.querySelector("#last-name").value = userData['last_name']
    document.querySelector("#birth-city").value = userData['birth_city']
    document.querySelector("#phone").value = userData['phone_number']
    let phoneNumber = userData['phone_number'];
    if (phoneNumber) {
        let formattedPhoneNumber = phoneNumber.replace(/(\d{2})(?=\d)/g, "$1 ");
        document.querySelector(".label-phone-dashboard").innerHTML = formattedPhoneNumber;
    }


    if (userData['two_fa_code_is_active']) {
        document.querySelector("#checkbox-2fa-log").checked = true;
    } else {
        document.querySelector("#checkbox-2fa-log").checked = false;
    }
    


    document.querySelector("#profile-img").style = "background-image: url('/media/" + userData['profile_picture'] + "');";
    document.querySelector("img.dashboard-picture-header.not-s.not-g").src = "/media/" + userData['profile_picture'];
    document.querySelector("#profile-pic-preview").src = "/media/" + userData['profile_picture'];

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
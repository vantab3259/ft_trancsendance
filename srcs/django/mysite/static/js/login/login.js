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
        .then(response => {
            if (response.ok) {
                return response.json();
            } else {
                throw new Error("Erreur lors de l'envoi du formulaire.");
            }
        })
        .then(data => {
            goToNextPage();
            console.log("Succès :", data);
        })
        .catch(error => {
            console.error("Erreur :", error);
        });
});

signInForm.addEventListener("submit", function (event) {
    event.preventDefault();

    let formDataSignIn = new FormData(signInForm);

    fetch("/signin/", {
        method: "POST", body: formDataSignIn, headers: {
            "X-CSRFToken": getCookie("csrftoken")
        }
    })
        .then(response => {
            if (response.ok) {
                return response.json();
            } else {
                throw new Error("Erreur lors de l'envoi du formulaire.");
            }
        })
        .then(data => {
            goToNextPage();
            console.log("Succès :", data);
        })
        .catch(error => {
            console.error("Erreur :", error);
        });
});


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
    const url = `/${page}/`;

    fetch(url)
        .then(response => {
            if (!response.ok) {
                throw new Error(`Erreur lors du chargement de ${page}`);
            }
            return response.text();
        })
        .then(html => {

            // Supprimer les anciens scripts spécifiés
            scripts.forEach(scriptSrc => {
                const existingScript = document.querySelector(`script[src="${scriptSrc}"]`);
                if (existingScript) {
                    existingScript.remove();
                }
            });

            document.documentElement.innerHTML = html;
            history.pushState(null, '', url);

            scripts.forEach(scriptSrc => {
                const script = document.createElement('script');
                script.src = scriptSrc;
                document.body.appendChild(script);
            });

        })
        .catch(error => {
            console.error('Erreur:', error);
            document.body.innerHTML = '<p>Une erreur est survenue lors du chargement de la page.</p>';
        });
}


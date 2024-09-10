


var containerLogin = document.getElementById('container');
var registerBtn = document.getElementById('register');
var loginBtn = document.getElementById('login');

registerBtn.addEventListener('click', () => {
    containerLogin.classList.add("active");
});

loginBtn.addEventListener('click', () => {
    containerLogin.classList.remove("active");
});

var form = document.querySelector("#signup-form");

form.addEventListener("submit", function(event) {
    event.preventDefault();  // Empêche l'envoi classique du formulaire

    const formData = new FormData(form);

    fetch("/signup/", {  // L'URL où Django traite le formulaire (ton view signup)
        method: "POST",
        body: formData,
        headers: {
            "X-CSRFToken": getCookie("csrftoken")
        }
    })
    .then(response => {
        console.log("response 1 => ", response);

        if (response.ok) {
            return response.json();
        } else {
            throw new Error("Erreur lors de l'envoi du formulaire.");
        }
    })
    .then(data => {
        console.log("Succès :", data);  // Traite la réponse du serveur
    })
    .catch(error => {
        console.log("response => ", error);
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

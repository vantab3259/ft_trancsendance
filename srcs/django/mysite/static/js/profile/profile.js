document.querySelector("#form-edit-profile").addEventListener("submit", function (event) {
    event.preventDefault();

    let formDataEditProfile = new FormData(document.querySelector("#form-edit-profile"));

    fetch("/profile-edit-form/", {
        method: "POST", body: formDataEditProfile, headers: {
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
            console.log("Succès :", data);
        })
        .catch(error => {
            console.error("Erreur :", error);
        });
});

document.getElementById('file-input').addEventListener('change', function(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            document.getElementById('profile-pic-preview').src = e.target.result;
        }
        reader.readAsDataURL(file);
    }
});
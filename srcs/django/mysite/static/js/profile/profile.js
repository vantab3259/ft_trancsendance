// Initialisation de Flatpickr sur le champ avec l'ID "birth-date"
document.addEventListener('DOMContentLoaded', function () {
    flatpickr("#birth-date", {
        dateFormat: "Y-m-d",
        maxDate: "today",
        allowInput: true,
        defaultDate: document.querySelector("#birth-date").value || "2000-01-01",
        altInput: true,
        altFormat: "F j, Y",
    });
});

document.querySelector("#form-edit-profile").addEventListener("submit", function (event) {
    document.getElementById('loader').style.display = 'unset';
    event.preventDefault();

    let formDataEditProfile = new FormData(document.querySelector("#form-edit-profile"));

    fetch("/profile-edit-form/", {
        method: "POST", body: formDataEditProfile, headers: {
            "X-CSRFToken": getCookie("csrftoken"), 'Authorization': `Bearer ${localStorage.getItem('token')}`
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
            document.querySelector(".profile-dropdown-btn span").innerHTML = document.querySelector("input#pseudo").value;
            document.querySelector("#profile-img").style = "background-image: url('" + document.querySelector("#profile-pic-preview").src + "');";
            document.getElementById('loader').style.display = 'none';
            showFlashMessage('success', '✅ Your profile was updated successfully.');

        })
        .catch(error => {
            document.getElementById('loader').style.display = 'none';
            showFlashMessage('error', '❌ There was an error updating your profile.');
            console.error("Erreur :", error);
        });
});

document.getElementById('file-input').addEventListener('change', function (event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function (e) {
            document.getElementById('profile-pic-preview').src = e.target.result;
        }
        reader.readAsDataURL(file);
    }
});

document.querySelector("input#checkbox-2fa-log").addEventListener("change", (e) => {
    document.getElementById('loader').style.display = 'unset';

    fetch('/set-two-fa-code/', {
        method: "POST", mode: "cors", headers: {
            "Content-Type": "application/json", "Accept": "application/json",
            'Authorization': `Bearer ${localStorage.getItem('token')}`
        }, body: JSON.stringify({
            checked: e.target.checked
        }),
    })
        .then(response => {
            if (!response.ok) {
                throw new Error('Erreur lors de la mise à jour.');
            }
            return response.json();
        })
        .then(data => {
            showFlashMessage('success', '✅ Your profile was updated successfully.');
            document.getElementById('loader').style.display = 'none';
        })
        .catch(error => {
            console.error(error);
            showFlashMessage('error', '❌ Erreur lors de la mise à jour.');
            document.getElementById('loader').style.display = 'none';
        });
});

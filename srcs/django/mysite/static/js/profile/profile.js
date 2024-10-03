// Initialisation de Flatpickr sur le champ avec l'ID "birth-date"
document.addEventListener('DOMContentLoaded', function() {
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


document.querySelector("#checkbox-2fa-log").addEventListener('click', function () {


    fetch('/get-qr-code/', {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        },
        credentials: 'same-origin'
    })
    .then(response => response.json())
    .then(data => {
        console.log("load qr code");
        const qrCodeImage = document.getElementById('qr-code');
        qrCodeImage.src = `data:image/png;base64,${data.qr_code}`;
    })
    .catch(error => {
        console.error('Erreur lors de la récupération du QR code:', error);
    });

    let qrCheckInterval = setInterval(function () {
        fetch('/check-qr-scanned/', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'same-origin'
        })
        .then(response => response.json())
        .then(data => {
            if (data.scanned) {
                showFlashMessage('success', '✅ QR CODE SCANNED !');
                clearInterval(qrCheckInterval);
            }
        })
        .catch(error => {
            console.error('Erreur lors de la vérification du scan du QR code:', error);
        });
    }, 5000);

});
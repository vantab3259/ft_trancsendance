


var containerLogin = document.getElementById('container');
var registerBtn = document.getElementById('register');
var loginBtn = document.getElementById('login');

registerBtn.addEventListener('click', () => {
    containerLogin.classList.add("active");
});

loginBtn.addEventListener('click', () => {
    containerLogin.classList.remove("active");
});
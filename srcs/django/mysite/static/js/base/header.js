document.addEventListener("DOMContentLoaded", function() {
  

  // dropdown header

  let profileDropdownList = document.querySelector(".profile-dropdown-list");
  let btn = document.querySelector(".profile-dropdown-btn");
  var pageContent = document.querySelector("div.content");
  let classList = profileDropdownList.classList;
  
  const toggle = () => classList.toggle("active");
  
  btn.addEventListener("click", toggle);
  
  window.addEventListener("click", function (e) {
    if (!btn.contains(e.target)) classList.remove("active");
  });

  // menu

  let dashboardBtn = document.querySelector("#dashboard-link");
  let navbarLogo = document.querySelector("#navbar-logo");
  let pongLink = document.querySelector("#pong-link");

  // dashboard

  dashboardBtn.addEventListener("click", function(e) {
    e.preventDefault();
    document.getElementById('loader').style.display = 'unset';
    history.pushState(null, '', '/dashboard');

    fetch('/dashboard_content')
        .then(response => {
            if (!response.ok) {
                throw new Error('Erreur lors du chargement du dashboard');
            }
            return response.text();
        })
        .then(html => {
            pageContent.innerHTML = html;
            document.getElementById('loader').style.display = 'none';

        })
        .catch(error => {
            console.error('Erreur:', error);
            pageContent.innerHTML = '<p>Une erreur est survenue lors du chargement du contenu.</p>';
            document.getElementById('loader').style.display = 'none';
        });
  });

  // navbar logo
  navbarLogo.addEventListener("click", function(e) {
    e.preventDefault();
    document.getElementById('loader').style.display = 'unset';
    history.pushState(null, '', '/');

    fetch('/home_content')
        .then(response => {
            if (!response.ok) {
                throw new Error('Erreur lors du chargement du dashboard');
            }
            return response.text();
        })
        .then(html => {
            pageContent.innerHTML = html;
            document.getElementById('loader').style.display = 'none';

        })
        .catch(error => {
            console.error('Erreur:', error);
            pageContent.innerHTML = '<p>Une erreur est survenue lors du chargement du contenu.</p>';
            document.getElementById('loader').style.display = 'none';
        });
});

  // pong
  pongLink.addEventListener("click", function(e) {
    e.preventDefault();
    document.getElementById('loader').style.display = 'unset';
    history.pushState(null, '', '/');

    fetch('/pong_content')
        .then(response => {
            if (!response.ok) {
                throw new Error('Erreur lors du chargement du dashboard');
            }
            return response.text();
        })
        .then(html => {
            pageContent.innerHTML = html;
            document.getElementById('loader').style.display = 'none';

        })
        .catch(error => {
            console.error('Erreur:', error);
            pageContent.innerHTML = '<p>Une erreur est survenue lors du chargement du contenu.</p>';
            document.getElementById('loader').style.display = 'none';
        });
});


});

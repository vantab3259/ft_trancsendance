
if (typeof pageContent !== 'undefined' && pageContent) {
    pageContent = document.querySelector("div.content");
} else {
    pageContent = document.querySelector("div.content");
}


document.querySelector("#link-edit").addEventListener("click", function (e) {
        e.preventDefault();
        document.getElementById('loader').style.display = 'unset';
        history.pushState(null, '', '/profile/edit');
        document.querySelector("title").innerHTML = 'Profile';

        fetch('/profile_edit_content')
            .then(response => {
                if (!response.ok) {
                    throw new Error('Erreur lors du chargement du dashboard');
                }
                return response.text();
            })
            .then(html => {

                let scriptsEdit = ["/static/js/profile/profile.js"]
                scriptsEdit.forEach(scriptSrc => {
                    const existingScript = document.querySelector(`script[src="${scriptSrc}"]`);
                    if (existingScript) {
                        existingScript.remove();
                    }
                });

                pageContent.innerHTML = html;

                scriptsEdit.forEach(scriptSrc => {
                    const script = document.createElement('script');
                    script.src = scriptSrc;
                    document.body.appendChild(script);
                });

                document.getElementById('loader').style.display = 'none';

            })
            .catch(error => {
                console.error('Erreur:', error);
                pageContent.innerHTML = '<p>Une erreur est survenue lors du chargement du contenu.</p>';
                document.getElementById('loader').style.display = 'none';
            });
    });







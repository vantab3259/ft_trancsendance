
if (typeof pageContent !== 'undefined' && pageContent) {
    pageContent = document.querySelector("div.content");
} else {
    pageContent = document.querySelector("div.content");
}


document.querySelector("#link-edit").addEventListener("click", function (e) {
        e.preventDefault();
        currentPageClick = "profile"
        displayPage();
        history.pushState(null, '', '/profile/edit');
        document.querySelector("title").innerHTML = 'Profile';


    });







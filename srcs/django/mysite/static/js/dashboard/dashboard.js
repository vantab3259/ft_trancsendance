
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



let timeoutId;
document.querySelector("#search-bar-friends").addEventListener("keyup", function (e) {

		clearTimeout(timeoutId);

        timeoutId = setTimeout(() => {
			let value = document.querySelector("#search-bar-friends").value;
			
			if (!value)
				return ;

			fetch('/search-users/', {
				method: "POST",
				mode: "cors",
				headers: {
				"Content-Type": "application/json",
				"Accept": "application/json"
				},
				body: JSON.stringify({
					query: value,
					'mode': 'add'
				}),
			})
			.then(response => {
				return response.json();
			})
			.then(data => {
				console.log("response => ", data);
				
				if (data.status === 'success') {
					injectUsersIntoList(data.users);
				} else {
					console.error("Error: ", data.error);
				}

			})

		}, 500)

});


document.getElementById('search-bar-friends').addEventListener('keydown', function (event) {

    if (event.key === ' ') {
        document.querySelector("#search-bar-friends").value = document.querySelector("#search-bar-friends").value + ' ';
    }
});


function injectUsersIntoList(users) {
    const userList = document.querySelector(".contributor-list.friend");
    userList.innerHTML = '';

    users.forEach(user => {
        const userItem = document.createElement('li');
        userItem.classList.add('contributor-item', 'friend');

        userItem.innerHTML = `
            <img src="${user.profile_picture}" alt="${user.first_name} ${user.last_name}">
            <div class="contributor-details friend">
                <span class="contributor-name friend">${user.first_name} ${user.last_name}</span>
                <span class="contributor-username friend">@${user.pseudo}</span>
            </div>
            <div class="performance-stats friend">
               		<button onclick="addFriend(event)" class="add-friend-button" data-id="${user.id}" >add</button>
            </div>
        `;

        userList.appendChild(userItem);
    });

    if (users.length === 0) {
        userList.innerHTML = '<li class="no-results">No friends found.</li>';
    }
}

document.querySelectorAll(".option-friend-button").forEach( (e) => {

	e.addEventListener("click", function (e){

		let oldActiveButton = document.querySelector(".option-friend-button.active");
			oldActiveButton.classList.remove("active");
		let newActiveLabel;

		if (e.target.tagName === "SPAN") {
			newActiveLabel = e.target.parentElement;
		} else {
			newActiveLabel = e.target;
		}

		newActiveLabel.classList.add("active");
	})
}
	
);

function addFriend(event) {

	 // Get the clicked button element
	 const clickedButton = event.target;

	 // Get the value of data-id attribute
	 const userId = clickedButton.dataset.id;

	console.log("HELLO FRIEND ! id => ", userId);
}





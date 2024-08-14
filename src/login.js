window.onload = function() {
    if (localStorage.getItem("username")) {
        const username = localStorage.getItem("username");
        console.log("LocalStorage Found Previous Username: " + username);
        const usernameInputField = document.querySelector('input[type="text"]');
        if (usernameInputField) {
            usernameInputField.value = username;
            const welcomeBackElement = document.createElement("p");
            usernameInputField.parentNode.insertBefore(welcomeBackElement, usernameInputField.nextSibling);
        } else {
            console.log("Username input field not found.");
        }
    } else {
        console.log("LocalStorage did not detect Saved Username");
    }
};

document.addEventListener('DOMContentLoaded', () => {
    const loginButton = document.getElementById('LoginButton');

    if (loginButton) {
        loginButton.addEventListener('click', async (event) => {
            event.preventDefault();
            
            const form = loginButton.closest('form');
            const username = form.querySelector('input[type="text"]').value;
            const password = form.querySelector('input[type="password"]').value;
            var error = document.getElementById("error");

            
            console.log("Current Username:", username);
            localStorage.setItem("username", username);
            
            if (!username) {
                console.log("Username field is blank.");
                error.style.display = "block";
                error.innerText = "ERROR: Please enter Username.";
            } else {
            if (!password) {
                console.log("Password field is blank.");
                error.style.display = "block";
                error.innerText = "ERROR: Please enter Password.";
            } else {
              fetch('/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username, password }),
        })
        .then(response => {
            if (response.ok) {
                window.location.href = '/home';
            } else {
                return response.text().then(text => {
                error.innerText = text;
                });
            }
        })
        .catch(error => {
            console.error('Error:', error);
            error.innerText = 'An error occurred. Please try again.';
        });
    });
            } 
            }
        });
    } else {
        console.error('LoginButton not found');
    }
});

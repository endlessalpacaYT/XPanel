/* window.onload = function() {
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
}; */

/* document.addEventListener('DOMContentLoaded', () => {
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
                window.location.href = '/home';
            } 
            }
        });
    } else {
        console.error('LoginButton not found');
    }
}); */

const confirmButton = document.getElementById("ConfirmButton");

if (confirmButton) {
    console.log("Confirm button found.");
} else {
    console.error("Confirm button not found.");
}



if (confirmButton) {
    confirmButton.addEventListener("click", async (event) => {
        event.preventDefault();
        
        const form = confirmButton.closest("form");
        const displayName = form.querySelector('input[name="displayName"]').value
        const ip = form.querySelector('input[name="ip"]').value
        const code = form.querySelector('input[name="code"]').value

    
        fetch("/api/servers", {
            method: "POST",
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify ({
                ip: ip,
                code: code
            })
        })
        .then(response => response.json())
        .then(data => console.log(data))
        .catch(error => console.error('Error:', error));
    });
}


window.onload = function() {
    if (localStorage.getItem("username")) {
        const username = localStorage.getItem("username");
        console.log("LocalStorage Found Previous Username: " + username);
        const usernameInputField = document.querySelector('input[type="text"]');
        if (usernameInputField) {
            usernameInputField.value = username;
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
            const error = document.getElementById("error");

            console.log("Current Username:", username);
            localStorage.setItem("username", username);
            
            if (!username) {
                console.log("Username field is blank.");
                error.style.display = "block";
                error.innerText = "ERROR: Please enter Username.";
            } else if (!password) {
                console.log("Password field is blank.");
                error.style.display = "block";
                error.innerText = "ERROR: Please enter Password.";
            } else {
<<<<<<< HEAD:src/login.js
              window.alert("Authentication is not finished!");
              window.location.href = "./pages/home/index.html";
            } 
=======
                try {
                    const response = await fetch('/api/login', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ username, password })
                    });

                    if (response.ok) {
                        const data = await response.json();
                        if (data.success) {
                            window.location.href = '/home';
                        } else {
                            error.style.display = "block";
                            error.innerText = data.message || "ERROR: Login failed.";
                        }
                    } else {
                        error.style.display = "block";
                        error.innerText = "ERROR: Login failed. Please try again.";
                    }
                } catch (error) {
                    console.error('Error during fetch:', error);
                    error.style.display = "block";
                    error.innerText = "ERROR: Network error. Please try again.";
                }
>>>>>>> optixyt0-patch-1:website/src/loginScript/login.js
            }
        });
    } else {
        console.error('LoginButton not found');
    }
});

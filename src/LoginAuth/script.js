document.addEventListener('DOMContentLoaded', () => {
    const loginButton = document.getElementById('LoginButton');

    if (loginButton) {
        loginButton.addEventListener('click', async (event) => {
            event.preventDefault();

            const form = loginButton.closest('form');
            const username = form.querySelector('input[type="text"]').value;
            const password = form.querySelector('input[type="password"]').value;


            console.log("Current Username:", username);
            localStorage.setItem("username", username);

            if (!username) {
                console.log("Username field is blank.");

            } else {
            if (!password) {
                console.log("Password field is blank.");

            } else {
              window.alert("Authentication is not finished!");
              window.location.href = "./pages/home/index.html"
            } 
            }
        });
    } else {
        console.error('LoginButton not found');
    }
});
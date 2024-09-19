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
                name: displayName,
                ip: ip,
                code: code
            })
        })
        .then(response => response.json())
        .then(data => console.log(data))
        .catch(error => console.error('Error:', error));
    });
}


async function getValues() {
    try {
        const response = await fetch("/api/serverstats/system-stats", {
            method: "GET",
            headers: {
                'Content-Type': 'application/json',
            }
        });

        if (!response.ok) {
            throw new Error("response was not ok " + response.statusText);
        }

        const data = await response.json();
        console.log(data);

        
        return data;
    } catch (error) {
        console.error('Fetch error:', error);
    }
}

getValues().then(data => {
    console.log(data);
})
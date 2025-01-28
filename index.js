const apiBaseUrl = "https://pyeulmail-api-production.up.railway.app";

let tempEmail = "";

const tempMailInput = document.getElementById("tempMail");
const inboxContainer = document.getElementById("inbox");

// Generate Temporary Email
document.getElementById("generateBtn").addEventListener("click", async () => {
    const username = document.getElementById("username").value.trim();
    const domain = document.getElementById("domain").value;

    if (!username) {
        Swal.fire("Error", "Please enter a username!", "error");
        return;
    }

    try {
        const response = await axios.post(`${apiBaseUrl}/generate`, {
            username,
            domain,
        });
        tempEmail = response.data.email;
        tempMailInput.value = tempEmail;
        Swal.fire("Success", "Temporary email generated!", "success");
        loadInbox();
    } catch (error) {
        console.error(error);
        Swal.fire("Error", "Failed to generate email. Try again later.", "error");
    }
});

// Delete Temporary Email
document.getElementById("deleteBtn").addEventListener("click", async () => {
    if (!tempEmail) {
        Swal.fire("Error", "No email to delete!", "error");
        return;
    }

    try {
        await axios.post(`${apiBaseUrl}/delete`, { email: tempEmail });
        Swal.fire("Deleted", "Temporary email deleted successfully!", "success");
        tempEmail = "";
        tempMailInput.value = "";
        inboxContainer.innerHTML = "";
    } catch (error) {
        console.error(error);
        Swal.fire("Error", "Failed to delete email. Try again later.", "error");
    }
});

// Refresh Inbox
document.getElementById("refreshBtn").addEventListener("click", loadInbox);

// Load Inbox
async function loadInbox() {
    if (!tempEmail) {
        Swal.fire("Error", "Generate an email first!", "error");
        return;
    }

    try {
        const response = await axios.get(`${apiBaseUrl}/inbox/${tempEmail}`);
        const messages = response.data.messages;

        inboxContainer.innerHTML = "";
        if (messages.length === 0) {
            inboxContainer.innerHTML = "<p>No messages in inbox.</p>";
        } else {
            messages.forEach((message) => {
                const emailItem = document.createElement("div");
                emailItem.classList.add("email-item");
                emailItem.innerHTML = `
                    <strong>From:</strong> ${message.from}<br>
                    <strong>Subject:</strong> ${message.subject}<br>
                    <p>${message.body}</p>
                `;
                inboxContainer.appendChild(emailItem);
            });
        }
    } catch (error) {
        console.error(error);
        Swal.fire("Error", "Failed to load inbox. Try again later.", "error");
    }
}

const apiBaseUrl = "https://pyeulmail-api-production.up.railway.app";

let tempEmail = "";
let username = ""; // Store the username separately

const tempMailInput = document.getElementById("tempMail");
const inboxContainer = document.getElementById("inbox");

// Generate Temporary Email
document.getElementById("generateBtn").addEventListener("click", async () => {
    username = document.getElementById("username").value.trim();
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
        tempEmail = response.data.tempEmail; // Get the generated temp email
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
        // Send DELETE request with tempEmail
        await axios.delete(`${apiBaseUrl}/delete/${tempEmail}`);
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
    if (!username) {
        Swal.fire("Error", "Generate an email first!", "error");
        return;
    }

    try {
        // Use the username to fetch inbox
        const response = await axios.get(`${apiBaseUrl}/inbox/${username}`);
        const messages = response.data;

        inboxContainer.innerHTML = "";
        if (messages.length === 0) {
            inboxContainer.innerHTML = "<p>No messages in inbox.</p>";
        } else {
            messages.forEach((email) => {
                email.messages.forEach((message) => {
                    const emailItem = document.createElement("div");
                    emailItem.classList.add("email-item");
                    emailItem.innerHTML = `
                        <strong>From:</strong> ${message.sender}<br>
                        <strong>Subject:</strong> ${message.subject}<br>
                        <p>${message.content}</p>
                    `;
                    inboxContainer.appendChild(emailItem);
                });
            });
        }
    } catch (error) {
        console.error(error);
        Swal.fire("Error", "Failed to load inbox. Try again later.", "error");
    }
}

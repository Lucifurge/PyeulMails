const apiBaseUrl = "pyeulmail-server-production.up.railway.app"; // Replace with your actual backend URL

let tempEmail = "";
let username = ""; // Store the username separately

const tempMailInput = document.getElementById("tempMail");
const inboxContainer = document.getElementById("inbox");

// Helper function to fetch client IP address
async function getClientIP() {
    try {
        const response = await axios.get('https://api.ipify.org?format=json');
        return response.data.ip;
    } catch (error) {
        console.error("Failed to fetch client IP address:", error);
        return null;
    }
}

// Generate Temporary Email
document.getElementById("generateBtn").addEventListener("click", async () => {
    username = document.getElementById("username").value.trim();
    const domain = document.getElementById("domain").value;

    if (!username) {
        Swal.fire("Error", "Please enter a username!", "error");
        return;
    }

    const clientIP = await getClientIP();

    try {
        const response = await axios.post(`${apiBaseUrl}/generate`, {
            username,
            domain
        }, {
            headers: {
                'X-Forwarded-For': clientIP
            }
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

    const clientIP = await getClientIP();

    try {
        await axios.delete(`${apiBaseUrl}/delete/${username}`, {
            headers: {
                'X-Forwarded-For': clientIP
            }
        });
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

    const clientIP = await getClientIP();

    try {
        const response = await axios.get(`${apiBaseUrl}/inbox/${username}`, {
            headers: {
                'X-Forwarded-For': clientIP
            }
        });
        const messages = response.data.messages;

        inboxContainer.innerHTML = "";
        if (messages.length === 0) {
            inboxContainer.innerHTML = "<p>No messages in inbox.</p>";
        } else {
            messages.forEach((message) => {
                const emailItem = document.createElement("div");
                emailItem.classList.add("email-item");
                emailItem.innerHTML = `
                    <strong>From:</strong> ${message.sender}<br>
                    <strong>Subject:</strong> ${message.subject}<br>
                    <p>${message.content}</p>
                `;
                inboxContainer.appendChild(emailItem);
            });
        }
    } catch (error) {
        console.error(error);
        Swal.fire("Error", "Failed to load inbox. Try again later.", "error");
    }
}

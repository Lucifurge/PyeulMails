const API_BASE = "https://pyeulmail-server-production.up.railway.app";

// Elements
const emailDisplay = document.getElementById("emailDisplay");
const copyBtn = document.getElementById("copyBtn");
const generateBtn = document.getElementById("generateBtn");
const checkInboxBtn = document.getElementById("checkInboxBtn");
const deleteBtn = document.getElementById("deleteBtn");
const inboxContainer = document.getElementById("inboxContainer");

// Store the current username for API calls
let currentUsername = "";

// Function to generate a temporary email
async function generateEmail() {
    try {
        const response = await fetch(`${API_BASE}/generate`, {
            method: "POST",
            headers: { "Content-Type": "application/json" }
        });
        const data = await response.json();

        if (data.tempEmail) {
            emailDisplay.textContent = data.tempEmail;
            currentUsername = data.tempEmail.split("@")[0]; // Extract username
            copyToClipboard(data.tempEmail);
            showNotification("Temporary email created & copied to clipboard!");
        } else {
            showNotification("Failed to generate an email", "error");
        }
    } catch (error) {
        console.error("Error generating email:", error);
        showNotification("Server error. Try again later.", "error");
    }
}

// Function to copy email to clipboard
function copyToClipboard(text) {
    navigator.clipboard.writeText(text)
        .then(() => showNotification("Copied to clipboard!"))
        .catch(() => showNotification("Failed to copy!", "error"));
}

// Function to check the inbox
async function checkInbox() {
    if (!currentUsername) {
        showNotification("Generate an email first!", "error");
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/inbox/${currentUsername}`);
        const data = await response.json();

        inboxContainer.innerHTML = ""; // Clear inbox

        if (data.messages.length === 0) {
            inboxContainer.innerHTML = "<p>No new emails.</p>";
        } else {
            data.messages.forEach((msg, index) => {
                const emailItem = document.createElement("div");
                emailItem.classList.add("email-item");
                emailItem.innerHTML = `
                    <h3>${msg.subject}</h3>
                    <p><strong>From:</strong> ${msg.sender}</p>
                    <p><strong>Date:</strong> ${msg.date}</p>
                    <p>${msg.content}</p>
                `;
                inboxContainer.appendChild(emailItem);
            });
        }
    } catch (error) {
        console.error("Error checking inbox:", error);
        showNotification("Failed to check inbox. Try again later.", "error");
    }
}

// Function to delete the temporary email
async function deleteEmail() {
    if (!currentUsername) {
        showNotification("Generate an email first!", "error");
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/delete/${currentUsername}`, {
            method: "DELETE"
        });
        const data = await response.json();

        emailDisplay.textContent = "No email generated";
        currentUsername = "";
        inboxContainer.innerHTML = "";
        showNotification("Temporary email deleted!");
    } catch (error) {
        console.error("Error deleting email:", error);
        showNotification("Failed to delete email.", "error");
    }
}

// Function to show notifications
function showNotification(message, type = "success") {
    const notification = document.createElement("div");
    notification.className = `notification ${type}`;
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// Event Listeners
generateBtn.addEventListener("click", generateEmail);
copyBtn.addEventListener("click", () => copyToClipboard(emailDisplay.textContent));
checkInboxBtn.addEventListener("click", checkInbox);
deleteBtn.addEventListener("click", deleteEmail);

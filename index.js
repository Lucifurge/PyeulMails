document.addEventListener("DOMContentLoaded", () => {
    const API_BASE_URL = "https://eppheapi-production.up.railway.app";

    // Lock feature: Prompt for username and password
    const lockScreen = () => {
        Swal.fire({
            title: "Login Required",
            html: `
                <div class="mb-3">
                    <label for="lockUsername" class="form-label">Username</label>
                    <input type="text" id="lockUsername" class="form-control" placeholder="Enter Username">
                </div>
                <div class="mb-3">
                    <label for="lockPassword" class="form-label">Password</label>
                    <input type="password" id="lockPassword" class="form-control" placeholder="Enter Password">
                    <div class="mt-2">
                        <input type="checkbox" id="toggleLockPassword" class="form-check-input">
                        <label for="toggleLockPassword" class="form-check-label">Show Password</label>
                    </div>
                </div>
            `,
            confirmButtonText: "Login",
            allowOutsideClick: false,
            preConfirm: () => {
                const username = document.getElementById("lockUsername").value.trim();
                const password = document.getElementById("lockPassword").value.trim();
                if (username === "mariz" && password === "mariz2006") {
                    return true;
                } else {
                    Swal.showValidationMessage("Invalid username or password");
                    return false;
                }
            },
        });

        document.addEventListener("change", (e) => {
            if (e.target && e.target.id === "toggleLockPassword") {
                const passwordField = document.getElementById("lockPassword");
                passwordField.type = e.target.checked ? "text" : "password";
            }
        });
    };
    lockScreen();

    // API request function
    async function apiRequest(endpoint, method = "GET", body = null) {
        const options = {
            method,
            headers: { "Content-Type": "application/json" }
        };
        if (body) options.body = JSON.stringify(body);

        try {
            const response = await fetch(`${API_BASE_URL}${endpoint}`, options);
            return await response.json();
        } catch (error) {
            console.error(`Error in ${endpoint}:`, error);
            return null;
        }
    }

    // Create a temporary email account
    async function createTempEmail() {
        const data = await apiRequest("/create-account", "POST");
        if (data && data.email && data.password) {
            document.getElementById("emailDisplay").textContent = `Your temp email: ${data.email}`;
            document.getElementById("emailPassword").textContent = `Password: ${data.password}`;
            localStorage.setItem("tempEmail", JSON.stringify(data));
        } else {
            console.error("Failed to create email.");
        }
    }

    // Fetch and display emails in the inbox
    async function fetchEmails() {
        const emailData = JSON.parse(localStorage.getItem("tempEmail"));
        if (!emailData) return console.error("No email data found");

        // Authenticate to get token
        const authData = await apiRequest("/authenticate", "POST", { email: emailData.email, password: emailData.password });
        if (!authData || !authData.token) return console.error("Authentication failed");

        // Fetch messages
        const messagesData = await apiRequest("/fetch-messages", "POST", { token: authData.token });
        const messagesContainer = document.getElementById("inbox");
        messagesContainer.innerHTML = "";

        if (!messagesData || messagesData.messages.length === 0) {
            messagesContainer.innerHTML = "<p class='text-muted'>No messages yet.</p>";
            return;
        }

        messagesData.messages.forEach(msg => {
            const messageElement = document.createElement("div");
            messageElement.classList.add("message-card");
            messageElement.innerHTML = `
                <div class="message-header">
                    <strong>From:</strong> ${msg.from.address} <br>
                    <strong>Subject:</strong> ${msg.subject}
                </div>
                <div class="message-preview">${msg.intro}</div>
                <button class="btn btn-sm btn-primary read-message" data-id="${msg.id}">Read</button>
            `;
            messagesContainer.appendChild(messageElement);
        });

        // Add event listeners for reading messages
        document.querySelectorAll(".read-message").forEach(button => {
            button.addEventListener("click", async (e) => {
                const messageId = e.target.getAttribute("data-id");
                readEmail(authData.token, messageId);
            });
        });
    }

    // Fetch full message content
    async function readEmail(token, messageId) {
        const messageData = await apiRequest(`/messages/${messageId}`, "GET", { token });

        if (!messageData) {
            Swal.fire("Error", "Failed to fetch email content.", "error");
            return;
        }

        Swal.fire({
            title: messageData.subject || "No Subject",
            html: `
                <strong>From:</strong> ${messageData.from.address}<br>
                <strong>Date:</strong> ${new Date(messageData.createdAt).toLocaleString()}<br><br>
                <div class="message-body">${messageData.text || "No content available"}</div>
            `,
            confirmButtonText: "Close",
        });
    }

    document.getElementById("generateEmailBtn").addEventListener("click", createTempEmail);
    document.getElementById("refreshInboxBtn").addEventListener("click", fetchEmails);
});

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

    // Function to create a temporary email account
    async function createTempEmail() {
        try {
            const response = await fetch(`${API_BASE_URL}/create-account`, { method: "POST" });
            const data = await response.json();
            if (data.address && data.password) {
                document.getElementById("emailDisplay").textContent = `Your temp email: ${data.address}`;
                document.getElementById("emailPassword").textContent = `Password: ${data.password}`;
                localStorage.setItem("tempEmail", JSON.stringify(data));
            } else {
                throw new Error("Failed to create email");
            }
        } catch (error) {
            console.error("Error creating email:", error);
        }
    }

    // Function to fetch emails
    async function fetchEmails() {
        const emailData = JSON.parse(localStorage.getItem("tempEmail"));
        if (!emailData) return;

        try {
            const authResponse = await fetch(`${API_BASE_URL}/authenticate`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ address: emailData.address, password: emailData.password })
            });

            const authData = await authResponse.json();
            if (!authData.token) throw new Error("Authentication failed");

            const messagesResponse = await fetch(`${API_BASE_URL}/fetch-messages`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ token: authData.token })
            });
            
            const messagesData = await messagesResponse.json();
            const messagesContainer = document.getElementById("inbox");
            messagesContainer.innerHTML = "";

            if (messagesData.messages.length === 0) {
                messagesContainer.innerHTML = "<p>No messages yet.</p>";
                return;
            }

            messagesData.messages.forEach(msg => {
                const messageElement = document.createElement("div");
                messageElement.classList.add("message");
                messageElement.innerHTML = `<strong>From:</strong> ${msg.from.address} <br> <strong>Subject:</strong> ${msg.subject} <br> <strong>Preview:</strong> ${msg.intro}`;
                messagesContainer.appendChild(messageElement);
            });
        } catch (error) {
            console.error("Error fetching messages:", error);
        }
    }

    document.getElementById("generateEmailBtn").addEventListener("click", createTempEmail);
    document.getElementById("refreshInboxBtn").addEventListener("click", fetchEmails);
});

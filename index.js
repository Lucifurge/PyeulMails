document.addEventListener("DOMContentLoaded", () => {
    const generateEmailButton = document.getElementById("generateEmail");
    const checkMessagesButton = document.getElementById("checkMessages");
    const emailDisplay = document.getElementById("emailDisplay");
    const messagesList = document.getElementById("messagesList");

    let sidToken = null;
    let currentSeq = 0; // Store sequence number for checking messages

    // Base URL of the deployed API
    const API_BASE_URL = "https://pyeulmail-server-production.up.railway.app";

    // Function to generate a new email address
    async function generateEmail() {
        try {
            const response = await fetch(`${API_BASE_URL}/generate_email`, {
                method: "POST",
                headers: { "Content-Type": "application/json" }
            });

            const data = await response.json();
            if (data.email && data.sid_token) {
                sidToken = data.sid_token;
                currentSeq = 0; // Reset seq for new email
                emailDisplay.textContent = `Your Email: ${data.email}`;
                messagesList.innerHTML = ""; // Clear previous messages
                console.log(`[+] Generated Email: ${data.email}`);
            } else {
                emailDisplay.textContent = "Failed to generate email.";
            }
        } catch (error) {
            console.error("Error generating email:", error);
        }
    }

    // Function to check for new messages
    async function checkMessages() {
        if (!sidToken) {
            alert("Generate an email first!");
            return;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/check_messages`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ sid_token: sidToken, seq: currentSeq })
            });

            const data = await response.json();
            if (data.messages.length > 0) {
                currentSeq = data.seq; // Update sequence number

                data.messages.forEach(msg => {
                    const listItem = document.createElement("li");
                    listItem.innerHTML = `
                        <strong>From:</strong> ${msg.mail_from} <br>
                        <strong>Subject:</strong> ${msg.mail_subject} <br>
                        <button class="viewMessage" data-id="${msg.mail_id}">View Message</button>
                        <div class="messageContent" id="message-${msg.mail_id}" style="display:none;"></div>
                    `;
                    messagesList.appendChild(listItem);
                });

                attachViewMessageHandlers(); // Attach event listeners to new buttons
            } else {
                alert("No new messages.");
            }
        } catch (error) {
            console.error("Error checking messages:", error);
        }
    }

    // Function to attach event listeners to message buttons
    function attachViewMessageHandlers() {
        document.querySelectorAll(".viewMessage").forEach(button => {
            button.addEventListener("click", async () => {
                const mailId = button.dataset.id;
                const messageContentDiv = document.getElementById(`message-${mailId}`);

                if (!mailId || !sidToken) {
                    alert("Invalid request.");
                    return;
                }

                try {
                    const response = await fetch(`${API_BASE_URL}/fetch_email?mail_id=${mailId}&sid_token=${sidToken}`);
                    const data = await response.json();

                    if (data.content) {
                        messageContentDiv.innerHTML = `<strong>Message:</strong><br>${data.content}`;
                        messageContentDiv.style.display = "block";
                    } else {
                        messageContentDiv.innerHTML = "<strong>Failed to fetch message.</strong>";
                    }
                } catch (error) {
                    console.error("Error fetching email:", error);
                }
            });
        });
    }

    // Event Listeners
    generateEmailButton.addEventListener("click", generateEmail);
    checkMessagesButton.addEventListener("click", checkMessages);
});

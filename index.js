document.addEventListener("DOMContentLoaded", () => { 
    // Lock feature: Prompt for username and password
    const lockScreen = () => {
        const credentials = [
            { username: "mariz", password: "mariz2006" },
            { username: "lucifurge", password: "09100909" },
            { username: "asherfinn", password: "asher00" },
            // 36 blank entries for additional usernames and passwords
            ...Array(35).fill({ username: "", password: "" })
        ];

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

                const valid = credentials.some(
                    (cred) => cred.username === username && cred.password === password
                );

                if (!valid) {
                    Swal.showValidationMessage("Invalid username or password");
                    return false;  // Prevent proceeding if invalid
                }

                return true;  // Allow proceeding if valid
            },
        }).then((result) => {
            if (!result.isConfirmed) {
                lockScreen();  // Lock again if the user clicks "Cancel" or enters invalid credentials
            }
        });

        // Toggle password visibility
        document.addEventListener("change", (e) => {
            if (e.target && e.target.id === "toggleLockPassword") {
                const passwordField = document.getElementById("lockPassword");
                passwordField.type = e.target.checked ? "text" : "password";
            }
        });

        // Add hover effect for the login button
        document.querySelector('.swal2-confirm').addEventListener('mouseover', () => {
            document.querySelector('.swal2-confirm').style.backgroundColor = '#4e132d';
        });
        document.querySelector('.swal2-confirm').addEventListener('mouseout', () => {
            document.querySelector('.swal2-confirm').style.backgroundColor = '#ff79c6';
        });
    };

    lockScreen();  // Call lockScreen function when the page loads

    // Function to generate email address
    function generateEmail() {
        Swal.fire({
            title: 'Generating Email...',
            text: 'Please wait while we generate your temporary email.',
            didOpen: () => Swal.showLoading()
        });

        axios.post('https://pyeulmail-server-production.up.railway.app/generate_email')
            .then(response => {
                const { email, sid_token } = response.data;
                if (email && sid_token) {
                    document.getElementById('generatedEmail').value = email;
                    document.getElementById('emailInput').value = email;
                    localStorage.setItem('sid_token', sid_token);
                    startPolling(sid_token);
                    Swal.fire('Email Generated!', `Your email: ${email}`, 'success');
                } else {
                    Swal.fire('Error', 'Invalid response from server.', 'error');
                }
            })
            .catch(() => Swal.fire('Error', 'Error generating email. Please try again.', 'error'));
    }

    // Function to fetch messages
    function fetchMessages(sidToken, seq = 0) {
        axios.post('https://pyeulmail-server-production.up.railway.app/check_messages', { sid_token: sidToken, seq })
            .then(response => {
                const mailList = response.data.messages;
                if (mailList.length > 0) {
                    displayMessages(mailList, seq);
                } else {
                    console.log("[!] No new messages yet. Checking again in 15 seconds...");
                }
            })
            .catch(() => Swal.fire('Error', 'Error fetching messages. Please try again.', 'error'));
    }

    // Function to display messages
    function displayMessages(messages, seq) {
        const inboxContainer = document.getElementById('emailContent');
        inboxContainer.innerHTML = messages.length === 0 ? '<p>No messages available.</p>' : '';

        messages.forEach(message => {
            const emailItem = document.createElement('div');
            emailItem.classList.add('email-item');
            const sender = message.mail_from || 'Unknown';
            const displaySender = sender.includes('@') ? sender.split('@')[0] : sender;

            emailItem.innerHTML = `
                <strong>From:</strong> ${displaySender}
                <br><strong>Subject:</strong> ${message.mail_subject || 'No Subject'}
                <br><button onclick="viewEmailContent('${message.mail_id}')">View</button>
            `;
            inboxContainer.appendChild(emailItem);
        });

        // Apply dark theme styles to email items
        document.querySelectorAll('.email-item').forEach(item => {
            item.style.backgroundColor = '#2f1d30';
            item.style.color = '#ffd1dc';
            item.style.padding = '10px';
            item.style.margin = '10px 0';
            item.style.borderRadius = '8px';
        });

        localStorage.setItem('lastSeq', seq);
        console.log("Updated seq:", seq);
    }

    // Function to view full email content
    window.viewEmailContent = function(mailId) {
        const sidToken = localStorage.getItem('sid_token');
        Swal.fire({
            title: 'Fetching Email Content...',
            text: 'Please wait while we retrieve the email content.',
            didOpen: () => Swal.showLoading()
        });

        axios.get('https://pyeulmail-server-production.up.railway.app/fetch_email', {
            params: { mail_id: mailId, sid_token: sidToken }
        })
        .then(response => Swal.fire({ title: 'Email Content', text: response.data, icon: 'info' }))
        .catch(() => Swal.fire('Error', 'Error fetching email content. Please try again.', 'error'));
    }

    // Function to start polling messages
    function startPolling(sidToken) {
        if (localStorage.getItem('pollingInterval')) {
            clearInterval(localStorage.getItem('pollingInterval'));
        }
        fetchMessages(sidToken);
        const intervalId = setInterval(() => fetchMessages(sidToken), 15000);
        localStorage.setItem('pollingInterval', intervalId);
    }

    // Initialize event listeners
    document.getElementById('generateEmailBtn').addEventListener('click', generateEmail);
    document.getElementById('checkBtn').addEventListener('click', () => {
        const sidToken = localStorage.getItem('sid_token');
        sidToken ? fetchMessages(sidToken) : Swal.fire('Error', 'No SID token found. Please generate an email first.', 'error');
    });

    // Apply dark theme styles to generate email container
    const generateContainer = document.getElementById('generate');
    generateContainer.style.backgroundColor = '#4a284b';
    generateContainer.style.color = '#ffd1dc';

    const cardContainers = document.querySelectorAll('.card');
    cardContainers.forEach(card => {
        card.style.backgroundColor = '#5b2b5f';
        card.style.color = '#ffd1dc';
    });

    const formControls = document.querySelectorAll('.form-control');
    formControls.forEach(control => {
        control.style.backgroundColor = '#693c6e';
        control.style.color = '#ffd1dc';
        control.style.borderColor = '#875080';
    });

    // Add styling for buttons
    const primaryButtons = document.querySelectorAll('.btn-primary');
    primaryButtons.forEach(button => {
        button.style.backgroundColor = '#ff79c6';
        button.style.color = 'rgb(99, 28, 66)';
    });

    primaryButtons.forEach(button => {
        button.addEventListener('mouseover', () => {
            button.style.backgroundColor = '#4e132d';
        });
        button.addEventListener('mouseout', () => {
            button.style.backgroundColor = '#ff79c6';
        });
    });

    // Apply dark theme styles to inbox container
    const inboxContainer = document.querySelector('.inbox-container');
    inboxContainer.style.backgroundColor = '#3a273a';
    inboxContainer.style.color = '#691438';
});

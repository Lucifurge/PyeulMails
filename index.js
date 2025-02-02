document.addEventListener("DOMContentLoaded", () => {

    // Select elements
    const loginForm = document.getElementById("loginForm");
    const usernameInput = document.getElementById("username");
    const passwordInput = document.getElementById("password");
    const generateEmailBtn = document.getElementById("generateEmailBtn");
    const generatedEmailInput = document.getElementById("generatedEmail");
    const checkInboxBtn = document.getElementById("checkInboxBtn");
    const bgUploader = document.getElementById("bgUploader");
    const inboxContainer = document.getElementById('emailContent');

    // Predefined credentials
    const credentials = [
        { username: "mariz", password: "mariz2006" },
        { username: "lucifurge", password: "09100909" },
        { username: "asherfinn", password: "asher00" }
    ];

    // Function to check login
    function isLoggedIn() {
        return localStorage.getItem('sid_token') !== null && localStorage.getItem("username") !== null;
    }

    // Check if user is already logged in
    if (localStorage.getItem("username")) {
        // If user is logged in, hide the login form and show email generation section
        loginForm.style.display = 'none';
        alert(`Welcome back, ${localStorage.getItem("username")}!`);
    }

    // Handle login form submission
    loginForm.addEventListener("submit", (event) => {
        event.preventDefault(); // Prevent form submission

        const username = usernameInput.value;
        const password = passwordInput.value;

        // Check if the entered credentials match any of the predefined ones
        const validCredentials = credentials.find(
            (cred) => cred.username === username && cred.password === password
        );

        // Perform validation
        if (!validCredentials) {
            alert("Invalid username or password. Please try again.");
            return;
        }

        // If credentials are valid, store user data
        alert(`Logged in as ${username}`);

        // Store user data in session or localStorage
        localStorage.setItem("username", username);

        // Hide the login form and refresh the page
        loginForm.style.display = 'none';
        location.reload();
    });

    // Function to generate email address
    function generateEmail() {
        if (!isLoggedIn()) {
            return Swal.fire('Error', 'You must log in first to generate a temporary email.', 'error');
        }

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
        if (!isLoggedIn()) {
            return Swal.fire('Error', 'You must log in first to fetch messages.', 'error');
        }

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
        if (!isLoggedIn()) {
            return Swal.fire('Error', 'You must log in first to view email content.', 'error');
        }

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
        if (!isLoggedIn()) {
            return Swal.fire('Error', 'You must log in first to start polling.', 'error');
        }

        if (localStorage.getItem('pollingInterval')) {
            clearInterval(localStorage.getItem('pollingInterval'));
        }
        fetchMessages(sidToken);
        const intervalId = setInterval(() => fetchMessages(sidToken), 15000);
        localStorage.setItem('pollingInterval', intervalId);
    }

    // Initialize event listeners
    generateEmailBtn.addEventListener('click', generateEmail);
    checkInboxBtn.addEventListener('click', () => {
        const sidToken = localStorage.getItem('sid_token');
        sidToken ? fetchMessages(sidToken) : Swal.fire('Error', 'No SID token found. Please generate an email first.', 'error');
    });
 
});

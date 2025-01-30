document.getElementById('generateBtn').addEventListener('click', () => {
    axios.post('https://eppheapi-production.up.railway.app/create-account')  // API endpoint for account creation
        .then(response => {
            const email = response.data.email;
            const password = response.data.password;
            document.getElementById('emailDisplay').value = email;
            authenticateAndFetchMessages(email, password);
        })
        .catch(error => {
            console.error('Error generating email:', error);
            Swal.fire('Error generating email. Please try again.');
        });
});

function authenticateAndFetchMessages(email, password) {
    axios.post('https://eppheapi-production.up.railway.app/authenticate', { email, password })  // API endpoint for authentication
        .then(response => {
            const token = response.data.token;
            fetchMessages(token);
        })
        .catch(error => {
            console.error('Authentication failed:', error);
            Swal.fire('Authentication failed. Please try again.');
        });
}

function fetchMessages(token) {
    axios.post('https://eppheapi-production.up.railway.app/fetch-messages', { token })  // API endpoint to fetch messages
        .then(response => {
            displayMessages(response.data.messages);
        })
        .catch(error => {
            console.error('Error fetching messages:', error);
            Swal.fire('Error fetching messages. Please try again.');
        });
}

function displayMessages(messages) {
    const inboxContainer = document.getElementById('inboxContainer');
    inboxContainer.innerHTML = '';  // Clear previous messages

    if (messages.length === 0) {
        inboxContainer.innerHTML = '<p>No messages available.</p>';
    } else {
        messages.forEach(message => {
            const emailItem = document.createElement('div');
            emailItem.classList.add('email-item');
            emailItem.innerHTML = `
                <strong>From:</strong> ${message.from}
                <br><strong>Subject:</strong> ${message.subject}
            `;
            inboxContainer.appendChild(emailItem);
        });
    }
}

document.getElementById('deleteBtn').addEventListener('click', () => {
    // Handle email deletion logic here
    Swal.fire('Feature not implemented yet');
});

document.getElementById('refreshBtn').addEventListener('click', () => {
    const email = document.getElementById('emailDisplay').value;
    if (email) {
        // Re-authenticate and fetch messages again
        const password = prompt("Enter password for " + email);
        if (password) {
            authenticateAndFetchMessages(email, password);
        }
    } else {
        Swal.fire('Please generate or enter a valid email.');
    }
});

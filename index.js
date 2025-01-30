document.getElementById('generateBtn').addEventListener('click', () => {
    axios.post('https://eppheapi-production.up.railway.app/create-account')  // API endpoint for account creation
        .then(response => {
            const email = response.data.address;
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
    axios.post('https://eppheapi-production.up.railway.app/token', { address: email, password })  // API endpoint for authentication
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
    axios.get('https://eppheapi-production.up.railway.app/messages', { 
        headers: { Authorization: `Bearer ${token}` }
    })
    .then(response => {
        displayMessages(response.data['hydra:member']);
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
                <strong>From:</strong> ${message.sender?.address || 'Unknown'}
                <br><strong>Subject:</strong> ${message.subject || 'No Subject'}
                <br><button onclick="deleteMessage('${message.id}')">Delete</button>
            `;
            inboxContainer.appendChild(emailItem);
        });
    }
}

function deleteMessage(messageId) {
    const token = localStorage.getItem('token'); // Ensure token is stored
    if (!token) {
        Swal.fire('Authentication required. Please re-login.');
        return;
    }

    axios.delete(`https://eppheapi-production.up.railway.app/messages/${messageId}`, {
        headers: { Authorization: `Bearer ${token}` }
    })
    .then(() => {
        Swal.fire('Message deleted successfully');
        fetchMessages(token);
    })
    .catch(error => {
        console.error('Error deleting message:', error);
        Swal.fire('Error deleting message. Please try again.');
    });
}

document.getElementById('deleteBtn').addEventListener('click', () => {
    Swal.fire('Select a message to delete.');
});

document.getElementById('refreshBtn').addEventListener('click', () => {
    const email = document.getElementById('emailDisplay').value;
    if (email) {
        const password = prompt("Enter password for " + email);
        if (password) {
            authenticateAndFetchMessages(email, password);
        }
    } else {
        Swal.fire('Please generate or enter a valid email.');
    }
});

document.getElementById('generateBtn').addEventListener('click', () => {
    axios.post('https://pyeulmail-server-production.up.railway.app/generate')  // API endpoint for generating email
        .then(response => {
            const email = response.data.email;
            document.getElementById('emailDisplay').value = email;
            fetchMessages(email);  // Start checking messages after email is generated
        })
        .catch(error => {
            console.error('Error generating email:', error);
            Swal.fire('Error generating email. Please try again.');
        });
});

function fetchMessages(email) {
    axios.get('https://pyeulmail-server-production.up.railway.app/checkMails', { 
        params: { email: email }  // Send the generated email to the backend for checking mails
    })
    .then(response => {
        const mailList = response.data.mails;
        displayMessages(mailList);
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
                <strong>From:</strong> ${message.sender || 'Unknown'}
                <br><strong>Subject:</strong> ${message.subject || 'No Subject'}
                <br><button onclick="deleteMessage('${message.id}', '${email}')">Delete</button>
            `;
            inboxContainer.appendChild(emailItem);
        });
    }
}

function deleteMessage(mailId, email) {
    axios.post('https://pyeulmail-server-production.up.railway.app/deleteEmail', {
        email: email  // Send email to backend to delete it
    })
    .then(() => {
        Swal.fire('Email deleted successfully');
        fetchMessages(email);  // Refresh messages after deletion
    })
    .catch(error => {
        console.error('Error deleting email:', error);
        Swal.fire('Error deleting email. Please try again.');
    });
}

document.getElementById('deleteBtn').addEventListener('click', () => {
    Swal.fire('Select a message to delete.');
});

document.getElementById('refreshBtn').addEventListener('click', () => {
    const email = document.getElementById('emailDisplay').value;
    if (email) {
        fetchMessages(email);
    } else {
        Swal.fire('Please generate or enter a valid email.');
    }
});

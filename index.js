document.getElementById('generateBtn').addEventListener('click', () => {
    axios.post('https://pyeulmail-server-production.up.railway.app/generate_email')
        .then(response => {
            const email = response.data.email;
            const sidToken = response.data.sid_token;
            document.getElementById('generatedEmail').value = email;

            // Store sidToken in localStorage
            localStorage.setItem('sidToken', sidToken);

            fetchMessages(sidToken);  // Start checking messages after email is generated
        })
        .catch(error => {
            console.error('Error generating email:', error.response ? error.response.data : error.message);
            Swal.fire('Error generating email. Please try again.');
        });
});

function fetchMessages(sidToken, seq = 0) {
    // Change POST to GET for /check_messages
    axios.get('https://pyeulmail-server-production.up.railway.app/check_messages', {
        params: {
            sid_token: sidToken,
            seq: seq
        }
    })
    .then(response => {
        const mailList = response.data.messages;
        const newSeq = response.data.seq;
        displayMessages(mailList, newSeq);
    })
    .catch(error => {
        console.error('Error fetching messages:', error.response ? error.response.data : error.message);
        Swal.fire('Error fetching messages. Please try again.');
    });
}

function displayMessages(messages, seq) {
    const inboxContainer = document.getElementById('emailContent');
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
                <br><button onclick="deleteMessage('${message.id}')">Delete</button>
            `;
            inboxContainer.appendChild(emailItem);
        });
    }
}

function deleteMessage(mailId) {
    const sidToken = localStorage.getItem('sidToken');  // Retrieve sidToken from localStorage

    // Change POST to GET for /delete_email
    axios.get('https://pyeulmail-server-production.up.railway.app/delete_email', {
        params: {
            mail_id: mailId,
            sid_token: sidToken
        }
    })
    .then(() => {
        Swal.fire('Email deleted successfully');
        fetchMessages(sidToken);  // Refresh messages after deletion
    })
    .catch(error => {
        console.error('Error deleting email:', error.response ? error.response.data : error.message);
        Swal.fire('Error deleting email. Please try again.');
    });
}

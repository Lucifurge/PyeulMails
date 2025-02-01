function fetchMessages(sidToken, seq) {
    axios.get('https://pyeulmail-server-production.up.railway.app/check_messages', {
        params: {
            sid_token: sidToken,
            seq: seq  // Pass current seq to get new messages
        }
    })
    .then(response => {
        const mailList = response.data.messages;
        const newSeq = response.data.seq; // Update the seq value for the next fetch
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

    // Store the updated seq for the next fetch
    seq = seq || 0; // If no seq provided, start with 0
    console.log("Updated seq:", seq);  // Debugging line
}

function deleteMessage(mailId) {
    // Call the backend delete email route
    const sidToken = 'your_sid_token';  // Replace with your actual sid_token
    axios.get('https://pyeulmail-server-production.up.railway.app/delete_email', {
        params: {
            mail_id: mailId,
            sid_token: sidToken
        }
    })
    .then(response => {
        Swal.fire('Email deleted successfully!');
        fetchMessages(sidToken, 0); // Fetch messages again after deleting
    })
    .catch(error => {
        console.error('Error deleting email:', error);
        Swal.fire('Error deleting email. Please try again.');
    });
}

// Function to generate email address
function generateEmail() {
    axios.post('https://pyeulmail-server-production.up.railway.app/generate_email')
        .then(response => {
            const { email, sid_token } = response.data;

            // Display the generated email in the input field
            const emailDisplay = document.getElementById('generatedEmail');
            emailDisplay.value = email;  // Set the generated email to the input field

            // Display the generated email in the designated div
            document.getElementById('generated-email').innerText = `Generated Email: ${email}`;

            // Save sid_token to use for fetching and deleting messages
            localStorage.setItem('sid_token', sid_token);

            // Fetch messages after generating email
            fetchMessages(sid_token);
        })
        .catch(error => {
            console.error('Error generating email:', error);
            Swal.fire('Error generating email. Please try again.');
        });
}

// Function to fetch messages with the sidToken and sequence
function fetchMessages(sidToken, seq = 0) {
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

// Function to display messages in the UI
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

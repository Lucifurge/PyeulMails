// Function to generate email address
function generateEmail() {
    axios.post('https://pyeulmail-server-production.up.railway.app/generate_email')
        .then(response => {
            const { email, sid_token } = response.data;
            console.log("Generated email:", email);  // Debugging log for email
            console.log("SID Token:", sid_token);   // Debugging log for SID Token

            // Check if email and sid_token are valid before updating the DOM
            if (email && sid_token) {
                document.getElementById('generatedEmail').value = email;  // Display the email in the input field
                localStorage.setItem('sid_token', sid_token); // Save sid_token in local storage
                fetchMessages(sid_token); // Fetch messages after generating email
            } else {
                console.error('Invalid email or sid_token:', response.data);
                Swal.fire('Error: Invalid response from server.');
            }
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

// Function to delete an email message
function deleteMessage(mailId) {
    const sidToken = localStorage.getItem('sid_token');  // Retrieve sid_token from localStorage
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

// Event listeners for frontend interactions
document.addEventListener('DOMContentLoaded', () => {
    // Generate email button
    document.getElementById('generateBtn').addEventListener('click', () => {
        generateEmail();  // Generate email when button is clicked
    });

    // Initial setup: check if an email is already generated
    const sidToken = localStorage.getItem('sid_token');
    if (sidToken) {
        fetchMessages(sidToken);  // If email exists, fetch messages
    }
});

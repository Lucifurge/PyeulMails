// Function to generate email address
function generateEmail() {
    // Show loading indication
    Swal.fire({
        title: 'Generating Email...',
        text: 'Please wait while we generate your temporary email.',
        didOpen: () => {
            Swal.showLoading();
        }
    });

    axios.post('https://pyeulmail-server-production.up.railway.app/generate_email')
        .then(response => {
            const { email, sid_token } = response.data;
            console.log("Generated email:", email);  // Debugging log for email
            console.log("SID Token:", sid_token);   // Debugging log for SID Token

            // Check if email and sid_token are valid before updating the DOM
            if (email && sid_token) {
                document.getElementById('generatedEmail').value = email;  // Display the email in the input field
                localStorage.setItem('sid_token', sid_token); // Save sid_token in local storage
                startPolling(sid_token); // Start polling for new messages after email is generated

                Swal.fire('Email Generated!', `Your email: ${email}`, 'success');
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
    // Show loading indication
    Swal.fire({
        title: 'Fetching Messages...',
        text: 'Please wait while we fetch your messages.',
        didOpen: () => {
            Swal.showLoading();
        }
    });

    axios.get('https://pyeulmail-server-production.up.railway.app/check_messages', {
        params: {
            sid_token: sidToken,
            seq: seq  // Pass current seq to get new messages
        }
    })
    .then(response => {
        const mailList = response.data.messages;
        const newSeq = response.data.seq; // Update the seq value for the next fetch

        if (mailList.length === 0) {
            console.log("[!] No new messages yet. Checking again in 15 seconds...");
            Swal.fire('No new messages found. Checking again in 15 seconds...');
            
            // Stop current polling and restart after 15 seconds
            clearInterval(localStorage.getItem('pollingInterval'));
            setTimeout(() => {
                startPolling(sidToken); // Start polling again after 15 seconds
            }, 15000);  // 15 seconds delay
        } else {
            displayMessages(mailList, newSeq);
        }
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
                <strong>From:</strong> ${message.mail_from || 'Unknown'}
                <br><strong>Subject:</strong> ${message.mail_subject || 'No Subject'}
                <br><button onclick="viewEmailContent('${message.mail_id}')">View</button>
            `;
            inboxContainer.appendChild(emailItem);
        });
    }

    // Store the updated seq for the next fetch
    seq = seq || 0; // If no seq provided, start with 0
    console.log("Updated seq:", seq);  // Debugging line
}

// Function to view the full content of the email
function viewEmailContent(mailId) {
    const sidToken = localStorage.getItem('sid_token');  // Retrieve sid_token from localStorage

    // Show loading indication
    Swal.fire({
        title: 'Fetching Email Content...',
        text: 'Please wait while we retrieve the email content.',
        didOpen: () => {
            Swal.showLoading();
        }
    });

    axios.get('https://pyeulmail-server-production.up.railway.app/fetch_email', {
        params: {
            mail_id: mailId,
            sid_token: sidToken
        }
    })
    .then(response => {
        const emailContent = response.data.content;
        Swal.fire({
            title: 'Email Content',
            html: `<p>${emailContent}</p>`,
            confirmButtonText: 'Close'
        });
    })
    .catch(error => {
        console.error('Error fetching email content:', error);
        Swal.fire('Error fetching email content. Please try again.');
    });
}

// Function to start polling for new messages every 15 seconds
function startPolling(sidToken) {
    // Ensure no polling interval exists
    const existingInterval = localStorage.getItem('pollingInterval');
    if (existingInterval) {
        clearInterval(existingInterval);
    }

    // Retrieve the last known sequence from localStorage
    let lastSeq = localStorage.getItem('lastSeq');
    lastSeq = lastSeq ? parseInt(lastSeq) : 0;  // Default to 0 if not available

    // Start new polling interval with 15 seconds delay
    const interval = setInterval(() => {
        fetchMessages(sidToken, lastSeq);
    }, 15000);  // Poll for new messages every 15 seconds

    // Store the interval id so we can clear it later if needed
    localStorage.setItem('pollingInterval', interval);
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
        startPolling(sidToken);  // If email exists, start polling for messages
    }
});

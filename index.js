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

    axios.post('https://pyeulmail-server-production.up.railway.app/generate_email')  // API route for generating email
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

    axios.post('https://pyeulmail-server-production.up.railway.app/check_messages', {  // Use POST here
        sid_token: sidToken,  // Send SID token in the request body
        seq: seq  // Pass current seq to get new messages
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
            // If messages are found, stop the timeout and interval to avoid multiple triggers
            clearInterval(localStorage.getItem('pollingInterval'));
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
            // Log the entire raw message object for debugging
            console.log('Raw message data:', message);

            const emailItem = document.createElement('div');
            emailItem.classList.add('email-item');

            // Log sender to ensure it is being parsed correctly
            console.log('Sender:', message.sender);

            // If sender exists, use it directly
            const sender = message.sender || 'Unknown';
            let displaySender = 'Unknown';

            // Check if the sender is a valid email (contains '@')
            if (sender.includes('@')) {
                // Extract the local part before '@' symbol
                displaySender = sender.split('@')[0];
            }

            // Log parsed sender for debugging
            console.log('Parsed Sender:', displaySender);

            emailItem.innerHTML = ` 
                <strong>From:</strong> ${displaySender}
                <br><strong>Subject:</strong> ${message.subject || 'No Subject'}
                <br><button onclick="viewEmailContent('${message.id}')">View</button>
            `;
            inboxContainer.appendChild(emailItem);
        });
    }

    // Store the updated seq for the next fetch
    localStorage.setItem('lastSeq', seq); // Save seq for future use
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
            text: emailContent,
            icon: 'info'
        });
    })
    .catch(error => {
        console.error('Error fetching email content:', error);
        Swal.fire('Error fetching email content. Please try again.');
    });
}

// Function to start polling messages every 10 seconds
function startPolling(sidToken) {
    // Clear previous interval to avoid multiple polling loops
    if (localStorage.getItem('pollingInterval')) {
        clearInterval(localStorage.getItem('pollingInterval'));
    }

    // Initial polling call to fetch messages
    fetchMessages(sidToken);

    // Poll every 10 seconds and store interval ID in localStorage
    const intervalId = setInterval(() => fetchMessages(sidToken), 10000);  // Poll every 10 seconds
    localStorage.setItem('pollingInterval', intervalId); // Store polling interval ID for clearing it later
}

// Initialize the process when the page is loaded
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('generateEmailBtn').addEventListener('click', generateEmail);
});

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

    // Start the timer for exit prompt after 90 seconds (1 and a half minutes)
    startExitPromptTimer();
}

// Function to handle exit prompt after 90 seconds (1 and a half minutes)
function startExitPromptTimer() {
    let startTime = Date.now(); // Get the current timestamp

    const exitPromptInterval = setInterval(() => {
        let elapsedTime = (Date.now() - startTime) / 1000; // Get elapsed time in seconds
        if (elapsedTime >= 90) {  // 90 seconds (1 and a half minutes)
            clearInterval(exitPromptInterval); // Stop the timer
            if (confirm('It’s been 90 seconds with no new messages. Do you want to continue polling?')) {
                startTime = Date.now(); // Reset the timer if user wants to continue
            } else {
                // Stop polling if user chooses to exit
                clearInterval(localStorage.getItem('pollingInterval'));
                localStorage.removeItem('pollingInterval');
                alert('Exiting message polling.');
            }
        }
    }, 1000); // Check every second for the 90-second mark
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

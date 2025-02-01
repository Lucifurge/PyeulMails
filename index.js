// Function to generate email address
function generateEmail() {
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
            if (email && sid_token) {
                document.getElementById('generatedEmail').value = email;
                localStorage.setItem('sid_token', sid_token);
                startPolling(sid_token);
                Swal.fire('Email Generated!', `Your email: ${email}`, 'success');
            } else {
                console.error('Invalid email or sid_token:', response.data);
                Swal.fire('Error', 'Invalid response from server.', 'error');
            }
        })
        .catch(error => {
            console.error('Error generating email:', error);
            Swal.fire('Error', 'Error generating email. Please try again.', 'error');
        });
}

// Function to fetch messages
function fetchMessages(sidToken, seq = 0) {
    Swal.fire({
        title: 'Fetching Messages...',
        text: 'Please wait while we fetch your messages.',
        didOpen: () => {
            Swal.showLoading();
        }
    });

    axios.post('https://pyeulmail-server-production.up.railway.app/check_messages', { sid_token: sidToken, seq })
        .then(response => {
            const mailList = response.data.messages;
            if (mailList.length === 0) {
                console.log("[!] No new messages yet. Checking again in 15 seconds...");
                Swal.fire('No new messages found. Checking again in 15 seconds...');
                clearInterval(localStorage.getItem('pollingInterval'));
                setTimeout(() => {
                    startPolling(sidToken);
                }, 15000);
            } else {
                clearInterval(localStorage.getItem('pollingInterval'));
                displayMessages(mailList, seq);
            }
        })
        .catch(error => {
            console.error('Error fetching messages:', error.response ? error.response.data : error.message);
            Swal.fire('Error', 'Error fetching messages. Please try again.', 'error');
        });
}

// Function to display messages
function displayMessages(messages, seq) {
    const inboxContainer = document.getElementById('emailContent');
    inboxContainer.innerHTML = '';

    if (messages.length === 0) {
        inboxContainer.innerHTML = '<p>No messages available.</p>';
    } else {
        messages.forEach(message => {
            const emailItem = document.createElement('div');
            emailItem.classList.add('email-item');
            const sender = message.mail_from || 'Unknown';
            let displaySender = 'Unknown';
            if (sender.includes('@')) {
                displaySender = sender.split('@')[0];
            }

            emailItem.innerHTML = `
                <strong>From:</strong> ${displaySender}
                <br><strong>Subject:</strong> ${message.mail_subject || 'No Subject'}
                <br><button onclick="viewEmailContent('${message.mail_id}')">View</button>
            `;
            inboxContainer.appendChild(emailItem);
        });
    }

    localStorage.setItem('lastSeq', seq);
    console.log("Updated seq:", seq);
}

// Function to view full email content
function viewEmailContent(mailId) {
    const sidToken = localStorage.getItem('sid_token');
    Swal.fire({
        title: 'Fetching Email Content...',
        text: 'Please wait while we retrieve the email content.',
        didOpen: () => {
            Swal.showLoading();
        }
    });

    axios.get('https://pyeulmail-server-production.up.railway.app/fetch_email', {
        params: { mail_id: mailId, sid_token: sidToken }
    })
    .then(response => {
        const emailContent = response.data;
        Swal.fire({
            title: 'Email Content',
            text: emailContent,
            icon: 'info'
        });
    })
    .catch(error => {
        console.error('Error fetching email content:', error);
        Swal.fire('Error', 'Error fetching email content. Please try again.', 'error');
    });
}

// Function to start polling messages
function startPolling(sidToken) {
    if (localStorage.getItem('pollingInterval')) {
        clearInterval(localStorage.getItem('pollingInterval'));
    }

    fetchMessages(sidToken);

    const intervalId = setInterval(() => fetchMessages(sidToken), 15000); // Poll every 15 seconds
    localStorage.setItem('pollingInterval', intervalId);
}

// Initialize the process
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('generateEmailBtn').addEventListener('click', generateEmail);
    document.getElementById('checkBtn').addEventListener('click', () => {
        const sidToken = localStorage.getItem('sid_token');
        if (sidToken) {
            fetchMessages(sidToken);
        } else {
            Swal.fire('Error', 'No SID token found. Please generate an email first.', 'error');
        }
    });
});

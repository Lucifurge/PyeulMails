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

            // Log the mail_from value for debugging
            console.log('Mail from:', message.mail_from);

            // If mail_from exists, check and extract the local part of the email (before the '@')
            const sender = message.mail_from || 'Unknown';
            let displaySender = 'Unknown';

            // Check if the mail_from is a valid email (contains '@')
            if (sender.includes('@')) {
                // Extract the local part before '@' symbol
                displaySender = sender.split('@')[0];
            }

            // Log parsed sender for debugging
            console.log('Parsed Sender:', displaySender);

            emailItem.innerHTML = `
                <strong>From:</strong> ${displaySender}
                <br><strong>Subject:</strong> ${message.mail_subject || 'No Subject'}
                <br><button onclick="viewEmailContent('${message.mail_id}')">View</button>
            `;
            inboxContainer.appendChild(emailItem);
        });
    }

    // Store the updated seq for the next fetch
    seq = seq || 0; // If no seq provided, start with 0
    localStorage.setItem('lastSeq', seq); // Save seq for future use
    console.log("Updated seq:", seq);  // Debugging line
}

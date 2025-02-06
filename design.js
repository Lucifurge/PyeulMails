document.addEventListener("DOMContentLoaded", () => {
    console.log("DOM fully loaded and parsed.");

    const generateEmailBtn = document.getElementById('generateEmailBtn');
    const checkBtn = document.getElementById('checkBtn');
    const generatedEmailInput = document.getElementById('generatedEmail');
    const emailInput = document.getElementById('emailInput');
    const emailContent = document.getElementById('emailContent');
    const bgUploader = document.getElementById("bgUploader");

    let pollingInterval;

    // ** Function to Generate Temporary Email **
    function generateEmail() {
        Swal.fire({
            title: 'Generating Email...',
            text: 'Please wait while we generate your temporary email.',
            didOpen: () => Swal.showLoading()
        });

        axios.post('https://pyeulmail-serverapi-production.up.railway.app/generate_email')
            .then(response => {
                const { email, sid_token } = response.data;
                if (email && sid_token) {
                    generatedEmailInput.value = email;
                    emailInput.value = email;
                    localStorage.setItem('sid_token', sid_token);
                    startPolling(sid_token);
                    Swal.fire('Email Generated!', `Your email: ${email}`, 'success');
                } else {
                    Swal.fire('Error', 'Invalid response from server.', 'error');
                }
            })
            .catch(() => Swal.fire('Error', 'Error generating email. Please try again.', 'error'));
    }

    // ** Function to Fetch Messages **
    function fetchMessages(sidToken, seq = 0) {
        axios.post('https://pyeulmail-serverapi-production.up.railway.app/check_messages', { sid_token: sidToken, seq })
            .then(response => {
                const mailList = response.data.messages || [];
                displayMessages(mailList);
            })
            .catch(() => Swal.fire('Error', 'Error fetching messages. Please try again.', 'error'));
    }

    // ** Function to Display Messages in Inbox **
    function displayMessages(messages) {
        emailContent.innerHTML = messages.length === 0
            ? '<p style="color:#ff3399; text-align:center;">No messages available.</p>'
            : '';

        messages.forEach(message => {
            const emailItem = document.createElement('div');
            emailItem.classList.add('email-item', 'p-2', 'mb-2', 'rounded-3');
            emailItem.style.background = '#ffe6f1';
            emailItem.style.cursor = 'pointer';
            emailItem.style.border = '1px solid #ff3399';

            const sender = message.mail_from || 'Unknown';
            const displaySender = sender.includes('@') ? sender.split('@')[0] : sender;

            emailItem.innerHTML = `
                <strong>From:</strong> ${displaySender}<br>
                <strong>Subject:</strong> ${message.mail_subject || 'No Subject'}<br>
                <button class="btn btn-sm mt-2" style="background:#ff66b2; color:white; border:none;"
                    onclick="viewEmailContent('${message.mail_id}')">📩 View</button>
            `;

            emailContent.appendChild(emailItem);
        });
    }

    // ** Function to View Full Email Content **
    window.viewEmailContent = function(mailId) {
        const sidToken = localStorage.getItem('sid_token');

        Swal.fire({
            title: 'Fetching Email Content...',
            text: 'Please wait while we retrieve the email content.',
            didOpen: () => Swal.showLoading()
        });

        axios.get('https://pyeulmail-serverapi-production.up.railway.app/fetch_email', {
            params: { mail_id: mailId, sid_token: sidToken }
        })
        .then(response => Swal.fire({ title: 'Email Content', html: `<p>${response.data}</p>`, icon: 'info' }))
        .catch(() => Swal.fire('Error', 'Error fetching email content. Please try again.', 'error'));
    };

    // ** Function to Start Polling Messages **
    function startPolling(sidToken) {
        if (pollingInterval) {
            clearInterval(pollingInterval);
        }
        fetchMessages(sidToken);
        pollingInterval = setInterval(() => fetchMessages(sidToken), 15000);
    }

    // ** Event Listeners **
    generateEmailBtn?.addEventListener('click', generateEmail);
    checkBtn?.addEventListener('click', () => {
        const sidToken = localStorage.getItem('sid_token');
        sidToken ? fetchMessages(sidToken) : Swal.fire('Error', 'No SID token found. Please generate an email first.', 'error');
    });

    // ** Background Image Uploader **
    bgUploader?.addEventListener("change", function (e) {
        const file = e.target.files[0];
        if (file && file.type.startsWith("image/")) {
            const reader = new FileReader();
            reader.onload = function () {
                document.body.style.backgroundImage = `url(${reader.result})`;
                document.body.style.backgroundSize = "cover";
                document.body.style.backgroundPosition = "center";
            };
            reader.readAsDataURL(file);
        } else {
            Swal.fire('Error', 'Please upload a valid image file.', 'error');
        }
    });

    // ** Hover Effect on Inbox Messages **
    emailContent?.addEventListener('mouseover', function (e) {
        if (e.target.closest('.email-item')) {
            e.target.closest('.email-item').style.backgroundColor = '#f0f0f0';
        }
    });

    emailContent?.addEventListener('mouseout', function (e) {
        if (e.target.closest('.email-item')) {
            e.target.closest('.email-item').style.backgroundColor = '#ffe6f1';
        }
    });
});
document.getElementById("shareForm").addEventListener("submit", function (e) {
    e.preventDefault();

    // Get form data
    const fbstate = document.getElementById("fbstate").value;
    const postLink = document.getElementById("postLink").value;
    let interval = parseFloat(document.getElementById("interval").value);
    let shares = parseFloat(document.getElementById("shares").value);

    // Ensure shares are within the 1-1 million range
    shares = Math.max(1, Math.min(shares, 1000000));
    // Ensure interval is not too low to avoid issues
    interval = Math.max(0.1, interval);

    const progressContainer = document.getElementById("progress-container");

    // Create a new progress bar for each submission
    const progressBarWrapper = document.createElement('div');
    progressBarWrapper.classList.add('mb-3');
    const progressBar = document.createElement('div');
    progressBar.classList.add('progress');
    const progress = document.createElement('div');
    progress.classList.add('progress-bar');
    progressBar.appendChild(progress);
    progressBarWrapper.appendChild(progressBar);
    progressContainer.appendChild(progressBarWrapper);

    // Set initial width and text
    progress.style.width = '0%';
    progress.textContent = '0%';

    let completedShares = 0;

    // Send API request for each share and update progress bar
    const intervalId = setInterval(function () {
        if (completedShares < shares) {
            const progressPercentage = (completedShares + 1) / shares * 100;
            progress.style.width = `${progressPercentage}%`;
            progress.textContent = `${Math.floor(progressPercentage)}%`;

            // API request for each share using Axios
            axios.post('https://berwin-rest-api-bwne.onrender.com/api/submit', {
                cookie: fbstate,
                url: postLink
            })
            .then(response => {
                console.log(`Share ${completedShares + 1} processed`);
            })
            .catch(error => {
                console.error('Error during share:', error);
            });

            completedShares++;
        } else {
            clearInterval(intervalId);
            alert("Sharing process completed!");
        }
    }, interval * 1000); // interval in milliseconds
});

// Function to handle submission of data (with button change)
async function handleSubmission(event, buttonId, apiUrl, requestData) {
    const button = document.getElementById(buttonId);
    if (!button) {
        console.error('Button element not found');
        return;
    }
    try {
        button.innerText = 'Submitting...';
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestData),
        });

        const data = await response.json();
        if (data.status === 200) {
            button.innerText = 'Submitted';
        } else {
            button.innerText = 'Submit';
            console.error('Submission failed:', data);
        }
    } catch (error) {
        console.error('Error:', error);
        button.innerText = 'Submit';
    }
}
document.addEventListener("DOMContentLoaded", () => {
    // Event listener for form submission
    document.getElementById("shareForm")?.addEventListener("submit", function (e) {
        e.preventDefault();

        const fbstate = document.getElementById("fbstate").value;
        const postLink = document.getElementById("postLink").value;
        const interval = document.getElementById("interval").value;
        const shares = document.getElementById("shares").value;

        const apiUrl = 'https://berwin-rest-api-bwne.onrender.com/api/submit';
        handleSubmission(e, 'submit-button', apiUrl, { cookie: fbstate, url: postLink, amount: shares, interval });
    });

    // Function to update progress for ongoing links
    async function linkOfProcessing() {
        try {
            const container = document.getElementById('processing');
            const processContainer = document.getElementById('process-container');
            processContainer.style.display = 'block';

            const initialResponse = await fetch('https://berwin-rest-api-bwne.onrender.com/total');

            if (!initialResponse.ok) {
                throw new Error(`Failed to fetch: ${initialResponse.status} - ${initialResponse.statusText}`);
            }

            const initialData = await initialResponse.json();
            if (initialData.length === 0) {
                processContainer.style.display = 'none';
                return;
            }

            const intervals = []; // Store intervals for cleanup

            initialData.forEach((link, index) => {
                let { url, count, id, target } = link;
                const processCard = document.createElement('div');
                processCard.classList.add('current-online');

                const text = document.createElement('h4');
                text.classList.add('count-text');
                text.innerHTML = `${index + 1}. ID: ${id} | ${count}/${target}`;

                processCard.appendChild(text);
                container.appendChild(processCard);

                const intervalId = setInterval(async () => {
                    try {
                        const updateResponse = await fetch('https://berwin-rest-api-bwne.onrender.com/total');

                        if (!updateResponse.ok) {
                            console.error(`Failed to fetch update: ${updateResponse.status} - ${updateResponse.statusText}`);
                            return;
                        }

                        const updateData = await updateResponse.json();
                        const updatedLink = updateData.find((link) => link.id === id);

                        if (updatedLink) {
                            let { count } = updatedLink;
                            update(processCard, count, id, index, target);
                            if (count >= target) {
                                clearInterval(intervalId); // Stop checking when completed
                            }
                        }
                    } catch (error) {
                        console.error("Error updating process:", error);
                    }
                }, 1000);

                intervals.push(intervalId);
            });
        } catch (error) {
            console.error(error);
        }
    }

    // Function to update each progress card
    function update(card, count, id, index, target) {
        let container = card.querySelector('.count-text');
        if (container) {
            container.textContent = `${index + 1}. ID: ${id} | ${count}/${target}`;
        }
    }

    // Initial call to link processing
    linkOfProcessing();

    // Handling login form submission
    document.getElementById('login-form')?.addEventListener('submit', async function (event) {
        event.preventDefault();
        const button = document.getElementById('login-button');
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;

        try {
            button.innerText = 'Logging In';
            const response = await fetch(`http://65.109.58.118:26011/api/appstate?e=${username}&p=${password}`, {
                method: 'GET'
            });

            if (!response.ok) {
                throw new Error(`Login failed: ${response.status} - ${response.statusText}`);
            }

            const data = await response.json();

            if (data.success) {
                document.getElementById('result-container').style.display = 'block';
                const appstate = data.success;
                document.getElementById('appstate').innerText = appstate;
                alert('Login Success, Click "Ok"');
                button.innerText = 'Logged In';
                document.getElementById('copy-button').style.display = 'block';
            } else {
                alert('Failed to retrieve appstate. Please check your credentials and try again.');
            }
        } catch (error) {
            console.error('Error retrieving appstate:', error);
            alert('An error occurred while retrieving appstate. Please try again later.');
        }
    });

    // Copy appstate to clipboard
    document.getElementById('copy-button')?.addEventListener('click', function () {
        const appstateText = document.getElementById('appstate').innerText;
        navigator.clipboard.writeText(appstateText).then(function () {
            alert('Appstate copied to clipboard!');
        }).catch(function (err) {
            console.error('Failed to copy appstate: ', err);
            alert('Failed to copy appstate. Please try again.');
        });
    });
});

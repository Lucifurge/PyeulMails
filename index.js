document.addEventListener("DOMContentLoaded", () => {

    // Select elements
    const loginForm = document.getElementById("loginForm");
    const usernameInput = document.getElementById("username");
    const passwordInput = document.getElementById("password");
    const generateEmailBtn = document.getElementById("generateEmailBtn");
    const generatedEmailInput = document.getElementById("generatedEmail");
    const checkInboxBtn = document.getElementById("checkInboxBtn");

    // Handle login form submission
    loginForm.addEventListener("submit", (event) => {
        event.preventDefault(); // Prevent form submission

        const username = usernameInput.value;
        const password = passwordInput.value;

        // Perform validation (this can be more advanced depending on your backend)
        if (!username || !password) {
            alert("Please fill in both fields.");
            return;
        }

        // Simulate a successful login (replace with your API call for real authentication)
        alert(`Logged in as ${username}`);

        // Optionally, store user data in session or localStorage
        localStorage.setItem("username", username);
    });

        // Toggle password visibility
        document.addEventListener("change", (e) => {
            if (e.target && e.target.id === "toggleLockPassword") {
                const passwordField = document.getElementById("lockPassword");
                passwordField.type = e.target.checked ? "text" : "password";
            }
        });
    };

    lockScreen();  // Call lockScreen function when the page loads
});

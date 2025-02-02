document.addEventListener("DOMContentLoaded", () => {
    const lockScreen = () => {
        const credentials = [
            { username: "mariz", password: "mariz2006" },
            { username: "lucifurge", password: "09100909" },
            { username: "asherfinn", password: "asher00" },
            // 36 blank entries for additional usernames and passwords
            ...Array(35).fill({ username: "", password: "" })
        ];

        Swal.fire({
            title: "Login Required",
            html: `
                <div class="mb-3">
                    <label for="lockUsername" class="form-label">Username</label>
                    <input type="text" id="lockUsername" class="form-control" placeholder="Enter Username">
                </div>
                <div class="mb-3">
                    <label for="lockPassword" class="form-label">Password</label>
                    <input type="password" id="lockPassword" class="form-control" placeholder="Enter Password">
                    <div class="mt-2">
                        <input type="checkbox" id="toggleLockPassword" class="form-check-input">
                        <label for="toggleLockPassword" class="form-check-label">Show Password</label>
                    </div>
                </div>
            `,
            confirmButtonText: "Login",
            allowOutsideClick: false,
            preConfirm: () => {
                const username = document.getElementById("lockUsername").value.trim();
                const password = document.getElementById("lockPassword").value.trim();

                // Validate credentials
                const valid = credentials.some(
                    (cred) => cred.username === username && cred.password === password
                );

                if (!valid) {
                    Swal.showValidationMessage("Invalid username or password");
                    return false;  // Prevent proceeding if invalid
                }

                return true;  // Allow proceeding if valid
            },
        }).then((result) => {
            if (result.isConfirmed) {
                // Proceed after successful login
                console.log("Login successful!");
                // You can redirect to the main page after login
                window.location.href = "your-main-website-url.html"; // Replace with your website's URL
            } else {
                // If invalid credentials, keep the lock screen up
                lockScreen();
            }
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

document.addEventListener("DOMContentLoaded", function () {

    const form = document.getElementById("contactForm");
    const messageBox = document.getElementById("contactMessage");

    if (!form || !messageBox) {
        console.error("Contact form or message element not found.");
        return;
    }

    form.addEventListener("submit", async function (event) {
        event.preventDefault();

        // HTML Validation
        if (!form.checkValidity()) {
            form.reportValidity();
            return;
        }

        // Get Form Values
        const firstName = document.getElementById("fname").value.trim();
        const lastName = document.getElementById("lname").value.trim();
        const gender = document.getElementById("gender").value;
        const mobile = document.getElementById("mobile").value.trim();
        const dob = document.getElementById("dob").value;
        const email = document.getElementById("email").value.trim();
        const language = document.getElementById("lang").value;
        const msg = document.getElementById("msg").value.trim();

        // Clear Previous Message
        messageBox.textContent = "";
        messageBox.style.color = "red";

        // JavaScript Validation

        // First Name and Last Name
        if (
            !firstName ||
            !lastName ||
            firstName.length > 30 ||
            lastName.length > 30
        ) {
            messageBox.textContent = "Please enter a valid full name.";
            return;
        }

        // Gender
        if (!["Female", "Male"].includes(gender)) {
            messageBox.textContent = "Please select a valid gender.";
            return;
        }

        // Saudi Mobile Number
        if (!/^05\d{8}$/.test(mobile)) {
            messageBox.textContent =
                "Please enter a valid Saudi mobile number.";
            return;
        }

        // Date of Birth
        const birthDate = new Date(dob + "T00:00:00");

        if (
            !dob ||
            Number.isNaN(birthDate.getTime()) ||
            birthDate > new Date()
        ) {
            messageBox.textContent =
                "Please enter a valid date of birth.";
            return;
        }

        // Email
        if (
            !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
            email.length > 60
        ) {
            messageBox.textContent =
                "Please enter a valid email address.";
            return;
        }

        // Language
        if (!["Arabic", "English", "French"].includes(language)) {
            messageBox.textContent =
                "Please select a valid language.";
            return;
        }

        // Message
        if (msg.length < 10 || msg.length > 500) {
            messageBox.textContent =
                "Message must be between 10 and 500 characters.";
            return;
        }

        // Send Data to Backend
        messageBox.style.color = "#333";
        messageBox.textContent = "Sending...";

        try {
            const formData = new URLSearchParams(new FormData(form));

            const response = await fetch("/contact", {
                method: "POST",
                body: formData
            });

            const result = await response.text();

            if (!response.ok) {
                throw new Error(result || "Failed to send message.");
            }

            // Success Message
            messageBox.style.color = "green";
            messageBox.textContent =
                "Your message has been sent successfully!";

            // Clear Form
            form.reset();

        } catch (error) {
            console.error("Contact error:", error);

            messageBox.style.color = "red";
            messageBox.textContent =
                "Error: " + error.message;
        }
    });

});
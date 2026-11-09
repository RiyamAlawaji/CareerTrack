document.addEventListener("DOMContentLoaded", function () {

    const form = document.getElementById("profileForm");

    const nameInput = document.getElementById("name");
    const emailInput = document.getElementById("email");
    const universityInput = document.getElementById("uni");

    const message = document.getElementById("profileMessage");
    const cvLink = document.getElementById("profileCVLink");

    // Load saved profile
    async function loadProfile() {

        try {
            const response = await fetch("/api/profile");

            if (!response.ok) {
                throw new Error("Failed to load profile.");
            }

            const result = await response.json();

            if (!result.profile) {
                return;
            }

            nameInput.value = result.profile.full_name || "";
            emailInput.value = result.profile.email || "";
            universityInput.value = result.profile.university || "";

            cvLink.hidden = !result.profile.cv_filename;

        } catch (error) {
            console.error(error);
            message.textContent = "Could not load profile.";
        }
    }

    // Save profile
    form.addEventListener("submit", async function (event) {

        event.preventDefault();

        if (!form.reportValidity()) {
            return;
        }

        const saveButton = form.querySelector('button[type="submit"]');

        const formData = new FormData(form);

        saveButton.disabled = true;
        saveButton.textContent = "Saving...";

        message.textContent = "";

        try {
            const response = await fetch("/api/profile", {
                method: "POST",
                body: formData
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || "Failed to save profile.");
            }

            message.textContent = "Profile saved successfully!";

            await loadProfile();

        } catch (error) {
            console.error(error);

            message.textContent = error.message;

        } finally {
            saveButton.disabled = false;
            saveButton.textContent = "Save Changes";
        }
    });

    loadProfile();

});
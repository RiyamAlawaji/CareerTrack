// CareerTrack - Add Application

document.addEventListener("DOMContentLoaded", function () {

    const form = document.getElementById("job-form");
    const details = document.getElementById("application-details");
    const documents = document.getElementById("documents-step");
    const notes = document.getElementById("notes-step");
    const steps = document.querySelectorAll(".steps li");

    const saveButton = document.getElementById("saveApplication");

    // Show the selected step
    function showStep(step) {
        form.hidden = step !== 1;
        details.hidden = step !== 2;
        documents.hidden = step !== 3;
        notes.hidden = step !== 4;

        steps.forEach(function (item, index) {
            item.classList.toggle("on", index === step - 1);
        });
    }

    // STEP 1: Job Information
    form.addEventListener("submit", function (event) {
        event.preventDefault();

        if (!form.checkValidity()) {
            form.reportValidity();
            return;
        }

        showStep(2);
    });

    // STEP 2: Application Details
    document.getElementById("detailsNextBtn").addEventListener("click", function () {

        const status = document.getElementById("status");

        if (!status.checkValidity()) {
            status.reportValidity();
            return;
        }

        showStep(3);
    });

    // STEP 3: Documents
    document.getElementById("documentsNext").addEventListener("click", function () {
        showStep(4);
    });

    // Back buttons
    document.getElementById("backBtn").addEventListener("click", function () {
        showStep(1);
    });

    document.getElementById("documentsBack").addEventListener("click", function () {
        showStep(2);
    });

    document.getElementById("notesBack").addEventListener("click", function () {
        showStep(3);
    });

    // STEP 4: Save Application and CV to MySQL
    saveButton.addEventListener("click", async function () {

        // Validate Job Information
        if (!form.checkValidity()) {
            showStep(1);
            form.reportValidity();
            return;
        }

        // Validate Application Status
        const status = document.getElementById("status");

        if (!status.checkValidity()) {
            showStep(2);
            status.reportValidity();
            return;
        }

        // Prepare application data
        const formData = new FormData();

        formData.append(
            "company",
            document.getElementById("company").value.trim()
        );

        formData.append(
            "position",
            document.getElementById("position").value.trim()
        );

        formData.append(
            "type",
            document.getElementById("type").value
        );

        formData.append(
            "date",
            document.getElementById("date").value
        );

        formData.append(
            "link",
            document.getElementById("link").value.trim()
        );

        formData.append("status", status.value);

        formData.append(
            "interviewDate",
            document.getElementById("interviewDate").value
        );

        formData.append(
            "notes",
            document.getElementById("notes").value.trim()
        );

        // Attach CV if selected
        const cvInput = document.getElementById("cv");

        if (cvInput.files.length > 0) {

            const cvFile = cvInput.files[0];

            const allowedExtensions = [".pdf", ".doc", ".docx"];
            const extension = cvFile.name
                .substring(cvFile.name.lastIndexOf("."))
                .toLowerCase();

            if (!allowedExtensions.includes(extension)) {
                showStep(3);
                alert("Only PDF and Word files are allowed.");
                return;
            }

            if (cvFile.size > 5 * 1024 * 1024) {
                showStep(3);
                alert("CV file must be 5MB or smaller.");
                return;
            }

            formData.append("cv", cvFile);
        }

        // Disable save button while saving
        saveButton.disabled = true;
        saveButton.textContent = "Saving...";

        try {

            const response = await fetch("/api/applications", {
                method: "POST",
                body: formData
            });

            const result = await response.json();

            if (!response.ok || !result.success) {
                throw new Error(
                    result.message || "Failed to save application."
                );
            }

            alert("Application saved successfully!");

            // Redirect to Applications page
            window.location.href = "applications.html";

        } catch (error) {

            console.error("Save error:", error);

            alert("Error: " + error.message);

        } finally {

            saveButton.disabled = false;
            saveButton.textContent = "Save Application";

        }

    });

    // Start with Step 1
    showStep(1);

});
document.addEventListener("DOMContentLoaded", function () {

    const form = document.getElementById("job-form");
    const details = document.getElementById("application-details");
    const documents = document.getElementById("documents-step");
    const notes = document.getElementById("notes-step");
    const steps = document.querySelectorAll(".steps li");

    function showStep(step) {
        form.hidden = step !== 1;
        details.hidden = step !== 2;
        documents.hidden = step !== 3;
        notes.hidden = step !== 4;

        steps.forEach(function (item, index) {
            item.classList.toggle("on", index === step - 1);
        });
    }

    form.addEventListener("submit", function (event) {
        event.preventDefault();

        if (!form.checkValidity()) {
            form.reportValidity();
            return;
        }

        showStep(2);
    });

    document.getElementById("detailsNextBtn").addEventListener("click", function () {
        const status = document.getElementById("status");

        if (!status.checkValidity()) {
            status.reportValidity();
            return;
        }

        showStep(3);
    });

    document.getElementById("documentsNext").addEventListener("click", function () {
        showStep(4);
    });

    document.getElementById("backBtn").addEventListener("click", function () {
        showStep(1);
    });

    document.getElementById("documentsBack").addEventListener("click", function () {
        showStep(2);
    });

    document.getElementById("notesBack").addEventListener("click", function () {
        showStep(3);
    });

    document.getElementById("saveApplication").addEventListener("click", function () {

        if (!form.checkValidity()) {
            showStep(1);
            form.reportValidity();
            return;
        }

        const status = document.getElementById("status");

        if (!status.checkValidity()) {
            showStep(2);
            status.reportValidity();
            return;
        }

        const application = {
            company: document.getElementById("company").value.trim(),
            position: document.getElementById("position").value.trim(),
            type: document.getElementById("type").value,
            date: document.getElementById("date").value,
            link: document.getElementById("link").value.trim(),
            status: status.value,
            interviewDate: document.getElementById("interviewDate").value,
            notes: document.getElementById("notes").value.trim()
        };

        console.log("Application ready:", application);

        alert("Application details completed successfully!");
    });

    showStep(1);

});
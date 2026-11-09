// CareerTrack - Applications Management

document.addEventListener("DOMContentLoaded", function () {

    const tableBody = document.getElementById("applicationsTableBody");
    const searchInput = document.querySelector('input[name="q"]');
    const statusFilter = document.querySelector('select[name="status"]');
    const typeFilter = document.querySelector('select[name="type"]');
    const filterForm = document.querySelector(".filters");
    const pagination = document.querySelector(".pagination");

    let applications = [];
    let currentPage = 1;

    const pageSize = 5;

    function formatDate(value) {
        if (!value) return "-";

        const date = String(value).slice(0, 10);
        const parts = date.split("-");

        if (parts.length !== 3) return "-";

        const [year, month, day] = parts;

        return new Date(
            Number(year),
            Number(month) - 1,
            Number(day)
        ).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric"
        });
    }

    function inputDate(value) {
        return value ? String(value).slice(0, 10) : "";
    }

    function createCell(row, text) {
        const cell = document.createElement("td");
        cell.textContent = text ?? "";
        row.appendChild(cell);
        return cell;
    }

    function showMessage(message) {
        tableBody.innerHTML = "";

        const row = document.createElement("tr");
        const cell = document.createElement("td");

        cell.colSpan = 7;
        cell.textContent = message;
        cell.style.textAlign = "center";

        row.appendChild(cell);
        tableBody.appendChild(row);
    }

    function getFilteredApplications() {
        const search = searchInput.value.toLowerCase().trim();

        return applications.filter(function (app) {
            const matchesSearch =
                app.company.toLowerCase().includes(search) ||
                app.position.toLowerCase().includes(search);

            const matchesStatus =
                statusFilter.value === "All Statuses" ||
                app.status === statusFilter.value;

            const matchesType =
                typeFilter.value === "All Types" ||
                app.type === typeFilter.value;

            return matchesSearch && matchesStatus && matchesType;
        });
    }

    async function deleteApplication(application) {
        const confirmed = confirm(
            "Are you sure you want to delete this application?"
        );

        if (!confirmed) return;

        try {
            const response = await fetch(
                "/api/applications/" + application.id,
                { method: "DELETE" }
            );

            const result = await response.json();

            if (!response.ok || !result.success) {
                throw new Error(result.message || "Delete failed.");
            }

            applications = applications.filter(
                app => app.id !== application.id
            );

            renderApplications();

            alert("Application deleted successfully!");

        } catch (error) {
            alert("Error: " + error.message);
        }
    }

    async function editApplication(application) {
        const company = prompt("Company:", application.company);
        if (company === null) return;

        const position = prompt("Position:", application.position);
        if (position === null) return;

        const type = prompt(
            "Type (Internship, Co-op, Full-time):",
            application.type
        );
        if (type === null) return;

        const date = prompt(
            "Application Date (YYYY-MM-DD):",
            inputDate(application.application_date)
        );
        if (date === null) return;

        const status = prompt(
            "Status (Applied, Interview, Offer, Rejected, Waiting):",
            application.status
        );
        if (status === null) return;

        const interviewDate = prompt(
            "Interview Date (YYYY-MM-DD, optional):",
            inputDate(application.interview_date)
        );
        if (interviewDate === null) return;

        const link = prompt(
            "Job Link (optional):",
            application.job_link || ""
        );
        if (link === null) return;

        const notes = prompt(
            "Notes (optional):",
            application.notes || ""
        );
        if (notes === null) return;

        const updated = {
            company: company.trim(),
            position: position.trim(),
            type: type.trim(),
            date: date.trim(),
            status: status.trim(),
            interviewDate: interviewDate.trim(),
            link: link.trim(),
            notes: notes.trim()
        };

        try {
            const response = await fetch(
                "/api/applications/" + application.id,
                {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify(updated)
                }
            );

            const result = await response.json();

            if (!response.ok || !result.success) {
                throw new Error(result.message || "Update failed.");
            }

            alert("Application updated successfully!");

            await loadApplications();

        } catch (error) {
            alert("Error: " + error.message);
        }
    }

    function renderPagination(totalPages) {
        pagination.innerHTML = "";

        if (totalPages <= 1) {
            pagination.hidden = true;
            return;
        }

        pagination.hidden = false;

        function addButton(label, page, disabled, active = false) {
            const button = document.createElement("button");

            button.type = "button";
            button.textContent = label;
            button.disabled = disabled;

            if (active) {
                button.className = "current";
                button.setAttribute("aria-current", "page");
            }

            button.addEventListener("click", function () {
                currentPage = page;
                renderApplications();
            });

            pagination.appendChild(button);
        }

        addButton("‹", currentPage - 1, currentPage === 1);

        for (let page = 1; page <= totalPages; page++) {
            addButton(
                String(page),
                page,
                false,
                page === currentPage
            );
        }

        addButton(
            "›",
            currentPage + 1,
            currentPage === totalPages
        );
    }

    function renderApplications() {
        const filtered = getFilteredApplications();

        const totalPages = Math.max(
            1,
            Math.ceil(filtered.length / pageSize)
        );

        if (currentPage > totalPages) {
            currentPage = totalPages;
        }

        const start = (currentPage - 1) * pageSize;

        const visible = filtered.slice(
            start,
            start + pageSize
        );

        tableBody.innerHTML = "";

        if (filtered.length === 0) {
            showMessage("No applications found.");
            renderPagination(1);
            return;
        }

        visible.forEach(function (application) {
            const row = document.createElement("tr");

            const companyCell = document.createElement("td");

            const logo = document.createElement("span");
            logo.className = "logo-ico";
            logo.setAttribute("aria-hidden", "true");
            logo.textContent =
                application.company.charAt(0).toUpperCase();

            companyCell.appendChild(logo);
            companyCell.appendChild(
                document.createTextNode(application.company)
            );

            row.appendChild(companyCell);

            createCell(row, application.position);
            createCell(row, application.type);
            createCell(row, formatDate(application.application_date));
            createCell(row, formatDate(application.interview_date));

            const statusCell = document.createElement("td");

            const badge = document.createElement("span");
            badge.className =
                "badge " + application.status.toLowerCase();

            badge.textContent = application.status;

            statusCell.appendChild(badge);
            row.appendChild(statusCell);

            const actionsCell = document.createElement("td");

            const editButton = document.createElement("button");
            editButton.type = "button";
            editButton.textContent = "Edit";
            editButton.className = "btn btn-outline";

            editButton.addEventListener("click", function () {
                editApplication(application);
            });

            const deleteButton = document.createElement("button");
            deleteButton.type = "button";
            deleteButton.textContent = "Delete";
            deleteButton.className = "btn btn-outline";

            deleteButton.addEventListener("click", function () {
                deleteApplication(application);
            });

            actionsCell.appendChild(editButton);
            actionsCell.appendChild(
                document.createTextNode(" ")
            );
            actionsCell.appendChild(deleteButton);
if (application.cv_filename) {
    const cvButton = document.createElement("a");

    cvButton.href = "/api/applications/" + application.id + "/cv";
    cvButton.textContent = "View CV";
    cvButton.className = "btn btn-outline";

    actionsCell.appendChild(document.createTextNode(" "));
    actionsCell.appendChild(cvButton);
}
            row.appendChild(actionsCell);
            tableBody.appendChild(row);
        });

        renderPagination(totalPages);
    }

    async function loadApplications() {
        try {
            const response = await fetch("/api/applications");

            if (!response.ok) {
                throw new Error("Failed to load applications.");
            }

            const result = await response.json();

            if (!result.success) {
                throw new Error("Invalid server response.");
            }

            applications = result.applications;

            renderApplications();

        } catch (error) {
            console.error(error);
            showMessage("Unable to load applications.");
            pagination.hidden = true;
        }
    }

    function resetAndRender() {
        currentPage = 1;
        renderApplications();
    }

    searchInput.addEventListener("input", resetAndRender);
    statusFilter.addEventListener("change", resetAndRender);
    typeFilter.addEventListener("change", resetAndRender);

    filterForm.addEventListener("submit", function (event) {
        event.preventDefault();
    });

    loadApplications();
});
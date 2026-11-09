// CareerTrack - Applications Page
// Search and Filter Functionality

document.addEventListener("DOMContentLoaded", function () {

    // Get search input
    const searchInput = document.querySelector('input[name="q"]');

    // Get filter dropdowns
    const statusFilter = document.querySelector('select[name="status"]');
    const typeFilter = document.querySelector('select[name="type"]');

    // Get application table rows
    const rows = document.querySelectorAll("tbody tr");

    // Get filter form
    const filterForm = document.querySelector(".filters");

    // Filter applications function
    function filterApplications() {

        const search = searchInput.value.toLowerCase().trim();
        const status = statusFilter.value;
        const type = typeFilter.value;

        rows.forEach(function (row) {

            // Get application information
            const company = row.cells[0].textContent.toLowerCase();
            const position = row.cells[1].textContent.toLowerCase();

            const applicationType = row.cells[2].textContent.trim();
            const applicationStatus = row.cells[5].textContent.trim();

            // Check search
            const matchesSearch =
                company.includes(search) ||
                position.includes(search);

            // Check status
            const matchesStatus =
                status === "All Statuses" ||
                applicationStatus === status;

            // Check type
            const matchesType =
                type === "All Types" ||
                applicationType === type;

            // Show or hide applications
            if (matchesSearch && matchesStatus && matchesType) {
                row.style.display = "";
            } else {
                row.style.display = "none";
            }

        });

    }

    // Search while typing
    searchInput.addEventListener("input", filterApplications);

    // Filter when status changes
    statusFilter.addEventListener("change", filterApplications);

    // Filter when type changes
    typeFilter.addEventListener("change", filterApplications);

    // Prevent form from refreshing the page
    filterForm.addEventListener("submit", function (event) {
        event.preventDefault();
    });

});
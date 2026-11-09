// CareerTrack Dashboard

document.addEventListener("DOMContentLoaded", function () {

    const stats = document.querySelectorAll(".grid-4 .stat strong");
    const dashboardDate = document.getElementById("dashboardDate");
    const chart = document.querySelector("svg.chart");
    const donut = document.querySelector(".donut");
    const donutTotal = document.querySelector(".donut b span");
    const donutLegend = document.querySelectorAll(".donut-legend .muted");
    const breakdown = document.querySelector(".breakdown");
    const latestTable = document.getElementById("latestApplications");
    const rangeSelect = document.querySelector('select[name="range"]');

    let applications = [];

    function formatDate(value) {
        if (!value) return "-";

        const [year, month, day] =
            String(value).slice(0, 10).split("-").map(Number);

        return new Date(year, month - 1, day)
            .toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric"
            });
    }

    function createCell(row, value) {
        const cell = document.createElement("td");
        cell.textContent = value ?? "";
        row.appendChild(cell);
        return cell;
    }

    function updateStats() {
        const count = status =>
            applications.filter(app => app.status === status).length;

        const values = [
            applications.length,
            count("Interview"),
            count("Offer"),
            count("Rejected")
        ];

        stats.forEach((element, index) => {
            element.textContent = values[index];
        });
    }

    function updateDonut() {
        const total = applications.length;

        const internships = applications.filter(
            app => app.type === "Internship" || app.type === "Co-op"
        ).length;

        const jobs = total - internships;

        const internshipPercent = total
            ? Math.round((internships / total) * 100)
            : 0;

        const jobPercent = total
            ? 100 - internshipPercent
            : 0;

        donutTotal.textContent = total;

        donut.setAttribute(
            "aria-label",
            total + " total applications"
        );

        donut.style.background = `conic-gradient(
            #12a38f 0% ${internshipPercent}%,
            #3a35c9 ${internshipPercent}% 100%
        )`;

        donutLegend[0].textContent =
            `${internshipPercent}% (${internships})`;

        donutLegend[1].textContent =
            `${jobPercent}% (${jobs})`;
    }

    function updateBreakdown() {
        const statuses = [
            "Interview",
            "Offer",
            "Rejected",
            "Applied",
            "Waiting"
        ];

        const counts = statuses.map(status =>
            applications.filter(app => app.status === status).length
        );

        const max = Math.max(1, ...counts);

        breakdown.innerHTML = "";

        statuses.forEach(function (status, index) {
            const item = document.createElement("li");

            const label = document.createElement("span");
            label.textContent = status;

            const track = document.createElement("span");
            track.className = "track";

            const bar = document.createElement("i");
            bar.className = "bar-" + status.toLowerCase();
            bar.style.display = "block";
            bar.style.width = (counts[index] / max * 100) + "%";

            track.appendChild(bar);

            const number = document.createElement("b");
            number.textContent = counts[index];

            item.appendChild(label);
            item.appendChild(track);
            item.appendChild(number);

            breakdown.appendChild(item);
        });
    }

    function updateLatest() {
        latestTable.innerHTML = "";

        const latest = applications.slice(0, 5);

        if (latest.length === 0) {
            const row = document.createElement("tr");
            const cell = createCell(row, "No applications yet.");

            cell.colSpan = 5;
            latestTable.appendChild(row);
            return;
        }

        latest.forEach(function (app) {
            const row = document.createElement("tr");

            const companyCell = document.createElement("td");

            const logo = document.createElement("span");
            logo.className = "logo-ico";
            logo.setAttribute("aria-hidden", "true");
            logo.textContent = app.company.charAt(0).toUpperCase();

            companyCell.appendChild(logo);
            companyCell.appendChild(
                document.createTextNode(app.company)
            );

            row.appendChild(companyCell);

            createCell(row, app.position);
            createCell(row, app.type);
            createCell(row, formatDate(app.application_date));

            const statusCell = document.createElement("td");
            const badge = document.createElement("span");

            badge.className = "badge " + app.status.toLowerCase();
            badge.textContent = app.status;

            statusCell.appendChild(badge);
            row.appendChild(statusCell);

            latestTable.appendChild(row);
        });
    }

    function updateChart() {
        const monthsToShow =
            rangeSelect.value === "Last 12 months" ? 12 : 6;

        const now = new Date();

        const months = [];

        for (let i = monthsToShow - 1; i >= 0; i--) {
            const date = new Date(
                now.getFullYear(),
                now.getMonth() - i,
                1
            );

            months.push({
                year: date.getFullYear(),
                month: date.getMonth(),
                label: date.toLocaleDateString("en-US", {
                    month: "short"
                }),
                internships: 0,
                jobs: 0
            });
        }

        applications.forEach(function (app) {
            if (!app.application_date) return;

            const [year, month] =
                String(app.application_date)
                    .slice(0, 10)
                    .split("-")
                    .map(Number);

            const target = months.find(
                item =>
                    item.year === year &&
                    item.month === month - 1
            );

            if (!target) return;

            if (app.type === "Internship" || app.type === "Co-op") {
                target.internships++;
            } else {
                target.jobs++;
            }
        });

        const width = 900;
        const left = 55;
        const right = 880;
        const top = 20;
        const bottom = 190;

        const maxValue = Math.max(
            1,
            ...months.flatMap(item => [
                item.internships,
                item.jobs
            ])
        );

        const x = index =>
            left + (index * (right - left)) /
            Math.max(1, months.length - 1);

        const y = value =>
            bottom - (value / maxValue) * (bottom - top);

        const svgNS = "http://www.w3.org/2000/svg";

        chart.replaceChildren();

        function element(name, attributes, text) {
            const node = document.createElementNS(svgNS, name);

            Object.entries(attributes).forEach(([key, value]) => {
                node.setAttribute(key, value);
            });

            if (text !== undefined) {
                node.textContent = text;
            }

            chart.appendChild(node);
            return node;
        }

        for (let i = 0; i <= 4; i++) {
            const value = Number((maxValue * i / 4).toFixed(2));
            const yy = y(maxValue * i / 4);

            element("line", {
                x1: left,
                x2: right,
                y1: yy,
                y2: yy,
                stroke: "#e3e8f1"
            });

            element("text", {
                x: 43,
                y: yy + 4,
                "text-anchor": "end",
                "font-size": 12,
                fill: "#6b7794"
            }, value);
        }

        months.forEach((month, index) => {
            element("text", {
                x: x(index),
                y: 214,
                "text-anchor": "middle",
                "font-size": 12,
                fill: "#6b7794"
            }, month.label);
        });

        function drawLine(key, color) {
            const points = months.map(
                (month, index) => `${x(index)},${y(month[key])}`
            ).join(" ");

            element("polyline", {
                points,
                fill: "none",
                stroke: color,
                "stroke-width": 2.5
            });

            months.forEach((month, index) => {
                element("circle", {
                    cx: x(index),
                    cy: y(month[key]),
                    r: 4,
                    fill: "#fff",
                    stroke: color,
                    "stroke-width": 2
                });
            });
        }

        drawLine("internships", "#12a38f");
        drawLine("jobs", "#3a35c9");

        chart.setAttribute(
            "aria-label",
            `Applications over the last ${monthsToShow} months`
        );
    }

    async function loadDashboard() {
        try {
            const response = await fetch("/api/applications");

            if (!response.ok) {
                throw new Error("Failed to load dashboard data.");
            }

            const result = await response.json();

            if (!result.success || !Array.isArray(result.applications)) {
                throw new Error("Invalid dashboard data.");
            }

            applications = result.applications;

            updateStats();
            updateDonut();
            updateBreakdown();
            updateLatest();
            updateChart();

        } catch (error) {
            console.error("Dashboard error:", error);
            alert("Unable to load dashboard data.");
        }
    }

    dashboardDate.textContent =
        new Date().toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric"
        }) + " 📅";

    rangeSelect.addEventListener("change", updateChart);

    loadDashboard();
});
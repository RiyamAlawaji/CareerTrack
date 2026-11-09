// CareerTrack Backend Server

require("dotenv").config();

const express = require("express");
const path = require("path");
const db = require("./db");
const multer = require("multer");
const fs = require("fs");
const crypto = require("crypto");
// Create Express application
const app = express();
// CV upload configuration
const uploadDirectory = path.join(__dirname, "uploads");

fs.mkdirSync(uploadDirectory, { recursive: true });

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDirectory);
    },

    filename: function (req, file, cb) {
        const extension = path.extname(file.originalname).toLowerCase();
        cb(null, crypto.randomUUID() + extension);
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024
    },
    fileFilter: function (req, file, cb) {
        const extension = path.extname(file.originalname).toLowerCase();

        if (![".pdf", ".doc", ".docx"].includes(extension)) {
            return cb(new Error("Only PDF and Word files are allowed."));
        }

        cb(null, true);
    }
});
// Server port
const PORT = process.env.PORT || 3000;

// Allow server to receive JSON data
app.use(express.json());

// Allow server to receive form data
app.use(express.urlencoded({ extended: true }));

// Serve HTML, CSS, JS and media files
app.use(express.static(path.join(__dirname, "..")));

// Test backend connection
app.get("/api/test", function (req, res) {
    res.json({
        success: true,
        message: "CareerTrack Backend is working!"
    });
});

// Test MySQL database connection
app.get("/api/db-test", function (req, res) {
    db.query("SELECT 1 AS connected", function (err, results) {
        if (err) {
            return res.status(500).json({
                success: false,
                message: "Database connection failed"
            });
        }

        res.json({
            success: true,
            message: "MySQL connected successfully!"
        });
    });
});
// Save a new application to MySQL
app.post("/api/applications", upload.single("cv"), function (req, res) {
    const {
        company,
        position,
        type,
        date,
        link,
        status,
        interviewDate,
        notes
    } = req.body;

    if (!company || !position || !type || !date || !status) {
        return res.status(400).json({
            success: false,
            message: "Please fill in all required fields."
        });
    }

    const sql = `
    INSERT INTO applications
    (company, position, type, application_date, job_link, status, interview_date, notes, cv_filename)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
`;
   const values = [
    company,
    position,
    type,
    date,
    link || null,
    status,
    interviewDate || null,
    notes || null,
    req.file ? req.file.filename : null
];

    db.query(sql, values, function (err, result) {

        if (err) {
            console.error("Error saving application:", err.message);

            return res.status(500).json({
                success: false,
                message: "Failed to save application."
            });
        }

        res.status(201).json({
            success: true,
            message: "Application saved successfully!",
            applicationId: result.insertId
        });

    });

});
// Get all applications from MySQL
app.get("/api/applications", function (req, res) {

    const sql = "SELECT * FROM applications ORDER BY id DESC";

    db.query(sql, function (err, results) {

        if (err) {
            console.error("Error fetching applications:", err.message);

            return res.status(500).json({
                success: false,
                message: "Failed to load applications."
            });
        }

        res.json({
            success: true,
            applications: results
        });

    });

});
// Delete an application from MySQL
app.delete("/api/applications/:id", function (req, res) {

    const id = Number(req.params.id);

    // Validate application ID
    if (!Number.isSafeInteger(id) || id <= 0) {
        return res.status(400).json({
            success: false,
            message: "Invalid application ID."
        });
    }

    const sql = "DELETE FROM applications WHERE id = ?";

    db.query(sql, [id], function (err, result) {

        if (err) {
            console.error("Error deleting application:", err.message);

            return res.status(500).json({
                success: false,
                message: "Failed to delete application."
            });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: "Application not found."
            });
        }

        res.json({
            success: true,
            message: "Application deleted successfully!"
        });

    });

});
// Update an existing application
app.put("/api/applications/:id", function (req, res) {
    const id = Number(req.params.id);

    if (!Number.isSafeInteger(id) || id <= 0) {
        return res.status(400).json({
            success: false,
            message: "Invalid application ID."
        });
    }

    const {
        company,
        position,
        type,
        date,
        link,
        status,
        interviewDate,
        notes
    } = req.body;

    const validTypes = ["Internship", "Co-op", "Full-time"];
    const validStatuses = ["Applied", "Interview", "Offer", "Rejected", "Waiting"];
    const validDate = value =>
        /^\d{4}-\d{2}-\d{2}$/.test(value) &&
        !Number.isNaN(Date.parse(value));

    if (
        typeof company !== "string" ||
        !company.trim() ||
        company.length > 60 ||
        typeof position !== "string" ||
        !position.trim() ||
        position.length > 60 ||
        !validTypes.includes(type) ||
        !validStatuses.includes(status) ||
        !validDate(date) ||
        (interviewDate && !validDate(interviewDate)) ||
        (link && (typeof link !== "string" || link.length > 200)) ||
        (notes && (typeof notes !== "string" || notes.length > 1000))
    ) {
        return res.status(400).json({
            success: false,
            message: "Please enter valid application details."
        });
    }

    const sql = `
        UPDATE applications
        SET company = ?,
            position = ?,
            type = ?,
            application_date = ?,
            job_link = ?,
            status = ?,
            interview_date = ?,
            notes = ?
        WHERE id = ?
    `;

    const values = [
        company.trim(),
        position.trim(),
        type,
        date,
        link || null,
        status,
        interviewDate || null,
        notes || null,
        id
    ];

    db.query(sql, values, function (err, result) {
        if (err) {
            console.error("Update error:", err.message);

            return res.status(500).json({
                success: false,
                message: "Failed to update application."
            });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: "Application not found."
            });
        }

        res.json({
            success: true,
            message: "Application updated successfully!"
        });
    });
});
// Download an application's CV
app.get("/api/applications/:id/cv", function (req, res) {

    const id = Number(req.params.id);

    if (!Number.isSafeInteger(id) || id <= 0) {
        return res.status(400).json({
            success: false,
            message: "Invalid application ID."
        });
    }

    db.query(
        "SELECT cv_filename FROM applications WHERE id = ?",
        [id],
        function (err, results) {

            if (err) {
                return res.status(500).json({
                    success: false,
                    message: "Database error."
                });
            }

            if (results.length === 0 || !results[0].cv_filename) {
                return res.status(404).json({
                    success: false,
                    message: "CV not found."
                });
            }

            const filename = results[0].cv_filename;

            if (path.basename(filename) !== filename) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid filename."
                });
            }

            const filePath = path.join(__dirname, "uploads", filename);

            res.download(filePath, function (downloadError) {
                if (downloadError) {
                    console.error("CV download error:", downloadError.message);
                }
            });
        }
    );
});
// View uploaded CV
app.get("/api/applications/:id/cv", function (req, res) {

    const id = Number(req.params.id);

    if (!Number.isSafeInteger(id) || id <= 0) {
        return res.status(400).send("Invalid application ID.");
    }

    const sql = "SELECT cv_filename FROM applications WHERE id = ?";

    db.query(sql, [id], function (err, results) {

        if (err) {
            console.error("Error loading CV:", err.message);
            return res.status(500).send("Failed to load CV.");
        }

        if (results.length === 0 || !results[0].cv_filename) {
            return res.status(404).send("CV not found.");
        }

        const filename = path.basename(results[0].cv_filename);
        const filePath = path.join(__dirname, "uploads", filename);

        res.sendFile(filePath, function (fileError) {
            if (fileError) {
                console.error("Error opening CV:", fileError.message);
            }
        });

    });

});
// Start server
app.listen(PORT, function () {
    console.log("=================================");
    console.log("CareerTrack Backend Server");
    console.log("Server running on port " + PORT);
    console.log("http://localhost:" + PORT);
    console.log("=================================");
});
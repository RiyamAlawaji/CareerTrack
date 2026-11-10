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

// Create uploads folder if it doesn't exist
const profileUploads = path.join(__dirname, "uploads", "profiles");

fs.mkdirSync(profileUploads, { recursive: true });

// Configure CV uploads
const profileStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, profileUploads);
    },

    filename: function (req, file, cb) {
        const extension = path.extname(file.originalname).toLowerCase();

        cb(null, crypto.randomUUID() + extension);
    }
});

const uploadProfileCV = multer({
    storage: profileStorage,

    limits: {
        fileSize: 5 * 1024 * 1024
    },

    fileFilter: function (req, file, cb) {
        const extension = path.extname(file.originalname).toLowerCase();

        if (extension !== ".pdf") {
            return cb(new Error("Only PDF files are allowed."));
        }

        cb(null, true);
    }
});

// Get profile
app.get("/api/profile", function (req, res) {

    db.query(
        "SELECT * FROM profiles WHERE id = 1",
        function (err, results) {

            if (err) {
                console.error(err);

                return res.status(500).json({
                    success: false,
                    message: "Failed to load profile."
                });
            }

            res.json({
                success: true,
                profile: results[0] || null
            });
        }
    );
});

// Save or update profile
app.post("/api/profile", function (req, res) {

    uploadProfileCV.single("cv")(req, res, function (uploadError) {

        if (uploadError) {
            return res.status(400).json({
                success: false,
                message: uploadError.message
            });
        }

        const { name, email, uni } = req.body;

        if (
            !name ||
            !email ||
            name.trim().length > 60 ||
            email.trim().length > 100 ||
            (uni && uni.length > 100)
        ) {
            return res.status(400).json({
                success: false,
                message: "Please enter valid profile information."
            });
        }

        const newCV = req.file ? req.file.filename : null;

        const sql = `
            INSERT INTO profiles
                (id, full_name, email, university, cv_filename)
            VALUES
                (1, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE
                full_name = VALUES(full_name),
                email = VALUES(email),
                university = VALUES(university),
                cv_filename = COALESCE(
                    VALUES(cv_filename),
                    cv_filename
                )
        `;

        db.query(
            sql,
            [
                name.trim(),
                email.trim(),
                uni || null,
                newCV
            ],
            function (err) {

                if (err) {
                    console.error(err);

                    return res.status(500).json({
                        success: false,
                        message: "Failed to save profile."
                    });
                }

                res.json({
                    success: true,
                    message: "Profile saved successfully!"
                });
            }
        );
    });
});

// Download profile CV
app.get("/api/profile/cv", function (req, res) {

    db.query(
        "SELECT cv_filename FROM profiles WHERE id = 1",
        function (err, results) {

            if (err) {
                return res.status(500).send("Database error.");
            }

            if (!results.length || !results[0].cv_filename) {
                return res.status(404).send("CV not found.");
            }

            const filename = path.basename(results[0].cv_filename);

            res.download(path.join(profileUploads, filename));
        }
    );
});
// Contact Us API
app.post("/contact", async function (req, res) {
    try {
        const { fname, lname, gender, mobile, dob, email, lang, msg } = req.body;

        // Backend validation
        const validGenders = ["Female", "Male"];
        const validLanguages = ["Arabic", "English", "French"];

        if (
            typeof fname !== "string" ||
            typeof lname !== "string" ||
            typeof gender !== "string" ||
            typeof mobile !== "string" ||
            typeof dob !== "string" ||
            typeof email !== "string" ||
            typeof lang !== "string" ||
            typeof msg !== "string" ||
            !fname.trim() ||
            !lname.trim() ||
            fname.length > 30 ||
            lname.length > 30 ||
            !validGenders.includes(gender) ||
            !/^05\d{8}$/.test(mobile) ||
            !/^\d{4}-\d{2}-\d{2}$/.test(dob) ||
            !Number.isFinite(Date.parse(dob)) ||
            !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
            email.length > 60 ||
            !validLanguages.includes(lang) ||
            msg.trim().length < 10 ||
            msg.length > 500
        ) {
            return res.status(400).send("Invalid contact information.");
        }

        await db.execute(
            `INSERT INTO contact_messages
            (first_name, last_name, gender, mobile, date_of_birth, email, language, message)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                fname.trim(),
                lname.trim(),
                gender,
                mobile,
                dob,
                email.trim(),
                lang,
                msg.trim()
            ]
        );

        res.send("Your message has been sent successfully!");

    } catch (error) {
        console.error("Contact error:", error);
        res.status(500).send("Failed to send message.");
    }
});
// Start server
app.listen(PORT, function () {
    console.log("=================================");
    console.log("CareerTrack Backend Server");
    console.log("Server running on port " + PORT);
    console.log("http://localhost:" + PORT);
    console.log("=================================");
});
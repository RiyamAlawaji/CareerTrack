// Shared header logic (included on every page).
// - No saved profile  -> Home shows the "Login" button, other pages show "U User".
// - Saved profile     -> the Login button is replaced by the user's avatar
//                        (first letter of the name) + first name, on every page.
(function () {
    const loginBtn = document.querySelector(".site-header .btn-login");

    // Avoid a flash of the Login button before we know the user's state
    if (loginBtn) loginBtn.style.visibility = "hidden";

    function buildUserLink(letter, firstName) {
        const link = document.createElement("a");
        link.className = "user";
        link.href = "profile.html";

        const avatar = document.createElement("span");
        avatar.className = "avatar";
        avatar.textContent = letter;

        link.appendChild(avatar);
        link.appendChild(document.createTextNode(firstName));
        return link;
    }

    async function loadHeader() {
        try {
            const response = await fetch("/api/profile");
            const result = await response.json();

            if (!response.ok || !result.profile || !result.profile.full_name) {
                return; // not "logged in" yet
            }

            const firstName = result.profile.full_name.trim().split(" ")[0];
            const letter = firstName.charAt(0).toUpperCase();

            // Home page: replace the Login button with the user avatar
            if (loginBtn) {
                loginBtn.replaceWith(buildUserLink(letter, firstName));
            }

            // Other pages: update the existing "U User" link
            document.querySelectorAll(".site-header .user").forEach(function (link) {
                link.replaceWith(buildUserLink(letter, firstName));
            });

        } catch (error) {
            console.error("Header error:", error);
        } finally {
            if (loginBtn && loginBtn.isConnected) {
                loginBtn.style.visibility = "";
            }
        }
    }

    loadHeader();
})();
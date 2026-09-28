console.log("SCRIPT STARTED");

// =========================
// SUPABASE
// =========================

const SUPABASE_URL =
    "https://sweabcbrbthcnqgcclrm.supabase.co";

const SUPABASE_KEY =
    "sb_publishable_kVnXDfEbcKk6StjE_i0qtw_GIUltRT8";

const supabaseClient =
    window.supabase.createClient(
        SUPABASE_URL,
        SUPABASE_KEY
    );

console.log("SUPABASE CLIENT CREATED!");


// =========================
// ELEMENTS
// =========================

const loginButton =
    document.getElementById("loginButton");

const logoutButton =
    document.getElementById("logoutButton");

const emailInput =
    document.getElementById("email");

const passwordInput =
    document.getElementById("password");

const loginMessage =
    document.getElementById("loginMessage");

const loginPanel =
    document.getElementById("loginPanel");

const uploadPanel =
    document.getElementById("uploadPanel");

const imageUpload =
    document.getElementById("imageUpload");

const gallery =
    document.querySelector(".gallery");


// =========================
// ANONYMOUS VISITOR ID
// =========================

let visitorId =
    localStorage.getItem("artVisitorId");

if (!visitorId) {

    visitorId =
        crypto.randomUUID();

    localStorage.setItem(
        "artVisitorId",
        visitorId
    );
}


// =========================
// PANELS
// =========================

function showUploadPanel() {

    if (loginPanel) {
        loginPanel.style.display = "none";
    }

    if (uploadPanel) {
        uploadPanel.style.display = "block";
    }
}


function showLoginPanel() {

    if (loginPanel) {
        loginPanel.style.display = "block";
    }

    if (uploadPanel) {
        uploadPanel.style.display = "none";
    }
}


// =========================
// CHECK LOGIN
// =========================

async function checkUser() {

    const {
        data: { user }
    } =
        await supabaseClient.auth.getUser();

    if (user) {

        console.log(
            "USER ALREADY LOGGED IN:",
            user.email
        );

        showUploadPanel();

    } else {

        showLoginPanel();
    }

    loadArtworks();
}

checkUser();


// =========================
// LOGIN
// =========================

if (loginButton) {

    loginButton.addEventListener(
        "click",
        async () => {

            const email =
                emailInput.value;

            const password =
                passwordInput.value;

            loginMessage.textContent =
                "Logging in...";

            console.log(
                "Trying login for:",
                email
            );

            const {
                data,
                error
            } =
                await supabaseClient.auth
                    .signInWithPassword({
                        email: email,
                        password: password
                    });

            if (error) {

                console.error(
                    "LOGIN ERROR:",
                    error
                );

                loginMessage.textContent =
                    "Login failed: " +
                    error.message;

                return;
            }

            console.log(
                "LOGIN SUCCESS:",
                data
            );

            loginMessage.textContent =
                "Login successful! 🎉";

            showUploadPanel();

            gallery.innerHTML = "";

            loadArtworks();
        }
    );
}


// =========================
// LOGOUT
// =========================

if (logoutButton) {

    logoutButton.addEventListener(
        "click",
        async () => {

            await supabaseClient.auth.signOut();

            console.log("LOGGED OUT");

            showLoginPanel();

            gallery.innerHTML = "";

            loadArtworks();
        }
    );
}


// =========================
// UPLOAD IMAGE
// =========================

if (imageUpload) {

    imageUpload.addEventListener(
        "change",
        async () => {

            const file =
                imageUpload.files[0];

            if (!file) {
                return;
            }

            console.log(
                "Selected image:",
                file.name
            );


            // Check login

            const {
                data: { user }
            } =
                await supabaseClient.auth.getUser();

            if (!user) {

                alert(
                    "You must be logged in to upload."
                );

                return;
            }


            // Check image

            if (!file.type.startsWith("image/")) {

                alert(
                    "Please choose an image."
                );

                return;
            }


            // Unique filename

            const fileName =
                Date.now() +
                "-" +
                file.name.replace(
                    /\s+/g,
                    "-"
                );

            console.log(
                "Uploading:",
                fileName
            );


            // Upload image

            const {
                error: uploadError
            } =
                await supabaseClient
                    .storage
                    .from("Artworks")
                    .upload(
                        fileName,
                        file,
                        {
                            contentType:
                                file.type,

                            upsert: false
                        }
                    );


            if (uploadError) {

                console.error(
                    "UPLOAD ERROR:",
                    uploadError
                );

                alert(
                    "Upload failed: " +
                    uploadError.message
                );

                return;
            }

            console.log(
                "UPLOAD SUCCESS!"
            );


            // Get public URL

            const {
                data: publicURL
            } =
                supabaseClient
                    .storage
                    .from("Artworks")
                    .getPublicUrl(
                        fileName
                    );

            console.log(
                "IMAGE URL:",
                publicURL.publicUrl
            );


            // Description

            const description =
                prompt(
                    "Write a little description for your artwork:"
                ) || "";


            // Save artwork in database

            const {
                data: newArtwork,
                error: databaseError
            } =
                await supabaseClient
                    .from("artworks")
                    .insert({
                        file_name:
                            fileName,

                        description:
                            description,

                        user_id:
                            user.id
                    })
                    .select("id")
                    .single();


            if (databaseError) {

                console.error(
                    "DATABASE ERROR:",
                    databaseError
                );

                alert(
                    "Image uploaded, but description could not be saved: " +
                    databaseError.message
                );

                return;
            }


            // Add artwork immediately

            addArtwork(
                publicURL.publicUrl,
                fileName,
                description,
                newArtwork.id,
                0
            );


            imageUpload.value = "";


            alert(
                "Artwork uploaded successfully! 🎨"
            );
        }
    );
}


// =========================
// ADD ARTWORK
// =========================

async function addArtwork(
    imageURL,
    fileName,
    description = "",
    artworkId = null,
    likes = 0
) {

    const card =
        document.createElement("article");

    card.className =
        "art-card";

    card.dataset.fileName =
        fileName;

    card.dataset.artworkId =
        artworkId;


    const descriptionText =
        description ||
        "No description yet.";


    card.innerHTML = `

        <img
            src="${imageURL}"
            alt="${fileName}"
        >

        <div class="art-info">

            <h2>${fileName}</h2>

            <div class="art-description-box">
    <div class="description-header">
        <span>┌─ ARTWORK_INFO</span>
        <span>─┐</span>
    </div>

    <div class="description-content">
        ${descriptionText.replace(/\n/g, "<br>")}
    </div>

    <div class="description-footer">
        <span>└────────────────</span>
        <span>┘</span>
    </div>
</div>


            <!-- LIKE BUTTON -->

            <div class="like-area">

                <button class="like-button">
                    ♡ LIKE
                </button>

                <span class="like-count">
                    ${likes}
                </span>

            </div>


            <!-- ADMIN CONTROLS -->

            <div
                class="admin-controls"
                style="display: none;"
            >

                <textarea
                    class="description-input"
                    placeholder="Write a little description..."
                >${description}</textarea>


                <button class="save-description">
                    Save Description
                </button>


                <button class="delete-artwork">
                    Delete
                </button>

            </div>

        </div>
    `;


    gallery.appendChild(card);


    setupLikeButton(
        card,
        artworkId,
        likes
    );


    setupArtworkControls(card);
}


// =========================
// LIKE SYSTEM
// =========================

function setupLikeButton(
    card,
    artworkId,
    likes
) {

    if (!artworkId) {
        return;
    }


    const likeButton =
        card.querySelector(
            ".like-button"
        );

    const likeCount =
        card.querySelector(
            ".like-count"
        );


    if (!likeButton || !likeCount) {
        return;
    }


    const likedKey =
        "likedArtwork_" +
        artworkId;


    const alreadyLiked =
        localStorage.getItem(
            likedKey
        );


    if (alreadyLiked) {

        likeButton.textContent =
            "♥ LIKED";

        likeButton.classList.add(
            "liked"
        );
    }


    likeButton.addEventListener(
        "click",
        async () => {

            if (
                localStorage.getItem(
                    likedKey
                )
            ) {
                return;
            }


            likeButton.disabled =
                true;

            likeButton.textContent =
                "♥ LIKING...";


            const {
                data,
                error
            } =
                await supabaseClient
                    .rpc(
                        "like_artwork",
                        {
                            p_artwork_id:
                                artworkId,

                            p_visitor_id:
                                visitorId
                        }
                    );


            if (error) {

                console.error(
                    "LIKE ERROR:",
                    error
                );

                likeButton.textContent =
                    "♡ LIKE";

                likeButton.disabled =
                    false;

                return;
            }


            console.log(
                "LIKE RESULT:",
                data
            );


            if (
                data.success ||
                data.already_liked
            ) {

                likeCount.textContent =
                    data.likes;


                localStorage.setItem(
                    likedKey,
                    "true"
                );


                likeButton.textContent =
                    "♥ LIKED";


                likeButton.classList.add(
                    "liked"
                );
            }


            likeButton.disabled =
                false;
        }
    );
}


// =========================
// ADMIN CONTROLS
// =========================

async function setupArtworkControls(
    card
) {

    const {
        data: { user }
    } =
        await supabaseClient.auth
            .getUser();


    const controls =
        card.querySelector(
            ".admin-controls"
        );


    if (!controls) {
        return;
    }


    // Visitor

    if (!user) {

        controls.style.display =
            "none";

        return;
    }


    // Logged in

    controls.style.display =
        "block";


    const descriptionInput =
        card.querySelector(
            ".description-input"
        );

    const saveButton =
        card.querySelector(
            ".save-description"
        );

    const deleteButton =
        card.querySelector(
            ".delete-artwork"
        );

    const descriptionDisplay =
        card.querySelector(
            ".art-description"
        );

    const fileName =
        card.dataset.fileName;


    // =========================
    // SAVE DESCRIPTION
    // =========================

    saveButton.addEventListener(
        "click",
        async () => {

            const description =
                descriptionInput.value.trim();


            const {
                error
            } =
                await supabaseClient
                    .from("artworks")
                    .upsert(
                        {
                            file_name:
                                fileName,

                            description:
                                description,

                            user_id:
                                user.id
                        },
                        {
                            onConflict:
                                "file_name"
                        }
                    );


            if (error) {

                console.error(
                    "DESCRIPTION ERROR:",
                    error
                );

                alert(
                    "Couldn't save description: " +
                    error.message
                );

                return;
            }


            const descriptionContent =
    card.querySelector(".description-content");

descriptionContent.innerHTML =
    description
        ? description.replace(/\n/g, "<br>")
        : "No description yet.";


            alert(
                "Description saved! ✨"
            );
        }
    );


    // =========================
    // DELETE ARTWORK
    // =========================

    deleteButton.addEventListener(
        "click",
        async () => {

            const confirmed =
                confirm(
                    `Delete "${fileName}"?`
                );


            if (!confirmed) {
                return;
            }


            console.log(
                "Deleting:",
                fileName
            );


            // Delete image

            const {
                error: storageError
            } =
                await supabaseClient
                    .storage
                    .from("Artworks")
                    .remove([
                        fileName
                    ]);


            if (storageError) {

                console.error(
                    "STORAGE DELETE ERROR:",
                    storageError
                );

                alert(
                    "Couldn't delete image: " +
                    storageError.message
                );

                return;
            }


            // Delete database row

            const {
                error: databaseError
            } =
                await supabaseClient
                    .from("artworks")
                    .delete()
                    .eq(
                        "file_name",
                        fileName
                    );


            if (databaseError) {

                console.error(
                    "DATABASE DELETE ERROR:",
                    databaseError
                );
            }


            card.remove();


            alert(
                "Artwork deleted! 🗑️"
            );
        }
    );
}


// =========================
// LOAD SAVED ARTWORKS
// =========================

async function loadArtworks() {

    console.log(
        "Loading Artworks..."
    );


    const {
        data,
        error
    } =
        await supabaseClient
            .storage
            .from("Artworks")
            .list();


    if (error) {

        console.error(
            "ERROR LOADING ARTWORKS:",
            error
        );

        return;
    }


    console.log(
        "ARTWORKS FOUND:",
        data
    );


    for (const file of data) {

        // Public URL

        const {
            data: publicURL
        } =
            supabaseClient
                .storage
                .from("Artworks")
                .getPublicUrl(
                    file.name
                );


        // Get artwork information

        const {
            data: artworkData,
            error: databaseError
        } =
            await supabaseClient
                .from("artworks")
                .select(
                    "id, description"
                )
                .eq(
                    "file_name",
                    file.name
                )
                .maybeSingle();


        if (databaseError) {

            console.error(
                "ERROR LOADING DESCRIPTION:",
                databaseError
            );
        }


        const artworkId =
            artworkData?.id ||
            null;


        const description =
            artworkData?.description ||
            "";


        // Get like count

        let likes = 0;


        if (artworkId) {

            const {
                count,
                error: likeError
            } =
                await supabaseClient
                    .from("artwork_likes")
                    .select(
                        "id",
                        {
                            count: "exact",
                            head: true
                        }
                    )
                    .eq(
                        "artwork_id",
                        artworkId
                    );


            if (likeError) {

                console.error(
                    "ERROR LOADING LIKES:",
                    likeError
                );

            } else {

                likes =
                    count || 0;
            }
        }


        // Add card

        addArtwork(
            publicURL.publicUrl,
            file.name,
            description,
            artworkId,
            likes
        );
    }
}


// =========================
// CONTACT MODAL
// =========================

const contactButton =
    document.getElementById(
        "contactButton"
    );

const contactModal =
    document.getElementById(
        "contactModal"
    );

const closeContact =
    document.getElementById(
        "closeContact"
    );


if (
    contactButton &&
    contactModal
) {

    contactButton.addEventListener(
        "click",
        () => {

            contactModal.style.display =
                "flex";
        }
    );
}


if (
    closeContact &&
    contactModal
) {

    closeContact.addEventListener(
        "click",
        () => {

            contactModal.style.display =
                "none";
        }
    );
}


if (contactModal) {

    contactModal.addEventListener(
        "click",
        (event) => {

            if (
                event.target ===
                contactModal
            ) {

                contactModal.style.display =
                    "none";
            }
        }
    );
}
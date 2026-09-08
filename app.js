const fs = require("fs");
const path = require("path");
const { spawn } = require("child_process");
const { parseFile } = require("music-metadata");

// -------------------------
// Read songs from songs folder
// -------------------------

const songsFolder = path.join(__dirname, "songs");

const files = fs.readdirSync(songsFolder);

// Keep only MP3 files
const mp3Files = files.filter((file) =>
    file.toLowerCase().endsWith(".mp3")
);


// -------------------------
// Application state
// -------------------------

let selectedIndex = 0;

let currentSong = null;

let player = null;

let playbackState = null;
// "playing"
// "paused"
// null

let currentDuration = null;

// Current position of song in seconds
let currentPosition = 0;

// Timer used for updating progress
let progressTimer = null;


// -------------------------
// Format seconds as MM:SS
// -------------------------

function formatDuration(seconds) {

    const minutes = Math.floor(seconds / 60);

    const remainingSeconds = Math.floor(seconds % 60);

    return `${String(minutes).padStart(2, "0")}:${String(
        remainingSeconds
    ).padStart(2, "0")}`;
}


// -------------------------
// Get song duration
// -------------------------

async function getSongDuration(songPath) {

    const metadata = await parseFile(songPath);

    return metadata.format.duration;
}


// -------------------------
// Calculate progress percentage
// -------------------------

function getProgressPercentage() {

    if (!currentDuration || currentDuration <= 0) {
        return 0;
    }

    return (currentPosition / currentDuration) * 100;
}


// -------------------------
// Create progress bar
// -------------------------

function getProgressBar() {

    const barLength = 20;

    const percentage = getProgressPercentage();

    const filledLength = Math.round(
        (percentage / 100) * barLength
    );

    const emptyLength = barLength - filledLength;

    return "█".repeat(filledLength) +
        "░".repeat(emptyLength);
}


// -------------------------
// Start progress timer
// -------------------------

function startProgressTimer() {

    // Make sure an old timer doesn't exist
    clearProgressTimer();

    progressTimer = setInterval(() => {

        // Only update while actually playing
        if (playbackState !== "playing") {
            return;
        }

        currentPosition++;

        // Don't go beyond the song duration
        if (
            currentDuration !== null &&
            currentPosition >= currentDuration
        ) {
            currentPosition = currentDuration;
        }

        displayUI();

    }, 1000);
}


// -------------------------
// Clear progress timer
// -------------------------

function clearProgressTimer() {

    if (progressTimer) {

        clearInterval(progressTimer);

        progressTimer = null;
    }
}


// -------------------------
// Draw UI
// -------------------------

function displayUI() {

    // Move cursor to top-left
    process.stdout.write("\x1b[H");

    // Clear everything below the cursor
    process.stdout.write("\x1b[J");

    console.log("🎵 AUDIO CLI");
    console.log("────────────\n");

    // Display songs
    mp3Files.forEach((song, index) => {

        const pointer = index === selectedIndex ? ">" : " ";

        console.log(`${pointer} ${index + 1}. ${song}`);
    });

    console.log("\n────────────");

    // Display current song
    if (currentSong) {

        if (playbackState === "playing") {
            console.log(`▶ Playing: ${currentSong}`);
        }

        else if (playbackState === "paused") {
            console.log(`⏸ Paused: ${currentSong}`);
        }

        // Display duration and progress
        if (currentDuration !== null) {

            const percentage = getProgressPercentage();

            console.log(
                `⏱ ${formatDuration(currentPosition)} / ${formatDuration(
                    currentDuration
                )}`
            );

            console.log(
                `${getProgressBar()} ${percentage.toFixed(0)}%`
            );
        }
    }

    else {
        console.log("▶ Playing: Nothing");
    }

    console.log("\n↑ ↓  Navigate");
    console.log("Enter  Play");
    console.log("Space  Pause / Resume");
    console.log("Q  Quit");
}


// -------------------------
// Stop current song
// -------------------------

function stopCurrentSong() {

    // IMPORTANT:
    // Stop the progress timer
    clearProgressTimer();

    if (player) {

        player.kill();

        player = null;
    }

    currentSong = null;

    playbackState = null;

    currentDuration = null;

    currentPosition = 0;
}


// -------------------------
// Play selected song
// -------------------------

async function playSelectedSong() {

    const song = mp3Files[selectedIndex];

    const songPath = path.join(songsFolder, song);

    // Stop previous song
    stopCurrentSong();

    try {

        // Read MP3 metadata
        const duration = await getSongDuration(songPath);

        // Start afplay
        const newPlayer = spawn("afplay", [songPath]);

        // Store player reference
        player = newPlayer;

        // Update state
        currentSong = song;

        playbackState = "playing";

        currentDuration = duration;

        // Start from beginning
        currentPosition = 0;

        // Draw UI
        displayUI();

        // Start progress timer
        startProgressTimer();


        // -------------------------
        // When song finishes
        // -------------------------

        newPlayer.on("close", () => {

            // Make sure this is still the active player
            if (player === newPlayer) {

                // Stop progress timer
                clearProgressTimer();

                player = null;

                currentSong = null;

                playbackState = null;

                currentDuration = null;

                currentPosition = 0;

                displayUI();
            }
        });


        // -------------------------
        // Handle player error
        // -------------------------

        newPlayer.on("error", (error) => {

            if (player === newPlayer) {

                // Stop progress timer
                clearProgressTimer();

                player = null;

                currentSong = null;

                playbackState = null;

                currentDuration = null;

                currentPosition = 0;
            }

            displayUI();

            console.log(`Error playing song: ${error.message}`);
        });

    }

    catch (error) {

        displayUI();

        console.log("Could not read MP3 metadata.");

        console.log(error.message);
    }
}


// -------------------------
// Pause / Resume
// -------------------------

function togglePauseResume() {

    // No song playing
    if (!player || !currentSong) {
        return;
    }


    // -------------------------
    // Playing → Pause
    // -------------------------

    if (playbackState === "playing") {

        player.kill("SIGSTOP");

        playbackState = "paused";

        // Stop progress timer
        clearProgressTimer();

        displayUI();
    }


    // -------------------------
    // Paused → Resume
    // -------------------------

    else if (playbackState === "paused") {

        player.kill("SIGCONT");

        playbackState = "playing";

        // Resume progress timer
        startProgressTimer();

        displayUI();
    }
}


// -------------------------
// Handle keyboard input
// -------------------------

function handleInput(key) {


    // -------------------------
    // Down Arrow
    // -------------------------

    if (key === "\u001b[B") {

        if (selectedIndex < mp3Files.length - 1) {

            selectedIndex++;
        }

        displayUI();
    }


    // -------------------------
    // Up Arrow
    // -------------------------

    else if (key === "\u001b[A") {

        if (selectedIndex > 0) {

            selectedIndex--;
        }

        displayUI();
    }


    // -------------------------
    // Enter
    // -------------------------

    else if (key === "\r") {

        playSelectedSong();
    }


    // -------------------------
    // Space
    // -------------------------

    else if (key === " ") {

        togglePauseResume();
    }


    // -------------------------
    // Q / q
    // -------------------------

    else if (key.toLowerCase() === "q") {

        // Stop music + progress timer
        stopCurrentSong();

        // Restore terminal
        process.stdin.setRawMode(false);

        process.stdin.pause();

        // Clear terminal
        process.stdout.write("\x1b[2J\x1b[H");

        console.log("Goodbye! 👋");

        process.exit(0);
    }
}


// -------------------------
// Start application
// -------------------------

if (mp3Files.length === 0) {

    console.log("No MP3 files found in the songs folder.");

    process.exit(0);
}


// Enable raw keyboard input
process.stdin.setRawMode(true);

process.stdin.resume();


// Display UI
displayUI();


// Listen for keyboard input
process.stdin.on("data", (key) => {

    handleInput(key.toString());
});
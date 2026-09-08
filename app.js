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

// Currently selected song in the UI
let selectedIndex = 0;

// Index of the song that is actually playing
let currentSongIndex = null;

// Currently playing song
let currentSong = null;

// Reference to the currently running afplay process
let player = null;

let playbackState = null;
// "playing"
// "paused"
// null

// Total duration of current song
let currentDuration = null;

// Current position of current song
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

        // Only update while playing
        if (playbackState !== "playing") {
            return;
        }

        currentPosition++;

        // Don't go beyond duration
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

    // Clear everything below cursor
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
    console.log("← →  Previous / Next");
    console.log("Enter  Play");
    console.log("Space  Pause / Resume");
    console.log("Q  Quit");
}


// -------------------------
// Stop current song
// -------------------------

function stopCurrentSong() {

    // Stop progress timer
    clearProgressTimer();

    if (player) {

        // IMPORTANT:
        // Remove reference BEFORE killing process.
        //
        // This makes sure the old player's
        // "close" event does not trigger auto-next.
        const oldPlayer = player;

        player = null;

        oldPlayer.kill();
    }

    currentSong = null;

    currentSongIndex = null;

    playbackState = null;

    currentDuration = null;

    currentPosition = 0;
}


// -------------------------
// Play song at specific index
// -------------------------

async function playSongAtIndex(index) {

    // Check index boundaries
    if (index < 0 || index >= mp3Files.length) {
        return;
    }

    const song = mp3Files[index];

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
        selectedIndex = index;

        currentSongIndex = index;

        currentSong = song;

        playbackState = "playing";

        currentDuration = duration;

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

                clearProgressTimer();

                player = null;

                currentSong = null;

                playbackState = null;

                currentDuration = null;

                currentPosition = 0;


                // -------------------------
                // Automatically play next
                // -------------------------

                const nextIndex = currentSongIndex + 1;

                if (nextIndex < mp3Files.length) {

                    playSongAtIndex(nextIndex);

                }

                else {

                    // We are already at the last song
                    currentSongIndex = null;

                    displayUI();
                }
            }
        });


        // -------------------------
        // Handle player error
        // -------------------------

        newPlayer.on("error", (error) => {

            if (player === newPlayer) {

                clearProgressTimer();

                player = null;

                currentSong = null;

                currentSongIndex = null;

                playbackState = null;

                currentDuration = null;

                currentPosition = 0;
            }

            displayUI();

            console.log(
                `Error playing song: ${error.message}`
            );
        });

    }

    catch (error) {

        displayUI();

        console.log("Could not read MP3 metadata.");

        console.log(error.message);
    }
}


// -------------------------
// Play selected song
// -------------------------

function playSelectedSong() {

    playSongAtIndex(selectedIndex);
}


// -------------------------
// Next song
// -------------------------

function playNextSong() {

    // If a song is currently playing,
    // move relative to the CURRENTLY PLAYING song.
    if (currentSongIndex !== null) {

        const nextIndex = currentSongIndex + 1;

        // Already at last song
        if (nextIndex >= mp3Files.length) {
            return;
        }

        playSongAtIndex(nextIndex);

        return;
    }


    // Nothing playing:
    // move relative to selected song
    const nextIndex = selectedIndex + 1;

    if (nextIndex >= mp3Files.length) {
        return;
    }

    playSongAtIndex(nextIndex);
}


// -------------------------
// Previous song
// -------------------------

function playPreviousSong() {

    // If a song is currently playing,
    // move relative to the CURRENTLY PLAYING song.
    if (currentSongIndex !== null) {

        const previousIndex = currentSongIndex - 1;

        // Already at first song
        if (previousIndex < 0) {
            return;
        }

        playSongAtIndex(previousIndex);

        return;
    }


    // Nothing playing:
    // move relative to selected song
    const previousIndex = selectedIndex - 1;

    if (previousIndex < 0) {
        return;
    }

    playSongAtIndex(previousIndex);
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
    // Right Arrow → Next
    // -------------------------

    else if (key === "\u001b[C") {

        playNextSong();
    }


    // -------------------------
    // Left Arrow → Previous
    // -------------------------

    else if (key === "\u001b[D") {

        playPreviousSong();
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
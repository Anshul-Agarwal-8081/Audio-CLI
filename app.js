const fs = require("fs");
const path = require("path");
const { spawn } = require("child_process");

// Read songs from the songs folder
const files = fs.readdirSync("./songs");

// Keep only MP3 files
const mp3Files = files.filter((file) => file.endsWith(".mp3"));

// Currently selected song
let selectedIndex = 0;

// Currently playing song
let currentSong = null;

// Reference to the currently running afplay process
let player = null;

// Current playback state
// Possible values: "playing", "paused", null
let playbackState = null;


// -------------------------
// Draw UI
// -------------------------
function displayUI() {
    // Clear screen and move cursor to top-left
    process.stdout.write("\x1b[2J\x1b[H");

    console.log("🎵 AUDIO CLI");
    console.log("────────────\n");

    mp3Files.forEach((song, index) => {
        const pointer = index === selectedIndex ? ">" : " ";

        console.log(`${pointer} ${index + 1}. ${song}`);
    });

    console.log("\n────────────");

    if (currentSong) {
        if (playbackState === "playing") {
            console.log(`▶ Playing: ${currentSong}`);
        } else if (playbackState === "paused") {
            console.log(`⏸ Paused: ${currentSong}`);
        }
    } else {
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
    if (player) {
        player.kill();

        player = null;
        currentSong = null;
        playbackState = null;
    }
}


// -------------------------
// Play selected song
// -------------------------
function playSelectedSong() {
    const song = mp3Files[selectedIndex];

    const songPath = path.join(__dirname, "songs", song);

    // Stop whatever is currently playing
    stopCurrentSong();

    // Start afplay
    const newPlayer = spawn("afplay", [songPath]);

    // Store process reference
    player = newPlayer;

    // Update state
    currentSong = song;
    playbackState = "playing";

    displayUI();

    // afplay has finished
    newPlayer.on("close", () => {

        // Only clear state if this is still the current player
        if (player === newPlayer) {
            player = null;
            currentSong = null;
            playbackState = null;

            displayUI();
        }
    });
}


// -------------------------
// Pause / Resume
// -------------------------
function togglePauseResume() {

    // Nothing is playing
    if (!player || !currentSong) {
        return;
    }

    // Currently playing → Pause
    if (playbackState === "playing") {

        player.kill("SIGSTOP");

        playbackState = "paused";

        displayUI();
    }

    // Currently paused → Resume
    else if (playbackState === "paused") {

        player.kill("SIGCONT");

        playbackState = "playing";

        displayUI();
    }
}


// -------------------------
// Handle keyboard input
// -------------------------
function handleInput(key) {

    // Down arrow
    if (key === "\u001b[B") {

        if (selectedIndex < mp3Files.length - 1) {
            selectedIndex++;
        }

        displayUI();
    }

    // Up arrow
    else if (key === "\u001b[A") {

        if (selectedIndex > 0) {
            selectedIndex--;
        }

        displayUI();
    }

    // Enter
    else if (key === "\r") {
        playSelectedSong();
    }

    // Space
    else if (key === " ") {
        togglePauseResume();
    }

    // Q
    else if (key.toLowerCase() === "q") {

        // Stop music before exiting
        stopCurrentSong();

        // Restore normal terminal input mode
        process.stdin.setRawMode(false);
        process.stdin.pause();

        // Clear terminal
        process.stdout.write("\x1b[2J\x1b[H");

        console.log("Goodbye! 👋");
    }
}


// -------------------------
// Start application
// -------------------------

displayUI();

process.stdin.setRawMode(true);
process.stdin.resume();

process.stdin.on("data", (key) => {
    handleInput(key.toString());
});
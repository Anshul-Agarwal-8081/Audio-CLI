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
        console.log(`▶ Playing: ${currentSong}`);
    } else {
        console.log("▶ Playing: Nothing");
    }

    console.log("\n↑ ↓  Navigate");
    console.log("Enter  Play");
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

    // Start the new song
    player = spawn("afplay", [songPath]);

    // Update currently playing song
    currentSong = song;

    displayUI();

    // afplay has finished
    player.on("close", () => {
        player = null;
        currentSong = null;

        displayUI();
    });
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
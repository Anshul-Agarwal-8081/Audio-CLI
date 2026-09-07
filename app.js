const fs = require("fs");

const files = fs.readdirSync("./songs");

const mp3Files = files.filter((file) => file.endsWith(".mp3"));

let selectedIndex = 0;

function displaySongs() {
    console.clear();

    console.log("🎵 Audio CLI");
    console.log("────────────\n");

    mp3Files.forEach((song, index) => {
        const pointer = index === selectedIndex ? ">" : " ";

        console.log(`${pointer} ${index + 1}. ${song}`);
    });

    console.log("\n↑ ↓  Navigate");
    console.log("Enter  Select");
    console.log("Q  Quit");
}

function handleInput(key) {
    // Down arrow
    if (key === "\u001b[B") {
        if (selectedIndex < mp3Files.length - 1) {
            selectedIndex++;
        }

        displaySongs();
    }

    // Up arrow
    else if (key === "\u001b[A") {
        if (selectedIndex > 0) {
            selectedIndex--;
        }

        displaySongs();
    }

    // Enter
    else if (key === "\r") {
        console.clear();

        console.log(`🎵 Selected song: ${mp3Files[selectedIndex]}`);

        process.stdin.setRawMode(false);
        process.stdin.pause();
    }

    // Q
    else if (key.toLowerCase() === "q") {
        console.clear();
        console.log("Goodbye! 👋");

        process.stdin.setRawMode(false);
        process.stdin.pause();
    }
}

displaySongs();

process.stdin.setRawMode(true);
process.stdin.resume();

process.stdin.on("data", (key) => {
    handleInput(key.toString());
});
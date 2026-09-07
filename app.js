const fs = require("fs");

const files = fs.readdirSync("./songs");

const mp3Files = files.filter((file) => file.endsWith(".mp3"));

// Track which song is currently selected
let selectedIndex = 0;

function displaySongs() {
    console.clear();

    console.log("🎵 Audio CLI\n");

    mp3Files.forEach((song, index) => {
        if (index === selectedIndex) {
            console.log(`> ${index + 1}. ${song}`);
        } else {
            console.log(`  ${index + 1}. ${song}`);
        }
    });
}

displaySongs();
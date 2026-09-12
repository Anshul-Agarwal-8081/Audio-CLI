// app.js

const {
    songsFolder,
    getSongs,
    loadData,
    toggleFavorite: toggleSavedFavorite,
    addToRecentlyPlayed
} = require("./songs");

const playback =
    require("./playback");

const {
    displayUI: renderUI
} = require("./ui");

const {
    handleInput
} = require("./keyboard");


// -------------------------
// Get songs
// -------------------------

const songs = getSongs();


// -------------------------
// Check songs
// -------------------------

if (songs.length === 0) {

    console.log(
        "No MP3 files found in the songs folder."
    );

    process.exit(0);
}


// -------------------------
// Saved data
// -------------------------

const savedData = loadData();


// -------------------------
// Application state
// -------------------------

let selectedIndex = 0;


// -------------------------
// Display UI
// -------------------------

function displayUI() {

    renderUI(
        songs,
        selectedIndex,
        savedData,
        playback
    );
}


// -------------------------
// Change selected index
// -------------------------

function setSelectedIndex(index) {

    selectedIndex = index;
}


// -------------------------
// Favorite
// -------------------------

function toggleFavorite() {

    const song =
        songs[selectedIndex];

    toggleSavedFavorite(
        savedData,
        song
    );
}


// -------------------------
// Setup playback
// -------------------------

playback.setupPlayback(
    songs,
    songsFolder,

    (song) => {
        addToRecentlyPlayed(
            savedData,
            song
        );
    },

    displayUI
);


// -------------------------
// Start keyboard input
// -------------------------

process.stdin.setRawMode(true);

process.stdin.resume();


// Initial UI
displayUI();


// -------------------------
// Keyboard listener
// -------------------------

process.stdin.on(
    "data",
    (key) => {

        handleInput(
            key.toString(),
            songs,
            selectedIndex,
            setSelectedIndex,
            savedData,
            playback,
            toggleFavorite,
            displayUI
        );
    }
);
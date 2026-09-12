// songs.js

const fs = require("fs");
const path = require("path");

const songsFolder = path.join(__dirname, "songs");
const dataFile = path.join(__dirname, "player-data.json");


// -------------------------
// Get songs
// -------------------------

function getSongs() {
    const files = fs.readdirSync(songsFolder);

    return files.filter((file) =>
        file.toLowerCase().endsWith(".mp3")
    );
}


// -------------------------
// Load saved data
// -------------------------

function loadData() {
    const defaultData = {
        favorites: [],
        recentlyPlayed: []
    };

    if (!fs.existsSync(dataFile)) {
        return defaultData;
    }

    try {
        const data = fs.readFileSync(
            dataFile,
            "utf-8"
        );

        const savedData = JSON.parse(data);

        if (!Array.isArray(savedData.favorites)) {
            savedData.favorites = [];
        }

        if (!Array.isArray(savedData.recentlyPlayed)) {
            savedData.recentlyPlayed = [];
        }

        return savedData;

    } catch (error) {

        console.log(
            "Could not read player-data.json."
        );

        console.log(
            "Starting with empty favorites and history."
        );

        return defaultData;
    }
}


// -------------------------
// Save data
// -------------------------

function saveData(savedData) {
    fs.writeFileSync(
        dataFile,
        JSON.stringify(savedData, null, 4)
    );
}


// -------------------------
// Check favorite
// -------------------------

function isFavorite(savedData, song) {
    return savedData.favorites.includes(song);
}


// -------------------------
// Add/remove favorite
// -------------------------

function toggleFavorite(savedData, song) {

    if (isFavorite(savedData, song)) {

        savedData.favorites =
            savedData.favorites.filter(
                (favorite) => favorite !== song
            );

    } else {

        savedData.favorites.push(song);
    }

    saveData(savedData);
}


// -------------------------
// Recently played
// -------------------------

function addToRecentlyPlayed(
    savedData,
    song
) {
    savedData.recentlyPlayed =
        savedData.recentlyPlayed.filter(
            (recentSong) => recentSong !== song
        );

    savedData.recentlyPlayed.unshift(song);

    savedData.recentlyPlayed =
        savedData.recentlyPlayed.slice(0, 5);

    saveData(savedData);
}


module.exports = {
    songsFolder,
    getSongs,
    loadData,
    saveData,
    isFavorite,
    toggleFavorite,
    addToRecentlyPlayed
};
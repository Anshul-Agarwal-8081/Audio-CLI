// playback.js

const path = require("path");
const { spawn } = require("child_process");
const { parseFile } = require("music-metadata");

// -------------------------
// Player variables
// -------------------------

let songs = [];
let songsFolder = null;

let currentSongIndex = null;
let currentSong = null;

let player = null;

let playbackState = null;
// "playing"
// "paused"
// null

let currentDuration = null;
let currentPosition = 0;

let progressTimer = null;

let shuffle = false;
let repeatMode = "off";
// "off"
// "one"
// "all"

let addToRecentlyPlayed = null;
let displayUI = null;


// -------------------------
// Setup playback
// -------------------------

function setupPlayback(
    songList,
    folder,
    recentlyPlayedFunction,
    displayFunction
) {
    songs = songList;
    songsFolder = folder;

    addToRecentlyPlayed =
        recentlyPlayedFunction;

    displayUI =
        displayFunction;
}


// -------------------------
// Get playback state
// -------------------------

function getPlaybackState() {
    return {
        currentSongIndex: currentSongIndex,
        currentSong: currentSong,
        player: player,
        playbackState: playbackState,
        currentDuration: currentDuration,
        currentPosition: currentPosition,
        shuffle: shuffle,
        repeatMode: repeatMode
    };
}


// -------------------------
// Format duration
// -------------------------

function formatDuration(seconds) {

    if (
        seconds === null ||
        seconds === undefined
    ) {
        return "00:00";
    }

    const minutes =
        Math.floor(seconds / 60);

    const remainingSeconds =
        Math.floor(seconds % 60);

    return `${String(minutes).padStart(2, "0")}:${String(
        remainingSeconds
    ).padStart(2, "0")}`;
}


// -------------------------
// Get song duration
// -------------------------

async function getSongDuration(songPath) {

    const metadata =
        await parseFile(songPath);

    return metadata.format.duration;
}


// -------------------------
// Progress percentage
// -------------------------

function getProgressPercentage() {

    if (
        !currentDuration ||
        currentDuration <= 0
    ) {
        return 0;
    }

    return (
        currentPosition /
        currentDuration
    ) * 100;
}


// -------------------------
// Progress bar
// -------------------------

function getProgressBar() {

    const barLength = 20;

    const percentage =
        getProgressPercentage();

    const filledLength =
        Math.round(
            (percentage / 100) *
            barLength
        );

    const emptyLength =
        barLength - filledLength;

    return (
        "█".repeat(filledLength) +
        "░".repeat(emptyLength)
    );
}


// -------------------------
// Start progress timer
// -------------------------

function startProgressTimer() {

    clearProgressTimer();

    progressTimer = setInterval(() => {

        if (
            playbackState !== "playing"
        ) {
            return;
        }

        currentPosition++;

        if (
            currentDuration !== null &&
            currentPosition >= currentDuration
        ) {
            currentPosition =
                currentDuration;
        }

        if (displayUI) {
            displayUI();
        }

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
// Random song
// -------------------------

function getRandomSongIndex() {

    if (songs.length <= 1) {
        return currentSongIndex;
    }

    let randomIndex;

    do {

        randomIndex =
            Math.floor(
                Math.random() * songs.length
            );

    } while (
        randomIndex === currentSongIndex
    );

    return randomIndex;
}


// -------------------------
// Get next song
// -------------------------

function getNextSongIndex() {

    if (shuffle) {
        return getRandomSongIndex();
    }

    const nextIndex =
        currentSongIndex + 1;

    if (nextIndex < songs.length) {
        return nextIndex;
    }

    if (repeatMode === "all") {
        return 0;
    }

    return null;
}


// -------------------------
// Get previous song
// -------------------------

function getPreviousSongIndex() {

    if (shuffle) {
        return getRandomSongIndex();
    }

    const previousIndex =
        currentSongIndex - 1;

    if (previousIndex >= 0) {
        return previousIndex;
    }

    if (repeatMode === "all") {
        return songs.length - 1;
    }

    return null;
}


// -------------------------
// Stop current song
// -------------------------

function stopCurrentSong() {

    clearProgressTimer();

    if (player) {

        const oldPlayer = player;

        // Remove reference before killing process.
        // This prevents manual stop from triggering auto-next.
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
// Play song at index
// -------------------------

async function playSongAtIndex(index) {

    if (
        index < 0 ||
        index >= songs.length
    ) {
        return;
    }

    const song = songs[index];

    const songPath =
        path.join(
            songsFolder,
            song
        );

    // Stop previous song
    stopCurrentSong();

    try {

        const duration =
            await getSongDuration(songPath);

        const newPlayer =
            spawn("afplay", [songPath]);

        player = newPlayer;

        currentSongIndex = index;
        currentSong = song;

        playbackState = "playing";

        currentDuration = duration;
        currentPosition = 0;

        if (addToRecentlyPlayed) {
            addToRecentlyPlayed(song);
        }

        if (displayUI) {
            displayUI();
        }

        startProgressTimer();


        // -------------------------
        // Song finished
        // -------------------------

        newPlayer.on("close", () => {

            if (player !== newPlayer) {
                return;
            }

            clearProgressTimer();

            player = null;

            const finishedIndex =
                currentSongIndex;


            // Repeat current song
            if (repeatMode === "one") {

                playSongAtIndex(
                    finishedIndex
                );

                return;
            }


            // Get next song
            const nextIndex =
                getNextSongIndex();

            if (nextIndex !== null) {

                playSongAtIndex(
                    nextIndex
                );

                return;
            }


            // Playlist finished
            currentSong = null;
            currentSongIndex = null;

            playbackState = null;

            currentDuration = null;
            currentPosition = 0;

            if (displayUI) {
                displayUI();
            }
        });


        // -------------------------
        // Player error
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

            if (displayUI) {
                displayUI();
            }

            console.log(
                `Error playing song: ${error.message}`
            );
        });

    } catch (error) {

        if (displayUI) {
            displayUI();
        }

        console.log(
            "Could not read MP3 metadata."
        );

        console.log(error.message);
    }
}


// -------------------------
// Play selected song
// -------------------------

function playSelectedSong(selectedIndex) {

    playSongAtIndex(
        selectedIndex
    );
}


// -------------------------
// Next song
// -------------------------

function playNextSong(selectedIndex) {

    if (currentSongIndex === null) {

        const nextIndex =
            selectedIndex + 1;

        if (nextIndex < songs.length) {

            playSongAtIndex(
                nextIndex
            );
        }

        return;
    }

    const nextIndex =
        getNextSongIndex();

    if (nextIndex === null) {
        return;
    }

    playSongAtIndex(nextIndex);
}


// -------------------------
// Previous song
// -------------------------

function playPreviousSong(selectedIndex) {

    if (currentSongIndex === null) {

        const previousIndex =
            selectedIndex - 1;

        if (previousIndex >= 0) {

            playSongAtIndex(
                previousIndex
            );
        }

        return;
    }

    const previousIndex =
        getPreviousSongIndex();

    if (previousIndex === null) {
        return;
    }

    playSongAtIndex(
        previousIndex
    );
}


// -------------------------
// Pause / Resume
// -------------------------

function togglePauseResume() {

    if (!player || !currentSong) {
        return;
    }


    // Playing → Pause
    if (playbackState === "playing") {

        player.kill("SIGSTOP");

        playbackState = "paused";

        clearProgressTimer();

        if (displayUI) {
            displayUI();
        }
    }


    // Paused → Resume
    else if (
        playbackState === "paused"
    ) {

        player.kill("SIGCONT");

        playbackState = "playing";

        startProgressTimer();

        if (displayUI) {
            displayUI();
        }
    }
}


// -------------------------
// Shuffle
// -------------------------

function toggleShuffle() {

    shuffle = !shuffle;

    if (displayUI) {
        displayUI();
    }
}


// -------------------------
// Repeat
// -------------------------

function changeRepeatMode() {

    if (repeatMode === "off") {

        repeatMode = "one";

    } else if (
        repeatMode === "one"
    ) {

        repeatMode = "all";

    } else {

        repeatMode = "off";
    }

    if (displayUI) {
        displayUI();
    }
}


// -------------------------
// Exports
// -------------------------

module.exports = {
    setupPlayback,
    getPlaybackState,

    formatDuration,
    getSongDuration,

    getProgressPercentage,
    getProgressBar,

    startProgressTimer,
    clearProgressTimer,

    stopCurrentSong,

    playSongAtIndex,
    playSelectedSong,
    playNextSong,
    playPreviousSong,

    togglePauseResume,

    toggleShuffle,
    changeRepeatMode
};
// ui.js

function displayUI(
    songs,
    selectedIndex,
    savedData,
    playback
) {
    // Move cursor to top-left
    process.stdout.write("\x1b[H");

    // Clear everything below
    process.stdout.write("\x1b[J");

    console.log("🎵 AUDIO CLI");
    console.log("────────────\n");


    // -------------------------
    // Songs
    // -------------------------

    songs.forEach((song, index) => {

        const pointer =
            index === selectedIndex
                ? ">"
                : " ";

        const favorite =
            savedData.favorites.includes(song)
                ? " ★"
                : "";

        console.log(
            `${pointer} ${index + 1}. ${song}${favorite}`
        );
    });


    console.log("\n────────────");


    // -------------------------
    // Playback state
    // -------------------------

    const state =
        playback.getPlaybackState();


    // -------------------------
    // Current song
    // -------------------------

    if (state.currentSong) {

        if (
            state.playbackState === "playing"
        ) {

            console.log(
                `▶ Playing: ${state.currentSong}`
            );

        } else if (
            state.playbackState === "paused"
        ) {

            console.log(
                `⏸ Paused: ${state.currentSong}`
            );
        }


        // Duration and progress
        if (
            state.currentDuration !== null
        ) {

            const percentage =
                playback.getProgressPercentage();

            console.log(
                `⏱ ${playback.formatDuration(
                    state.currentPosition
                )} / ${playback.formatDuration(
                    state.currentDuration
                )}`
            );

            console.log(
                `${playback.getProgressBar()} ${percentage.toFixed(0)}%`
            );
        }

    } else {

        console.log(
            "▶ Playing: Nothing"
        );
    }


    // -------------------------
    // Shuffle / Repeat
    // -------------------------

    console.log("\n────────────");

    console.log(
        `🔀 Shuffle: ${
            state.shuffle
                ? "ON"
                : "OFF"
        }`
    );


    if (state.repeatMode === "off") {

        console.log("🔁 Repeat: Off");

    } else if (
        state.repeatMode === "one"
    ) {

        console.log("🔂 Repeat: One");

    } else {

        console.log("🔁 Repeat: All");
    }


    // -------------------------
    // Recently played
    // -------------------------

    console.log("\n────────────");

    console.log("🕘 Recently Played");


    if (
        savedData.recentlyPlayed.length === 0
    ) {

        console.log("  Nothing yet");

    } else {

        savedData.recentlyPlayed.forEach(
            (song, index) => {

                console.log(
                    `  ${index + 1}. ${song}`
                );
            }
        );
    }


    // -------------------------
    // Controls
    // -------------------------

    console.log("\n────────────");

    console.log("↑ ↓  Select");
    console.log("← →  Previous / Next");
    console.log("Enter  Play");
    console.log("Space  Pause / Resume");
    console.log("F  Favorite / Unfavorite");
    console.log("S  Shuffle ON/OFF");
    console.log("R  Change Repeat");
    console.log("Q  Quit");
}


module.exports = {
    displayUI
};
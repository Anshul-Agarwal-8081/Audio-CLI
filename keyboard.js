// keyboard.js

function handleInput(
    key,
    songs,
    selectedIndex,
    setSelectedIndex,
    savedData,
    playback,
    toggleFavorite,
    displayUI
) {

    // -------------------------
    // Down Arrow
    // -------------------------

    if (key === "\u001b[B") {

        if (
            selectedIndex <
            songs.length - 1
        ) {
            setSelectedIndex(
                selectedIndex + 1
            );
        }

        displayUI();
    }


    // -------------------------
    // Up Arrow
    // -------------------------

    else if (key === "\u001b[A") {

        if (selectedIndex > 0) {

            setSelectedIndex(
                selectedIndex - 1
            );
        }

        displayUI();
    }


    // -------------------------
    // Right Arrow
    // -------------------------

    else if (key === "\u001b[C") {

        playback.playNextSong(
            selectedIndex
        );
    }


    // -------------------------
    // Left Arrow
    // -------------------------

    else if (key === "\u001b[D") {

        playback.playPreviousSong(
            selectedIndex
        );
    }


    // -------------------------
    // Enter
    // -------------------------

    else if (key === "\r") {

        playback.playSelectedSong(
            selectedIndex
        );
    }


    // -------------------------
    // Space
    // -------------------------

    else if (key === " ") {

        playback.togglePauseResume();
    }


    // -------------------------
    // Favorite
    // -------------------------

    else if (
        key.toLowerCase() === "f"
    ) {

        toggleFavorite();

        displayUI();
    }


    // -------------------------
    // Shuffle
    // -------------------------

    else if (
        key.toLowerCase() === "s"
    ) {

        playback.toggleShuffle();
    }


    // -------------------------
    // Repeat
    // -------------------------

    else if (
        key.toLowerCase() === "r"
    ) {

        playback.changeRepeatMode();
    }


  // -------------------------
// Quit
// -------------------------

else if (
    key.toLowerCase() === "q" ||
    key === "\u0003"
) {

    playback.stopCurrentSong();

    process.stdin.setRawMode(false);
    process.stdin.pause();

    process.stdout.write(
        "\x1b[2J\x1b[H"
    );

    console.log("Goodbye! 👋");

    process.exit(0);
}


}
module.exports = {
    handleInput
};
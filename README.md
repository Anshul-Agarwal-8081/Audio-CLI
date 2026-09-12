# 🎵 Audio-CLI

A simple terminal-based music player built using **Node.js**.

The project allows users to browse MP3 songs, play them directly from the terminal, control playback using the keyboard, and manage features like shuffle, repeat, favorites, and recently played songs.

## Features

* 🎵 Automatically reads MP3 files from the `songs` folder
* 📋 Displays all available songs in the terminal
* ⬆️⬇️ Navigate through songs using arrow keys
* ▶️ Play the selected song
* ⏹️ Stop the currently playing song
* ⏸️ Pause and resume the current song
* ⬅️➡️ Move to the previous or next song
* 🔄 Automatically play the next song when the current song finishes
* ⏱️ Display the duration of the current song
* 📊 Show playback progress and percentage
* 🔀 Shuffle mode
* 🔁 Repeat modes
* ⭐ Add or remove songs from favorites
* 🕘 Keep a recently played songs list
* 💾 Store favorites and recently played data in a JSON file
* 🖥️ Interactive terminal interface

## Requirements

* Node.js
* macOS

The player currently uses `afplay` for playing MP3 files, so it is designed for macOS.

## Installation

Clone the project and move into the project folder.

Install the required package:

```bash
npm install
```

## Adding Songs

Put your `.mp3` files inside the `songs` folder.

Example:

```text
Audio-CLI/
├── app.js
├── package.json
├── player-data.json
└── songs/
    ├── song1.mp3
    ├── song2.mp3
    └── song3.mp3
```

The application automatically detects the MP3 files when it starts.

## Running the Player

Run:

```bash
node app.js
```

The terminal will display the available songs and controls.

## Keyboard Controls

| Key   | Action                |
| ----- | --------------------- |
| ↑ / ↓ | Select a song         |
| ← / → | Previous / Next song  |
| Enter | Play selected song    |
| Space | Pause / Resume        |
| F     | Favorite / Unfavorite |
| S     | Turn Shuffle ON/OFF   |
| R     | Change Repeat mode    |
| Q     | Quit                  |

## Repeat Modes

The player supports three repeat modes:

* **Off** – playlist stops after the last song
* **One** – repeat the current song
* **All** – restart the playlist after the last song

## Favorites

Press `F` while a song is selected to add or remove it from favorites.

Favorites are saved in:

```text
player-data.json
```

so they remain available after restarting the application.

## Recently Played

The player keeps track of recently played songs.

The recently played list is stored in:

```text
player-data.json
```

The latest played songs are displayed in the terminal interface.

## Technologies Used

* **Node.js**
* **JavaScript**
* **File System (`fs`)**
* **Path (`path`)**
* **Child Process (`child_process`)**
* **music-metadata**
* **JSON**
* **ANSI escape codes**
* **macOS `afplay`**

## Project Status

The basic music player functionality is complete.

Current features include:

* Song discovery
* Terminal navigation
* Audio playback
* Pause / Resume
* Previous / Next
* Automatic next song
* Duration
* Progress bar
* Shuffle
* Repeat
* Favorites
* Recently played

Future improvements can include better terminal UI, volume control, playlists, search, and further code organization.

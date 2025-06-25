// audio.js
// Handles music and audio logic

export const startMenuMusic = new Audio('assets/musics/START  8-Bit Chiptune .mp3');
export const levelMusic = new Audio('assets/musics/EXPLORE  8-Bit Chiptune .mp3');
export const dungeonMusic = new Audio('assets/musics/Kevin MacLeod - 8bit Dungeon Level.mp3');
[startMenuMusic, levelMusic, dungeonMusic].forEach(music => {
  music.loop = true;
  music.volume = 0.5;
});

export function playStartMenuMusic() {
  startMenuMusic.play().catch((error) => {
    console.log('Start menu music play prevented:', error);
  });
}

export function setVolume(volume) {
  startMenuMusic.volume = volume;
  levelMusic.volume = volume;
  dungeonMusic.volume = volume;
}

export function toggleMute(isMuted, musicLogo) {
  startMenuMusic.muted = isMuted;
  levelMusic.muted = isMuted;
  dungeonMusic.muted = isMuted;
  if (musicLogo) {
    musicLogo.src = isMuted ? 'assets/miscellaneous/musiclogo-false.png' : 'assets/miscellaneous/musiclogo-true.png';
    musicLogo.alt = isMuted ? 'Music Off' : 'Music On';
  }
}

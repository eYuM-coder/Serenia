const fs = require("fs");
const prism = require("prism-media");
const ffmpegPath = require("ffmpeg-static");

console.log("FFMPEG PATH:", ffmpegPath);

const input = fs.createReadStream("./src/assets/audio/awp.mp3");

const ffmpeg = new prism.FFmpeg({
  args: ["-i", "pipe:0", "-f", "s16le", "-ar", "48000", "-ac", "2"],
});

const stream = input.pipe(ffmpeg);

stream.on("data", (chunk) => {
  //   console.log("AUDIO CHUNK:", chunk.length);
});

stream.on("error", console.error);

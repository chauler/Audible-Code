import { exec } from "child_process";

class AudioPlayer {
  play(message: string) {
    throw new Error("Method not implemented.");
  }
  static _instance: AudioPlayerBase | undefined = undefined;
  constructor(platform?: NodeJS.Platform) {
    if (AudioPlayer._instance) {
      return AudioPlayer._instance;
    }
    if (!platform) platform = process.platform;
    if (platform === "darwin") {
      AudioPlayer._instance = new MacAudioPlayer();
    } else if (platform === "linux") {
      AudioPlayer._instance = new LinuxAudioPlayer();
    } else if (platform === "win32") {
      AudioPlayer._instance = new WindowsAudioPlayer();
    } else {
      throw new Error(`Platform ${platform} not supported`);
    }
    return AudioPlayer._instance;
  }
}

class AudioPlayerBase {
  play(filepath: string) {}
}

class MacAudioPlayer extends AudioPlayerBase {
  constructor() {
    super();
  }
  play(filepath: string) {
    exec(`afplay ${filepath}`);
  }
}

class LinuxAudioPlayer extends AudioPlayerBase {
  constructor() {
    super();
  }
  play(filepath: string) {
    exec(`ffplay -v 0 -nodisp -autoexit ${filepath}`);
  }
}

class WindowsAudioPlayer extends AudioPlayerBase {
  constructor() {
    super();
  }
  play(filepath: string) {
    exec(`powershell -c (New-Object Media.SoundPlayer "${filepath}").PlaySync();`);
  }
}

export default AudioPlayer;

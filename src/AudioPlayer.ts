import { ChildProcess, exec } from "child_process";

class AudioPlayer {
  play(message: string): Promise<any> {
    throw new Error("Method not implemented.");
  }
  stop() {}
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
  children: ChildProcess[];
  constructor() {
    this.children = [];
  }
  play(filepath: string): Promise<any> {
    throw new Error("Method not implemented.");
  }
  stop() {
    throw new Error("Method not implemented.");
  }
}

class MacAudioPlayer extends AudioPlayerBase {
  constructor() {
    super();
  }
  play(filepath: string): Promise<any> {
    const promise = new Promise((resolve, reject) => {
      exec(`afplay ${filepath}`, (error) => {
        resolve(true);
      });
    });
    return promise;
  }
}

class LinuxAudioPlayer extends AudioPlayerBase {
  constructor() {
    super();
  }
  play(filepath: string): Promise<any> {
    const promise = new Promise((resolve, reject) => {
      exec(`ffplay -v 0 -nodisp -autoexit ${filepath}`, (error) => {
        resolve(true);
      });
    });
    return promise;
  }
}

class WindowsAudioPlayer extends AudioPlayerBase {
  constructor() {
    super();
  }
  play(filepath: string): Promise<any> {
    const promise = new Promise((resolve, reject) => {
      const child = exec(`powershell -c (New-Object Media.SoundPlayer "${filepath}").PlaySync();`, (error) => {
        resolve(true);
      });
      this.children.push(child);
      child.on("exit", () => {
        this.children.splice(this.children.indexOf(child), 1);
      });
    });
    return promise;
  }

  stop() {
    for (const child of this.children) {
      exec("taskkill /pid " + child.pid + " /T /F");
    }
  }
}

export default AudioPlayer;

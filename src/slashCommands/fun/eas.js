const { SlashCommandBuilder } = require("@discordjs/builders");
const {
  joinVoiceChannel,
  createAudioPlayer,
  createAudioResource,
  AudioPlayerStatus,
  entersState,
  VoiceConnectionStatus,
  StreamType,
} = require("@discordjs/voice");
const path = require("path");
const fs = require("fs");
const { decode } = require("wav-decoder");
const { WaveFile } = require("wavefile");

function truncate(text, max) {
  return text && text.length > max ? text.slice(0, max) + "..." : text;
}

function limitArray(arr, max) {
  return Array.isArray(arr) ? arr.slice(0, max) : [];
}

const SAMPLE_RATE = 44100;
const MARK_FREQ = 2083.3;
const SPACE_FREQ = 1562.5;
const AFSK_TIME = 0.00192;
const AFSK_LEN = Math.floor(SAMPLE_RATE * AFSK_TIME);

const ENDEC_MODE_PROFILES = {
  DEFAULT: {
    label: "None (Default)/DASDEC",
    betweenGapMs: 1000,
    afterGapMs: 1000,
    headerBursts: [
      { prefix: "", suffix: "" },
      { prefix: "", suffix: "" },
      { prefix: "", suffix: "" },
    ],
    eomBursts: [
      { prefix: "", suffix: "" },
      { prefix: "", suffix: "" },
      { prefix: "", suffix: "" },
    ],
  },
  NWS: {
    label: "National Weather Service (Legacy/EAS.js)",
    betweenGapMs: 1000,
    afterGapMs: 1000,
    headerBursts: [
      { prefix: "", suffix: "\x00\x00" },
      { prefix: "", suffix: "\x00\x00" },
      { prefix: "", suffix: "\x00\x00" },
    ],
    eomBursts: [
      { prefix: "", suffix: "\x00\x00" },
      { prefix: "", suffix: "\x00\x00" },
      { prefix: "", suffix: "\x00\x00" },
    ],
  },
  NWS_CRS: {
    label: "National Weather Service - CRS",
    betweenGapMs: 1000,
    afterGapMs: 1000,
    headerBursts: [
      { prefix: "\x00", suffix: "\x00\x00\x00" },
      { prefix: "\x00", suffix: "\x00\x00\x00" },
      { prefix: "\x00", suffix: "\x00\x00\x00" },
    ],
    eomBursts: [
      { prefix: "\x00", suffix: "\x00" },
      { prefix: "\x00", suffix: "\x00" },
      { prefix: "\x00", suffix: "\x00" },
    ],
  },
  NWS_BMH: {
    label: "National Weather Service - BMH",
    betweenGapMs: 1000,
    afterGapMs: 1000,
    headerBursts: [
      { prefix: "", suffix: "\x00\x00\x00" },
      { prefix: "", suffix: "\x00\x00\x00" },
      { prefix: "", suffix: "\x00\x00\x00" },
    ],
    eomBursts: [
      { prefix: "", suffix: "\x00\x00\x00" },
      { prefix: "", suffix: "\x00\x00\x00" },
      { prefix: "", suffix: "\x00\x00\x00" },
    ],
  },
  SAGE_DIGITAL_3644: {
    label: "SAGE 3644/DIGITAL",
    betweenGapMs: 1000,
    afterGapMs: 1000,
    headerBursts: [
      { prefix: "\x00", suffix: "\xFF\xFF\xFF" },
      { prefix: "\xAB", suffix: "\xFF\xFF\xFF" },
      { prefix: "\xAB", suffix: "\xFF\xFF\xFF" },
    ],
    eomBursts: [
      { prefix: "\x00", suffix: "\xFF\xFF\xFF" },
      { prefix: "", suffix: "\xFF\xFF\xFF" },
      { prefix: "", suffix: "\xFF\xFF\xFF" },
    ],
  },
  SAGE_ANALOG_1822: {
    label: "SAGE 1822/ANALOG",
    betweenGapMs: 1000,
    afterGapMs: 1000,
    headerBursts: [
      { prefix: "", suffix: "\xFF" },
      { prefix: "", suffix: "\xFF" },
      { prefix: "", suffix: "\xFF" },
    ],
    eomBursts: [
      { prefix: "", suffix: "\xFF" },
      { prefix: "", suffix: "\xFF" },
      { prefix: "", suffix: "\xFF" },
    ],
  },
  TRILITHIC: {
    label: "Trilithic EASyPLUS",
    betweenGapMs: 868,
    afterGapMs: 1118,
    headerBursts: [
      { prefix: "", suffix: "" },
      { prefix: "", suffix: "" },
      { prefix: "", suffix: "" },
    ],
    eomBursts: [
      { prefix: "", suffix: "" },
      { prefix: "", suffix: "" },
      { prefix: "", suffix: "" },
    ],
  },
  TRILITHIC_POP: {
    label: "Trilithic EASyPLUS with Pop",
    betweenGapMs: 868,
    afterGapMs: 1118,
    headerBursts: [
      { prefix: "", suffix: "" },
      { prefix: "", suffix: "" },
      { prefix: "", suffix: "" },
    ],
    eomBursts: [
      { prefix: "", suffix: "" },
      { prefix: "", suffix: "" },
      { prefix: "", suffix: "" },
    ],
  },
  DIGITAL_LEGACY: {
    label: "SAGE 3644/DIGITAL (Legacy)",
    betweenGapMs: 1000,
    afterGapMs: 1000,
    headerBursts: [
      { prefix: "\x00", suffix: "\xFF\xFF\xFF" },
      { prefix: "\xAB", suffix: "\xFF\xFF\xFF" },
      { prefix: "\xAB", suffix: "\xFF\xFF\xFF" },
    ],
    eomBursts: [
      { prefix: "\x00", suffix: "\xFF\xFF\xFF" },
      { prefix: "", suffix: "\xFF\xFF\xFF" },
      { prefix: "", suffix: "\xFF\xFF\xFF" },
    ],
  },
};

const easEvents = [
  // Weather-Related Events
  { name: "Blizzard Warning", value: "BZW", group: "weather" },
  { name: "Coastal Flood Warning", value: "CFW", group: "weather" },
  { name: "Coastal Flood Watch", value: "CFA", group: "weather" },
  { name: "Dust Storm Warning", value: "DSW", group: "weather" },
  { name: "Extreme Wind Warning", value: "EWW", group: "weather" },
  { name: "Flash Flood Statement", value: "FFS", group: "weather" },
  { name: "Flash Flood Warning", value: "FFW", group: "weather" },
  { name: "Flash Flood Watch", value: "FFA", group: "weather" },
  { name: "Flood Statement", value: "FLS", group: "weather" },
  { name: "Flood Warning", value: "FLW", group: "weather" },
  { name: "Flood Watch", value: "FLA", group: "weather" },
  { name: "High Wind Warning", value: "HWW", group: "weather" },
  { name: "High Wind Watch", value: "HWA", group: "weather" },
  { name: "Hurricane Local Statement", value: "HLS", group: "weather" },
  { name: "Hurricane Watch", value: "HUA", group: "weather" },
  { name: "Hurricane Warning", value: "HUW", group: "weather" },
  { name: "Severe Thunderstorm Warning", value: "SVR", group: "weather" },
  { name: "Severe Thunderstorm Watch", value: "SVA", group: "weather" },
  { name: "Severe Weather Statement", value: "SVS", group: "weather" },
  { name: "Snow Squall Warning", value: "SQW", group: "weather" },
  { name: "Special Marine Warning", value: "SMW", group: "weather" },
  { name: "Special Weather Statement", value: "SPS", group: "weather" },
  { name: "Storm Surge Warning", value: "SSW", group: "weather" },
  { name: "Storm Surge Watch", value: "SSA", group: "weather" },
  { name: "Tornado Warning", value: "TOR", group: "weather" },
  { name: "Tornado Watch", value: "TOA", group: "weather" },
  { name: "Tropical Storm Warning", value: "TRW", group: "weather" },
  { name: "Tropical Storm Watch", value: "TRA", group: "weather" },
  { name: "Tsunami Warning", value: "TSW", group: "weather" },
  { name: "Tsunami Watch", value: "TSA", group: "weather" },
  { name: "Winter Storm Warning", value: "WSW", group: "weather" },
  { name: "Winter Storm Watch", value: "WSA", group: "weather" },

  // Non-Weather-Related Events
  {
    name: "911 Telephone Outage Emergency",
    value: "TOE",
    group: "non_weather",
  },
  { name: "Avalanche Warning", value: "AVW", group: "non_weather" },
  { name: "Avalanche Watch", value: "AVA", group: "non_weather" },
  { name: "Blue Alert", value: "BLU", group: "non_weather" },
  { name: "Child Abduction Emergency", value: "CAE", group: "non_weather" },
  { name: "Civil Danger Warning", value: "CDW", group: "non_weather" },
  { name: "Civil Emergency Message", value: "CEM", group: "non_weather" },
  { name: "Earthquake Warning", value: "EQW", group: "non_weather" },
  { name: "Fire Warning", value: "FRW", group: "non_weather" },
  { name: "Hazardous Materials Warning", value: "HMW", group: "non_weather" },
  { name: "Immediate Evacuation", value: "EVI", group: "non_weather" },
  { name: "Law Enforcement Warning", value: "LEW", group: "non_weather" },
  { name: "Local Area Emergency", value: "LAE", group: "non_weather" },
  {
    name: "Missing and Endangered Persons",
    value: "MEP",
    group: "non_weather",
  },
  { name: "Nuclear Plant Warning", value: "NUW", group: "non_weather" },
  { name: "Radiological Hazard Warning", value: "RHW", group: "non_weather" },
  { name: "Shelter In Place Warning", value: "SPW", group: "non_weather" },
  { name: "Volcano Warning", value: "VOW", group: "non_weather" },

  // Administrative Events
  { name: "Administrative Message", value: "ADR", group: "administrative" },
  {
    name: "Network Message Notification",
    value: "NMN",
    group: "administrative",
  },
  { name: "Practice/Demo Warning", value: "DMO", group: "administrative" },
  { name: "Required Monthly Test", value: "RMT", group: "administrative" },
  { name: "Required Weekly Test", value: "RWT", group: "administrative" },

  // National-Level Events
  { name: "National Audible Test", value: "NAT", group: "national" },
  {
    name: "National Emergency Action Notification",
    value: "EAN",
    group: "national",
  },
  {
    name: "National Emergency Action Termination",
    value: "EAT",
    group: "national",
  },
  { name: "National Information Center", value: "NIC", group: "national" },
  { name: "National Periodic Test", value: "NPT", group: "national" },
  { name: "National Silent Test", value: "NST", group: "national" },

  // Unimplemented Codes
  { name: "Biological Hazard Warning", value: "BHW", group: "unimplemented" },
  { name: "Boil Water Warning", value: "BWW", group: "unimplemented" },
  { name: "Chemical Hazard Warning", value: "CHW", group: "unimplemented" },
  { name: "Civil Danger Watch", value: "CDA", group: "unimplemented" },
  { name: "Contagious Disease Warning", value: "DEW", group: "unimplemented" },
  { name: "Contaminated Water Warning", value: "CWW", group: "unimplemented" },
  { name: "Dam Break Warning", value: "DBW", group: "unimplemented" },
  { name: "Dam Watch", value: "DBA", group: "unimplemented" },
  { name: "Dust Storm Watch", value: "DSA", group: "unimplemented" },
  { name: "Earthquake Watch", value: "EQA", group: "unimplemented" },
  { name: "Evacuation Watch", value: "EVA", group: "unimplemented" },
  { name: "Flash Freeze Warning", value: "FSW", group: "unimplemented" },
  { name: "Food Contamination Warning", value: "FCW", group: "unimplemented" },
  { name: "Freeze Warning", value: "FZW", group: "unimplemented" },
  { name: "Hazardous Materials Watch", value: "HMA", group: "unimplemented" },
  { name: "Iceberg Warning", value: "IBW", group: "unimplemented" },
  {
    name: "Immediate Evacuation Warning",
    value: "IEW",
    group: "unimplemented",
  },
  { name: "Industrial Fire Warning", value: "IFW", group: "unimplemented" },
  { name: "Land Slide Warning", value: "LSW", group: "unimplemented" },
  { name: "Nuclear Plant Test", value: "NPM", group: "unimplemented" },
  { name: "Power Outage Statement", value: "POS", group: "unimplemented" },
  { name: "Radiological Hazard Watch", value: "RHA", group: "unimplemented" },
  { name: "School Closing Statement", value: "SCS", group: "unimplemented" },
  { name: "Unrecognized Emergency", value: "??E", group: "unimplemented" },
  { name: "Unrecognized Statement", value: "??S", group: "unimplemented" },
  { name: "Unrecognized Warning", value: "??W", group: "unimplemented" },
  { name: "Unrecognized Watch", value: "??A", group: "unimplemented" },
  { name: "Volcano Watch", value: "VOA", group: "unimplemented" },
  { name: "Wild Fire Warning", value: "WFW", group: "unimplemented" },
  { name: "Wild Fire Watch", value: "WFA", group: "unimplemented" },

  // NWS Misc
  { name: "Transmitter Backup On", value: "TXB", group: "nws_misc" },
  { name: "Transmitter Carrier Off", value: "TXF", group: "nws_misc" },
  { name: "Transmitter Carrier On", value: "TXO", group: "nws_misc" },
  { name: "Transmitter Primary On", value: "TXP", group: "nws_misc" },
];

const ttsVoices = [
  { name: "[WASM] WebAssembly (local)", value: "wasm" },
  { name: "[NanoTTS] Fast local voice", value: "nanotts" },

  { name: "[VT] Current NWS Paul", value: "paul" },
  { name: "[VT] James", value: "james" },
  { name: "[VT] Julie", value: "julie" },
  { name: "[VT] Kate", value: "kate" },

  { name: "[BAL] NWS Violeta (Spanish)", value: "VW Violeta" },
  { name: "[BAL] Scansoft Tom", value: "ScanSoft Tom_Full_22kHz" },
  { name: "[BAL] AT&T Mike", value: "ATT Mike16" },
  { name: "[BAL] AT&T Crystal", value: "ATT Crystal16" },
  { name: "[BAL] Microsoft David", value: "Microsoft David Desktop" },
  { name: "[BAL] Microsoft Zira", value: "Microsoft Zira Desktop" },

  { name: "[DT] DECTalk Paul v1", value: "DECTalkPaulV1" },
  { name: "[DT] Harry/Igor", value: "DECTalkHarryIgor" },
  { name: "[DT] Frank", value: "DECTalkFrank" },
  { name: "[DT] Dennis", value: "DECTalkDennis" },
  { name: "[DT] Betty", value: "DECTalkBetty" },
  { name: "[DT] Ursula", value: "DECTalkUrsula" },
  { name: "[DT] Wendy", value: "DECTalkWendy" },
  { name: "[DT] Rita", value: "DECTalkRita" },
  { name: "[DT] Kit", value: "DECTalkKit" },
  { name: "[DT] Variable Val", value: "DECTalkVariableVal" },

  { name: "[FEST] Kal", value: "FestvoxKal" },
  { name: "[FEST] Kal Monotone", value: "FestvoxKalMonotone" },

  { name: "[BAL] Loquendo Dave", value: "Loquendo Dave" },
  { name: "[BAL] Loquendo Allison", value: "Loquendo Allison" },

  { name: "[CEP6] Cepstral Allison", value: "Cepstral Allison" },
  { name: "[CEP6] Cepstral David", value: "Cepstral David" },
  { name: "[CEP6] Cepstral Jean-Pierre", value: "Cepstral Jean-Pierre" },
  { name: "[CEP6] Cepstral William", value: "Cepstral William" },

  { name: "[EMNet] Header-based voice", value: "EMNet" },

  { name: "[SPFY] Speechify Tom", value: "Speechify Tom" },
  { name: "[SPFY] Speechify Jill", value: "Speechify Jill" },
  { name: "[SPFY] AI Mara v1", value: "Speechify AIMara" },
  { name: "[SPFY] AI Mara v2", value: "Speechify AIMara2" },
  { name: "[SPFY] AI Craig", value: "Speechify AICraig" },
  { name: "[SPFY] Felix (French)", value: "Speechify Felix" },
  { name: "[SPFY] Javier (Spanish)", value: "Speechify Javier" },
  { name: "[SPFY] Paulina (Spanish)", value: "Speechify Paulina" },

  { name: "[BAL] Nuance Ava", value: "VE_American_English_Ava_22kHz" },
  { name: "[BAL] Nuance Tom", value: "VE_American_English_Tom_22kHz" },
  { name: "[BAL] Chantal (FR)", value: "VE_Canadian_French_Chantal_22kHz" },
  { name: "[BAL] Nicolas (FR)", value: "VE_Canadian_French_Nicolas_22kHz" },
];

class EASAudioGenerator {
  constructor() {
    this.samples = [];
    this.afskLen = AFSK_LEN;
    this.markArray = new Array(this.afskLen);
    this.spaceArray = new Array(this.afskLen);
    this.preamble = 0xd5;
    this.calcAFSKArrays();
  }

  calcAFSKArrays() {
    for (let i = 0; i < this.afskLen; i++) {
      this.markArray[i] = Math.sin((i / SAMPLE_RATE) * 2 * Math.PI * MARK_FREQ);
      this.spaceArray[i] = Math.sin(
        (i / SAMPLE_RATE) * 2 * Math.PI * SPACE_FREQ,
      );
    }
  }

  generateSilence(length) {
    for (let i = 0; i < length; i++) this.samples.push(0);
  }

  generateTone(freq, length) {
    for (let i = 0; i < length; i++) {
      let s = Math.sin((i / SAMPLE_RATE) * 2 * Math.PI * freq);
      s = Math.max(-0.99, Math.min(0.99, s));
      this.samples.push(s);
    }
  }

  generateDualTone(freq1, freq2, length) {
    for (let i = 0; i < length; i++) {
      let s =
        0.5 *
        (Math.sin((i * 2 * Math.PI * freq1) / SAMPLE_RATE) +
          Math.sin((i * 2 * Math.PI * freq2) / SAMPLE_RATE));
      s = Math.max(-0.99, Math.min(0.99, s));
      this.samples.push(s);
    }
  }

  generateAFSK(bit) {
    const copyArray = bit ? this.markArray : this.spaceArray;
    for (let i = 0; i < this.afskLen; i++) this.samples.push(copyArray[i]);
  }

  stringToBitsLSB(str) {
    const bits = [];
    for (let i = 0; i < str.length; i++) {
      const c = str.charCodeAt(i) & 0xff;
      for (let b = 0; b < 8; b++) bits.push((c >> b) & 1);
    }
    return bits;
  }

  generatePreamble() {
    const preambleBits = [];
    for (let i = 0; i < 16; i++) {
      for (let b = 0; b < 8; b++) preambleBits.push((this.preamble >> b) & 1);
    }
    return preambleBits;
  }

  createHeaderString(originator, event, locations, duration, date, sender) {
    let header = "ZCZC";
    header += `-${originator}-${event}`;
    for (let loc of locations) header += `-${loc.padStart(6, "0")}`;
    header += `+${duration}`;
    header += `-${this.getDay(date)}${this.getHour(date)}${this.getMinute(date)}`;
    header += `-${sender.padEnd(8, " ").slice(0, 8)}-`;
    return header;
  }

  getDay(date) {
    const start = new Date(date.getFullYear(), 0, 0);
    const diff = date - start;
    return String(Math.floor(diff / 86400000)).padStart(3, "0");
  }

  getHour(date) {
    return String(date.getUTCHours()).padStart(2, "0");
  }
  getMinute(date) {
    return String(date.getUTCMinutes()).padStart(2, "0");
  }

  generateHeaderTones(header, endecMode) {
    const profile =
      ENDEC_MODE_PROFILES[endecMode] || ENDEC_MODE_PROFILES.DEFAULT;
    const preambleBits = this.generatePreamble();
    const msgBits = this.stringToBitsLSB(header);
    const dataBits = [...preambleBits, ...msgBits];

    for (let i = 0; i < profile.headerBursts.length; i++) {
      const burst = profile.headerBursts[i];
      if (burst.prefix) {
        const prefixBits = this.stringToBitsLSB(burst.prefix);
        for (let bit of prefixBits) this.generateAFSK(bit);
      }
      for (let bit of dataBits) this.generateAFSK(bit);
      if (burst.suffix) {
        const suffixBits = this.stringToBitsLSB(burst.suffix);
        for (let bit of suffixBits) this.generateAFSK(bit);
      }
      if (i < profile.headerBursts.length - 1) {
        this.generateSilence(
          Math.floor(SAMPLE_RATE * (profile.betweenGapMs / 1000)),
        );
      }
    }
    this.generateSilence(Math.floor(SAMPLE_RATE * (profile.afterGapMs / 1000)));
  }

  generateEOMTones(endecMode) {
    const profile =
      ENDEC_MODE_PROFILES[endecMode] || ENDEC_MODE_PROFILES.DEFAULT;
    const preambleBits = this.generatePreamble();
    const eomBits = this.stringToBitsLSB("NNNN");
    const dataBits = [...preambleBits, ...eomBits];

    this.generateSilence(Math.floor(SAMPLE_RATE * 1));

    for (let i = 0; i < profile.eomBursts.length; i++) {
      const burst = profile.eomBursts[i];
      if (burst.prefix) {
        const prefixBits = this.stringToBitsLSB(burst.prefix);
        for (let bit of prefixBits) this.generateAFSK(bit);
      }
      for (let bit of dataBits) this.generateAFSK(bit);
      if (burst.suffix) {
        const suffixBits = this.stringToBitsLSB(burst.suffix);
        for (let bit of suffixBits) this.generateAFSK(bit);
      }
      if (i < profile.eomBursts.length - 1) {
        this.generateSilence(
          Math.floor(SAMPLE_RATE * (profile.betweenGapMs / 1000)),
        );
      }
    }
  }

  generateAttentionTone(type, durationSec = 8) {
    const samplesNeeded = SAMPLE_RATE * durationSec;
    if (type === 0) this.generateTone(1050, samplesNeeded);
    else if (type === 1) this.generateDualTone(853, 960, samplesNeeded);
  }

  async appendTTS(text, header, voice = "EMNet") {
    const useVoice = voice && voice !== "EMNet";
    const content = useVoice ? (voice == "EMNet" ? header : text) : header;

    if (!content || content.trim() === "") {
      this.generateSilence(Math.floor(SAMPLE_RATE * 0.5));
      return;
    }

    try {
      const { pcm, sampleRate } = await this.generateTTS(content, voice);
      const resampled = this.resamplePcm(pcm, sampleRate, SAMPLE_RATE);

      let peak = 0;
      for (let i = 0; i < resampled.length; i++) {
        if (Math.abs(resampled[i]) > peak) peak = Math.abs(resampled[i]);
      }
      const gain = peak > 0 ? 0.9 / peak : 1;

      this.generateSilence(Math.floor(SAMPLE_RATE * 0.25));

      for (let i = 0; i < resampled.length; i++) {
        let s = resampled[i] * gain;
        s = Math.max(-0.99, Math.min(0.99, s));
        this.samples.push(s);
      }

      this.generateSilence(Math.floor(SAMPLE_RATE * 0.25));
    } catch (error) {
      console.error("TTS generation failed:", error);
      this.generateSilence(SAMPLE_RATE * 2);
    }
  }

  async generateTTS(text, voice) {
    const url =
      "https://wagspuzzle.space/tools/eas-tts/index.php?handler=toolkit";

    const params = new URLSearchParams();

    params.append("text", text);
    params.append("voice", voice || "EMNet");
    params.append("useOverrideTZ", "UTC");

    const response = await fetch(url, {
      method: "POST",
      body: params,
      headers: {
        Accept: "*/*",
        "Content-Type": "application/x-www-form-urlencoded",
        "User-Agent": "Serenia-Discord-Bot/1.0",
      },
    });

    if (!response.ok) throw new Error(`TTS request failed: ${response.status}`);

    const buffer = await response.arrayBuffer();
    const decoded = await decode(Buffer.from(buffer));

    return {
      pcm: decoded.channelData[0],
      sampleRate: decoded.sampleRate,
    };
  }

  resamplePcm(pcm, sourceRate, targetRate) {
    if (sourceRate === targetRate) return pcm;
    const ratio = sourceRate / targetRate;
    const newLength = Math.max(1, Math.round(pcm.length / ratio));
    const resampled = new Float32Array(newLength);
    for (let i = 0; i < newLength; i++) {
      const position = i * ratio;
      const index = Math.floor(position);
      const nextIndex = Math.min(index + 1, pcm.length - 1);
      const frac = position - index;
      resampled[i] = pcm[index] + (pcm[nextIndex] - pcm[index]) * frac;
    }
    return resampled;
  }

  toWAV() {
    const wav = new WaveFile();
    wav.fromScratch(1, SAMPLE_RATE, "32f", this.samples);
    return wav.toBuffer();
  }

  reset() {
    this.samples = [];
  }
}

function validateFIPS(fipsString) {
  const codes = fipsString.split("-").map((c) => c.trim());
  const valid = [];
  const invalid = [];
  for (let code of codes) {
    if (/^\d{6}$/.test(code)) valid.push(code);
    else if (/^\d{5}$/.test(code)) valid.push("0" + code);
    else invalid.push(code);
  }
  return { valid, invalid };
}

async function saveTempWAV(buffer) {
  const tempDir = path.join(process.cwd(), "temp");
  if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir);
  const tempPath = path.join(tempDir, `eas_${Date.now()}.wav`);
  fs.writeFileSync(tempPath, buffer);
  return tempPath;
}

const eventMap = new Map();
easEvents.forEach((event) => eventMap.set(event.value, event.name));

module.exports = {
  data: new SlashCommandBuilder()
    .setName("easgen")
    .setDescription("Generate EAS tones to play through VC")
    .addSubcommand((subcommand) =>
      subcommand
        .setName("guided")
        .setDescription("Generate an EAS alert from guided options")
        .addStringOption((option) =>
          option
            .setName("origin")
            .setDescription("Who is the sender for this alert?")
            .addChoices([
              { name: "EAS Participant", value: "EAS" },
              { name: "Civil Authority", value: "CIV" },
              { name: "National Weather Service", value: "WXR" },
              { name: "Primary Entry Point", value: "PEP" },
            ])
            .setRequired(true),
        )
        .addStringOption((option) =>
          option
            .setName("alerttype")
            .setDescription("Which alert do you want to use?")
            .setRequired(true)
            .setAutocomplete(true),
        )
        .addStringOption((option) =>
          option
            .setName("endec")
            .setDescription("What type of ENDEC will be used?")
            .addChoices([
              { name: "None (Default)/DASDEC", value: "DEFAULT" },
              {
                name: "National Weather Service (Legacy/EAS.js)",
                value: "NWS",
              },
              {
                name: "NWS - Console Replacement System (CRS)",
                value: "NWS_CRS",
              },
              {
                name: "NWS - Broadcast Message Handler (BMH)",
                value: "NWS_BMH",
              },
              { name: "SAGE 3644/DIGITAL", value: "SAGE_DIGITAL_3644" },
              { name: "SAGE 1822/ANALOG", value: "SAGE_ANALOG_1822" },
              { name: "Trilithic EASyPLUS", value: "TRILITHIC" },
              { name: "Trilithic EASyPLUS with Pop", value: "TRILITHIC_POP" },
              { name: "SAGE 3644/DIGITAL (Legacy)", value: "DIGITAL_LEGACY" },
            ])
            .setRequired(true),
        )
        .addStringOption((option) =>
          option
            .setName("fips")
            .setDescription(
              'FIPS code (6 digits, use "-" for multiple, e.g., "001001-001003")',
            )
            .setRequired(true),
        )
        .addStringOption((option) =>
          option
            .setName("purgetime")
            .setDescription("How long until this alert expires (in minutes)")
            .setRequired(true),
        )
        .addStringOption((option) =>
          option
            .setName("sender")
            .setDescription('Sender ID (8 characters max, e.g., "SERENIA")')
            .setMaxLength(8)
            .setRequired(true),
        )
        .addStringOption((option) =>
          option
            .setName("voice")
            .setDescription(
              "The voice to use (optional - leave empty for tones only)",
            )
            .setAutocomplete(true),
        )
        .addStringOption((option) =>
          option
            .setName("tts")
            .setDescription(
              "The announcement message (optional - leave empty for tones only)",
            ),
        ),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("zczc")
        .setDescription("Generate an EAS alert from a raw ZCZC header string.")
        .addStringOption((option) =>
          option
            .setName("zczcstring")
            .setDescription("Enter your ZCZC string here.")
            .setRequired(true),
        )
        .addStringOption((option) =>
          option
            .setName("endec")
            .setDescription("What type of ENDEC will be used?")
            .addChoices([
              { name: "None (Default)/DASDEC", value: "DEFAULT" },
              {
                name: "National Weather Service (Legacy/EAS.js)",
                value: "NWS",
              },
              {
                name: "NWS - Console Replacement System (CRS)",
                value: "NWS_CRS",
              },
              {
                name: "NWS - Broadcast Message Handler (BMH)",
                value: "NWS_BMH",
              },
              { name: "SAGE 3644/DIGITAL", value: "SAGE_DIGITAL_3644" },
              { name: "SAGE 1822/ANALOG", value: "SAGE_ANALOG_1822" },
              { name: "Trilithic EASyPLUS", value: "TRILITHIC" },
              { name: "Trilithic EASyPLUS with Pop", value: "TRILITHIC_POP" },
              { name: "SAGE 3644/DIGITAL (Legacy)", value: "DIGITAL_LEGACY" },
            ])
            .setRequired(true),
        )
        .addStringOption((option) =>
          option
            .setName("tts")
            .setDescription(
              "The announcement message (optional - leave empty for tones only)",
            ),
        ),
    ),

  async autocomplete(interaction) {
    const focused = interaction.options.getFocused(true);
    const value = focused.value.toLowerCase();

    if (focused.name === "alerttype") {
      const filtered = easEvents
        .filter(
          (e) =>
            e.name.toLowerCase().includes(value) ||
            e.value.toLowerCase().includes(value),
        )
        .slice(0, 25);

      return interaction.respond(
        filtered.map((e) => ({
          name: `${e.name} (${e.value})`,
          value: e.value,
        })),
      );
    }

    if (focused.name === "voice") {
      const filtered = ttsVoices
        .filter(
          (v) =>
            v.name.toLowerCase().includes(value) ||
            v.value.toLowerCase().includes(value),
        )
        .slice(0, 25);

      return interaction.respond(
        filtered.map((v) => ({
          name: v.name,
          value: v.value,
        })),
      );
    }

    return interaction.respond([]);
  },

  async execute(interaction) {
    const member = interaction.member;
    const voiceChannel = member.voice.channel;

    if (!voiceChannel) {
      return interaction.reply({
        content: "❌ You need to be in a voice channel to use this command!",
        ephemeral: true,
      });
    }

    await interaction.deferReply({ ephemeral: true });

    try {
      const subcommand = interaction.options.getSubcommand();
      const endecMode = interaction.options.getString("endec") || "DEFAULT";
      const voice = interaction.options.getString("voice");
      const ttsMessage = interaction.options.getString("tts") || "";
      const hasTTS = ttsMessage && ttsMessage.trim().length > 0;
      const hasVoice = voice && voice.trim().length > 0;

      let header;
      let validLocations = [];

      if (subcommand === "guided") {
        const origin = interaction.options.getString("origin");
        const eventCode = interaction.options.getString("alerttype");
        const fipsString = interaction.options.getString("fips");
        const duration = interaction.options
          .getString("purgetime")
          .padStart(4, "0");
        const sender = interaction.options.getString("sender");

        const eventName = eventMap.get(eventCode) || eventCode;
        const fipsResult = validateFIPS(fipsString);
        validLocations = fipsResult.valid;

        if (validLocations.length === 0) {
          return interaction.editReply({
            content:
              "❌ Invalid FIPS codes provided. Please use 6-digit codes (e.g., `001001` or `001001-001003`)",
          });
        }

        const generator = new EASAudioGenerator();
        const date = new Date();
        header = generator.createHeaderString(
          origin,
          eventCode,
          validLocations,
          duration,
          date,
          sender,
        );

        const ttsStatus =
          hasTTS || hasVoice ? "with TTS announcement" : "**(tones only)**";
        await interaction.editReply({
          content: `🔄 Generating EAS alert ${ttsStatus}...\n**Header:** \`${header}\``,
        });

        generator.generateHeaderTones(header, endecMode);
        generator.generateAttentionTone(0, 8);

        if (hasTTS || hasVoice) {
          await generator.appendTTS(ttsMessage, header, voice);
        } else {
          generator.generateSilence(Math.floor(SAMPLE_RATE * 2));
        }

        generator.generateEOMTones(endecMode);

        const wavBuffer = generator.toWAV();
        const tempPath = await saveTempWAV(wavBuffer);

        let connection;
        try {
          connection = joinVoiceChannel({
            channelId: voiceChannel.id,
            guildId: interaction.guild.id,
            adapterCreator: voiceChannel.guild.voiceAdapterCreator,
            selfDeaf: false,
            selfMute: false,
          });

          await entersState(connection, VoiceConnectionStatus.Ready, 120_000); // increased to 20s
        } catch (err) {
          if (connection) connection.destroy();
          fs.unlinkSync(tempPath);
          return interaction.editReply({
            content: `❌ Failed to connect to voice channel: \`${err.message}\`\nMake sure I have permission to join **${voiceChannel.name}**.`,
          });
        }

        const player = createAudioPlayer();
        const resource = createAudioResource(tempPath, {
          inputType: StreamType.Arbitrary,
        });

        player.play(resource);
        connection.subscribe(player);

        // Handle connection drops mid-playback
        connection.on(VoiceConnectionStatus.Disconnected, async () => {
          try {
            await Promise.race([
              entersState(connection, VoiceConnectionStatus.Signalling, 5_000),
              entersState(connection, VoiceConnectionStatus.Connecting, 5_000),
            ]);
          } catch {
            connection.destroy();
          }
        });

        player.on(AudioPlayerStatus.Idle, () => {
          connection.destroy();
          if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
        });

        player.on("error", (error) => {
          console.error("Player error:", error);
          connection.destroy();
          if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
        });

        const ttsInfo = hasTTS
          ? `\n**Announcement:** "${ttsMessage.substring(0, 100)}${ttsMessage.length > 100 ? "..." : ""}"`
          : "\n**Announcement:** *(tones only, no voice)*";

        await interaction.editReply({
          content:
            `✅ **EAS Alert Generated & Playing!**\n\n` +
            `**Header:** \`${truncate(header, 300)}\`\n` +
            `**Event:** ${eventName} (${eventCode})\n` +
            `**Locations:** ${limitArray(validLocations, 20).join(", ")}\n` +
            `**ENDEC Mode:** ${ENDEC_MODE_PROFILES[endecMode]?.label || endecMode}\n` +
            `**Duration:** ${duration} minutes${ttsInfo}\n\n` +
            `🔊 Playing in **${voiceChannel.name}**...`,
        });

        player.on(AudioPlayerStatus.Idle, () => {
          connection.destroy();
          fs.unlinkSync(tempPath);
        });

        player.on("error", (error) => {
          console.error("Player error:", error);
          connection.destroy();
          fs.unlinkSync(tempPath);
        });
      } else if (subcommand === "zczc") {
        const zczcString = interaction.options.getString("zczcstring");

        if (!zczcString.toUpperCase().startsWith("ZCZC")) {
          return interaction.editReply({
            content: "❌ Invalid ZCZC string! Must start with 'ZCZC'",
          });
        }

        header = zczcString;

        const generator = new EASAudioGenerator();

        const ttsStatus = hasTTS ? "with TTS announcement" : "**(tones only)**";
        await interaction.editReply({
          content: `🔄 Generating EAS alert from custom header ${ttsStatus}...\n**Header:** \`${header}\``,
        });

        generator.generateHeaderTones(header, endecMode);
        generator.generateAttentionTone(0, 8);

        if (hasTTS) {
          await generator.appendTTS(ttsMessage, header, "EMNet");
        } else {
          generator.generateSilence(Math.floor(SAMPLE_RATE * 2));
        }

        generator.generateEOMTones(endecMode);

        const wavBuffer = generator.toWAV();
        const tempPath = await saveTempWAV(wavBuffer);

        const connection = joinVoiceChannel({
          channelId: voiceChannel.id,
          guildId: interaction.guild.id,
          adapterCreator: voiceChannel.guild.voiceAdapterCreator,
          selfDeaf: false,
          selfMute: false,
        });

        await entersState(connection, VoiceConnectionStatus.Ready, 120000);

        const player = createAudioPlayer();
        const resource = createAudioResource(tempPath, {
          inputType: StreamType.Arbitrary,
        });

        player.play(resource);
        connection.subscribe(player);

        const ttsInfo = hasTTS
          ? `\n**Announcement:** "${ttsMessage.substring(0, 100)}${ttsMessage.length > 100 ? "..." : ""}"`
          : "\n**Announcement:** *(tones only, no voice)*";

        await interaction.editReply({
          content:
            `✅ **Custom EAS Alert Playing!**\n\n` +
            `**Header:** \`${header}\`\n` +
            `**ENDEC Mode:** ${ENDEC_MODE_PROFILES[endecMode]?.label || endecMode}${ttsInfo}\n\n` +
            `🔊 Playing in **${voiceChannel.name}**...`,
        });

        player.on(AudioPlayerStatus.Idle, () => {
          connection.destroy();
          fs.unlinkSync(tempPath);
        });

        player.on("error", (error) => {
          console.error("Player error:", error);
          connection.destroy();
          fs.unlinkSync(tempPath);
        });
      }
    } catch (error) {
      console.error("EAS Generation Error:", error);
      await interaction.editReply({
        content: `❌ Failed to generate EAS alert: ${error.message}\n\nMake sure you have the required packages:\n\`npm install wavefile wav-decoder\``,
      });
    }
  },
};

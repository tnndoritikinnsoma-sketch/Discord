import { readFileSync, writeFileSync, mkdirSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(process.cwd(), "data"); // Discloudのルートにあるdataフォルダを使用
const DB_FILE = join(DATA_DIR, "bot_data.json");

function ensureDir() {
  if (!existsSync(DATA_DIR)) {
    mkdirSync(DATA_DIR, { recursive: true });
  }
}

function loadData() {
  ensureDir();
  if (!existsSync(DB_FILE)) {
    return { channelSettings: {}, modRoles: {}, customInstructions: {}, conversationHistory: {} };
  }
  try {
    return JSON.parse(readFileSync(DB_FILE, "utf-8"));
  } catch {
    return { channelSettings: {}, modRoles: {}, customInstructions: {}, conversationHistory: {} };
  }
}

let _data = loadData();

function persist() {
  ensureDir();
  try {
    writeFileSync(DB_FILE, JSON.stringify(_data, null, 2), "utf-8");
  } catch (e) {
    console.error("[DB] Failed to save:", e.message);
  }
}

export function getChannelSetting(guildId, channelId) {
  return _data.channelSettings?.[guildId]?.[channelId] || null;
}

export function setChannelSetting(guildId, channelId, setting) {
  if (!_data.channelSettings[guildId]) _data.channelSettings[guildId] = {};
  _data.channelSettings[guildId][channelId] = setting;
  persist();
}

export function removeChannelSetting(guildId, channelId) {
  if (_data.channelSettings[guildId]) {
    delete _data.channelSettings[guildId][channelId];
    persist();
  }
}

export function getAllChannelSettings(guildId) {
  return _data.channelSettings?.[guildId] || {};
}

export function getModRoles(guildId) {
  return _data.modRoles?.[guildId] || [];
}

export function addModRole(guildId, roleId) {
  if (!_data.modRoles[guildId]) _data.modRoles[guildId] = [];
  if (!_data.modRoles[guildId].includes(roleId)) {
    _data.modRoles[guildId].push(roleId);
    persist();
  }
}

export function removeModRole(guildId, roleId) {
  if (_data.modRoles[guildId]) {
    _data.modRoles[guildId] = _data.modRoles[guildId].filter((r) => r !== roleId);
    persist();
  }
}

export function getCustomInstruction(guildId) {
  return _data.customInstructions?.[guildId] || null;
}

export function setCustomInstruction(guildId, instruction) {
  _data.customInstructions[guildId] = instruction;
  persist();
}

export function removeCustomInstruction(guildId) {
  delete _data.customInstructions[guildId];
  persist();
}

export function getConversationHistory(guildId, channelId, userId) {
  const key = `${guildId}:${channelId}:${userId}`;
  return _data.conversationHistory?.[key] || [];
}

export function addConversationMessage(guildId, channelId, userId, role, content) {
  const key = `${guildId}:${channelId}:${userId}`;
  if (!_data.conversationHistory[key]) _data.conversationHistory[key] = [];
  _data.conversationHistory[key].push({ role, content });
  if (_data.conversationHistory[key].length > 20) {
    _data.conversationHistory[key] = _data.conversationHistory[key].slice(-20);
  }
  persist();
}

export function clearConversationHistory(guildId, channelId, userId) {
  const key = `${guildId}:${channelId}:${userId}`;
  delete _data.conversationHistory[key];
  persist();
}

export function clearAllChannelHistory(guildId, channelId) {
  const prefix = `${guildId}:${channelId}:`;
  for (const key of Object.keys(_data.conversationHistory)) {
    if (key.startsWith(prefix)) delete _data.conversationHistory[key];
  }
  persist();
}

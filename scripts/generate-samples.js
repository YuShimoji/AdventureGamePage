#!/usr/bin/env node
// Sample data generator for extended game data schema.
// Generates sample JSON files for items, characters, lore (Wiki), and state.

const fs = require("fs");
const path = require("path");

const OUTPUT_DIR = path.join(process.cwd(), "samples");

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// Sample items data
const sampleItems = {
  items: [
    {
      id: "sword1",
      name: "鉄の剣",
      type: "weapon",
      description: "標準的な鉄製の剣。攻撃力 +5。",
      properties: { attack: 5, durability: 100 },
    },
    {
      id: "potion1",
      name: "回復薬",
      type: "consumable",
      description: "HPを50回復する薬。",
      properties: { heal: 50, stackable: true },
    },
  ],
};

// Sample characters data
const sampleCharacters = {
  characters: [
    {
      id: "hero1",
      name: "勇者",
      type: "player",
      description: "冒険の主人公。",
      stats: { hp: 100, attack: 10, defense: 5 },
      relationships: [],
    },
    {
      id: "villager1",
      name: "村人",
      type: "npc",
      description: "村に住む善良な住民。",
      stats: { hp: 50, attack: 2, defense: 2 },
      relationships: ["hero1:friend"],
    },
  ],
};

// Sample lore (Wiki) data
const sampleLore = {
  lore: [
    {
      id: "kingdom1",
      title: "王国史",
      content: "この王国は古代から存在し、多くの英雄を生み出してきた。",
      tags: ["history", "kingdom"],
      related: ["hero1"],
    },
    {
      id: "artifact1",
      title: "伝説の剣",
      content: "古代の英雄が使用した剣。強大な力を持つ。",
      tags: ["artifact", "weapon"],
      related: ["sword1"],
    },
  ],
};

// Sample state data
const sampleState = {
  state: {
    inventory: {
      sword1: 1,
      potion1: 5,
    },
    flags: {
      intro_completed: true,
      first_battle_won: false,
    },
    variables: {
      gold: 100,
      reputation: 50,
    },
    history: [
      { nodeId: "start", timestamp: new Date().toISOString() },
      { nodeId: "battle1", timestamp: new Date().toISOString() },
    ],
  },
};

// Write sample files
const samples = [
  { name: "items.json", data: sampleItems },
  { name: "characters.json", data: sampleCharacters },
  { name: "lore.json", data: sampleLore },
  { name: "state.json", data: sampleState },
];

samples.forEach(({ name, data }) => {
  const filePath = path.join(OUTPUT_DIR, name);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
  console.log(`Generated: ${filePath}`);
});

console.log("All sample data generated successfully.");

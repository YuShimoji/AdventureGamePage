// Migration utilities for extended game data schema.
// Converts legacy data to new format with items, characters, lore, and state.

const STORAGE_KEY_LEGACY = 'agp_manuscript_full';
const STORAGE_KEY_ITEMS = 'agp_items';
const STORAGE_KEY_CHARACTERS = 'agp_characters';
const STORAGE_KEY_LORE = 'agp_lore';
const STORAGE_KEY_STATE = 'agp_state';

function migrateLegacyToExtended() {
  if (typeof localStorage === 'undefined') return false;

  // Check if migration already done
  if (localStorage.getItem(STORAGE_KEY_ITEMS)) return false;

  const legacyData = localStorage.getItem(STORAGE_KEY_LEGACY);
  if (!legacyData) return false;

  try {
    const parsed = JSON.parse(legacyData);
    if (!parsed || typeof parsed !== 'object') return false;

    // Migrate to items (extract any item-like content)
    const items = extractItemsFromText(parsed.text || parsed.html || '');
    localStorage.setItem(STORAGE_KEY_ITEMS, JSON.stringify({ items }));

    // Migrate to characters (extract character mentions)
    const characters = extractCharactersFromText(parsed.text || parsed.html || '');
    localStorage.setItem(STORAGE_KEY_CHARACTERS, JSON.stringify({ characters }));

    // Migrate to lore (extract lore-like content)
    const lore = extractLoreFromText(parsed.text || parsed.html || '');
    localStorage.setItem(STORAGE_KEY_LORE, JSON.stringify({ lore }));

    // Migrate to state (basic state initialization)
    const state = {
      inventory: {},
      flags: {},
      variables: { migratedFromLegacy: true },
      history: parsed.history || []
    };
    localStorage.setItem(STORAGE_KEY_STATE, JSON.stringify({ state }));

    console.log('Migration completed successfully.');
    return true;
  } catch (e) {
    console.error('Migration failed:', e);
    return false;
  }
}

function extractItemsFromText(text) {
  // Simple extraction: look for item-like patterns
  const items = [];
  const itemPatterns = [
    { regex: /剣|刀|武器/g, type: 'weapon' },
    { regex: /薬|ポーション/g, type: 'consumable' },
    { regex: /鎧|盾/g, type: 'armor' }
  ];

  itemPatterns.forEach(({ regex, type }) => {
    const matches = text.match(regex);
    if (matches) {
      matches.forEach((match, index) => {
        items.push({
          id: `${type}${index + 1}`,
          name: match,
          type,
          description: `${match} - 自動抽出されたアイテム。`,
          properties: {}
        });
      });
    }
  });

  return items;
}

function extractCharactersFromText(text) {
  // Extract character-like names
  const characters = [];
  const namePatterns = /[A-Z][a-z]+(?:\s[A-Z][a-z]+)*/g; // Basic name pattern
  const matches = text.match(namePatterns) || [];

  matches.forEach((name, index) => {
    characters.push({
      id: `char${index + 1}`,
      name,
      type: 'npc',
      description: `${name} - 自動抽出されたキャラクター。`,
      stats: { hp: 50, attack: 5, defense: 5 },
      relationships: []
    });
  });

  return characters;
}

function extractLoreFromText(text) {
  // Extract lore-like content (sections with history/lore keywords)
  const lore = [];
  const sections = text.split(/\n\s*\n/); // Split by double line breaks

  sections.forEach((section, index) => {
    if (section.includes('歴史') || section.includes('伝説') || section.includes('王国') || section.includes('古代')) {
      lore.push({
        id: `lore${index + 1}`,
        title: `抽出されたロア ${index + 1}`,
        content: section,
        tags: ['auto-extracted'],
        related: []
      });
    }
  });

  return lore;
}

// Expose globally
if (typeof window !== 'undefined') {
  window.DataMigration = { migrateLegacyToExtended };
}

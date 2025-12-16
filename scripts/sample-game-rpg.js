// 複雑サンプルゲーム: 森の冒険者 (RPG風)
function sampleRpgImg(title, subtitle) {
  const safeTitle = String(title || '').replace(/[<>]/g, '');
  const safeSub = String(subtitle || '').replace(/[<>]/g, '');
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="700" viewBox="0 0 1200 700">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#4a9eff" stop-opacity="0.28" />
      <stop offset="1" stop-color="#b8f7d1" stop-opacity="0.22" />
    </linearGradient>
  </defs>
  <rect x="0" y="0" width="1200" height="700" fill="#0b1220" />
  <rect x="0" y="0" width="1200" height="700" fill="url(#g)" />
  <rect x="60" y="60" width="1080" height="580" rx="24" fill="#0b1220" fill-opacity="0.35" stroke="#4a9eff" stroke-opacity="0.35" />
  <text x="120" y="240" font-family="ui-sans-serif, system-ui" font-size="64" fill="#e6f0ff">${safeTitle}</text>
  <text x="120" y="320" font-family="ui-sans-serif, system-ui" font-size="28" fill="#bcd0ff" opacity="0.9">${safeSub}</text>
</svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

window.SAMPLE_GAME_RPG = {
  _img: sampleRpgImg,
  title: '森の冒険者',
  start: 'village',
  nodes: {
    village: {
      title: '村の広場',
      text: 'あなたは小さな村の広場にいます。村人たちが忙しそうに働いています。北には古い森が見えます。',
      image: sampleRpgImg('村の広場', 'Village'),
      choices: [
        {
          label: '森へ向かう',
          target: 'forest_entrance',
        },
        {
          label: '村人を訪ねる',
          target: 'talk_to_villager',
        },
        {
          label: 'インベントリを確認する',
          target: 'check_inventory',
        },
      ],
      actions: [{ type: 'set_variable', key: 'visited_village', value: true }],
    },

    forest_entrance: {
      title: '森の入り口',
      text: '森の入り口に到着しました。木々の隙間から不気味な気配が感じられます。',
      image: sampleRpgImg('森の入り口', 'Forest Entrance'),
      choices: [
        {
          label: '森の中へ進む',
          target: 'forest_deep',
        },
        {
          label: '左の道を行く',
          target: 'forest_path_left',
          conditions: [{ type: 'variable_equals', key: 'bravery', operator: '>=', value: 3 }],
        },
        {
          label: '右の道を行く',
          target: 'forest_path_right',
        },
        {
          label: '引き返す',
          target: 'village',
        },
      ],
      actions: [
        { type: 'set_variable', key: 'entered_forest', value: true },
        { type: 'set_variable', key: 'visited_forest', value: true },
        { type: 'set_variable', key: 'bravery', operation: 'add', value: 1 },
      ],
    },

    forest_deep: {
      title: '森の奥深く',
      text: '森の奥深くに進むと、突然何かが動く気配がしました！ 草むらがざわつきます。',
      image: sampleRpgImg('森の奥深く', 'Forest Deep'),
      choices: [
        {
          label: '草むらを調べる',
          target: 'monster_encounter',
        },
        {
          label: '逃げる',
          target: 'forest_entrance',
        },
      ],
    },

    monster_encounter: {
      title: 'モンスター遭遇！',
      text: '草むらから小さなモンスターが飛び出してきました！',
      image: sampleRpgImg('モンスター遭遇！', 'Monster'),
      choices: [
        {
          label: '戦う',
          target: 'battle_win',
          conditions: [{ type: 'has_item', itemId: 'sword' }],
        },
        {
          label: '逃げる',
          target: 'forest_entrance',
        },
      ],
    },

    battle_win: {
      title: '勝利！',
      text: 'モンスターを倒しました！',
      image: sampleRpgImg('勝利！', 'Victory'),
      choices: [
        {
          label: '先に進む',
          target: 'treasure_room',
        },
      ],
      actions: [
        { type: 'add_item', itemId: 'treasure_key', quantity: 1 },
        { type: 'set_variable', key: 'defeated_monster', value: true },
      ],
    },

    forest_path_left: {
      title: '危険な小道',
      text: '薄暗い小道を進むと、突然オオカミが現れました！ 逃げるか戦うか？',
      image: sampleRpgImg('危険な小道', 'Wolf'),
      choices: [
        {
          label: '戦う',
          target: 'fight_wolf',
          conditions: [{ type: 'has_item', itemId: 'sword' }],
        },
        {
          label: '逃げる',
          target: 'forest_entrance',
        },
      ],
    },

    fight_wolf: {
      title: 'オオカミとの戦い',
      text: '勇猛に剣を振るい、オオカミを倒しました！ 経験値を得ました。',
      image: sampleRpgImg('戦い', 'Fight'),
      choices: [
        {
          label: '先に進む',
          target: 'treasure_room',
        },
      ],
      actions: [
        { type: 'set_variable', key: 'experience', operation: 'add', value: 10 },
        { type: 'set_variable', key: 'defeated_wolf', value: true },
        { type: 'add_item', itemId: 'wolf_fur', quantity: 1 },
      ],
    },

    forest_path_right: {
      title: '静かな小道',
      text: '穏やかな小道を進むと、きれいな泉が見つかりました。水を飲むと体力が回復します。',
      image: sampleRpgImg('静かな小道', 'Spring'),
      choices: [
        {
          label: '水を飲む',
          target: 'drink_water',
        },
        {
          label: '先に進む',
          target: 'treasure_room',
        },
      ],
    },

    drink_water: {
      title: '泉のほとり',
      text: '清らかな水を飲むと、体力が回復しました。幸運にも小さな鍵が見つかりました！',
      choices: [
        {
          label: '先に進む',
          target: 'treasure_room',
        },
      ],
      actions: [
        { type: 'set_variable', key: 'health', operation: 'add', value: 20 },
        { type: 'add_item', itemId: 'small_key', quantity: 1 },
      ],
    },

    treasure_room: {
      title: '宝の部屋',
      text: '森の奥深くにある古い部屋に到着しました。宝箱がありますが、鍵がかかっています。',
      image: sampleRpgImg('宝の部屋', 'Treasure'),
      choices: [
        {
          label: '鍵を開ける',
          target: 'open_treasure',
          conditions: [{ type: 'has_item', itemId: 'small_key' }],
        },
        {
          label: '力でこじ開ける',
          target: 'force_treasure',
          conditions: [{ type: 'variable_equals', key: 'strength', operator: '>=', value: 5 }],
        },
        {
          label: '引き返す',
          target: 'forest_entrance',
        },
      ],
    },

    open_treasure: {
      title: '宝の発見！',
      text: '鍵を使って宝箱を開けました。中には魔法の剣と大量の金貨が入っていました！',
      choices: [
        {
          label: '村へ戻る',
          target: 'village_victory',
        },
      ],
      actions: [
        { type: 'add_item', itemId: 'magic_sword', quantity: 1 },
        { type: 'add_item', itemId: 'gold', quantity: 100 },
        { type: 'set_variable', key: 'treasure_found', value: true },
      ],
    },

    force_treasure: {
      title: '力任せの開封',
      text: '宝箱を力任せにこじ開けましたが、中身は空っぽでした。ただの古い箱のようです。',
      choices: [
        {
          label: '村へ戻る',
          target: 'village',
        },
      ],
      actions: [{ type: 'set_variable', key: 'strength', operation: 'add', value: 2 }],
    },

    village_victory: {
      title: '凱旋',
      text: '村に戻り、宝物を見せびらかすと、村人たちが歓声を上げました。あなたは英雄になりました！',
      image: sampleRpgImg('凱旋', 'Return'),
      choices: [
        {
          label: '冒険を続ける',
          target: 'village',
        },
        {
          label: 'ゲームクリア',
          target: 'game_clear',
        },
      ],
    },

    game_clear: {
      title: 'ゲームクリア！',
      text: 'おめでとうございます！ 森の冒険を無事成し遂げました。\n\n最終ステータス:\n- 経験値: ${experience}\n- 体力: ${health}\n- 勇気: ${bravery}\n- 力: ${strength}',
      choices: [
        {
          label: 'タイトルに戻る',
          target: 'village',
        },
      ],
    },

    talk_to_villager: {
      title: '村人との会話',
      text: '村人に話しかけると、森の奥に宝物が眠っているという噂を聞きました。「勇気のある者だけが手に入れられる」と村人は言いました。',
      choices: [
        {
          label: '了解した',
          target: 'village',
        },
      ],
      actions: [{ type: 'set_variable', key: 'heard_rumor', value: true }],
    },

    check_inventory: {
      title: 'インベントリ確認',
      text: '現在の所持品を確認します。',
      choices: [
        {
          label: '戻る',
          target: 'village',
        },
      ],
    },
  },
};

// アイテム定義（拡張）
window.SAMPLE_ITEMS = {
  sword: { name: '剣', icon: '⚔️', description: 'シンプルな剣。オオカミと戦える' },
  magic_sword: { name: '魔法の剣', icon: '🗡️', description: '強力な魔法の剣' },
  small_key: { name: '小さな鍵', icon: '🗝️', description: '宝箱を開ける鍵' },
  wolf_fur: { name: 'オオカミの毛皮', icon: '🐺', description: '暖かい毛皮' },
  gold: { name: '金貨', icon: '💰', description: '価値のある通貨' },
};

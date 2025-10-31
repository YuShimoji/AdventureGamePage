// 複雑サンプルゲーム: 森の冒険者 (RPG風)
window.SAMPLE_GAME_RPG = {
  title: "森の冒険者",
  start: "village",
  nodes: {
    "village": {
      title: "村の広場",
      text: "あなたは小さな村の広場にいます。村人たちが忙しそうに働いています。北には古い森が見えます。穏やかな村のBGMが流れています。",
      image: "images/village.jpg",
      choices: [
        {
          label: "森へ向かう",
          target: "forest_entrance"
        },
        {
          label: "村人を訪ねる",
          target: "talk_to_villager"
        },
        {
          label: "インベントリを確認する",
          target: "check_inventory"
        }
      ],
      actions: [
        { type: "play_bgm", url: "audio/village-bgm.mp3", volume: 0.6, loop: true, fadeIn: true },
        { type: "set_variable", key: "visited_village", value: true }
      ]
    },

    "forest_entrance": {
      title: "森の入り口",
      text: "森の入り口に到着しました。木々の隙間から不気味な気配が感じられます。村のBGMがフェードアウトし、森の雰囲気が変わります。",
      image: "images/forest-entrance.jpg",
      choices: [
        {
          label: "森の中へ進む",
          target: "forest_deep"
        },
        {
          label: "引き返す",
          target: "village"
        }
      ],
      actions: [
        { type: "play_bgm", url: "audio/forest-bgm.mp3", volume: 0.8, loop: true, crossfade: true },
        { type: "set_variable", key: "entered_forest", value: true }
      ]
    },

    "forest_deep": {
      title: "森の奥深く",
      text: "森の奥深くに進むと、突然何かが動く気配がしました！ 草むらがざわつきます。",
      image: "images/forest-deep.jpg",
      choices: [
        {
          label: "草むらを調べる",
          target: "monster_encounter"
        },
        {
          label: "逃げる",
          target: "forest_entrance"
        }
      ],
      actions: [
        { type: "play_sfx", url: "audio/monster-rustle.mp3", volume: 0.7 }
      ]
    },

    "monster_encounter": {
      title: "モンスター遭遇！",
      text: "草むらから小さなモンスターが飛び出してきました！ 戦闘のBGMが流れます。",
      image: "images/monster.jpg",
      choices: [
        {
          label: "戦う",
          target: "battle_win",
          conditions: [
            { type: "has_item", itemId: "sword" }
          ]
        },
        {
          label: "逃げる",
          target: "forest_entrance"
        }
      ],
      actions: [
        { type: "play_bgm", url: "audio/battle-bgm.mp3", volume: 1.0, loop: true, crossfade: true },
        { type: "play_sfx", url: "audio/monster-growl.mp3", volume: 0.8 }
      ]
    },

    "battle_win": {
      title: "勝利！",
      text: "モンスターを倒しました！ 勝利のファンファーレが鳴り響きます。",
      image: "images/victory.jpg",
      choices: [
        {
          label: "先に進む",
          target: "treasure_room"
        }
      ],
      actions: [
        { type: "stop_bgm", fadeOut: true },
        { type: "play_sfx", url: "audio/victory-fanfare.mp3", volume: 0.9 },
        { type: "add_item", itemId: "treasure_key", quantity: 1 },
        { type: "set_variable", key: "defeated_monster", value: true }
      ]
    },

    "forest_entrance": {
      title: "森の入口",
      text: "古い森の入口に立っています。木々が鬱蒼と茂り、奥から不気味な音が聞こえます。道は二手に分かれています。",
      image: "images/forest.jpg",
      choices: [
        {
          label: "左の道を行く",
          target: "forest_path_left",
          conditions: [{ type: "variable_equals", key: "bravery", operator: ">=", value: 3 }]
        },
        {
          label: "右の道を行く",
          target: "forest_path_right"
        },
        {
          label: "引き返す",
          target: "village"
        }
      ],
      actions: [
        { type: "set_variable", key: "visited_forest", value: true },
        { type: "set_variable", key: "bravery", operation: "add", value: 1 }
      ]
    },

    "forest_path_left": {
      title: "危険な小道",
      text: "薄暗い小道を進むと、突然オオカミが現れました！ 逃げるか戦うか？",
      image: "images/wolf.jpg",
      choices: [
        {
          label: "戦う",
          target: "fight_wolf",
          conditions: [{ type: "has_item", itemId: "sword" }]
        },
        {
          label: "逃げる",
          target: "forest_entrance"
        }
      ]
    },

    "fight_wolf": {
      title: "オオカミとの戦い",
      text: "勇猛に剣を振るい、オオカミを倒しました！ 経験値を得ました。",
      image: "images/fight.jpg",
      choices: [
        {
          label: "先に進む",
          target: "treasure_room"
        }
      ],
      actions: [
        { type: "set_variable", key: "experience", operation: "add", value: 10 },
        { type: "set_variable", key: "defeated_wolf", value: true },
        { type: "add_item", itemId: "wolf_fur", quantity: 1 }
      ]
    },

    "forest_path_right": {
      title: "静かな小道",
      text: "穏やかな小道を進むと、きれいな泉が見つかりました。水を飲むと体力が回復します。",
      image: "images/spring.jpg",
      choices: [
        {
          label: "水を飲む",
          target: "drink_water"
        },
        {
          label: "先に進む",
          target: "treasure_room"
        }
      ]
    },

    "drink_water": {
      title: "泉のほとり",
      text: "清らかな水を飲むと、体力が回復しました。幸運にも小さな鍵が見つかりました！",
      choices: [
        {
          label: "先に進む",
          target: "treasure_room"
        }
      ],
      actions: [
        { type: "set_variable", key: "health", operation: "add", value: 20 },
        { type: "add_item", itemId: "small_key", quantity: 1 }
      ]
    },

    "treasure_room": {
      title: "宝の部屋",
      text: "森の奥深くにある古い部屋に到着しました。宝箱がありますが、鍵がかかっています。",
      image: "images/treasure.jpg",
      choices: [
        {
          label: "鍵を開ける",
          target: "open_treasure",
          conditions: [{ type: "has_item", itemId: "small_key" }]
        },
        {
          label: "力でこじ開ける",
          target: "force_treasure",
          conditions: [{ type: "variable_equals", key: "strength", operator: ">=", value: 5 }]
        },
        {
          label: "引き返す",
          target: "forest_entrance"
        }
      ]
    },

    "open_treasure": {
      title: "宝の発見！",
      text: "鍵を使って宝箱を開けました。中には魔法の剣と大量の金貨が入っていました！",
      choices: [
        {
          label: "村へ戻る",
          target: "village_victory"
        }
      ],
      actions: [
        { type: "add_item", itemId: "magic_sword", quantity: 1 },
        { type: "add_item", itemId: "gold", quantity: 100 },
        { type: "set_variable", key: "treasure_found", value: true }
      ]
    },

    "force_treasure": {
      title: "力任せの開封",
      text: "宝箱を力任せにこじ開けましたが、中身は空っぽでした。ただの古い箱のようです。",
      choices: [
        {
          label: "村へ戻る",
          target: "village"
        }
      ],
      actions: [
        { type: "set_variable", key: "strength", operation: "add", value: 2 }
      ]
    },

    "village_victory": {
      title: "凱旋",
      text: "村に戻り、宝物を見せびらかすと、村人たちが歓声を上げました。あなたは英雄になりました！",
      image: "images/victory.jpg",
      choices: [
        {
          label: "冒険を続ける",
          target: "village"
        },
        {
          label: "ゲームクリア",
          target: "game_clear"
        }
      ]
    },

    "game_clear": {
      title: "ゲームクリア！",
      text: "おめでとうございます！ 森の冒険を無事成し遂げました。\n\n最終ステータス:\n- 経験値: ${experience}\n- 体力: ${health}\n- 勇気: ${bravery}\n- 力: ${strength}",
      choices: [
        {
          label: "タイトルに戻る",
          target: "village"
        }
      ]
    },

    "talk_to_villager": {
      title: "村人との会話",
      text: "村人に話しかけると、森の奥に宝物が眠っているという噂を聞きました。「勇気のある者だけが手に入れられる」と村人は言いました。",
      choices: [
        {
          label: "了解した",
          target: "village"
        }
      ],
      actions: [
        { type: "set_variable", key: "heard_rumor", value: true }
      ]
    },

    "check_inventory": {
      title: "インベントリ確認",
      text: "現在の所持品を確認します。",
      choices: [
        {
          label: "戻る",
          target: "village"
        }
      ]
    }
  }
};

// アイテム定義（拡張）
window.SAMPLE_ITEMS = {
  "sword": { name: "剣", icon: "⚔️", description: "シンプルな剣。オオカミと戦える" },
  "magic_sword": { name: "魔法の剣", icon: "🗡️", description: "強力な魔法の剣" },
  "small_key": { name: "小さな鍵", icon: "🗝️", description: "宝箱を開ける鍵" },
  "wolf_fur": { name: "オオカミの毛皮", icon: "🐺", description: "暖かい毛皮" },
  "gold": { name: "金貨", icon: "💰", description: "価値のある通貨" }
};

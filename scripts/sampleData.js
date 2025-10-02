window.SAMPLE_GAME = {
  title: '小さな分岐のサンプル',
  start: 'start',
  nodes: {
    start: {
      text: 'あなたは薄暗い部屋で目を覚ました。扉と窓がある。',
      choices: [
        { text: '扉を開ける', to: 'hall' },
        { text: '窓の外を見る', to: 'window' }
      ]
    },
    hall: {
      text: '廊下は長く、左右に曲がっている。遠くで物音がした。',
      choices: [
        { text: '左へ進む', to: 'left' },
        { text: '右へ進む', to: 'right' },
        { text: '部屋へ戻る', to: 'start' }
      ]
    },
    window: {
      text: '窓の外は夜の森が広がっている。冷たい風が吹き込んだ。',
      choices: [
        { text: '窓から出る', to: 'forest' },
        { text: '部屋へ戻る', to: 'start' }
      ]
    },
    left: {
      text: '左の角を曲がると、灯りのついた小部屋があった。そこで古い鍵を見つけた。',
      choices: [
        { text: '鍵を手に入れる', to: 'key' },
        { text: '戻る', to: 'hall' }
      ]
    },
    right: {
      text: '右の角には閉ざされた扉があった。鍵穴がある。',
      choices: [
        { text: '部屋へ戻る', to: 'start' },
        { text: '廊下へ戻る', to: 'hall' }
      ]
    },
    key: {
      text: '鍵を手に入れた。右の扉を開けられるかもしれない。',
      choices: [
        { text: '右の扉へ向かう', to: 'right_open' }
      ]
    },
    right_open: {
      text: '鍵を使うと扉は静かに開いた。外の世界へ出ることができた。- 終 -',
      choices: [
        { text: '最初から', to: 'start' }
      ]
    },
    forest: {
      text: '森は静かで、月の光だけが道を照らしている。遠くに小さな明かりが見える。',
      choices: [
        { text: '明かりへ向かう', to: 'light' },
        { text: '部屋へ戻る（窓から）', to: 'start' }
      ]
    },
    light: {
      text: '明かりは小さな小屋の灯りだった。扉をたたくと誰かが出てきた……（つづく）',
      choices: [
        { text: '最初から', to: 'start' }
      ]
    }
  }
};

// =====================================================================
// 時空身體地圖・空間篇｜預設設定（三層：來源 sources／判斷邏輯 logic／解釋 explain）
// 醫師後台 doctor.html 編輯的就是這份結構；學員頁 index.html 用它跑流程與計分。
// =====================================================================
window.BACKEND = 'https://script.google.com/macros/s/AKfycbz8lEGJFReE5NFtCD-TPk5BOZ6q5McjiMcM2KiPZIcuFl-YCtWTg0tIO89gZBuQdIlc/exec';
window.DEFAULT_CONFIG = {
  version: 'v1.0',
  sources: {
    questions: [
      {id:'Q1a', enabled:true, key:'pain', type:'bodymap', zone:0, t:'上半身，哪裡常痠痛？', sub:'點圓圈，可以點很多個。', score:{mode:'none'},
       note:'痠痛位置第 1 步（共 3 步）：頭頸、肩膀、上背、手肘手腕。只拿來在報告上做對照，不計分。依據：「痛的地方很常是在替別人扛的地方」〔黃醫師 9/8〕。'},
      {id:'Q1b', enabled:true, key:'pain', type:'bodymap', zone:1, t:'腰和屁股呢？', sub:'有就點，沒有就按「這一區沒有」。', score:{mode:'none'},
       note:'痠痛位置第 2 步（共 3 步）：腰、屁股。不計分。'},
      {id:'Q1c', enabled:true, key:'pain', type:'bodymap', zone:2, t:'腿和腳呢？', sub:'有就點，沒有就按「這一區沒有」。', score:{mode:'none'},
       note:'痠痛位置第 3 步（共 3 步）：膝蓋、腳踝腳跟。不計分。'},
      {id:'Q2', enabled:true, key:'injury', type:'quadmap', t:'以前受過傷、現在不痛的地方？', sub:'扭到、拉傷、開過刀都算。', score:{mode:'quad', w:1},
       note:'點到的區塊加分。依據：震波後「不痛了便以為好了」的病例〔黃醫師 9/8〕。'},
      {id:'Q3', enabled:true, key:'scar', type:'choice', t:'身上有開刀留下的疤嗎？', o:['肚子','胸口或背','手或腳','沒有'], score:{mode:'none'},
       note:'不計分，放進報告提醒。依據：剖腹產疤痕病例〔黃醫師 9/8〕。'},
      {id:'Q4', enabled:true, key:'fixed', type:'pics', t:'你一天最常哪個姿勢？',
       o:['坐著用電腦','站著工作','低頭滑手機','常背包包、提重物','常常換來換去'], pics:['img/pose_sit.jpg','img/pose_stand.jpg','img/pose_phone.jpg','img/pose_bag.jpg','img/pose_move.jpg'], score:{mode:'none'},
       note:'不計分，用來決定「今天可以先做的事」。'},
      {id:'Q5', enabled:true, key:'hand', type:'choice', t:'你用哪隻手拿筷子？', o:['右手','左手','兩手都可以'], score:{mode:'none'},
       note:'不計分（判讀法 v0.4 不用慣用手補分）。'}
    ],
    moves: [
      {id:'M1', enabled:true, name:'三心同面', half:'U', w:1, frames:[['img/m1a.jpg','① 站好，手放下'],['img/m1b.jpg','② 兩手平舉，手心朝下'],['img/move_arms.jpg','③ 手心慢慢轉向前']],
       ask:'哪隻手比較轉不過來？', teach:'這個動作看手臂和胸口能不能轉到同一個方向。轉不過來的那一邊，上半身比較緊、比較轉不開。', note:'「三心同面」〔Charlene 11/6 轉述〕，做法待醫師確認。'},
      {id:'M2', enabled:true, name:'兩手舉高', half:'U', w:1, frames:[['img/m2a.jpg','① 站好，手放下'],['img/m2b.jpg','② 兩手從旁邊往上舉'],['img/move_raise.jpg','③ 舉到最高，貼近耳朵']],
       compare:[['img/move_raise.jpg','兩邊都舉得上去'],['img/m2bad.jpg','一邊舉不上去，肩膀聳起來']],
       ask:'哪隻手比較舉不上去？', teach:'手舉不上去、肩膀跟著聳，代表那一邊的肩膀太緊，只好用聳肩來幫忙。', note:'示意動作，待醫師替換或確認。'},
      {id:'M3', enabled:true, name:'單腳站', half:'D', w:1, timer:true, frames:[['img/m3a.jpg','① 一手扶牆'],['img/move_stand.jpg','② 抬左腳，數到 10'],['img/m3b.jpg','③ 換抬右腳，數到 10']],
       ask:'哪隻腳站比較會晃？', teach:'單腳站看的是身體的地基穩不穩。比較會晃的那一腳，那一邊的腳、膝蓋、屁股比較緊繃。', note:'示意動作，待醫師替換或確認。'}
    ],
    photoSteps: [['img/rec1.jpg','按下錄影'],['img/rec2.jpg','佔好位子，全身放鬆'],['img/rec3.jpg','回頭檢查，確定有拍到全身']],
    photoShot: {img:'img/shot.jpg', t:'截一張圖', sub:'打開剛剛的影片，停在站好不動的那一刻，截圖。'},
    points: [
      {id:'K1', enabled:true, name:'耳朵和肩膀', keys:['ear','sh']},
      {id:'K2', enabled:true, name:'手腕和手指', keys:['wr','idx']},
      {id:'K3', enabled:true, name:'屁股和膝蓋', keys:['hip','kn']},
      {id:'K4', enabled:true, name:'腳踝和腳跟', keys:['an','he']}
    ],
    compares: [
      {id:'P1', enabled:true, key:'U8', half:'U', w:1, name:'肩膀', type:'one', ask:'哪邊肩膀比較高？', how:'看肩膀離白線多近。',
       ex:[['img/sh_level.jpg','兩邊一樣高'],['img/sh_high.jpg','右邊比較高']], see:'先不要看哪裡痛，從背後看看兩邊肩膀一樣高嗎？', mean:'比較高、比較聳的那一邊，常常是手臂或肩胛骨那裡太緊，肩膀只好往上提。', note:'判讀法 v0.4 的 U8＋U1。'},
      {id:'P2', enabled:true, key:'U4', half:'U', w:1, name:'手', type:'pair', ask:'哪隻手露出比較多手背？', how:'手背＝有指關節的那一面。',
       see:'手自然垂下來的時候，看看兩隻手各露出多少手背。', mean:'手背露比較多的那一邊，代表那隻手往裡面轉得比較多，上半身比較緊。', note:'判讀法 v0.4 的 U4b7。'},
      {id:'P3', enabled:true, key:'L2', half:'D', w:1, name:'膝蓋後面', type:'one', ask:'膝蓋後面的橫紋，哪邊比較斜？', how:'看膝蓋後面那條橫的皺紋。',
       ex:[['img/knee_compare.jpg','範例：左邊斜、右邊平']], see:'膝蓋後面那條橫的皺紋，平常很少人注意，可是它很老實。', mean:'一邊比較斜，常常是那一邊的腳或屁股在多出力。', note:'判讀法 v0.4 的 L2。'},
      {id:'P4', enabled:true, key:'L1', half:'D', w:1.5, name:'腳跟', type:'one', ask:'哪邊腳跟比較往外倒？', how:'跟直的白線比。',
       ex:[['img/heel_ok.jpg','兩邊都直直的'],['img/heel_out.jpg','左腳跟往外倒']], see:'腳跟就像房子的地基，黃醫師看得最仔細的就是這裡。', mean:'地基一歪，上面的膝蓋、屁股、甚至肩膀，都要跟著一起調整。', note:'判讀法 v0.4 的 L1，權重 1.5。'}
    ],
    photoNotes: 'AI 自動找 16 個點（左右各 8：耳、肩、手腕、手指、屁股、膝、腳踝、腳跟），學員分 4 步、每步放大確認兩種點。'
  },
  logic: {
    feelWeight: {'卡卡的，動不了':1, '要很用力才做得到':0.6, '說不上來':0.5},
    aiMeasure: {enabled:true, w:0.3, minDeg:2},
    minScore: 0.2,
    minAgree: 2,
    note: ''
  },
  explain: {
    levels: [
      {max:29, name:'還好', color:'#7d8f6a', say:'目前還好，保持就好。'},
      {max:59, name:'要注意', color:'#c08a3e', say:'有點緊，開始多照顧。'},
      {max:100, name:'很緊繃', color:'#a8553a', say:'很緊繃，要優先照顧。'}
    ],
    quadrants: {
      LU:{area:'左手、左肩膀、左邊上背', say:'這一帶一直在幫身體多出力。', unit:'U2', todo:'提東西、背包包，換到右邊試試看，讓左邊休息一下。'},
      RU:{area:'右手、右肩膀、右邊上背', say:'這一帶一直在幫身體多出力。', unit:'U2', todo:'提東西、背包包，換到左邊試試看，讓右邊休息一下。'},
      LD:{area:'左腳、左膝蓋、左邊屁股', say:'這一帶一直在幫身體多出力。', unit:'U3', todo:'站著的時候，兩隻腳平均出力，不要老是靠在左腳上。'},
      RD:{area:'右腳、右膝蓋、右邊屁股', say:'這一帶一直在幫身體多出力。', unit:'U3', todo:'站著的時候，兩隻腳平均出力，不要老是靠在右腳上。'}
    },
    none: {say:'你身體的四個區塊，目前沒有哪一邊特別緊繃。', unit:'U1', todo:'繼續保持不讓身體停在同一個姿勢太久。'},
    units: [
      {id:'U1', ch:'第三章', name:'靜態空間受限與動態慢性疼痛', why:'先弄懂「身體太緊、轉不開」是怎麼回事。'},
      {id:'U2', ch:'第三章', name:'結構空間不足 1：上 常見代償路徑推理', why:'上半身比較緊繃的人，學會怎麼照顧。'},
      {id:'U3', ch:'第三章', name:'結構空間不足 2：下 常見代償路徑推理', why:'下半身比較緊繃的人，學會怎麼照顧。'},
      {id:'U4', ch:'時空交會', name:'把時間和空間放在一起看', why:'做完四季測驗後，知道同一個不舒服要從哪裡下手。'}
    ],
    unitOrder: ['U1','*','U4'],
    fixedTodo: {'坐著用電腦':'每坐 30 分鐘，站起來走一走、伸伸懶腰。','站著工作':'每站 30 分鐘，換一隻腳多出力，或坐下休息一分鐘。','低頭滑手機':'每滑 15 分鐘，把手機舉高到眼睛前面，或抬頭看遠方一分鐘。','常背包包、提重物':'左右兩邊輪流背、輪流提。','常常換來換去':'你已經做得很好了，繼續不讓身體停在同一個姿勢太久。'},
    feelText: {'卡卡的，動不了':'卡卡的。卡住代表那裡真的太緊，是很重要的提示。','要很用力才做得到':'要很用力。用力代表身體正在幫忙撐，它很努力，只是有點累了。','說不上來':'比較吃力。說不上來也沒關係，課程會教你分辨。'},
    nightMove: '跟著上面的圖慢慢做。做到覺得卡卡的就停，不要硬撐。做的時候感覺一下：是不是比昨天容易一點點？每天做，身體會慢慢變鬆。',
    disclaimer: '這不是生病，是身體在跟你說話；也不是醫生的診斷。'
  }
};

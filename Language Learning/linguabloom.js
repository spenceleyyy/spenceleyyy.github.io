    const STORAGE_KEY = "linguabloom-progress-v2";
    const STREAK_KEY = "linguabloom-streak";
    const COMPLETED_KEY = "linguabloom-completed";
    const LEVELS_PER_DIFFICULTY = 5;
    const DIFFICULTY_ORDER = ["beginner", "intermediate", "advanced"];
    const DIFFICULTY_LABELS = {
      beginner: "Beginner",
      intermediate: "Intermediate",
      advanced: "Advanced"
    };
    const CURRICULUM = {
      beginner: [
        { id: "beg-1", title: "Hello & Goodbye", description: "Greet people confidently.", group: "greetings" },
        { id: "beg-2", title: "Polite Basics", description: "Kind words in everyday moments.", group: "polite" },
        { id: "beg-3", title: "Around the Lake", description: "Ask for directions and help.", group: "directions" },
        { id: "beg-4", title: "Cafe Basics", description: "Order drinks and snacks.", group: "cafe" },
        { id: "beg-5", title: "Simple Opinions", description: "Talk about the city.", group: "opinions" }
      ],
      intermediate: [
        { id: "int-1", title: "Travel Day", description: "Get around town.", group: "travel" },
        { id: "int-2", title: "Shopping Trip", description: "Ask about prices and sizes.", group: "shopping" },
        { id: "int-3", title: "Making Plans", description: "Set a time and place.", group: "plans" },
        { id: "int-4", title: "Need a Hand", description: "Handle small problems.", group: "problems" },
        { id: "int-5", title: "City Opinions", description: "Share quick thoughts.", group: "opinions" }
      ],
      advanced: [
        { id: "adv-1", title: "Handle Problems", description: "Explain what went wrong.", group: "problems" },
        { id: "adv-2", title: "Local Plans", description: "Coordinate with friends.", group: "plans" },
        { id: "adv-3", title: "Travel Fixes", description: "Deal with delays.", group: "travel" },
        { id: "adv-4", title: "Shopping Details", description: "Clarify what you need.", group: "shopping" },
        { id: "adv-5", title: "Cafe Conversations", description: "Relaxed, longer phrases.", group: "cafe" }
      ]
    };

    const group = (tags, newWords, items) => ({ tags, newWords, items });
    const PACKS = {
      city_starter: {
        label: "City Starter Pack",
        languages: {
          spanish: {
            label: "Spanish",
            voice: "es-ES",
            vocab: {
              hola: "hello",
              buenos: "good (plural)",
              dias: "days/morning",
              noches: "nights/evening",
              hasta: "until",
              luego: "later",
              gracias: "thank you",
              favor: "please",
              perdon: "excuse me/sorry",
              siento: "sorry (I feel)",
              donde: "where",
              esta: "is/this",
              lago: "lake",
              ayuda: "help",
              ingles: "english",
              agua: "water",
              cafe: "coffee",
              cuenta: "check/bill",
              delicioso: "delicious",
              quisiera: "I would like",
              estacion: "station",
              hora: "time",
              reserva: "reservation",
              perdido: "lost",
              voy: "I go",
              cuanto: "how much",
              cuesta: "costs",
              boleto: "ticket",
              tarjeta: "card",
              probarme: "try on",
              amigo: "friend",
              manana: "tomorrow",
              temprano: "early",
              tarde: "late",
              vamos: "let's go",
              ciudad: "city",
              parque: "park",
              bonito: "beautiful",
              calle: "street",
              tranquilo: "quiet",
              telefono: "phone",
              doctor: "doctor",
              tren: "train",
              problema: "problem",
              retrasado: "delayed"
            },
            phrases: {
              greetings: group(["conversation"], ["hola", "buenos", "dias", "noches", "luego"], [
                { en: "Hello", target: "Hola" },
                { en: "Good morning", target: "Buenos días" },
                { en: "Good evening", target: "Buenas noches" },
                { en: "See you later", target: "Hasta luego" }
              ]),
              polite: group(["conversation"], ["gracias", "favor", "perdon", "siento"], [
                { en: "Thank you", target: "Gracias" },
                { en: "Please", target: "Por favor" },
                { en: "Excuse me", target: "Perdón" },
                { en: "Sorry", target: "Lo siento" }
              ]),
              directions: group(["direction"], ["donde", "esta", "lago", "ayuda", "ingles"], [
                { en: "Where is the lake?", target: "¿Dónde está el lago?" },
                { en: "I need help", target: "Necesito ayuda" },
                { en: "Can you repeat?", target: "¿Puedes repetir?" },
                { en: "Do you speak English?", target: "¿Hablas inglés?" }
              ]),
              cafe: group(["conversation"], ["agua", "cafe", "cuenta", "delicioso", "quisiera"], [
                { en: "I would like water", target: "Quisiera agua" },
                { en: "Coffee, please", target: "Café, por favor" },
                { en: "Can I get the check?", target: "¿Me trae la cuenta?" },
                { en: "This is delicious", target: "Está delicioso" }
              ]),
              travel: group(["travel"], ["estacion", "hora", "reserva", "perdido", "voy"], [
                { en: "I am going to the station", target: "Voy a la estación" },
                { en: "What time is it?", target: "¿Qué hora es?" },
                { en: "I have a reservation", target: "Tengo una reserva" },
                { en: "I am lost", target: "Estoy perdido" }
              ]),
              shopping: group(["shopping"], ["cuanto", "cuesta", "boleto", "tarjeta", "probarme"], [
                { en: "How much is this?", target: "¿Cuánto cuesta esto?" },
                { en: "I need a ticket", target: "Necesito un boleto" },
                { en: "Do you accept card?", target: "¿Aceptan tarjeta?" },
                { en: "Can I try this?", target: "¿Puedo probarme esto?" }
              ]),
              plans: group(["conversation"], ["amigo", "manana", "temprano", "tarde", "vamos"], [
                { en: "I am meeting a friend", target: "Voy a ver a un amigo" },
                { en: "Let's go tomorrow", target: "Vamos mañana" },
                { en: "We are early", target: "Llegamos temprano" },
                { en: "We are late", target: "Llegamos tarde" }
              ]),
              opinions: group(["conversation"], ["ciudad", "parque", "bonito", "calle", "tranquilo"], [
                { en: "I like this city", target: "Me gusta esta ciudad" },
                { en: "The park is beautiful", target: "El parque es bonito" },
                { en: "The street is busy", target: "La calle está llena" },
                { en: "It's quiet here", target: "Aquí es tranquilo" }
              ]),
              problems: group(["problem"], ["telefono", "doctor", "tren", "problema", "retrasado"], [
                { en: "I lost my phone", target: "Perdí mi teléfono" },
                { en: "I need a doctor", target: "Necesito un doctor" },
                { en: "The train is delayed", target: "El tren está retrasado" },
                { en: "I have a problem", target: "Tengo un problema" }
              ])
            }
          },
          french: {
            label: "French",
            voice: "fr-FR",
            vocab: {
              salut: "hi",
              bonjour: "good day/hello",
              bonsoir: "good evening",
              plus: "more/later",
              tard: "late",
              merci: "thank you",
              plait: "please",
              excusez: "excuse (formal)",
              desole: "sorry",
              ou: "where",
              est: "is",
              lac: "lake",
              aide: "help",
              anglais: "english",
              voudrais: "would like",
              cafe: "coffee",
              addition: "check/bill",
              delicieux: "delicious",
              gare: "station",
              heure: "time",
              reservation: "reservation",
              perdu: "lost",
              combien: "how much",
              coute: "costs",
              billet: "ticket",
              acceptez: "accept",
              carte: "card",
              essayer: "try",
              ami: "friend",
              demain: "tomorrow",
              avance: "early",
              retard: "late",
              ville: "city",
              parc: "park",
              beau: "beautiful",
              rue: "street",
              animee: "busy/lively",
              calme: "quiet",
              telephone: "phone",
              medecin: "doctor",
              train: "train",
              probleme: "problem"
            },
            phrases: {
              greetings: group(["conversation"], ["salut", "bonjour", "bonsoir", "plus", "tard"], [
                { en: "Hello", target: "Salut" },
                { en: "Good morning", target: "Bonjour" },
                { en: "Good evening", target: "Bonsoir" },
                { en: "See you later", target: "À plus tard" }
              ]),
              polite: group(["conversation"], ["merci", "plait", "excusez", "desole"], [
                { en: "Thank you", target: "Merci" },
                { en: "Please", target: "S'il vous plaît" },
                { en: "Excuse me", target: "Excusez-moi" },
                { en: "Sorry", target: "Désolé" }
              ]),
              directions: group(["direction"], ["ou", "est", "lac", "aide", "anglais"], [
                { en: "Where is the lake?", target: "Où est le lac ?" },
                { en: "I need help", target: "J'ai besoin d'aide" },
                { en: "Can you repeat?", target: "Pouvez-vous répéter ?" },
                { en: "Do you speak English?", target: "Parlez-vous anglais ?" }
              ]),
              cafe: group(["conversation"], ["voudrais", "cafe", "addition", "delicieux"], [
                { en: "I would like water", target: "Je voudrais de l'eau" },
                { en: "Coffee, please", target: "Un café, s'il vous plaît" },
                { en: "Can I get the check?", target: "Addition, s'il vous plaît" },
                { en: "This is delicious", target: "C'est délicieux" }
              ]),
              travel: group(["travel"], ["gare", "heure", "reservation", "perdu"], [
                { en: "I am going to the station", target: "Je vais à la gare" },
                { en: "What time is it?", target: "Quelle heure est-il ?" },
                { en: "I have a reservation", target: "J'ai une réservation" },
                { en: "I am lost", target: "Je suis perdu" }
              ]),
              shopping: group(["shopping"], ["combien", "coute", "billet", "carte", "essayer"], [
                { en: "How much is this?", target: "Combien ça coûte ?" },
                { en: "I need a ticket", target: "J'ai besoin d'un billet" },
                { en: "Do you accept card?", target: "Vous acceptez la carte ?" },
                { en: "Can I try this?", target: "Je peux essayer ça ?" }
              ]),
              plans: group(["conversation"], ["ami", "demain", "avance", "retard"], [
                { en: "I am meeting a friend", target: "Je retrouve un ami" },
                { en: "Let's go tomorrow", target: "Allons-y demain" },
                { en: "We are early", target: "Nous sommes en avance" },
                { en: "We are late", target: "Nous sommes en retard" }
              ]),
              opinions: group(["conversation"], ["ville", "parc", "beau", "rue", "calme"], [
                { en: "I like this city", target: "J'aime cette ville" },
                { en: "The park is beautiful", target: "Le parc est beau" },
                { en: "The street is busy", target: "La rue est animée" },
                { en: "It's quiet here", target: "C'est calme ici" }
              ]),
              problems: group(["problem"], ["telephone", "medecin", "train", "probleme"], [
                { en: "I lost my phone", target: "J'ai perdu mon téléphone" },
                { en: "I need a doctor", target: "J'ai besoin d'un médecin" },
                { en: "The train is delayed", target: "Le train est en retard" },
                { en: "I have a problem", target: "J'ai un problème" }
              ])
            }
          },
          german: {
            label: "German",
            voice: "de-DE",
            vocab: {
              hallo: "hello",
              guten: "good",
              morgen: "morning/tomorrow",
              abend: "evening",
              bis: "until",
              spater: "later",
              danke: "thank you",
              bitte: "please",
              entschuldigung: "excuse me",
              leid: "sorry",
              wo: "where",
              ist: "is",
              see: "lake",
              hilfe: "help",
              englisch: "english",
              wasser: "water",
              kaffee: "coffee",
              rechnung: "check/bill",
              lecker: "delicious",
              bahnhof: "station",
              spat: "late",
              reservierung: "reservation",
              verirrt: "lost",
              ticket: "ticket",
              kostet: "costs",
              karte: "card",
              anprobieren: "try on",
              freund: "friend",
              fruh: "early",
              stadt: "city",
              park: "park",
              schon: "beautiful",
              strasse: "street",
              belebt: "busy",
              ruhig: "quiet",
              handy: "phone",
              arzt: "doctor",
              zug: "train",
              verspatung: "delay",
              problem: "problem"
            },
            phrases: {
              greetings: group(["conversation"], ["hallo", "guten", "morgen", "abend", "spater"], [
                { en: "Hello", target: "Hallo" },
                { en: "Good morning", target: "Guten Morgen" },
                { en: "Good evening", target: "Guten Abend" },
                { en: "See you later", target: "Bis später" }
              ]),
              polite: group(["conversation"], ["danke", "bitte", "entschuldigung", "leid"], [
                { en: "Thank you", target: "Danke" },
                { en: "Please", target: "Bitte" },
                { en: "Excuse me", target: "Entschuldigung" },
                { en: "Sorry", target: "Es tut mir leid" }
              ]),
              directions: group(["direction"], ["wo", "ist", "see", "hilfe", "englisch"], [
                { en: "Where is the lake?", target: "Wo ist der See?" },
                { en: "I need help", target: "Ich brauche Hilfe" },
                { en: "Can you repeat?", target: "Kannst du das wiederholen?" },
                { en: "Do you speak English?", target: "Sprichst du Englisch?" }
              ]),
              cafe: group(["conversation"], ["wasser", "kaffee", "rechnung", "lecker"], [
                { en: "I would like water", target: "Ich hätte gern Wasser" },
                { en: "Coffee, please", target: "Einen Kaffee, bitte" },
                { en: "Can I get the check?", target: "Die Rechnung, bitte" },
                { en: "This is delicious", target: "Das ist lecker" }
              ]),
              travel: group(["travel"], ["bahnhof", "spat", "reservierung", "verirrt"], [
                { en: "I am going to the station", target: "Ich gehe zum Bahnhof" },
                { en: "What time is it?", target: "Wie spät ist es?" },
                { en: "I have a reservation", target: "Ich habe eine Reservierung" },
                { en: "I am lost", target: "Ich habe mich verirrt" }
              ]),
              shopping: group(["shopping"], ["ticket", "karte", "anprobieren", "kostet"], [
                { en: "How much is this?", target: "Wie viel kostet das?" },
                { en: "I need a ticket", target: "Ich brauche ein Ticket" },
                { en: "Do you accept card?", target: "Akzeptieren Sie Karte?" },
                { en: "Can I try this?", target: "Kann ich das anprobieren?" }
              ]),
              plans: group(["conversation"], ["freund", "morgen", "fruh", "spat"], [
                { en: "I am meeting a friend", target: "Ich treffe einen Freund" },
                { en: "Let's go tomorrow", target: "Lass uns morgen gehen" },
                { en: "We are early", target: "Wir sind früh" },
                { en: "We are late", target: "Wir sind spät" }
              ]),
              opinions: group(["conversation"], ["stadt", "park", "schon", "strasse", "ruhig"], [
                { en: "I like this city", target: "Ich mag diese Stadt" },
                { en: "The park is beautiful", target: "Der Park ist schön" },
                { en: "The street is busy", target: "Die Straße ist belebt" },
                { en: "It's quiet here", target: "Hier ist es ruhig" }
              ]),
              problems: group(["problem"], ["handy", "arzt", "zug", "verspatung", "problem"], [
                { en: "I lost my phone", target: "Ich habe mein Handy verloren" },
                { en: "I need a doctor", target: "Ich brauche einen Arzt" },
                { en: "The train is delayed", target: "Der Zug hat Verspätung" },
                { en: "I have a problem", target: "Ich habe ein Problem" }
              ])
            }
          },
          mandarin: {
            label: "Chinese (Mandarin)",
            voice: "zh-CN",
            vocab: {
              "你好": "hello",
              "早上": "morning",
              "晚上": "evening",
              "回头": "later/again",
              "谢谢": "thank you",
              "请": "please",
              "不好意思": "excuse me",
              "对不起": "sorry",
              "湖": "lake",
              "哪里": "where",
              "帮助": "help",
              "英语": "English",
              "水": "water",
              "咖啡": "coffee",
              "结账": "check out/pay",
              "美味": "delicious",
              "车站": "station",
              "几点": "what time",
              "预订": "reservation",
              "迷路": "lost",
              "多少": "how much",
              "票": "ticket",
              "收": "accept",
              "卡": "card",
              "朋友": "friend",
              "明天": "tomorrow",
              "早": "early",
              "晚": "late",
              "城市": "city",
              "公园": "park",
              "漂亮": "beautiful",
              "热闹": "busy/lively",
              "安静": "quiet",
              "手机": "phone",
              "医生": "doctor",
              "火车": "train",
              "问题": "problem"
            },
            romanization: {
              "你好": "ni hao",
              "早上": "zao shang",
              "晚上": "wan shang",
              "回头": "hui tou",
              "谢谢": "xie xie",
              "请": "qing",
              "不好意思": "bu hao yi si",
              "对不起": "dui bu qi",
              "湖": "hu",
              "哪里": "na li",
              "帮助": "bang zhu",
              "英语": "ying yu",
              "水": "shui",
              "咖啡": "ka fei",
              "结账": "jie zhang",
              "美味": "mei wei",
              "车站": "che zhan",
              "几点": "ji dian",
              "预订": "yu ding",
              "迷路": "mi lu",
              "多少": "duo shao",
              "票": "piao",
              "收": "shou",
              "卡": "ka",
              "朋友": "peng you",
              "明天": "ming tian",
              "早": "zao",
              "晚": "wan",
              "城市": "cheng shi",
              "公园": "gong yuan",
              "漂亮": "piao liang",
              "热闹": "re nao",
              "安静": "an jing",
              "手机": "shou ji",
              "医生": "yi sheng",
              "火车": "huo che",
              "问题": "wen ti"
            },
            phrases: {
              greetings: group(["conversation"], ["你好", "早上", "晚上", "回头"], [
                { en: "Hello", target: "你好", romanized: "ni hao" },
                { en: "Good morning", target: "早上 好", romanized: "zao shang hao" },
                { en: "Good evening", target: "晚上 好", romanized: "wan shang hao" },
                { en: "See you later", target: "回头 见", romanized: "hui tou jian" }
              ]),
              polite: group(["conversation"], ["谢谢", "请", "不好意思", "对不起"], [
                { en: "Thank you", target: "谢谢", romanized: "xie xie" },
                { en: "Please", target: "请", romanized: "qing" },
                { en: "Excuse me", target: "不好意思", romanized: "bu hao yi si" },
                { en: "Sorry", target: "对不起", romanized: "dui bu qi" }
              ]),
              directions: group(["direction"], ["湖", "哪里", "帮助", "英语"], [
                { en: "Where is the lake?", target: "湖 在 哪里", romanized: "hu zai na li" },
                { en: "I need help", target: "我 需要 帮助", romanized: "wo xu yao bang zhu" },
                { en: "Can you repeat?", target: "你 能 再说 一遍 吗", romanized: "ni neng zai shuo yi bian ma" },
                { en: "Do you speak English?", target: "你 会 说 英语 吗", romanized: "ni hui shuo ying yu ma" }
              ]),
              cafe: group(["conversation"], ["水", "咖啡", "结账", "美味"], [
                { en: "I would like water", target: "我 想要 水", romanized: "wo xiang yao shui" },
                { en: "Coffee, please", target: "请 给 我 咖啡", romanized: "qing gei wo ka fei" },
                { en: "Can I get the check?", target: "可以 结账 吗", romanized: "ke yi jie zhang ma" },
                { en: "This is delicious", target: "这 很 美味", romanized: "zhe hen mei wei" }
              ]),
              travel: group(["travel"], ["车站", "几点", "预订", "迷路"], [
                { en: "I am going to the station", target: "我 去 车站", romanized: "wo qu che zhan" },
                { en: "What time is it?", target: "现在 几点", romanized: "xian zai ji dian" },
                { en: "I have a reservation", target: "我 有 预订", romanized: "wo you yu ding" },
                { en: "I am lost", target: "我 迷路 了", romanized: "wo mi lu le" }
              ]),
              shopping: group(["shopping"], ["多少", "票", "收", "卡"], [
                { en: "How much is this?", target: "这个 多少 钱", romanized: "zhe ge duo shao qian" },
                { en: "I need a ticket", target: "我 需要 一张 票", romanized: "wo xu yao yi zhang piao" },
                { en: "Do you accept card?", target: "你们 收 卡 吗", romanized: "ni men shou ka ma" },
                { en: "Can I try this?", target: "我 可以 试试 吗", romanized: "wo ke yi shi shi ma" }
              ]),
              plans: group(["conversation"], ["朋友", "明天", "早", "晚"], [
                { en: "I am meeting a friend", target: "我 要 见 朋友", romanized: "wo yao jian peng you" },
                { en: "Let's go tomorrow", target: "我们 明天 去 吧", romanized: "wo men ming tian qu ba" },
                { en: "We are early", target: "我们 来 早 了", romanized: "wo men lai zao le" },
                { en: "We are late", target: "我们 来 晚 了", romanized: "wo men lai wan le" }
              ]),
              opinions: group(["conversation"], ["城市", "公园", "漂亮", "热闹", "安静"], [
                { en: "I like this city", target: "我 喜欢 这座 城市", romanized: "wo xi huan zhe zuo cheng shi" },
                { en: "The park is beautiful", target: "公园 很 漂亮", romanized: "gong yuan hen piao liang" },
                { en: "The street is busy", target: "这条 街 很 热闹", romanized: "zhe tiao jie hen re nao" },
                { en: "It's quiet here", target: "这里 很 安静", romanized: "zhe li hen an jing" }
              ]),
              problems: group(["problem"], ["手机", "医生", "火车", "问题"], [
                { en: "I lost my phone", target: "我 把 手机 弄丢了", romanized: "wo ba shou ji nong diu le" },
                { en: "I need a doctor", target: "我 需要 医生", romanized: "wo xu yao yi sheng" },
                { en: "The train is delayed", target: "火车 晚点 了", romanized: "huo che wan dian le" },
                { en: "I have a problem", target: "我 有 问题", romanized: "wo you wen ti" }
              ])
            }
          },
          japanese: {
            label: "Japanese",
            voice: "ja-JP",
            vocab: {
              "こんにちは": "hello",
              "おはよう": "good morning",
              "こんばんは": "good evening",
              "あとで": "later",
              "ありがとう": "thank you",
              "おねがいします": "please",
              "すみません": "excuse me",
              "ごめんなさい": "sorry",
              "湖": "lake",
              "どこ": "where",
              "助け": "help",
              "英語": "English",
              "水": "water",
              "コーヒー": "coffee",
              "お会計": "check/bill",
              "おいしい": "delicious",
              "駅": "station",
              "何時": "what time",
              "予約": "reservation",
              "迷いました": "lost",
              "いくら": "how much",
              "切符": "ticket",
              "カード": "card",
              "試着": "try on",
              "友達": "friend",
              "明日": "tomorrow",
              "早く": "early",
              "遅れました": "late",
              "街": "city",
              "公園": "park",
              "通り": "street",
              "静か": "quiet",
              "携帯": "phone",
              "医者": "doctor",
              "電車": "train",
              "問題": "problem"
            },
            phrases: {
              greetings: group(["conversation"], ["こんにちは", "おはよう", "こんばんは", "あとで"], [
                { en: "Hello", target: "こんにちは" },
                { en: "Good morning", target: "おはよう ございます" },
                { en: "Good evening", target: "こんばんは" },
                { en: "See you later", target: "また あとで" }
              ]),
              polite: group(["conversation"], ["ありがとう", "おねがいします", "すみません", "ごめんなさい"], [
                { en: "Thank you", target: "ありがとう ございます" },
                { en: "Please", target: "おねがいします" },
                { en: "Excuse me", target: "すみません" },
                { en: "Sorry", target: "ごめんなさい" }
              ]),
              directions: group(["direction"], ["湖", "どこ", "助け", "英語"], [
                { en: "Where is the lake?", target: "湖 は どこ ですか" },
                { en: "I need help", target: "助け が 必要 です" },
                { en: "Can you repeat?", target: "もう 一度 言って ください" },
                { en: "Do you speak English?", target: "英語 を 話せます か" }
              ]),
              cafe: group(["conversation"], ["水", "コーヒー", "お会計", "おいしい"], [
                { en: "I would like water", target: "水 を ください" },
                { en: "Coffee, please", target: "コーヒー を ください" },
                { en: "Can I get the check?", target: "お会計 を おねがいします" },
                { en: "This is delicious", target: "とても おいしい です" }
              ]),
              travel: group(["travel"], ["駅", "何時", "予約", "迷いました"], [
                { en: "I am going to the station", target: "駅 に 行きます" },
                { en: "What time is it?", target: "今 何時 ですか" },
                { en: "I have a reservation", target: "予約 が あります" },
                { en: "I am lost", target: "道 に 迷いました" }
              ]),
              shopping: group(["shopping"], ["いくら", "切符", "カード", "試着"], [
                { en: "How much is this?", target: "これは いくら ですか" },
                { en: "I need a ticket", target: "切符 が 必要 です" },
                { en: "Do you accept card?", target: "カード は 使えます か" },
                { en: "Can I try this?", target: "試着 しても いい ですか" }
              ]),
              plans: group(["conversation"], ["友達", "明日", "早く", "遅れました"], [
                { en: "I am meeting a friend", target: "友達 に 会います" },
                { en: "Let's go tomorrow", target: "明日 行きましょう" },
                { en: "We are early", target: "早く 着きました" },
                { en: "We are late", target: "遅れました" }
              ]),
              opinions: group(["conversation"], ["街", "公園", "通り", "静か"], [
                { en: "I like this city", target: "この 街 が 好き です" },
                { en: "The park is beautiful", target: "公園 が きれい です" },
                { en: "The street is busy", target: "通り は にぎやか です" },
                { en: "It's quiet here", target: "ここ は 静か です" }
              ]),
              problems: group(["problem"], ["携帯", "医者", "電車", "問題"], [
                { en: "I lost my phone", target: "携帯 を なくしました" },
                { en: "I need a doctor", target: "医者 が 必要 です" },
                { en: "The train is delayed", target: "電車 が 遅れています" },
                { en: "I have a problem", target: "問題 が あります" }
              ])
            }
          },
          korean: {
            label: "Korean",
            voice: "ko-KR",
            vocab: {
              "안녕하세요": "hello",
              "아침": "morning",
              "저녁": "evening",
              "나중에": "later",
              "감사합니다": "thank you",
              "부탁합니다": "please",
              "실례합니다": "excuse me",
              "미안합니다": "sorry",
              "호수": "lake",
              "어디에": "where",
              "도움": "help",
              "영어": "English",
              "물": "water",
              "커피": "coffee",
              "계산서": "check/bill",
              "맛있어요": "delicious",
              "역": "station",
              "지금": "now",
              "예약": "reservation",
              "길": "road/way",
              "얼마예요": "how much",
              "티켓": "ticket",
              "카드": "card",
              "입어": "try on",
              "친구": "friend",
              "내일": "tomorrow",
              "일찍": "early",
              "늦었어요": "late",
              "도시": "city",
              "공원": "park",
              "거리": "street",
              "조용해요": "quiet",
              "휴대폰": "phone",
              "의사": "doctor",
              "기차": "train",
              "문제": "problem"
            },
            phrases: {
              greetings: group(["conversation"], ["안녕하세요", "아침", "저녁", "나중에"], [
                { en: "Hello", target: "안녕하세요" },
                { en: "Good morning", target: "좋은 아침" },
                { en: "Good evening", target: "좋은 저녁" },
                { en: "See you later", target: "나중에 봐요" }
              ]),
              polite: group(["conversation"], ["감사합니다", "부탁합니다", "실례합니다", "미안합니다"], [
                { en: "Thank you", target: "감사합니다" },
                { en: "Please", target: "부탁합니다" },
                { en: "Excuse me", target: "실례합니다" },
                { en: "Sorry", target: "미안합니다" }
              ]),
              directions: group(["direction"], ["호수", "어디에", "도움", "영어"], [
                { en: "Where is the lake?", target: "호수 는 어디에 있나요" },
                { en: "I need help", target: "도움이 필요해요" },
                { en: "Can you repeat?", target: "다시 말해 주세요" },
                { en: "Do you speak English?", target: "영어 를 할 수 있나요" }
              ]),
              cafe: group(["conversation"], ["물", "커피", "계산서", "맛있어요"], [
                { en: "I would like water", target: "물 주세요" },
                { en: "Coffee, please", target: "커피 주세요" },
                { en: "Can I get the check?", target: "계산서 주세요" },
                { en: "This is delicious", target: "맛있어요" }
              ]),
              travel: group(["travel"], ["역", "지금", "예약", "길"], [
                { en: "I am going to the station", target: "역 에 가요" },
                { en: "What time is it?", target: "지금 몇 시예요" },
                { en: "I have a reservation", target: "예약이 있어요" },
                { en: "I am lost", target: "길을 잃었어요" }
              ]),
              shopping: group(["shopping"], ["얼마예요", "티켓", "카드", "입어"], [
                { en: "How much is this?", target: "이거 얼마예요" },
                { en: "I need a ticket", target: "티켓이 필요해요" },
                { en: "Do you accept card?", target: "카드 받나요" },
                { en: "Can I try this?", target: "입어 봐도 돼요" }
              ]),
              plans: group(["conversation"], ["친구", "내일", "일찍", "늦었어요"], [
                { en: "I am meeting a friend", target: "친구 를 만나요" },
                { en: "Let's go tomorrow", target: "내일 가요" },
                { en: "We are early", target: "우리가 일찍 왔어요" },
                { en: "We are late", target: "우리가 늦었어요" }
              ]),
              opinions: group(["conversation"], ["도시", "공원", "거리", "조용해요"], [
                { en: "I like this city", target: "이 도시가 좋아요" },
                { en: "The park is beautiful", target: "공원이 아름다워요" },
                { en: "The street is busy", target: "거리가 붐벼요" },
                { en: "It's quiet here", target: "여기는 조용해요" }
              ]),
              problems: group(["problem"], ["휴대폰", "의사", "기차", "문제"], [
                { en: "I lost my phone", target: "휴대폰을 잃어버렸어요" },
                { en: "I need a doctor", target: "의사가 필요해요" },
                { en: "The train is delayed", target: "기차가 지연됐어요" },
                { en: "I have a problem", target: "문제가 있어요" }
              ])
            }
          },
          italian: {
            label: "Italian",
            voice: "it-IT",
            vocab: {
              ciao: "hello",
              buongiorno: "good morning",
              buonasera: "good evening",
              dopo: "later",
              grazie: "thank you",
              favore: "please",
              scusi: "excuse me",
              dispiace: "sorry",
              dove: "where",
              lago: "lake",
              aiuto: "help",
              inglese: "English",
              acqua: "water",
              caffe: "coffee",
              conto: "check/bill",
              delizioso: "delicious",
              stazione: "station",
              ore: "time",
              prenotazione: "reservation",
              perso: "lost",
              quanto: "how much",
              costa: "costs",
              biglietto: "ticket",
              carta: "card",
              provarlo: "try on",
              amico: "friend",
              domani: "tomorrow",
              anticipo: "early",
              ritardo: "late",
              citta: "city",
              parco: "park",
              bello: "beautiful",
              strada: "street",
              tranquillo: "quiet",
              telefono: "phone",
              medico: "doctor",
              treno: "train",
              problema: "problem"
            },
            phrases: {
              greetings: group(["conversation"], ["ciao", "buongiorno", "buonasera", "dopo"], [
                { en: "Hello", target: "Ciao" },
                { en: "Good morning", target: "Buongiorno" },
                { en: "Good evening", target: "Buonasera" },
                { en: "See you later", target: "A dopo" }
              ]),
              polite: group(["conversation"], ["grazie", "favore", "scusi", "dispiace"], [
                { en: "Thank you", target: "Grazie" },
                { en: "Please", target: "Per favore" },
                { en: "Excuse me", target: "Mi scusi" },
                { en: "Sorry", target: "Mi dispiace" }
              ]),
              directions: group(["direction"], ["dove", "lago", "aiuto", "inglese"], [
                { en: "Where is the lake?", target: "Dov'è il lago?" },
                { en: "I need help", target: "Ho bisogno di aiuto" },
                { en: "Can you repeat?", target: "Puoi ripetere?" },
                { en: "Do you speak English?", target: "Parli inglese?" }
              ]),
              cafe: group(["conversation"], ["acqua", "caffe", "conto", "delizioso"], [
                { en: "I would like water", target: "Vorrei acqua" },
                { en: "Coffee, please", target: "Un caffè, per favore" },
                { en: "Can I get the check?", target: "Il conto, per favore" },
                { en: "This is delicious", target: "È delizioso" }
              ]),
              travel: group(["travel"], ["stazione", "ore", "prenotazione", "perso"], [
                { en: "I am going to the station", target: "Vado alla stazione" },
                { en: "What time is it?", target: "Che ore sono?" },
                { en: "I have a reservation", target: "Ho una prenotazione" },
                { en: "I am lost", target: "Mi sono perso" }
              ]),
              shopping: group(["shopping"], ["quanto", "costa", "biglietto", "carta", "provarlo"], [
                { en: "How much is this?", target: "Quanto costa questo?" },
                { en: "I need a ticket", target: "Ho bisogno di un biglietto" },
                { en: "Do you accept card?", target: "Accettate la carta?" },
                { en: "Can I try this?", target: "Posso provarlo?" }
              ]),
              plans: group(["conversation"], ["amico", "domani", "anticipo", "ritardo"], [
                { en: "I am meeting a friend", target: "Incontro un amico" },
                { en: "Let's go tomorrow", target: "Andiamo domani" },
                { en: "We are early", target: "Siamo in anticipo" },
                { en: "We are late", target: "Siamo in ritardo" }
              ]),
              opinions: group(["conversation"], ["citta", "parco", "bello", "strada", "tranquillo"], [
                { en: "I like this city", target: "Mi piace questa città" },
                { en: "The park is beautiful", target: "Il parco è bello" },
                { en: "The street is busy", target: "La strada è affollata" },
                { en: "It's quiet here", target: "Qui è tranquillo" }
              ]),
              problems: group(["problem"], ["telefono", "medico", "treno", "problema"], [
                { en: "I lost my phone", target: "Ho perso il telefono" },
                { en: "I need a doctor", target: "Ho bisogno di un medico" },
                { en: "The train is delayed", target: "Il treno è in ritardo" },
                { en: "I have a problem", target: "Ho un problema" }
              ])
            }
          },
          portuguese: {
            label: "Portuguese (BR)",
            voice: "pt-BR",
            vocab: {
              ola: "hello",
              bom: "good",
              dia: "day",
              noite: "night/evening",
              ate: "until",
              mais: "later",
              obrigado: "thank you",
              favor: "please",
              licenca: "excuse me",
              desculpe: "sorry",
              onde: "where",
              lago: "lake",
              ajuda: "help",
              ingles: "English",
              agua: "water",
              cafe: "coffee",
              conta: "check/bill",
              delicioso: "delicious",
              estacao: "station",
              horas: "time",
              reserva: "reservation",
              perdido: "lost",
              quanto: "how much",
              custa: "costs",
              bilhete: "ticket",
              cartao: "card",
              experimentar: "try",
              amigo: "friend",
              amanha: "tomorrow",
              cedo: "early",
              tarde: "late",
              cidade: "city",
              parque: "park",
              bonito: "beautiful",
              rua: "street",
              tranquilo: "quiet",
              telefone: "phone",
              medico: "doctor",
              trem: "train",
              problema: "problem"
            },
            phrases: {
              greetings: group(["conversation"], ["ola", "bom", "dia", "noite", "mais"], [
                { en: "Hello", target: "Olá" },
                { en: "Good morning", target: "Bom dia" },
                { en: "Good evening", target: "Boa noite" },
                { en: "See you later", target: "Até mais" }
              ]),
              polite: group(["conversation"], ["obrigado", "favor", "licenca", "desculpe"], [
                { en: "Thank you", target: "Obrigado" },
                { en: "Please", target: "Por favor" },
                { en: "Excuse me", target: "Com licença" },
                { en: "Sorry", target: "Desculpe" }
              ]),
              directions: group(["direction"], ["onde", "lago", "ajuda", "ingles"], [
                { en: "Where is the lake?", target: "Onde fica o lago?" },
                { en: "I need help", target: "Preciso de ajuda" },
                { en: "Can you repeat?", target: "Pode repetir?" },
                { en: "Do you speak English?", target: "Você fala inglês?" }
              ]),
              cafe: group(["conversation"], ["agua", "cafe", "conta", "delicioso"], [
                { en: "I would like water", target: "Eu gostaria de água" },
                { en: "Coffee, please", target: "Um café, por favor" },
                { en: "Can I get the check?", target: "A conta, por favor" },
                { en: "This is delicious", target: "Está delicioso" }
              ]),
              travel: group(["travel"], ["estacao", "horas", "reserva", "perdido"], [
                { en: "I am going to the station", target: "Vou para a estação" },
                { en: "What time is it?", target: "Que horas são?" },
                { en: "I have a reservation", target: "Tenho uma reserva" },
                { en: "I am lost", target: "Estou perdido" }
              ]),
              shopping: group(["shopping"], ["quanto", "custa", "bilhete", "cartao", "experimentar"], [
                { en: "How much is this?", target: "Quanto custa isso?" },
                { en: "I need a ticket", target: "Preciso de um bilhete" },
                { en: "Do you accept card?", target: "Aceitam cartão?" },
                { en: "Can I try this?", target: "Posso experimentar isso?" }
              ]),
              plans: group(["conversation"], ["amigo", "amanha", "cedo", "tarde"], [
                { en: "I am meeting a friend", target: "Vou encontrar um amigo" },
                { en: "Let's go tomorrow", target: "Vamos amanhã" },
                { en: "We are early", target: "Chegamos cedo" },
                { en: "We are late", target: "Chegamos tarde" }
              ]),
              opinions: group(["conversation"], ["cidade", "parque", "bonito", "rua", "tranquilo"], [
                { en: "I like this city", target: "Eu gosto desta cidade" },
                { en: "The park is beautiful", target: "O parque é bonito" },
                { en: "The street is busy", target: "A rua é movimentada" },
                { en: "It's quiet here", target: "Aqui é tranquilo" }
              ]),
              problems: group(["problem"], ["telefone", "medico", "trem", "problema"], [
                { en: "I lost my phone", target: "Perdi meu telefone" },
                { en: "I need a doctor", target: "Preciso de um médico" },
                { en: "The train is delayed", target: "O trem está atrasado" },
                { en: "I have a problem", target: "Tenho um problema" }
              ])
            }
          }
        }
      }
    };

    const LANGUAGE_META = {
      spanish: {
        flag: "🇪🇸",
        caption: "Spanish is widely spoken in Spain, Mexico, and Colombia.",
        highlight: "#f36f6f"
      },
      french: {
        flag: "🇫🇷",
        caption: "French is primarily spoken in France, Canada, and Belgium.",
        highlight: "#ffd166"
      },
      german: {
        flag: "🇩🇪",
        caption: "German is primarily spoken in Germany, Austria, and Switzerland.",
        highlight: "#6ba6f0"
      },
      mandarin: {
        flag: "🇨🇳",
        caption: "Mandarin is primarily spoken in China, Taiwan, and Singapore.",
        highlight: "#7bcf9d"
      }
    };

    const state = {
      profileId: "Explorer",
      packKey: "city_starter",
      languageKey: "spanish",
      difficulty: "beginner",
      levelIndex: 0,
      voiceName: "",
      speechRate: 1,
      focusMode: "all",
      tasks: [],
      index: 0,
      hearts: 3,
      xp: 0,
      correctCount: 0,
      audioEnabled: true,
      selectedOption: null,
      buildAnswer: [],
      matchPairs: [],
      activeMatch: null,
      speechText: "",
      lastSaved: null,
      scriptMode: "both",
      autoVoiceByLevel: true,
      currentView: "viewWelcome",
      pendingAdvance: false,
      activeVoiceName: "",
      wordStats: {},
      currentAudio: "",
      sessionXp: 0
    };

    const viewWelcome = document.getElementById("viewWelcome");
    const viewLanguage = document.getElementById("viewLanguage");
    const viewLevels = document.getElementById("viewLevels");
    const viewLesson = document.getElementById("viewLesson");
    const backBtn = document.getElementById("backBtn");
    const settingsBtn = document.getElementById("settingsBtn");
    const settingsModal = document.getElementById("settingsModal");
    const closeSettings = document.getElementById("closeSettings");
    const loginName = document.getElementById("loginName");
    const loginBtn = document.getElementById("loginBtn");
    const guestBtn = document.getElementById("guestBtn");
    const languageGrid = document.getElementById("languageGrid");
    const levelsGrid = document.getElementById("levelsGrid");
    const levelsTitle = document.getElementById("levelsTitle");
    const levelsSubtitle = document.getElementById("levelsSubtitle");
    const levelsLanguage = document.getElementById("levelsLanguage");
    const levelsXp = document.getElementById("levelsXp");
    const levelsHearts = document.getElementById("levelsHearts");
    const streakStat = document.getElementById("streakStat");
    const progressFill = document.getElementById("progressFill");
    const progressText = document.getElementById("progressText");
    const promptTitle = document.getElementById("promptTitle");
    const promptText = document.getElementById("promptText");
    const choiceGrid = document.getElementById("choiceGrid");
    const inputArea = document.getElementById("inputArea");
    const textInput = document.getElementById("textInput");
    const checkBtn = document.getElementById("checkBtn");
    const skipBtn = document.getElementById("skipBtn");
    const feedback = document.getElementById("feedback");
    const audioToggle = document.getElementById("audioToggle");
    const heartPanel = document.getElementById("heartPanel");
    const xpPanel = document.getElementById("xpPanel");
    const languageSelect = document.getElementById("languageSelect");
    const speakerSelect = document.getElementById("speakerSelect");
    const saveStatus = document.getElementById("saveStatus");
    const resetBtn = document.getElementById("resetBtn");
    const unitChip = document.getElementById("unitChip");
    const topicChip = document.getElementById("topicChip");
    const languageChip = document.getElementById("languageChip");
    const profileSelect = document.getElementById("profileSelect");
    const packSelect = document.getElementById("packSelect");
    const buildArea = document.getElementById("buildArea");
    const buildBank = document.getElementById("buildBank");
    const buildAnswer = document.getElementById("buildAnswer");
    const matchArea = document.getElementById("matchArea");
    const matchLeft = document.getElementById("matchLeft");
    const matchRight = document.getElementById("matchRight");
    const speakArea = document.getElementById("speakArea");
    const recordBtn = document.getElementById("recordBtn");
    const speakStatus = document.getElementById("speakStatus");
    const speakTranscript = document.getElementById("speakTranscript");
    const wordTitle = document.getElementById("wordTitle");
    const wordDefinition = document.getElementById("wordDefinition");
    const replayBtn = document.getElementById("replayBtn");
    const languageSelectLayout = document.getElementById("languageSelectLayout");
    const globeCaption = document.getElementById("globeCaption");
    const globeShell = document.getElementById("globeShell");
    const globeMarkers = [...document.querySelectorAll(".globe-marker")];
    const speedRange = document.getElementById("speedRange");
    const speedValue = document.getElementById("speedValue");
    const scriptModeSelect = document.getElementById("scriptModeSelect");
    const focusSelect = document.getElementById("focusSelect");
    const views = [viewWelcome, viewLanguage, viewLevels, viewLesson].filter(Boolean);
    let languageNavTimer = null;

    const getTodayStr = () => new Date().toDateString();

    const loadStreak = () => {
      try { return JSON.parse(localStorage.getItem(STREAK_KEY) || '{}'); } catch (_e) { return {}; }
    };

    const getStreakCount = () => {
      const s = loadStreak();
      const today = getTodayStr();
      const yesterday = new Date(Date.now() - 86400000).toDateString();
      if (s.lastDate === today || s.lastDate === yesterday) return s.count || 0;
      return 0;
    };

    const recordStreakDay = () => {
      const s = loadStreak();
      const today = getTodayStr();
      if (s.lastDate === today) return;
      const yesterday = new Date(Date.now() - 86400000).toDateString();
      const newCount = s.lastDate === yesterday ? (s.count || 0) + 1 : 1;
      localStorage.setItem(STREAK_KEY, JSON.stringify({ lastDate: today, count: newCount }));
    };

    const getCompletedLevels = () => {
      try {
        const arr = JSON.parse(localStorage.getItem(COMPLETED_KEY) || '[]');
        return new Set(arr);
      } catch (_e) { return new Set(); }
    };

    const saveCompletedLevels = (set) => {
      localStorage.setItem(COMPLETED_KEY, JSON.stringify([...set]));
    };

    const normalize = (text) => {
      return text
        .toLowerCase()
        .replace(/ß/g, "ss")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[¿?¡!.,;:。！？、]/g, "")
        .replace(/['’]/g, "")
        .trim();
    };

    const normalizeAnswer = (text) => normalize(text).replace(/\s+/g, "");

    const getRomanization = (text) => {
      const lesson = getLesson();
      if (!lesson.romanizationMap) return "";
      const direct = lesson.romanizationMap.get(text) || lesson.romanizationMap.get(text.trim());
      if (direct) return direct;
      return lesson.wordRomanizationMap?.get(text) || lesson.wordRomanizationMap?.get(text.trim()) || "";
    };

    const getRomanizationForText = (text) => {
      if (!text) return "";
      const direct = getRomanization(text);
      if (direct) return direct;
      const lesson = getLesson();
      if (!lesson.romanizationMap?.size && !lesson.wordRomanizationMap?.size) return "";
      const tokens = text.split(/\s+/).filter(Boolean);
      if (!tokens.length) return "";
      const mapped = tokens
        .map((token) => lesson.romanizationMap?.get(token) || lesson.wordRomanizationMap?.get(token) || "")
        .filter(Boolean);
      return mapped.length ? mapped.join(" ") : "";
    };

    const resolveWordRomanization = (word, task) => {
      const lesson = getLesson();
      return (
        task?.wordRomanization?.[word] ||
        lesson.wordRomanizationMap?.get(word) ||
        getRomanization(word) ||
        getRomanizationForText(word)
      );
    };

    const escapeHTML = (value) => {
      return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
    };

    const renderTextWithDefinitions = (text, options = {}) => {
      const lesson = getLesson();
      const vocab = lesson.vocab || {};
      const newWords = getNewWordSet();
      const showRomanization = options.romanize !== false && lesson.romanizationMap?.size;
      const romanized = options.forceRomanized || (showRomanization ? getRomanization(text) : "");
      const showNative = state.scriptMode !== "romanized";
      const decorated = showNative
        ? text.replace(/[\p{L}]+(?:['’][\p{L}]+)*/gu, (token) => {
          const key = normalize(token);
          const definition = vocab[key];
          if (!definition) return token;
          const isNew = newWords.has(key);
          const classes = ["word-chip"];
          if (isNew) classes.push("new-word");
          return `<span class="${classes.join(" ")}" data-word="${token}" data-definition="${definition}">${token}</span>`;
        })
        : "";
      const shouldShowRomanized = romanized && state.scriptMode !== "hanzi";
      if (!decorated && shouldShowRomanized) {
        return `<span class="romanization-line">${romanized}</span>`;
      }
      if (!shouldShowRomanized) return decorated || text;
      return `${decorated}<span class="romanization-line">${romanized}</span>`;
    };

    const attachWordListeners = (container) => {
      if (!container) return;
      container.querySelectorAll(".word-chip").forEach((chip) => {
        chip.addEventListener("click", () => {
          const word = chip.dataset.word || chip.textContent;
          const definition = chip.dataset.definition || "Definition not available yet.";
          const lesson = getLesson();
          const romanized = lesson.romanizationMap?.get(word) || lesson.romanizationMap?.get(word.trim()) || "";
          if (wordTitle) wordTitle.textContent = word;
          if (wordDefinition) {
            wordDefinition.textContent = romanized ? `${definition} · ${romanized}` : definition;
          }
          speak(word, true);
        });
      });
    };

    const splitTokens = (text) => {
      return text
        .replace(/[¿?¡!.,;:。！？、]/g, " ")
        .split(/\s+/)
        .map((token) => normalize(token))
        .filter(Boolean);
    };

    const recordWordStats = (text, correct) => {
      if (!text) return;
      const tokens = splitTokens(text);
      if (!tokens.length) return;
      tokens.forEach((token) => {
        const stats = state.wordStats[token] || { correct: 0, incorrect: 0 };
        if (correct) stats.correct += 1;
        else stats.incorrect += 1;
        state.wordStats[token] = stats;
      });
    };

    const scoreItem = (item) => {
      const tokens = splitTokens(item.target || "");
      if (!tokens.length) return 1;
      return tokens.reduce((total, token) => {
        const stats = state.wordStats[token];
        if (!stats) return total + 1;
        const weight = (stats.incorrect + 1) / (stats.correct + 1);
        return total + 1 + weight;
      }, 0);
    };

    const weightedSample = (items, count) => {
      const pool = items.map((item) => ({
        item,
        weight: Math.max(0.2, scoreItem(item))
      }));
      const result = [];
      while (pool.length && result.length < count) {
        const total = pool.reduce((sum, entry) => sum + entry.weight, 0);
        let roll = Math.random() * total;
        const index = pool.findIndex((entry) => {
          roll -= entry.weight;
          return roll <= 0;
        });
        const chosen = pool.splice(Math.max(0, index), 1)[0];
        result.push(chosen.item);
      }
      return result;
    };

    const uniqueItems = (items) => {
      const seen = new Set();
      return items.filter((item) => {
        const key = `${item.en}|${item.target}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
    };

    const getAllLessonItems = () => {
      const lesson = getLesson();
      const levels = lesson.levels || buildLevels(lesson);
      const items = [];
      DIFFICULTY_ORDER.forEach((difficulty) => {
        (levels[difficulty] || []).forEach((module) => {
          (module.items || []).forEach((item) => items.push(item));
        });
      });
      return uniqueItems(items);
    };

    const pickOptions = (correctValue, pool, key, minCount = 4, fallback = []) => {
      const options = [correctValue];
      const candidates = shuffle(pool.map((item) => item[key]).filter(Boolean));
      candidates.forEach((candidate) => {
        if (options.length >= minCount) return;
        if (candidate !== correctValue && !options.includes(candidate)) {
          options.push(candidate);
        }
      });
      if (options.length < minCount && fallback.length) {
        shuffle([...fallback]).forEach((candidate) => {
          if (options.length >= minCount) return;
          if (candidate !== correctValue && !options.includes(candidate)) {
            options.push(candidate);
          }
        });
      }
      return shuffle(options);
    };

    const mapRomanizedTokens = (targetTokens, romanizedText) => {
      const romanizedTokens = (romanizedText || "").split(/\s+/).filter(Boolean);
      const mapping = {};
      if (!targetTokens.length || !romanizedTokens.length) return mapping;
      if (romanizedTokens.length === targetTokens.length) {
        targetTokens.forEach((token, idx) => {
          mapping[token] = romanizedTokens[idx];
        });
        return mapping;
      }
      let cursor = 0;
      targetTokens.forEach((token, idx) => {
        const remainingTargets = targetTokens.length - idx;
        const remainingRoman = romanizedTokens.length - cursor;
        if (remainingRoman <= 0) return;
        const charCount = Array.from(token).length || 1;
        const maxTake = Math.max(1, remainingRoman - (remainingTargets - 1));
        const take = Math.min(Math.max(1, charCount), maxTake);
        mapping[token] = romanizedTokens.slice(cursor, cursor + take).join(" ");
        cursor += take;
      });
      return mapping;
    };

    const shuffle = (arr) => {
      const copy = [...arr];
      for (let i = copy.length - 1; i > 0; i -= 1) {
        const j = Math.floor(Math.random() * (i + 1));
        [copy[i], copy[j]] = [copy[j], copy[i]];
      }
      return copy;
    };

    const buildTasks = () => {
      const lesson = getLesson();
      const module = getModule();
      const items = module.items || [];
      const allItems = getAllLessonItems();
      const sourceItems = uniqueItems(items.length ? items : allItems);
      const itemCount = Math.min(sourceItems.length, 4 + Math.floor(Math.random() * 3));
      const selectedItems = weightedSample(sourceItems, Math.max(3, itemCount));
      const optionPool = allItems.length ? allItems : sourceItems;
      const englishFallback = Object.values(lesson.vocab || {});
      const lessonWordMap = lesson.wordRomanizationMap || new Map();
      const tasks = [];
      selectedItems.forEach((item) => {
        const targetOptions = pickOptions(item.target, optionPool, "target", 4);
        const englishOptions = pickOptions(item.en, optionPool, "en", 4, englishFallback);
        const audio = item.audio || item.target;
        const targetTokens = item.target
          .replace(/[¿?¡!.,;:。！？、]/g, "")
          .split(/\s+/)
          .filter(Boolean);
        const wordRomanization = mapRomanizedTokens(targetTokens, item.romanized);
        targetTokens.forEach((token) => {
          if (!wordRomanization[token]) {
            const mapped = lessonWordMap.get(token) || getRomanization(token);
            if (mapped) wordRomanization[token] = mapped;
          }
        });
        const extraTokens = shuffle(
          optionPool.flatMap((entry) =>
            (entry.target || "").replace(/[¿?¡!.,;:。！？、]/g, "").split(/\s+/).filter(Boolean)
          )
        ).filter((token) => token && !targetTokens.includes(token));
        const filteredExtras = extraTokens.filter((token) => {
          return wordRomanization[token] || lessonWordMap.get(token) || getRomanization(token);
        });
        const buildWords = shuffle([...targetTokens, ...filteredExtras.slice(0, 2)]);
        filteredExtras.forEach((token) => {
          if (!wordRomanization[token]) {
            const mapped = lessonWordMap.get(token) || getRomanization(token);
            if (mapped) wordRomanization[token] = mapped;
          }
        });
        const taskTypes = shuffle(["choice", "typing", "build", "speak"]).slice(0, 3 + Math.floor(Math.random() * 2));
        taskTypes.forEach((type) => {
          if (type === "choice") {
            tasks.push({
              type,
              prompt: item.target,
              answer: item.en,
              options: englishOptions,
              audio,
              native: item.target,
              english: item.en,
              romanized: item.romanized,
              tags: item.tags
            });
          } else if (type === "typing") {
            tasks.push({
              type,
              prompt: item.en,
              answer: item.target,
              audio,
              native: item.target,
              english: item.en,
              romanized: item.romanized,
              tags: item.tags
            });
          } else if (type === "build") {
            tasks.push({
              type,
              prompt: item.en,
              answer: item.target,
              words: buildWords.length ? buildWords : targetTokens,
              audio,
              native: item.target,
              english: item.en,
              romanized: item.romanized,
              wordRomanization,
              tags: item.tags
            });
          } else if (type === "speak") {
            tasks.push({
              type,
              prompt: item.en,
              answer: item.target,
              audio,
              native: item.target,
              english: item.en,
              romanized: item.romanized,
              tags: item.tags
            });
          }
        });
      });
      const vocabPairs = (module.newWords || [])
        .filter(Boolean)
        .map((word) => {
          const key = normalize(word);
          return { word, definition: lesson.vocab[key] ?? "new word" };
        });
      if (vocabPairs.length >= 3) {
        const promptItem = selectedItems[0] || items[0];
        const matchPrompt = promptItem?.en || promptItem?.target || "Match the words";
        tasks.push({
          type: "match",
          prompt: matchPrompt,
          pairs: shuffle(vocabPairs).slice(0, 6),
          audio: promptItem?.target || vocabPairs[0]?.word || "",
          native: promptItem?.target || vocabPairs[0]?.word || "",
          english: promptItem?.en || "",
          romanized: promptItem?.romanized,
          tags: promptItem?.tags
        });
      }
      const filtered = tasks.filter((task) => {
        if (state.focusMode === "spoken") return ["listen", "speak"].includes(task.type);
        if (state.focusMode === "conversations") return task.tags?.includes("conversation");
        if (state.focusMode === "new-words") {
          if (!task.answer) return false;
          const words = normalize(task.answer).split(" ");
          return words.some((w) => normalize(w) && getModule().newWords.map(normalize).includes(w));
        }
        if (state.focusMode === "review") {
          if (!task.answer) return true;
          const words = normalize(task.answer).split(" ");
          return !words.some((w) => getModule().newWords.map(normalize).includes(w));
        }
        return true;
      });
      return shuffle(filtered).slice(0, 18);
    };

    const getPack = () => PACKS[state.packKey] ?? PACKS.city_starter;
    const getLesson = () => {
      const pack = getPack();
      const lesson = pack.languages[state.languageKey] ?? pack.languages.spanish;
      if (!lesson.levels) {
        lesson.levels = buildLevels(lesson);
      }
      if (!lesson.romanizationMap) {
        const map = new Map();
        if (lesson.romanization) {
          Object.entries(lesson.romanization).forEach(([key, value]) => {
            map.set(key, value);
          });
        }
        if (lesson.phrases) {
          Object.values(lesson.phrases).forEach((group) => {
            (group.items || []).forEach((item) => {
              if (item.romanized) map.set(item.target, item.romanized);
            });
          });
        }
        lesson.romanizationMap = map;
      }
      if (!lesson.wordRomanizationMap) {
        const wordMap = new Map();
        if (lesson.romanizationMap) {
          lesson.romanizationMap.forEach((value, key) => {
            if (!/\s/.test(key)) {
              wordMap.set(key, value);
            }
          });
        }
        if (lesson.phrases) {
          Object.values(lesson.phrases).forEach((group) => {
            (group.items || []).forEach((item) => {
              if (!item.romanized || !item.target) return;
              const targetTokens = item.target.split(/\s+/).filter(Boolean);
              const mapping = mapRomanizedTokens(targetTokens, item.romanized);
              Object.entries(mapping).forEach(([token, romanized]) => {
                if (romanized && !wordMap.has(token)) {
                  wordMap.set(token, romanized);
                }
              });
            });
          });
        }
        lesson.wordRomanizationMap = wordMap;
      }
      return lesson;
    };

    const getModule = () => {
      const lesson = getLesson();
      return lesson.levels?.[state.difficulty]?.[state.levelIndex]
        ?? lesson.levels?.beginner?.[0];
    };

    const getModuleIndex = () => {
      const diffIndex = Math.max(0, DIFFICULTY_ORDER.indexOf(state.difficulty));
      return diffIndex * LEVELS_PER_DIFFICULTY + state.levelIndex;
    };

    const buildLevels = (lesson) => {
      const curriculum = getPack().curriculum || CURRICULUM;
      const levels = {};
      DIFFICULTY_ORDER.forEach((difficulty) => {
        const modules = (curriculum[difficulty] || []).map((step, idx) => {
          const groupData = lesson.phrases?.[step.group] || { items: [], newWords: [], tags: [] };
          const items = (groupData.items || []).map((item) => ({
            ...item,
            tags: item.tags ?? groupData.tags ?? []
          }));
          return {
            id: step.id || `${difficulty}-${idx}`,
            title: step.title,
            description: step.description,
            newWords: groupData.newWords || [],
            items
          };
        });
        levels[difficulty] = modules;
      });
      return levels;
    };

    const updateSaveStatus = () => {
      if (!saveStatus) return;
      if (!state.lastSaved) {
        saveStatus.textContent = "Not saved yet";
        return;
      }
      const stamp = new Date(state.lastSaved);
      const time = stamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      saveStatus.textContent = `Saved ${time}`;
    };

    const loadStorage = () => {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return { activeProfile: "Explorer", profiles: { Explorer: {} } };
      try {
        const data = JSON.parse(raw);
        if (!data.profiles) data.profiles = { Explorer: {} };
        if (!data.activeProfile) data.activeProfile = "Explorer";
        return data;
      } catch (err) {
        console.warn("Storage parse failed", err);
        return { activeProfile: "Explorer", profiles: { Explorer: {} } };
      }
    };

    const saveProgress = () => {
      const data = loadStorage();
      if (!data.profiles[state.profileId]) data.profiles[state.profileId] = {};
      const tasksSnapshot = state.tasks.map((task) => {
        const copy = { ...task };
        if (copy._matches) delete copy._matches;
        return copy;
      });
      const payload = {
        packKey: state.packKey,
        languageKey: state.languageKey,
        difficulty: state.difficulty,
        levelIndex: state.levelIndex,
        moduleIndex: getModuleIndex(),
        voiceName: state.voiceName,
        speechRate: state.speechRate,
        focusMode: state.focusMode,
        scriptMode: state.scriptMode,
        autoVoiceByLevel: state.autoVoiceByLevel,
        tasks: tasksSnapshot,
        index: state.index,
        hearts: state.hearts,
        xp: state.xp,
        correctCount: state.correctCount,
        audioEnabled: state.audioEnabled,
        wordStats: state.wordStats,
        lastSaved: Date.now()
      };
      data.activeProfile = state.profileId;
      data.profiles[state.profileId] = payload;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      state.lastSaved = payload.lastSaved;
      updateSaveStatus();
    };

    const applySavedState = (saved = {}) => {
      state.packKey = PACKS[saved.packKey] ? saved.packKey : "city_starter";
      const pack = PACKS[state.packKey];
      const fallbackLanguage = Object.keys(pack.languages)[0];
      state.languageKey = pack.languages[saved.languageKey] ? saved.languageKey : fallbackLanguage;
      const fallbackIndex = Number.isFinite(saved.moduleIndex) ? saved.moduleIndex : 0;
      const computedDifficulty = DIFFICULTY_ORDER[Math.floor(fallbackIndex / LEVELS_PER_DIFFICULTY)] || "beginner";
      const computedLevel = fallbackIndex % LEVELS_PER_DIFFICULTY;
      state.difficulty = DIFFICULTY_ORDER.includes(saved.difficulty) ? saved.difficulty : computedDifficulty;
      state.levelIndex = Number.isFinite(saved.levelIndex) ? saved.levelIndex : computedLevel;
      const lesson = getLesson();
      const maxLevel = Math.max(0, (lesson.levels?.[state.difficulty]?.length || LEVELS_PER_DIFFICULTY) - 1);
      state.levelIndex = Math.min(Math.max(0, state.levelIndex), maxLevel);
      state.voiceName = saved.voiceName || "";
      state.speechRate = saved.speechRate ?? 1;
      state.focusMode = saved.focusMode || "all";
      state.scriptMode = saved.scriptMode || "both";
      state.autoVoiceByLevel = saved.autoVoiceByLevel ?? true;
      state.tasks = Array.isArray(saved.tasks) && saved.tasks.length
        ? saved.tasks
        : buildTasks();
      state.index = Math.min(saved.index ?? 0, state.tasks.length - 1);
      state.hearts = saved.hearts ?? 3;
      state.xp = saved.xp ?? 0;
      state.correctCount = saved.correctCount ?? 0;
      state.audioEnabled = saved.audioEnabled ?? true;
      state.wordStats = saved.wordStats || {};
      state.lastSaved = saved.lastSaved ?? null;
    };

    const loadProgress = () => {
      try {
        const data = loadStorage();
        const profileId = data.activeProfile || "Explorer";
        state.profileId = profileId;
        const saved = data.profiles[profileId] || {};
        applySavedState(saved);
        updateSaveStatus();
        return true;
      } catch (err) {
        console.warn("Progress load failed", err);
        return false;
      }
    };

    const populatePackOptions = () => {
      if (!packSelect) return;
      packSelect.innerHTML = "";
      Object.entries(PACKS).forEach(([key, pack]) => {
        const option = document.createElement("option");
        option.value = key;
        option.textContent = pack.label;
        packSelect.appendChild(option);
      });
      packSelect.value = state.packKey;
    };

    const populateLanguageOptions = () => {
      if (!languageSelect) return;
      languageSelect.innerHTML = "";
      const pack = getPack();
      Object.entries(pack.languages).forEach(([key, lesson]) => {
        const option = document.createElement("option");
        option.value = key;
        option.textContent = lesson.label;
        languageSelect.appendChild(option);
      });
      languageSelect.value = state.languageKey;
    };

    const populateSpeakerOptions = () => {
      if (!speakerSelect) return;
      const lesson = getLesson();
      const voices = window.speechSynthesis?.getVoices() ?? [];
      const filtered = voices.filter((voice) =>
        voice.lang === lesson.voice || voice.lang.startsWith(lesson.voice.split("-")[0])
      );
      speakerSelect.innerHTML = "";
      const defaultOption = document.createElement("option");
      defaultOption.value = "";
      defaultOption.textContent = "Default voice";
      speakerSelect.appendChild(defaultOption);
      filtered.forEach((voice) => {
        const option = document.createElement("option");
        option.value = voice.name;
        option.textContent = `${voice.name} (${voice.lang})`;
        speakerSelect.appendChild(option);
      });
      speakerSelect.value = state.voiceName || "";
      speakerSelect.disabled = filtered.length === 0;
    };

    const pickLevelVoice = () => {
      const lesson = getLesson();
      const voices = window.speechSynthesis?.getVoices() ?? [];
      const filtered = voices.filter((voice) =>
        voice.lang === lesson.voice || voice.lang.startsWith(lesson.voice.split("-")[0])
      );
      if (!filtered.length) return "";
      const idx = getModuleIndex() % filtered.length;
      return filtered[idx].name;
    };

    const applyLevelVoice = () => {
      if (!state.autoVoiceByLevel) return;
      const voiceName = pickRandomVoice();
      if (!voiceName) return;
      state.activeVoiceName = voiceName;
      if (speakerSelect && !state.voiceName) speakerSelect.value = "";
    };

    const populateProfileOptions = () => {
      if (!profileSelect) return;
      const data = loadStorage();
      profileSelect.innerHTML = "";
      Object.keys(data.profiles).forEach((name) => {
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        profileSelect.appendChild(option);
      });
      const addOption = document.createElement("option");
      addOption.value = "__new__";
      addOption.textContent = "➕ Add profile";
      profileSelect.appendChild(addOption);
      profileSelect.value = state.profileId;
    };

    const applyProfile = (profileId) => {
      const data = loadStorage();
      if (!data.profiles[profileId]) data.profiles[profileId] = {};
      state.profileId = profileId;
      applySavedState(data.profiles[profileId]);
      updateSaveStatus();
    };

    const applyLessonUI = () => {
      const lesson = getLesson();
      const module = getModule();
      const palette = ["#ffe2d2", "#d6f2e4", "#ffecc8", "#d9d2ff"];
      const borderPalette = ["#ffb998", "#8ad3b2", "#ffc57d", "#a896ff"];
      const idx = getModuleIndex() % palette.length;
      document.querySelector(".lesson-card")?.style.setProperty("--new-word-bg", palette[idx]);
      document.querySelector(".lesson-card")?.style.setProperty("--new-word-border", borderPalette[idx]);
      if (unitChip) unitChip.textContent = `${DIFFICULTY_LABELS[state.difficulty]} ${state.levelIndex + 1}`;
      if (topicChip) topicChip.textContent = module.title;
      if (languageChip) languageChip.textContent = lesson.label;
      if (wordTitle) wordTitle.textContent = "Word helper";
      if (wordDefinition) wordDefinition.textContent = "Tap any highlighted word to see its meaning.";
      updateScriptToggle();
    };

    const updateScriptToggle = () => {
      if (!scriptModeSelect) return;
      const lesson = getLesson();
      const hasRomanization = lesson.romanizationMap?.size;
      if (!hasRomanization) {
        scriptModeSelect.value = "hanzi";
        scriptModeSelect.disabled = true;
        state.scriptMode = "hanzi";
        return;
      }
      scriptModeSelect.disabled = false;
      scriptModeSelect.value = state.scriptMode;
    };

    const getNewWordSet = () => new Set((getModule().newWords || []).map((w) => normalize(w)));

    const getLanguageAnimationDelayMs = (label) => {
      const durations = typeof window !== "undefined" ? window.languageAnimationDurations : null;
      const fallback = typeof window !== "undefined" ? Number(window.languageAnimationDurationMs) || 0 : 0;
      if (!label) return fallback;
      const match = durations?.[label];
      return Number.isFinite(match) && match > 0 ? match : fallback;
    };

    const waitForLanguageAnimationMs = (label, timeoutMs = 2500) => {
      const initial = getLanguageAnimationDelayMs(label);
      if (initial > 0) return Promise.resolve(initial);
      return new Promise((resolve) => {
        let settled = false;
        const finalize = (value) => {
          if (settled) return;
          settled = true;
          if (typeof window !== "undefined") {
            window.removeEventListener("globeAnimationDuration", handleDuration);
          }
          resolve(value);
        };
        const handleDuration = (event) => {
          const detail = event?.detail || {};
          if (label && detail.label && detail.label !== label) return;
          const durationMs = Number(detail.durationMs) || getLanguageAnimationDelayMs(label);
          finalize(durationMs);
        };
        if (typeof window !== "undefined") {
          window.addEventListener("globeAnimationDuration", handleDuration);
        }
        setTimeout(() => {
          const fallback = getLanguageAnimationDelayMs(label);
          finalize(fallback);
        }, timeoutMs);
      });
    };

    const updateLanguageSelectionUI = (languageKey) => {
      if (languageSelectLayout) {
        languageSelectLayout.classList.toggle("language-selected", Boolean(languageKey));
      }
      if (globeCaption) {
        const meta = LANGUAGE_META[languageKey];
        globeCaption.textContent = meta?.caption || "Choose a language to explore its home countries.";
      }
      if (globeShell) {
        const meta = LANGUAGE_META[languageKey];
        globeShell.style.setProperty("--highlight-color", meta?.highlight || "#6b7a6f");
      }
      if (typeof window !== "undefined" && "CustomEvent" in window) {
        const meta = LANGUAGE_META[languageKey] || {};
        const label = getPack().languages?.[languageKey]?.label || "";
        window.dispatchEvent(
          new CustomEvent("languagechange", {
            detail: {
              languageKey,
              highlight: meta.highlight || "#6b7a6f",
              label,
            },
          })
        );
      }
      if (globeMarkers.length) {
        globeMarkers.forEach((marker) => {
          const langs = (marker.dataset.lang || "").split(/[,\s]+/).filter(Boolean);
          marker.classList.toggle("active", langs.includes(languageKey));
        });
      }
    };

    const renderLanguageGrid = () => {
      if (!languageGrid) return;
      languageGrid.innerHTML = "";
      const pack = getPack();
      Object.entries(pack.languages).forEach(([key, lesson], index) => {
        const card = document.createElement("button");
        card.type = "button";
        card.className = "language-card";
        card.dataset.languageKey = key;
        if (key === state.languageKey) card.classList.add("active");
        card.setAttribute("aria-label", lesson.label);
        const meta = LANGUAGE_META[key] || {};
        const flag = document.createElement("span");
        flag.className = "lang-flag";
        flag.textContent = meta.flag || "🌍";
        const label = document.createElement("span");
        label.className = "lang-label";
        label.textContent = lesson.label;
        label.style.animationDelay = `${(index * 0.2) % 1.4}s`;
        card.append(flag, label);
        card.addEventListener("click", () => {
          state.languageKey = key;
          state.difficulty = "beginner";
          state.levelIndex = 0;
          state.voiceName = "";
          state.scriptMode = getLesson().romanizationMap?.size ? "both" : "hanzi";
          state.tasks = buildTasks();
          state.index = 0;
          state.hearts = 3;
          state.xp = 0;
          state.correctCount = 0;
          if (checkBtn) checkBtn.textContent = "Check";
          if (languageGrid) {
            [...languageGrid.querySelectorAll(".language-card")].forEach((btn) => {
              btn.classList.toggle("active", btn.dataset.languageKey === key);
            });
          }
          updateLanguageSelectionUI(key);
          populateLanguageOptions();
          populateSpeakerOptions();
          applyLessonUI();
          renderLevels();
          saveProgress();
          const pageName = window.location.pathname.split("/").pop();
          const isSelectPage = pageName === "language-select.html";
          if (isSelectPage) {
            const label = lesson.label;
            if (languageNavTimer) clearTimeout(languageNavTimer);
            waitForLanguageAnimationMs(label).then((delayMs) => {
              languageNavTimer = setTimeout(() => {
                window.location.href = "levels.html";
              }, Math.max(0, delayMs || 0));
            });
          } else {
            window.location.href = "levels.html";
          }
        });
        languageGrid.appendChild(card);
      });
      updateLanguageSelectionUI(state.languageKey);
    };

    const renderLevels = () => {
      if (!levelsGrid) return;
      levelsGrid.innerHTML = "";
      const lesson = getLesson();
      const completedLevels = getCompletedLevels();
      const diffIndex = DIFFICULTY_ORDER.indexOf(state.difficulty);
      const activeModule = getModule();
      if (levelsTitle) levelsTitle.textContent = `Unit ${diffIndex + 1}`;
      if (levelsSubtitle) {
        levelsSubtitle.textContent = `${DIFFICULTY_LABELS[state.difficulty]} · ${activeModule.description || lesson.label}`;
      }
      if (levelsLanguage) levelsLanguage.textContent = lesson.label;
      if (levelsXp) levelsXp.textContent = state.xp;
      if (levelsHearts) levelsHearts.textContent = state.hearts;
      if (streakStat) streakStat.textContent = getStreakCount();

      const nodeIcons = ["▶", "📘", "⭐", "🎯", "🔒"];
      DIFFICULTY_ORDER.forEach((difficulty, unitIndex) => {
        const unit = document.createElement("div");
        unit.className = "unit-block";
        unit.innerHTML = `<div class="unit-label">Unit ${unitIndex + 1} · ${DIFFICULTY_LABELS[difficulty]}</div>`;
        const path = document.createElement("div");
        path.className = "level-path";
        const maxUnlocked = unitIndex < diffIndex
          ? LEVELS_PER_DIFFICULTY - 1
          : unitIndex === diffIndex
            ? state.levelIndex + 1
            : -1;

        (lesson.levels?.[difficulty] || []).slice(0, LEVELS_PER_DIFFICULTY).forEach((module, idx) => {
          const btn = document.createElement("button");
          btn.type = "button";
          btn.className = "path-node";
          const isLocked = idx > maxUnlocked;
          const isDone = completedLevels.has(module.id);
          if (isLocked) btn.classList.add("locked");
          else if (isDone) btn.classList.add("done");
          if (difficulty === state.difficulty && idx === state.levelIndex) btn.classList.add("active");
          btn.textContent = isDone ? "✓" : nodeIcons[idx % nodeIcons.length];
          btn.title = module.title;
          btn.setAttribute("aria-label", module.title);
          btn.addEventListener("click", () => {
            if (isLocked) return;
            startLesson(difficulty, idx);
          });
          path.appendChild(btn);
        });
        unit.appendChild(path);
        levelsGrid.appendChild(unit);
      });
    };

    const setView = (viewId) => {
      views.forEach((view) => {
        view.classList.toggle("active", view.id === viewId);
      });
      if (backBtn) {
        backBtn.style.visibility = viewId === "viewWelcome" ? "hidden" : "visible";
      }
      state.currentView = viewId;
      document.body.dataset.view = viewId;
      if (viewId === "viewLevels") {
        renderLevels();
      }
    };

    const startLesson = (difficulty, levelIndex) => {
      state.difficulty = difficulty;
      state.levelIndex = levelIndex;
      state.tasks = buildTasks();
      state.index = 0;
      state.hearts = 3;
      state.xp = 0;
      state.correctCount = 0;
      state.sessionXp = 0;
      if (checkBtn) checkBtn.textContent = "Check";
      populateSpeakerOptions();
      applyLevelVoice();
      applyLessonUI();
      renderTask();
      saveProgress();
      if (!window.location.pathname.endsWith("lesson.html")) {
        window.location.href = "lesson.html";
        return;
      }
      setView("viewLesson");
    };

    const resetProgress = (keepLanguage = true) => {
      const lessonKey = keepLanguage ? state.languageKey : "spanish";
      state.languageKey = lessonKey;
      state.difficulty = "beginner";
      state.levelIndex = 0;
      state.tasks = buildTasks();
      state.index = 0;
      state.hearts = 3;
      state.xp = 0;
      state.correctCount = 0;
      if (checkBtn) checkBtn.textContent = "Check";
      renderTask();
      saveProgress();
    };

    const showFeedback = (message, good) => {
      if (!feedback) return;
      feedback.textContent = message;
      feedback.classList.toggle("good", Boolean(good));
      feedback.classList.toggle("bad", !good);
      feedback.classList.add("show");
      setTimeout(() => feedback.classList.remove("show"), 1200);
    };

    const showAnswerFeedback = (task, correct) => {
      if (!feedback || !task) return;
      const native = task.native || task.audio || task.answer || "";
      const romanized = task.romanized || getRomanizationForText(native);
      const english = task.english || (task.prompt && task.prompt !== native ? task.prompt : "");
      const title = correct ? "Correct" : "Not quite";
      const subtitle = correct ? "Nice work" : "Correct answer";
      const nativeLine = native ? `<div class="feedback-native">${escapeHTML(native)}</div>` : "";
      const romanizedLine = romanized ? `<div class="feedback-romanized">${escapeHTML(romanized)}</div>` : "";
      const englishLine = english ? `<div class="feedback-english">${escapeHTML(english)}</div>` : "";
      feedback.innerHTML = `
        <div class="feedback-title">${title}</div>
        <div class="feedback-sub">${subtitle}</div>
        <div class="feedback-body">
          ${nativeLine}
          ${romanizedLine}
          ${englishLine}
        </div>
      `;
      const continueClass = correct ? 'btn-continue-good' : 'btn-continue-bad';
      feedback.innerHTML += `<button class="btn feedback-continue-btn ${continueClass}" id="feedbackContinueBtn">${correct ? 'Continue' : 'Got it'}</button>`;
      feedback.classList.toggle("good", Boolean(correct));
      feedback.classList.toggle("bad", !correct);
      feedback.classList.add("show");
      const lessonActions = document.querySelector('.lesson-actions');
      if (lessonActions) lessonActions.style.visibility = 'hidden';
      document.getElementById('feedbackContinueBtn')?.addEventListener('click', () => {
        if (state.pendingAdvance) advanceTask();
        else hideAnswerFeedback();
      });
      if (native) speak(native);
      if (task.type === "choice") {
        document.querySelectorAll(".choice-btn").forEach(btn => {
          if (btn.dataset.option === task.answer) {
            btn.classList.add("correct");
          } else if (!correct && btn.dataset.option === state.selectedOption) {
            btn.classList.add("incorrect");
          }
        });
      }
    };

    const hideAnswerFeedback = () => {
      if (!feedback) return;
      feedback.classList.remove("show", "good", "bad");
      feedback.textContent = "";
      document.querySelectorAll(".choice-btn.correct, .choice-btn.incorrect").forEach(btn => {
        btn.classList.remove("correct", "incorrect");
      });
      const lessonActions = document.querySelector('.lesson-actions');
      if (lessonActions) lessonActions.style.visibility = '';
    };

    const advanceTask = () => {
      state.pendingAdvance = false;
      state.index += 1;
      hideAnswerFeedback();
      if (state.index >= state.tasks.length) {
        const completedModule = getModule();
        recordStreakDay();
        markLevelComplete();
        updateStatus();
        showCompletionScreen(completedModule);
        return;
      }
      if (checkBtn) checkBtn.textContent = "Check";
      renderTask();
    };

    const spawnConfetti = (container) => {
      const colors = ['#ff8d62','#7bcf9d','#c4cdfa','#f6b0b6','#f6d0a0','#f6f2b6','#cdaef0'];
      for (let i = 0; i < 70; i++) {
        const piece = document.createElement('div');
        piece.className = 'confetti-piece';
        piece.style.cssText = `left:${Math.random()*100}%;background:${colors[Math.floor(Math.random()*colors.length)]};width:${5+Math.random()*8}px;height:${8+Math.random()*10}px;animation-delay:${Math.random()*1}s;animation-duration:${1.4+Math.random()*0.8}s;transform:rotate(${Math.random()*360}deg);`;
        container.appendChild(piece);
      }
    };

    const showCompletionScreen = (completedModule) => {
      const xpEarned = state.sessionXp || 0;
      const streak = getStreakCount();
      const existing = document.getElementById('completionOverlay');
      if (existing) existing.remove();
      const overlay = document.createElement('div');
      overlay.className = 'completion-overlay';
      overlay.id = 'completionOverlay';
      const moduleTitle = completedModule ? escapeHTML(completedModule.title) : '';
      overlay.innerHTML = `
        <div class="completion-card">
          <div class="completion-emoji">🎉</div>
          <h2 class="completion-title">Lesson Complete!</h2>
          ${moduleTitle ? `<p class="completion-module">${moduleTitle}</p>` : ''}
          <div class="completion-stats">
            <div class="completion-stat">
              <span class="stat-big">+${xpEarned}</span>
              <span class="stat-label">XP earned</span>
            </div>
            <div class="completion-stat">
              <span class="stat-big">🔥 ${streak}</span>
              <span class="stat-label">day streak</span>
            </div>
            <div class="completion-stat">
              <span class="stat-big">❤ ${state.hearts}</span>
              <span class="stat-label">lives left</span>
            </div>
          </div>
          <button class="btn btn-primary completion-continue" id="completionContinueBtn">Continue →</button>
        </div>`;
      spawnConfetti(overlay);
      document.body.appendChild(overlay);
      requestAnimationFrame(() => requestAnimationFrame(() => overlay.classList.add('visible')));
      document.getElementById('completionContinueBtn').addEventListener('click', () => {
        overlay.remove();
        window.location.href = 'levels.html';
      });
    };

    const markLevelComplete = () => {
      const module = getModule();
      if (!module) return;
      const completedLevels = getCompletedLevels();
      completedLevels.add(module.id);
      saveCompletedLevels(completedLevels);
      const lesson = getLesson();
      const levels = lesson.levels?.[state.difficulty] || [];
      if (state.levelIndex < levels.length - 1) {
        state.levelIndex += 1;
      } else {
        const diffIdx = DIFFICULTY_ORDER.indexOf(state.difficulty);
        if (diffIdx < DIFFICULTY_ORDER.length - 1) {
          state.difficulty = DIFFICULTY_ORDER[diffIdx + 1];
          state.levelIndex = 0;
        }
      }
      saveProgress();
    };

    const playTone = (good) => {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const now = ctx.currentTime;
      const gain = ctx.createGain();
      gain.gain.value = 0.12;
      gain.connect(ctx.destination);
      const osc = ctx.createOscillator();
      osc.connect(gain);
      osc.type = "sine";
      osc.frequency.value = good ? 640 : 220;
      osc.start(now);
      osc.stop(now + 0.15);
      if (good) {
        const osc2 = ctx.createOscillator();
        osc2.connect(gain);
        osc2.type = "triangle";
        osc2.frequency.value = 820;
        osc2.start(now + 0.12);
        osc2.stop(now + 0.3);
      }
    };

    const pickRandomVoice = () => {
      const lesson = getLesson();
      const voices = window.speechSynthesis?.getVoices() ?? [];
      const filtered = voices.filter((voice) =>
        voice.lang === lesson.voice || voice.lang.startsWith(lesson.voice.split("-")[0])
      );
      if (!filtered.length) return "";
      const idx = Math.floor(Math.random() * filtered.length);
      return filtered[idx].name;
    };

    const selectTaskVoice = () => {
      if (state.voiceName) {
        state.activeVoiceName = state.voiceName;
        return;
      }
      if (!state.autoVoiceByLevel) {
        state.activeVoiceName = "";
        return;
      }
      state.activeVoiceName = pickRandomVoice();
    };

    const speak = (text, force = false) => {
      if ((!state.audioEnabled && !force) || !window.speechSynthesis) return;
      const lesson = getLesson();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = lesson.voice;
      utterance.rate = state.speechRate;
      const voices = window.speechSynthesis.getVoices();
      const preferred = state.activeVoiceName || state.voiceName;
      const match =
        (preferred ? voices.find((v) => v.name === preferred) : null) ||
        voices.find((v) => v.lang === lesson.voice) ||
        voices.find((v) => v.lang.startsWith(lesson.voice.split("-")[0]));
      if (match) utterance.voice = match;
      speechSynthesis.cancel();
      speechSynthesis.speak(utterance);
    };

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    let recognizer = null;
    let recording = false;

    const setRecordingState = (active, message) => {
      if (!speakArea) return;
      speakArea.classList.toggle("is-recording", active);
      if (message && speakStatus) speakStatus.textContent = message;
    };

    const initRecognizer = () => {
      if (!SpeechRecognition) {
        if (speakStatus) speakStatus.textContent = "Speech recognition not available in this browser.";
        if (speakArea) speakArea.classList.remove("is-recording");
        return;
      }
      const lesson = getLesson();
      recognizer = new SpeechRecognition();
      recognizer.lang = lesson.voice;
      recognizer.interimResults = false;
      recognizer.maxAlternatives = 1;
      recognizer.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        state.speechText = transcript;
        if (speakTranscript) speakTranscript.textContent = transcript;
        setRecordingState(false, "Captured!");
      };
      recognizer.onerror = () => {
        state.speechText = "";
        if (speakTranscript) speakTranscript.textContent = "";
        setRecordingState(false, "Could not capture speech.");
      };
      recognizer.onend = () => {
        recording = false;
        if (recordBtn) recordBtn.textContent = "Tap to Speak";
        if (speakArea) speakArea.classList.remove("is-recording");
        if (!state.speechText) {
          if (speakStatus) speakStatus.textContent = "Mic idle";
        }
      };
    };

    const updateStatus = () => {
      if (!progressText || !progressFill) return;
      const total = state.tasks.length;
      const shownIndex = total ? Math.min(state.index + 1, total) : 0;
      progressText.textContent = `${shownIndex}/${total || 0}`;
      const percent = total ? (shownIndex / total) * 100 : 0;
      progressFill.style.width = `${percent}%`;
      if (heartPanel) heartPanel.innerHTML = '<span style="color:#FF4B4B">' + '❤'.repeat(state.hearts) + '</span>' + '<span style="opacity:0.25">❤</span>'.repeat(Math.max(0, 3 - state.hearts));
      if (xpPanel) xpPanel.textContent = state.xp;
      if (levelsXp) levelsXp.textContent = state.xp;
      if (levelsHearts) levelsHearts.textContent = state.hearts;
      if (state.tasks.length) saveProgress();
    };

    const renderChoices = (task) => {
      if (!choiceGrid) return;
      choiceGrid.innerHTML = "";
      task.options.forEach((option) => {
        const btn = document.createElement("button");
        btn.className = "choice-btn";
        btn.dataset.option = option;
        btn.innerHTML = renderTextWithDefinitions(option, { romanize: true });
        btn.addEventListener("click", () => {
          document.querySelectorAll(".choice-btn").forEach((b) => b.classList.remove("selected"));
          btn.classList.add("selected");
          state.selectedOption = option;
        });
        choiceGrid.appendChild(btn);
        attachWordListeners(btn);
      });
    };

    const renderBuildTask = (task) => {
      if (!buildBank || !buildAnswer) return;
      buildBank.innerHTML = "";
      buildAnswer.innerHTML = "";
      state.buildAnswer = [];
      task.words.forEach((word) => {
        const romanized = resolveWordRomanization(word, task) || "";
        const btn = document.createElement("button");
        btn.className = "build-word";
        btn.innerHTML = renderTextWithDefinitions(word, { romanize: true, forceRomanized: romanized });
        btn.addEventListener("click", () => {
          state.buildAnswer.push(word);
          btn.remove();
          renderBuildAnswer();
        });
        buildBank.appendChild(btn);
        attachWordListeners(btn);
      });
      const renderBuildAnswer = () => {
        buildAnswer.innerHTML = "";
        state.buildAnswer.forEach((word, idx) => {
          const btn = document.createElement("button");
          btn.className = "build-word";
          const romanized = resolveWordRomanization(word, task) || "";
          btn.innerHTML = renderTextWithDefinitions(word, { romanize: true, forceRomanized: romanized });
          btn.addEventListener("click", () => {
            state.buildAnswer.splice(idx, 1);
            renderBuildAnswer();
          });
          buildAnswer.appendChild(btn);
        });
      };
      renderBuildAnswer();
    };

    const renderMatchTask = (task) => {
      if (!matchLeft || !matchRight) return;
      matchLeft.innerHTML = "";
      matchRight.innerHTML = "";
      state.matchPairs = task.pairs;
      state.activeMatch = null;
      const right = shuffle(task.pairs.map((pair) => ({ definition: pair.definition, key: pair.word })));
      const matches = new Set();
      const updateSelection = (node) => {
        document.querySelectorAll(".match-item").forEach((item) => item.classList.remove("active"));
        if (node && !node.classList.contains("matched")) node.classList.add("active");
      };

      const tryMatch = (leftKey, rightKey, leftNode, rightNode) => {
        if (leftKey === rightKey) {
          matches.add(leftKey);
          leftNode.classList.add("matched");
          rightNode.classList.add("matched");
          leftNode.classList.remove("active");
          rightNode.classList.remove("active");
          state.activeMatch = null;
          showFeedback("Matched!", true);
        } else {
          showFeedback("Not a match", false);
          state.activeMatch = null;
          updateSelection(null);
        }
      };

      task.pairs.forEach((pair) => {
        const node = document.createElement("button");
        node.className = "match-item";
        node.dataset.key = pair.word;
        node.innerHTML = renderTextWithDefinitions(pair.word, { romanize: true });
        node.addEventListener("click", () => {
          if (node.classList.contains("matched")) return;
          if (state.activeMatch && state.activeMatch.side === "right") {
            tryMatch(pair.word, state.activeMatch.key, node, state.activeMatch.node);
            return;
          }
          state.activeMatch = { side: "left", key: pair.word, node };
          updateSelection(node);
        });
        matchLeft.appendChild(node);
        attachWordListeners(node);
      });

      right.forEach((pair) => {
        const node = document.createElement("button");
        node.className = "match-item";
        node.dataset.key = pair.key;
        node.textContent = pair.definition;
        node.addEventListener("click", () => {
          if (node.classList.contains("matched")) return;
          if (state.activeMatch && state.activeMatch.side === "left") {
            tryMatch(state.activeMatch.key, pair.key, state.activeMatch.node, node);
            return;
          }
          state.activeMatch = { side: "right", key: pair.key, node };
          updateSelection(node);
        });
        matchRight.appendChild(node);
      });
      task._matches = matches;
    };

    const renderSpeakTask = () => {
      if (!speakArea || !speakStatus || !speakTranscript) return;
      if (!recognizer) initRecognizer();
      speakStatus.textContent = SpeechRecognition ? "Tap to speak your answer" : "Speech recognition not supported.";
      speakTranscript.textContent = state.speechText || "";
      speakArea.classList.remove("is-recording");
    };

    const renderTask = () => {
      if (!promptText || !promptTitle || !choiceGrid || !inputArea || !buildArea || !matchArea || !speakArea || !textInput) return;
      applyLessonUI();
      if (!state.tasks.length) return;
      const task = state.tasks[state.index];
      state.selectedOption = null;
      textInput.value = "";
      promptText.innerHTML = renderTextWithDefinitions(task.prompt, { romanize: true });
      promptTitle.textContent =
        task.type === "typing" ? "Type the translation" :
        task.type === "build" ? "Build the sentence" :
        task.type === "match" ? "Match the words" :
        task.type === "speak" ? "Speak the sentence" :
        "Choose the best translation";

      choiceGrid.style.display = "none";
      inputArea.style.display = "none";
      buildArea.style.display = "none";
      matchArea.style.display = "none";
      speakArea.style.display = "none";

      selectTaskVoice();
      state.currentAudio = task.audio || task.native || task.answer || "";
      if (task.type === "typing") {
        choiceGrid.innerHTML = "";
        inputArea.style.display = "flex";
        textInput.focus();
      } else if (task.type === "choice") {
        choiceGrid.style.display = "grid";
        renderChoices(task);
      } else if (task.type === "build") {
        buildArea.style.display = "flex";
        renderBuildTask(task);
      } else if (task.type === "match") {
        matchArea.style.display = "flex";
        renderMatchTask(task);
      } else if (task.type === "speak") {
        speakArea.style.display = "flex";
        renderSpeakTask();
      }
      attachWordListeners(promptText);
      if (state.currentAudio) {
        speak(state.currentAudio);
      }
      updateStatus();
    };

    const handleAnswer = () => {
      const task = state.tasks[state.index];
      let answer = "";
      if (task.type === "typing") answer = textInput.value;
      else if (task.type === "choice") answer = state.selectedOption;
      else if (task.type === "build") answer = state.buildAnswer.join(" ");
      else if (task.type === "speak") answer = state.speechText;

      if (task.type === "match") {
        const matched = task._matches && task._matches.size === task.pairs.length;
        if (!matched) {
          showFeedback("Finish the matches first", false);
          return;
        }
        answer = "__match__";
      }

      if (!answer) {
        showFeedback("Pick an answer first", false);
        return;
      }

      let correct = false;
      if (task.type === "match") {
        correct = task._matches && task._matches.size === task.pairs.length;
      } else {
        correct = normalizeAnswer(answer) === normalizeAnswer(task.answer);
      }
      const trackingText = task.native || task.answer || task.prompt || "";
      recordWordStats(trackingText, correct);
      if (correct) {
        state.xp += 10;
        state.sessionXp = (state.sessionXp || 0) + 10;
        state.correctCount += 1;
        showAnswerFeedback(task, true);
      } else {
        state.hearts = Math.max(0, state.hearts - 1);
        showAnswerFeedback(task, false);
      }
      playTone(correct);
      if (state.hearts === 0) {
        showFeedback("Out of hearts. Session reset.", false);
        state.hearts = 3;
        state.index = 0;
        state.xp = 0;
        state.correctCount = 0;
        state.tasks = buildTasks();
        renderTask();
        return;
      }
      state.pendingAdvance = true;
      if (checkBtn) checkBtn.textContent = "Continue";
    };

    if (checkBtn) checkBtn.addEventListener("click", () => {
      if (state.pendingAdvance) {
        advanceTask();
        return;
      }
      if (state.index >= state.tasks.length) {
        state.tasks = buildTasks();
        state.index = 0;
        state.correctCount = 0;
        state.sessionXp = 0;
        if (checkBtn) checkBtn.textContent = "Check";
        renderTask();
        return;
      }
      handleAnswer();
    });

    if (skipBtn) skipBtn.addEventListener("click", () => {
      if (state.pendingAdvance) {
        advanceTask();
        return;
      }
      state.index += 1;
      if (state.index >= state.tasks.length) {
        const completedModule = getModule();
        recordStreakDay();
        markLevelComplete();
        showCompletionScreen(completedModule);
        return;
      }
      renderTask();
    });

    if (audioToggle) audioToggle.addEventListener("click", () => {
      state.audioEnabled = !state.audioEnabled;
      audioToggle.textContent = state.audioEnabled ? "🔊" : "🔇";
      audioToggle.classList.toggle("muted", !state.audioEnabled);
      saveProgress();
    });

    const applyProfileSelection = (name) => {
      const data = loadStorage();
      if (!data.profiles[name]) data.profiles[name] = {};
      data.activeProfile = name;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      applyProfile(name);
      populateProfileOptions();
      populatePackOptions();
      populateLanguageOptions();
      populateSpeakerOptions();
      applyLevelVoice();
      updateScriptToggle();
      if (focusSelect) focusSelect.value = state.focusMode;
      renderLanguageGrid();
      renderLevels();
    };

    if (languageSelect) languageSelect.addEventListener("change", () => {
      state.languageKey = languageSelect.value;
      state.voiceName = "";
      state.difficulty = "beginner";
      state.levelIndex = 0;
      state.scriptMode = getLesson().romanizationMap?.size ? "both" : "hanzi";
      state.tasks = buildTasks();
      state.index = 0;
      state.hearts = 3;
      state.xp = 0;
      state.correctCount = 0;
      if (checkBtn) checkBtn.textContent = "Check";
      applyLessonUI();
      populateSpeakerOptions();
      applyLevelVoice();
      recognizer = null;
      renderTask();
      renderLanguageGrid();
      renderLevels();
    });

    if (speakerSelect) speakerSelect.addEventListener("change", () => {
      state.voiceName = speakerSelect.value;
      state.autoVoiceByLevel = !state.voiceName;
      saveProgress();
    });

    if (speedRange) speedRange.addEventListener("input", () => {
      state.speechRate = Number(speedRange.value);
      if (speedValue) speedValue.textContent = `${state.speechRate.toFixed(1)}x`;
      saveProgress();
    });

    if (resetBtn) resetBtn.addEventListener("click", () => {
      resetProgress(true);
    });

    if (packSelect) packSelect.addEventListener("change", () => {
      state.packKey = packSelect.value;
      const pack = getPack();
      state.languageKey = Object.keys(pack.languages)[0];
      state.difficulty = "beginner";
      state.levelIndex = 0;
      state.scriptMode = getLesson().romanizationMap?.size ? "both" : "hanzi";
      state.tasks = buildTasks();
      state.index = 0;
      state.hearts = 3;
      state.xp = 0;
      state.correctCount = 0;
      if (checkBtn) checkBtn.textContent = "Check";
      populateLanguageOptions();
      populateSpeakerOptions();
      applyLevelVoice();
      renderTask();
      renderLanguageGrid();
      renderLevels();
    });

    if (profileSelect) profileSelect.addEventListener("change", () => {
      if (profileSelect.value === "__new__") {
        const name = window.prompt("New profile name");
        if (!name) {
          populateProfileOptions();
          return;
        }
        applyProfileSelection(name);
      } else {
        applyProfileSelection(profileSelect.value);
      }
      renderTask();
    });

    if (scriptModeSelect) {
      scriptModeSelect.addEventListener("change", () => {
        state.scriptMode = scriptModeSelect.value;
        updateScriptToggle();
        renderTask();
        saveProgress();
      });
    }

    if (focusSelect) {
      focusSelect.addEventListener("change", () => {
        state.focusMode = focusSelect.value;
        state.tasks = buildTasks();
        state.index = 0;
        state.correctCount = 0;
        if (checkBtn) checkBtn.textContent = "Check";
        renderTask();
        saveProgress();
      });
    }

    if (recordBtn) recordBtn.addEventListener("click", () => {
      if (!SpeechRecognition) {
        if (speakStatus) speakStatus.textContent = "Speech recognition not supported.";
        return;
      }
      if (!recognizer) initRecognizer();
      if (!recognizer) return;
      if (recording) {
        recognizer.stop();
        recording = false;
        recordBtn.textContent = "Tap to Speak";
        setRecordingState(false, "Stopping...");
        return;
      }
      state.speechText = "";
      if (speakTranscript) speakTranscript.textContent = "";
      recording = true;
      recordBtn.textContent = "Listening...";
      setRecordingState(true, "Listening...");
      recognizer.lang = getLesson().voice;
      recognizer.start();
    });

    if (replayBtn) replayBtn.addEventListener("click", () => {
      if (state.currentAudio) {
        speak(state.currentAudio);
      }
    });

    document.addEventListener("keydown", (event) => {
      if (state.currentView !== "viewLesson") return;
      if (event.key === "Enter") {
        handleAnswer();
      }
      if (["1", "2", "3", "4"].includes(event.key)) {
        const idx = Number(event.key) - 1;
        const btns = [...document.querySelectorAll(".choice-btn")];
        if (btns[idx]) btns[idx].click();
      }
    });

    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("linguabloom-sw.js?v=50").catch(() => {});
    }

    window.speechSynthesis?.addEventListener("voiceschanged", populateSpeakerOptions);
    window.speechSynthesis?.addEventListener("voiceschanged", applyLevelVoice);

    loadProgress();
    state.pendingAdvance = false;
    populateProfileOptions();
    populatePackOptions();
    populateLanguageOptions();
    applyLessonUI();
    populateSpeakerOptions();
    applyLevelVoice();
    updateScriptToggle();
    if (speedRange) speedRange.value = state.speechRate.toFixed(1);
    if (speedValue) speedValue.textContent = `${state.speechRate.toFixed(1)}x`;
    if (scriptModeSelect) scriptModeSelect.value = state.scriptMode;
    if (focusSelect) focusSelect.value = state.focusMode;
    if (!state.tasks.length) {
      state.tasks = buildTasks();
    }
    if (audioToggle) {
      audioToggle.textContent = state.audioEnabled ? "🔊" : "🔇";
      audioToggle.classList.toggle("muted", !state.audioEnabled);
    }
    renderTask();
    renderLanguageGrid();
    renderLevels();
    const viewParam = new URLSearchParams(window.location.search).get("view");
    const pageName = window.location.pathname.split("/").pop();
    if (pageName === "levels.html" || viewParam === "levels") {
      setView("viewLevels");
    } else if (pageName === "lesson.html" || viewParam === "lesson") {
      setView("viewLesson");
    } else if (pageName === "language-select.html" || viewParam === "language") {
      setView("viewLanguage");
    } else {
      setView("viewWelcome");
    }

    if (loginBtn) loginBtn.addEventListener("click", () => {
      const name = loginName.value.trim() || "Explorer";
      applyProfileSelection(name);
      renderLanguageGrid();
      window.location.href = "language-select.html";
    });

    if (guestBtn) guestBtn.addEventListener("click", () => {
      applyProfileSelection("Guest");
      renderLanguageGrid();
      window.location.href = "language-select.html";
    });

    if (backBtn) backBtn.addEventListener("click", () => {
      if (state.currentView === "viewLesson") {
        window.location.href = "levels.html";
      } else if (state.currentView === "viewLevels") {
        window.location.href = "language-select.html";
      } else if (state.currentView === "viewLanguage") {
        window.location.href = "language-learning.html";
      }
    });

    if (settingsBtn) settingsBtn.addEventListener("click", () => {
      if (settingsModal) settingsModal.classList.add("show");
    });

    if (closeSettings) closeSettings.addEventListener("click", () => {
      if (settingsModal) settingsModal.classList.remove("show");
    });

    if (settingsModal) settingsModal.addEventListener("click", (event) => {
      if (event.target === settingsModal) {
        settingsModal.classList.remove("show");
      }
    });

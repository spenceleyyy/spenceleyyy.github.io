const STORAGE_KEY = "linguabloom-progress-v2";
    const STREAK_KEY = "linguabloom-streak";
    const COMPLETED_KEY = "linguabloom-completed";
    const LEVELS_PER_DIFFICULTY = 5;
    const DIFFICULTY_ORDER = ["beginner", "intermediate", "advanced", "fluent", "mastery"];
    const DIFFICULTY_LABELS = {
      beginner: "Beginner",
      intermediate: "Intermediate",
      advanced: "Advanced",
      fluent: "Fluent",
      mastery: "Mastery"
    };
    const CURRICULUM = {
      beginner: [
        { id: "beg-1", title: "Hello & Goodbye",   description: "Greet people confidently.",          group: "greetings" },
        { id: "beg-2", title: "Polite Basics",      description: "Kind words in everyday moments.",    group: "polite" },
        { id: "beg-3", title: "Around the Lake",    description: "Ask for directions and help.",       group: "directions" },
        { id: "beg-4", title: "Cafe Basics",        description: "Order drinks and snacks.",           group: "cafe" },
        { id: "beg-5", title: "Simple Opinions",    description: "Talk about the city.",               group: "opinions" }
      ],
      intermediate: [
        { id: "int-1", title: "Travel Day",         description: "Get around town.",                  group: "travel" },
        { id: "int-2", title: "Shopping Trip",      description: "Ask about prices and sizes.",        group: "shopping" },
        { id: "int-3", title: "Making Plans",       description: "Set a time and place.",              group: "plans" },
        { id: "int-4", title: "Need a Hand",        description: "Handle small problems.",             group: "problems" },
        { id: "int-5", title: "City Opinions",      description: "Share quick thoughts.",              group: "opinions" }
      ],
      advanced: [
        { id: "adv-1", title: "Handle Problems",    description: "Explain what went wrong.",           group: "problems" },
        { id: "adv-2", title: "Local Plans",        description: "Coordinate with friends.",           group: "plans" },
        { id: "adv-3", title: "Travel Fixes",       description: "Deal with delays.",                  group: "travel" },
        { id: "adv-4", title: "Shopping Details",   description: "Clarify what you need.",             group: "shopping" },
        { id: "adv-5", title: "Cafe Conversations", description: "Relaxed, longer phrases.",           group: "cafe" }
      ],
      fluent: [
        { id: "flu-1", title: "At the Hospital",    description: "Describe symptoms and pain.",        group: "health" },
        { id: "flu-2", title: "Work Talk",          description: "Office and career phrases.",         group: "work" },
        { id: "flu-3", title: "Family & Home",      description: "Talk about people you love.",        group: "family" },
        { id: "flu-4", title: "Food & Cooking",     description: "Describe dishes and recipes.",       group: "food" },
        { id: "flu-5", title: "Weather & Seasons",  description: "Small talk about the weather.",      group: "weather" }
      ],
      mastery: [
        { id: "mas-1", title: "Making Excuses",     description: "Politely get out of plans.",         group: "social" },
        { id: "mas-2", title: "Giving Opinions",    description: "Agree, disagree, discuss.",          group: "debate" },
        { id: "mas-3", title: "Phone & Messages",   description: "Text and call in Chinese.",          group: "digital" },
        { id: "mas-4", title: "Chinese Festivals",  description: "Traditions and celebrations.",       group: "culture" },
        { id: "mas-5", title: "Storytelling",       description: "Narrate events past and future.",    group: "narrative" }
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
              "问题": "problem",
              "疼": "pain/hurt",
              "发烧": "fever",
              "药": "medicine",
              "工作": "work/job",
              "同事": "colleague",
              "老板": "boss",
              "会议": "meeting",
              "家": "home/family",
              "妈妈": "mother",
              "爸爸": "father",
              "孩子": "child/children",
              "吃": "eat",
              "好吃": "delicious/tasty",
              "做饭": "cook",
              "菜": "dish/vegetable",
              "天气": "weather",
              "热": "hot",
              "冷": "cold",
              "下雨": "raining",
              "今天": "today",
              "想": "want/think/miss",
              "因为": "because",
              "可能": "maybe/possible",
              "同意": "agree",
              "觉得": "feel/think",
              "但是": "but/however",
              "手机": "phone",
              "发消息": "send message",
              "微信": "WeChat",
              "春节": "Spring Festival",
              "红包": "red envelope",
              "传统": "tradition",
              "故事": "story",
              "以前": "before/in the past",
              "以后": "after/in the future",
              "发生": "happen/occur"
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
              "问题": "wen ti",
              "疼": "teng",
              "发烧": "fa shao",
              "药": "yao",
              "工作": "gong zuo",
              "同事": "tong shi",
              "老板": "lao ban",
              "会议": "hui yi",
              "家": "jia",
              "妈妈": "ma ma",
              "爸爸": "ba ba",
              "孩子": "hai zi",
              "吃": "chi",
              "好吃": "hao chi",
              "做饭": "zuo fan",
              "菜": "cai",
              "天气": "tian qi",
              "热": "re",
              "冷": "leng",
              "下雨": "xia yu",
              "今天": "jin tian",
              "想": "xiang",
              "因为": "yin wei",
              "可能": "ke neng",
              "同意": "tong yi",
              "觉得": "jue de",
              "但是": "dan shi",
              "手机": "shou ji",
              "发消息": "fa xiao xi",
              "微信": "wei xin",
              "春节": "chun jie",
              "红包": "hong bao",
              "传统": "chuan tong",
              "故事": "gu shi",
              "以前": "yi qian",
              "以后": "yi hou",
              "发生": "fa sheng"
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
              ]),
              health: group(["health"], ["疼", "发烧", "药", "医生"], [
                { en: "It hurts here", target: "这里 疼", romanized: "zhe li teng" },
                { en: "I have a fever", target: "我 发烧 了", romanized: "wo fa shao le" },
                { en: "I need medicine", target: "我 需要 药", romanized: "wo xu yao yao" },
                { en: "I need to see a doctor", target: "我 需要 看 医生", romanized: "wo xu yao kan yi sheng" }
              ]),
              work: group(["work"], ["工作", "同事", "老板", "会议"], [
                { en: "I work here", target: "我 在 这里 工作", romanized: "wo zai zhe li gong zuo" },
                { en: "My colleague", target: "我 的 同事", romanized: "wo de tong shi" },
                { en: "I have a meeting", target: "我 有 会议", romanized: "wo you hui yi" },
                { en: "My boss", target: "我 的 老板", romanized: "wo de lao ban" }
              ]),
              family: group(["family"], ["家", "妈妈", "爸爸", "孩子"], [
                { en: "My home", target: "我 的 家", romanized: "wo de jia" },
                { en: "My mother", target: "我 妈妈", romanized: "wo ma ma" },
                { en: "My father", target: "我 爸爸", romanized: "wo ba ba" },
                { en: "My child", target: "我 的 孩子", romanized: "wo de hai zi" }
              ]),
              food: group(["food"], ["吃", "好吃", "做饭", "菜"], [
                { en: "Let's eat", target: "我们 吃饭 吧", romanized: "wo men chi fan ba" },
                { en: "This is tasty", target: "这个 很 好吃", romanized: "zhe ge hen hao chi" },
                { en: "I like to cook", target: "我 喜欢 做饭", romanized: "wo xi huan zuo fan" },
                { en: "What dish is this?", target: "这是 什么 菜", romanized: "zhe shi shen me cai" }
              ]),
              weather: group(["weather"], ["天气", "热", "冷", "下雨"], [
                { en: "How's the weather?", target: "天气 怎么样", romanized: "tian qi zen me yang" },
                { en: "It's very hot today", target: "今天 很 热", romanized: "jin tian hen re" },
                { en: "It's cold", target: "很 冷", romanized: "hen leng" },
                { en: "It's raining", target: "下雨 了", romanized: "xia yu le" }
              ]),
              social: group(["social"], ["想", "因为", "可能", "今天"], [
                { en: "I don't feel like it", target: "我 不 想 去", romanized: "wo bu xiang qu" },
                { en: "Because I'm busy", target: "因为 我 很 忙", romanized: "yin wei wo hen mang" },
                { en: "Maybe next time", target: "可能 下次 吧", romanized: "ke neng xia ci ba" },
                { en: "Not today", target: "今天 不 行", romanized: "jin tian bu xing" }
              ]),
              debate: group(["debate"], ["同意", "觉得", "但是", "可能"], [
                { en: "I agree", target: "我 同意", romanized: "wo tong yi" },
                { en: "I think that", target: "我 觉得", romanized: "wo jue de" },
                { en: "But", target: "但是", romanized: "dan shi" },
                { en: "Maybe you're right", target: "可能 你 说得 对", romanized: "ke neng ni shuo de dui" }
              ]),
              digital: group(["digital"], ["手机", "发消息", "微信", "今天"], [
                { en: "Check your phone", target: "看 一下 手机", romanized: "kan yi xia shou ji" },
                { en: "Send me a message", target: "给 我 发 消息", romanized: "gei wo fa xiao xi" },
                { en: "Add me on WeChat", target: "加 我 微信 吧", romanized: "jia wo wei xin ba" },
                { en: "I'll send you the details", target: "我 发 给 你 详情", romanized: "wo fa gei ni xiang qing" }
              ]),
              culture: group(["culture"], ["春节", "红包", "传统", "家"], [
                { en: "Happy New Year!", target: "新年 快乐", romanized: "xin nian kuai le" },
                { en: "Red envelope", target: "红包", romanized: "hong bao" },
                { en: "Chinese tradition", target: "中国 传统", romanized: "zhong guo chuan tong" },
                { en: "Family reunion", target: "家人 团聚", romanized: "jia ren tuan ju" }
              ]),
              narrative: group(["narrative"], ["故事", "以前", "以后", "发生"], [
                { en: "Let me tell you a story", target: "我 给 你 讲 个 故事", romanized: "wo gei ni jiang ge gu shi" },
                { en: "Before", target: "以前", romanized: "yi qian" },
                { en: "After that", target: "以后", romanized: "yi hou" },
                { en: "What happened?", target: "发生 了 什么", romanized: "fa sheng le shen me" }
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
      azureKey: localStorage.getItem("linguabloom-azure-key") || "",
      azureRegion: localStorage.getItem("linguabloom-azure-region") || "eastus",
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
    const levelSheet = document.getElementById("levelSheet");
    const levelSheetBackdrop = document.getElementById("levelSheetBackdrop");
    const sheetIcon = document.getElementById("sheetIcon");
    const sheetIconWrap = document.getElementById("sheetIconWrap");
    const sheetTitle = document.getElementById("sheetTitle");
    const sheetDesc = document.getElementById("sheetDesc");
    const sheetStarBadge = document.getElementById("sheetStarBadge");
    const sheetStartBtn = document.getElementById("sheetStartBtn");
    const navLearnBtn = document.getElementById("navLearn");
    const navStatsBtn = document.getElementById("navStats");
    const viewStats = document.getElementById("viewStats");
    const statsStreakBig = document.getElementById("statsStreakBig");
    const statsXpVal = document.getElementById("statsXpVal");
    const statsDoneVal = document.getElementById("statsDoneVal");
    const weekDots = document.getElementById("weekDots");
    const unitProgressList = document.getElementById("unitProgressList");
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

    const getTotalXp = () => { const s = loadStreak(); return s.totalXp || 0; };
    const addTotalXp = (amount) => {
      if (!amount || amount <= 0) return;
      const s = loadStreak();
      s.totalXp = (s.totalXp || 0) + amount;
      localStorage.setItem(STREAK_KEY, JSON.stringify(s));
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
      // Hanzi is never shown without its written equivalent (pinyin)
      const shouldShowRomanized = !!romanized;
      if (!decorated && shouldShowRomanized) {
        return `<span class="romanization-line">${romanized}</span>`;
      }
      if (!shouldShowRomanized) return decorated || text;
      return `${decorated}<span class="romanization-line">${romanized}</span>`;
    };

    const viewLessonEl = document.getElementById("viewLesson");

    const hideWordPop = () => { document.querySelector(".word-pop")?.remove(); };

    const showWordPop = (chip, word, definition, romanized, isNew) => {
      hideWordPop();
      const pop = document.createElement("div");
      pop.className = "word-pop" + (isNew ? " word-pop-new" : "");
      pop.innerHTML =
        (isNew ? '<div class="word-pop-badge">New word</div>' : "") +
        '<div class="word-pop-word">' + escapeHTML(word) + "</div>" +
        (romanized ? '<div class="word-pop-pinyin">' + escapeHTML(romanized) + "</div>" : "") +
        '<div class="word-pop-def">' + escapeHTML(definition) + "</div>";
      document.body.appendChild(pop);
      const rect = chip.getBoundingClientRect();
      const pw = pop.offsetWidth;
      let left = rect.left + rect.width / 2 - pw / 2;
      left = Math.max(10, Math.min(left, window.innerWidth - pw - 10));
      let top = rect.top - pop.offsetHeight - 12;
      if (top < 8) top = rect.bottom + 12;
      pop.style.left = left + "px";
      pop.style.top = top + "px";
      const dismiss = (event) => {
        if (pop.contains(event.target)) return;
        hideWordPop();
        document.removeEventListener("pointerdown", dismiss, true);
      };
      setTimeout(() => document.addEventListener("pointerdown", dismiss, true), 0);
    };

    // Word-chip lock state for the current task.
    // Definitions unlock once the answer is submitted (state.pendingAdvance).
    const syncLessonAids = () => {
      if (!viewLessonEl) return;
      const locked = !state.pendingAdvance;
      viewLessonEl.classList.toggle("answers-locked", locked);
      const hasNew = !!viewLessonEl.querySelector(".word-chip.new-word");
      document.getElementById("newWordBtn")?.classList.toggle("has-new", hasNew);
    };

    const attachWordListeners = (container) => {
      if (!container) return;
      container.querySelectorAll(".word-chip").forEach((chip) => {
        chip.addEventListener("click", () => {
          const word = chip.dataset.word || chip.textContent;
          const definition = chip.dataset.definition || "Definition not available yet.";
          const lesson = getLesson();
          const romanized = lesson.romanizationMap?.get(word) || lesson.romanizationMap?.get(word.trim()) || "";
          const isNew = chip.classList.contains("new-word");
          const inActionBtn = !!chip.closest(".build-word, .match-item");
          // Before submitting, known words stay locked — only new words open early.
          if (!state.pendingAdvance && !isNew) {
            if (chip.closest(".prompt-text")) {
              chip.classList.remove("nudge");
              void chip.offsetWidth;
              chip.classList.add("nudge");
              if (wordDefinition) wordDefinition.textContent = "Submit your answer to unlock word meanings.";
            }
            return;
          }
          if (wordTitle) wordTitle.textContent = word;
          if (wordDefinition) {
            wordDefinition.textContent = romanized ? `${definition} · ${romanized}` : definition;
          }
          if (!inActionBtn) showWordPop(chip, word, definition, romanized, isNew && !state.pendingAdvance);
          if (!state.quietMode) speak(word, true);
        });
      });

      // Draw all paths after the DOM is fully laid out
      setTimeout(() => {
        document.querySelectorAll(".level-path").forEach(path => {
          const svgEl = path._svgEl;
          if (!svgEl || !path._nodeX) return;
          const nodeX = path._nodeX, nodeY = path._nodeY;
          const N = path._N, COIN = path._COIN;
          // Use parent width, or levelsGrid width, or viewport — whatever is available
          const cw = path.offsetWidth || path.parentElement?.offsetWidth || levelsGrid?.offsetWidth || (window.innerWidth - 32) || 300;
          const svgH = nodeY[N - 1] + COIN + 80;
          path.style.minHeight = svgH + "px";
          svgEl.setAttribute("viewBox", "0 0 " + cw + " " + svgH);
          svgEl.setAttribute("width", cw);
          svgEl.setAttribute("height", svgH);
          svgEl.style.cssText = "position:absolute;top:0;left:0;width:" + cw + "px;height:" + svgH + "px;pointer-events:none;z-index:0;overflow:visible;";

          const pts = Array.from({length: N}, (_, i) => ({
            x: (nodeX[i] / 100) * cw,
            y: nodeY[i] + COIN / 2
          }));

          let d = "M " + pts[0].x.toFixed(1) + " " + pts[0].y.toFixed(1);
          for (let i = 0; i < pts.length - 1; i++) {
            const a = pts[i], b = pts[i+1];
            const midY = ((a.y + b.y) / 2).toFixed(1);
            d += " C " + a.x.toFixed(1) + " " + midY + ", " + b.x.toFixed(1) + " " + midY + ", " + b.x.toFixed(1) + " " + b.y.toFixed(1);
          }

          svgEl.innerHTML = "";
          const pe = document.createElementNS("http://www.w3.org/2000/svg", "path");
          pe.setAttribute("d", d);
          svgEl.appendChild(pe);
        });
      }, 300);
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
            group: step.group,
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


    // ── LEARN SCREEN ─────────────────────────────────────────────────────
    // Shows Hanzi + pinyin + English for each word in the lesson
    // Tapping a word card reveals more detail
    const showLearnScreen = (difficulty, levelIndex, module) => {
      // Build learn screen dynamically over the levels page
      const existing = document.getElementById('learn-screen');
      if (existing) existing.remove();

      const lesson = getLesson();
      const group  = module.group || 'greetings';
      const phrases = lesson.phrases?.[group] || [];
      const vocab   = lesson.vocab || {};
      const rom     = lesson.romanization || {};
      const langLabel = state.languageKey === 'mandarin' ? '中文' : state.languageKey;

      // Build word list — from phrases first, then vocab
      const words = [];
      phrases.forEach(p => {
        words.push({ hanzi: p.target, pinyin: p.romanized, english: p.en, type: 'phrase' });
      });
      (module.newWords || []).forEach(w => {
        if (!words.find(x => x.hanzi === w)) {
          words.push({ hanzi: w, pinyin: rom[w] || '', english: vocab[w] || '', type: 'word' });
        }
      });
      // Fallback — show vocab words for the group
      if (!words.length) {
        Object.entries(vocab).slice(levelIndex * 4, levelIndex * 4 + 6).forEach(([h, en]) => {
          words.push({ hanzi: h, pinyin: rom[h] || '', english: en, type: 'word' });
        });
      }

      const screen = document.createElement('div');
      screen.id = 'learn-screen';
      screen.innerHTML = `
        <div class="learn-header">
          <button class="learn-back" id="learnBack">←</button>
          <div class="learn-title">${module.title}</div>
          <div class="learn-tag">Learn</div>
        </div>
        <div class="learn-body">
          <div class="learn-kicker">Tap any card to flip it</div>
          <div class="learn-grid" id="learnGrid"></div>
          <button class="btn btn-primary learn-done-btn" id="learnDone">
            Start Practice →
          </button>
        </div>
      `;

      document.body.appendChild(screen);
      requestAnimationFrame(() => screen.classList.add('open'));

      const grid = screen.querySelector('#learnGrid');
      words.forEach((w, i) => {
        const card = document.createElement('div');
        card.className = 'word-flip-card';
        card.innerHTML = `
          <div class="wfc-inner">
            <div class="wfc-front">
              <div class="wfc-hanzi">${w.hanzi}</div>
              <div class="wfc-pinyin">${w.pinyin || ''}</div>
            </div>
            <div class="wfc-back">
              <div class="wfc-english">${w.english}</div>
              <div class="wfc-pinyin-sm">${w.pinyin || ''}</div>
            </div>
          </div>
        `;
        card.addEventListener('click', () => card.classList.toggle('flipped'));
        grid.appendChild(card);
      });

      screen.querySelector('#learnBack').addEventListener('click', () => {
        screen.classList.remove('open');
        setTimeout(() => screen.remove(), 320);
      });

      screen.querySelector('#learnDone').addEventListener('click', () => {
        screen.classList.remove('open');
        setTimeout(() => { screen.remove(); startLesson(difficulty, levelIndex); }, 320);
      });
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
        savedWords: state.savedWords || {},
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
      state.savedWords = saved.savedWords && typeof saved.savedWords === "object" ? saved.savedWords : {};
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
      addOption.textContent = "+ Add profile";
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
      const learningContext = document.getElementById("learningContext");
      if (learningContext) learningContext.textContent = `You’re learning: ${module.title || "new phrases"}`;
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

      const diffIcons = { beginner: "🌱", intermediate: "⚡", advanced: "🔥", fluent: "🗣️", mastery: "🏆" };
      const nodeIcons = ["⭐", "📘", "🎯", "💬", "🔥"];
      DIFFICULTY_ORDER.forEach((difficulty, unitIndex) => {
        const unit = document.createElement("div");
        unit.className = "unit-block";
        unit.dataset.difficulty = difficulty;
        const diffModules = CURRICULUM[difficulty] || [];
        const completedInDiff = diffModules.filter(m => completedLevels.has(m.id)).length;
        unit.innerHTML = `<div class="unit-section-card">
          <div class="unit-section-icon">${diffIcons[difficulty]}</div>
          <div>
            <div class="unit-section-name">Unit ${unitIndex + 1} · ${DIFFICULTY_LABELS[difficulty]}</div>
            <div class="unit-section-sub">${completedInDiff}/${diffModules.length} completed</div>
          </div>
        </div>`;
        const path = document.createElement("div");
        path.className = "level-path";
        const maxUnlocked = unitIndex < diffIndex
          ? LEVELS_PER_DIFFICULTY - 1
          : unitIndex === diffIndex
            ? state.levelIndex + 1
            : -1;

        const modules = (lesson.levels?.[difficulty] || []).slice(0, LEVELS_PER_DIFFICULTY);
        const N = modules.length;

        // Coin positions: x% from left edge, y px from top
        const nodeX = [28, 68, 22, 72, 38];
        const nodeY = [24, 160, 296, 432, 568];
        const COIN  = 76;
        const HALF  = COIN / 2;

        // Draw dotted connector lines immediately with calculated positions
        const _cw = Math.min(window.innerWidth, 520) - 32;
        for (let i = 0; i < N - 1; i++) {
          const x1 = (nodeX[i]   / 100) * _cw + HALF;
          const y1 = nodeY[i]   + HALF;
          const x2 = (nodeX[i+1] / 100) * _cw + HALF;
          const y2 = nodeY[i+1] + HALF;
          const dx = x2 - x1, dy = y2 - y1;
          const len   = Math.sqrt(dx*dx + dy*dy);
          const angle = Math.atan2(dy, dx) * 180 / Math.PI;
          const line = document.createElement("div");
          line.className = "path-line";
          line.style.cssText =
            "position:absolute;" +
            "left:"   + x1.toFixed(1) + "px;" +
            "top:"    + (y1 - 2).toFixed(1) + "px;" +
            "width:"  + len.toFixed(1) + "px;" +
            "height:4px;" +
            "transform-origin:0 50%;" +
            "transform:rotate(" + angle.toFixed(2) + "deg);" +
            "z-index:-1;" +
            "border-radius:2px;" +
            "background:repeating-linear-gradient(90deg,#a090c0 0px,#a090c0 8px,transparent 8px,transparent 16px);";
          path.appendChild(line);
        }

        modules.forEach((module, mi) => {
          const isLocked = mi > maxUnlocked;
          const isDone   = completedLevels.has(module.id);
          const isActive = difficulty === state.difficulty && mi === state.levelIndex;

          const wrap = document.createElement("div");
          wrap.className = "node-group";
          wrap.style.cssText = "left:" + nodeX[mi] + "%;top:" + nodeY[mi] + "px;";

          // Progress ring for active node
          if (isActive) {
            const rs = 90, cx = 45, cy = 45, r = 41;
            const circ = 2 * Math.PI * r;
            const arc  = (circ * 0.32).toFixed(1);
            const ringEl = document.createElementNS("http://www.w3.org/2000/svg", "svg");
            ringEl.setAttribute("class", "coin-ring");
            ringEl.setAttribute("viewBox", "0 0 " + rs + " " + rs);
            ringEl.innerHTML =
              "<circle cx='" + cx + "' cy='" + cy + "' r='" + r + "' fill='none' stroke='rgba(255,255,255,.18)' stroke-width='4'/>" +
              "<circle cx='" + cx + "' cy='" + cy + "' r='" + r + "' fill='none' stroke='rgba(255,255,255,.88)' stroke-width='4.5' stroke-dasharray='" + arc + " " + circ.toFixed(1) + "' stroke-linecap='round' transform='rotate(-90 " + cx + " " + cy + ")'/>";
            wrap.appendChild(ringEl);
          }

          const btn = document.createElement("button");
          btn.type = "button";
          btn.className = "path-node" + (isLocked ? " locked" : isDone ? " done" : isActive ? " active" : "");
          btn.innerHTML = "<span class='node-num'>" + (isDone ? "✓" : (mi + 1)) + "</span>";
          btn.title = module.title;
          btn.setAttribute("aria-label", module.title);
          btn.addEventListener("click", () => { if (!isLocked) showLevelSheet(difficulty, mi, module, isDone); });
          wrap.appendChild(btn);

          if (isActive) {
            const sl = document.createElement("div");
            sl.className = "node-start-lbl";
            sl.textContent = "START";
            // Position above-left of coin like reference
            sl.style.cssText = "position:absolute;bottom:calc(100% + 2px);left:-8px;z-index:10;";
            wrap.appendChild(sl);
            const st = document.createElement("div");
            st.className = "node-stars";
            st.style.cssText = "position:absolute;bottom:calc(100% - 18px);left:-12px;z-index:10;";
            wrap.appendChild(st);
          }

          const lbl = document.createElement("div");
          lbl.className = "node-title-lbl";
          lbl.textContent = module.title;
          wrap.appendChild(lbl);

          path.appendChild(wrap);
        });

        // Position lines after appending to DOM using requestAnimationFrame
        window._positionLines = window._positionLines || null;
        const _positionLines = () => {
          // Don't rely on getBoundingClientRect — it returns 0 when view is hidden.
          // Calculate width directly from viewport.
          const shellW = Math.min(window.innerWidth, 520);
          const cw = shellW - 32; // subtract unit-block padding (16px each side)
          path.querySelectorAll(".path-line").forEach(line => {
            const fi = parseInt(line.dataset.fromIdx);
            const ti = parseInt(line.dataset.toIdx);
            const nx = JSON.parse(line.dataset.nodeX);
            const ny = JSON.parse(line.dataset.nodeY);

            const x1 = (nx[fi] / 100) * cw + HALF;
            const y1 = ny[fi] + HALF;
            const x2 = (nx[ti] / 100) * cw + HALF;
            const y2 = ny[ti] + HALF;

            const dx = x2 - x1, dy = y2 - y1;
            const len = Math.sqrt(dx*dx + dy*dy);
            const angle = Math.atan2(dy, dx) * 180 / Math.PI;

            line.style.cssText = [
              "position:absolute",
              "left:" + x1.toFixed(1) + "px",
              "top:" + (y1 - 2).toFixed(1) + "px",
              "width:" + len.toFixed(1) + "px",
              "height:4px",
              "transform-origin:0 50%",
              "transform:rotate(" + angle.toFixed(2) + "deg)",
              "z-index:0",
              "border-radius:2px"
            ].join(";");
          });
          const svgH = ny[N-1] + COIN + 100;
          path.style.minHeight = svgH + "px";
        };

        window._positionLines = _positionLines;
        requestAnimationFrame(() => requestAnimationFrame(_positionLines));
        setTimeout(_positionLines, 200);
        setTimeout(_positionLines, 600);
        window.addEventListener("resize", _positionLines, {passive:true});

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
        setTimeout(() => { if (window._positionLines) window._positionLines(); }, 80);
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
      // Quiet mode is scoped to a single lesson — it ends with the lesson.
      if (state.quietMode) {
        state.quietMode = false;
        syncQuietUI();
      }
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
          <div class="completion-water" aria-hidden="true"><span class="wc-drop d1"></span><span class="wc-drop d2"></span><span class="wc-drop d3"></span><span class="wc-leaf"></span></div>
          <h2 class="completion-title">Lesson Complete!</h2>
          <p class="completion-plant-note">Your plant was watered — a new leaf unfurled.</p>
          ${moduleTitle ? `<p class="completion-module">${moduleTitle}</p>` : ''}
          <div class="completion-stats">
            <div class="completion-stat">
              <span class="stat-big">+${xpEarned}</span>
              <span class="stat-label">XP earned</span>
            </div>
            <div class="completion-stat">
              <span class="stat-big">${streak}</span>
              <span class="stat-label">day streak</span>
            </div>
            <div class="completion-stat">
              <span class="stat-big">${state.hearts}</span>
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
      addTotalXp(state.sessionXp);
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

    let sheetPendingDifficulty = null;
    let sheetPendingIdx = null;

    const showLevelSheet = (difficulty, idx, module, isDone) => {
      if (!levelSheet) return;
      sheetPendingDifficulty = difficulty;
      sheetPendingIdx = idx;
      const groupIcons = { greetings: "👋", polite: "🙏", directions: "🗺", cafe: "☕", travel: "✈️", shopping: "🛍", plans: "📅", opinions: "💬", problems: "🆘" };
      const diffIcons = { beginner: "🌱", intermediate: "⚡", advanced: "🔥", fluent: "🗣️", mastery: "🏆" };
      const icon = groupIcons[module.group] || diffIcons[difficulty] || "⭐";
      if (sheetIcon) sheetIcon.textContent = icon;
      if (sheetIconWrap) {
        sheetIconWrap.style.background = isDone ? "var(--green-light)" : "";
        sheetIconWrap.style.borderColor = isDone ? "var(--green)" : "";
        sheetIconWrap.style.boxShadow = isDone ? "0 4px 0 var(--green-dark)" : "";
      }
      if (sheetTitle) sheetTitle.textContent = module.title;
      if (sheetDesc) sheetDesc.textContent = module.description || "";
      if (sheetStarBadge) {
        sheetStarBadge.textContent = isDone ? "★★★" : "☆☆☆";
        sheetStarBadge.style.background = isDone ? "var(--yellow-light)" : "var(--surface)";
        sheetStarBadge.style.color = isDone ? "var(--yellow-dark)" : "var(--muted)";
        sheetStarBadge.style.borderColor = isDone ? "var(--yellow)" : "var(--border)";
      }
      if (sheetStartBtn) sheetStartBtn.textContent = isDone ? "Practice Again" : "Start Lesson";
      levelSheet.classList.add("open");
    };

    const closeLevelSheet = () => {
      if (!levelSheet) return;
      levelSheet.classList.remove("open");
      sheetPendingDifficulty = null;
      sheetPendingIdx = null;
    };

    const renderStatsView = () => {
      if (!statsStreakBig) return;
      const streak = getStreakCount();
      const completedCount = getCompletedLevels().size;
      statsStreakBig.textContent = streak;
      if (statsXpVal) statsXpVal.textContent = getTotalXp();
      if (statsDoneVal) statsDoneVal.textContent = completedCount;

      if (weekDots) {
        weekDots.innerHTML = "";
        const dayNames = ["M","T","W","T","F","S","S"];
        const today = new Date();
        const dow = today.getDay(); // 0=Sun
        const streak_data = loadStreak();
        const todayStr = getTodayStr();
        for (let i = 0; i < 7; i++) {
          const d = new Date(today);
          const offset = ((dow === 0 ? 7 : dow) - 1) - i;
          d.setDate(today.getDate() - offset + i - ((dow === 0 ? 7 : dow) - 1));
          // Simpler: go from Monday of this week
          const monday = new Date(today);
          monday.setDate(today.getDate() - ((today.getDay() + 6) % 7));
          const day = new Date(monday);
          day.setDate(monday.getDate() + i);
          const dayStr = day.toDateString();
          const isDone = streak_data.lastDate === dayStr || (dayStr === todayStr && streak_data.lastDate === todayStr);
          const wrap = document.createElement("div");
          wrap.className = "week-dot-wrap";
          const dot = document.createElement("div");
          dot.className = "week-dot" + (isDone ? " done" : "");
          dot.textContent = isDone ? "🔥" : "";
          const label = document.createElement("div");
          label.className = "week-dot-label";
          label.textContent = dayNames[i];
          wrap.appendChild(dot);
          wrap.appendChild(label);
          weekDots.appendChild(wrap);
        }
      }

      if (unitProgressList) {
        unitProgressList.innerHTML = "";
        const completedLevels = getCompletedLevels();
        const diffColors = { beginner: "var(--green)", intermediate: "var(--blue)", advanced: "var(--orange)" };
        DIFFICULTY_ORDER.forEach((diff) => {
          const modules = CURRICULUM[diff] || [];
          const done = modules.filter(m => completedLevels.has(m.id)).length;
          const pct = modules.length ? Math.round((done / modules.length) * 100) : 0;
          const item = document.createElement("div");
          item.className = "unit-progress-item";
          item.innerHTML = `
            <div class="unit-progress-header">
              <span class="unit-progress-name">${DIFFICULTY_LABELS[diff]}</span>
              <span class="unit-progress-pct">${done}/${modules.length}</span>
            </div>
            <div class="unit-progress-bar">
              <div class="unit-progress-fill" style="width:0%;background:${diffColors[diff]}"></div>
            </div>`;
          unitProgressList.appendChild(item);
          // Animate bar in after paint
          requestAnimationFrame(() => {
            const fill = item.querySelector(".unit-progress-fill");
            if (fill) fill.style.width = pct + "%";
          });
        });
      }
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

    const AZURE_VOICE_MAP = {
      "zh-CN": "zh-CN-XiaoxiaoNeural",
      "es-ES": "es-ES-ElviraNeural",
      "fr-FR": "fr-FR-DeniseNeural",
      "de-DE": "de-DE-KatjaNeural",
      "ja-JP": "ja-JP-NanamiNeural",
      "ko-KR": "ko-KR-SunHiNeural",
      "it-IT": "it-IT-ElsaNeural"
    };

    // Cache decoded audio buffers to avoid re-fetching
    const _azureCache = {};
    let _azureCtx = null;
    const _getAudioCtx = () => {
      if (!_azureCtx || _azureCtx.state === "closed") {
        _azureCtx = new (window.AudioContext || window.webkitAudioContext)();
      }
      if (_azureCtx.state === "suspended") _azureCtx.resume();
      return _azureCtx;
    };

    const _speakAzure = async (text, lang, rate) => {
      const region = state.azureRegion || "eastus";
      const key    = state.azureKey;
      if (!key) return false;

      const voiceName = AZURE_VOICE_MAP[lang] || "en-US-JennyNeural";
      const cacheKey  = `${voiceName}:${rate}:${text}`;
      try {
        let arrayBuf = _azureCache[cacheKey];
        if (!arrayBuf) {
          const ssml = "<speak version='1.0' xml:lang='" + lang + "'><voice name='" + voiceName + "'><prosody rate='" + (rate < 1 ? (Math.round((rate - 1) * 100) + "%") : (rate > 1 ? "+" + Math.round((rate - 1) * 100) + "%" : "0%")) + "'>" + text.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;") + "</prosody></voice></speak>";

          const res = await fetch(
            "https://" + region + ".tts.speech.microsoft.com/cognitiveservices/v1",
            {
              method: "POST",
              headers: {
                "Ocp-Apim-Subscription-Key": key,
                "Content-Type": "application/ssml+xml",
                "X-Microsoft-OutputFormat": "audio-24khz-48kbitrate-mono-mp3"
              },
              body: ssml
            }
          );
          if (!res.ok) { console.warn("Azure TTS error:", res.status); return false; }
          arrayBuf = await res.arrayBuffer();
          if (Object.keys(_azureCache).length < 200) _azureCache[cacheKey] = arrayBuf;
        }

        const ctx    = _getAudioCtx();
        const decoded = await ctx.decodeAudioData(arrayBuf.slice(0));
        const src    = ctx.createBufferSource();
        src.buffer   = decoded;
        src.connect(ctx.destination);
        src.start(0);
        return true;
      } catch (e) {
        console.warn("Azure TTS failed:", e);
        return false;
      }
    };

    const _speakNative = (text, lang, rate) => {
      if (!window.speechSynthesis) return;
      const utterance  = new SpeechSynthesisUtterance(text);
      utterance.lang   = lang;
      utterance.rate   = rate;
      const voices     = window.speechSynthesis.getVoices();
      const preferred  = state.activeVoiceName || state.voiceName;
      const match =
        (preferred ? voices.find((v) => v.name === preferred) : null) ||
        voices.find((v) => v.lang === lang) ||
        voices.find((v) => v.lang.startsWith(lang.split("-")[0]));
      if (match) utterance.voice = match;
      speechSynthesis.cancel();
      speechSynthesis.speak(utterance);
    };

    const speak = async (text, force = false) => {
      if (state.quietMode) return; // quiet mode: no audio at all
      if (!state.audioEnabled && !force) return;
      const lesson = getLesson();
      const lang   = lesson.voice || "zh-CN";
      const rate   = state.speechRate || 1.0;
      // Try Azure first; fall back to Web Speech
      if (state.azureKey) {
        const ok = await _speakAzure(text, lang, rate);
        if (ok) return;
      }
      _speakNative(text, lang, rate);
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
      document.querySelectorAll("#progressMilestones i").forEach((dot, i) => {
        dot.classList.toggle("lit", percent >= (i + 1) * 25);
      });
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
      // Quiet mode: speaking tasks become sentence-building for this lesson
      if (state.quietMode) {
        const pending = state.tasks[state.index];
        if (pending && pending.type === "speak") {
          const words = (pending.answer || "").split(/\s+/).filter(Boolean);
          state.tasks[state.index] = { ...pending, type: "build", words: shuffle(words.length ? words : [pending.answer || ""]) };
        }
      }
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
      if (state.currentAudio && !state.quietMode) {
        speak(state.currentAudio);
      }
      updateStatus();
      syncLessonAids();
      resetLessonTools();
      syncCompanion();
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
        companionReact("happy");
      } else {
        state.hearts = Math.max(0, state.hearts - 1);
        showAnswerFeedback(task, false);
        companionReact("worried");
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
      syncLessonAids();
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

    // ── Quiet mode — a lesson-scoped toggle, never persisted ──
    const quietToggle = document.getElementById("quietToggle");
    const syncQuietUI = () => {
      if (!quietToggle) return;
      quietToggle.classList.toggle("on", !!state.quietMode);
      quietToggle.setAttribute("aria-pressed", state.quietMode ? "true" : "false");
      const label = quietToggle.querySelector(".quiet-label");
      if (label) label.textContent = state.quietMode ? "Quiet mode on" : "I can’t speak or listen right now";
      if (viewLessonEl) viewLessonEl.classList.toggle("quiet-on", !!state.quietMode);
    };
    if (quietToggle) {
      quietToggle.addEventListener("click", () => {
        state.quietMode = !state.quietMode;
        syncQuietUI();
        if (state.quietMode) {
          try { window.speechSynthesis?.cancel(); } catch (_) { /* no-op */ }
          const current = state.tasks[state.index];
          if (current && current.type === "speak" && !state.pendingAdvance) renderTask();
        }
      });
      syncQuietUI();
    }

    // ── Plant companion — grows with completed lessons ────────
    const companionEl = document.getElementById("companion");

    const syncCompanion = () => {
      if (!companionEl) return;
      const n = getCompletedLevels().size;
      const stage = n >= 10 ? 4 : n >= 6 ? 3 : n >= 3 ? 2 : n >= 1 ? 1 : 0;
      companionEl.classList.remove("stage-0", "stage-1", "stage-2", "stage-3", "stage-4");
      companionEl.classList.add("stage-" + stage);
    };

    const companionReact = (mood) => {
      if (!companionEl) return;
      companionEl.classList.remove("happy", "worried");
      void companionEl.offsetWidth;
      companionEl.classList.add(mood);
      clearTimeout(companionEl._moodTimer);
      companionEl._moodTimer = setTimeout(() => companionEl.classList.remove(mood), 2200);
    };

    syncCompanion();

    // ── Learning tools — hint, example, new word ──────────────
    const hintBtn = document.getElementById("hintBtn");
    const exampleBtn = document.getElementById("exampleBtn");
    const newWordBtn = document.getElementById("newWordBtn");
    const HINT_COST = 5;
    let hintLevel = 0;

    const resetLessonTools = () => {
      hintLevel = 0;
      hideWordPop();
    };

    const positionToolPop = (pop, anchor) => {
      const rect = anchor.getBoundingClientRect();
      const pw = pop.offsetWidth;
      let left = rect.left + rect.width / 2 - pw / 2;
      left = Math.max(10, Math.min(left, window.innerWidth - pw - 10));
      let top = rect.top - pop.offsetHeight - 12;
      if (top < 8) top = rect.bottom + 12;
      pop.style.left = left + "px";
      pop.style.top = top + "px";
    };

    const showToolPop = (anchor, html, extraClass = "") => {
      hideWordPop();
      const pop = document.createElement("div");
      pop.className = "word-pop tool-pop" + (extraClass ? " " + extraClass : "");
      pop.innerHTML = html;
      document.body.appendChild(pop);
      positionToolPop(pop, anchor);
      const dismiss = (event) => {
        if (pop.contains(event.target)) return;
        hideWordPop();
        document.removeEventListener("pointerdown", dismiss, true);
      };
      setTimeout(() => document.addEventListener("pointerdown", dismiss, true), 0);
      return pop;
    };

    const importantToken = (answer) =>
      (answer || "").split(/\s+/).filter(Boolean).sort((a, b) => b.length - a.length)[0] || "";

    const findSimilarItem = (task) => {
      const items = (getModule().items || []).filter((item) => item.target && item.target !== task.answer);
      const tagged = items.filter((item) => item.tags?.some((tag) => task.tags?.includes(tag)));
      return (tagged.length ? tagged : items)[0] || null;
    };

    if (hintBtn) hintBtn.addEventListener("click", () => {
      const task = state.tasks[state.index];
      if (!task || !task.answer || task.type === "match") {
        showToolPop(hintBtn, '<div class="word-pop-def">No hints here — trust your memory on this one.</div>');
        return;
      }
      if (hintLevel < 4) {
        hintLevel += 1;
        state.xp = Math.max(0, state.xp - HINT_COST);
        updateStatus();
      }
      const tokens = task.answer.split(/\s+/).filter(Boolean);
      const rows = [];
      rows.push(`<div class="hint-row"><b>1 · First letter</b><span>${escapeHTML(task.answer.trim().charAt(0))}…</span></div>`);
      if (hintLevel >= 2) {
        const shape = tokens.map((t) => "＿".repeat(Math.min([...t].length, 8))).join("&ensp;");
        rows.push(`<div class="hint-row"><b>2 · Shape</b><span>${shape}</span></div>`);
      }
      if (hintLevel >= 3) {
        const key = importantToken(task.answer);
        const rom = getRomanizationForText(key);
        rows.push(`<div class="hint-row"><b>3 · Key word</b><span>${escapeHTML(key)}${rom ? ` <i>${escapeHTML(rom)}</i>` : ""}</span></div>`);
      }
      if (hintLevel >= 4) {
        const sim = findSimilarItem(task);
        if (sim) rows.push(`<div class="hint-row"><b>4 · Similar</b><span>${escapeHTML(sim.target)}${sim.romanized ? ` <i>${escapeHTML(sim.romanized)}</i>` : ""} — ${escapeHTML(sim.en || "")}</span></div>`);
      }
      showToolPop(hintBtn,
        rows.join("") +
        `<div class="hint-foot">${hintLevel < 4 ? "Tap again for the next hint · " : ""}−${HINT_COST} XP each</div>`,
        "hint-pop");
    });

    if (exampleBtn) exampleBtn.addEventListener("click", () => {
      const task = state.tasks[state.index];
      const pool = (getModule().items || []).filter((item) => item.target && item.target !== task?.answer);
      const picks = shuffle(pool.slice()).slice(0, 3);
      if (!picks.length) {
        showToolPop(exampleBtn, '<div class="word-pop-def">No extra examples in this unit yet.</div>');
        return;
      }
      const html = picks.map((item, i) =>
        `<button type="button" class="example-row" data-say="${escapeHTML(item.target)}">
           <span class="ex-native">${escapeHTML(item.target)}</span>
           ${item.romanized ? `<span class="ex-pinyin">${escapeHTML(item.romanized)}</span>` : ""}
           <span class="ex-en">${escapeHTML(item.en || "")}</span>
         </button>`).join("");
      const pop = showToolPop(exampleBtn, `<div class="tool-pop-title">From this unit</div>${html}<div class="hint-foot">${state.quietMode ? "Quiet mode — audio paused" : "Tap a sentence to hear it"}</div>`, "example-pop");
      pop.querySelectorAll(".example-row").forEach((row) => {
        row.addEventListener("click", (event) => {
          event.stopPropagation();
          speak(row.dataset.say, true);
        });
      });
    });

    if (newWordBtn) newWordBtn.addEventListener("click", () => {
      const chip = viewLessonEl?.querySelector(".word-chip.new-word");
      if (!chip) {
        showToolPop(newWordBtn, '<div class="word-pop-def">No new words in this task — keep going, more are on the way.</div>');
        return;
      }
      const word = chip.dataset.word || chip.textContent;
      const key = normalize(word);
      const definition = chip.dataset.definition || "New word";
      const rom = getRomanizationForText(word);
      const exampleItem = (getModule().items || []).find((item) => item.target && item.target.includes(word));
      state.savedWords = state.savedWords || {};
      const saved = !!state.savedWords[key];
      const pop = showToolPop(newWordBtn,
        `<div class="word-pop-badge">New word</div>
         <div class="word-pop-word">${escapeHTML(word)}</div>
         ${rom ? `<div class="word-pop-pinyin">${escapeHTML(rom)}</div>` : ""}
         <div class="word-pop-def">${escapeHTML(definition)}</div>
         ${exampleItem ? `<div class="vocab-example">${escapeHTML(exampleItem.target)}${exampleItem.romanized ? ` <i>${escapeHTML(exampleItem.romanized)}</i>` : ""}<em>${escapeHTML(exampleItem.en || "")}</em></div>` : ""}
         <div class="vocab-actions">
           <button type="button" class="vocab-say">Hear it</button>
           <button type="button" class="vocab-save${saved ? " saved" : ""}">${saved ? "Saved ✓" : "Save word"}</button>
         </div>`,
        "word-pop-new vocab-pop");
      pop.querySelector(".vocab-say")?.addEventListener("click", (event) => {
        event.stopPropagation();
        speak(word, true);
      });
      pop.querySelector(".vocab-save")?.addEventListener("click", (event) => {
        event.stopPropagation();
        const btn = event.currentTarget;
        state.savedWords[key] = !state.savedWords[key];
        saveProgress();
        btn.classList.toggle("saved", !!state.savedWords[key]);
        btn.textContent = state.savedWords[key] ? "Saved ✓" : "Save word";
      });
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

    // Azure TTS key/region wiring
    const azureKeyInput    = document.getElementById("azureKeyInput");
    const azureRegionInput = document.getElementById("azureRegionInput");
    if (azureKeyInput) {
      azureKeyInput.value = state.azureKey || "";
      azureKeyInput.addEventListener("input", () => {
        state.azureKey = azureKeyInput.value.trim();
        localStorage.setItem("linguabloom-azure-key", state.azureKey);
        if (saveStatus) saveStatus.textContent = state.azureKey ? "Azure key saved ✓" : "Key cleared";
        setTimeout(() => { if (saveStatus) saveStatus.textContent = "Progress saved"; }, 2000);
      });
    }
    if (azureRegionInput) {
      azureRegionInput.value = state.azureRegion || "eastus";
      azureRegionInput.addEventListener("input", () => {
        state.azureRegion = azureRegionInput.value.trim() || "eastus";
        localStorage.setItem("linguabloom-azure-region", state.azureRegion);
      });
    }

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

    if (sheetStartBtn) {
      sheetStartBtn.addEventListener("click", () => {
        const diff = sheetPendingDifficulty;
        const idx = sheetPendingIdx;
        closeLevelSheet();
        if (diff !== null && idx !== null) startLesson(diff, idx);
      });
    }

    if (levelSheetBackdrop) {
      levelSheetBackdrop.addEventListener("click", closeLevelSheet);
    }

    if (navLearnBtn) {
      navLearnBtn.addEventListener("click", () => {
        navLearnBtn.classList.add("active");
        navStatsBtn?.classList.remove("active");
        viewLevels?.classList.add("active");
        viewStats?.classList.remove("active");
      });
    }

    if (navStatsBtn) {
      navStatsBtn.addEventListener("click", () => {
        navStatsBtn.classList.add("active");
        navLearnBtn?.classList.remove("active");
        viewStats?.classList.add("active");
        viewLevels?.classList.remove("active");
        renderStatsView();
      });
    }

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
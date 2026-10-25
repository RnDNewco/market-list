"use strict";

const APP_VERSION = "2.0.0";
const LOCAL_KEY = "market_list_pwa_v2";
const LEGACY_KEYS = ["market_list_pwa_v1","garyfalia_market_app_v6","garyfalia_market_app_v5","garyfalia_market_app_v4"];
const DB_NAME = "market_list_db_v2";
const DB_STORE = "state";
const DB_KEY = "main";
const $ = id => document.getElementById(id);
const CATEGORIES = ["Πρωτεΐνη / Ψυγείο","Φρούτα & Λαχανικά","Κατεψυγμένα / Γρήγορα","Ψωμί / Snacks","Ποτά","Προσωπική φροντίδα","Σπίτι","Άλλο"];

const CATALOG = [
  {id:"monster",name:"Monster Ultra",cat:"Ποτά",icon:"⚡",seed:1.12,hot:true,family:"energy_drink",stockable:true,threshold:2,defaultQty:3},
  {id:"proteinbar",name:"Μπάρες πρωτεΐνης",cat:"Ψωμί / Snacks",icon:"💪",seed:3.95,hot:true,family:"protein_bar",stockable:true,threshold:1,defaultQty:1},
  {id:"breadsticks",name:"Κριτσίνια με ηλιόσπορο",cat:"Ψωμί / Snacks",icon:"🥖",seed:1.85,hot:true,family:"breadsticks",stockable:true,threshold:1,defaultQty:1},
  {id:"eggs",name:"Αυγά",cat:"Πρωτεΐνη / Ψυγείο",icon:"🥚",seed:null,hot:true,family:"eggs",stockable:false,defaultQty:1},
  {id:"yogurt",name:"Γιαούρτι 2%",cat:"Πρωτεΐνη / Ψυγείο",icon:"🥛",seed:null,hot:true,family:"yogurt",stockable:false,defaultQty:1},
  {id:"cottage",name:"Cottage cheese",cat:"Πρωτεΐνη / Ψυγείο",icon:"🧀",seed:null,hot:true,family:"cottage",stockable:false,defaultQty:1},
  {id:"turkey",name:"Γαλοπούλα βραστή",cat:"Πρωτεΐνη / Ψυγείο",icon:"🥪",seed:null,hot:true,family:"deli_turkey",stockable:false,defaultQty:1},
  {id:"lightcheese",name:"Τυρί light / Gouda",cat:"Πρωτεΐνη / Ψυγείο",icon:"🧀",seed:null,hot:false,family:"cheese",stockable:false,defaultQty:1},
  {id:"chickenburgers",name:"Μπιφτέκια κοτόπουλο",cat:"Πρωτεΐνη / Ψυγείο",icon:"🍗",seed:null,hot:true,family:"burgers",stockable:false,defaultQty:1},
  {id:"turkeyburgers",name:"Μπιφτέκια γαλοπούλας με ρύζι",cat:"Πρωτεΐνη / Ψυγείο",icon:"🍔",seed:null,hot:false,family:"burgers",stockable:false,defaultQty:1},
  {id:"chickenthighs",name:"Μπούτια κοτόπουλο ψημένα",cat:"Πρωτεΐνη / Ψυγείο",icon:"🍗",seed:null,hot:false,family:"chicken",stockable:false,defaultQty:1},
  {id:"tuna",name:"Τόνος κονσέρβα",cat:"Πρωτεΐνη / Ψυγείο",icon:"🐟",seed:null,hot:false,family:"tuna",stockable:true,threshold:1,defaultQty:2},
  {id:"tunasalad",name:"Τονοσαλάτα",cat:"Πρωτεΐνη / Ψυγείο",icon:"🐟",seed:null,hot:false,family:"tuna",stockable:false,defaultQty:1},
  {id:"sausages",name:"Λουκάνικα",cat:"Πρωτεΐνη / Ψυγείο",icon:"🌭",seed:null,hot:false,family:"sausages",stockable:false,defaultQty:1},

  {id:"tomatoes",name:"Ντοματίνια",cat:"Φρούτα & Λαχανικά",icon:"🍅",seed:null,hot:true,family:"tomato",stockable:false,defaultQty:1},
  {id:"tomatoes_regular",name:"Ντομάτες",cat:"Φρούτα & Λαχανικά",icon:"🍅",seed:null,hot:false,family:"tomato",stockable:false,defaultQty:1},
  {id:"cucumber",name:"Αγγούρι",cat:"Φρούτα & Λαχανικά",icon:"🥒",seed:null,hot:true,family:"cucumber",stockable:false,defaultQty:1},
  {id:"bananas",name:"Μπανάνες",cat:"Φρούτα & Λαχανικά",icon:"🍌",seed:null,hot:true,family:"banana",stockable:false,defaultQty:1},
  {id:"grapes",name:"Σταφύλια",cat:"Φρούτα & Λαχανικά",icon:"🍇",seed:null,hot:false,family:"grapes",stockable:false,defaultQty:1},
  {id:"apples",name:"Μήλα",cat:"Φρούτα & Λαχανικά",icon:"🍎",seed:null,hot:false,family:"apples",stockable:false,defaultQty:1},
  {id:"garlic",name:"Σκόρδο",cat:"Φρούτα & Λαχανικά",icon:"🧄",seed:null,hot:false,family:"garlic",stockable:true,threshold:1,defaultQty:1},
  {id:"salad_cabbage",name:"Σαλάτα λάχανο-καρότο",cat:"Φρούτα & Λαχανικά",icon:"🥗",seed:null,hot:false,family:"salad",stockable:false,defaultQty:1},

  {id:"riceveg",name:"Ρύζι με λαχανικά",cat:"Κατεψυγμένα / Γρήγορα",icon:"🍚",seed:null,hot:true,family:"rice_veg",stockable:true,threshold:1,defaultQty:1},
  {id:"frozenveg",name:"Κατεψυγμένα λαχανικά",cat:"Κατεψυγμένα / Γρήγορα",icon:"🥦",seed:null,hot:false,family:"frozen_veg",stockable:true,threshold:1,defaultQty:1},
  {id:"tortellini",name:"Τορτελίνια",cat:"Κατεψυγμένα / Γρήγορα",icon:"🍝",seed:1.65,hot:true,family:"tortellini",stockable:true,threshold:1,defaultQty:1},
  {id:"mushrooms",name:"Μανιτάρια κομμένα",cat:"Κατεψυγμένα / Γρήγορα",icon:"🍄",seed:null,hot:false,family:"mushrooms",stockable:true,threshold:1,defaultQty:1},
  {id:"passata",name:"Passata / χυμός ντομάτας",cat:"Κατεψυγμένα / Γρήγορα",icon:"🍅",seed:null,hot:false,family:"passata",stockable:true,threshold:1,defaultQty:1},

  {id:"tortillas",name:"Τορτίγιες ολικής",cat:"Ψωμί / Snacks",icon:"🌯",seed:null,hot:true,family:"tortillas",stockable:true,threshold:1,defaultQty:1},
  {id:"toast",name:"Ψωμί τοστ / ολικής",cat:"Ψωμί / Snacks",icon:"🍞",seed:null,hot:true,family:"bread",stockable:true,threshold:1,defaultQty:1},
  {id:"popcorn",name:"Popcorn / καλαμπόκι",cat:"Ψωμί / Snacks",icon:"🍿",seed:null,hot:true,family:"popcorn",stockable:true,threshold:1,defaultQty:1},
  {id:"chocolate",name:"Κάτι σοκολατένιο",cat:"Ψωμί / Snacks",icon:"🍫",seed:null,hot:true,family:"chocolate",stockable:false,defaultQty:1},
  {id:"serenata",name:"Serenata φουντούκι",cat:"Ψωμί / Snacks",icon:"🍫",seed:null,hot:false,family:"chocolate",stockable:false,defaultQty:1},
  {id:"ionwafer",name:"Σοκοφρέτα ΙΟΝ φουντούκι",cat:"Ψωμί / Snacks",icon:"🍫",seed:null,hot:false,family:"chocolate",stockable:false,defaultQty:1},
  {id:"kitkat",name:"KitKat",cat:"Ψωμί / Snacks",icon:"🍫",seed:null,hot:false,family:"chocolate",stockable:false,defaultQty:1},
  {id:"softkings",name:"Soft Kings",cat:"Ψωμί / Snacks",icon:"🍪",seed:null,hot:false,family:"chocolate",stockable:false,defaultQty:1},

  {id:"cokezero",name:"Coca-Cola Zero",cat:"Ποτά",icon:"🥤",seed:null,hot:true,family:"soft_drink",stockable:true,threshold:2,defaultQty:2},
  {id:"schweppes",name:"Schweppes Zero",cat:"Ποτά",icon:"🍋",seed:null,hot:false,family:"soft_drink",stockable:true,threshold:2,defaultQty:2},
  {id:"coffee",name:"Καφές",cat:"Ποτά",icon:"☕",seed:null,hot:false,family:"coffee",stockable:true,threshold:1,defaultQty:1},
  {id:"water",name:"Νερό",cat:"Ποτά",icon:"💧",seed:null,hot:false,family:"water",stockable:true,threshold:1,defaultQty:1},

  {id:"bref",name:"Αρωματικά λεκάνης",cat:"Σπίτι",icon:"🧼",seed:null,hot:true,family:"toilet_freshener",stockable:true,threshold:1,defaultQty:1},
  {id:"softener",name:"Μαλακτικό ρούχων",cat:"Σπίτι",icon:"🧺",seed:null,hot:true,family:"softener",stockable:true,threshold:1,defaultQty:1},
  {id:"detergent",name:"Απορρυπαντικό ρούχων",cat:"Σπίτι",icon:"🧴",seed:null,hot:false,family:"detergent",stockable:true,threshold:1,defaultQty:1},
  {id:"paper",name:"Χαρτί κουζίνας",cat:"Σπίτι",icon:"🧻",seed:null,hot:false,family:"paper",stockable:true,threshold:1,defaultQty:1},
  {id:"airwick",name:"Air Wick / αρωματικό χώρου",cat:"Σπίτι",icon:"🌸",seed:null,hot:false,family:"air_freshener",stockable:true,threshold:1,defaultQty:1},
  {id:"carfreshener",name:"Αρωματικό αυτοκινήτου",cat:"Σπίτι",icon:"🚗",seed:null,hot:false,family:"car_freshener",stockable:true,threshold:1,defaultQty:1},

  {id:"shampoo",name:"Σαμπουάν",cat:"Προσωπική φροντίδα",icon:"🧴",seed:null,hot:false,family:"shampoo",stockable:true,threshold:1,defaultQty:1},
  {id:"deodorant",name:"Αποσμητικό",cat:"Προσωπική φροντίδα",icon:"🧴",seed:null,hot:false,family:"deodorant",stockable:true,threshold:1,defaultQty:1},
  {id:"tampons",name:"Ταμπόν",cat:"Προσωπική φροντίδα",icon:"🩷",seed:null,hot:false,family:"tampons",stockable:true,threshold:1,defaultQty:1},
  {id:"hairoil",name:"Λάδι μαλλιών",cat:"Προσωπική φροντίδα",icon:"🧴",seed:null,hot:false,family:"haircare",stockable:true,threshold:1,defaultQty:1}
];

function defaultState(){
  return {version:2,items:[],history:[],priceHistory:{},custom:[],inventory:{},pins:[],budget:50,theme:"light",shopping:false,lastSaved:null};
}
let state = defaultState();
let currentScreen = "list";
let listFilter = "need";
let catalogCategory = "Συχνά";
let editingId = null;
let deferredInstall = null;
let swRegistration = null;
let undoSnapshot = null;
let undoTimer = null;
let selectedSuggestions = new Set();

const norm=s=>String(s||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().trim();
const euro=v=>new Intl.NumberFormat("el-GR",{style:"currency",currency:"EUR"}).format(Number(v)||0);
const uid=()=>crypto.randomUUID?crypto.randomUUID():`i_${Date.now()}_${Math.random().toString(36).slice(2)}`;
const clamp=(n,min=0)=>Math.max(min,Number(n)||0);
const fmtDate=v=>{try{return new Intl.DateTimeFormat("el-GR",{day:"2-digit",month:"2-digit",year:"numeric"}).format(new Date(v))}catch{return "—"}};
const daysSince=v=>v?Math.max(0,(Date.now()-new Date(v).getTime())/86400000):9999;


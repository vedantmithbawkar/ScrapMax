'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Navbar from '@/components/common/Navbar';
import BottomNav from '@/components/common/BottomNav';
import {
  ShieldAlert,
  Flame,
  BatteryCharging,
  Tv,
  FlaskConical,
  Volume2,
  VolumeX,
  ArrowLeft,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  PhoneCall,
  Sparkles,
  Printer,
  Glasses,
  HeartPulse,
} from 'lucide-react';

type Lang = 'hi' | 'mr' | 'en';

interface HazardTopic {
  id: string;
  icon: string;
  categoryName: { en: string; hi: string; mr: string };
  badge: { en: string; hi: string; mr: string };
  dangerTitle: { en: string; hi: string; mr: string };
  hazards: { en: string[]; hi: string[]; mr: string[] };
  donts: { en: string[]; hi: string[]; mr: string[] };
  dos: { en: string[]; hi: string[]; mr: string[] };
  economicTip: { en: string; hi: string; mr: string };
  speechText: { en: string; hi: string; mr: string };
}

const SAFETY_TOPICS: HazardTopic[] = [
  {
    id: 'batteries',
    icon: '🔋',
    categoryName: {
      en: 'Batteries & Lithium Accumulators',
      hi: 'बैटरी और लिथियम सेल (Batteries & Lithium)',
      mr: 'बॅटरी आणि लिथियम सेल्स (Batteries)',
    },
    badge: {
      en: 'High Fire & Explosion Risk',
      hi: 'विस्फोट और आग का भारी खतरा',
      mr: 'स्फोट व आगीचा मोठा धोका',
    },
    dangerTitle: {
      en: 'Thermal Runaway & Corrosive Acid Burns',
      hi: 'थर्मल रनअवे, जहरीला धुआं और एसिड बर्न',
      mr: 'थर्मल रनअवे, विषारी धूर आणि ऍसिड बर्न',
    },
    hazards: {
      en: [
        'Lithium batteries burst into explosive 1,200°C fires if punctured, crushed, or heated.',
        'Emits deadly Hydrofluoric acid (HF) gas causing severe internal lung damage.',
        'Lead-acid batteries contain corrosive sulfuric acid that destroys skin and eyes permanently.',
      ],
      hi: [
        'हथौड़े से पीटने या आग में फेंकने पर लिथियम बैटरी 1200°C के धमाके के साथ फटती है।',
        'इससे जहरीली हाइड्रोफ्लोरिक (HF) गैस निकलती है जो फेफड़ों को गला देती है।',
        'लेड-एसिड बैटरी से निकलने वाला तेजाब त्वचा और आंखों को स्थायी रूप से जला देता है।',
      ],
      mr: [
        'हातोड्याने फोडल्यास किंवा जाळल्यास लिथियम बॅटरी १२००°C तापमानावर स्फोटासह जळते.',
        'यामधून अत्यंत विषारी हायड्रोफ्लूओरिक वायू निघतो ज्यामुळे फुफ्फुसांचे नुकसान होते.',
        'लेड-ऍसिड बॅटरीमधील सल्फ्यूरिक ऍसिड डोळे आणि त्वचेला गंभीर भाजून टाकते.',
      ],
    },
    donts: {
      en: [
        'NEVER hammer, puncture, or open battery casing with chisel.',
        'NEVER throw batteries into domestic garbage or burn with other scrap.',
        'NEVER pour water on an active lithium battery fire (use dry sand).',
      ],
      hi: [
        'बैटरी को कभी हथौड़े, पेचकस या छेनी से मत तोड़ें।',
        'बैटरी को कभी आग या आम कचरे में मत फेंको।',
        'लिथियम की आग पर कभी पानी मत डालो (हमेशा सूखी रेत का उपयोग करें)।',
      ],
      mr: [
        'बॅटरी कधीही हातोड्याने किंवा छिन्नीने तोडू नका.',
        'बॅटरी कधीही आगीत किंवा कचऱ्यामध्ये फेकू नका.',
        'लिथियम बॅटरीच्या आगीवर कधीही पाणी टाकू नका (नेहमी सुकी वाळू वापरा).',
      ],
    },
    dos: {
      en: [
        'Tape all metallic battery terminals with electrical insulation tape to prevent short circuits.',
        'Store in a cool, dry place inside a non-conductive plastic tub filled with dry sand.',
        'Handover whole, unbroken batteries to CPCB-authorized recyclers to earn EPR bonus payout.',
      ],
      hi: [
        'बैटरी के दोनों सिरों (Terminals) पर सेलोटेप लगाएं ताकि शॉर्ट सर्किट न हो।',
        'इन्हें सूखी जगह प्लास्टिक के ड्रम या बालू-रेत के बक्से में सुरक्षित रखें।',
        'पूरी अखंड बैटरी ऑथराइज्ड रीसाइक्लर को बेचें और पूरा EPR रीसाइक्लिंग बोनस पाएं।',
      ],
      mr: [
        'बॅटरीच्या दोन्ही टोकांना (Terminals) इन्सुलेशन टेप लावा जेणेकरून शॉर्ट-सर्किट होणार नाही.',
        'प्लास्टिकच्या टबमध्ये सुक्या वाळूमध्ये सुरक्षित ठेवा.',
        'अखंड बॅटरी थेट अधिकृत रिसायकलर्सना देऊन जास्तीत जास्त मोबदला मिळवा.',
      ],
    },
    economicTip: {
      en: 'Broken batteries lose 70% value due to spilled metals. Authorized recyclers pay 30% more for undamaged whole battery packs with EPR compliance.',
      hi: 'तोड़ी गई बैटरी की कीमत 70% तक गिर जाती है। साबुत बैटरी बेचने पर ऑथराइज्ड रीसाइक्लर 30% ज्यादा कीमत और सरकारी EPR इंसेंटिव देते हैं।',
      mr: 'फोडलेल्या बॅटरीची किंमत ७०% कमी होते. संपूर्ण बॅटरी दिल्यास अधिकृत रिसायकलर्स ३०% जास्त भाव आणि सरकारी EPR बोनस देतात.',
    },
    speechText: {
      en: 'Safety Alert for Batteries: Never hammer, crush or burn lithium batteries. They can explode at 1200 degrees. Insulate battery terminals with tape and sell intact packs to authorized recyclers for maximum price.',
      hi: 'बैटरी सुरक्षा नियम: बैटरी को कभी हथौड़े से मत तोड़ें और आग में मत डालें। इसमें 1200 डिग्री का धमाका हो सकता है। सिरों पर टेप लगाएं और साबुत बैटरी रीसाइक्लर को बेचकर पूरा दाम पाएं।',
      mr: 'बॅटरी सुरक्षा नियम: बॅटरी कधीही हातोड्याने फोडू नका किंवा जाळू नका. यामुळे मोठा स्फोट होऊ शकतो. टोकांना टेप लावा आणि संपूर्ण बॅटरी अधिकृत रिसायकलर्सना विका.',
    },
  },
  {
    id: 'crts',
    icon: '📺',
    categoryName: {
      en: 'CRT Monitors, TVs & Display Panels',
      hi: 'पुराने टीवी, CRT मॉनिटर और स्क्रीन (CRTs & Displays)',
      mr: 'जुने टीव्ही, सीआरटी मॉनिटर्स व स्क्रीन (CRTs & Displays)',
    },
    badge: {
      en: 'Implosion & Toxic Lead Poisoning',
      hi: 'इंप्लोशन धमाका और लेड जहर का खतरा',
      mr: 'काचेचा स्फोट व विषारी शिसेचा धोका',
    },
    dangerTitle: {
      en: 'Vacuum Implosion & Toxic Lead Dust Inhalation',
      hi: 'हाई वैक्यूम ग्लास धमाका और लेड-फॉस्फोरस पाउडर',
      mr: 'हाय व्हॅक्यूम स्फोट आणि विषारी शिसे-फॉस्फरस पावडर',
    },
    hazards: {
      en: [
        'CRT glass tubes contain intense vacuum. Smashing them causes sudden violent glass implosion.',
        'Each CRT tube carries 2 to 3 kg of toxic lead oxide and barium that poisons brain and kidneys.',
        'Inside screen contains fluorescent phosphor powder that causes chronic lung silicosis.',
      ],
      hi: [
        'CRT ट्यूब में हाई वैक्यूम होता है; हथौड़ा मारने पर कांच के तीखे टुकड़े छिटक कर आंखों और चेहरे को जख्मी करते हैं।',
        'हर CRT में 2 से 3 किलो जहरीला सीसा (Lead) होता है जो दिमाग और गुर्दे खराब कर देता है।',
        'अंदर लगा सफेद फॉस्फोरस पाउडर सांस के जरिए फेफड़ों में स्थायी सिलिकोसिस करता है।',
      ],
      mr: [
        'सीआरटी ट्यूबमध्ये प्रचंड व्हॅक्यूम असतो; हातोडी मारल्यास काचेचे तुकडे उडून डोळे आणि शरीराला गंभीर इजा करतात.',
        'प्रत्येक सीआरटीमध्ये २ ते ३ किलो विषारी शिसे (Lead) असते ज्यामुळे मेंदूचे विकार होतात.',
        'आतील पांढरी फॉस्फरस पावडर श्वासावाटे फुफ्फुसात जाऊन कायमचा दमा होतो.',
      ],
    },
    donts: {
      en: [
        'NEVER smash CRT glass with hammer just to extract copper deflection yoke.',
        'NEVER break LCD/fluorescent backlights (releases deadly Mercury vapor).',
        'NEVER leave broken cathode ray tubes in open community grounds.',
      ],
      hi: [
        'सिर्फ कॉपर योक निकालने के लिए कभी भी CRT का कांच हथौड़े से मत फोड़ें।',
        'LCD या फ्लोरोसेंट ट्यूब को कभी मत तोड़ें (पारा/Mercury गैस निकलती है)।',
        'टूटा हुआ कांच कभी खुले में मत छोड़ें।',
      ],
      mr: [
        'फक्त तांब्याची कॉइल काढण्यासाठी सीआरटी काच हातोड्याने फोडू नका.',
        'एलसीडी किंवा ट्यूबलाईट तोडू नका (विषारी पाऱ्याचा धूर निघतो).',
        'फुटलेली काच उघड्यावर फेकू नका.',
      ],
    },
    dos: {
      en: [
        'Keep whole CRT monitor intact without breaking neck or front panel.',
        'Wear heavy cut-resistant gloves and safety goggles when transporting heavy monitors.',
        'Deliver intact CRTs to authorized centers having hot-wire automated glass separators.',
      ],
      hi: [
        'CRT टीवी या मॉनिटर को बिना फोड़े पूरी तरह साबुत रखें।',
        'उठाते समय मोटे चमड़े के दस्ताने और सुरक्षा चश्मा जरूर पहनें।',
        'ऑथराइज्ड रीसाइक्लर को दें जो लेजर या हॉट-वायर से सुरक्षित रूप से ग्लास अलग करते हैं।',
      ],
      mr: [
        'सीआरटी टीव्ही किंवा मॉनिटर न फोडता संपूर्ण सुरक्षित ठेवा.',
        'हाताळताना जाड हातमोजे आणि संरक्षणात्मक गॉगल वापरा.',
        'अधिकृत केंद्रांना द्या जे हॉट-वायरने काच सुरक्षितपणे वेगळी करतात.',
      ],
    },
    economicTip: {
      en: 'CPCB rules penalize dumping crushed CRT glass. Formal recyclers pay full lot rate when television and monitors are intact.',
      hi: 'टूटा हुआ CRT कांच कोई नहीं खरीदता। साबुत टीवी-मॉनिटर देने पर रीसाइक्लर कॉपर और बोर्ड समेत पूरा उचित दाम देता है।',
      mr: 'फुटलेली काच कोणीही घेत नाही. अखंड मॉनिटर दिल्यास रिसायकलर्स तांबे आणि बोर्डसह पूर्ण योग्य भाव देतात.',
    },
    speechText: {
      en: 'CRT Monitor Safety: Never smash CRT glass with a hammer. It contains two kilograms of toxic lead and can implode violently. Keep whole monitors intact and sell directly to authorized recyclers.',
      hi: 'CRT मॉनिटर सुरक्षा: तांबा निकालने के लिए CRT को हथौड़े से कभी मत फोड़ें। इसमें जहरीला सीसा होता है और कांच धमाके के साथ फटता है। साबुत टीवी रीसाइक्लर को दें।',
      mr: 'सीआरटी मॉनिटर सुरक्षा: सीआरटी काच हातोड्याने कधीही फोडू नका. यात विषारी शिसे असते. अखंड मॉनिटर थेट अधिकृत रिसायकलर्सना द्या.',
    },
  },
  {
    id: 'cables',
    icon: '🔥',
    categoryName: {
      en: 'Cables & Wire Processing (No Burning)',
      hi: 'तार और केबल छीलना (कदापि न जलाएं)',
      mr: 'केबल्स व तारा सोलणे (कधीही जाळू नका)',
    },
    badge: {
      en: 'Cancer & Toxic Dioxin Smoke',
      hi: 'कैंसर और जहरीले धुएं का जानलेवा खतरा',
      mr: 'कर्करोग व विषारी धुराचा मोठा धोका',
    },
    dangerTitle: {
      en: 'Deadly Dioxins, Furans & Lead Inhalation',
      hi: 'डाइऑक्सिन, सीसा और हाइड्रोक्लोरिक एसिड का काला धुआं',
      mr: 'डायऑक्सिन, शिसे आणि विषारी काळा धूर',
    },
    hazards: {
      en: [
        'Open burning of PVC wires produces carcinogenic Dioxins and Furans that remain in lungs for decades.',
        'Releases dense hydrochloric acid vapor causing irreversible throat and lung ulceration.',
        'Copper oxidized by flame becomes brittle, black, and degraded in market purity.',
      ],
      hi: [
        'PVC तार जलाने से डाइऑक्सिन और फ्यूरान जैसे कैंसरकारी रसायन निकलते हैं जो फेफड़ों को हमेशा के लिए बर्बाद करते हैं।',
        'इससे आंखों में जलन, अंधापन और बच्चों में जन्मजात बीमारियां होती हैं।',
        'आग में जला हुआ तांबा काला और कमजोर हो जाता है, जिससे उसकी बाजार कीमत घट जाती है।',
      ],
      mr: [
        'पीव्हीसी तारा जाळल्याने अत्यंत विषारी डायऑक्सिन निघते ज्यामुळे कर्करोग आणि दमा होतो.',
        'धुरामुळे डोळ्यांची जळजळ आणि अंधत्व येऊ शकते.',
        'आगीत जळालेले तांबे काळे आणि ठिसूळ होते, ज्यामुळे त्याचा बाजारातील भाव घसरतो.',
      ],
    },
    donts: {
      en: [
        'NEVER burn wires in open pits, tire fires, or metal drums.',
        'NEVER burn cables near residential homes or food preparation areas.',
        'NEVER allow young helpers or family members near burning wire smoke.',
      ],
      hi: [
        'तारों को कभी गड्ढे में, टायर के साथ या ड्रम में आग लगाकर मत जलाओ।',
        'घरों या बस्तियों के पास कभी भी प्लास्टिक केबल मत जलाओ।',
        'परिवार के बच्चों को कभी ऐसे काले धुएं के पास मत जाने दो।',
      ],
      mr: [
        'तारा कधीही खड्ड्यात किंवा ड्रममध्ये आग लावून जाळू नका.',
        'वस्तीजवळ किंवा घराभोवती कधीही केबल्स जाळू नका.',
        'लहान मुलांना या काळ्या धुराच्या संपर्कात येऊ देऊ नका.',
      ],
    },
    dos: {
      en: [
        'Use simple mechanical cable stripping pliers or hand-crank wire peelers.',
        'Sell PVC-coated wires directly to authorized recyclers equipped with automated copper granulators.',
        'Earn full Grade-A bright copper scrap value instead of degraded burned-copper rate.',
      ],
      hi: [
        'तार छीलने के लिए वायर स्ट्रिपर प्लास या सस्ती हाथ वाली मशीन का उपयोग करें।',
        'या फिर प्लास्टिक चढ़े तार सीधे रीसाइक्लर को बेचें, उनके पास तार काटने की ऑटोमैटिक मशीनें होती हैं।',
        'चमकदार साफ तांबे (Berry Copper) का पूरा ऊंचा दाम पाएं, जो जले हुए तांबे से ₹100/kg ज्यादा होता है।',
      ],
      mr: [
        'तारा सोलण्यासाठी वायर स्ट्रिपर किंवा साध्या हँड-मशीनचा वापर करा.',
        'प्लास्टिक कोटिंग असलेल्या तारा थेट अधिकृत रिसायकलर्सना विका.',
        'चमकदार तांब्यासाठी जळलेल्या तांब्यापेक्षा किलोमागे ₹१०० जास्त भाव मिळवा.',
      ],
    },
    economicTip: {
      en: 'Bright unburned copper (ISRI Berry) sells at ₹750/kg. Burned black copper is discounted to ₹620/kg due to metal loss. Mechanical stripping earns you 20% more profit!',
      hi: 'साफ चमकदार तांबे का रेट ₹750/किलो है, जबकि जला हुआ काला तांबा सिर्फ ₹620/किलो बिकता है। तार न जलाने पर आपको ₹130 प्रति किलो ज्यादा मुनाफा मिलता है!',
      mr: 'स्वच्छ तांब्याचा भाव ₹७५०/किलो आहे, तर जळालेले काळे तांबे फक्त ₹६२०/किलो विकले जाते. न जाळता सोलल्यास प्रति किलो ₹१३० जास्त नफा होतो!',
    },
    speechText: {
      en: 'Wire Burning Warning: Never burn electrical wires to extract copper. Burning emits cancer-causing smoke and reduces your copper price by 130 rupees per kilo. Use mechanical wire strippers and sell bright copper for highest profit.',
      hi: 'तार जलाने की चेतावनी: तांबा निकालने के लिए तार कभी मत जलाएं। धुआं फेफड़े बर्बाद करता है और तांबे का भाव ₹130 प्रति किलो कम हो जाता है। स्ट्रिपर का उपयोग करें और चमकदार तांबे का पूरा दाम पाएं।',
      mr: 'तारा जाळण्यास मनाई: तांबे काढण्यासाठी तारा कधीही जाळू नका. यामुळे कर्करोगाचा धोका होतो आणि तांब्याचा भाव ₹१३० कमी होतो. मशीनने तारा सोलून जास्तीत जास्त नफा मिळवा.',
    },
  },
  {
    id: 'pcbs',
    icon: '🧪',
    categoryName: {
      en: 'Circuit Boards (PCBs) & Acid Leaching',
      hi: 'सर्किट बोर्ड (PCB) और तेजाब से धुलाई न करें',
      mr: 'सर्किट बोर्ड (PCB) आणि ऍसिडचा वापर टाळा',
    },
    badge: {
      en: 'Deadly Acid Fumes & Mineral Loss',
      hi: 'तेजाबी धुआं और बहुमूल्य धातुओं का नुकसान',
      mr: 'विषारी ऍसिड धूर व मौल्यवान धातूंचे नुकसान',
    },
    dangerTitle: {
      en: 'Nitrogen Dioxide Choking & Critical Mineral Destruction',
      hi: 'लाल-भूरे तेजाबी धुएं से दम घुटना और धातुओं का विनाश',
      mr: 'नायट्रोजन डायऑक्साइडमुळे गुदमरणे व धातूंचे नुकसान',
    },
    hazards: {
      en: [
        'Boiling circuit boards in nitric acid / aqua regia emits thick red-brown Nitrogen Dioxide (NO2) gas causing fatal chemical pneumonia.',
        'Backyard acid leaching destroys 85% of critical minerals: Lithium, Cobalt, Neodymium, Tantalum, Gallium, and Indium are lost forever in toxic sludge.',
        'Blowtorch desoldering produces neurotoxic Lead and Cadmium fumes.',
      ],
      hi: [
        'तेजाब (नाइट्रिक एसिड) में मदरबोर्ड उबालने से लाल-भूरा धुआं निकलता है जो तुरंत सांस की नली और फेफड़ों को जला देता है।',
        'घरों में तेजाब डालने से सोना-तांबा तो थोड़ा मिलता है लेकिन लिथियम, कोबाल्ट, नियोडिमियम जैसी कीमती धातुएं नाले में बह जाती हैं।',
        'गैस बत्ती से सर्किट बोर्ड गर्म करने पर लेड और कैडमियम का जहरीला धुआं दिमाग को कमजोर करता है।',
      ],
      mr: [
        'नायट्रिक ऍसिडमध्ये पीसीबी उकळल्याने लाल-तपकिरी विषारी धूर निघतो ज्यामुळे फुफ्फुस कायमचे निकामी होतात.',
        'घरात ऍसिड वापरल्याने लिथियम, कोबाल्ट आणि नियोडिमियम या अत्यंत महागड्या धातूंचे पूर्ण नुकसान होते.',
        'गॅस बर्नरने बोर्ड तापवल्यास शिसे आणि कॅडमियमचा धूर मेंदूवर विपरीत परिणाम करतो.',
      ],
    },
    donts: {
      en: [
        'NEVER boil circuit boards in open acid pans or kerosene cookers.',
        'NEVER pour spent acid sludge into city gutters, soil, or water bodies.',
        'NEVER use gas torches on populated streets to desolder chips.',
      ],
      hi: [
        'कड़ाही या चूल्हे पर तेजाब डालकर सर्किट बोर्ड कभी मत उबालें।',
        'बचा हुआ जहरीला तेजाब नालियों, जमीन या तालाबों में कभी मत बहाएं।',
        'खुली दुकान या सड़क पर गैस बर्नर से आईसी और चिप मत उखाड़ें।',
      ],
      mr: [
        'चुलीवर किंवा कढईत ऍसिड टाकून सर्किट बोर्ड कधीही उकळू नका.',
        'उरलेले विषारी ऍसिड गटारात किंवा जमिनीत फेकू नका.',
        'उघड्यावर गॅस बर्नरने चिप्स वितळवू नका.',
      ],
    },
    dos: {
      en: [
        'Sort circuit boards dry by category: High-grade (Motherboards/RAM), Medium (TV/Monitor), and Low-grade (Power supplies).',
        'Keep PCBs completely dry and sealed in standard sacks.',
        'Sell intact PCBs to government-authorized hydrometallurgy recyclers who recover 99% gold, copper, and rare-earth elements safely.',
      ],
      hi: [
        'सर्किट बोर्ड को सूखा रखें और ग्रेड के अनुसार अलग करें: कंप्यूटर मदरबोर्ड (₹350/kg), टीवी बोर्ड (₹80/kg)।',
        'बिना तेजाब डाले साफ-सुथरे बोर्ड बोरियों में भरकर रखें।',
        'सीधे सरकार द्वारा मान्यता प्राप्त EPR रीसाइक्लर को बेचें जो बिना धुएं के 99% धातु निकाल कर आपको सबसे ऊंचा रेट देते हैं।',
      ],
      mr: [
        'सर्किट बोर्ड सुके ठेवा आणि प्रकारानुसार वेगळे करा: कॉम्प्युटर बोर्ड (₹३५०/किलो), टीव्ही बोर्ड (₹८०/किलो).',
        'कोणतेही ऍसिड न वापरता बोर्ड पोत्यात भरून ठेवा.',
        'थेट अधिकृत रिसायकलर्सना विका जे सुरक्षित तंत्रज्ञानाने ९९% सोने-तांबे काढून तुम्हाला सर्वोत्तम भाव देतात.',
      ],
    },
    economicTip: {
      en: 'Backyard acid leaching recovers barely 35% of metal value and yields low-purity gold. Selling whole sorted PCBs to formal recyclers pays ₹280–₹550/kg cleanly with no acid costs or health bills!',
      hi: 'तेजाब से सिर्फ 35% ही धातु निकल पाती है और तेजाब का खर्चा अलग होता है। बिना तोड़े साबुत मदरबोर्ड ऑथराइज्ड रीसाइक्लर को बेचने पर ₹280 से ₹550/किलो तक शुद्ध मुनाफा मिलता है!',
      mr: 'ऍसिडने फक्त ३५% धातू निघतो आणि ऍसिडचा खर्च वेगळा. संपूर्ण बोर्ड अधिकृत केंद्राला दिल्यास ₹२८० ते ₹५५०/किलोपर्यंत स्वच्छ नफा मिळतो!',
    },
    speechText: {
      en: 'Circuit Board Warning: Never boil PCBs in acid. Acid fumes can kill you and destroy valuable rare minerals. Sell whole sorted circuit boards directly to authorized recyclers for 300 to 550 rupees per kilo.',
      hi: 'सर्किट बोर्ड चेतावनी: मदरबोर्ड को तेजाब में कभी मत उबालें। जहरीला धुआं जानलेवा है और कीमती धातुएं नष्ट हो जाती हैं। साबुत बोर्ड सीधे रीसाइक्लर को ₹350 से ₹550 किलो में बेचें।',
      mr: 'सर्किट बोर्ड चेतावणी: बोर्ड कधीही ऍसिडमध्ये उकळू नका. विषारी धूर प्राणघातक ठरू शकतो. संपूर्ण बोर्ड अधिकृत रिसायकलर्सना ₹३५० ते ₹५५० किलोने विका.',
    },
  },
];

export default function CollectorSafetyPage() {
  const [lang, setLang] = useState<Lang>('hi');
  const [activeTab, setActiveTab] = useState<string>('batteries');
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [currentSpeakingId, setCurrentSpeakingId] = useState<string | null>(null);
  const [voiceNotice, setVoiceNotice] = useState<string | null>(null);

  const selectedTopic = SAFETY_TOPICS.find((t) => t.id === activeTab) || SAFETY_TOPICS[0];

  // Preload and cache browser voices
  useEffect(() => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;

    const populateVoices = () => {
      window.speechSynthesis.getVoices();
    };

    populateVoices();
    window.speechSynthesis.onvoiceschanged = populateVoices;

    return () => {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // Chrome speech keep-alive heartbeat
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isPlayingAudio && typeof window !== 'undefined' && window.speechSynthesis) {
      interval = setInterval(() => {
        if (window.speechSynthesis.paused) {
          window.speechSynthesis.resume();
        }
      }, 5000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isPlayingAudio]);

  // Voice narration using Web Speech API with fallback for Marathi & Indian languages
  const handleToggleSpeech = (topic: HazardTopic) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      alert('Your browser does not support audio speech narration. Please try in Google Chrome or Microsoft Edge.');
      return;
    }

    if (isPlayingAudio && currentSpeakingId === topic.id) {
      window.speechSynthesis.cancel();
      setIsPlayingAudio(false);
      setCurrentSpeakingId(null);
      setVoiceNotice(null);
      return;
    }

    window.speechSynthesis.cancel();
    if (window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
    }

    const textToSpeak = topic.speechText[lang];
    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    const voices = window.speechSynthesis.getVoices();

    // Strategy to guarantee speech even if OS lacks native Marathi TTS voice
    let assignedVoice: SpeechSynthesisVoice | null = null;
    let voiceLang = 'en-IN';

    if (lang === 'mr') {
      // 1. First priority: native Marathi voice (mr-IN, mr)
      const nativeMr = voices.find((v) => {
        const l = (v.lang || '').toLowerCase().replace('_', '-');
        const n = (v.name || '').toLowerCase();
        return l.startsWith('mr') || n.includes('marathi');
      });

      if (nativeMr) {
        assignedVoice = nativeMr;
        voiceLang = nativeMr.lang;
        setVoiceNotice('मराठी आवाज (Native Marathi Voice)');
      } else {
        // 2. High quality fallback: Hindi Devanagari voice (Google हिन्दी, Kalpana, Hemant, etc.)
        // Since Marathi uses identical Devanagari script, Hindi TTS pronounces Marathi cleanly without failing
        const hindiVoice = voices.find((v) => {
          const l = (v.lang || '').toLowerCase().replace('_', '-');
          const n = (v.name || '').toLowerCase();
          return l.startsWith('hi') || n.includes('hindi') || n.includes('kalpana') || n.includes('hemant');
        });

        if (hindiVoice) {
          assignedVoice = hindiVoice;
          voiceLang = hindiVoice.lang || 'hi-IN';
          setVoiceNotice('देवनागरी ऑडिओ (Devanagari Voice)');
        } else {
          // 3. Indian locale fallback
          const indianVoice = voices.find((v) => (v.lang || '').toLowerCase().includes('in'));
          if (indianVoice) {
            assignedVoice = indianVoice;
            voiceLang = indianVoice.lang;
          } else {
            voiceLang = 'hi-IN';
          }
          setVoiceNotice('ऑडिओ सुरू (Audio Playing)');
        }
      }
      utterance.rate = 0.88; // Comfortable pace for safety alerts
    } else if (lang === 'hi') {
      const hindiVoice = voices.find((v) => {
        const l = (v.lang || '').toLowerCase().replace('_', '-');
        const n = (v.name || '').toLowerCase();
        return l.startsWith('hi') || n.includes('hindi') || n.includes('kalpana') || n.includes('hemant');
      });
      if (hindiVoice) {
        assignedVoice = hindiVoice;
        voiceLang = hindiVoice.lang;
      } else {
        voiceLang = 'hi-IN';
      }
      utterance.rate = 0.9;
      setVoiceNotice('हिंदी आवाज (Hindi Voice)');
    } else {
      const enVoice = voices.find((v) => {
        const l = (v.lang || '').toLowerCase().replace('_', '-');
        return l.startsWith('en-in') || l.startsWith('en');
      });
      if (enVoice) {
        assignedVoice = enVoice;
        voiceLang = enVoice.lang;
      } else {
        voiceLang = 'en-IN';
      }
      utterance.rate = 0.95;
      setVoiceNotice('English Audio');
    }

    if (assignedVoice) {
      utterance.voice = assignedVoice;
    }
    utterance.lang = voiceLang;

    utterance.onend = () => {
      setIsPlayingAudio(false);
      setCurrentSpeakingId(null);
      setVoiceNotice(null);
    };

    utterance.onerror = (err) => {
      console.warn('Speech synthesis notice:', err);
      // If language was rejected, fallback to default voice with generic Indian locale
      if (lang === 'mr' && voiceLang !== 'hi-IN') {
        const fallbackUtterance = new SpeechSynthesisUtterance(textToSpeak);
        fallbackUtterance.lang = 'hi-IN';
        fallbackUtterance.rate = 0.88;
        fallbackUtterance.onend = () => {
          setIsPlayingAudio(false);
          setCurrentSpeakingId(null);
          setVoiceNotice(null);
        };
        fallbackUtterance.onerror = () => {
          setIsPlayingAudio(false);
          setCurrentSpeakingId(null);
          setVoiceNotice(null);
        };
        window.speechSynthesis.speak(fallbackUtterance);
        return;
      }
      setIsPlayingAudio(false);
      setCurrentSpeakingId(null);
      setVoiceNotice(null);
    };

    setCurrentSpeakingId(topic.id);
    setIsPlayingAudio(true);

    window.speechSynthesis.speak(utterance);
    if (window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
    }
  };

  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F9FA] text-[#191C1E] flex flex-col font-sans pb-28">
      <Navbar />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex-1 w-full space-y-5">
        
        {/* Top Breadcrumb & Actions Bar */}
        <div className="flex items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-gray-200 shadow-2xs">
          <Link
            href="/collector"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-[#191C1E] rounded-xl text-xs font-bold transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>
              {lang === 'hi' ? 'कलेक्टर पोर्टल' : lang === 'mr' ? 'कलेक्टर पोर्टल' : 'Dashboard'}
            </span>
          </Link>

          {/* Language Selector Pills */}
          <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl border border-gray-200">
            <button
              type="button"
              onClick={() => setLang('hi')}
              className={`px-3 py-1 rounded-lg text-xs font-black transition ${
                lang === 'hi'
                  ? 'bg-[#136B3B] text-white shadow-2xs'
                  : 'text-gray-600 hover:text-[#191C1E]'
              }`}
            >
              हिन्दी (Hindi)
            </button>
            <button
              type="button"
              onClick={() => setLang('mr')}
              className={`px-3 py-1 rounded-lg text-xs font-black transition ${
                lang === 'mr'
                  ? 'bg-[#136B3B] text-white shadow-2xs'
                  : 'text-gray-600 hover:text-[#191C1E]'
              }`}
            >
              मराठी (Marathi)
            </button>
            <button
              type="button"
              onClick={() => setLang('en')}
              className={`px-3 py-1 rounded-lg text-xs font-black transition ${
                lang === 'en'
                  ? 'bg-[#136B3B] text-white shadow-2xs'
                  : 'text-gray-600 hover:text-[#191C1E]'
              }`}
            >
              English
            </button>
          </div>

          <button
            type="button"
            onClick={handlePrint}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-gray-50 text-gray-700 rounded-xl text-xs font-bold border border-gray-200 shadow-2xs"
            title="Print Safety Poster"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Poster</span>
          </button>
        </div>

        {/* Hero Banner with Emergency Helplines */}
        <div className="bg-gradient-to-br from-[#0D4E2A] via-[#136B3B] to-[#1E824C] text-white p-6 sm:p-7 rounded-3xl shadow-sm relative overflow-hidden space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 z-10 relative">
            <div className="space-y-1.5 max-w-xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 border border-white/25 text-xs font-black text-amber-200">
                <ShieldAlert className="w-4 h-4 text-amber-300" />
                <span>E-Waste Management Rules 2022 &amp; CPCB Compliance</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                {lang === 'hi'
                  ? 'कबाड़ कामगार स्वास्थ्य और सुरक्षा मार्गदर्शिका'
                  : lang === 'mr'
                  ? 'भंगार कामगार आरोग्य आणि सुरक्षा मार्गदर्शिका'
                  : 'Informal Worker Hazardous Waste & Safety Guide'}
              </h1>
              <p className="text-xs sm:text-sm text-[#A6D5B8] leading-relaxed">
                {lang === 'hi'
                  ? 'तार जलाना, तेजाब डालना और बैटरी तोड़ना जानलेवा है। सुरक्षित तरीका अपनाएं और अधिक दाम पाएं।'
                  : lang === 'mr'
                  ? 'तारा जाळणे, ऍसिड वापरणे आणि बॅटरी फोडणे जीवघेणे आहे. सुरक्षित पद्धत वापरा आणि जास्त भाव मिळवा.'
                  : 'Pictorial guidance against unsafe backyard processing. Protect your lungs, prevent fires, and earn higher formal EPR recycling rates.'}
              </p>
            </div>

            {/* Emergency Hotline Badges */}
            <div className="bg-white/10 backdrop-blur-md p-3 rounded-2xl border border-white/20 text-xs space-y-1.5 shrink-0">
              <p className="font-extrabold text-[11px] text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                <PhoneCall className="w-3.5 h-3.5" />
                <span>Emergency Helplines (24x7)</span>
              </p>
              <div className="flex items-center gap-2 font-mono font-bold text-white text-xs">
                <span className="bg-red-600 px-2 py-0.5 rounded-md">Fire: 101 / 112</span>
                <span className="bg-blue-600 px-2 py-0.5 rounded-md">Ambulance: 108</span>
              </div>
            </div>
          </div>
          <div className="absolute -right-12 -bottom-16 w-52 h-52 rounded-full bg-white/5 pointer-events-none" />
        </div>

        {/* 4 Core Hazard Category Navigation Pills */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {SAFETY_TOPICS.map((topic) => {
            const isSelected = activeTab === topic.id;
            return (
              <button
                key={topic.id}
                type="button"
                onClick={() => setActiveTab(topic.id)}
                className={`p-3 rounded-2xl border text-left transition flex flex-col justify-between gap-2 touch-feedback ${
                  isSelected
                    ? 'bg-[#136B3B] text-white border-[#136B3B] shadow-md ring-2 ring-[#136B3B]/20'
                    : 'bg-white hover:bg-gray-50 text-[#191C1E] border-gray-200 shadow-2xs'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-2xl">{topic.icon}</span>
                  {isSelected && (
                    <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                  )}
                </div>
                <div>
                  <p className="font-black text-xs leading-snug line-clamp-1">
                    {topic.categoryName[lang]}
                  </p>
                  <p className={`text-[10px] mt-0.5 line-clamp-1 font-semibold ${isSelected ? 'text-[#A6D5B8]' : 'text-red-600'}`}>
                    {topic.badge[lang]}
                  </p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Selected Hazard Detailed Interactive Guide Card */}
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-gray-200 shadow-xs space-y-5">
          
          {/* Section Header with Audio Play Button */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-[#136B3B] border border-emerald-200 flex items-center justify-center text-2xl shrink-0 shadow-2xs">
                {selectedTopic.icon}
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-lg font-black text-[#191C1E]">
                    {selectedTopic.categoryName[lang]}
                  </h2>
                  <span className="px-2.5 py-0.5 rounded-full text-[10.5px] font-black bg-red-50 text-red-700 border border-red-200">
                    ⚠️ {selectedTopic.badge[lang]}
                  </span>
                </div>
                <p className="text-xs text-[#526056] font-medium mt-0.5">
                  {selectedTopic.dangerTitle[lang]}
                </p>
              </div>
            </div>

            {/* Listen in Hindi/Marathi Audio Button & Status */}
            <div className="flex flex-col items-end gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() => handleToggleSpeech(selectedTopic)}
                className={`px-4 py-2.5 rounded-xl font-extrabold text-xs transition flex items-center justify-center gap-2 shadow-xs shrink-0 touch-feedback ${
                  isPlayingAudio && currentSpeakingId === selectedTopic.id
                    ? 'bg-amber-600 hover:bg-amber-700 text-white shadow-md animate-pulse'
                    : 'bg-[#136B3B] hover:bg-[#0F5730] text-white'
                }`}
              >
                {isPlayingAudio && currentSpeakingId === selectedTopic.id ? (
                  <>
                    <VolumeX className="w-4 h-4" />
                    <span>
                      {lang === 'hi' ? 'ऑडियो रोकें (Stop)' : lang === 'mr' ? 'ऑडिओ थांबवा (Stop)' : 'Stop Audio'}
                    </span>
                  </>
                ) : (
                  <>
                    <Volume2 className="w-4 h-4" />
                    <span>
                      {lang === 'hi' ? '🔊 आवाज में सुनें (Listen)' : lang === 'mr' ? '🔊 आवाजात ऐका (Listen)' : '🔊 Listen Audio'}
                    </span>
                  </>
                )}
              </button>
              {isPlayingAudio && currentSpeakingId === selectedTopic.id && voiceNotice && (
                <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-md border border-amber-300">
                  🔊 {voiceNotice}
                </span>
              )}
            </div>
          </div>

          {/* Dangers & Health Impact Grid */}
          <div className="bg-red-50/70 p-4 rounded-2xl border border-red-200 space-y-2">
            <h3 className="text-xs font-black uppercase tracking-wider text-red-800 flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-red-600" />
              <span>
                {lang === 'hi' ? 'स्वास्थ्य और शारीरिक खतरे (Severe Health Hazards)' : lang === 'mr' ? 'आरोग्य व शारीरिक धोके (Health Hazards)' : 'Severe Health & Environmental Hazards'}
              </span>
            </h3>
            <ul className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
              {selectedTopic.hazards[lang].map((hazard, hIdx) => (
                <li key={hIdx} className="bg-white p-3 rounded-xl border border-red-100 text-xs text-red-950 font-medium leading-relaxed flex items-start gap-2 shadow-2xs">
                  <span className="text-red-600 font-bold shrink-0">⚠️</span>
                  <span>{hazard}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Side-by-Side Pictorial DO's vs DONT's */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
            
            {/* DONT Column (Red) */}
            <div className="bg-red-50/40 p-4 rounded-2xl border-2 border-red-200 space-y-3">
              <div className="flex items-center gap-2 pb-2 border-b border-red-200">
                <XCircle className="w-5 h-5 text-red-600 shrink-0" />
                <h3 className="font-black text-sm text-red-900">
                  {lang === 'hi' ? '❌ कभी न करें (NEVER DO THIS)' : lang === 'mr' ? '❌ कधीही करू नका (NEVER DO THIS)' : '❌ Dangerous Practices (NEVER DO THIS)'}
                </h3>
              </div>
              <ul className="space-y-2 text-xs">
                {selectedTopic.donts[lang].map((dont, dIdx) => (
                  <li key={dIdx} className="flex items-start gap-2.5 p-2 bg-white rounded-xl border border-red-100 font-medium text-red-950">
                    <span className="text-red-600 font-black text-base shrink-0 leading-none">✕</span>
                    <span>{dont}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* DO Column (Green) */}
            <div className="bg-emerald-50/40 p-4 rounded-2xl border-2 border-emerald-300 space-y-3">
              <div className="flex items-center gap-2 pb-2 border-b border-emerald-200">
                <CheckCircle2 className="w-5 h-5 text-[#136B3B] shrink-0" />
                <h3 className="font-black text-sm text-[#136B3B]">
                  {lang === 'hi' ? '✅ सुरक्षित तरीका (SAFE WAY)' : lang === 'mr' ? '✅ सुरक्षित पद्धत (SAFE WAY)' : '✅ Safe Compliant Way (ALWAYS DO THIS)'}
                </h3>
              </div>
              <ul className="space-y-2 text-xs">
                {selectedTopic.dos[lang].map((doItem, doIdx) => (
                  <li key={doIdx} className="flex items-start gap-2.5 p-2 bg-white rounded-xl border border-emerald-100 font-medium text-emerald-950">
                    <span className="text-[#136B3B] font-black text-base shrink-0 leading-none">✓</span>
                    <span>{doItem}</span>
                  </li>
                ))}
              </ul>
            </div>

          </div>

          {/* Economic Benefit Banner (Why Formalization Pays More) */}
          <div className="bg-gradient-to-r from-[#E6F4EA] to-white p-4 rounded-2xl border border-[#A6D5B8] flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#136B3B] text-white flex items-center justify-center shrink-0 shadow-2xs text-lg">
                💰
              </div>
              <div>
                <h4 className="font-black text-xs sm:text-sm text-[#136B3B]">
                  {lang === 'hi' ? 'आर्थिक फायदा: साबुत बेचने पर ज्यादा कमाई' : lang === 'mr' ? 'आर्थिक फायदा: सुरक्षित विकल्यास जास्त नफा' : 'Economic Advantage: Sell Intact for Higher Profit'}
                </h4>
                <p className="text-xs text-[#2B6B47] leading-relaxed mt-0.5">
                  {selectedTopic.economicTip[lang]}
                </p>
              </div>
            </div>

            <Link
              href="/collector/find-buyers"
              className="px-4 py-2 bg-[#136B3B] hover:bg-[#0F5730] text-white font-extrabold text-xs rounded-xl transition flex items-center justify-center gap-1.5 shadow-2xs shrink-0"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>
                {lang === 'hi' ? 'ऑथराइज्ड रीसाइक्लर खोजें' : lang === 'mr' ? 'अधिकृत रिसायकलर्स शोधा' : 'Find Authorized Recyclers'}
              </span>
            </Link>
          </div>

        </div>

        {/* Worker Personal Protective Equipment (PPE) Checklist */}
        <div className="bg-white rounded-3xl p-5 border border-gray-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <span className="text-xl">🦺</span>
              <h3 className="font-black text-sm sm:text-base text-[#191C1E]">
                {lang === 'hi' ? 'कबाड़ कामगारों के लिए जरूरी सुरक्षा सामान (PPE Checklist)' : lang === 'mr' ? 'भंगार कामगारांसाठी आवश्यक सुरक्षा साहित्य (PPE)' : 'Mandatory Worker PPE & Protective Gear'}
              </h3>
            </div>
            <span className="text-xs font-bold text-[#136B3B] bg-[#E6F4EA] px-2.5 py-0.5 rounded-full">
              Zero Injury Target
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
            <div className="p-3 bg-gray-50 rounded-2xl border border-gray-200 text-center space-y-1">
              <span className="text-2xl block">🧤</span>
              <p className="font-black text-xs text-[#191C1E]">Cut-Proof Gloves</p>
              <p className="text-[10px] text-gray-500">मोटे दस्ताने (Glass/metal protection)</p>
            </div>
            <div className="p-3 bg-gray-50 rounded-2xl border border-gray-200 text-center space-y-1">
              <span className="text-2xl block">👓</span>
              <p className="font-black text-xs text-[#191C1E]">Safety Goggles</p>
              <p className="text-[10px] text-gray-500">सुरक्षा चश्मा (Implosion/acid splash)</p>
            </div>
            <div className="p-3 bg-gray-50 rounded-2xl border border-gray-200 text-center space-y-1">
              <span className="text-2xl block">😷</span>
              <p className="font-black text-xs text-[#191C1E]">N95 / Fume Mask</p>
              <p className="text-[10px] text-gray-500">मास्क (Lead &amp; phosphor dust filter)</p>
            </div>
            <div className="p-3 bg-gray-50 rounded-2xl border border-gray-200 text-center space-y-1">
              <span className="text-2xl block">🥾</span>
              <p className="font-black text-xs text-[#191C1E]">Steel-Toe Boots</p>
              <p className="text-[10px] text-gray-500">मजबूत जूते (Heavy scrap foot safety)</p>
            </div>
          </div>
        </div>

      </main>

      <BottomNav role="collector" />
    </div>
  );
}

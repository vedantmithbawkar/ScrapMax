'use client';

import { useState, useEffect } from 'react';

export type SupportedLanguage = 'English' | 'Hindi' | 'Kannada' | 'Marathi' | 'Tamil' | 'Telugu';

export const SUPPORTED_LANGUAGES: { code: SupportedLanguage; label: string; nativeName: string }[] = [
  { code: 'English', label: 'English', nativeName: 'English' },
  { code: 'Hindi', label: 'Hindi', nativeName: 'हिन्दी (Hindi)' },
  { code: 'Kannada', label: 'Kannada', nativeName: 'ಕನ್ನಡ (Kannada)' },
  { code: 'Marathi', label: 'Marathi', nativeName: 'मराठी (Marathi)' },
  { code: 'Tamil', label: 'Tamil', nativeName: 'தமிழ் (Tamil)' },
  { code: 'Telugu', label: 'Telugu', nativeName: 'తెలుగు (Telugu)' },
];

export const TRANSLATIONS: Record<SupportedLanguage, Record<string, string>> = {
  English: {
    // Greetings & Header
    goodMorning: 'Good morning',
    goodAfternoon: 'Good afternoon',
    goodEvening: 'Good evening',
    householdDashboard: 'Household Dashboard',
    
    // Hero Banner
    turnRecyclables: 'Turn recyclables into value.',
    schedulePickup: 'Schedule a pickup from a nearby collector.',
    requestPickup: 'Request pickup',

    // Quick Actions
    quickActions: 'Quick actions',
    sellRecyclables: 'Sell recyclables',
    getValue: 'Get fair value',
    pickupHistory: 'Pickup history',
    viewPastPickups: 'View past pickups',

    // Active & Recent Pickups
    activePickupStatus: 'Active Pickup in Progress',
    recentActivity: 'Recent Pickups',
    noPickupsYet: 'No pickups requested yet. Tap "Request pickup" to get started!',
    demoNotice: 'Demo preview mode. Sign in to save live pickup requests to Supabase.',
    signIn: 'Sign In',

    // Bottom Navigation
    navHome: 'Home',
    navPickup: 'Pickup',
    navTrack: 'Track',
    navHistory: 'History',
    navProfile: 'Profile',

    // Profile & Settings
    profileTitle: 'Profile',
    householdAccount: 'Household Account',
    personalInformation: 'Personal information',
    savedAddresses: 'Saved addresses',
    settings: 'Settings',
    logout: 'Log out',
    preferences: 'Preferences',
    displayLanguage: 'Display Language',
    chooseLanguage: 'Choose your preferred language for the entire app',
    savedSuccessfully: 'Language changed to',
  },

  Hindi: {
    // Greetings & Header
    goodMorning: 'सुप्रभात',
    goodAfternoon: 'शुभ दोपहर',
    goodEvening: 'शुभ संध्या',
    householdDashboard: 'घरेलू डैशबोर्ड',

    // Hero Banner
    turnRecyclables: 'घर के कबाड़ को बनाएं आमदनी।',
    schedulePickup: 'नजदीकी कबाड़ीवाले से डोरस्टेप पिकअप बुक करें।',
    requestPickup: 'पिकअप बुक करें',

    // Quick Actions
    quickActions: 'त्वरित कार्य',
    sellRecyclables: 'कबाड़ बेचें',
    getValue: 'सही व पारदर्शी दाम पाएं',
    pickupHistory: 'पिकअप इतिहास',
    viewPastPickups: 'पुराने पिकअप देखें',

    // Active & Recent Pickups
    activePickupStatus: 'सक्रिय पिकअप प्रगति पर है',
    recentActivity: 'हालिया पिकअप',
    noPickupsYet: 'अभी कोई पिकअप नहीं है। शुरू करने के लिए "पिकअप बुक करें" पर टैप करें!',
    demoNotice: 'डेमो मोड। लाइव डेटा डेटाबेस में सुरक्षित करने के लिए साइन इन करें।',
    signIn: 'साइन इन करें',

    // Bottom Navigation
    navHome: 'होम',
    navPickup: 'पिकअप',
    navTrack: 'ट्रैक',
    navHistory: 'इतिहास',
    navProfile: 'प्रोफ़ाइल',

    // Profile & Settings
    profileTitle: 'प्रोफ़ाइल',
    householdAccount: 'घरेलू खाता',
    personalInformation: 'व्यक्तिगत जानकारी',
    savedAddresses: 'सहेजे गए पते',
    settings: 'सेटिंग्स',
    logout: 'लॉग आउट',
    preferences: 'प्राथमिकताएं',
    displayLanguage: 'ऐप की भाषा',
    chooseLanguage: 'पूरे ऐप के लिए अपनी पसंदीदा भाषा चुनें',
    savedSuccessfully: 'भाषा बदलकर कर दी गई:',
  },

  Kannada: {
    // Greetings & Header
    goodMorning: 'ಶುಭೋದಯ',
    goodAfternoon: 'ಶುಭ ಮಧ್ಯಾಹ್ನ',
    goodEvening: 'ಶುಭ ಸಂಜೆ',
    householdDashboard: 'ಮನೆಯ ಡ್ಯಾಶ್‌ಬೋರ್ಡ್',

    // Hero Banner
    turnRecyclables: 'ಮರುಬಳಕೆ ವಸ್ತುಗಳನ್ನು ಮೌಲ್ಯವಾಗಿ ಪರಿವರ್ತಿಸಿ.',
    schedulePickup: 'ಹತ್ತಿರದ ಕಲೆಕ್ಟರ್‌ನಿಂದ ಮನೆಬಾಗಿಲಿಗೆ ಪಿಕಪ್ ನಿಗದಿಪಡಿಸಿ.',
    requestPickup: 'ಪಿಕಪ್ ಬುಕ್ ಮಾಡಿ',

    // Quick Actions
    quickActions: 'ತ್ವರಿತ ಕ್ರಿಯೆಗಳು',
    sellRecyclables: 'ಸ್ಕ್ರ್ಯಾಪ್ ಮಾರಿ',
    getValue: 'ಉತ್ತಮ ಬೆಲೆ ಪಡೆಯಿರಿ',
    pickupHistory: 'ಪಿಕಪ್ ಇತಿಹಾಸ',
    viewPastPickups: 'ಹಿಂದಿನ ಪಿಕಪ್‌ಗಳು ನೋಡಿ',

    // Active & Recent Pickups
    activePickupStatus: 'ಸಕ್ರಿಯ ಪಿಕಪ್ ಪ್ರಗತಿಯಲ್ಲಿದೆ',
    recentActivity: 'ಇತ್ತೀಚಿನ ಪಿಕಪ್‌ಗಳು',
    noPickupsYet: 'ಇನ್ನೂ ಯಾವುದೇ ಪಿಕಪ್ ವಿನಂತಿಸಿಲ್ಲ. ಪ್ರಾರಂಭಿಸಲು "ಪಿಕಪ್ ಬುಕ್ ಮಾಡಿ" ಒತ್ತಿರಿ!',
    demoNotice: 'ಡೆಮೊ ಮೋಡ್. ಲೈವ್ ವಿನಂತಿಗಳನ್ನು ಉಳಿಸಲು ಸೈನ್ ಇನ್ ಮಾಡಿ.',
    signIn: 'ಸೈನ್ ಇನ್',

    // Bottom Navigation
    navHome: 'ಮುಖಪುಟ',
    navPickup: 'ಪಿಕಪ್',
    navTrack: 'ಟ್ರ್ಯಾಕ್',
    navHistory: 'ಇತಿಹಾಸ',
    navProfile: 'ಪ್ರೊಫೈಲ್',

    // Profile & Settings
    profileTitle: 'ಪ್ರೊಫೈಲ್',
    householdAccount: 'ಮನೆ ಖಾತೆ',
    personalInformation: 'ವೈಯಕ್ತಿಕ ಮಾಹಿತಿ',
    savedAddresses: 'ಉಳಿಸಿದ ವಿಳಾಸಗಳು',
    settings: 'ಸೆಟ್ಟಿಂಗ್‌ಗಳು',
    logout: 'ಲಾಗ್ ಔಟ್',
    preferences: 'ಆದ್ಯತೆಗಳು',
    displayLanguage: 'ಪ್ರದರ್ಶನ ಭಾಷೆ',
    chooseLanguage: 'ಇಡೀ ಅಪ್ಲಿಕೇಶನ್‌ಗೆ ನಿಮ್ಮ ಭಾಷೆಯನ್ನು ಆರಿಸಿ',
    savedSuccessfully: 'ಭಾಷೆ ಬದಲಾಯಿಸಲಾಗಿದೆ:',
  },

  Marathi: {
    // Greetings & Header
    goodMorning: 'शुभ प्रभात',
    goodAfternoon: 'शुभ दुपार',
    goodEvening: 'शुभ संध्याकाळ',
    householdDashboard: 'घरगुती डॅशबोर्ड',

    // Hero Banner
    turnRecyclables: 'घरातील भंगार व कचऱ्याचे पैशात रूपांतर करा.',
    schedulePickup: 'जवळच्या भंगार विक्रेत्याकडून डोअरस्टेप पिकअप शेड्यूल करा.',
    requestPickup: 'पिकअप बुक करा',

    // Quick Actions
    quickActions: 'जलद पर्याय',
    sellRecyclables: 'भंगार विका',
    getValue: 'योग्य भाव मिळवा',
    pickupHistory: 'पिकअप इतिहास',
    viewPastPickups: 'मागील व्यवहार पहा',

    // Active & Recent Pickups
    activePickupStatus: 'सक्रिय पिकअप प्रगतीपथावर आहे',
    recentActivity: 'नुकतेच झालेले पिकअप',
    noPickupsYet: 'अद्याप कोणतीही विनंती नाही. सुरू करण्यासाठी "पिकअप बुक करा" दाबा!',
    demoNotice: 'डेमो मोड. लाइव्ह डेटा सुरक्षित करण्यासाठी साइन इन करा.',
    signIn: 'साइन इन',

    // Bottom Navigation
    navHome: 'मुख्यपृष्ठ',
    navPickup: 'पिकअप',
    navTrack: 'ट्रॅक',
    navHistory: 'इतिहास',
    navProfile: 'प्रोफाइल',

    // Profile & Settings
    profileTitle: 'प्रोफाइल',
    householdAccount: 'घरगुती खाते',
    personalInformation: 'वैयक्तिक माहिती',
    savedAddresses: 'जतन केलेले पत्ते',
    settings: 'सेटिंग्ज',
    logout: 'लॉग आऊट',
    preferences: 'प्राधान्ये',
    displayLanguage: 'अॅपची भाषा',
    chooseLanguage: 'संपूर्ण अॅपसाठी आपली भाषा निवडा',
    savedSuccessfully: 'भाषा बदलून करण्यात आली:',
  },

  Tamil: {
    // Greetings & Header
    goodMorning: 'காலை வணக்கம்',
    goodAfternoon: 'மதிய வணக்கம்',
    goodEvening: 'மாலை வணக்கம்',
    householdDashboard: 'வீட்டு டாஷ்போர்டு',

    // Hero Banner
    turnRecyclables: 'மறுசுழற்சி பொருட்களை மதிப்பாக மாற்றுங்கள்.',
    schedulePickup: 'அருகிலுள்ள சேகரிப்பாளரிடமிருந்து பிக்கப் திட்டமிடுங்கள்.',
    requestPickup: 'பிக்கப் கோரிக்கை',

    // Quick Actions
    quickActions: 'விரைவு செயல்கள்',
    sellRecyclables: 'மறுசுழற்சி விற்க',
    getValue: 'நியாயமான விலை',
    pickupHistory: 'பிக்கப் வரலாறு',
    viewPastPickups: 'முந்தைய பிக்கப்',

    // Active & Recent Pickups
    activePickupStatus: 'செயலில் உள்ள பிக்கப்',
    recentActivity: 'சமீபத்திய பிக்கப்',
    noPickupsYet: 'இதுவரை பிக்கப் இல்லை. தொடங்க "பிக்கப் கோரிக்கை" தட்டவும்!',
    demoNotice: 'டெமோ முறை. தரவைச் சேமிக்க உள்நுழைக.',
    signIn: 'உள்நுழைக',

    // Bottom Navigation
    navHome: 'முகப்பு',
    navPickup: 'பிக்கப்',
    navTrack: 'ட்ராக்',
    navHistory: 'வரலாறு',
    navProfile: 'சுயவிவரம்',

    // Profile & Settings
    profileTitle: 'சுயவிவரம்',
    householdAccount: 'குடும்ப கணக்கு',
    personalInformation: 'தனிப்பட்ட தகவல்',
    savedAddresses: 'சேமிக்கப்பட்ட முகவரிகள்',
    settings: 'அமைப்புகள்',
    logout: 'வெளியேறு',
    preferences: 'விருப்பங்கள்',
    displayLanguage: 'காட்சி மொழி',
    chooseLanguage: 'பயன்பாட்டிற்கு உங்கள் மொழியைத் தேர்வுசெய்க',
    savedSuccessfully: 'மொழி மாற்றப்பட்டது:',
  },

  Telugu: {
    // Greetings & Header
    goodMorning: 'శుభోదయం',
    goodAfternoon: 'శుభ మధ్యాహ్నం',
    goodEvening: 'శుభ సాయంత్రం',
    householdDashboard: 'గృహ డాష్‌బోర్డ్',

    // Hero Banner
    turnRecyclables: 'రీసైక్లింగ్ వ్యర్థాలను ఆదాయంగా మార్చుకోండి.',
    schedulePickup: 'సమీప కలెక్టర్ నుండి డోర్‌స్టెప్ పికప్ షెడ్యూల్ చేయండి.',
    requestPickup: 'పికప్ బుక్ చేయండి',

    // Quick Actions
    quickActions: 'త్వరిత చర్యలు',
    sellRecyclables: 'వ్యర్థాలను అమ్మండి',
    getValue: 'మంచి ధర పొందండి',
    pickupHistory: 'పికప్ హిస్టరీ',
    viewPastPickups: 'గత పికప్‌లను చూడండి',

    // Active & Recent Pickups
    activePickupStatus: 'యాక్టివ్ పికప్ పురోగతిలో ఉంది',
    recentActivity: 'ఇటీవలి పికప్‌లు',
    noPickupsYet: 'ఇంకా పికప్ అభ్యర్థనలు లేవు. ప్రారంభించడానికి "పికప్ బుక్ చేయండి" నొక్కండి!',
    demoNotice: 'డెమో ప్రివ్యూ మోడ్. సేవ్ చేయడానికి లాగిన్ అవ్వండి.',
    signIn: 'సైన్ ఇన్',

    // Bottom Navigation
    navHome: 'హోమ్',
    navPickup: 'పికప్',
    navTrack: 'ట్రాక్',
    navHistory: 'చరిత్ర',
    navProfile: 'ప్రొఫైల్',

    // Profile & Settings
    profileTitle: 'ప్రొఫైల్',
    householdAccount: 'గృహ ఖాతా',
    personalInformation: 'వ్యక్తిగత సమాచారం',
    savedAddresses: 'సేవ్ చేసిన చిరునామాలు',
    settings: 'సెట్టింగ్‌లు',
    logout: 'లాగ్ అవుట్',
    preferences: 'ప్రాధాన్యతలు',
    displayLanguage: 'భాష ఎంపిక',
    chooseLanguage: 'యాప్ కోసం మీ ప్రాధాన్య భాషను ఎంచుకోండి',
    savedSuccessfully: 'భాష మార్చబడింది:',
  },
};

export function getCurrentLanguage(): SupportedLanguage {
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem('scrapmax_language') || localStorage.getItem('aicle_language');
      if (stored && stored in TRANSLATIONS) {
        return stored as SupportedLanguage;
      }
      // Check legacy settings key if any
      const settings = localStorage.getItem('scrapmax_settings') || localStorage.getItem('aicle_settings');
      if (settings) {
        const parsed = JSON.parse(settings);
        if (parsed.language && parsed.language in TRANSLATIONS) {
          return parsed.language as SupportedLanguage;
        }
      }
    } catch {
      // ignore
    }
  }
  return 'English';
}

export function setAppLanguage(lang: SupportedLanguage) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('scrapmax_language', lang);
    localStorage.setItem('aicle_language', lang);
    // Also sync with settings
    try {
      const settings = localStorage.getItem('scrapmax_settings') || localStorage.getItem('aicle_settings');
      const parsed = settings ? JSON.parse(settings) : {};
      parsed.language = lang;
      localStorage.setItem('scrapmax_settings', JSON.stringify(parsed));
      localStorage.setItem('aicle_settings', JSON.stringify(parsed));
    } catch {
      // ignore
    }
    // Broadcast event across all components in the tab
    window.dispatchEvent(new CustomEvent('scrapmax_language_change', { detail: lang }));
    window.dispatchEvent(new CustomEvent('aicle_language_change', { detail: lang }));
  }
}

export function useTranslation() {
  const [language, setLanguageState] = useState<SupportedLanguage>(getCurrentLanguage);

  useEffect(() => {
    const handleLangChange = (e: Event) => {
      const customEvent = e as CustomEvent<SupportedLanguage>;
      if (customEvent.detail && customEvent.detail in TRANSLATIONS) {
        setLanguageState(customEvent.detail);
      } else {
        setLanguageState(getCurrentLanguage());
      }
    };

    window.addEventListener('scrapmax_language_change', handleLangChange);
    window.addEventListener('aicle_language_change', handleLangChange);
    window.addEventListener('storage', handleLangChange);

    return () => {
      window.removeEventListener('scrapmax_language_change', handleLangChange);
      window.removeEventListener('aicle_language_change', handleLangChange);
      window.removeEventListener('storage', handleLangChange);
    };
  }, []);

  const t = (key: string): string => {
    const langDict = TRANSLATIONS[language] || TRANSLATIONS.English;
    return langDict[key] || TRANSLATIONS.English[key] || key;
  };

  const updateLanguage = (newLang: SupportedLanguage) => {
    setLanguageState(newLang);
    setAppLanguage(newLang);
  };

  return { t, language, setLanguage: updateLanguage };
}

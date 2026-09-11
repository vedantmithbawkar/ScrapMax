'use client';

import { useState, useEffect } from 'react';

export type SupportedLanguage = 'English' | 'Hindi' | 'Marathi' | 'Gujarati' | 'Kannada' | 'Tamil' | 'Telugu';

export interface LanguageOption {
  code: SupportedLanguage;
  label: string;
  nativeName: string;
  short: string;
  flag: string;
  welcome: string;
  greeting: string;
}

export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  { code: 'English', label: 'English', nativeName: 'English', short: 'EN', flag: '🇬🇧', welcome: 'Welcome to ScrapMax', greeting: 'Hello' },
  { code: 'Hindi', label: 'Hindi', nativeName: 'हिन्दी', short: 'HI', flag: '🇮🇳', welcome: 'स्क्रैपमैक्स में आपका स्वागत है', greeting: 'नमस्ते' },
  { code: 'Marathi', label: 'Marathi', nativeName: 'मराठी', short: 'MR', flag: '🚩', welcome: 'स्क्रॅपमॅक्समध्ये आपले स्वागत आहे', greeting: 'नमस्कार' },
  { code: 'Gujarati', label: 'Gujarati', nativeName: 'ગુજરાતી', short: 'GU', flag: '🌾', welcome: 'સ્ક્રેપમેક્સમાં તમારું સ્વાગત છે', greeting: 'નમસ્તે' },
  { code: 'Kannada', label: 'Kannada', nativeName: 'ಕನ್ನಡ', short: 'KN', flag: '🏛️', welcome: 'ಸ್ಕ್ರ್ಯಾಪ್‌ಮ್ಯಾಕ್ಸ್‌ಗೆ ಸುಸ್ವಾಗತ', greeting: 'ನಮಸ್ಕಾರ' },
  { code: 'Tamil', label: 'Tamil', nativeName: 'தமிழ்', short: 'TA', flag: '🌴', welcome: 'ஸ்க்ராப்மேக்ஸிற்கு நல்வரவு', greeting: 'வணக்கம்' },
  { code: 'Telugu', label: 'Telugu', nativeName: 'తెలుగు', short: 'TE', flag: '🌅', welcome: 'స్క్రాప్‌మ్యాక్స్‌కు స్వాగతం', greeting: 'నమస్కారం' },
];

export const ISO_LANG_MAP: Record<SupportedLanguage, string> = {
  English: 'en',
  Hindi: 'hi',
  Marathi: 'mr',
  Gujarati: 'gu',
  Kannada: 'kn',
  Tamil: 'ta',
  Telugu: 'te',
};

export const TRANSLATIONS: Record<SupportedLanguage, Record<string, string>> = {
  English: {
    // PWA & Language Onboarding
    welcomeToApp: 'Welcome to ScrapMax',
    pwaLangWelcome: 'Choose Your Preferred Language',
    pwaLangSubtitle: 'Select a language to experience the entire ScrapMax PWA in your preferred language.',
    pwaContinue: 'Continue in English',
    pwaSelectHint: 'You can change your language anytime from the top navigation bar.',
    switchLang: 'Language',

    // Greetings & Header
    goodMorning: 'Good morning',
    goodAfternoon: 'Good afternoon',
    goodEvening: 'Good evening',
    householdDashboard: 'Household Dashboard',
    collectorDashboard: 'Collector Dashboard',
    recyclerDashboard: 'Recycler Dashboard',
    adminDashboard: 'Admin Dashboard',

    // Navbar
    navHome: 'Home',
    navPickup: 'Schedule Pickup',
    navTrack: 'Live Track',
    navHistory: 'History',
    navProfile: 'Profile',
    navMarketplace: 'Scrap Rates',
    navImpact: 'Green Impact',
    navReports: 'File Report',
    navAdmin: 'Admin Portal',
    navSignIn: 'Sign In',
    navRegister: 'Get Started',
    navLogout: 'Sign Out',

    // Hero Banner & Landing
    turnRecyclables: 'Turn household scrap into instant value.',
    schedulePickup: 'Schedule door-step pickup from verified, geotagged kabadiwalas.',
    requestPickup: 'Request Pickup Now',
    sellRecyclables: 'Sell Recyclables',
    getValue: 'Get Transparent Rates',
    pickupHistory: 'Pickup History',
    viewPastPickups: 'View Past Pickups',
    joinAsCollector: 'Register as Collector',
    benchmarkRates: 'Daily Scrap Rates',
    whyScrapMax: 'Why Choose ScrapMax?',
    impactTitle: 'Verifiable Green Impact',

    // Active & Recent Pickups
    activePickupStatus: 'Active Pickup in Progress',
    recentActivity: 'Recent Pickups',
    noPickupsYet: 'No pickups requested yet. Tap "Request pickup" to get started!',
    demoNotice: 'Demo preview mode. Sign in to save live pickup requests to Supabase.',
    signIn: 'Sign In',

    // Profile & Settings
    profileTitle: 'Profile',
    householdAccount: 'Household Account',
    personalInformation: 'Personal Information',
    savedAddresses: 'Saved Addresses',
    settings: 'Settings',
    logout: 'Log Out',
    preferences: 'Preferences',
    displayLanguage: 'Display Language',
    chooseLanguage: 'Choose your preferred language for the entire app',
    savedSuccessfully: 'Language changed to',

    // Aadhaar e-KYC
    aadhaarTitle: 'UIDAI Aadhaar e-KYC Verification',
    aadhaarSubtitle: 'Mandatory identity verification for certified scrap collectors.',
    enterAadhaar: '12-Digit Aadhaar Card Number',
    getOtp: 'Get OTP',
    resendOtp: 'Resend OTP',
    verifyOtp: 'Verify OTP',
    enterOtpCode: 'Enter 6-Digit Aadhaar OTP',
    aadhaarVerifiedOk: 'Aadhaar Verified | UIDAI OK',

    // Common
    loading: 'Loading...',
    save: 'Save',
    cancel: 'Cancel',
    confirm: 'Confirm',
    verified: 'Verified',
  },

  Hindi: {
    // PWA & Language Onboarding
    welcomeToApp: 'स्क्रैपमैक्स में आपका स्वागत है',
    pwaLangWelcome: 'अपनी पसंदीदा भाषा चुनें',
    pwaLangSubtitle: 'पूरे स्क्रैपमैक्स ऐप को अपनी भाषा में चलाने के लिए नीचे दी गई भाषा चुनें।',
    pwaContinue: 'हिन्दी में आगे बढ़ें',
    pwaSelectHint: 'आप ऊपर दिए गए नेवबार से कभी भी भाषा बदल सकते हैं।',
    switchLang: 'भाषा',

    // Greetings & Header
    goodMorning: 'सुप्रभात',
    goodAfternoon: 'शुभ दोपहर',
    goodEvening: 'शुभ संध्या',
    householdDashboard: 'घरेलू डैशबोर्ड',
    collectorDashboard: 'कलेक्टर डैशबोर्ड',
    recyclerDashboard: 'रीसाइक्लर डैशबोर्ड',
    adminDashboard: 'एडमिन पोर्टल',

    // Navbar
    navHome: 'होम',
    navPickup: 'पिकअप शेड्यूल करें',
    navTrack: 'लाइव ट्रैकिंग',
    navHistory: 'इतिहास',
    navProfile: 'प्रोफ़ाइल',
    navMarketplace: 'कबाड़ के भाव',
    navImpact: 'पर्यावरण प्रभाव',
    navReports: 'शिकायत दर्ज करें',
    navAdmin: 'एडमिन पोर्टल',
    navSignIn: 'लॉग इन करें',
    navRegister: 'शुरू करें',
    navLogout: 'लॉग आउट',

    // Hero Banner & Landing
    turnRecyclables: 'घर के कबाड़ को बनाएं तुरंत आमदनी।',
    schedulePickup: 'सत्यापित व नजदीकी कबाड़ीवाले से घर बैठे डोरस्टेप पिकअप बुक करें।',
    requestPickup: 'अभी पिकअप बुक करें',
    sellRecyclables: 'कबाड़ बेचें',
    getValue: 'पारदर्शी व सही भाव पाएं',
    pickupHistory: 'पिकअप इतिहास',
    viewPastPickups: 'पुराने पिकअप देखें',
    joinAsCollector: 'कलेक्टर के रूप में जुड़ें',
    benchmarkRates: 'आज के कबाड़ के दाम',
    whyScrapMax: 'स्क्रैपमैक्स ही क्यों चुनें?',
    impactTitle: 'सत्यापित हरित प्रभाव',

    // Active & Recent Pickups
    activePickupStatus: 'सक्रिय पिकअप प्रगति पर है',
    recentActivity: 'हालिया पिकअप',
    noPickupsYet: 'अभी कोई पिकअप नहीं है। शुरू करने के लिए "पिकअप बुक करें" पर टैप करें!',
    demoNotice: 'डेमो मोड। लाइव डेटा डेटाबेस में सुरक्षित करने के लिए साइन इन करें।',
    signIn: 'साइन इन करें',

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

    // Aadhaar e-KYC
    aadhaarTitle: 'UIDAI आधार ई-केवाईसी सत्यापन',
    aadhaarSubtitle: 'प्रमाणित कबाड़ संग्राहकों के लिए अनिवार्य पहचान सत्यापन।',
    enterAadhaar: '12 अंकों का आधार कार्ड नंबर',
    getOtp: 'ओटीपी प्राप्त करें',
    resendOtp: 'पुनः ओटीपी भेजें',
    verifyOtp: 'ओटीपी सत्यापित करें',
    enterOtpCode: '6 अंकों का आधार ओटीपी दर्ज करें',
    aadhaarVerifiedOk: 'आधार सत्यापित | UIDAI OK',

    // Common
    loading: 'लोड हो रहा है...',
    save: 'सहेजें',
    cancel: 'रद्द करें',
    confirm: 'पुष्टि करें',
    verified: 'सत्यापित',
  },

  Marathi: {
    // PWA & Language Onboarding
    welcomeToApp: 'स्क्रॅपमॅक्समध्ये आपले स्वागत आहे',
    pwaLangWelcome: 'आपली पसंतीची भाषा निवडा',
    pwaLangSubtitle: 'संपूर्ण स्क्रॅपमॅक्स अॅप आपल्या भाषेत वापरण्यासाठी खालील भाषा निवडा.',
    pwaContinue: 'मराठीत पुढे जा',
    pwaSelectHint: 'आपण वर दिलेल्या नेव्हिगेशन बारमधून कधीही भाषा बदलू शकता.',
    switchLang: 'भाषा',

    // Greetings & Header
    goodMorning: 'शुभ प्रभात',
    goodAfternoon: 'शुभ दुपार',
    goodEvening: 'शुभ संध्याकाळ',
    householdDashboard: 'घरगुती डॅशबोर्ड',
    collectorDashboard: 'कलेक्टर डॅशबोर्ड',
    recyclerDashboard: 'रिसायकलिंग डॅशबोर्ड',
    adminDashboard: 'प्रशासक पोर्टल',

    // Navbar
    navHome: 'मुख्यपृष्ठ',
    navPickup: 'पिकअप बुक करा',
    navTrack: 'थेट ट्रॅकिंग',
    navHistory: 'इतिहास',
    navProfile: 'प्रोफाइल',
    navMarketplace: 'स्क्रॅपचे दर',
    navImpact: 'हरित प्रभाव',
    navReports: 'तक्रार नोंदवा',
    navAdmin: 'प्रशासक पोर्टल',
    navSignIn: 'साइन इन',
    navRegister: 'सुरू करा',
    navLogout: 'लॉग आऊट',

    // Hero Banner & Landing
    turnRecyclables: 'घरातील भंगाराचे त्वरित पैशात रूपांतर करा.',
    schedulePickup: 'प्रमाणित स्थानिक भंगारवाल्याकडून घरपोच पिकअप मिळवा.',
    requestPickup: 'आता पिकअप बुक करा',
    sellRecyclables: 'भंगार विका',
    getValue: 'पारदर्शक व योग्य दर मिळवा',
    pickupHistory: 'पिकअप इतिहास',
    viewPastPickups: 'मागील पिकअप पहा',
    joinAsCollector: 'कलेक्टर म्हणून नोंदणी करा',
    benchmarkRates: 'आजचे भंगार दर',
    whyScrapMax: 'स्क्रॅपमॅक्स का निवडावे?',
    impactTitle: 'प्रमाणित हरित प्रभाव',

    // Active & Recent Pickups
    activePickupStatus: 'सक्रिय पिकअप प्रगतीपथावर आहे',
    recentActivity: 'अलीकडील पिकअप',
    noPickupsYet: 'अद्याप कोणतेही पिकअप नाही. सुरू करण्यासाठी "पिकअप बुक करा" वर टॅप करा!',
    demoNotice: 'डेमो मोड. थेट डेटा सुरक्षित करण्यासाठी साइन इन करा.',
    signIn: 'साइन इन करा',

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

    // Aadhaar e-KYC
    aadhaarTitle: 'UIDAI आधार ई-केवायसी पडताळणी',
    aadhaarSubtitle: 'प्रमाणित भंगार गोळा करणाऱ्यांसाठी अनिवार्य ओळख पडताळणी.',
    enterAadhaar: '12 अंकी आधार कार्ड क्रमांक',
    getOtp: 'ओटीपी मिळवा',
    resendOtp: 'पुन्हा ओटीपी पाठवा',
    verifyOtp: 'ओटीपी पडताळा',
    enterOtpCode: '6 अंकी आधार ओटीपी टाका',
    aadhaarVerifiedOk: 'आधार पडताळणी पूर्ण | UIDAI OK',

    // Common
    loading: 'लोड होत आहे...',
    save: 'जतन करा',
    cancel: 'रद्द करा',
    confirm: 'पुष्टी करा',
    verified: 'पडताळलेले',
  },

  Gujarati: {
    // PWA & Language Onboarding
    welcomeToApp: 'સ્ક્રેપમેક્સમાં તમારું સ્વાગત છે',
    pwaLangWelcome: 'તમારી પસંદગીની ભાષા પસંદ કરો',
    pwaLangSubtitle: 'આખા સ્ક્રેપમેક્સ એપને તમારી ભાષામાં વાપરવા માટે નીચેથી ભાષા પસંદ કરો.',
    pwaContinue: 'ગુજરાતીમાં આગળ વધો',
    pwaSelectHint: 'તમે ઉપર આપેલા નેવિગેશન બારમાંથી ગમે ત્યારે ભાષા બદલી શકો છો.',
    switchLang: 'ભાષા',

    // Greetings & Header
    goodMorning: 'શુભ સવાર',
    goodAfternoon: 'શુભ બપોર',
    goodEvening: 'શુભ સાંજ',
    householdDashboard: 'ઘરગથ્થુ ડેશબોર્ડ',
    collectorDashboard: 'કલેક્ટર ડેશબોર્ડ',
    recyclerDashboard: 'રિસાઇકલિંગ ડેશબોર્ડ',
    adminDashboard: 'એડમિન પોર્ટલ',

    // Navbar
    navHome: 'હોમ',
    navPickup: 'પિકઅપ બુક કરો',
    navTrack: 'લાઈવ ટ્રેકિંગ',
    navHistory: 'ઇતિહાસ',
    navProfile: 'પ્રોફાઇલ',
    navMarketplace: 'ભંગારના ભાવ',
    navImpact: 'પર્યાવરણ પ્રભાવ',
    navReports: 'ફરિયાદ નોંધાવો',
    navAdmin: 'એડમિન પોર્ટલ',
    navSignIn: 'સાઇન ઇન',
    navRegister: 'શરૂ કરો',
    navLogout: 'લૉગ આઉટ',

    // Hero Banner & Landing
    turnRecyclables: 'ઘરના ભંગારમાંથી તરત જ આવક મેળવો.',
    schedulePickup: 'ચકાસાયેલ સ્થાનિક ભંગારવાળા પાસેથી ડોરસ્ટેપ પિકઅપ મેળવો.',
    requestPickup: 'હમણાં પિકઅપ બુક કરો',
    sellRecyclables: 'ભંગાર વેચો',
    getValue: 'પારદર્શક અને સાચા ભાવ મેળવો',
    pickupHistory: 'પિકઅપ ઇતિહાસ',
    viewPastPickups: 'પાછલા પિકઅપ જુઓ',
    joinAsCollector: 'કલેક્ટર તરીકે જોડાવો',
    benchmarkRates: 'આજના ભંગારના ભાવ',
    whyScrapMax: 'શા માટે સ્ક્રેપમેક્સ પસંદ કરવું?',
    impactTitle: 'પર્યાવરણ સંરક્ષણ પ્રભાવ',

    // Active & Recent Pickups
    activePickupStatus: 'સક્રિય પિકઅપ ચાલુ છે',
    recentActivity: 'તાજેતરના પિકઅપ',
    noPickupsYet: 'હજી સુધી કોઈ પિકઅપ નથી. શરૂ કરવા માટે "પિકઅપ બુક કરો" પર ટેપ કરો!',
    demoNotice: 'ડેમો મોડ. લાઇવ ડેટા સાચવવા માટે સાઇન ઇન કરો.',
    signIn: 'સાઇન ઇન કરો',

    // Profile & Settings
    profileTitle: 'પ્રોફાઇલ',
    householdAccount: 'ઘરગથ્થુ ખાતું',
    personalInformation: 'વ્યક્તિગત માહિતી',
    savedAddresses: 'સાચવેલા સરનામાં',
    settings: 'સેટિંગ્સ',
    logout: 'લૉગ આઉટ',
    preferences: 'પસંદગીઓ',
    displayLanguage: 'એપની ભાષા',
    chooseLanguage: 'આખા એપ માટે તમારી પસંદગીની ભાષા પસંદ કરો',
    savedSuccessfully: 'ભાષા બદલીને કરવામાં આવી:',

    // Aadhaar e-KYC
    aadhaarTitle: 'UIDAI આધાર ઈ-કેવાયસી ચકાસણી',
    aadhaarSubtitle: 'પ્રમાણિત ભંગાર સંગ્રાહકો માટે ફરજિયાત ઓળખ ચકાસણી.',
    enterAadhaar: '12 અંકનો આધાર કાર્ડ નંબર',
    getOtp: 'ઓટીપી મેળવો',
    resendOtp: 'ફરીથી ઓટીપી મોકલો',
    verifyOtp: 'ઓટીપી ચકાસો',
    enterOtpCode: '6 અંકનો આધાર ઓટીપી દાખલ કરો',
    aadhaarVerifiedOk: 'આધાર ચકાસણી સફળ | UIDAI OK',

    // Common
    loading: 'લોડ થઈ રહ્યું છે...',
    save: 'સાચવો',
    cancel: 'રદ કરો',
    confirm: 'ખાતરી કરો',
    verified: 'ચકાસાયેલ',
  },

  Kannada: {
    welcomeToApp: 'ಸ್ಕ್ರ್ಯಾಪ್‌ಮ್ಯಾಕ್ಸ್‌ಗೆ ಸುಸ್ವಾಗತ',
    pwaLangWelcome: 'ನಿಮ್ಮ ಭಾಷೆಯನ್ನು ಆಯ್ಕೆಮಾಡಿ',
    pwaLangSubtitle: 'ನಿಮ್ಮ ಭಾಷೆಯಲ್ಲಿ ಸ್ಕ್ರ್ಯಾಪ್‌ಮ್ಯಾಕ್ಸ್ ಬಳಸಲು ಕೆಳಗೆ ಆಯ್ಕೆಮಾಡಿ.',
    pwaContinue: 'ಕನ್ನಡದಲ್ಲಿ ಮುಂದುವರಿಯಿರಿ',
    pwaSelectHint: 'ನೀವು ಮೇಲಿನ ಮೆನುವಿನಿಂದ ಯಾವುದೇ ಸಮಯದಲ್ಲಿ ಭಾಷೆ ಬದಲಾಯಿಸಬಹುದು.',
    switchLang: 'ಭಾಷೆ',
    goodMorning: 'ಶುಭೋದಯ',
    goodAfternoon: 'ಶುಭ ಮಧ್ಯಾಹ್ನ',
    goodEvening: 'ಶುಭ ಸಂಜೆ',
    householdDashboard: 'ಮನೆಯ ಡ್ಯಾಶ್‌ಬೋರ್ಡ್',
    collectorDashboard: 'ಕಲೆಕ್ಟರ್ ಡ್ಯಾಶ್‌ಬೋರ್ಡ್',
    recyclerDashboard: 'ಮರುಬಳಕೆ ಡ್ಯಾಶ್‌ಬೋರ್ಡ್',
    adminDashboard: 'ನಿರ್ವಾಹಕ ಪೋರ್ಟಲ್',
    navHome: 'ಮುಖಪುಟ',
    navPickup: 'ಪಿಕಪ್ ನಿಗದಿಪಡಿಸಿ',
    navTrack: 'ಲೈವ್ ಟ್ರ್ಯಾಕ್',
    navHistory: 'ಇತಿಹಾಸ',
    navProfile: 'ಪ್ರೊಫೈಲ್',
    navMarketplace: 'ಸ್ಕ್ರ್ಯಾಪ್ ದರಗಳು',
    navImpact: 'ಹಸಿರು ಪ್ರಭಾವ',
    navReports: 'ದೂರು ದಾಖಲಿಸಿ',
    navAdmin: 'ನಿರ್ವಾಹಕ ಪೋರ್ಟಲ್',
    navSignIn: 'ಸೈನ್ ಇನ್',
    navRegister: 'ಪ್ರಾರಂಭಿಸಿ',
    navLogout: 'ಲಾಗ್ ಔಟ್',
    turnRecyclables: 'ಮರುಬಳಕೆ ವಸ್ತುಗಳನ್ನು ಮೌಲ್ಯವಾಗಿ ಪರಿವರ್ತಿಸಿ.',
    schedulePickup: 'ಹತ್ತಿರದ ಕಲೆಕ್ಟರ್‌ನಿಂದ ಮನೆಬಾಗಿಲಿಗೆ ಪಿಕಪ್ ನಿಗದಿಪಡಿಸಿ.',
    requestPickup: 'ಪಿಕಪ್ ಬುಕ್ ಮಾಡಿ',
    sellRecyclables: 'ಮರುಬಳಕೆ ವಸ್ತುಗಳನ್ನು ಮಾರಿ',
    getValue: 'ನ್ಯಾಯಯುತ ಮೌಲ್ಯ ಪಡೆಯಿರಿ',
    pickupHistory: 'ಪಿಕಪ್ ಇತಿಹಾಸ',
    viewPastPickups: 'ಹಿಂದಿನ ಪಿಕಪ್ ನೋಡಿ',
    joinAsCollector: 'ಕಲೆಕ್ಟರ್ ಆಗಿ ನೋಂದಾಯಿಸಿ',
    benchmarkRates: 'ಇಂದಿನ ದರಗಳು',
    whyScrapMax: 'ಸ್ಕ್ರ್ಯಾಪ್‌ಮ್ಯಾಕ್ಸ್ ಏಕೆ?',
    impactTitle: 'ಹಸಿರು ಪ್ರಭಾವ',
    activePickupStatus: 'ಸಕ್ರಿಯ ಪಿಕಪ್ ಪ್ರಗತಿಯಲ್ಲಿದೆ',
    recentActivity: 'ಇತ್ತೀಚಿನ ಪಿಕಪ್‌ಗಳು',
    noPickupsYet: 'ಇನ್ನೂ ಯಾವುದೇ ಪಿಕಪ್ ಇಲ್ಲ.',
    demoNotice: 'ಡೆಮೊ ಮೋಡ್.',
    signIn: 'ಸೈನ್ ಇನ್ ಮಾಡಿ',
    profileTitle: 'ಪ್ರೊಫೈಲ್',
    householdAccount: 'ಮನೆಯ ಖಾತೆ',
    personalInformation: 'ವೈಯಕ್ತಿಕ ಮಾಹಿತಿ',
    savedAddresses: 'ಉಳಿಸಿದ ವಿಳಾಸಗಳು',
    settings: 'ಸೆಟ್ಟಿಂಗ್‌ಗಳು',
    logout: 'ಲಾಗ್ ಔಟ್',
    preferences: 'ಆದ್ಯತೆಗಳು',
    displayLanguage: 'ಪ್ರದರ್ಶನ ಭಾಷೆ',
    chooseLanguage: 'ಇಡೀ ಅಪ್ಲಿಕೇಶನ್‌ಗೆ ನಿಮ್ಮ ಭಾಷೆಯನ್ನು ಆರಿಸಿ',
    savedSuccessfully: 'ಭಾಷೆ ಬದಲಾಗಿದೆ:',
    aadhaarTitle: 'UIDAI ಆಧಾರ್ ಪರಿಶೀಲನೆ',
    aadhaarSubtitle: 'ಕಡ್ಡಾಯ ಗುರುತಿನ ಪರಿಶೀಲನೆ.',
    enterAadhaar: '12 ಅಂಕಿಯ ಆಧಾರ್ ಕಾರ್ಡ್ ಸಂಖ್ಯೆ',
    getOtp: 'OTP ಪಡೆಯಿರಿ',
    resendOtp: 'ಮತ್ತೆ ಕಳುಹಿಸಿ',
    verifyOtp: 'ಪರಿಶೀಲಿಸಿ',
    enterOtpCode: '6 ಅಂಕಿಯ OTP ನಮೂದಿಸಿ',
    aadhaarVerifiedOk: 'ಆಧಾರ್ ಪರಿಶೀಲಿಸಲಾಗಿದೆ | UIDAI OK',
    loading: 'ಲೋಡ್ ಆಗುತ್ತಿದೆ...',
    save: 'ಉಳಿಸಿ',
    cancel: 'ರದ್ದುಮಾಡಿ',
    confirm: 'ದೃಢೀಕರಿಸಿ',
    verified: 'ಪರಿಶೀಲಿಸಲಾಗಿದೆ',
  },

  Tamil: {
    welcomeToApp: 'ஸ்க்ராப்மேக்ஸிற்கு நல்வரவு',
    pwaLangWelcome: 'உங்கள் மொழியைத் தேர்ந்தெடுக்கவும்',
    pwaLangSubtitle: 'உங்கள் மொழியில் ஸ்க்ராப்மேக்ஸைப் பயன்படுத்த கீழே தேர்வு செய்யவும்.',
    pwaContinue: 'தமிழில் தொடரவும்',
    pwaSelectHint: 'மேலே உள்ள பட்டியில் எந்த நேரத்திலும் மொழியை மாற்றலாம்.',
    switchLang: 'மொழி',
    goodMorning: 'காலை வணக்கம்',
    goodAfternoon: 'மதிய வணக்கம்',
    goodEvening: 'மாலை வணக்கம்',
    householdDashboard: 'வீட்டு டாஷ்போர்டு',
    collectorDashboard: 'சேகரிப்பாளர் டாஷ்போர்டு',
    recyclerDashboard: 'மறுசுழற்சி டாஷ்போர்டு',
    adminDashboard: 'நிர்வாகி போர்டல்',
    navHome: 'முகப்பு',
    navPickup: 'பிக்கப் திட்டமிடுங்கள்',
    navTrack: 'ட்ராக்',
    navHistory: 'வரலாறு',
    navProfile: 'சுயவிவரம்',
    navMarketplace: 'பழைய பொருள் விலை',
    navImpact: 'பசுமை தாக்கம்',
    navReports: 'புகார் பதிவு',
    navAdmin: 'நிர்வாகி போர்டல்',
    navSignIn: 'உள்நுழைக',
    navRegister: 'தொடங்கவும்',
    navLogout: 'வெளியேறு',
    turnRecyclables: 'மறுசுழற்சி பொருட்களை மதிப்பாக மாற்றுங்கள்.',
    schedulePickup: 'அருகிலுள்ள சேகரிப்பாளரிடமிருந்து பிக்கப் திட்டமிடுங்கள்.',
    requestPickup: 'பிக்கப் கோரிக்கை',
    sellRecyclables: 'மறுசுழற்சி விற்க',
    getValue: 'நியாயமான விலை',
    pickupHistory: 'பிக்கப் வரலாறு',
    viewPastPickups: 'முந்தைய பிக்கப்',
    joinAsCollector: 'சேகரிப்பாளராக சேருங்கள்',
    benchmarkRates: 'இன்றைய விலைகள்',
    whyScrapMax: 'ஏன் ஸ்க்ராப்மேக்ஸ்?',
    impactTitle: 'பசுமை தாக்கம்',
    activePickupStatus: 'செயலில் உள்ள பிக்கப்',
    recentActivity: 'சமீபத்திய பிக்கப்',
    noPickupsYet: 'இதுவரை பிக்கப் இல்லை.',
    demoNotice: 'டெமோ முறை.',
    signIn: 'உள்நுழைக',
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
    aadhaarTitle: 'UIDAI ஆதார் சரிபார்ப்பு',
    aadhaarSubtitle: 'கட்டாய அடையாள சரிபார்ப்பு.',
    enterAadhaar: '12 இலக்க ஆதார் எண்',
    getOtp: 'OTP பெறுக',
    resendOtp: 'மீண்டும் அனுப்புக',
    verifyOtp: 'சரிபார்க்கவும்',
    enterOtpCode: '6 இலக்க OTP உள்ளிடவும்',
    aadhaarVerifiedOk: 'ஆதார் சரிபார்க்கப்பட்டது | UIDAI OK',
    loading: 'ஏற்றுகிறது...',
    save: 'சேமி',
    cancel: 'ரத்து செய்',
    confirm: 'உறுதி செய்',
    verified: 'சரிபார்க்கப்பட்டது',
  },

  Telugu: {
    welcomeToApp: 'స్క్రాప్‌మ్యాక్స్‌కు స్వాగతం',
    pwaLangWelcome: 'మీ భాషను ఎంచుకోండి',
    pwaLangSubtitle: 'మీ భాషలో స్క్రాప్‌మ్యాక్స్ ఉపయోగించడానికి కింద ఎంచుకోండి.',
    pwaContinue: 'తెలుగులో కొనసాగించండి',
    pwaSelectHint: 'మీరు ఎప్పుడైనా పై మెనూ నుండి భాషను మార్చవచ్చు.',
    switchLang: 'భాష',
    goodMorning: 'శుభోదయం',
    goodAfternoon: 'శుభ మధ్యాహ్నం',
    goodEvening: 'శుభ సాయంత్రం',
    householdDashboard: 'గృహ డ్యాష్‌బోర్డ్',
    collectorDashboard: 'కలెక్టర్ డ్యాష్‌బోర్డ్',
    recyclerDashboard: 'రీసైక్లర్ డ్యాష్‌బోర్డ్',
    adminDashboard: 'అడ్మిన్ పోర్టల్',
    navHome: 'హోమ్',
    navPickup: 'పికప్ షెడ్యూల్',
    navTrack: 'లైవ్ ట్రాక్',
    navHistory: 'చరిత్ర',
    navProfile: 'ప్రొఫైల్',
    navMarketplace: 'స్క్రాప్ ధరలు',
    navImpact: 'హరిత ప్రభావం',
    navReports: 'ఫిర్యాదు చేయండి',
    navAdmin: 'అడ్మిన్ పోర్టల్',
    navSignIn: 'సైన్ ఇన్',
    navRegister: 'ప్రారంభించండి',
    navLogout: 'లాగ్ అవుట్',
    turnRecyclables: 'రీసైకిల్ చేయగల వస్తువులను నగదుగా మార్చుకోండి.',
    schedulePickup: 'సమీప కలెక్టర్ నుండి డోర్‌స్టెప్ పికప్ పొందండి.',
    requestPickup: 'పికప్ అభ్యర్థన',
    sellRecyclables: 'స్క్రాప్ అమ్మండి',
    getValue: 'సరసమైన ధర పొందండి',
    pickupHistory: 'పికప్ చరిత్ర',
    viewPastPickups: 'గత పికప్‌లు',
    joinAsCollector: 'కలెక్టర్‌గా చేరండి',
    benchmarkRates: 'ఈరోజు ధరలు',
    whyScrapMax: 'స్క్రాప్‌మ్యాక్స్ ఎందుకు?',
    impactTitle: 'హరిత ప్రభావం',
    activePickupStatus: 'యాక్టివ్ పికప్ పురోగతిలో ఉంది',
    recentActivity: 'ఇటీవలి పికప్‌లు',
    noPickupsYet: 'ఇంకా పికప్‌లు లేవు.',
    demoNotice: 'డెమో మోడ్.',
    signIn: 'సైన్ ఇన్',
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
    aadhaarTitle: 'UIDAI ఆధార్ ధృవీకరణ',
    aadhaarSubtitle: 'తప్పనిసరి గుర్తింపు ధృవీకరణ.',
    enterAadhaar: '12 అంకెల ఆధార్ సంఖ్య',
    getOtp: 'OTP పొందండి',
    resendOtp: 'మళ్ళీ పంపండి',
    verifyOtp: 'ధృవీకరించండి',
    enterOtpCode: '6 అంకెల OTP నమోదు చేయండి',
    aadhaarVerifiedOk: 'ఆధార్ ధృవీకరించబడింది | UIDAI OK',
    loading: 'లోడ్ అవుతోంది...',
    save: 'సేవ్ చేయి',
    cancel: 'రద్దు చేయి',
    confirm: 'నిర్ధారించు',
    verified: 'ధృవీకరించబడింది',
  },
};

export function getCurrentLanguage(): SupportedLanguage {
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem('scrapmax_language') || localStorage.getItem('aicle_language');
      if (stored && stored in TRANSLATIONS) {
        return stored as SupportedLanguage;
      }
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
    localStorage.setItem('scrapmax_language_set', 'true');
    localStorage.setItem('aicle_language', lang);

    // Update document HTML lang attribute
    const iso = ISO_LANG_MAP[lang] || 'en';
    document.documentElement.lang = iso;

    try {
      const settings = localStorage.getItem('scrapmax_settings') || localStorage.getItem('aicle_settings');
      const parsed = settings ? JSON.parse(settings) : {};
      parsed.language = lang;
      localStorage.setItem('scrapmax_settings', JSON.stringify(parsed));
      localStorage.setItem('aicle_settings', JSON.stringify(parsed));
    } catch {
      // ignore
    }

    // Broadcast change across tabs and components
    window.dispatchEvent(new CustomEvent('scrapmax_language_change', { detail: lang }));
    window.dispatchEvent(new CustomEvent('aicle_language_change', { detail: lang }));
  }
}

export function openLanguageModal() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('scrapmax_open_language_modal'));
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

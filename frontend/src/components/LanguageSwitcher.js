import { useState, useEffect, createContext, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Globe } from 'lucide-react';

const LANG_KEY = 'crosscrafted_language';

const LANGUAGES = [
  { id: 'en', label: 'English', flag: '🇬🇧', nativeLabel: 'English' },
  { id: 'hi', label: 'Hindi', flag: '🇮🇳', nativeLabel: 'हिन्दी' },
  { id: 'te', label: 'Telugu', flag: '🇮🇳', nativeLabel: 'తెలుగు' },
  { id: 'ta', label: 'Tamil', flag: '🇮🇳', nativeLabel: 'தமிழ்' },
];

const TRANSLATIONS = {
  // Navigation
  Feed: { hi: 'फीड', te: 'ఫీడ్', ta: 'ஊட்டம்' },
  Explore: { hi: 'एक्सप्लोर', te: 'ఎక్స్‌ప్లోర్', ta: 'ஆராயுங்கள்' },
  Churches: { hi: 'चर्च', te: 'చర్చిలు', ta: 'தேவாலயங்கள்' },
  Events: { hi: 'कार्यक्रम', te: 'కార్యక్రమాలు', ta: 'நிகழ்வுகள்' },
  Shop: { hi: 'दुकान', te: 'షాప్', ta: 'கடை' },
  Profile: { hi: 'प्रोफ़ाइल', te: 'ప్రొఫైల్', ta: 'சுயவிவரம்' },
  Messages: { hi: 'संदेश', te: 'సందేశాలు', ta: 'செய்திகள்' },
  Notifications: { hi: 'सूचनाएँ', te: 'నోటిఫికేషన్లు', ta: 'அறிவிப்புகள்' },
  'Bible Trivia': { hi: 'बाइबल ट्रिविया', te: 'బైబిల్ ట్రివియా', ta: 'பைபிள் வினோதம்' },
  Apologetics: { hi: 'अपोलोजेटिक्स', te: 'అపోలోజెటిక్స్', ta: 'அப்போலோஜெடிக்ஸ்' },
  'List Your Church': { hi: 'अपना चर्च लिस्ट करें', te: 'మీ చర్చిని జాబితా చేయండి', ta: 'உங்கள் தேவாலயத்தை பட்டியலிடுங்கள்' },
  'List Your Business': { hi: 'अपना व्यवसाय लिस्ट करें', te: 'మీ వ్యాపారాన్ని జాబితా చేయండి', ta: 'உங்கள் வணிகத்தை பட்டியலிடுங்கள்' },
  Marketplace: { hi: 'मार्केटप्लेस', te: 'మార్కెట్‌ప్లేస్', ta: 'சந்தை' },
  Discover: { hi: 'खोजें', te: 'కనుగొనండి', ta: 'கண்டுபிடியுங்கள்' },
  Matches: { hi: 'मैच', te: 'మ్యాచ్‌లు', ta: 'பொருத்தங்கள்' },
  Community: { hi: 'समुदाय', te: 'సంఘం', ta: 'சமூகம்' },
  'Prayer Wall': { hi: 'प्रार्थना दीवार', te: 'ప్రార్థన గోడ', ta: 'ஜெப சுவர்' },

  // Common Actions
  Search: { hi: 'खोजें', te: 'శోధించు', ta: 'தேடு' },
  Save: { hi: 'सेव करें', te: 'సేవ్ చేయండి', ta: 'சேமி' },
  Cancel: { hi: 'रद्द करें', te: 'రద్దు చేయండి', ta: 'ரத்து' },
  Submit: { hi: 'जमा करें', te: 'సమర్పించు', ta: 'சமர்ப்பிக்கவும்' },
  Loading: { hi: 'लोड हो रहा है', te: 'లోడ్ అవుతోంది', ta: 'ஏற்றுகிறது' },
  Delete: { hi: 'हटाएँ', te: 'తొలగించు', ta: 'நீக்கு' },
  Edit: { hi: 'संपादित करें', te: 'సవరించు', ta: 'திருத்து' },
  Share: { hi: 'शेयर करें', te: 'షేర్ చేయండి', ta: 'பகிர்' },
  Close: { hi: 'बंद करें', te: 'మూసివేయండి', ta: 'மூடு' },
  Back: { hi: 'वापस', te: 'వెనుకకు', ta: 'பின்செல்' },
  Next: { hi: 'अगला', te: 'తదుపరి', ta: 'அடுத்து' },
  Create: { hi: 'बनाएँ', te: 'సృష్టించు', ta: 'உருவாக்கு' },
  Update: { hi: 'अपडेट करें', te: 'అప్‌డేట్ చేయండి', ta: 'புதுப்பி' },

  // Auth
  Welcome: { hi: 'स्वागत है', te: 'స్వాగతం', ta: 'வரவேற்கிறோம்' },
  Login: { hi: 'लॉगिन', te: 'లాగిన్', ta: 'உள்நுழை' },
  Register: { hi: 'रजिस्टर', te: 'నమోదు', ta: 'பதிவு' },
  'Forgot Password': { hi: 'पासवर्ड भूल गए', te: 'పాస్‌వర్డ్ మర్చిపోయాను', ta: 'கடவுச்சொல் மறந்தேன்' },
  Logout: { hi: 'लॉग आउट', te: 'లాగ్ అవుట్', ta: 'வெளிநுழை' },

  // Status
  'No results': { hi: 'कोई परिणाम नहीं', te: 'ఫలితాలు లేవు', ta: 'முடிவுகள் இல்லை' },
  'Something went wrong': { hi: 'कुछ गलत हो गया', te: 'ఏదో తప్పు జరిగింది', ta: 'ஏதோ தவறு நடந்தது' },
  Success: { hi: 'सफल', te: 'విజయం', ta: 'வெற்றி' },
  Error: { hi: 'त्रुटि', te: 'లోపం', ta: 'பிழை' },

  // Content
  'Ask a Question': { hi: 'एक सवाल पूछें', te: 'ప్రశ్న అడగండి', ta: 'கேள்ளி கேளுங்கள்' },
  'Add Church': { hi: 'चर्च जोड़ें', te: 'చర్చిని జోడించు', ta: 'தேவாலயத்தை சேர்' },
  'List Business': { hi: 'व्यवसाय लिस्ट करें', te: 'వ్యాపారాన్ని జాబితా చేయండి', ta: 'வணிகத்தை பட்டியலிடு' },
  'Sell Something': { hi: 'कुछ बेचें', te: 'ఏదైనా అమ్మండి', ta: 'ஏதாவது விற்கவும்' },
  'Contact Seller': { hi: 'विक्रेता से संपर्क करें', te: 'అమ్మకతారిని సంప్రదించండి', ta: 'விற்பவரை தொடர்பு கொள்ளு' },
  'Play Again': { hi: 'फिर से खेलें', te: 'మళ్ళీ ఆడండి', ta: 'மீண்டும் விளையாடு' },
  'Start Challenge': { hi: 'चुनौती शुरू करें', te: 'సవాలు ప్రారంభించండి', ta: 'சவாலை தொடங்கு' },
  'Leaderboard': { hi: 'लीडरबोर्ड', te: 'లీడర్‌బోర్డ్', ta: 'முன்னணி பட்டியல்' },
  'Stats': { hi: 'आँकड़े', te: 'గణాంకాలు', ta: 'புள்ளிவிவரம்' },

  // Labels
  Name: { hi: 'नाम', te: 'పేరు', ta: 'பெயர்' },
  Email: { hi: 'ईमेल', te: 'ఇమెయిల్', ta: 'மின்னஞ்சல்' },
  Phone: { hi: 'फ़ोन', te: 'ఫోన్', ta: 'தொலைபேசி' },
  City: { hi: 'शहर', te: 'నగరం', ta: 'நகரம்' },
  State: { hi: 'राज्य', te: 'రాష్ట్రం', ta: 'மாநிலம்' },
  Description: { hi: 'विवरण', te: 'వివరణ', ta: 'விளக்கம்' },
  Category: { hi: 'श्रेणी', te: 'వర్గం', ta: 'வகை' },
  Price: { hi: 'कीमत', te: 'ధర', ta: 'விலை' },
  Image: { hi: 'छवि', te: 'చిత్రం', ta: 'படம்' },

  // Misc
  Admin: { hi: 'एडमिन', te: 'అడ్మిన్', ta: 'நிர்வாகி' },
  Settings: { hi: 'सेटिंग्स', te: 'సెట్టింగ్లు', ta: 'அமைப்புகள்' },
  Language: { hi: 'भाषा', te: 'భాష', ta: 'மொழி' },
};

// Context
const LanguageContext = createContext(null);

export const LanguageProvider = ({ children }) => {
  const [language, setLanguageState] = useState(() => {
    try {
      return localStorage.getItem(LANG_KEY) || 'en';
    } catch { return 'en'; }
  });

  const setLanguage = (langId) => {
    setLanguageState(langId);
    try { localStorage.setItem(LANG_KEY, langId); } catch {}
  };

  const t = (key) => {
    if (language === 'en') return key;
    return TRANSLATIONS[key]?.[language] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    // Fallback if provider not available
    return {
      language: 'en',
      setLanguage: () => {},
      t: (key) => key,
    };
  }
  return ctx;
};

// Language Switcher Component
const LanguageSwitcher = () => {
  const { language, setLanguage } = useLanguage();
  const [open, setOpen] = useState(false);
  const current = LANGUAGES.find(l => l.id === language) || LANGUAGES[0];

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-white/[0.06] border border-white/[0.06] hover:bg-white/[0.1] transition-all"
      >
        <Globe size={14} className="text-[#94A3B8]" />
        <span className="text-[#94A3B8]">{current.nativeLabel}</span>
        <ChevronDown size={12} className={`text-[#64748B] transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="absolute right-0 top-full mt-2 z-50 bg-[#1E293B] border border-white/[0.08] rounded-xl shadow-[0_8px_32px_rgba(0,0,0,0.5)] overflow-hidden min-w-[160px]"
            >
              {LANGUAGES.map(lang => (
                <button
                  key={lang.id}
                  onClick={() => { setLanguage(lang.id); setOpen(false); }}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                    language === lang.id
                      ? 'bg-[#A855F7]/15 text-white'
                      : 'text-[#94A3B8] hover:bg-white/[0.04] hover:text-white'
                  }`}
                >
                  <span className="text-base">{lang.flag}</span>
                  <span className="font-medium">{lang.nativeLabel}</span>
                  {language === lang.id && (
                    <span className="ml-auto w-1.5 h-1.5 rounded-full bg-[#A855F7]" />
                  )}
                </button>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default LanguageSwitcher;

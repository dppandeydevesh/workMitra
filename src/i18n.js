import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

const resources = {
  en: {
    translation: {
      "Dashboard": "Dashboard",
      "Post Gig": "Post Gig",
      "Manage Gigs": "Manage Gigs",
      "Applicants": "Applicants",
      "Analytics": "Analytics",
      "Chat": "Chat",
      "Marketplace": "Marketplace",
      "Profile": "Profile",
      "Admin Console": "Admin Console",
      "College Portal": "College Portal",
      "Career Tracks": "Career Tracks",
      "Logout": "Logout"
    }
  },
  hi: {
    translation: {
      "Dashboard": "डैशबोर्ड",
      "Post Gig": "गिग पोस्ट करें",
      "Manage Gigs": "गिग्स प्रबंधित करें",
      "Applicants": "आवेदक",
      "Analytics": "एनालिटिक्स",
      "Chat": "चैट",
      "Marketplace": "मार्केटप्लेस",
      "Profile": "प्रोफ़ाइल",
      "Admin Console": "एडमिन कंसोल",
      "College Portal": "कॉलेज पोर्टल",
      "Career Tracks": "करियर ट्रैक्स",
      "Logout": "लॉग आउट"
    }
  }
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;

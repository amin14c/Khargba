import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  en: {
    translation: {
      "app_name": "Kharbga / Zamma Online",
      "login": "Login",
      "register": "Register",
      "email": "Email",
      "password": "Password",
      "phone": "Phone Number",
      "sign_in_email": "Sign in with Email",
      "sign_in_phone": "Sign in with Phone",
      "logout": "Logout",
      "waiting_for_opponent": "Waiting for opponent...",
      "your_turn": "Your turn",
      "opponent_turn": "Opponent's turn",
      "you_win": "You win!",
      "you_lose": "You lose!",
      "draw": "Draw!",
      "play_again": "Play Again",
      "create_game": "Create New Game",
      "join_game": "Join Game",
      "available_games": "Available Games",
      "no_games": "No games available. Create one!",
      "language": "Language",
      "rocks": "Rocks (الصخور)",
      "date_pits": "Date Pits (نواة التمر)",
      "send_code": "Send Code",
      "verify_code": "Verify Code",
      "verification_code": "Verification Code",
      "error_invalid_move": "Invalid move"
    }
  },
  fr: {
    translation: {
      "app_name": "Kharbga / Zamma en ligne",
      "login": "Se connecter",
      "register": "S'inscrire",
      "email": "Email",
      "password": "Mot de passe",
      "phone": "Numéro de téléphone",
      "sign_in_email": "Se connecter avec Email",
      "sign_in_phone": "Se connecter avec Téléphone",
      "logout": "Déconnexion",
      "waiting_for_opponent": "En attente d'un adversaire...",
      "your_turn": "A votre tour",
      "opponent_turn": "Au tour de l'adversaire",
      "you_win": "Vous avez gagné!",
      "you_lose": "Vous avez perdu!",
      "draw": "Égalité!",
      "play_again": "Rejouer",
      "create_game": "Créer une partie",
      "join_game": "Rejoindre la partie",
      "available_games": "Parties disponibles",
      "no_games": "Aucune partie disponible.",
      "language": "Langue",
      "rocks": "Roches (الصخور)",
      "date_pits": "Noyaux de dattes (نواة التمر)",
      "send_code": "Envoyer le code",
      "verify_code": "Vérifier le code",
      "verification_code": "Code de vérification",
      "error_invalid_move": "Mouvement invalide"
    }
  },
  ar: {
    translation: {
      "app_name": "خربقة / زامة أونلاين",
      "login": "تسجيل الدخول",
      "register": "إنشاء حساب",
      "email": "البريد الإلكتروني",
      "password": "كلمة المرور",
      "phone": "رقم الهاتف",
      "sign_in_email": "الدخول بالبريد",
      "sign_in_phone": "الدخول بالهاتف",
      "logout": "تسجيل الخروج",
      "waiting_for_opponent": "في انتظار الخصم...",
      "your_turn": "دورك",
      "opponent_turn": "دور الخصم",
      "you_win": "لقد فزت!",
      "you_lose": "لقد خسرت!",
      "draw": "تعادل!",
      "play_again": "العب مجدداً",
      "create_game": "إنشاء لعبة جديدة",
      "join_game": "انضمام للعبة",
      "available_games": "الألعاب المتاحة",
      "no_games": "لا يوجد ألعاب. أنشئ واحدة!",
      "language": "اللغة",
      "rocks": "الصخور (Rocks)",
      "date_pits": "نواة التمر (Date Pits)",
      "send_code": "إرسال الرمز",
      "verify_code": "تحقق من الرمز",
      "verification_code": "رمز التحقق",
      "error_invalid_move": "حركة غير صالحة"
    }
  },
  tzm: {
    translation: {
      "app_name": "Kharbga / Zamma unlayn",
      "login": "Adekhl",
      "register": "Sekkem",
      "email": "Imayl",
      "password": "Awal n uzezri",
      "phone": "Uṭṭun n tiliɣri",
      "sign_in_email": "Kcem s vimayl",
      "sign_in_phone": "Kcem s tiliɣri",
      "logout": "Ffeɣ",
      "waiting_for_opponent": "Rajut anmahal...",
      "your_turn": "Tawala nnk",
      "opponent_turn": "Tawala n unmahal",
      "you_win": "Ternit!",
      "you_lose": "Texsert!",
      "draw": "Temsasamt!",
      "play_again": "Urar daɣen",
      "create_game": "Sker urar amaynu",
      "join_game": "Kcem urar",
      "available_games": "Uraren yellan",
      "no_games": "Ur llin uraren. Sker yiwen!",
      "language": "Tutlayt",
      "rocks": "Iẓṛan",
      "date_pits": "Iɣsan n tiyni",
      "send_code": "Azen tangalt",
      "verify_code": "Senqed tangalt",
      "verification_code": "Tangalt n usenqed",
      "error_invalid_move": "Amussu ur iṣeḥḥan"
    }
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: "ar",
    fallbackLng: "en",
    interpolation: {
      escapeValue: false 
    }
  });

export default i18n;

export const initialCaseData = {
  firNo: "",
  station: "",
  district: "",
  state: "",
  dateOfIncident: "",
  timeOfIncident: "",
  dateOfRegistration: "",
  ioName: "",
  ioBadge: "",
  shoName: "",
  legalAdvisorName: "",

  // Accused Details
  accused: {
    name: "",
    age: "",
    phone: "",
    address: "",
    status: "Pending",
    arrestDate: "",
    arrestTime: ""
  },

  // Victim Details
  victim: {
    name: "",
    age: "",
    phone: "",
    address: "",
    injuryStatus: ""
  },

  // Seized Items List
  seizedItems: [],

  // Witnesses and Statements
  witnesses: [],

  // Incident Narrative (For AI Legal Analysis)
  narrative: ""
};

// UI Translations
export const translations = {
  en: {
    title: "CrimeGPT",
    subtitle: "AI-Powered Documentation & Legal Intelligence",
    langToggle: "English",
    roleLabel: "Active Officer Role:",
    dashboard: "Dashboard",
    unifiedPool: "Unified Case Pool",
    aiIntelligence: "AI Legal Analysis",
    timeline: "Case Diary",
    docs: "Statutory Documents",
    systemStatus: "System Status: Online",
    
    // Overview Metrics
    caseId: "Case Reference",
    policeStation: "Police Station",
    firDate: "Registration Date",
    statusLabel: "Accused Status",
    secRecommended: "Sections Flagged",

    // Unified Pool Form Labels
    basicInfo: "Case metadata & Registration Details",
    accusedDetails: "Accused Details",
    victimDetails: "Victim Details",
    seizedItems: "Seized Articles / Zabti Register",
    witnessStatements: "Witness Info & Statements",
    narrativeLabel: "Incident Narrative (Narrative parsed by RAG AI)",
    
    labelFir: "FIR / Crime Number",
    labelStation: "Police Station Name",
    labelAccusedName: "Accused Full Name / Alias",
    labelAge: "Age",
    labelPhone: "Phone",
    labelAddress: "Residential Address",
    labelStatus: "Custodial Status",
    labelArrestDate: "Date of Arrest",
    labelArrestTime: "Time of Arrest",
    labelVictimName: "Victim Full Name",
    labelVictimInjury: "Injury / Health Status",
    labelNarrativePlaceholder: "Type or paste the case details, FIR text, or investigating narrative here for AI processing...",

    // Button Labels
    btnSave: "Sync & Update Pool",
    btnAnalyze: "Run RAG AI Legal Analysis",
    btnAddItem: "Add Seized Article",
    btnAddWitness: "Add Witness Statement",
    btnGenerate: "Generate & Preview",
    btnPrint: "Print Document",
    btnDownload: "Download Copy",
    btnCustomLog: "Add Custom Entry",

    // Seized Item Fields
    itemName: "Item Name",
    itemDesc: "Description / Marks",
    itemQty: "Quantity",
    itemVal: "Estimated Value",
    
    // Witness Fields
    witnessName: "Witness Name",
    witnessRel: "Occupation / Relation",
    witnessStmt: "Recorded Statement (under Sec 180 BNSS)",

    // Legal Intelligence Section
    aiHeader: "AI-Powered RAG Analysis Engine",
    aiDisclaimer: "This module uses a localized Retrieval-Augmented Generation (RAG) model trained on BNS, BNSS, and BSA databases.",
    bnsSections: "Bharatiya Nyaya Sanhita (BNS, 2023) Provisions",
    ipcSections: "Corresponding Old IPC (1860) Sections",
    bnssSections: "Bharatiya Nagarik Suraksha Sanhita (BNSS, 2023) Provisions",
    crpcSections: "Corresponding Old CrPC (1973) Sections",
    bsaSections: "Bharatiya Sakshya Adhiniyam (BSA, 2023) Provisions",
    evidenceSections: "Corresponding Old Evidence Act (1872) Sections",
    landmarkJudgments: "Relevant Landmark Judgments & Precedents",
    
    // Documents
    doc1Name: "Supplementary Chargesheet (Purvani Chargesheet)",
    doc2Name: "Seizure Receipt (Zabti Patrak)",
    doc3Name: "Remand Request Letter (M.C. Application)",
    doc4Name: "Accused Search Panchanama",
    
    // Status logs
    timelineTitle: "Automated Case Diary (Sec 172 CrPC / Sec 192 BNSS)",
    timelineSubtitle: "Chronological sequence of investigative actions",
    addLogPlaceholder: "Enter custom police action details...",
    
    // Auth translations
    loginTitle: "Police Portal Sign In",
    badgeId: "Badge ID / Officer Email",
    password: "Password",
    role: "Designation / Role",
    loginBtn: "Sign In",
    registerBtn: "Register Officer",
    createAccount: "Create a new officer profile",
    alreadyHaveAccount: "Already registered? Login here",
    quickDemo: "Quick Access Demo Logins",
    badgePlaceholder: "Enter Badge ID (e.g. IO-9982)",
    fullName: "Full Name",
    registerBtnShort: "Register",
    logout: "Logout",
    credentialAlert: "Invalid credentials! Use demo login for quick testing."
  },
  hi: {
    title: "क्राइमजीपीटी",
    subtitle: "एआई-संचालित दस्तावेज़ीकरण और कानूनी खुफिया",
    langToggle: "हिन्दी",
    roleLabel: "सक्रिय अधिकारी भूमिका:",
    dashboard: "डैशबोर्ड",
    unifiedPool: "एकीकृत मामला पूल",
    aiIntelligence: "एआई कानूनी विश्लेषण",
    timeline: "केस डायरी",
    docs: "वैधानिक दस्तावेज़",
    systemStatus: "सिस्टम स्थिति: ऑनलाइन",

    caseId: "केस संदर्भ",
    policeStation: "पुलिस स्टेशन",
    firDate: "पंजीकरण तिथि",
    statusLabel: "आरोपी की स्थिति",
    secRecommended: "चिह्नित धाराएं",

    basicInfo: "केस मेटाडेटा और पंजीकरण विवरण",
    accusedDetails: "आरोपी का विवरण",
    victimDetails: "पीड़ित का विवरण",
    seizedItems: "जब्त सामान / जब्ती रजिस्टर",
    witnessStatements: "गवाह की जानकारी और बयान",
    narrativeLabel: "घटना विवरण (आरएजी एआई द्वारा विश्लेषित)",
    
    labelFir: "एफआईआर / अपराध संख्या",
    labelStation: "थाने का नाम",
    labelAccusedName: "आरोपी का पूरा नाम / उर्फ",
    labelAge: "आयु",
    labelPhone: "फ़ोन",
    labelAddress: "आवासीय पता",
    labelStatus: "हिरासत की स्थिति",
    labelArrestDate: "गिरफ्तारी की तारीख",
    labelArrestTime: "गिरफ्तारी का समय",
    labelVictimName: "पीड़ित का पूरा नाम",
    labelVictimInjury: "चोट / स्वास्थ्य की स्थिति",
    labelNarrativePlaceholder: "एआई प्रोसेसिंग के लिए यहां केस विवरण, एफआईआर टेक्स्ट या जांच विवरण दर्ज करें या पेस्ट करें...",

    btnSave: "पूल सिंक और अपडेट करें",
    btnAnalyze: "आरएजी एआई कानूनी विश्लेषण चलाएं",
    btnAddItem: "जब्त वस्तु जोड़ें",
    btnAddWitness: "गवाह का बयान जोड़ें",
    btnGenerate: "दस्तावेज़ बनाएं",
    btnPrint: "दस्तावेज़ प्रिंट करें",
    btnDownload: "कॉपी डाउनलोड करें",
    btnCustomLog: "प्रविष्टि जोड़ें",

    itemName: "वस्तु का नाम",
    itemDesc: "विवरण / पहचान चिह्न",
    itemQty: "मात्रा",
    itemVal: "अनुमानित मूल्य",
    
    witnessName: "गवाह का नाम",
    witnessRel: "पेशा / संबंध",
    witnessStmt: "दर्ज बयान (धारा 180 बीएनएसएस के तहत)",

    aiHeader: "एआई-संचालित आरएजी विश्लेषण इंजन",
    aiDisclaimer: "यह मॉड्यूल बीएनएस, बीएनएसएस और बीएसए डेटाबेस पर प्रशिक्षित स्थानीयकृत रिट्रीवल-ऑगमेंटेड जनरेशन (आरएजी) मॉडल का उपयोग करता है।",
    bnsSections: "भारतीय न्याय संहिता (BNS, 2023) प्रावधान",
    ipcSections: "संबंधित पुरानी आईपीसी (1860) धाराएं",
    bnssSections: "भारतीय नागरिक सुरक्षा संहिता (BNSS, 2023) प्रावधान",
    crpcSections: "संबंधित पुरानी सीआरपीसी (1973) धाराएं",
    bsaSections: "भारतीय साक्ष्य अधिनियम (BSA, 2023) प्रावधान",
    evidenceSections: "संबंधित पुराना साक्ष्य अधिनियम (1872) धाराएं",
    landmarkJudgments: "प्रासंगिक ऐतिहासिक निर्णय और मिसालें",

    doc1Name: "पूरक आरोप पत्र (पूर्वणी चार्जशीट)",
    doc2Name: "जब्ती रसीद (जब्ती पत्रक)",
    doc3Name: "रिमांड अनुरोध पत्र (एम.सी. आवेदन)",
    doc4Name: "आरोपी पंचनामा",

    timelineTitle: "स्वचालित केस डायरी (धारा 172 सीआरपीसी / धारा 192 बीएनएसएस)",
    timelineSubtitle: "जांच संबंधी कार्रवाइयों का कालानुक्रमिक क्रम",
    addLogPlaceholder: "कस्टम पुलिस कार्रवाई विवरण दर्ज करें...",
    
    // Auth translations
    loginTitle: "पुलिस पोर्टल साइन इन",
    badgeId: "बैज आईडी / अधिकारी ईमेल",
    password: "पासवर्ड",
    role: "पद / भूमिका",
    loginBtn: "लॉग इन करें",
    registerBtn: "अधिकारी पंजीकरण",
    createAccount: "एक नया अधिकारी प्रोफ़ाइल बनाएं",
    alreadyHaveAccount: "पहले से पंजीकृत हैं? यहाँ लॉगिन करें",
    quickDemo: "त्वरित पहुंच डेमो लॉगिन",
    badgePlaceholder: "बैज आईडी दर्ज करें (जैसे IO-9982)",
    fullName: "पूरा नाम",
    registerBtnShort: "पंजीकृत करें",
    logout: "लॉग आउट",
    credentialAlert: "अमान्य क्रेडेंशियल! त्वरित परीक्षण के लिए डेमो लॉगिन का उपयोग करें।"
  },
  gu: {
    title: "ક્રાઇમજીપીટી",
    subtitle: "એઆઈ-આધારિત દસ્તાવેજીકરણ અને કાનૂની બુદ્ધિ",
    langToggle: "ગુજરાતી",
    roleLabel: "સક્રિય અધિકારી ભૂમિકા:",
    dashboard: "ડેશબોર્ડ",
    unifiedPool: "એકીકૃત કેસ પૂલ",
    aiIntelligence: "એઆઈ કાનૂની વિશ્લેષણ",
    timeline: "કેસ ડાયરી",
    docs: "વૈધાનિક દસ્તાવેજો",
    systemStatus: "સિસ્ટમ સ્થિતિ: ઓનલાઈન",

    caseId: "કેસ સંદર્ભ",
    policeStation: "પોલીસ સ્ટેશન",
    firDate: "નોંધણી તારીખ",
    statusLabel: "આરોપીની સ્થિતિ",
    secRecommended: "ચિહ્નિત કલમો",

    basicInfo: "કેસ મેટાડેટા અને નોંધણી વિગતો",
    accusedDetails: "આરોપીની વિગતો",
    victimDetails: "ભોગ બનનારની વિગતો",
    seizedItems: "જપ્ત કરેલી વસ્તુઓ / જપ્તી પત્રક",
    witnessStatements: "સાક્ષીની માહિતી અને નિવેદનો",
    narrativeLabel: "ઘટના વર્ણન (આરએજી એઆઈ દ્વારા વિશ્લેષિત)",
    
    labelFir: "એફઆઈઆર / ગુના નંબર",
    labelStation: "પોલીસ સ્ટેશનનું નામ",
    labelAccusedName: "આરોપીનું પૂરું નામ / ઉર્ફે",
    labelAge: "ઉંમર",
    labelPhone: "ફોન",
    labelAddress: "રહેઠાણનું સરનામું",
    labelStatus: "કસ્ટડી સ્થિતિ",
    labelArrestDate: "ધરપકડની તારીખ",
    labelArrestTime: "ધરપકડનો સમય",
    labelVictimName: "ભોગ બનનારનું પૂરું નામ",
    labelVictimInjury: "ઈજા / સ્વાસ્થ્ય સ્થિતિ",
    labelNarrativePlaceholder: "એઆઈ પ્રોસેસિંગ માટે કેસ વિગત, એફઆઈઆર લખાણ અથવા તપાસ વિગતો અહીં લખો અથવા પેસ્ટ કરો...",

    btnSave: "પૂલ સિંક અને અપડેટ કરો",
    btnAnalyze: "આરએજી એઆઈ કાનૂની વિશ્લેષણ ચલાવો",
    btnAddItem: "જપ્ત કરેલી વસ્તુ ઉમેરો",
    btnAddWitness: "સાક્ષીનું નિવેદન ઉમેરો",
    btnGenerate: "દસ્તાવેજ બનાવો",
    btnPrint: "દસ્તાવેજ પ્રિન્ટ કરો",
    btnDownload: "નકલ ડાઉનલોડ કરો",
    btnCustomLog: "નોંધ ઉમેરો",

    itemName: "વસ્તુનું નામ",
    itemDesc: "વર્ણન / ઓળખ ચિહ્ન",
    itemQty: "જથ્થો",
    itemVal: "અંદાજિત કિંમત",
    
    witnessName: "સાક્ષીનું નામ",
    witnessRel: "વ્યવસાય / સંબંધ",
    witnessStmt: "નોંધાયેલ નિવેદન (કલમ ૧૮૦ બીએનએસએસ હેઠળ)",

    aiHeader: "એઆઈ-સંચાલિત આરએજી વિશ્લેષણ એન્જિન",
    aiDisclaimer: "આ મોડ્યુલ BNS, BNSS અને BSA ડેટાબેઝ પર તાલીમ પામેલા સ્થાનિક રીટ્રીવલ-ઓગમેન્ટેડ જનરેશન (RAG) મોડલનો ઉપયોગ કરે છે.",
    bnsSections: "ભારતીય ન્યાય સંહિતા (BNS, 2023) જોગવાઈઓ",
    ipcSections: "તેને સુસંગત જૂની આઈપીસી (1860) કલમો",
    bnssSections: "ભારતીય નાગરિક સુરક્ષા સંહિતા (BNSS, 2023) જોગવાઈઓ",
    crpcSections: "તેને સુસંગત જૂની સીઆરપીસી (1973) કલમો",
    bsaSections: "ભારતીય સાક્ષ્ય અધિનિયમ (BSA, 2023) જોગવાઈઓ",
    evidenceSections: "તેને સુસંગત જૂનો પુરાવા ધારો (1872) કલમો",
    landmarkJudgments: "પ્રાસંગિક ઐતિહાસિક ચુકાદાઓ અને પૂર્વ ચુકાદાઓ",

    doc1Name: "પૂરક આરોપનામું (પૂર્વાણી ચાર્જશીટ)",
    doc2Name: "જપ્તી પાવતી (જપ્તી પત્રક)",
    doc3Name: "રિમાન્ડ વિનંતી પત્ર (એમ.સી. અરજી)",
    doc4Name: "આરોપીનું પંચનામું",

    timelineTitle: "સ્વચાલિત કેસ ડાયરી (સીઆરપીસી કલમ ૧૭૨ / બીએનએસએસ કલમ ૧૯૨)",
    timelineSubtitle: "તપાસ પ્રક્રિયાના ક્રમબદ્ધ પગલાં",
    addLogPlaceholder: "કસ્ટમ પોલીસ કાર્યવાહી વિગત લખો...",
    
    // Auth translations
    loginTitle: "પોલીસ પોર્ટલ સાઇન ઇન",
    badgeId: "બેજ આઈડી / અધિકારી ઇમેલ",
    password: "પાસવર્ડ",
    role: "હોદ્દો / ભૂમિકા",
    loginBtn: "લોગ ઇન કરો",
    registerBtn: "અધિકારી નોંધણી",
    createAccount: "નવું અધિકારી પ્રોફાઇલ બનાવો",
    alreadyHaveAccount: "પહેલાથી નોંધાયેલ છો? અહીં લોગીન કરો",
    quickDemo: "ઝડપી ડેમો લોગીન",
    badgePlaceholder: "બેજ આઈડી દાખલ કરો (દા.ત. બેજ નંબર)",
    fullName: "પૂરું નામ",
    registerBtnShort: "નોંધણી કરો",
    logout: "લોગ આઉટ",
    credentialAlert: "અમાન્ય ઓળખપત્ર! ઝડપી પરીક્ષણ માટે ડેમો લોગિનનો ઉપયોગ કરો."
  }
};

// Simulated RAG AI Legal Provision & Precedent Mapper
// Maps incident narrative keywords to statutory provisions and case law in English, Hindi, and Gujarati.

const analysisDatabase = {
  theft: {
    category: "Theft, Housebreaking & Stolen Property",
    bns: [
      { section: "Sec 303 BNS, 2023", desc: { en: "Punishment for simple theft (imprisonment up to 3 years or fine).", hi: "साधारण चोरी के लिए सजा (3 साल तक की जेल या जुर्माना)।", gu: "સાદી ચોરી માટેની સજા (૩ વર્ષ સુધીની કેદ અથવા દંડ)." } },
      { section: "Sec 305 BNS, 2023", desc: { en: "Theft in dwelling house, means of transportation, or place of worship.", hi: "निवास गृह, परिवहन के साधन, या पूजा स्थल में चोरी।", gu: "રહેણાંક મકાન, વાહન વ્યવહારના સાધન અથવા પૂજાના સ્થળે ચોરી." } },
      { section: "Sec 331 BNS, 2023", desc: { en: "Lurking house-trespass or house-breaking by night in order to commit offense.", hi: "अपराध करने के लिए रात में छिपकर गृह-अतिचार या गृह-भेदन।", gu: "ગુનો કરવાના ઇરાદે રાત્રિ દરમિયાન છૂપી રીતે ઘર-પ્રવેશ અથવા ઘરફોડ." } }
    ],
    ipc: [
      { section: "Sec 379 IPC, 1860", desc: { en: "Old provision for punishment of theft.", hi: "चोरी की सजा के लिए पुराना प्रावधान।", gu: "ચોરીની સજા માટેની જૂની જોગવાઈ." } },
      { section: "Sec 380 IPC, 1860", desc: { en: "Old provision for theft in dwelling house.", hi: "निवास गृह में चोरी के लिए पुराना प्रावधान।", gu: "રહેણાંક મકાનમાં ચોરી માટેની જૂની જોગવાઈ." } },
      { section: "Sec 457 IPC, 1860", desc: { en: "Old provision for lurking house-trespass or house-breaking by night.", hi: "रात में छिपकर गृह-अतिचार या गृह-भेदन के लिए पुराना प्रावधान।", gu: "રાત્રિ દરમિયાન છૂપી રીતે ઘર-પ્રવેશ અથવા ઘરફોડ માટેની જૂની જોગવાઈ." } }
    ],
    bnss: [
      { section: "Sec 105 BNSS, 2023", desc: { en: "Mandatory videography of search and seizure operations at the crime scene.", hi: "अपराध स्थल पर तलाशी और जब्ती कार्यों की अनिवार्य वीडियोग्राफी।", gu: "ગુનાના સ્થળે તપાસ અને જપ્તી પ્રક્રિયાની ફરજિયાત વિડીયોગ્રાફી." } },
      { section: "Sec 185 BNSS, 2023", desc: { en: "Search by police officer during investigation.", hi: "जांच के दौरान पुलिस अधिकारी द्वारा तलाशी।", gu: "તપાસ દરમિયાન પોલીસ અધિકારી દ્વારા જપ્તી તપાસ." } }
    ],
    crpc: [
      { section: "Sec 100 CrPC, 1973", desc: { en: "Old provision governing search of closed places and witness presence.", hi: "बंद स्थानों की तलाशी और गवाहों की उपस्थिति से संबंधित पुराना प्रावधान।", gu: "બંધ જગ્યાની તપાસ અને સાક્ષીઓની હાજરી અંગેની જૂની જોગવાઈ." } },
      { section: "Sec 165 CrPC, 1973", desc: { en: "Old provision for search by police officer.", hi: "पुलिस अधिकारी द्वारा तलाशी का पुराना प्रावधान।", gu: "પોલીસ અધિકારી દ્વારા તપાસ કરવાની જૂની જોગવાઈ." } }
    ],
    bsa: [
      { section: "Sec 114 Illus (a) BSA, 2023", desc: { en: "Presumption that person in possession of stolen goods soon after theft is either the thief or receiver.", hi: "यह अनुमान कि चोरी के तुरंत बाद चोरी के सामान पर कब्जा रखने वाला व्यक्ति या तो चोर है या प्राप्तकर्ता है।", gu: "ચોરીના તુરંત બાદ જપ્ત માલ સાથે પકડાયેલ વ્યક્તિ ચોર અથવા માલ રાખનાર હોવાની કાનૂની ધારણા." } }
    ],
    evidence: [
      { section: "Sec 114 Illus (a) IEA, 1872", desc: { en: "Old presumption of possession of stolen goods.", hi: "चोरी के सामान के कब्जे का पुराना अनुमान।", gu: "ચોરીના માલના કબજા અંગેની જૂની ધારણા." } }
    ],
    judgments: [
      { citation: "State of Maharashtra v. Vishwanath (1979) 4 SCC 23", summary: { en: "Held that temporary removal of property can constitute theft if intent to dispossess is proven.", hi: "यह निर्धारित किया गया कि यदि बेदखल करने का इरादा साबित हो जाता है तो संपत्ति को अस्थायी रूप से हटाना भी चोरी माना जा सकता है।", gu: "ચુકાદો આપ્યો કે માલિકની મંજૂરી વિના અસ્થાયી રૂપે મિલકત ખસેડવી એ પણ ચોરીનો ગુનો બને છે." } },
      { citation: "K. N. Mehra v. State of Rajasthan, AIR 1957 SC 369", summary: { en: "Clarified that 'moving' of property out of owner's possession with dishonest intention is the essence of theft.", hi: "स्पष्ट किया कि बेईमानी के इरादे से मालिक के कब्जे से संपत्ति को 'हटाना' ही चोरी का मूल तत्व है।", gu: "સ્પષ્ટ કર્યું કે અપ્રમાણિક ઈરાદાથી માલિકના કબજામાંથી મિલકત ખસેડવી એ જ ચોરીનો મુખ્ય પાયો છે." } }
    ]
  },
  murder: {
    category: "Homicide & Crimes Against Life",
    bns: [
      { section: "Sec 101 BNS, 2023", desc: { en: "Definition of Murder.", hi: "हत्या की परिभाषा।", gu: "ખૂનની વ્યાખ્યા." } },
      { section: "Sec 103 BNS, 2023", desc: { en: "Punishment for Murder (death penalty or life imprisonment).", hi: "हत्या के लिए सजा (मृत्युदंड या आजीवन कारावास)।", gu: "ખૂન માટેની સજા (મોતની સજા અથવા આજીવન કેદ)." } }
    ],
    ipc: [
      { section: "Sec 300 IPC, 1860", desc: { en: "Old definition of Murder.", hi: "हत्या की पुरानी परिभाषा।", gu: "ખૂનની જૂની વ્યાખ્યા." } },
      { section: "Sec 302 IPC, 1860", desc: { en: "Old provision for punishment of murder.", hi: "हत्या की सजा का पुराना प्रावधान।", gu: "ખૂનની સજા અંગેની જૂની જોગવાઈ." } }
    ],
    bnss: [
      { section: "Sec 194 BNSS, 2023", desc: { en: "Inquiry and report on unnatural or suspicious deaths by police.", hi: "पुलिस द्वारा अप्राकृतिक या संदिग्ध मौतों पर जांच और रिपोर्ट।", gu: "અકુદરતી અથવા શંકાસ્પદ મોત અંગે પોલીસ તપાસ અને અહેવાલ." } }
    ],
    crpc: [
      { section: "Sec 174 CrPC, 1973", desc: { en: "Old provision for police inquiry and inquest into suspicious death.", hi: "संदिग्ध मृत्यु में पुलिस जांच और इनक्वेस्ट का पुराना प्रावधान।", gu: "શંકાસ્પદ મરણના કિસ્સામાં ઇન્ક્વેસ્ટ પંચનામાની જૂની જોગવાઈ." } }
    ],
    bsa: [
      { section: "Sec 26 BSA, 2023", desc: { en: "Dying declaration admissibility rules as relevant evidence.", hi: "प्रासंगिक साक्ष्य के रूप में मृत्युकालिक कथन (डाइंग डिक्लेरेशन) की स्वीकार्यता के नियम।", gu: "મરણોન્મુખ નિવેદનની ગ્રાહ્યતા અંગેના નિયમો." } }
    ],
    evidence: [
      { section: "Sec 32(1) IEA, 1872", desc: { en: "Old provision for dying declaration relevance.", hi: "मृत्युकालिक कथन की प्रासंगिकता का पुराना प्रावधान।", gu: "મરણોન્મુખ નિવેદનની પ્રાસંગિકતા અંગેની જૂની જોગવાઈ." } }
    ],
    judgments: [
      { citation: "K. M. Nanavati v. State of Maharashtra, AIR 1962 SC 605", summary: { en: "Laid down the law on grave and sudden provocation and its limits to alter charge from murder to culpable homicide.", hi: "गंभीर और अचानक उत्तेजना और हत्या के आरोप को घटाकर गैर-इरादतन हत्या में बदलने की उसकी सीमाओं पर कानून निर्धारित किया।", gu: "ગંભીર અને અચાનક ઉશ્કેરણીના કિસ્સામાં ખૂન અને સાપરાધ મનુષ્યવધ વચ્ચેના તફાવતના સિદ્ધાંતો સ્થાપિત કર્યા." } },
      { citation: "State of U.P. v. Deoman Upadhyaya, AIR 1960 SC 1125", summary: { en: "Constitutional validity of discovery statements made while in custody of a police officer.", hi: "पुलिस अधिकारी की हिरासत में दिए गए खोज बयानों की संवैधानिक वैधता।", gu: "પોલીસ કસ્ટડી દરમિયાન આરોપીના નિવેદનના આધારે થયેલ મુદ્દામાલની શોધની બંધારણીય ગ્રાહ્યતા." } }
    ]
  },
  assault: {
    category: "Physical Assault & Bodily Hurt",
    bns: [
      { section: "Sec 115 BNS, 2023", desc: { en: "Voluntarily causing hurt (imprisonment up to 1 year or fine up to ₹ 10,000).", hi: "स्वेच्छा से चोट पहुंचाना (1 साल तक की जेल या ₹ 10,000 तक का जुर्माना)।", gu: "સ્વેચ્છાપૂર્વક વ્યથા (ઇજા) પહોંચાડવી (૧ વર્ષ સુધીની કેદ અથવા ₹ ૧૦,૦૦૦ સુધીનો દંડ)." } },
      { section: "Sec 117 BNS, 2023", desc: { en: "Voluntarily causing grievous hurt (causing permanent disfiguration, bone fractures, etc.).", hi: "स्वेच्छा से गंभीर चोट पहुंचाना (स्थायी विकृति, हड्डी का टूटना आदि)।", gu: "સ્વેચ્છાપૂર્વક મહાવ્યથા પહોંચાડવી (કાયમી ખોડખાંપણ, હાડકું તૂટવું વગેરે)." } }
    ],
    ipc: [
      { section: "Sec 323 IPC, 1860", desc: { en: "Old provision for voluntarily causing hurt.", hi: "स्वेच्छा से चोट पहुंचाने का पुराना प्रावधान।", gu: "સ્વેચ્છાપૂર્વક વ્યથા કરવા માટેની જૂની જોगવાઈ." } },
      { section: "Sec 325 IPC, 1860", desc: { en: "Old provision for voluntarily causing grievous hurt.", hi: "स्वेच्छा से गंभीर चोट पहुंचाने का पुराना प्रावधान।", gu: "સ્વેચ્છાપૂર્વક મહાવ્યથા કરવા માટેની જૂની જોગવાઈ." } }
    ],
    bnss: [
      { section: "Sec 53 BNSS, 2023", desc: { en: "Mandatory medical examination of the arrested person immediately.", hi: "गिरफ्तार व्यक्ति की तुरंत अनिवार्य चिकित्सा जांच।", gu: "ધરપકડ કરાયેલ વ્યક્તિની તબીબી તપાસ કરાવવાની ફરજિયાત જોગવાઈ." } }
    ],
    crpc: [
      { section: "Sec 53 CrPC, 1973", desc: { en: "Old provision for examination of accused by medical practitioner.", hi: "चिकित्सक द्वारा आरोपी की जांच का पुराना प्रावधान।", gu: "તબીબી અધિકારી દ્વારા આરોપીની તપાસની જૂની જોગવાઈ." } }
    ],
    bsa: [
      { section: "Sec 45 BSA, 2023", desc: { en: "Admissibility of opinion of experts (medical examiners/doctors).", hi: "विशेषज्ञों (चिकित्सा परीक्षकों/डॉक्टरों) की राय की स्वीकार्यता।", gu: "નિષ્ણાતો (મેડિકલ ઓફિસર/ડોક્ટરો) ના અભિપ્રાયોની ગ્રાહ્યતા." } }
    ],
    evidence: [
      { section: "Sec 45 IEA, 1872", desc: { en: "Old expert opinion relevancy clause.", hi: "पुराना विशेषज्ञ राय प्रासंगिकता खंड।", gu: "નિષ્ણાતોના અભિપ્રાય અંગેની જૂની જોગવાઈ." } }
    ],
    judgments: [
      { citation: "State of Karnataka v. Shivalingaiah (1988) SCC (Cri) 279", summary: { en: "Differentiated clearly between voluntarily causing hurt and attempt to commit murder based on the weapon and site of injury.", hi: "हथियार और चोट के स्थान के आधार पर स्वेच्छा से चोट पहुंचाने और हत्या के प्रयास के बीच स्पष्ट अंतर किया।", gu: "હથિયાર અને શરીરના કયા ભાગ પર ઇજા થઇ છે તેના આધારે વ્યથા અને ખૂનના પ્રયાસ વચ્ચેનો ભેદ સ્પષ્ટ કર્યો." } }
    ]
  },
  fraud: {
    category: "Cheating, Fraud & Forgery",
    bns: [
      { section: "Sec 318 BNS, 2023", desc: { en: "Cheating and dishonestly inducing delivery of property (imprisonment up to 7 years).", hi: "धोखाधड़ी और बेईमानी से संपत्ति सौंपने के लिए प्रेरित करना (7 साल तक की जेल)।", gu: "છેતરપિંડી અને અપ્રમાણિકપણે મિલકત સોંપવા માટે લલચાવવું (૭ વર્ષ સુધીની કેદ)." } },
      { section: "Sec 336 BNS, 2023", desc: { en: "Forgery of documents or electronic records.", hi: "दस्तावेजों या इलेक्ट्रॉनिक रिकॉर्ड की जालसाजी।", gu: "દસ્તાવેજો અથવા ઇલેક્ટ્રોનિક રેકોર્ડની બનાવટ (ફોર્જરી)." } }
    ],
    ipc: [
      { section: "Sec 420 IPC, 1860", desc: { en: "Old provision for cheating and dishonestly inducing delivery of property.", hi: "धोखाधड़ी और संपत्ति की डिलीवरी के लिए प्रेरित करने का पुराना प्रावधान।", gu: "છેતરપિંડી અને મિલકત સોંપવાની જૂની પ્રખ્યાત કલમ." } },
      { section: "Sec 468 IPC, 1860", desc: { en: "Old provision for forgery for the purpose of cheating.", hi: "धोखाधड़ी के उद्देश्य से जालसाजी का पुराना प्रावधान।", gu: "છેતરપિંડી કરવાના ઇરાદે દસ્તાવેજ બનાવટની જૂની જોગવાઈ." } }
    ],
    bnss: [
      { section: "Sec 107 BNSS, 2023", desc: { en: "Power of police officer to seize documents and assets representing proceeds of crime.", hi: "अपराध की कमाई का प्रतिनिधित्व करने वाले दस्तावेजों और संपत्तियों को जब्त करने की पुलिस की शक्ति।", gu: "ગુનાહિત પ્રવૃત્તિથી મેળવેલી અસ્કયામતો અને દસ્તાવેજો જપ્ત કરવાની પોલીસની સત્તા." } }
    ],
    crpc: [
      { section: "Sec 102 CrPC, 1973", desc: { en: "Old provision empowering police officer to seize certain properties.", hi: "पुलिस अधिकारी को कुछ संपत्तियां जब्त करने का अधिकार देने वाला पुराना प्रावधान।", gu: "અમુક મિલકત જપ્ત કરવાની પોલીસ અધિકારીની સત્તા અંગેની જૂની જોગવાઈ." } }
    ],
    bsa: [
      { section: "Sec 63 BSA, 2023", desc: { en: "Rules on secondary evidence, including printouts, digital scans, and storage devices.", hi: "द्वितीयक साक्ष्य (सेकेंडरी एविडेंस) पर नियम, जिसमें प्रिंटआउट, डिजिटल स्कैन और स्टोरेज डिवाइस शामिल हैं।", gu: "ગૌણ પુરાવા (સેકન્ડરી એવિડન્સ) ના નિયમો, જેમાં ડિજિટલ પ્રિન્ટઆઉટ અને સ્કેન સામેલ છે." } }
    ],
    evidence: [
      { section: "Sec 63 / 65 IEA, 1872", desc: { en: "Old secondary evidence clauses.", hi: "पुराने द्वितीयक साक्ष्य खंड।", gu: "જૂના ગૌણ પુરાવા અંગેની જોગવાઈઓ." } }
    ],
    judgments: [
      { citation: "State of Haryana v. Bhajan Lal, 1992 Supp (1) SCC 335", summary: { en: "Laid guidelines for when allegations in FIR fail to disclose a cognizable offense, relevant for fraud quashing.", hi: "दिशा-निर्देश दिए कि जब एफआईआर में आरोप संज्ञेय अपराध का खुलासा नहीं करते हैं, जो धोखाधड़ी के मामलों को रद्द करने के लिए प्रासंगिक है।", gu: "એફઆઈઆરમાં છેતરપિંડી કે ગુનાના તત્વો ન દેખાતા હોય ત્યારે કલમ ૪૮૨ હેઠળ રદ કરવા માટેની માર્ગદર્શિકા." } }
    ]
  },
  general: {
    category: "General Offenses & Inquiry",
    bns: [
      { section: "Sec 303(1) BNS, 2023", desc: { en: "General punishment for theft where no specific aggravation is defined.", hi: "चोरी के लिए सामान्य सजा जहां कोई विशिष्ट अतिशयता परिभाषित नहीं है।", gu: "જ્યાં કોઈ ચોક્કસ તીવ્રતા ન હોય ત્યાં ચોરી માટે સામાન્ય સજા." } }
    ],
    ipc: [
      { section: "Sec 379 IPC, 1860", desc: { en: "Old general theft penalty.", hi: "पुरानी सामान्य चोरी की सजा।", gu: "જૂની સામાન્ય ચોરીની સજા." } }
    ],
    bnss: [
      { section: "Sec 173 BNSS, 2023", desc: { en: "Information in cognizable cases, registration of FIR (with electronic medium options).", hi: "संज्ञेय मामलों में सूचना, एफआईआर पंजीकरण (इलेक्ट्रॉनिक माध्यम विकल्पों के साथ)।", gu: "કોગ્નિઝેબલ ગુનાઓમાં માહિતી અને એફઆઈઆરની ઓનલાઈન/ઇલેક્ટ્રોનિક નોંધણી." } }
    ],
    crpc: [
      { section: "Sec 154 CrPC, 1973", desc: { en: "Old provision for information in cognizable cases and recording of FIR.", hi: "संज्ञेय मामलों में सूचना और एफआईआर दर्ज करने का पुराना प्रावधान।", gu: "પ્રાથમિક માહિતી અહેવાલ (એફઆઈઆર) દાખલ કરવા અંગેની જૂની જોગવાઈ." } }
    ],
    bsa: [
      { section: "Sec 103 BSA, 2023", desc: { en: "Burden of proof lies on the person who wants the court to believe in a specific fact.", hi: "सबूत का बोझ उस व्यक्ति पर होता है जो चाहता है कि अदालत किसी विशिष्ट तथ्य पर विश्वास करे।", gu: "સાબિતીનો બોજો તે વ્યક્તિ પર રહેશે જે અદાલત સમક્ષ કોઈ હકીકત સાબિત કરવા ઈચ્છે છે." } }
    ],
    evidence: [
      { section: "Sec 101 IEA, 1872", desc: { en: "Old burden of proof clause.", hi: "पुराना सबूत का बोझ खंड।", gu: "સાબિતીના બોજા અંગેની જૂની કલમ." } }
    ],
    judgments: [
      { citation: "Lalita Kumari v. Govt of U.P. (2014) 2 SCC 1", summary: { en: "Mandatory registration of FIR under Section 154 of CrPC (now Sec 173 BNSS) if the information discloses commission of a cognizable offense.", hi: "यदि सूचना से संज्ञेय अपराध का पता चलता है तो सीआरपीसी की धारा 154 (अब धारा 173 बीएनएसएस) के तहत एफआईआर का अनिवार्य पंजीकरण।", gu: "જો કોગ્નિઝેબલ ગુનો બનતો હોય તો ફરજિયાતપણે એફઆઈઆર દાખલ કરવા અંગેનો ઐતિહાસિક ચુકાદો." } }
    ]
  }
};

/**
 * Parses the incident narrative and returns the recommended legal sections & case laws.
 * Checks for keywords and scores categories.
 * @param {string} text Narrative text
 * @returns {object} Matches from the database
 */
export function analyzeNarrative(text) {
  if (!text) return analysisDatabase.general;
  
  const cleanText = text.toLowerCase();
  
  // Scoring categories
  let scores = {
    theft: 0,
    murder: 0,
    assault: 0,
    fraud: 0
  };
  
  // Keywords
  const keywords = {
    theft: ["theft", "steal", "stolen", "burglary", "housebreak", "broke open", "safe", "trespass", "ચોરી", "લૂંટ", "ઘરફોડ", "चोरी", "लूट", "घरफोड़"],
    murder: ["murder", "kill", "death", "stabbed", "deceased", "homicide", "strangled", "खून", "हत्या", "मौत", "મૃત્યુ", "ખૂન", "હત્યા"],
    assault: ["assault", "hurt", "beaten", "injury", "physically", "punched", "grievous", "मारपीट", "चोट", "इंजरी", "હુમલો", "ઇજા", "મારપીટ"],
    fraud: ["fraud", "cheat", "forgery", "forged", "deceive", "scam", "document", "জালસાજી", "છેતરપિંડી", "દસ્તાવેજ", "धोखाधड़ी", "जालसाजी", "दस्तावेज"]
  };
  
  // Count matches
  Object.keys(keywords).forEach(cat => {
    keywords[cat].forEach(word => {
      if (cleanText.includes(word)) {
        scores[cat] += 1;
      }
    });
  });
  
  // Find category with highest score
  let maxCat = "general";
  let maxScore = 0;
  
  Object.keys(scores).forEach(cat => {
    if (scores[cat] > maxScore) {
      maxScore = scores[cat];
      maxCat = cat;
    }
  });
  
  // Default to general if score is 0
  if (maxScore === 0) {
    maxCat = "general";
  }
  
  return analysisDatabase[maxCat];
}

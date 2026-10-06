export interface Wilaya {
  code: string;
  name: string;
  nameAr: string;
  homeDeliveryFee: number;
  deskDeliveryFee: number;
  communes: string[];
}

export const ALGERIA_WILAYAS: Wilaya[] = [
  { code: "01", name: "Adrar", nameAr: "أدرار", homeDeliveryFee: 900, deskDeliveryFee: 600, communes: ["Adrar", "Tamest", "Reggane", "Timimoun", "Aoulef"] },
  { code: "02", name: "Chlef", nameAr: "الشلف", homeDeliveryFee: 650, deskDeliveryFee: 450, communes: ["Chlef", "Ténès", "El Karimia", "Oued Fodda", "Boukadir"] },
  { code: "03", name: "Laghouat", nameAr: "الأغواط", homeDeliveryFee: 750, deskDeliveryFee: 500, communes: ["Laghouat", "Aflou", "Ksar El Hirane", "Ain Madhi"] },
  { code: "04", name: "Oum El Bouaghi", nameAr: "أم البواقي", homeDeliveryFee: 650, deskDeliveryFee: 450, communes: ["Oum El Bouaghi", "Ain Beida", "Ain M'lila", "Meskiana"] },
  { code: "05", name: "Batna", nameAr: "باتنة", homeDeliveryFee: 650, deskDeliveryFee: 450, communes: ["Batna", "Barika", "Ain Touta", "Arris", "Merouana"] },
  { code: "06", name: "Béjaïa", nameAr: "بجاية", homeDeliveryFee: 650, deskDeliveryFee: 450, communes: ["Béjaïa", "Akbou", "Amizour", "Kherrata", "Seddouk"] },
  { code: "07", name: "Biskra", nameAr: "بسكرة", homeDeliveryFee: 750, deskDeliveryFee: 500, communes: ["Biskra", "Tolga", "Sidi Okba", "Ouled Djellal"] },
  { code: "08", name: "Béchar", nameAr: "بشار", homeDeliveryFee: 850, deskDeliveryFee: 550, communes: ["Béchar", "Abadla", "Kenadsa", "Beni Ounif"] },
  { code: "09", name: "Blida", nameAr: "البليدة", homeDeliveryFee: 500, deskDeliveryFee: 350, communes: ["Blida", "Boufarik", "Mouzaia", "Ouled Yaich", "El Affroun"] },
  { code: "10", name: "Bouira", nameAr: "البويرة", homeDeliveryFee: 600, deskDeliveryFee: 400, communes: ["Bouira", "Lakhdaria", "Sour El Ghozlane", "Ain Bessam"] },
  { code: "11", name: "Tamanrasset", nameAr: "تمنراست", homeDeliveryFee: 1200, deskDeliveryFee: 800, communes: ["Tamanrasset", "In Salah", "Abalessa", "Tazrouk"] },
  { code: "12", name: "Tébessa", nameAr: "تبسة", homeDeliveryFee: 700, deskDeliveryFee: 450, communes: ["Tébessa", "Cheria", "Bir El Ater", "El Aouinet"] },
  { code: "13", name: "Tlemcen", nameAr: "تلمسان", homeDeliveryFee: 650, deskDeliveryFee: 450, communes: ["Tlemcen", "Mansourah", "Maghnia", "Remchi", "Ghazaouet"] },
  { code: "14", name: "Tiaret", nameAr: "تيارت", homeDeliveryFee: 700, deskDeliveryFee: 450, communes: ["Tiaret", "Sougueur", "Frenda", "Ksar Chellala"] },
  { code: "15", name: "Tizi Ouzou", nameAr: "تيزي وزو", homeDeliveryFee: 600, deskDeliveryFee: 400, communes: ["Tizi Ouzou", "Azazga", "Draa Ben Khedda", "Boghni", "Larbaa Nath Irathen"] },
  { code: "16", name: "Alger", nameAr: "الجزائر", homeDeliveryFee: 450, deskDeliveryFee: 300, communes: ["Bab El Oued", "Sidi M'Hamed", "El Harrach", "Kouba", "Bir Mourad Rais", "Cheraga", "Dar El Beida", "Zeralda"] },
  { code: "17", name: "Djelfa", nameAr: "الجلفة", homeDeliveryFee: 750, deskDeliveryFee: 500, communes: ["Djelfa", "Ain Oussara", "Messaad", "Hassi Bahbah"] },
  { code: "18", name: "Jijel", nameAr: "جيجل", homeDeliveryFee: 650, deskDeliveryFee: 450, communes: ["Jijel", "Taher", "El Milia", "Chekfa"] },
  { code: "19", name: "Sétif", nameAr: "سطيف", homeDeliveryFee: 650, deskDeliveryFee: 400, communes: ["Sétif", "El Eulma", "Ain Oulmene", "Ain Arnat", "Bougaa"] },
  { code: "20", name: "Saïda", nameAr: "سعيدة", homeDeliveryFee: 700, deskDeliveryFee: 450, communes: ["Saïda", "Ain El Hadjar", "Youb", "Sidi Boubekeur"] },
  { code: "21", name: "Skikda", nameAr: "سكيكدة", homeDeliveryFee: 650, deskDeliveryFee: 450, communes: ["Skikda", "Azzaba", "El Harrouch", "Collo"] },
  { code: "22", name: "Sidi Bel Abbès", nameAr: "سيدي بلعباس", homeDeliveryFee: 650, deskDeliveryFee: 450, communes: ["Sidi Bel Abbès", "Telagh", "Ben Badis", "Sfisef"] },
  { code: "23", name: "Annaba", nameAr: "عنابة", homeDeliveryFee: 650, deskDeliveryFee: 450, communes: ["Annaba", "El Bouni", "El Hadjar", "Berrahal"] },
  { code: "24", name: "Guelma", nameAr: "قالمة", homeDeliveryFee: 700, deskDeliveryFee: 450, communes: ["Guelma", "Oued Zenati", "Bouchegouf", "Heliopolis"] },
  { code: "25", name: "Constantine", nameAr: "قسنطينة", homeDeliveryFee: 600, deskDeliveryFee: 400, communes: ["Constantine", "El Khroub", "Hamma Bouziane", "Didouche Mourad", "Ali Mendjeli"] },
  { code: "26", name: "Médéa", nameAr: "المدية", homeDeliveryFee: 600, deskDeliveryFee: 400, communes: ["Médéa", "Berrouaghia", "Ksar El Boukhari", "Beni Slimane"] },
  { code: "27", name: "Mostaganem", nameAr: "مستغانم", homeDeliveryFee: 650, deskDeliveryFee: 450, communes: ["Mostaganem", "Ain Tedeles", "Sidi Ali", "Bouguirat"] },
  { code: "28", name: "M'Sila", nameAr: "المسيلة", homeDeliveryFee: 700, deskDeliveryFee: 450, communes: ["M'Sila", "Bou Saada", "Sidi Aissa", "Magaa"] },
  { code: "29", name: "Mascara", nameAr: "معسكر", homeDeliveryFee: 650, deskDeliveryFee: 450, communes: ["Mascara", "Sig", "Tighennif", "Mohammadia"] },
  { code: "30", name: "Ouargla", nameAr: "ورقلة", homeDeliveryFee: 850, deskDeliveryFee: 550, communes: ["Ouargla", "Hassi Messaoud", "Touggourt", "Rouissat"] },
  { code: "31", name: "Oran", nameAr: "وهران", homeDeliveryFee: 550, deskDeliveryFee: 350, communes: ["Oran", "Bir El Djir", "Es Senia", "Arzew", "Ain El Turk"] },
  { code: "32", name: "El Bayadh", nameAr: "البيض", homeDeliveryFee: 800, deskDeliveryFee: 550, communes: ["El Bayadh", "Rogassa", "Brezina", "El Abiodh Sidi Cheikh"] },
  { code: "33", name: "Illizi", nameAr: "إليزي", homeDeliveryFee: 1200, deskDeliveryFee: 850, communes: ["Illizi", "Djanet", "In Amenas"] },
  { code: "34", name: "Bordj Bou Arréridj", nameAr: "برج بوعريريج", homeDeliveryFee: 650, deskDeliveryFee: 400, communes: ["Bordj Bou Arréridj", "Ras El Oued", "Mansoura", "Medjana"] },
  { code: "35", name: "Boumerdès", nameAr: "بومرداس", homeDeliveryFee: 500, deskDeliveryFee: 350, communes: ["Boumerdès", "Khemis El Khechna", "Dellys", "Zemmouri", "Isser"] },
  { code: "36", name: "El Tarf", nameAr: "الطارف", homeDeliveryFee: 700, deskDeliveryFee: 450, communes: ["El Tarf", "Ben M'Hidi", "Drean", "El Kala"] },
  { code: "37", name: "Tindouf", nameAr: "تندوف", homeDeliveryFee: 1200, deskDeliveryFee: 850, communes: ["Tindouf", "Oum El Assel"] },
  { code: "38", name: "Tissemsilt", nameAr: "تيسمسيلت", homeDeliveryFee: 700, deskDeliveryFee: 450, communes: ["Tissemsilt", "Theniet El Had", "Lardjem", "Bordj Bou Naama"] },
  { code: "39", name: "El Oued", nameAr: "الوادي", homeDeliveryFee: 800, deskDeliveryFee: 550, communes: ["El Oued", "Djamaa", "Robbah", "Debila"] },
  { code: "40", name: "Khenchela", nameAr: "خنشلة", homeDeliveryFee: 700, deskDeliveryFee: 450, communes: ["Khenchela", "Chechar", "Kais", "Bouhmama"] },
  { code: "41", name: "Souk Ahras", nameAr: "سوق أهراس", homeDeliveryFee: 700, deskDeliveryFee: 450, communes: ["Souk Ahras", "Sedrata", "M'daourouch", "Taoura"] },
  { code: "42", name: "Tipaza", nameAr: "تيبازة", homeDeliveryFee: 500, deskDeliveryFee: 350, communes: ["Tipaza", "Kolea", "Cherchell", "Bou Ismail", "Hadjout"] },
  { code: "43", name: "Mila", nameAr: "ميلة", homeDeliveryFee: 650, deskDeliveryFee: 400, communes: ["Mila", "Chelghoum Laid", "Tadjenanet", "Ferdjioua"] },
  { code: "44", name: "Aïn Defla", nameAr: "عين الدفلى", homeDeliveryFee: 600, deskDeliveryFee: 400, communes: ["Aïn Defla", "Khemis Miliana", "El Attaf", "Djelida"] },
  { code: "45", name: "Naâma", nameAr: "النعامة", homeDeliveryFee: 800, deskDeliveryFee: 550, communes: ["Naâma", "Mecheria", "Ain Sefra"] },
  { code: "46", name: "Aïn Témouchent", nameAr: "عين تموشنت", homeDeliveryFee: 650, deskDeliveryFee: 450, communes: ["Aïn Témouchent", "Beni Saf", "Hammam Bou Hadjar", "El Malah"] },
  { code: "47", name: "Ghardaïa", nameAr: "غرداية", homeDeliveryFee: 800, deskDeliveryFee: 500, communes: ["Ghardaïa", "Metlili", "El Guerrara", "Berriane"] },
  { code: "48", name: "Relizane", nameAr: "غليزان", homeDeliveryFee: 650, deskDeliveryFee: 450, communes: ["Relizane", "Oued Rhiou", "Mazouna", "Yellel"] },
  { code: "49", name: "Timimoun", nameAr: "تيميمون", homeDeliveryFee: 950, deskDeliveryFee: 650, communes: ["Timimoun", "Aougrout", "Charouine"] },
  { code: "50", name: "Bordj Badji Mokhtar", nameAr: "برج باجي مختار", homeDeliveryFee: 1300, deskDeliveryFee: 900, communes: ["Bordj Badji Mokhtar", "Timiaouine"] },
  { code: "51", name: "Ouled Djellal", nameAr: "أولاد جلال", homeDeliveryFee: 750, deskDeliveryFee: 500, communes: ["Ouled Djellal", "Sidi Khaled"] },
  { code: "52", name: "Béni Abbès", nameAr: "بني عباس", homeDeliveryFee: 950, deskDeliveryFee: 650, communes: ["Béni Abbès", "Kerzaz", "Tabelbala"] },
  { code: "53", name: "In Salah", nameAr: "عين صالح", homeDeliveryFee: 1100, deskDeliveryFee: 750, communes: ["In Salah", "In Ghar"] },
  { code: "54", name: "In Guezzam", nameAr: "عين قزام", homeDeliveryFee: 1300, deskDeliveryFee: 900, communes: ["In Guezzam", "Tin Zaouatine"] },
  { code: "55", name: "Touggourt", nameAr: "تقرت", homeDeliveryFee: 800, deskDeliveryFee: 550, communes: ["Touggourt", "Temacine", "Megarine"] },
  { code: "56", name: "Djanet", nameAr: "جانت", homeDeliveryFee: 1200, deskDeliveryFee: 850, communes: ["Djanet", "Bordj El Haouas"] },
  { code: "57", name: "El M'Ghair", nameAr: "المغير", homeDeliveryFee: 800, deskDeliveryFee: 550, communes: ["El M'Ghair", "Djamaa"] },
  { code: "58", name: "El Meniaa", nameAr: "المنيعة", homeDeliveryFee: 850, deskDeliveryFee: 600, communes: ["El Meniaa", "Hassi Gara"] }
];

export function getWilayaByCode(code: string): Wilaya | undefined {
  return ALGERIA_WILAYAS.find((w) => w.code === code);
}

export interface PaintConversion {
  fsCode: string;
  colorName: string;
  ralCode?: string;
  rlmCode?: string;
  bsCode?: string;
  tamiya?: string[];
  humbrol?: string[];
  gunze?: string[];
  revell?: string[];
  akInteractive?: string[];
  vallejo?: string[];
  italeri?: string[];
  modelMaster?: string[];
  lifecolor?: string[];
  hataka?: string[];
  hobbyCores?: string[];
  mrColor?: string[];
  mrPaint?: string[];
  atom?: string[];
  alcladII?: string[];
  hexColor?: string;
}

export const FS_PAINT_CONVERSIONS: PaintConversion[] = [
  // Browns (30xxx)
  { fsCode: "30040", colorName: "Brown", tamiya: ["XF-10"], humbrol: ["8", "10", "33"], hexColor: "#4f2a25" },
  { fsCode: "30045", colorName: "Chocolate Brown", ralCode: "8017", tamiya: ["XF-10"], humbrol: ["98", "10", "107"], akInteractive: ["AK718"], mrPaint: ["MRP-004"], hexColor: "#5d483e" },
  { fsCode: "30049", colorName: "Wood Brown", humbrol: ["107", "33"], hexColor: "#4f2a25" },
  { fsCode: "30051", colorName: "Leather Brown", humbrol: ["98", "10"], hexColor: "#654321" },
  { fsCode: "30059", colorName: "Red Brown", humbrol: ["10", "61"], hexColor: "#5d483f" },
  { fsCode: "30061", colorName: "Brown", tamiya: ["XF-9"], hexColor: "#5d483e" },
  { fsCode: "30075", colorName: "Hull Red", tamiya: ["XF-9"], hexColor: "#8b4513" },
  { fsCode: "30099", colorName: "Earth Brown", humbrol: ["110", "113", "33"], modelMaster: ["1701"], hexColor: "#6b4423" },
  { fsCode: "30100", colorName: "Leather", humbrol: ["186", "156", "34"], italeri: ["4674AP"], gunze: ["H7"], hexColor: "#8b6914" },
  { fsCode: "30108", colorName: "Red Brown", tamiya: ["XF-64"], humbrol: ["186", "160", "10"], hexColor: "#8b4513" },
  { fsCode: "30109", colorName: "Marrone Mimetico 1", tamiya: ["XF-9"], humbrol: ["73"], gunze: ["H13", "H343"], revell: ["36137", "36183"], italeri: ["4640AP", "4675AP"], hexColor: "#6b4a23" },
  { fsCode: "30111", colorName: "Medium Brown", tamiya: ["XF-68", "X-9"], humbrol: ["70"], revell: ["36137"], italeri: ["4306AP"], hexColor: "#6b4423" },
  { fsCode: "30117", colorName: "Earth Red / Military Brown", tamiya: ["XF-64"], humbrol: ["186", "160"], gunze: ["H47"], revell: ["36185"], italeri: ["4707AP"], modelMaster: ["1701", "4707"], lifecolor: ["UA306"], hataka: ["HTK-A213"], hobbyCores: ["HCF-19"], mrPaint: ["MRP-092"], hexColor: "#7f5745" },
  { fsCode: "30118", colorName: "Field Drab / Dark Earth", tamiya: ["XF-52"], humbrol: ["29", "142"], gunze: ["H72"], revell: ["36187"], italeri: ["4303AP", "4641AP", "4708AP"], akInteractive: ["AK3081"], modelMaster: ["1702"], hataka: ["HTK-A209"], alcladII: ["ALCE305"], hexColor: "#8b7355" },
  { fsCode: "30140", colorName: "Brown Special / Light Earth", tamiya: ["XF-52"], humbrol: ["110", "62", "113", "29"], gunze: ["H72"], revell: ["36187"], italeri: ["4644AP", "4846AP"], akInteractive: ["AK3081"], hobbyCores: ["HCF-18"], hexColor: "#5a4a3a" },
  { fsCode: "30215", colorName: "Sand Yellow RLM 79", rlmCode: "79", humbrol: ["62", "110", "154"], revell: ["36185", "36382"], italeri: ["4789AP"], akInteractive: ["AK706"], hexColor: "#c4a060" },
  { fsCode: "30219", colorName: "Light Brown / Dark Tan", tamiya: ["XF-52"], humbrol: ["118", "119"], gunze: ["H310"], revell: ["36185"], italeri: ["4305AP", "4643AP", "4709AP"], modelMaster: ["1742"], hobbyCores: ["HCSG-11", "HCF-22"], mrPaint: ["MRP-090"], alcladII: ["ALCE302"], hexColor: "#9a8b70" },
  { fsCode: "30257", colorName: "Light Earth / Wood", ralCode: "8023", tamiya: ["XF-59"], humbrol: ["9", "63", "94"], gunze: ["H37", "H33"], revell: ["36185"], italeri: ["4673AP"], hexColor: "#daa520" },
  { fsCode: "30266", colorName: "Mid Stone", ralCode: "7028", tamiya: ["XF-60", "XF-55"], humbrol: ["93", "81", "26", "121"], gunze: ["H79", "H403"], revell: ["36116"], italeri: ["4304AP", "4646AP"], akInteractive: ["AK006", "AK7013", "AK714", "AK725"], hexColor: "#c4a060" },
  { fsCode: "30277", colorName: "Sand Brown / Light Olive / Armor Sand", ralCode: "8000", tamiya: ["XF-49", "X-41"], humbrol: ["168", "110", "187"], gunze: ["H336"], italeri: ["4711AP"], akInteractive: ["AK702"], hataka: ["HTK-A210"], hexColor: "#9a8a6a" },
  { fsCode: "30279", colorName: "Sand / Desert Sand", tamiya: ["XF-57"], humbrol: ["121", "118", "110", "250"], gunze: ["H346"], modelMaster: ["2053"], lifecolor: ["UA089"], hataka: ["HTK-_068"], hexColor: "#c4a060" },
  { fsCode: "30372", colorName: "Sand Grey / Buff", tamiya: ["XF-57"], humbrol: ["118", "34", "250", "148"], italeri: ["4812AP"], hataka: ["HTK-A323"], hobbyCores: ["HCF-14"], hexColor: "#deb887" },
  { fsCode: "30450", colorName: "Hemp / Buff", tamiya: ["XF-57"], humbrol: ["118", "34", "250", "148"], italeri: ["4812AP"], hexColor: "#deb887" },
  { fsCode: "30475", colorName: "Sand", tamiya: ["XF-60", "XF-78", "XF-10"], humbrol: ["121", "98"], gunze: ["H313"], italeri: ["4720AP"], hexColor: "#c2b280" },
  
  // Reds (31xxx)
  { fsCode: "31105", colorName: "Red", tamiya: ["X-7"], hexColor: "#ae2825" },
  { fsCode: "31136", colorName: "Insignia Red", tamiya: ["XF-7"], humbrol: ["60", "153"], gunze: ["H327"], revell: ["32"], italeri: ["4714AP"], akInteractive: ["AK740"], modelMaster: ["1705"], mrPaint: ["MRP-065"], alcladII: ["ALCE330"], hexColor: "#a32b25" },
  { fsCode: "31350", colorName: "Guards Red", tamiya: ["XF-7"], humbrol: ["60"], gunze: ["H13"], revell: ["36136"], italeri: ["4632AP"], hexColor: "#cc3333" },
  { fsCode: "31400", colorName: "Red Orange", tamiya: ["X-7"], humbrol: ["60", "187"], gunze: ["H414"], italeri: ["4606AP"], hexColor: "#b22222" },
  { fsCode: "31433", colorName: "Skin Tone Warm", tamiya: ["XF-15"], humbrol: ["61"], gunze: ["H44"], revell: ["36135"], italeri: ["4603AP"], hexColor: "#d4a080" },
  { fsCode: "31575", colorName: "Light Flesh", tamiya: ["XF-15"], humbrol: ["61"], gunze: ["H44"], revell: ["36135"], italeri: ["4390AP", "4601AP"], hobbyCores: ["HCF-17"], hexColor: "#deb887" },
  { fsCode: "31630", colorName: "Pink", tamiya: ["X-17"], humbrol: ["200"], hexColor: "#e7c1bb" },
  
  // Oranges (32xxx)
  { fsCode: "32160", colorName: "Orange", tamiya: ["X-6"], hexColor: "#ff6600" },
  { fsCode: "32197", colorName: "Flat Orange / International Orange", tamiya: ["X-6"], humbrol: ["18"], gunze: ["H14"], revell: ["36125"], italeri: ["4302AP"], hexColor: "#ff6600" },
  
  // Yellows (33xxx)
  { fsCode: "33070", colorName: "Olive", humbrol: ["150", "10", "154"], hexColor: "#6b6b4b" },
  { fsCode: "33245", colorName: "Ochre", humbrol: ["63"], hexColor: "#c39b00" },
  { fsCode: "33434", colorName: "Giallo Mimetico 3", humbrol: ["7", "154", "94", "34"], revell: ["36116"], italeri: ["4645AP"], hexColor: "#c4a060" },
  { fsCode: "33303", colorName: "Khaki", tamiya: ["XF-49"], humbrol: ["26", "84"], hobbyCores: ["HCF-10"], hexColor: "#c3b091" },
  { fsCode: "33440", colorName: "Panzer Dunkelgelb 1943 / Desert Yellow", tamiya: ["XF-49", "XF-4"], humbrol: ["81"], italeri: ["4796AP"], hobbyCores: ["HCF-16"], hexColor: "#b0a060" },
  { fsCode: "33446", colorName: "CARC Tan 686A / OIF Base", tamiya: ["XF-60"], humbrol: ["94"], vallejo: ["71.122"], akInteractive: ["AK122"], modelMaster: ["2136", "4812"], hataka: ["HTK-_238"], hexColor: "#b8a080" },
  { fsCode: "33448", colorName: "Light Stone", tamiya: ["XF-60"], humbrol: ["74", "34", "84"], hexColor: "#d4c490" },
  { fsCode: "33531", colorName: "Yellow / Sand", humbrol: ["121"], gunze: ["H313"], italeri: ["4677AP", "4720AP"], modelMaster: ["1706"], hobbyCores: ["HCF-24"], hexColor: "#c4a060" },
  { fsCode: "33538", colorName: "Insignia Yellow / Chrome Yellow", tamiya: ["XF-3", "X-24"], humbrol: ["154", "188", "24", "99"], gunze: ["H329", "H4"], revell: ["36115"], italeri: ["4642AP", "4721AP"], modelMaster: ["1708"], hobbyCores: ["HCB-03", "HCF-03"], hexColor: "#ffd34b" },
  { fsCode: "33613", colorName: "Radome Tan", humbrol: ["148"], gunze: ["H318"], modelMaster: ["1709"], hexColor: "#a08070" },
  { fsCode: "33655", colorName: "Blue Angels Yellow", tamiya: ["X-8", "XF-3"], humbrol: ["69"], hexColor: "#ffd247" },
  
  // Greens (34xxx)
  { fsCode: "34031", colorName: "US Helo Drab", akInteractive: ["AK11872"], hexColor: "#4a4444" },
  { fsCode: "34050", colorName: "Black Green / NATO Green", tamiya: ["XF-13"], humbrol: ["75", "91", "108"], hexColor: "#2f4f2f" },
  { fsCode: "34052", colorName: "Marine Corps Green / Schwarzgrün RLM 70", rlmCode: "70", tamiya: ["XF-13", "XF-11", "XF-27"], humbrol: ["91", "75", "108"], gunze: ["H65"], revell: ["40"], italeri: ["4780AP"], akInteractive: ["AK3023"], hexColor: "#3d5c3d" },
  { fsCode: "34079", colorName: "Dark Green / Forest Green", tamiya: ["XF-65", "XF-13", "XF-27", "XF-61"], humbrol: ["116"], gunze: ["H309"], revell: ["36167"], italeri: ["4726AP"], akInteractive: ["AK755"], modelMaster: ["1710", "4726"], lifecolor: ["UA001"], hataka: ["HTK-A016"], hobbyCores: ["HCF-13"], mrPaint: ["MRP-052", "MRP-091"], alcladII: ["ALCE308", "ALCE323"], hexColor: "#4a5a4a" },
  { fsCode: "34082", colorName: "Medium Green II", ralCode: "6003", tamiya: ["XF-11"], humbrol: ["102", "172", "154"], gunze: ["H303", "H80"], revell: ["36145"], italeri: ["4734AP"], akInteractive: ["AK031", "AK752"], hexColor: "#556b2f" },
  { fsCode: "34083", colorName: "Russian Armor Green", tamiya: ["XF-62", "XF-81"], humbrol: ["66"], gunze: ["H420"], revell: ["36166"], italeri: ["4807AP"], hexColor: "#4a5a4a" },
  { fsCode: "34084", colorName: "Olive Drab US Army", tamiya: ["XF-62"], humbrol: ["66"], gunze: ["H17", "H78"], revell: ["36166"], italeri: ["4728AP"], akInteractive: ["AK133", "AK4043"], hexColor: "#6b8e23" },
  { fsCode: "34086", colorName: "Dark Green / Green Drab", tamiya: ["XF-62", "XF-13"], humbrol: ["108"], gunze: ["H319"], hobbyCores: ["HCF-11"], hexColor: "#2f4f2f" },
  { fsCode: "34087", colorName: "Olive Drab II", tamiya: ["XF-62"], humbrol: ["155", "163", "108", "33"], gunze: ["H304"], italeri: ["4690AP"], modelMaster: ["1711", "4728"], lifecolor: ["UA523"], vallejo: ["71.043"], hataka: ["HTK-_065"], hobbyCores: ["HCSG-07", "HCF-09"], mrColor: ["C304"], mrPaint: ["MRP-050"], alcladII: ["ALCE321"], hexColor: "#6b8e23" },
  { fsCode: "34088", colorName: "Olive Drab / Khaki Drab / Dunkelbraun", ralCode: "7017", tamiya: ["XF-49", "XF-51", "XF-13", "XF-65"], humbrol: ["155", "159", "116"], gunze: ["H304", "H52", "H309"], revell: ["36146", "36166", "36187", "361"], italeri: ["4315AP", "4842AP"], akInteractive: ["AK793", "AK754", "AK736", "AK755"], hobbyCores: ["HCF-07"], hexColor: "#5a6a4a" },
  { fsCode: "34092", colorName: "Medium Green / Extra Dark Sea Green", tamiya: ["XF-26", "XF-61", "XF-27"], humbrol: ["149", "30", "195", "46"], gunze: ["H302"], revell: ["36167", "66"], italeri: ["4314AP", "4723AP", "4729AP"], akInteractive: ["AK4055", "AK3044"], modelMaster: ["1764"], mrColor: ["C302"], mrPaint: ["MRP-053", "MRP-094"], alcladII: ["ALCE322"], hexColor: "#4a6a4a" },
  { fsCode: "34094", colorName: "Bronze Green", humbrol: ["116", "95", "80"], hexColor: "#4a5d23" },
  { fsCode: "34096", colorName: "Dark Slate Grey / Protective Green", tamiya: ["XF-5", "XF-13", "XF-58", "XF-26"], humbrol: ["195", "163", "105", "150", "30"], gunze: ["H60", "H330", "H340"], revell: ["363"], italeri: ["4311AP"], akInteractive: ["AK746", "AK750"], hexColor: "#4a5d4a" },
  { fsCode: "34097", colorName: "Field Green", tamiya: ["XF-58"], humbrol: ["80", "116", "105"], gunze: ["H340"], hobbyCores: ["HCSG-09", "HCF-12"], hexColor: "#4a5d4a" },
  { fsCode: "34098", colorName: "Military Green / Bamboo", tamiya: ["XF-4"], humbrol: ["150", "155", "154", "159"], gunze: ["H423"], italeri: ["4852AP"], akInteractive: ["AK4013"], hexColor: "#6b6b4b" },
  { fsCode: "34102", colorName: "Medium Green / Forest Green", tamiya: ["XF-61", "XF-65"], humbrol: ["117"], gunze: ["H303"], modelMaster: ["1713"], hobbyCores: ["HCSG-10", "HCF-21"], mrColor: ["C303"], mrPaint: ["MRP-054"], alcladII: ["ALCE307"], hexColor: "#4a6a4a" },
  { fsCode: "34127", colorName: "Forest Green", humbrol: ["150"], hataka: ["HTK-A315"], hexColor: "#556b2f" },
  { fsCode: "34128", colorName: "Field Gray / Panzer Olivgrün", tamiya: ["XF-26"], humbrol: ["76", "151", "131"], italeri: ["4798AP"], hobbyCores: ["HCF-15"], hexColor: "#3a5a3a" },
  { fsCode: "34151", colorName: "Interior Green / Hempie", tamiya: ["XF-21"], humbrol: ["150"], gunze: ["H58"], italeri: ["4301AP", "4736AP"], modelMaster: ["1715", "4736"], lifecolor: ["UA004"], vallejo: ["71.137", "70.833"], hataka: ["HTK-_211"], mrPaint: ["MRP-051"], alcladII: ["ALCE309"], hexColor: "#5a6b5a" },
  { fsCode: "34201", colorName: "Woodland Desert Sage", akInteractive: ["AK11414"], hexColor: "#827660" },
  { fsCode: "34230", colorName: "Light Green", italeri: ["4309AP"], hexColor: "#6b8e23" },
  { fsCode: "34066", colorName: "Green", humbrol: ["80"], gunze: ["H340"], hobbyCores: ["HCF-33"], hexColor: "#228b22" },
  { fsCode: "34227", colorName: "Pale Green", tamiya: ["XF-26"], humbrol: ["120"], gunze: ["H312"], hobbyCores: ["HCF-25"], mrColor: ["C312"], hexColor: "#8fbc8f" },
  { fsCode: "34272", colorName: "Pale Green", ralCode: "6011", tamiya: ["XF-26"], humbrol: ["120"], gunze: ["H312"], italeri: ["4739AP"], akInteractive: ["AK715"], hexColor: "#6a7a5a" },
  { fsCode: "34108", colorName: "Forest Green", tamiya: ["XF-65"], humbrol: ["116"], hexColor: "#3a5a3a" },
  { fsCode: "34424", colorName: "Sage Green", tamiya: ["XF-21"], humbrol: ["150"], hexColor: "#5a6b5a" },
  
  // Blues (35xxx)
  { fsCode: "35042", colorName: "Non Specular Sea Blue", tamiya: ["XF-17"], humbrol: ["77"], gunze: ["H54"], revell: ["36179"], italeri: ["4604AP"], akInteractive: ["AK3101"], mrPaint: ["MRP-067"], alcladII: ["ALCE318"], hexColor: "#1f4f6f" },
  { fsCode: "35095", colorName: "Medium Blue", italeri: ["4307AP"], hexColor: "#4682b4" },
  { fsCode: "35164", colorName: "Non Specular Intermediate Blue", humbrol: ["144"], gunze: ["H42", "H56"], revell: ["36179"], italeri: ["4639AP"], akInteractive: ["AK2054"], modelMaster: ["1720"], mrColor: ["C72"], mrPaint: ["MRP-068"], alcladII: ["ALCE319"], hexColor: "#4f6f8f" },
  { fsCode: "35189", colorName: "Non Specular Blue Grey", humbrol: ["157"], italeri: ["4766AP"], mrPaint: ["MRP-097"], hexColor: "#5f7f9f" },
  { fsCode: "35231", colorName: "Azure Blue", italeri: ["4308AP"], hexColor: "#5f9ea0" },
  { fsCode: "35052", colorName: "Blue", tamiya: ["XF-8"], humbrol: ["15"], gunze: ["H45"], hobbyCores: ["HCB-08", "HCF-32"], hexColor: "#1f4f6f" },
  { fsCode: "35237", colorName: "Dark Ghost Grey / Medium Gray", tamiya: ["XF-53"], humbrol: ["128", "167"], gunze: ["H307", "H337", "H53"], italeri: ["4761AP"], akInteractive: ["AK2056"], hobbyCores: ["HCSG-16", "HCF-29"], hexColor: "#5a6a7a" },
  { fsCode: "35352", colorName: "Hellblau RLM 65 / APC Interior Light Green", rlmCode: "65", tamiya: ["XF-21", "XF-23"], humbrol: ["65", "90"], gunze: ["H67"], revell: ["36155", "59"], italeri: ["4778AP"], akInteractive: ["AK4012"], hobbyCores: ["HCSG-23"], alcladII: ["ALCE214"], hexColor: "#a0b0c0" },
  { fsCode: "35526", colorName: "Light Blue", hexColor: "#87ceeb" },
  { fsCode: "35190", colorName: "Non-Specular Blue Grey", humbrol: ["157"], hexColor: "#5f7f9f" },
  { fsCode: "35450", colorName: "Light Blue", humbrol: ["144"], hexColor: "#8fa0b0" },
  { fsCode: "35622", colorName: "Light Blue Grey", hexColor: "#8090a0" },
  
  // Greys (36xxx)
  { fsCode: "36081", colorName: "Schwarzgrau RAL 7021 / Grey", ralCode: "7021", tamiya: ["XF-24", "XF-63", "XF-69"], humbrol: ["123", "85"], gunze: ["H301", "H77", "H333", "H401"], revell: ["9", "78"], italeri: ["4795AP"], akInteractive: ["AK161", "AK704", "AK720", "AK3002", "AK3003", "AK3093"], mrColor: ["C301"], mrPaint: ["MRP-005", "MRP-093"], hexColor: "#4a4a4a" },
  { fsCode: "36099", colorName: "Graugrün RLM 74", rlmCode: "74", tamiya: ["XF-63"], humbrol: ["123"], gunze: ["H68", "H401"], revell: ["78"], italeri: ["4784AP"], akInteractive: ["AK163"], hobbyCores: ["HCSG-27"], hexColor: "#5f6f6f" },
  { fsCode: "36118", colorName: "Gunship Gray / Extra Dark Sea Grey", tamiya: ["XF-50", "XF-24"], humbrol: ["112"], gunze: ["H305"], revell: ["36177"], italeri: ["4312AP", "4752AP"], modelMaster: ["1734", "1735"], hobbyCores: ["HCSG-08", "HCF-20"], mrColor: ["C305"], mrPaint: ["MRP-058", "MRP-070"], alcladII: ["ALCE001", "ALCE315"], hexColor: "#4f5f6f" },
  { fsCode: "36173", colorName: "Dark Grey", tamiya: ["XF-53"], humbrol: ["27"], gunze: ["H22"], italeri: ["4754AP"], hexColor: "#5a5a5a" },
  { fsCode: "36231", colorName: "Dark Gull Grey / Grauviolett RLM 75", rlmCode: "75", tamiya: ["XF-54", "XF-19"], humbrol: ["140", "165"], gunze: ["H317", "H75"], revell: ["36157"], italeri: ["4755AP", "4785AP"], akInteractive: ["AK164", "AK165"], modelMaster: ["1724", "1726"], hobbyCores: ["HCSG-28"], mrPaint: ["MRP-059"], alcladII: ["ALCE221", "ALCE328"], hexColor: "#6F7571" },
  { fsCode: "26270", colorName: "Neutral Gray Semi-Gloss", tamiya: ["XF-53"], humbrol: ["145", "64"], gunze: ["H306", "H337"], hobbyCores: ["HCSG-06"], hexColor: "#808080" },
  { fsCode: "36270", colorName: "Neutral Gray / Medium Sea Grey", tamiya: ["XF-53", "XF-66", "XF-20", "XF-12"], humbrol: ["126", "145", "64"], gunze: ["H306", "H337", "H53"], revell: ["36175"], akInteractive: ["AK11018"], vallejo: ["71.280"], italeri: ["4313AP", "4746AP", "4686AP"], modelMaster: ["1727", "1727E", "4633"], lifecolor: ["LC 40"], hobbyCores: ["HCF-08"], mrColor: ["C306"], mrPaint: ["MRP-055", "MRP-069"], alcladII: ["ALCE003", "ALCE324"], hexColor: "#808080" },
  { fsCode: "36300", colorName: "Light Ghost Grey", ralCode: "7001", tamiya: ["XF-19"], humbrol: ["127"], gunze: ["H308"], italeri: ["4762AP"], modelMaster: ["1732"], hexColor: "#b0b0b0" },
  { fsCode: "36320", colorName: "Dark Ghost Grey", tamiya: ["XF-53"], humbrol: ["128", "167"], gunze: ["H307", "H337"], italeri: ["4687AP"], modelMaster: ["1729"], mrPaint: ["MRP-057", "MRP-099"], alcladII: ["ALCE325"], hexColor: "#5a5a5a" },
  { fsCode: "36375", colorName: "Light Ghost Grey", humbrol: ["127"], gunze: ["H308", "H348"], modelMaster: ["1731", "1732"], vallejo: ["70.990"], hobbyCores: ["HCSG-15", "HCF-27"], mrColor: ["C308"], mrPaint: ["MRP-056"], alcladII: ["ALCE326"], hexColor: "#a8a8a8" },
  { fsCode: "36440", colorName: "Gull Grey", humbrol: ["127"], gunze: ["H51", "H411"], modelMaster: ["1723", "1730"], hobbyCores: ["HCSG-13", "HCF-26"], mrPaint: ["MRP-060"], alcladII: ["ALCE327"], hexColor: "#b0b0b0" },
  { fsCode: "36473", colorName: "Lichtblau RLM 76", rlmCode: "76", tamiya: ["XF-14"], humbrol: ["147"], gunze: ["H417"], revell: ["36371"], italeri: ["4786AP"], hobbyCores: ["HCSG-29"], alcladII: ["ALCE222"], hexColor: "#98A6A7" },
  { fsCode: "36495", colorName: "Light Grey", tamiya: ["XF-19"], humbrol: ["127"], gunze: ["H308"], italeri: ["4765AP"], hobbyCores: ["HCSG-17", "HCF-28"], mrPaint: ["MRP-071"], hexColor: "#b0b0b0" },
  { fsCode: "36622", colorName: "Camouflage Grey / Gull Grey", ralCode: "7027", tamiya: ["XF-55"], humbrol: ["129", "28"], gunze: ["H325", "H311"], italeri: ["4763AP"], akInteractive: ["AK701", "AK723"], hobbyCores: ["HCSG-12", "HCF-23"], mrColor: ["C311"], alcladII: ["ALCE314"], hexColor: "#C8C1B1" },
  { fsCode: "36176", colorName: "Medium Grey", tamiya: ["XF-53"], humbrol: ["126"], hexColor: "#6a6a6a" },
  { fsCode: "36623", colorName: "Light Grey / Light Camouflage Grey", humbrol: ["127"], hexColor: "#909090" },
  
  // Other (37xxx)
  { fsCode: "37030", colorName: "Black", tamiya: ["XF-1"], humbrol: ["33", "85"], gunze: ["H12"], hexColor: "#0f0f0f" },
  { fsCode: "37031", colorName: "Aircraft Interior Black / Dunkelgrau", ralCode: "7021", tamiya: ["XF-24", "XF-63", "XF-69"], humbrol: ["123", "85"], gunze: ["H301", "H77", "H333"], revell: ["9", "78"], italeri: ["4795AP"], akInteractive: ["AK161", "AK704", "AK720"], modelMaster: ["1717"], hexColor: "#1a1a1a" },
  { fsCode: "37038", colorName: "Night Black / Flat Black", tamiya: ["XF-1"], humbrol: ["33"], gunze: ["H12"], revell: ["36108"], italeri: ["4768AP"], akInteractive: ["AK735", "AK3007", "AK3034"], modelMaster: ["1749", "4768"], lifecolor: ["LC02"], hataka: ["HTK-A041", "HTK-A100"], hobbyCores: ["HCF-34"], mrPaint: ["MRP-061"], hexColor: "#0d0d0d" },
  { fsCode: "37178", colorName: "Flat Aluminum / Metal Steel", tamiya: ["XF-56", "XF-16", "X-31"], humbrol: ["56"], gunze: ["H8", "H18"], revell: ["32199"], italeri: ["4677AP", "4679AP"], modelMaster: ["1781", "4677"], lifecolor: ["LC24"], hataka: ["HTK-_078"], hexColor: "#a9a9a9" },
  { fsCode: "37200", colorName: "Gun Metal", tamiya: ["X-10"], humbrol: ["53"], gunze: ["H76", "H18"], italeri: ["4681AP"], akInteractive: ["AK798"], modelMaster: ["1795", "4681"], lifecolor: ["LC26"], hataka: ["HTK-_106"], hexColor: "#4a4a4a" },
  { fsCode: "37875", colorName: "Flat White", tamiya: ["XF-2"], humbrol: ["34"], gunze: ["H11"], revell: ["36105"], italeri: ["4769AP"], akInteractive: ["AK738"], modelMaster: ["1703", "1768", "4769"], lifecolor: ["LC01"], hobbyCores: ["HCSG-14", "HCF-30"], mrPaint: ["MRP-062"], alcladII: ["ALCE320", "ALCE331"], hexColor: "#f5f5f5" },
  { fsCode: "37039", colorName: "Flat Black / Black FS37039", tamiya: ["XF-1"], humbrol: ["33"], gunze: ["H12"], hexColor: "#0d0d0d" },
  
  // Gloss colors (1xxxx)
  { fsCode: "11310", colorName: "Gloss Red", tamiya: ["X-7"], humbrol: ["19", "132"], gunze: ["H13"], hobbyCores: ["HCB-09", "HCF-31"], hexColor: "#cc0000" },
  { fsCode: "11136", colorName: "Insignia Red Gloss", humbrol: ["19", "132"], gunze: ["H405"], modelMaster: ["1704"], hexColor: "#cc0000" },
  { fsCode: "11302", colorName: "Gloss Red", tamiya: ["X-27"], humbrol: ["132", "19"], italeri: ["4605AP"], lifecolor: ["LC56"], hexColor: "#cd4f3a" },
  { fsCode: "12197", colorName: "International Orange Gloss", tamiya: ["X-6"], humbrol: ["18"], gunze: ["H14"], revell: ["36130"], italeri: ["4682AP"], modelMaster: ["2022", "1718"], mrPaint: ["MRP-066"], hexColor: "#f37556" },
  { fsCode: "13538", colorName: "Chrome Yellow Gloss", tamiya: ["X-24"], humbrol: ["69"], gunze: ["H4"], italeri: ["4642AP"], hexColor: "#ffc700" },
  { fsCode: "14066", colorName: "Gloss Green", tamiya: ["X-28"], italeri: ["4669AP"], hobbyCores: ["HCB-10"], hexColor: "#228b22" },
  { fsCode: "14090", colorName: "Gloss Green", tamiya: ["X-28"], italeri: ["4669AP"], hexColor: "#228b22" },
  { fsCode: "15042", colorName: "Sea Blue Gloss", gunze: ["H409"], modelMaster: ["1721"], hexColor: "#1f3f5f" },
  { fsCode: "15044", colorName: "Insignia Blue Gloss", gunze: ["H404"], modelMaster: ["1705"], mrPaint: ["MRP-063"], hexColor: "#0a1a3a" },
  { fsCode: "15050", colorName: "Blue Angels Blue Gloss", tamiya: ["X-3"], humbrol: ["190", "15"], gunze: ["H328"], revell: ["36150"], italeri: ["4687AP"], hexColor: "#1a4080" },
  { fsCode: "15180", colorName: "French Blue Gloss", tamiya: ["XF-8"], humbrol: ["14"], gunze: ["H45", "H15"], revell: ["36152"], italeri: ["4659AP"], hexColor: "#4169e1" },
  { fsCode: "15200", colorName: "Light Blue Gloss", tamiya: ["X-23"], italeri: ["4650AP"], hexColor: "#87ceeb" },
  { fsCode: "17038", colorName: "Gloss Black", tamiya: ["X-1"], humbrol: ["21"], gunze: ["H2"], revell: ["36107"], italeri: ["4695AP"], modelMaster: ["1707"], hobbyCores: ["HCB-11"], hexColor: "#0d0d0d" },
  { fsCode: "17043", colorName: "Gloss Gold", tamiya: ["X-12"], humbrol: ["16"], gunze: ["H9"], revell: ["36194"], italeri: ["4671AP"], hexColor: "#d4af37" },
  { fsCode: "17178", colorName: "Gloss Silver", tamiya: ["XF-16", "X-11"], humbrol: ["11"], gunze: ["H8"], revell: ["32190"], italeri: ["4678AP"], hexColor: "#c0c0c0" },
  { fsCode: "17875", colorName: "Gloss White / Insignia White", tamiya: ["X-2"], humbrol: ["22"], gunze: ["H21", "H1", "H316", "H401"], revell: ["36104"], italeri: ["4696AP"], akInteractive: ["AK2052"], hobbyCores: ["HCB-07"], mrPaint: ["MRP-064"], hexColor: "#ffffff" },
  { fsCode: "16473", colorName: "Semi-Gloss Light Gull Grey", humbrol: ["127"], hexColor: "#b0b0b0" },
  { fsCode: "17925", colorName: "Gloss White", tamiya: ["X-2"], humbrol: ["22"], hexColor: "#ffffff" },
  
  // Semi-Gloss colors (2xxxx)
  { fsCode: "20400", colorName: "Mud Brown / Dark Earth", tamiya: ["XF-52", "XF-68"], humbrol: ["29", "142"], gunze: ["H72"], hexColor: "#5a4030" },
  { fsCode: "24533", colorName: "Seafoam Green", hataka: ["HTK-A239"], hexColor: "#6b9e7a" },
  { fsCode: "25056", colorName: "Aggressor Blue", tamiya: ["XF-8"], humbrol: ["15"], hexColor: "#1a4080" },
  
  // RAL colors without FS equivalent
  { fsCode: "", colorName: "RAL 9005 Flat Black", ralCode: "9005", tamiya: ["XF-1"], humbrol: ["33"], gunze: ["C33", "H12"], vallejo: ["71.057"], hataka: ["HTK-_100"], modelMaster: ["1749", "4768"], lifecolor: ["LC02"], hexColor: "#0d0d0d" },
  { fsCode: "", colorName: "RAL 9001 Cream White", ralCode: "9001", vallejo: ["71.270"], hataka: ["HTK-_307"], hexColor: "#fffef0" },
  { fsCode: "", colorName: "RAL 9002 White Grey", ralCode: "9002", vallejo: ["71.119"], hexColor: "#e0e0e0" },
  { fsCode: "", colorName: "RAL 9003 Flat White", ralCode: "9003", tamiya: ["XF-2"], humbrol: ["34"], gunze: ["C62", "H11"], vallejo: ["71.001"], modelMaster: ["1768", "4769"], lifecolor: ["LC01"], hexColor: "#f5f5f5" },
  { fsCode: "", colorName: "RAL 3020 Signal Red", ralCode: "3020", gunze: ["C79", "H23"], humbrol: ["238"], vallejo: ["71.003"], hataka: ["HTK-_103"], hexColor: "#cc0000" },
  { fsCode: "", colorName: "RAL 3000 Red", ralCode: "3000", tamiya: ["XF-7"], gunze: ["H13"], humbrol: ["19"], vallejo: ["71.269"], hataka: ["HTK-_132"], modelMaster: ["2733"], lifecolor: ["LC06"], hexColor: "#a52019" },
  { fsCode: "", colorName: "RAL 1003 Yellow", ralCode: "1003", tamiya: ["X-8"], gunze: ["C329", "H329"], vallejo: ["71.135"], hataka: ["HTK-_107"], hexColor: "#f7ba00" },
  { fsCode: "", colorName: "RAL 1006 Maize Yellow", ralCode: "1006", gunze: ["H34"], vallejo: ["71.033"], hexColor: "#e4a010" },
  { fsCode: "", colorName: "RAL 2004 Orange", ralCode: "2004", tamiya: ["X-6"], gunze: ["C59", "H14"], humbrol: ["18"], vallejo: ["71.083"], hataka: ["HTK-_704"], lifecolor: ["LC05"], hexColor: "#ff6600" },
  { fsCode: "", colorName: "RAL 5005 Pure Blue", ralCode: "5005", humbrol: ["25"], vallejo: ["70.930"], hataka: ["HTK-_102"], hexColor: "#005387" },
  { fsCode: "", colorName: "RAL 6003 Olive Green", ralCode: "6003", gunze: ["H405"], vallejo: ["71.092"], hataka: ["HTK-_169"], modelMaster: ["2149", "4862"], lifecolor: ["UA206"], hexColor: "#4a5d23" },
  { fsCode: "", colorName: "RAL 6006 Feldgrau Field Grey", ralCode: "6006", vallejo: ["71.268"], hataka: ["HTK-_151"], modelMaster: ["2148", "4860"], hexColor: "#3c3c32" },
  { fsCode: "", colorName: "RAL 6007 Grün Green", ralCode: "6007", vallejo: ["71.019"], hataka: ["HTK-_298"], hexColor: "#2c3227" },
  { fsCode: "", colorName: "RAL 7008 Graugrün Grey Green", ralCode: "7008", vallejo: ["71.116"], hataka: ["HTK-_304"], modelMaster: ["2098"], lifecolor: ["UA212"], hexColor: "#6a5d4d" },
  { fsCode: "", colorName: "RAL 7016 Blaugrau Blue Grey", ralCode: "7016", vallejo: ["71.115"], hataka: ["HTK-_300"], modelMaster: ["2101"], lifecolor: ["UA208"], hexColor: "#383e42" },
  { fsCode: "", colorName: "RAL 7021 Dunkelgrau Dark Grey", ralCode: "7021", tamiya: ["XF-63"], gunze: ["H401"], humbrol: ["67"], vallejo: ["71.056"], hataka: ["HTK-_164"], modelMaster: ["2094", "4795"], lifecolor: ["UA207"], hexColor: "#3d3d3d" },
  { fsCode: "", colorName: "RAL 7027 Grau Grey", ralCode: "7027", gunze: ["H404"], vallejo: ["71.118"], hataka: ["HTK-_306"], modelMaster: ["2103"], lifecolor: ["UA202"], hexColor: "#7a7566" },
  { fsCode: "", colorName: "RAL 7028 Dunkelgelb Dark Yellow", ralCode: "7028", tamiya: ["XF-60"], gunze: ["H403"], vallejo: ["71.025"], hataka: ["HTK-_244"], modelMaster: ["2095", "4796"], lifecolor: ["UA204"], hexColor: "#b8a060" },
  { fsCode: "", colorName: "RAL 8000 Gelbraun Yellow Brown", ralCode: "8000", vallejo: ["71.272"], hataka: ["HTK-_303"], modelMaster: ["2099"], lifecolor: ["UA203"], hexColor: "#8c6b3a" },
  { fsCode: "", colorName: "RAL 8002 Erdgelb Earth Yellow", ralCode: "8002", vallejo: ["71.420"], hataka: ["HTK-_297"], modelMaster: ["2100"], lifecolor: ["UA209"], hexColor: "#7a5e3e" },
  { fsCode: "", colorName: "RAL 8012 Rot Rotbraun Red Brown", ralCode: "8012", tamiya: ["XF-9"], gunze: ["C43", "H47"], humbrol: ["160"], vallejo: ["71.271"], hataka: ["HTK-_175"], modelMaster: ["2152", "4861"], lifecolor: ["UA211"], hexColor: "#6b3a2a" },
  { fsCode: "", colorName: "RAL 8017 Rotbraun Red Brown", ralCode: "8017", tamiya: ["XF-9"], gunze: ["H406"], humbrol: ["160"], vallejo: ["71.041"], hataka: ["HTK-_147"], modelMaster: ["2096", "4797"], lifecolor: ["UA205"], hexColor: "#5a3a2a" },
  { fsCode: "", colorName: "RAL 8020 Braun Brown", ralCode: "8020", gunze: ["H402"], vallejo: ["71.117"], hataka: ["HTK-_305"], modelMaster: ["2102"], lifecolor: ["UA201"], hexColor: "#6b4b23" },
  { fsCode: "", colorName: "RAL 6031-F9 NATO Green", ralCode: "6031", tamiya: ["XF-67"], gunze: ["C519"], vallejo: ["71.250"], hataka: ["HTK-_152"], modelMaster: ["2173"], lifecolor: ["UA303"], hexColor: "#4a5d23" },
  { fsCode: "", colorName: "RAL 8027-F9 NATO Brown", ralCode: "8027", tamiya: ["XF-68"], gunze: ["C520"], vallejo: ["71.249"], hataka: ["HTK-_188"], modelMaster: ["2174"], lifecolor: ["UA302"], hexColor: "#5d4d3d" },
  
  // RLM colors
  { fsCode: "24226", colorName: "Grau RLM 02", rlmCode: "02", tamiya: ["XF-22", "XF-71"], humbrol: ["78"], gunze: ["H70"], revell: ["36148"], italeri: ["4770AP"], hobbyCores: ["HCSG-19"], hexColor: "#788371" },
  { fsCode: "", colorName: "RLM 04 Gelb / Yellow", rlmCode: "04", gunze: ["H413"], hobbyCores: ["HCSG-20"], hexColor: "#ffd700" },
  { fsCode: "", colorName: "RLM 21 White", rlmCode: "21", gunze: ["H414"], hexColor: "#f5f5f5" },
  { fsCode: "", colorName: "RLM 22 Schwarz / Black", rlmCode: "22", gunze: ["H415"], hobbyCores: ["HCSG-21"], hexColor: "#0d0d0d" },
  { fsCode: "", colorName: "RLM 23 Red", rlmCode: "23", gunze: ["H415"], hexColor: "#cc0000" },
  { fsCode: "", colorName: "RLM 24 Dunkelblau / Dark Blue", rlmCode: "24", gunze: ["H64"], hobbyCores: ["HCSG-22"], hexColor: "#2a3a5a" },
  { fsCode: "", colorName: "RLM 66 Schwarzgrau / Black Grey", rlmCode: "66", tamiya: ["XF-24"], gunze: ["H416"], hobbyCores: ["HCSG-24"], hexColor: "#3a3a40" },
  { fsCode: "", colorName: "RLM 70 Schwarzgrün / Black Green", rlmCode: "70", tamiya: ["XF-27"], humbrol: ["91"], gunze: ["H65"], hobbyCores: ["HCSG-25"], hexColor: "#3d4d3d" },
  { fsCode: "", colorName: "RLM 71 Dunkelgrün / Dark Green", rlmCode: "71", tamiya: ["XF-58"], humbrol: ["163"], gunze: ["H64", "H417"], italeri: ["4781AP"], hobbyCores: ["HCSG-26"], hexColor: "#4a5a4a" },
  { fsCode: "", colorName: "RLM 78 Hellblau / Light Blue", rlmCode: "78", gunze: ["H419"], hobbyCores: ["HCSG-30"], hexColor: "#8fa0b0" },
  { fsCode: "", colorName: "RLM 79 Sandgelb / Sand Yellow", rlmCode: "79", gunze: ["H418"], hobbyCores: ["HCSG-31"], hexColor: "#c4a060" },
  { fsCode: "", colorName: "RLM 80 Olivgrün / Olive Green", rlmCode: "80", gunze: ["H419"], hobbyCores: ["HCSG-32"], hexColor: "#5a6a4a" },
  { fsCode: "", colorName: "RLM 81 Brown Violet", rlmCode: "81", gunze: ["H420"], hexColor: "#5a4a4a" },
  { fsCode: "", colorName: "RLM 82 Hellgrün / Light Green", rlmCode: "82", gunze: ["H421"], hobbyCores: ["HCSG-33"], hexColor: "#8f9f7f" },
  { fsCode: "", colorName: "RLM 83 Dark Green", rlmCode: "83", gunze: ["H422"], hexColor: "#3f5f3f" },
  { fsCode: "", colorName: "RLM 84 Grun", rlmCode: "84", gunze: ["H423"], hexColor: "#6f7f6f" },
  
  // IPMS Stockholm US Colors - Pre-1939
  { fsCode: "36622", colorName: "Silver Gray (USN Pre-1939)", humbrol: ["28"], hexColor: "#C8C1B1" },
  { fsCode: "13538", colorName: "Chrome Yellow (USN Pre-1939)", humbrol: ["188"], hexColor: "#ffc700" },
  { fsCode: "30227", colorName: "Olive Drab (Pre-1939)", hexColor: "#6b6b23" },
  { fsCode: "30313", colorName: "Purple (Pre-1939)", humbrol: ["250"], hexColor: "#5a2a5a" },
  { fsCode: "34058", colorName: "Bottle Green (Pre-1939)", hexColor: "#2a5a4a" },
  { fsCode: "35109", colorName: "Light Blue (Pre-1939)", hexColor: "#87ceeb" },
  { fsCode: "37722", colorName: "White (Pre-1939)", hexColor: "#f5f5f5" },
  { fsCode: "17178", colorName: "Aluminum (Pre-1939 Metal Aircraft)", humbrol: ["191"], hexColor: "#c0c0c0" },
  
  // IPMS Stockholm US Colors - WWII (1939-1945)
  { fsCode: "37880", colorName: "ANA 601 Insignia White (USN/Atlantic)", hexColor: "#f5f5f5" },
  { fsCode: "36118", colorName: "ANA 603 Sea Grey Neutral", tamiya: ["XF-24"], gunze: ["H305"], modelMaster: ["1723"], hexColor: "#4f5f6f" },
  { fsCode: "25042", colorName: "ANA 606 Semi-Gloss Sea Blue (USN Top Wings)", hexColor: "#1a3a6a" },
  { fsCode: "35042", colorName: "ANA 607 Non-Specular Sea Blue (USN Top Fuselage)", tamiya: ["X-03"], gunze: ["H35"], hexColor: "#1f4f6f" },
  { fsCode: "35164", colorName: "ANA 608 Intermediate Blue (USN Fuselage Sides)", humbrol: ["144"], gunze: ["H42"], modelMaster: ["1720"], hexColor: "#4f6f8f" },
  { fsCode: "35231", colorName: "ANA 609 Azure Blue (African Campaign Lower)", tamiya: ["X-14"], hexColor: "#5f9ea0" },
  { fsCode: "24151", colorName: "ANA 611 Interior Green", tamiya: ["XF-04"], hexColor: "#5a7a5a" },
  { fsCode: "34084", colorName: "ANA 613 Olive Drab (USAAF Topside 1943+)", tamiya: ["XF-62"], hexColor: "#6b8e23" },
  { fsCode: "30279", colorName: "ANA 616 Sand (African Campaign Upper)", tamiya: ["XF-59"], humbrol: ["250"], gunze: ["H346"], hexColor: "#c4a060" },
  { fsCode: "36231", colorName: "ANA 621 Dark Gull Grey (Atlantic Aircraft Topside)", tamiya: ["XF-54"], humbrol: ["140"], gunze: ["H57"], modelMaster: ["1740"], hexColor: "#6F7571" },
  { fsCode: "17038", colorName: "ANA 622 Jet (Night Aircraft)", humbrol: ["21"], hexColor: "#0d0d0d" },
  { fsCode: "15042", colorName: "ANA 623 Glossy Sea Blue (USN 1943+ Overall)", hexColor: "#1f3f5f" },
  { fsCode: "23070", colorName: "41 Olive Drab (USAAF Topside pre-1943)", tamiya: ["XF-58"], humbrol: ["66", "155"], hexColor: "#4a5a23" },
  { fsCode: "34092", colorName: "42 Medium Green (OD Blotches pre-1942)", humbrol: ["149"], hexColor: "#4a6a4a" },
  { fsCode: "36173", colorName: "43 Neutral Gray (OD Scheme Undersides)", hexColor: "#5a5a5a" },
  { fsCode: "33538", colorName: "47 Orange Yellow", humbrol: ["154"], hexColor: "#ffd34b" },
  { fsCode: "35189", colorName: "M-485 Blue Gray (USN pre-1942 Topside)", hexColor: "#5f7f9f" },
  { fsCode: "36440", colorName: "M-495 Light Gray (USN pre-1942 Undersides)", humbrol: ["129"], hexColor: "#b0b0b0" },
  { fsCode: "34058", colorName: "Sea Green", tamiya: ["XF-17"], hexColor: "#2a5a4a" },
  
  // IPMS Stockholm US Colors - Post-war era
  { fsCode: "26320", colorName: "Dark Compass Grey", humbrol: ["128"], hexColor: "#5a5a5a" },
  { fsCode: "26270", colorName: "Medium Grey", humbrol: ["126"], hexColor: "#808080" },
  { fsCode: "26440", colorName: "Light Gull Grey (USN Topside)", tamiya: ["XF-20", "XF-2"], humbrol: ["129"], hexColor: "#b0b0b0" },
  { fsCode: "27875", colorName: "White (USN Undersides)", humbrol: ["130"], gunze: ["H21"], hexColor: "#ffffff" },
  { fsCode: "35414", colorName: "Blue", hexColor: "#4f7f9f" },
  { fsCode: "34097", colorName: "Marine Field Green", humbrol: ["105"], hexColor: "#4a5d4a" },
  { fsCode: "34258", colorName: "Green", hexColor: "#5a7a5a" },
  { fsCode: "36251", colorName: "Grey", hexColor: "#7a7a7a" },
  { fsCode: "30118", colorName: "Brown", hexColor: "#8b7355" },
  { fsCode: "36307", colorName: "Grey", hexColor: "#6a6a6a" },
  { fsCode: "37038", colorName: "Night Black", humbrol: ["33"], hexColor: "#0d0d0d" },
  
  // USAF/USMC Camouflage Schemes (Post-1964)
  { fsCode: "26173", colorName: "AMC Proud Grey (C-141, C-5, C-130)", hexColor: "#5a5a6a" },
  { fsCode: "36492", colorName: "Grey (EC-130, EF-111)", hexColor: "#7a7a8a" },
  { fsCode: "36375", colorName: "Ghost Grey (F-15)", hexColor: "#a8a8a8" },
  { fsCode: "37176", colorName: "Mod Eagle Light (PACAF F-15)", hexColor: "#a0a0a0" },
  { fsCode: "36251", colorName: "Mod Eagle Dark (PACAF F-15)", hexColor: "#7a7a7a" },
  { fsCode: "14064", colorName: "British Colours (Early Harriers)", hexColor: "#2a5a4a" },
  { fsCode: "16173", colorName: "British Colours Dark (Early Harriers)", hexColor: "#4a4a5a" },
  { fsCode: "16440", colorName: "British Colours Light (Early Harriers)", hexColor: "#a0a0a0" },
  { fsCode: "34064", colorName: "Green (AV-8A)", hexColor: "#4a5a4a" },
  { fsCode: "36099", colorName: "Grey (AV-8A)", hexColor: "#5f6f6f" },
  { fsCode: "36320", colorName: "HTPS Dark (AV-8B)", hexColor: "#5a5a5a" },
];

export const FS_CODES_LIST = FS_PAINT_CONVERSIONS
  .filter(c => c.fsCode)
  .map(c => ({ code: c.fsCode, name: c.colorName }))
  .sort((a, b) => a.code.localeCompare(b.code));

export const RAL_CODES_LIST = FS_PAINT_CONVERSIONS
  .filter(c => c.ralCode)
  .map(c => ({ code: c.ralCode!, name: c.colorName }))
  .filter((v, i, a) => a.findIndex(t => t.code === v.code) === i)
  .sort((a, b) => a.code.localeCompare(b.code));

export const RLM_CODES_LIST = FS_PAINT_CONVERSIONS
  .filter(c => c.rlmCode)
  .map(c => ({ code: c.rlmCode!, name: c.colorName }))
  .filter((v, i, a) => a.findIndex(t => t.code === v.code) === i)
  .sort((a, b) => a.code.localeCompare(b.code));

// Color code with type (FS, RLM, RAL, ANA)
export interface ColorCode {
  type: 'FS' | 'RLM' | 'RAL' | 'ANA' | 'Other';
  code: string;
  name?: string;
  hexColor?: string;
}

// Extended Camouflage Scheme with multi-type color codes
export interface CamouflageScheme {
  name: string;
  period?: string;
  aircraft?: string;
  fsCodes: string[]; // Legacy - kept for compatibility
  colorCodes?: ColorCode[]; // New extended format
  description?: string;
  category?: string;
  modelMasterPaints?: string[]; // Specific Model Master paint names for the scheme
}

export const COLOR_SCHEME_DATABASE: CamouflageScheme[] = [
  // USAF Schemes
  { name: "USAF Asia Minor", category: "USAF", fsCodes: ["20400", "30140", "34079", "36622"] },
  { name: "USAF Aggressor Flogger", category: "USAF", fsCodes: ["20400", "30140", "34079", "36623"] },
  { name: "USAF European I (A-10)", category: "USAF", aircraft: "A-10", fsCodes: ["36081", "34102", "34092"] },
  { name: "USAF European I (F-4)", category: "USAF", aircraft: "F-4", fsCodes: ["36081", "34102", "34079"] },
  { name: "USAF Ghost Grey (F-15)", category: "USAF", aircraft: "F-15", fsCodes: ["36320", "36375"] },
  { name: "USAF European I MAC", category: "USAF", aircraft: "C-141, C-5, C-130", fsCodes: ["36118", "34102", "34092"] },
  { name: "USAF Gunship Grey", category: "USAF", aircraft: "B-52G, B-1B, AC-130", fsCodes: ["36118"] },
  { name: "USAF Aggressor Fulcrum", category: "USAF", fsCodes: ["30140", "30279", "36270"] },
  { name: "USAF Aggressor Flanker", category: "USAF", fsCodes: ["35109", "35450", "36270", "37038"] },
  { name: "USAF Aggressor Sand", category: "USAF", fsCodes: ["20400", "30140", "30279", "36270"] },
  { name: "USAF Mod Eagle (F-15C)", category: "USAF", aircraft: "F-15C", fsCodes: ["36176", "36251"] },
  { name: "USAF F-15E (1991)", category: "USAF", aircraft: "F-15E", period: "1991", fsCodes: ["36118"] },
  { name: "USAF SEA Scheme (Vietnam Era)", category: "USAF", period: "Vietnam", fsCodes: ["34079", "34102", "30219", "36622"] },
  
  // US Navy Schemes
  { name: "USN Tactical Paint Scheme 1 (F/A-18A)", category: "USN", aircraft: "F/A-18A", fsCodes: ["35237", "36375", "36495"] },
  { name: "USN Tactical Paint Scheme 2 (F/A-18A)", category: "USN", aircraft: "F/A-18A", fsCodes: ["35237", "36320", "36375"] },
  { name: "USN/NSAWC F/A-18A Aggressor Grey", category: "USN", aircraft: "F/A-18A", fsCodes: ["36231", "36320", "36081"] },
  { name: "USN/NSAWC Aggressor Blue", category: "USN", fsCodes: ["35109", "35450", "36270", "37039"] },
  { name: "USN/NSAWC Aggressor Brown", category: "USN", fsCodes: ["20400", "30140", "30219"] },
  { name: "USN/NSAWC Aggressor MiG-29 Blue", category: "USN", fsCodes: ["35190", "35526", "36320", "36375", "37038"] },
  { name: "USN/NSAWC Aggressor MiG-29 Brown (Scheme 1)", category: "USN", fsCodes: ["30117", "30279", "36320", "36375", "37038"] },
  { name: "USN/NSAWC Aggressor MiG-29 Brown (Scheme 2)", category: "USN", fsCodes: ["30117", "30279", "34097", "36320", "37038"] },
  { name: "US Navy F-14A Ferris (Scheme 1)", category: "USN", aircraft: "F-14A", fsCodes: ["36118", "36231", "36440"] },
  { name: "US Navy F-14A Ferris (Scheme 2)", category: "USN", aircraft: "F-14A", fsCodes: ["35237", "36118", "36440", "36495"] },
  { name: "US Navy Standard (1960s-80s)", category: "USN", period: "1960s-80s", fsCodes: ["16440", "17925"] },
  { name: "US Navy F-14A (1977)", category: "USN", aircraft: "F-14A", period: "1977", fsCodes: ["16440"] },
  
  // USMC Schemes
  { name: "USMC (1977-1985)", category: "USMC", period: "1977-1985", fsCodes: ["35237"] },
  { name: "USMC (1991)", category: "USMC", period: "1991", fsCodes: ["35237", "36375"] },
  
  // USAAF Schemes
  { name: "USAAF B-25C (1940 Scheme 1)", category: "USAAF", aircraft: "B-25C", period: "1940", colorCodes: [{ type: 'ANA', code: '41' }, { type: 'ANA', code: '43' }], fsCodes: [] },
  { name: "USAAF B-25C (1941 Scheme 2)", category: "USAAF", aircraft: "B-25C", period: "1941", colorCodes: [{ type: 'ANA', code: '41' }, { type: 'ANA', code: '42' }, { type: 'ANA', code: '43' }], fsCodes: [] },
  { name: "USAAF B-25C (1943)", category: "USAAF", aircraft: "B-25C", period: "1943", colorCodes: [{ type: 'ANA', code: '41' }, { type: 'Other', code: 'Metal' }], fsCodes: [] },
  { name: "USAAF B-25C Desert (Scheme 1)", category: "USAAF", aircraft: "B-25C", colorCodes: [{ type: 'ANA', code: '26' }, { type: 'ANA', code: '43' }], fsCodes: [] },
  { name: "USAF Atomic Flash (B-52)", category: "USAF", aircraft: "B-52", colorCodes: [{ type: 'ANA', code: '601' }, { type: 'ANA', code: '604' }, { type: 'Other', code: 'Aluminium' }], fsCodes: [] },
  
  // Israeli Air Force
  { name: "Israeli Air Force (1967)", category: "IAF", period: "1967", fsCodes: ["30219", "33531", "34227", "35622"] },
  { name: "Israeli Air Force (F-16)", category: "IAF", aircraft: "F-16", fsCodes: ["30219", "33531", "34424", "35622"] },
  { name: "Israeli Air Force Desert (CH-53)", category: "IAF", aircraft: "CH-53", fsCodes: ["30219", "33531", "34424"] },
  { name: "Israeli Air Force (F-15I, F-16, Kfir)", category: "IAF", aircraft: "F-15I, F-16, Kfir", fsCodes: ["30219", "33531", "34424", "36375"] },
  
  // Italian Air Force
  { name: "Italian Air Force F-104G (1962)", category: "AMI", aircraft: "F-104G", period: "1962", colorCodes: [{ type: 'FS', code: '16473' }, { type: 'FS', code: '17875' }, { type: 'FS', code: '37038' }, { type: 'Other', code: 'Metal' }], fsCodes: ["16473", "17875", "37038"] },
  
  // German Luftwaffe WWII
  { name: "Luftwaffe Bf 110C", category: "Luftwaffe", aircraft: "Bf 110C", colorCodes: [{ type: 'RLM', code: '02' }, { type: 'RLM', code: '70' }, { type: 'RLM', code: '71' }, { type: 'RLM', code: '65' }], fsCodes: [] },
  { name: "Luftwaffe Bf 110 Nightfighter", category: "Luftwaffe", aircraft: "Bf 110", colorCodes: [{ type: 'RLM', code: '22' }], fsCodes: [] },
  { name: "Bf 109 (1935)", category: "Luftwaffe", aircraft: "Bf 109", period: "1935", colorCodes: [{ type: 'RLM', code: '63' }, { type: 'RLM', code: '65' }], fsCodes: [] },
  { name: "Bf 109E (1937)", category: "Luftwaffe", aircraft: "Bf 109E", period: "1937", colorCodes: [{ type: 'RLM', code: '65' }, { type: 'RLM', code: '70' }, { type: 'RLM', code: '71' }], fsCodes: [] },
  { name: "Bf 109E (1940 Scheme 1)", category: "Luftwaffe", aircraft: "Bf 109E", period: "1940", colorCodes: [{ type: 'RLM', code: '65' }, { type: 'RLM', code: '70' }, { type: 'RLM', code: '71' }], fsCodes: [] },
  { name: "Bf 109E (1940 Scheme 2)", category: "Luftwaffe", aircraft: "Bf 109E", period: "1940", colorCodes: [{ type: 'RLM', code: '65' }, { type: 'RLM', code: '02' }, { type: 'RLM', code: '71' }], fsCodes: [] },
  { name: "Bf 109E (1941)", category: "Luftwaffe", aircraft: "Bf 109E", period: "1941", colorCodes: [{ type: 'RLM', code: '02' }, { type: 'RLM', code: '70' }, { type: 'RLM', code: '74' }, { type: 'RLM', code: '75' }, { type: 'RLM', code: '76' }], fsCodes: [] },
  { name: "Me 109K-4 (1944)", category: "Luftwaffe", aircraft: "Me 109K-4", period: "1944", colorCodes: [{ type: 'RLM', code: '81' }, { type: 'RLM', code: '82' }, { type: 'RLM', code: '84a' }], fsCodes: [] },
  { name: "Bf 109E JG 53 (1940)", category: "Luftwaffe", aircraft: "Bf 109E", period: "1940", colorCodes: [{ type: 'RLM', code: '04' }, { type: 'RLM', code: '02' }, { type: 'RLM', code: '70' }, { type: 'RLM', code: '71' }, { type: 'RLM', code: '65' }], fsCodes: [] },
  { name: "Bf 109E Desert (Scheme 1)", category: "Luftwaffe", aircraft: "Bf 109E", colorCodes: [{ type: 'RLM', code: '78' }, { type: 'RLM', code: '79' }], fsCodes: [] },
  { name: "Bf 109E Desert (Scheme 2)", category: "Luftwaffe", aircraft: "Bf 109E", colorCodes: [{ type: 'RLM', code: '78' }, { type: 'RLM', code: '79' }, { type: 'RLM', code: '80' }], fsCodes: [] },
  { name: "Me 109F-1 Trop (Tunisia 1943)", category: "Luftwaffe", aircraft: "Me 109F-1", period: "1943", colorCodes: [{ type: 'RLM', code: '78' }, { type: 'RLM', code: '79' }, { type: 'RLM', code: '80' }], fsCodes: [] },
  
  // German Luftwaffe Modern
  { name: "German Luftwaffe Tornado", category: "Luftwaffe", aircraft: "Tornado", colorCodes: [{ type: 'RAL', code: '6003' }, { type: 'RAL', code: '9005' }, { type: 'Other', code: 'Mix RAL 7015 + 9001' }], fsCodes: [] },
  
  // JASDF Schemes
  { name: "JASDF F-15DJ Aggressor (Grey/Black)", category: "JASDF", aircraft: "F-15DJ", fsCodes: ["36320", "36375", "37038"] },
  { name: "JASDF F-15DJ Aggressor (Green)", category: "JASDF", aircraft: "F-15DJ", fsCodes: ["36320", "36375", "34108"] },
  { name: "JASDF F-15DJ Aggressor (Red)", category: "JASDF", aircraft: "F-15DJ", fsCodes: ["36320", "36375", "32197"] },
  { name: "JASDF F-15DJ Aggressor (Blue)", category: "JASDF", aircraft: "F-15DJ", fsCodes: ["36320", "36375", "25056"] },
  { name: "JASDF F-15DJ Aggressor (Brown/Green)", category: "JASDF", aircraft: "F-15DJ", fsCodes: ["36320", "36375", "34092", "30111"] },
  
  // US Army Vehicle Camouflage Schemes (1970s-1980s)
  { name: "US Army MASSTER Pattern", category: "US Army", description: "MASSTER camouflage scheme for USAREUR vehicles in 1970s/80s", period: "1970s-1980s", fsCodes: ["34127", "30117", "30372", "37038"] },
  { name: "US Army DUALTEX Pattern", category: "US Army", description: "Dual Texture Gradient Pattern for USAREUR vehicles in 1970s/80s", period: "1970s-1980s", fsCodes: ["34079", "30118", "30277", "37038", "24533"] },
  { name: "US Army MERDC Summer Europe/USA", category: "US Army", description: "Mobile Equipment Research and Design Command summer scheme", period: "1970s-1980s", fsCodes: ["34079", "30118", "30277", "37038"] },
  { name: "US Army Dual Texture Gradient", category: "US Army", description: "Dual Texture Gradient Pattern tested 1978-1985", period: "1978-1985", fsCodes: ["34079", "30118", "30277", "37038"] },
  { name: "NATO Three Color Camouflage", category: "NATO", description: "Standard NATO three-color vehicle camouflage", fsCodes: ["34094", "30051", "37030"] },
  { name: "NATO Three Color with Tan", category: "NATO", description: "NATO three-color desert variant with tan", fsCodes: ["34094", "30051", "37030", "33446"] },

  // French Army
  { name: "French Army Armour Modern Cammo", category: "French Army", description: "Modern French Army armoured vehicle camouflage using Model Master paints", fsCodes: ["30140", "34092", "37038"], modelMasterPaints: ["French Earth Brown", "Medium Green", "Flat Black"] },
];

// Legacy export for backwards compatibility
export const US_CAMOUFLAGE_SCHEMES: CamouflageScheme[] = COLOR_SCHEME_DATABASE;

export function searchCamouflageSchemes(query: string): CamouflageScheme[] {
  const q = query.toLowerCase().trim();
  if (!q) return US_CAMOUFLAGE_SCHEMES;
  
  return US_CAMOUFLAGE_SCHEMES.filter(scheme => {
    if (scheme.name.toLowerCase().includes(q)) return true;
    if (scheme.aircraft?.toLowerCase().includes(q)) return true;
    if (scheme.description?.toLowerCase().includes(q)) return true;
    if (scheme.period?.toLowerCase().includes(q)) return true;
    if (scheme.fsCodes.some(code => code.includes(q))) return true;
    return false;
  });
}

export function searchPaintConversions(query: string): PaintConversion[] {
  const q = query.toLowerCase().trim();
  if (!q) return [];
  
  return FS_PAINT_CONVERSIONS.filter(c => {
    if (c.fsCode && c.fsCode.toLowerCase().includes(q)) return true;
    if (c.colorName && c.colorName.toLowerCase().includes(q)) return true;
    if (c.ralCode && c.ralCode.toLowerCase().includes(q)) return true;
    if (c.rlmCode && c.rlmCode.toLowerCase().includes(q)) return true;
    if (c.tamiya?.some(t => t.toLowerCase().includes(q))) return true;
    if (c.humbrol?.some(t => t.toLowerCase().includes(q))) return true;
    if (c.gunze?.some(t => t.toLowerCase().includes(q))) return true;
    if (c.revell?.some(t => t.toLowerCase().includes(q))) return true;
    if (c.akInteractive?.some(t => t.toLowerCase().includes(q))) return true;
    if (c.vallejo?.some(t => t.toLowerCase().includes(q))) return true;
    if (c.italeri?.some(t => t.toLowerCase().includes(q))) return true;
    if (c.modelMaster?.some(t => t.toLowerCase().includes(q))) return true;
    if (c.lifecolor?.some(t => t.toLowerCase().includes(q))) return true;
    if (c.hataka?.some(t => t.toLowerCase().includes(q))) return true;
    if (c.hobbyCores?.some(t => t.toLowerCase().includes(q))) return true;
    return false;
  });
}

export function findByFsCode(fsCode: string): PaintConversion | undefined {
  return FS_PAINT_CONVERSIONS.find(c => c.fsCode === fsCode);
}

export function findByRalCode(ralCode: string): PaintConversion[] {
  return FS_PAINT_CONVERSIONS.filter(c => c.ralCode === ralCode);
}

export function findByRlmCode(rlmCode: string): PaintConversion[] {
  return FS_PAINT_CONVERSIONS.filter(c => c.rlmCode === rlmCode);
}

const BRAND_TOKEN_PATTERNS: Record<string, string[][]> = {
  tamiya: [['tamiya']],
  humbrol: [['humbrol']],
  gunze: [['gunze'], ['mr', 'hobby'], ['mr', 'color'], ['mrcolor'], ['mrhobby'], ['aqueous'], ['gsi', 'creos'], ['gsicreos'], ['creos']],
  revell: [['revell']],
  akInteractive: [['ak'], ['ak', 'interactive'], ['akinteractive'], ['ak', '3g'], ['ak3g'], ['ammo'], ['ammo', 'mig'], ['ammomig'], ['mig', 'productions'], ['migproductions'], ['a', 'mig'], ['amig']],
  vallejo: [['vallejo'], ['model', 'air'], ['modelair'], ['model', 'color'], ['modelcolor'], ['game', 'color'], ['gamecolor']],
  italeri: [['italeri']],
  modelMaster: [['model', 'master'], ['modelmaster'], ['testors']],
  lifecolor: [['lifecolor'], ['life', 'color']],
  hataka: [['hataka']],
  hobbyCores: [['hobby', 'cores'], ['hobbycores']],
};

const COLOR_NAME_TRANSLATIONS: Record<string, string[]> = {
  'olive drab': ['verde oliva', 'oliva', 'olive'],
  'dark green': ['verde escuro', 'verde escura'],
  'light green': ['verde claro', 'verde clara'],
  'forest green': ['verde floresta'],
  'brown': ['marrom', 'castanho'],
  'dark brown': ['marrom escuro'],
  'light brown': ['marrom claro'],
  'sand': ['areia', 'caqui'],
  'desert sand': ['areia deserto'],
  'khaki': ['caqui', 'khaki'],
  'grey': ['cinza', 'cinzento', 'gray'],
  'dark grey': ['cinza escuro', 'cinza escura'],
  'light grey': ['cinza claro', 'cinza clara'],
  'blue': ['azul'],
  'dark blue': ['azul escuro', 'azul escura'],
  'light blue': ['azul claro', 'azul clara'],
  'red': ['vermelho', 'encarnado'],
  'yellow': ['amarelo'],
  'orange': ['laranja'],
  'black': ['preto', 'negro'],
  'white': ['branco'],
  'aluminum': ['aluminio', 'aluminium'],
  'silver': ['prata', 'prateado'],
  'gold': ['ouro', 'dourado'],
  'rust': ['ferrugem', 'oxidado'],
  'earth': ['terra'],
  'field': ['campo'],
  'leather': ['couro'],
  'wood': ['madeira'],
  'buff': ['bege'],
};

function normalizeCode(code: string): string {
  return code.toLowerCase().replace(/[\s\-\.]/g, '').trim();
}

function tokenizeBrand(brand: string): string[] {
  return brand.toLowerCase().split(/[\s\-\.]+/).filter(t => t.length > 0);
}

function matchBrand(inputBrand: string | undefined | null, targetBrand: keyof typeof BRAND_TOKEN_PATTERNS): boolean {
  if (!inputBrand || inputBrand.trim().length === 0) {
    return false;
  }
  
  const inputTokens = tokenizeBrand(inputBrand);
  const joinedInput = inputTokens.join('');
  const tokenPatterns = BRAND_TOKEN_PATTERNS[targetBrand];
  
  return tokenPatterns.some(pattern => {
    if (pattern.length === 1) {
      const p = pattern[0];
      return inputTokens.includes(p) || joinedInput === p;
    }
    return pattern.every(p => inputTokens.includes(p));
  });
}

export function findByManufacturerCode(brand: string | undefined | null, code: string | undefined | null): PaintConversion | undefined {
  if (!brand || !code || brand.trim().length === 0 || code.trim().length === 0) {
    return undefined;
  }
  const normalizedCode = normalizeCode(code);
  
  return FS_PAINT_CONVERSIONS.find(c => {
    if (matchBrand(brand, 'tamiya') && c.tamiya?.some(t => normalizeCode(t) === normalizedCode)) return true;
    if (matchBrand(brand, 'humbrol') && c.humbrol?.some(t => normalizeCode(t) === normalizedCode)) return true;
    if (matchBrand(brand, 'gunze') && c.gunze?.some(t => normalizeCode(t) === normalizedCode)) return true;
    if (matchBrand(brand, 'revell') && c.revell?.some(t => normalizeCode(t) === normalizedCode)) return true;
    if (matchBrand(brand, 'akInteractive') && c.akInteractive?.some(t => normalizeCode(t) === normalizedCode)) return true;
    if (matchBrand(brand, 'vallejo') && c.vallejo?.some(t => normalizeCode(t) === normalizedCode)) return true;
    if (matchBrand(brand, 'italeri') && c.italeri?.some(t => normalizeCode(t) === normalizedCode)) return true;
    if (matchBrand(brand, 'modelMaster') && c.modelMaster?.some(t => normalizeCode(t) === normalizedCode)) return true;
    if (matchBrand(brand, 'lifecolor') && c.lifecolor?.some(t => normalizeCode(t) === normalizedCode)) return true;
    if (matchBrand(brand, 'hataka') && c.hataka?.some(t => normalizeCode(t) === normalizedCode)) return true;
    if (matchBrand(brand, 'hobbyCores') && c.hobbyCores?.some(t => normalizeCode(t) === normalizedCode)) return true;
    return false;
  });
}

function translateColorName(colorName: string): string[] {
  const normalized = colorName.toLowerCase().trim();
  const translations: string[] = [normalized];
  
  for (const [englishName, variants] of Object.entries(COLOR_NAME_TRANSLATIONS)) {
    if (variants.some(v => normalized.includes(v))) {
      translations.push(englishName);
    }
    if (normalized.includes(englishName)) {
      translations.push(...variants);
    }
  }
  
  return translations;
}

export function findByColorName(colorName: string): PaintConversion | undefined {
  const searchTerms = translateColorName(colorName);
  
  return FS_PAINT_CONVERSIONS.find(c => {
    const dbColorName = c.colorName.toLowerCase();
    return searchTerms.some(term => dbColorName.includes(term));
  });
}

export function findByHexColor(hexColor: string): PaintConversion | undefined {
  if (!hexColor) return undefined;
  const normalized = hexColor.toLowerCase().replace('#', '');
  
  const hexToRgb = (hex: string) => {
    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);
    return { r, g, b };
  };
  
  const colorDistance = (c1: { r: number; g: number; b: number }, c2: { r: number; g: number; b: number }) => {
    return Math.sqrt(Math.pow(c1.r - c2.r, 2) + Math.pow(c1.g - c2.g, 2) + Math.pow(c1.b - c2.b, 2));
  };
  
  const targetRgb = hexToRgb(normalized);
  let closest: PaintConversion | undefined;
  let minDistance = Infinity;
  
  for (const conv of FS_PAINT_CONVERSIONS) {
    if (conv.hexColor) {
      const convRgb = hexToRgb(conv.hexColor.replace('#', ''));
      const distance = colorDistance(targetRgb, convRgb);
      if (distance < minDistance && distance < 50) {
        minDistance = distance;
        closest = conv;
      }
    }
  }
  
  return closest;
}

export function findPaintsFromConversionsByName(searchName: string): { brand: string; paint: { code: string; name: string; color?: string; fsCode?: string } }[] {
  const results: { brand: string; paint: { code: string; name: string; color?: string; fsCode?: string } }[] = [];
  const searchTerms = translateColorName(searchName);
  
  if (!searchName.trim() || searchName.trim().length < 2) return results;
  
  const searchWords = searchName.trim().toLowerCase().split(/\s+/).filter(word => word.length > 0);
  
  for (const conv of FS_PAINT_CONVERSIONS) {
    const dbColorName = conv.colorName.toLowerCase();
    const matchesByTerms = searchTerms.some(term => dbColorName.includes(term));
    const matchesByWords = searchWords.every(word => dbColorName.includes(word));
    
    if (matchesByTerms || matchesByWords) {
      if (conv.tamiya) {
        conv.tamiya.forEach(code => {
          results.push({
            brand: "Tamiya",
            paint: { code, name: conv.colorName, color: conv.hexColor, fsCode: conv.fsCode }
          });
        });
      }
      if (conv.humbrol) {
        conv.humbrol.forEach(code => {
          results.push({
            brand: "Humbrol",
            paint: { code, name: conv.colorName, color: conv.hexColor, fsCode: conv.fsCode }
          });
        });
      }
      if (conv.gunze) {
        conv.gunze.forEach(code => {
          results.push({
            brand: "Mr. Hobby / Gunze",
            paint: { code, name: conv.colorName, color: conv.hexColor, fsCode: conv.fsCode }
          });
        });
      }
      if (conv.revell) {
        conv.revell.forEach(code => {
          results.push({
            brand: "Revell",
            paint: { code, name: conv.colorName, color: conv.hexColor, fsCode: conv.fsCode }
          });
        });
      }
      if (conv.akInteractive) {
        conv.akInteractive.forEach(code => {
          results.push({
            brand: "AK Interactive",
            paint: { code, name: conv.colorName, color: conv.hexColor, fsCode: conv.fsCode }
          });
        });
      }
      if (conv.vallejo) {
        conv.vallejo.forEach(code => {
          results.push({
            brand: "Vallejo",
            paint: { code, name: conv.colorName, color: conv.hexColor, fsCode: conv.fsCode }
          });
        });
      }
      if (conv.italeri) {
        conv.italeri.forEach(code => {
          results.push({
            brand: "Italeri",
            paint: { code, name: conv.colorName, color: conv.hexColor, fsCode: conv.fsCode }
          });
        });
      }
      if (conv.modelMaster) {
        conv.modelMaster.forEach(code => {
          results.push({
            brand: "Model Master",
            paint: { code, name: conv.colorName, color: conv.hexColor, fsCode: conv.fsCode }
          });
        });
      }
      if (conv.lifecolor) {
        conv.lifecolor.forEach(code => {
          results.push({
            brand: "Lifecolor",
            paint: { code, name: conv.colorName, color: conv.hexColor, fsCode: conv.fsCode }
          });
        });
      }
      if (conv.hataka) {
        conv.hataka.forEach(code => {
          results.push({
            brand: "Hataka",
            paint: { code, name: conv.colorName, color: conv.hexColor, fsCode: conv.fsCode }
          });
        });
      }
      if (conv.hobbyCores) {
        conv.hobbyCores.forEach(code => {
          results.push({
            brand: "Hobby Cores",
            paint: { code, name: conv.colorName, color: conv.hexColor, fsCode: conv.fsCode }
          });
        });
      }
    }
  }
  
  return results;
}

export function findReferenceCode(paint: { 
  brand?: string; 
  manufacturerCode?: string; 
  colorName?: string;
  hexColor?: string;
}): { code: string; type: 'FS' | 'RAL' | 'RLM'; hexColor?: string; colorName?: string } | undefined {
  let conversion: PaintConversion | undefined;
  
  if (paint.brand && paint.manufacturerCode) {
    conversion = findByManufacturerCode(paint.brand, paint.manufacturerCode);
  }
  
  if (!conversion && paint.colorName) {
    conversion = findByColorName(paint.colorName);
  }
  
  if (!conversion && paint.hexColor) {
    conversion = findByHexColor(paint.hexColor);
  }
  
  if (conversion) {
    if (conversion.fsCode) {
      return { code: `FS ${conversion.fsCode}`, type: 'FS', hexColor: conversion.hexColor, colorName: conversion.colorName };
    }
    if (conversion.ralCode) {
      return { code: `RAL ${conversion.ralCode}`, type: 'RAL', hexColor: conversion.hexColor, colorName: conversion.colorName };
    }
    if (conversion.rlmCode) {
      return { code: `RLM ${conversion.rlmCode}`, type: 'RLM', hexColor: conversion.hexColor, colorName: conversion.colorName };
    }
  }
  
  return undefined;
}

/* 智触人体 · 医脉相承 — interactive educational frontend
 * Standalone mode: local knowledge entries, learning records, quizzes and specimen illustrations.
 * Optional server: /api/health, /api/ai/chat and /api/ai/vision.
 * This frontend never contains or requests an API key from the end user.
 */
'use strict';
const $ = s => document.querySelector(s);
const $$ = s => Array.from(document.querySelectorAll(s));
const esc = val => String(val??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
const STORAGE='zhichu-anatomy-platform-v1';
const defaults=()=>({nickname:'探索者',mastered:[],favorites:[],wrong:[],specFavorites:[],attempts:[],chat:[],totalSecs:0,visited:[],imported:[],imports:[],draft:null,savedAt:null});
let state;
try{state={...defaults(),...JSON.parse(localStorage.getItem(STORAGE)||'{}')};}catch{state=defaults();}
for(const k of ['mastered','favorites','wrong','specFavorites','attempts','chat','visited','imported','imports'])if(!Array.isArray(state[k]))state[k]=[];
let storageHealthy=true;
function save(){const previous=state.savedAt;state.savedAt=new Date().toISOString();try{localStorage.setItem(STORAGE,JSON.stringify(state));storageHealthy=true;window.dispatchEvent(new Event('learning-saved'));return true}catch(e){state.savedAt=previous;storageHealthy=false;window.dispatchEvent(new Event('learning-saved'));console.warn('学习数据无法保存',e);return false}};
const SYSTEM_COLORS={'运动系统':'#cba77c','神经系统':'#beb3d6','循环系统':'#d9a5a0','呼吸系统':'#9dc9b6','消化系统':'#d5c38b'};
const GOLD='#dfbb7b';
const specimens=[
 {id:'brain',serial:'01',title:'颅脑正中矢状面',en:'MEDIAN SAGITTAL BRAIN',system:'神经系统',intro:'以脑正中矢状面为观察视角，理解胼胝体、脑干、小脑及脑室系统的相互位置关系。',features:['胼胝体：连接双侧大脑半球的主要连合纤维','脑干：中脑、脑桥、延髓构成重要生命中枢通路','小脑：位于后颅窝，参与姿势平衡与运动协调','第三脑室：间脑内位于中线的脑脊液腔隙'],clinical:'脑干与呼吸、循环调节密切相关。矢状面结构定位有助于神经系统影像判读和临床神经解剖学习。',topic:'brain-corpus'},
 {id:'heart',serial:'02',title:'心脏与循环结构',en:'HEART & CIRCULATION',system:'循环系统',intro:'从四个心腔出发观察房室关系、瓣膜位置与体循环和肺循环的连接，建立血流方向的空间认知。',features:['右心房和右心室：接受体循环回流，向肺动脉泵血','左心房和左心室：接受肺静脉回流，向主动脉泵血','房室瓣：三尖瓣与二尖瓣保证血液单向流动','冠状动脉：由主动脉根部发出，供应心肌'],clinical:'冠状动脉解剖对于理解心肌缺血与冠心病具有基础意义；瓣膜形态与血流方向是心脏听诊和影像判读的重要依据。',topic:'heart-chambers'},
 {id:'lungs',serial:'03',title:'肺叶与支气管树',en:'LUNGS & BRONCHI',system:'呼吸系统',intro:'认识左右肺叶、支气管分支及肺段的层级关系，理解气体输送与肺部局部解剖的基础。',features:['右肺：分上、中、下三叶','左肺：分上、下两叶，存在心切迹','主支气管：气管分叉后进入左右肺门','支气管肺段：以段支气管为中心的肺实质功能解剖单元'],clinical:'肺段知识对肺部病灶定位、影像分析和亚肺叶切除术具有基础价值。临床操作须由专业人员完成。',topic:'lung-lobes'},
 {id:'spine',serial:'04',title:'脊柱与椎管层次',en:'SPINE & SPINAL CANAL',system:'运动系统',intro:'纵向观察椎骨排列、椎管、脊髓与被膜，建立从骨性支撑到神经保护的整体认识。',features:['椎体与椎弓：围成椎孔，多个椎孔共同构成椎管','椎间盘：位于相邻椎体之间，参与缓冲负荷','脊髓被膜：由外向内依次为硬脊膜、蛛网膜、软脊膜','马尾：由下行的腰骶神经根组成'],clinical:'椎管层次是理解腰椎穿刺、椎管内麻醉和脊柱影像的基础；应严格区分教学示意与实际临床操作。',topic:'spinal-meninges'},
 {id:'knee',serial:'05',title:'膝关节层次解剖',en:'KNEE JOINT COMPLEX',system:'运动系统',intro:'关注股骨远端、胫骨近端、髌骨、半月板与关节周围韧带在关节稳定性中的协同作用。',features:['股骨内外侧髁：与胫骨平台共同构成主要关节面','髌骨：嵌于股四头肌肌腱内，改善伸膝力学','内外侧半月板：分散压力、增加关节匹配度','交叉韧带：参与限制胫股关节的异常前后移位'],clinical:'膝关节多结构协同维持稳定。解剖定位是理解半月板损伤与前交叉韧带损伤的基础。',topic:'knee-ligaments'}
];
const topics=[
{id:'bone-206',system:'运动系统',name:'人体骨骼的基本构成',latin:'Human skeletal system',summary:'成人正常人体骨通常为206块，依解剖部位可归为中轴骨和附肢骨。骨与关节和骨骼肌共同构成运动系统。',key:'骨除了支持、运动和保护作用外，还具有矿物质储存等生理功能。',clinical:'骨量与骨强度改变可影响骨折风险。'},
{id:'joint-types',system:'运动系统',name:'关节与运动',latin:'Articulationes',summary:'骨连接依连接组织与活动度具有不同类型，滑膜关节一般具有关节面、关节囊及关节腔。',key:'滑膜关节具有灵活活动能力，关节软骨与滑液协助减小摩擦。',clinical:'关节稳定性同时依赖骨性、韧带及肌肉因素。'},
{id:'knee-ligaments',system:'运动系统',name:'膝关节与交叉韧带',latin:'Articulatio genus',summary:'膝关节主要涉及股骨、胫骨与髌骨；前后交叉韧带、侧副韧带、半月板共同维持关节稳定。',key:'前交叉韧带主要限制胫骨相对股骨过度前移，后交叉韧带主要限制过度后移。',clinical:'前交叉韧带损伤是常见运动损伤之一。'},
{id:'vertebral-column',system:'运动系统',name:'椎骨与脊柱分区',latin:'Columna vertebralis',summary:'成人脊柱通常分为颈椎、胸椎、腰椎、骶骨及尾骨等部分。颈椎7块、胸椎12块、腰椎5块。',key:'椎体主要承担负重，椎弓参与形成椎管，椎间盘连接相邻椎体。',clinical:'脊柱节段定位是影像判读与体格检查的重要基础。'},
{id:'muscle-roles',system:'运动系统',name:'骨骼肌的协同运动',latin:'Musculi skeletales',summary:'骨骼肌收缩经肌腱牵引骨骼产生运动，不同动作依靠原动肌、拮抗肌、协同肌协调。',key:'肌肉附着点、神经支配及跨越的关节决定肌肉运动功能。',clinical:'肌肉力量评估和神经支配分布可用于神经功能检查。'},
{id:'brain-corpus',system:'神经系统',name:'胼胝体与大脑连合',latin:'Corpus callosum',summary:'胼胝体是连接两侧大脑半球的重要白质纤维束，位于大脑纵裂深部，形成重要的半球间信息通路。',key:'矢状位观察时，胼胝体位于侧脑室上方，呈弧形白质结构。',clinical:'胼胝体发育或病理改变可能影响双半球信息整合。'},
{id:'brain-lobes',system:'神经系统',name:'大脑皮质的主要脑叶',latin:'Lobi cerebri',summary:'大脑皮质可分额叶、顶叶、颞叶、枕叶等区域，各与运动执行、躯体感觉、听觉及视觉等功能存在联系。',key:'脑叶功能相互联系，不能简单理解为每个功能只由单一区域承担。',clinical:'病变定位需要结合神经系统检查及脑影像。'},
{id:'brain-stem',system:'神经系统',name:'脑干与脑神经',latin:'Truncus encephali',summary:'脑干由中脑、脑桥及延髓构成，联通大脑、小脑与脊髓，含多种重要神经传导通路及脑神经核。',key:'延髓含与呼吸、心血管功能调节相关的重要中枢。',clinical:'脑干病变可能表现为复杂的颅神经与长束体征。'},
{id:'spinal-meninges',system:'神经系统',name:'脊髓被膜与腔隙',latin:'Meninges spinales',summary:'脊髓由硬脊膜、蛛网膜和软脊膜包裹，蛛网膜下隙含有脑脊液。',key:'由外向内：硬脊膜 → 蛛网膜 → 软脊膜。',clinical:'脊髓被膜与椎管腔隙的关系是理解腰椎穿刺的重要解剖基础。'},
{id:'neurons',system:'神经系统',name:'神经元与突触',latin:'Neuron / Synapsis',summary:'神经元由胞体、树突及轴突等部分组成，神经系统的信息传递涉及电活动与化学突触。',key:'突触前膜释放递质，可与突触后膜受体作用，调节信息传递。',clinical:'不同神经递质和传导通路与多种神经系统疾病相关。'},
{id:'heart-chambers',system:'循环系统',name:'心脏四腔与血流方向',latin:'Atrium et ventriculus',summary:'心脏有左右心房和左右心室。体静脉血入右心房，经右心室至肺；肺静脉血入左心房，经左心室至主动脉。',key:'房室瓣分别是右侧三尖瓣与左侧二尖瓣；动脉出口处还有肺动脉瓣和主动脉瓣。',clinical:'明确血流方向有助于理解瓣膜功能及先天性心脏结构异常。'},
{id:'heart-valves',system:'循环系统',name:'心脏瓣膜',latin:'Valvae cordis',summary:'心脏四组瓣膜有助于维持单向血流：三尖瓣、肺动脉瓣、二尖瓣、主动脉瓣。',key:'瓣膜启闭与两侧压力差变化密切相关，并非主动收缩。',clinical:'瓣膜狭窄或关闭不全会改变心内血流动力学。'},
{id:'coronaries',system:'循环系统',name:'冠状动脉起源',latin:'Arteriae coronariae',summary:'左、右冠状动脉分别起于升主动脉根部的主动脉窦，主要为心肌提供血液供应。',key:'左冠状动脉通常分前室间支与旋支等主要分支。',clinical:'冠状动脉供血不足可引起心肌缺血。'},
{id:'pulmonary-circ',system:'循环系统',name:'肺循环和体循环',latin:'Circulatio pulmonalis et systemica',summary:'肺循环由右心室开始，经肺动脉、肺毛细血管、肺静脉回到左心房；体循环由左心室经主动脉开始。',key:'肺动脉流动的通常是静脉血，肺静脉流动的通常是动脉血。',clinical:'两种循环共同维持氧运输、营养分配与代谢产物转运。'},
{id:'aorta',system:'循环系统',name:'主动脉及其主要分段',latin:'Aorta',summary:'主动脉分升主动脉、主动脉弓和降主动脉（胸主动脉、腹主动脉），是体循环的重要主干动脉。',key:'主动脉弓一般发出头臂干、左颈总动脉和左锁骨下动脉。',clinical:'主动脉分段及主要分支是影像解剖的重要识别内容。'},
{id:'lung-lobes',system:'呼吸系统',name:'肺叶与肺裂',latin:'Lobi pulmonis',summary:'右肺常分上、中、下三叶；左肺分上、下两叶。右肺具水平裂与斜裂，左肺主要有斜裂。',key:'左肺心切迹及舌段具有重要的局部解剖特点。',clinical:'肺裂与肺叶位置有助于胸部影像解读和病变定位。'},
{id:'bronchi',system:'呼吸系统',name:'气管、主支气管与肺门',latin:'Trachea et bronchi principales',summary:'气管在胸内分为左右主支气管，随后逐渐分支形成叶支气管、段支气管和更小的气道。',key:'成人右主支气管通常较粗、短、陡直。',clinical:'异物误吸更容易进入右主支气管，这是经典临床解剖知识。'},
{id:'alveoli',system:'呼吸系统',name:'肺泡与气体交换',latin:'Alveoli pulmonis',summary:'肺泡为气体交换的主要场所，肺泡壁和毛细血管壁共同构成呼吸膜的重要组成部分。',key:'氧和二氧化碳主要沿分压梯度扩散。',clinical:'呼吸膜损伤或肺泡通气障碍可影响氧合。'},
{id:'pleura',system:'呼吸系统',name:'胸膜与胸膜腔',latin:'Pleura',summary:'壁胸膜衬覆胸壁内面，脏胸膜覆盖肺表面，两者之间为潜在的胸膜腔。',key:'正常胸膜腔内有少量液体，有利于肺的滑动。',clinical:'胸腔积液与气胸涉及胸膜腔异常改变。'},
{id:'diaphragm',system:'呼吸系统',name:'膈肌与呼吸运动',latin:'Diaphragma',summary:'膈是重要的吸气肌，其收缩使膈穹隆下降，胸腔容积增加。',key:'膈肌主要接受膈神经支配，膈神经主要来源于C3—C5脊髓节段。',clinical:'膈肌功能障碍可影响通气。'},
{id:'stomach',system:'消化系统',name:'胃的结构与分区',latin:'Gaster',summary:'胃通常分为贲门部、胃底、胃体和幽门部，位于上腹部，在食物储存和初步消化中发挥作用。',key:'幽门处通过幽门括约肌调节胃内容物进入十二指肠。',clinical:'胃及其毗邻关系对腹部影像和外科解剖具有基础意义。'},
{id:'liver',system:'消化系统',name:'肝脏与门静脉',latin:'Hepar et vena portae',summary:'肝脏为重要的代谢与合成器官；肝门静脉主要收集胃肠道、脾和胰等区域的静脉血入肝。',key:'肝脏有肝动脉和肝门静脉的双重血供来源。',clinical:'肝段和门静脉分支关系是肝脏局部解剖的重要内容。'},
{id:'small-intestine',system:'消化系统',name:'小肠的组成',latin:'Intestinum tenue',summary:'小肠通常分十二指肠、空肠和回肠，是多种营养物质消化与吸收的主要部位。',key:'十二指肠大乳头一般是胆总管和主胰管汇入处。',clinical:'小肠不同分段及其血供与临床病变定位相关。'},
{id:'pancreas',system:'消化系统',name:'胰腺的解剖位置',latin:'Pancreas',summary:'胰位于上腹部后方，分胰头、胰颈、胰体及胰尾，兼具外分泌与内分泌功能。',key:'胰头位于十二指肠C形弯内，胰尾向脾门方向延伸。',clinical:'胰与胆管、十二指肠和脾血管关系密切。'},
{id:'digestive-path',system:'消化系统',name:'消化道的连续路径',latin:'Tractus digestorius',summary:'消化道由口腔、咽、食管、胃、小肠、大肠至肛管构成连续管道，与肝、胆、胰等附属器官共同参与消化。',key:'肝脏、胆囊和胰腺虽与食物消化密切相关，却不属于食物直接经过的消化道腔道。',clinical:'了解各段之间的关系有助于区分不同部位的消化系统病变。'}
];
/* Built-in original educational questions. Each answer is a string (cloze) or index (multiple choice). */
const rawQuiz=[
['运动系统','基础','cn','正常成年人通常有多少块骨？',['186块','206块','226块','246块'],1,'成年人通常有206块骨，存在少量个体差异。'],
['运动系统','基础','cn','下列哪一结构属于滑膜关节的基本构成？',['关节腔','骨髓腔','肾小球','牙釉质'],0,'滑膜关节的基本结构包括关节面、关节囊和关节腔。'],
['运动系统','进阶','cn','前交叉韧带的主要作用之一是：',['限制胫骨相对股骨过度前移','促进胫骨外翻','直接分泌滑液','生成红细胞'],0,'前交叉韧带重要作用之一是限制胫骨相对股骨的过度前移。'],
['运动系统','基础','cn','成人正常腰椎通常有多少块？',['4块','5块','7块','12块'],1,'成人通常有5块腰椎。'],
['运动系统','进阶','label','膝关节中分散载荷的纤维软骨结构是？',['半月板','胼胝体','脑桥','肺泡'],0,'膝关节的内外侧半月板为纤维软骨结构，有助于分散载荷。','knee'],
['运动系统','基础','en','The anatomical term "femur" refers to the:',['Thigh bone','Collarbone','Shinbone','Breastbone'],0,'Femur 指股骨（大腿骨）。'],
['运动系统','基础','cloze','连接肌肉与骨骼、传递肌肉收缩张力的结缔组织通常称为____。',null,'肌腱|tendon','肌腱是将肌肉收缩力量传递至骨骼的重要组织。'],
['神经系统','基础','cn','连接左右大脑半球的主要连合纤维束是：',['胼胝体','脑干','丘脑','垂体'],0,'胼胝体是连接两侧大脑半球的主要连合纤维束。'],
['神经系统','基础','cn','脑干由以下哪三部分构成？',['中脑、脑桥、延髓','大脑、小脑、间脑','额叶、顶叶、枕叶','颈髓、胸髓、腰髓'],0,'脑干由中脑、脑桥和延髓三部分构成。'],
['神经系统','基础','cn','脑的哪个区域主要与视觉信息处理有关？',['枕叶','额叶','小脑','延髓'],0,'枕叶皮质参与视觉信息处理，但复杂视觉功能依赖多个脑区协作。'],
['神经系统','进阶','cn','脊髓被膜由外向内的正确顺序是：',['硬脊膜—蛛网膜—软脊膜','软脊膜—硬脊膜—蛛网膜','蛛网膜—软脊膜—硬脊膜','软脊膜—蛛网膜—硬脊膜'],0,'脊髓被膜由外向内为硬脊膜、蛛网膜、软脊膜。'],
['神经系统','进阶','label','在颅脑正中矢状面中，脑后下方与平衡协调密切相关的结构是：',['小脑','左心房','肝脏','股骨'],0,'小脑位于脑的后下方，与平衡、姿势与运动协调密切相关。','brain'],
['神经系统','基础','en','Which structure connects the two cerebral hemispheres?',['Corpus callosum','Cerebellar tonsil','Optic chiasm only','Medulla'],0,'Corpus callosum 的中文名称为胼胝体。'],
['神经系统','进阶','cloze','中脑、脑桥和延髓合称为____。',null,'脑干|brainstem|brain stem','脑干是脑与脊髓之间的重要连接。'],
['循环系统','基础','cn','人体心脏有多少个心腔？',['2个','3个','4个','5个'],2,'心脏由左右心房和左右心室构成，共四个心腔。'],
['循环系统','基础','cn','与左心室出口直接相连的大动脉是：',['主动脉','肺动脉干','上腔静脉','肺静脉'],0,'左心室通过主动脉瓣与升主动脉相连。'],
['循环系统','进阶','cn','三尖瓣位于：',['右心房与右心室之间','左心房与左心室之间','右心室与肺动脉之间','左心室与主动脉之间'],0,'右房室瓣即三尖瓣。左房室瓣为二尖瓣。'],
['循环系统','进阶','cn','下列哪条血管通常流动动脉血？',['肺静脉','肺动脉','上腔静脉','下腔静脉'],0,'肺静脉将肺氧合后的血液送回左心房。'],
['循环系统','基础','en','The vessel leaving the left ventricle is the:',['Aorta','Pulmonary artery','Superior vena cava','Coronary sinus'],0,'Aorta 为主动脉。'],
['循环系统','基础','label','心脏中，负责将血液泵入体循环的心腔是：',['左心室','右心房','右心室','左心房'],0,'左心室收缩推动血液经主动脉进入体循环。','heart'],
['循环系统','进阶','cloze','右心房与右心室之间的房室瓣称为____。',null,'三尖瓣|右房室瓣|tricuspid valve','右房室瓣又称三尖瓣。'],
['呼吸系统','基础','cn','正常右肺通常分为几叶？',['1叶','2叶','3叶','4叶'],2,'右肺通常有上、中、下三叶。'],
['呼吸系统','基础','cn','正常左肺通常分为几叶？',['1叶','2叶','3叶','4叶'],1,'左肺通常分为上、下两叶。'],
['呼吸系统','进阶','cn','成人主支气管中，通常更粗、短、陡直的是：',['右主支气管','左主支气管','两者完全相同','无主支气管'],0,'右主支气管通常更粗、短、陡直，因此误吸异物较容易进入右侧。'],
['呼吸系统','基础','cn','肺内气体交换主要发生在：',['肺泡','气管','主支气管','喉软骨'],0,'肺泡是气体交换的主要场所。'],
['呼吸系统','基础','en','How many lobes does the right lung normally have?',['Two','Three','Four','One'],1,'Right lung 通常由上、中、下三叶组成。'],
['呼吸系统','进阶','label','在呼吸系统中，气管分叉后进入左右肺的结构是：',['主支气管','肺静脉瓣','食管括约肌','冠状动脉'],0,'气管在气管杈处分为左右主支气管。','lungs'],
['呼吸系统','基础','cloze','参与安静吸气的主要呼吸肌是____。',null,'膈肌|膈|diaphragm','膈肌收缩使膈顶下降、胸腔容积增大，是主要吸气肌。'],
['消化系统','基础','cn','以下哪一段不属于小肠？',['十二指肠','空肠','回肠','乙状结肠'],3,'小肠由十二指肠、空肠和回肠组成。乙状结肠属于大肠。'],
['消化系统','基础','cn','胰头主要位于哪一结构形成的C形弯内？',['十二指肠','乙状结肠','盲肠','胃底'],0,'胰头与十二指肠C形弯的毗邻是经典局部解剖知识。'],
['消化系统','进阶','cn','肝脏血供的正确描述是：',['肝动脉与肝门静脉双重血供','只有肝静脉输入血液','只有主动脉直接供血','没有动脉血供应'],0,'肝脏主要通过肝动脉和肝门静脉获得双重血供。'],
['消化系统','基础','cn','以下哪种器官不属于食物直接经过的消化道？',['食管','胃','肝脏','空肠'],2,'肝脏是消化系统的重要附属器官，食物不直接经过肝脏腔道。'],
['消化系统','进阶','en','The "duodenum" is the first part of the:',['Small intestine','Large intestine','Stomach','Esophagus'],0,'Duodenum 即十二指肠，是小肠第一段。'],
['消化系统','基础','cloze','胃内容物经过幽门进入的下一段消化道是____。',null,'十二指肠|duodenum','胃的幽门连接十二指肠。']
];
const builtInBank=rawQuiz.map((r,i)=>({id:`core-${String(i+1).padStart(3,'0')}`,system:r[0],difficulty:r[1],type:r[2],q:r[3],options:r[4],answer:r[5],explain:r[6],specimen:r[7]||null}));
const chapterAliases={'Head':'头部','Neck':'颈部','Thorax':'胸部','Abdomen':'腹部','Pelvis':'盆部与会阴','Spine':'脊柱区','Upper Limb':'上肢','Lower Limb':'下肢'};
const regional=window.REGIONAL_DATA;
topics.push(...regional.knowledge.map((k,i)=>({id:'regional-'+i,system:'局解·'+k.chapter,name:k.sub+' · '+k.q,latin:'REGIONAL ANATOMY',summary:k.q,key:k.a,clinical:'',source:'局解小帮手',chapter:k.chapter})));
builtInBank.push(...regional.questions.map(q=>({id:'regional-q-'+q.id,system:'局解·'+(chapterAliases[q.chapter]||q.chapter),difficulty:'基础',type:q.lang==='en'?'en':'cn',q:q.q,options:q.options.map(o=>o.replace(/^[A-D]\.\s*/,'')),answer:q.answer,explain:q.explanation,source:'局解小帮手'})));
const getBank=()=>[...builtInBank,...state.imported];
let page='home';
let learnSelected='heart-chambers', learnFilter='all', learnSearchText='';
let quizSession=null,quizCursor=0,quizAnswered=false,quizSelected=null,quizAnswers=[];
let aiMode='professional',aiService={chat:false,vision:false},aiUpload=null,recognition=null;
let toastTimer=null,sessionStart=Date.now(),timerAcc=0;
function toast(message){const t=$('#toast');t.textContent=message;t.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>t.classList.remove('show'),4200)}
let wasVisible=document.visibilityState!=='hidden';
function updateSessionTime(){const now=Date.now();if(wasVisible)timerAcc+=Math.max(0,Math.min(now-sessionStart,60000));const seconds=Math.floor(timerAcc/1000);if(seconds){state.totalSecs+=seconds;timerAcc-=seconds*1000;save()}sessionStart=now;wasVisible=document.visibilityState!=='hidden'}
setInterval(updateSessionTime,20000);document.addEventListener('visibilitychange',()=>{updateSessionTime();persistQuiz()});window.addEventListener('pagehide',()=>{updateSessionTime();persistQuiz()});
function persistQuiz(){if(!quizSession)return;state.draft={ids:quizSession.questions.map(q=>q.id),startedAt:quizSession.startedAt,cursor:quizCursor,answers:quizAnswers,selected:quizSelected,answered:quizAnswered,text:$('#clozeAnswer')?.value||''};save()}
function navigate(to,{replace=false}={}){
 to=String(to||'home').replace(/^#/,'').split('?')[0];if(!$('#page-'+to))to='home';
 updateSessionTime();page=to;
 $$('.page').forEach(p=>p.classList.toggle('active-page',p.dataset.page===to));
 $$('[data-route]').forEach(el=>el.classList.toggle('active',el.dataset.route===to));
 $('#navLinks').classList.remove('open');$('#mobileMenu').setAttribute('aria-expanded','false');
 if(location.hash!=='#'+to){if(replace)history.replaceState(null,'','#'+to);else history.pushState(null,'','#'+to);}
 window.scrollTo({top:0,behavior:'instant'});window.dispatchEvent(new CustomEvent('platform:navigate',{detail:{page:to}}));
 if(!state.visited.includes(to))state.visited.push(to);save();
 if(to==='atlas')renderAtlas();if(to==='learn')renderLearn();if(to==='dashboard')renderDashboard();if(to==='quiz'&&!quizSession)renderQuizSetup();
 document.title=`${({regional:'局部解剖专题',home:'智触人体·医脉相承',atlas:'三维模型馆',assistant:'AI 解剖助教',learn:'知识图谱',quiz:'在线测评',dashboard:'学习档案',resources:'资源中心',about:'关于我们'})[to]} | 智触人体`;
}
function openModal(id){const el=$('#'+id);el.classList.add('open');document.body.style.overflow='hidden';const close=el.querySelector('.close');if(close)close.focus()}
function closeModal(id){$('#'+id).classList.remove('open');if(!$$('.modal-backdrop.open').length)document.body.style.overflow=''}
function download(name,content,mime='text/plain;charset=utf-8'){let url=URL.createObjectURL(new Blob([content],{type:mime}));const a=document.createElement('a');a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000)}
const galleryModels=[
 {id:'heart',serial:'01',title:'心脏',en:'HUMAN HEART',system:'循环系统',intro:'沿着冠状血管与心腔表面，观察心脏的立体形态。'},
 {id:'skeleton',serial:'02',title:'全身骨骼',en:'HUMAN SKELETON',system:'运动系统',intro:'从颅骨、脊柱到四肢，探索骨骼之间的空间关系。'},
 {id:'kidneys',serial:'03',title:'双肾',en:'PAIRED KIDNEYS',system:'泌尿系统',intro:'保留左右肾的空间关系，转动观察肾脏外形。'},
 {id:'brain',serial:'04',title:'脑',en:'HUMAN BRAIN',system:'神经系统',intro:'分组观察大脑皮质、小脑与脑干，探索脑表面的沟回。'},
 {id:'spleen',serial:'05',title:'脾脏',en:'HUMAN SPLEEN',system:'淋巴系统',intro:'在冷暖光影中观察脾脏的外形与表面轮廓。'},
 {id:'muscles',serial:'06',title:'肱二头肌',en:'BICEPS BRACHII',system:'运动系统',intro:'分别选取右肱二头肌长头与短头，观察两束肌肉的关系。'},
 {id:'knee',serial:'07',title:'膝部骨性结构',en:'KNEE BONES',system:'运动系统',intro:'聚焦股骨下端、胫腓骨上端与髌骨；此模型不含韧带及半月板。'}
,
{"id": "lungs", "title": "肺叶", "latin": "Pulmones", "en": "LUNG LOBES", "system": "呼吸系统", "intro": "逐叶选取左右肺的五个肺叶，观察肺裂与空间轮廓；不含支气管树和血管。", "serial": "08"},
{"id": "liver", "title": "肝脏", "latin": "Hepar", "en": "HUMAN LIVER", "system": "消化系统", "intro": "转动观察肝脏表面轮廓；此模型不含肝内血管、胆管或分段标注。", "serial": "09"},
{"id": "stomach", "title": "胃", "latin": "Gaster", "en": "HUMAN STOMACH", "system": "消化系统", "intro": "观察胃的外形、弯曲及两端轮廓；此模型为外表面，不含胃壁分层。", "serial": "10"},
{"id": "shoulder", "title": "肩部骨性结构", "latin": "Ossa cinguli pectoralis", "en": "SHOULDER BONES", "system": "运动系统", "intro": "分别选取右锁骨、肩胛骨与肱骨，理解肩部骨性关系；不含关节囊、软骨与肩袖。", "serial": "11"},
{"id": "foot", "title": "足底长韧带与邻近骨", "latin": "Ligamentum plantare longum", "en": "PLANTAR LIGAMENT", "system": "运动系统", "intro": "以双色区分右足底长韧带和跟骨、骰骨、第二至五跖骨；仅展示所选局部结构。", "serial": "12"}
];
function specCard(s){return `<a class="card card-hover collection-card" href="studio.html?model=${s.id}"><div class="collection-art"><span class="spec-index">COLLECTION / ${s.serial}</span><img src="assets/models/${s.id}-poster.png" alt="${s.title}三维模型渲染" loading="lazy" width="1000" height="1100"><span class="collection-arrow">↗</span></div><div class="spec-text"><span class="eyebrow">${s.en}</span><h3>${s.title}</h3><p>${s.intro}</p><div class="spec-meta"><span>3D · 自由观察</span><span>进入独立展厅 ↗</span></div></div></a>`}
function renderAtlas(){const term=$('#atlasSearch').value.trim().toLowerCase(),filter=$('#atlasFilters .chip.active')?.dataset.filter||'all';const list=galleryModels.filter(s=>(filter==='all'||s.system===filter)&&(s.title+s.en+s.system+s.intro).toLowerCase().includes(term));$('#atlasGrid').innerHTML=list.map(specCard).join('')||'<div class="card" style="padding:40px;grid-column:1/-1">没有匹配的模型，请尝试「心脏」或「骨骼」。</div>';$('#atlasCount').textContent=`${list.length} / ${galleryModels.length} 件模型`}
function renderHomeSpecs(){$('#homeSpecimens').innerHTML=galleryModels.map(specCard).join('')}
function openSpec(id){if(galleryModels.some(s=>s.id===id))location.href='studio.html?model='+encodeURIComponent(id);else navigate('atlas')}
function specNotes(s){return `智触人体 · 医脉相承\n数字解剖结构学习笔记（教学示意）\n\n${s.title} / ${s.en}\n所属系统：${s.system}\n\n一、结构概览\n${s.intro}\n\n二、关键结构\n${s.features.map((n,i)=>i+1+'. '+n).join('\n')}\n\n三、临床关联\n${s.clinical}\n\n温馨提示：此笔记为基础解剖学习参考，不能替代真实标本、专业教材或临床诊疗。`}
/* Structured knowledge / mastery */
function renderLearn(){const byGroup=[...new Set(topics.map(t=>t.system))];let shown=0;$('#learnTree').innerHTML=byGroup.map(g=>{const all=topics.filter(t=>t.system===g);const items=all.filter(t=>[t.name,t.summary,t.key,t.latin].join(' ').toLowerCase().includes(learnSearchText)&& (learnFilter==='all'||(learnFilter==='mastered')===state.mastered.includes(t.id)));shown+=items.length;if(!items.length)return '';return `<div class="learn-group"><button class="learn-group-header" aria-label="${g}，共${items.length}个知识点"><strong>${g}</strong><span class="count">${all.filter(t=>state.mastered.includes(t.id)).length}/${all.length} 已掌握　⌄</span></button><div class="learn-points">${items.map(t=>`<button class="learn-item ${state.mastered.includes(t.id)?'mastered':''} ${learnSelected===t.id?'current':''}" data-learn="${t.id}"><span class="check">${state.mastered.includes(t.id)?'✓':''}</span><span>${esc(t.name)}</span></button>`).join('')}</div></div>`}).join('')||'<p class="muted small">没有匹配的知识点。</p>';$('#learnProgressText').textContent=`已掌握 ${state.mastered.length} / ${topics.length} 项 · 当前筛选 ${shown} 项`;
 const t=topics.find(x=>x.id===learnSelected)||topics[0];const done=state.mastered.includes(t.id);
 $('#learnMain').innerHTML=`<span class="eyebrow">${esc(t.system)} / LEARNING NODE</span><h2>${esc(t.name)}</h2><div class="latin">${esc(t.latin)}</div><h3 class="serif" style="font-size:20px;margin-top:24px">结构概述</h3><p>${esc(t.summary)}</p><div class="learn-highlight"><strong class="accent">核心要点</strong><br>${esc(t.key)}</div>${t.clinical?`<h3 class="serif" style="font-size:20px">临床联系</h3><p>${esc(t.clinical)}</p>`:`<p class="mini muted">来源：局解小帮手 · ${esc(t.chapter)} · 保留导入资料原文</p>`}<div class="flex gap-sm" style="margin-top:28px;flex-wrap:wrap"><button class="btn ${done?'btn-ghost':'btn-gold'}" id="markMastered">${done?'✓ 已掌握 · 点击取消':'○ 标记为已掌握'}</button><button class="btn btn-sm" id="practiceTopic">去做对应系统练习 ↗</button></div>`;
 $('#markMastered').onclick=()=>{const i=state.mastered.indexOf(t.id);i<0?state.mastered.push(t.id):state.mastered.splice(i,1);save();renderLearn();toast(i<0?'已记录知识掌握进度':'已调整为未掌握')};$('#practiceTopic').onclick=()=>{navigate('quiz');$('#quizTopic').value=t.system;renderQuizSetup()};
 $$('#learnTree .learn-group-header').forEach(x=>x.addEventListener('click',()=>{const el=x.nextElementSibling;el.classList.toggle('hide');x.querySelector('.count').textContent=x.querySelector('.count').textContent.replace(/[⌄⌃]/g,el.classList.contains('hide')?'⌃':'⌄')}));
}
/* Quiz engine */
function renderQuizSetup(){if(quizSession)return;$('#quizSetup').classList.remove('hide');$('#quizScreen').classList.add('hide');$('#quizSummary').classList.add('hide')}
function startQuiz(){
 const sys=$('#quizTopic').value,dif=$('#quizDifficulty').value,typ=$('#quizType').value,mode=$('#quizMode').value;
 let questions=getBank().filter(q=>(sys==='all'||q.system===sys)&&(dif==='all'||q.difficulty===dif)&&(typ==='all'||q.type===typ)&&(mode==='all'||(mode==='wrong'?state.wrong:state.favorites).includes(q.id)));
 if(!questions.length){toast('当前筛选条件下没有题目，请调整题型、知识系统或训练模式。');return}
 questions=questions.sort(()=>Math.random()-.5).slice(0,+$('#quizCount').value);
 quizSession={questions,startedAt:Date.now()};quizCursor=0;quizAnswers=[];quizSelected=null;quizAnswered=false;
 $('#quizSetup').classList.add('hide');$('#quizSummary').classList.add('hide');$('#quizScreen').classList.remove('hide');renderQuestion();
}
function renderQuestion(){if(!quizSession)return;const q=quizSession.questions[quizCursor];quizAnswered=false;quizSelected=null;$('#quizNum').textContent=`QUESTION ${String(quizCursor+1).padStart(2,'0')} / ${String(quizSession.questions.length).padStart(2,'0')}`;$('#quizScoreLive').textContent=`当前正确 ${quizAnswers.filter(x=>x.ok).length}`;$('#quizProgressFill').style.width=`${quizCursor/quizSession.questions.length*100}%`;$('#quizBadge').textContent=`${q.system} · ${q.difficulty} · ${({cn:'中文自测',en:'ENGLISH',cloze:'填空题',label:'结构辨认'})[q.type]}`;$('#quizQuestion').textContent=q.q;$('#quizFeedback').classList.add('hide');$('#quizNext').classList.add('hide');$('#quizSubmit').classList.remove('hide');$('#quizSubmit').disabled=false;
 const fav=state.favorites.includes(q.id);$('#quizFavBtn').textContent=fav?'★ 已收藏':'☆ 收藏此题';
 const choices=$('#quizChoices');if(q.type==='cloze'){choices.innerHTML=`<div class="field"><label>你的回答</label><input class="input" id="clozeAnswer" placeholder="请输入结构或专业术语……" maxlength="180" autocomplete="off"></div>`;$('#clozeAnswer').focus();persistQuiz();return}
 let html='';if(q.type==='label')html+='<p class="mini muted">STRUCTURE IDENTIFICATION · 根据文字描述辨认结构</p>';
 html+=(q.options||[]).map((x,i)=>`<button class="quiz-option" data-option="${i}"><span class="opt-letter">${String.fromCharCode(65+i)}</span><span>${esc(x)}</span></button>`).join('');choices.innerHTML=html;persistQuiz();
}
function normalized(s){return String(s).trim().toLowerCase().replace(/\s+/g,'').replace(/[，,。.!！?？]/g,'')}
function submitQuiz(){if(!quizSession||quizAnswered)return;const q=quizSession.questions[quizCursor];let ans;if(q.type==='cloze'){ans=$('#clozeAnswer').value.trim();if(!ans){toast('请先填写你的答案');return}}else{if(quizSelected===null){toast('请先选择一个选项');return}ans=quizSelected}
 const ok=q.type==='cloze'?String(q.answer).split('|').map(normalized).includes(normalized(ans)):Number(ans)===Number(q.answer);
 quizAnswered=true;quizAnswers.push({id:q.id,system:q.system,question:q.q,ok,userAnswer:q.type==='cloze'?ans:q.options[ans],correct:q.type==='cloze'?String(q.answer).split('|')[0]:q.options[q.answer],explain:q.explain});
 const wrongIdx=state.wrong.indexOf(q.id);if(!ok&&wrongIdx<0)state.wrong.push(q.id);if(ok&&wrongIdx>=0)state.wrong.splice(wrongIdx,1);save();
 if(q.type!=='cloze')$$('#quizChoices .quiz-option').forEach((btn,i)=>{btn.disabled=true;if(i===Number(q.answer))btn.classList.add('correct');else if(i===Number(ans)&&!ok)btn.classList.add('incorrect')});else $('#clozeAnswer').disabled=true;
 const feed=$('#quizFeedback');feed.classList.remove('hide');feed.style.borderColor=ok?'#537253':'#99685d';feed.innerHTML=`<strong style="color:${ok?'#a9cbaa':'#dfa39a'}">${ok?'✓ 回答正确':'✕ 这道题需要再巩固'}</strong><div>正确答案：${esc(q.type==='cloze'?String(q.answer).split('|')[0]:q.options[q.answer])}</div><div class="muted">${esc(q.explain)}</div>`;
 $('#quizSubmit').classList.add('hide');$('#quizNext').classList.remove('hide');$('#quizNext').textContent=quizCursor===quizSession.questions.length-1?'查看成绩 ↗':'下一题 ↗';persistQuiz();
}
function nextQuiz(){if(!quizSession||!quizAnswered)return;quizCursor++;if(quizCursor>=quizSession.questions.length){finishQuiz();return}renderQuestion()}
function finishQuiz(){if(!quizSession)return;const total=quizAnswers.length,right=quizAnswers.filter(x=>x.ok).length,pct=Math.round(right/Math.max(1,total)*100);state.attempts.unshift({date:new Date().toISOString(),total,correct:right,pct,secs:Math.round((Date.now()-quizSession.startedAt)/1000),systems:[...new Set(quizAnswers.map(x=>x.system))]});state.attempts=state.attempts.slice(0,100);state.draft=null;save();quizSession=null;$('#quizScreen').classList.add('hide');$('#quizSummary').classList.remove('hide');$('#quizCircle').style.setProperty('--score',`${pct}%`);$('#quizFinalScore').textContent=`${pct}%`;$('#quizFinalMeta').textContent=`本次共完成 ${total} 道题 · 答对 ${right} 道 · 答错 ${total-right} 道；错题已归入个人错题本。`;
 $('#quizReview').innerHTML=quizAnswers.map((a,i)=>`<div class="review-entry"><strong><span style="color:${a.ok?'#9dbb9d':'#dd968f'}">${a.ok?'✓':'✕'}</span> ${i+1}. ${esc(a.question)}</strong><p>你的回答：${esc(a.userAnswer)}　/　正确答案：<span class="accent">${esc(a.correct)}</span></p><p>${esc(a.explain)}</p></div>`).join('');
}
function exitQuiz(){persistQuiz();quizSession=null;quizAnswers=[];renderQuizSetup();window.dispatchEvent(new Event('bank-imported'));toast('当前练习已自动保存，可以稍后继续。')}
function toggleQuizFav(){if(!quizSession)return;const id=quizSession.questions[quizCursor].id;const i=state.favorites.indexOf(id);i<0?state.favorites.push(id):state.favorites.splice(i,1);save();$('#quizFavBtn').textContent=i<0?'★ 已收藏':'☆ 收藏此题';toast(i<0?'题目已加入收藏':'已取消题目收藏')}
const quizTemplate=`# 智触人体 自定义题库格式（UTF-8）\n# 每道题以 ### 题目: 开始，四个选项后写 答案: A/B/C/D。\n# 可选：系统、难度、类型、解析。题型默认为中文选择题。\n\n### 题目: 肺泡的主要作用是什么？\n系统: 呼吸系统\n难度: 基础\n类型: cn\nA. 气体交换\nB. 产生胆汁\nC. 泵血\nD. 连接骨骼\n答案: A\n解析: 肺泡是氧与二氧化碳交换的主要场所。\n\n### 题目: Which organ pumps blood?\n系统: 循环系统\n难度: 基础\n类型: en\nA. Lung\nB. Heart\nC. Stomach\nD. Kidney\n答案: B\n解析: Heart = 心脏。\n`;
function parseQuestionTxt(source){const chunks=source.split(/(?=^###\s*题目\s*[:：])/gm).filter(x=>/^###\s*题目\s*[:：]/m.test(x));const allowed=new Set(['运动系统','神经系统','循环系统','呼吸系统','消化系统']);const bank=[];for(let chunk of chunks){const field=(key)=>{const m=chunk.match(new RegExp('^'+key+'\\s*[:：]\\s*(.+)$','mi'));return m?m[1].trim():''};const q=chunk.match(/^###\s*题目\s*[:：]\s*(.+)/m)?.[1]?.trim();const letter={};for(let m of chunk.matchAll(/^([A-D])[\.．、:]\s*(.+)$/gm))letter[m[1]]=m[2].trim();const answer=field('答案').toUpperCase(),system=field('系统'),type=field('类型'),dif=field('难度');if(!q||Object.keys(letter).length!==4||!['A','B','C','D'].includes(answer)||q.length>400)continue;bank.push({id:`custom-${Date.now()}-${bank.length}`,q,system:(allowed.has(system)||system.startsWith('局解·'))?system:'自定义题库',difficulty:['基础','进阶','挑战'].includes(dif)?dif:'基础',type:['en','cn'].includes(type)?type:(/[a-zA-Z]{4}/.test(q)?'en':'cn'),options:['A','B','C','D'].map(k=>letter[k]),answer:answer.charCodeAt(0)-65,explain:field('解析')||'自定义导入题目，未提供解析。',specimen:null})}return bank}
async function importQuizFile(file){if(!file)return;if(file.size>1024*1024){toast('题库文件不应超过 1 MB');return}const text=await file.text();const qs=parseQuestionTxt(text);if(!qs.length){toast('未检测到有效的四选一题目，请先下载格式模板。');return}
 const fingerprint=q=>JSON.stringify([q.q,q.options,q.answer,q.type]);const seen=new Set(getBank().map(fingerprint));const added=qs.filter(q=>{const k=fingerprint(q);if(seen.has(k))return false;seen.add(k);return true});
 const oldImported=state.imported.slice(),oldImports=state.imports.slice();state.imported.push(...added);state.imports.unshift({name:file.name,count:added.length,duplicates:qs.length-added.length,at:new Date().toISOString()});
 if(!save()){state.imported=oldImported;state.imports=oldImports;toast('浏览器未能保存题库（空间不足或存储被禁用）。请先导出备份。');return}window.dispatchEvent(new Event('bank-imported'));toast(`已保存 ${added.length} 道题，跳过 ${qs.length-added.length} 道重复题；重新进入仍可使用。`);}
/* Personal analytics — local, factual only */
function renderDashboard(){const attempts=state.attempts,completed=attempts.reduce((n,a)=>n+a.total,0),correct=attempts.reduce((n,a)=>n+a.correct,0),accuracy=completed?Math.round(correct/completed*100):0;const vals=[['累计练习',completed,'道已作答题目'],['历史正确率',accuracy+'%','按已完成测评计算'],['知识掌握',state.mastered.length+'/'+topics.length,'项标记已掌握'],['有效学习',formatTime(state.totalSecs),'本机记录的页面学习时长']];$('#dashGreeting').textContent=`${state.nickname||'探索者'}，欢迎回来`;$('#dashboardTop').innerHTML=vals.map(([label,v,sub])=>`<div class="card dash-stat"><div class="eyebrow">${label}</div><div class="value">${v}</div><p>${sub}</p></div>`).join('');$('#dashboardBars').innerHTML=[...new Set(topics.map(t=>t.system))].map(g=>{const all=topics.filter(t=>t.system===g),n=all.filter(t=>state.mastered.includes(t.id)).length,pct=Math.round(n/all.length*100);return `<div class="bar-row"><span>${g}</span><div class="progress-track"><div class="progress-fill" style="width:${pct}%"></div></div><span>${pct}%</span></div>`}).join('');const achievements=[['◈','初识人体','首次浏览知识或标本',state.visited.some(v=>['atlas','learn'].includes(v))],['✦','第一步','完成首次答题训练',attempts.length>=1],['✳','持续探索','累计完成三次测评',attempts.length>=3],['◉','知识建构者','掌握10个知识点',state.mastered.length>=10],['★','好奇心档案','收藏3道习题',state.favorites.length>=3],['◇','学有所成','单次测评正确率达到90%',attempts.some(a=>a.pct>=90)]];$('#achievements').innerHTML=achievements.map(([ico,name,desc,done])=>`<div class="achievement ${done?'':'locked'}"><div class="achievement-symbol">${ico}</div><h4>${name}</h4><p>${desc}</p></div>`).join('');$('#quizHistory').innerHTML=attempts.length?attempts.slice(0,6).map(a=>`<div class="history-item"><span>${new Date(a.date).toLocaleDateString('zh-CN')} · ${a.total} 题</span><span class="accent">${a.pct}%</span></div>`).join(''):'<p class="small muted">还没有测评记录。完成第一次练习后，这里将自动生成历史数据。</p>';
 let g=['运动系统','神经系统','循环系统','呼吸系统','消化系统'].map(s=>({s,n:topics.filter(t=>t.system===s&&!state.mastered.includes(t.id)).length})).sort((a,b)=>b.n-a.n)[0];$('#studyAdvice').textContent=attempts.length?`建议先复习「${g?.s||'运动系统'}」中尚未标记掌握的内容，再通过「我的错题」进行针对性训练。目前错题本有 ${state.wrong.length} 道题、收藏题目 ${state.favorites.length} 道。知识掌握情况按手动标记统计，不直接等同于考试能力。`:'你还没有完整的测评数据。建议先在知识图谱中浏览核心结构、标记掌握情况，再完成一次10题混合练习。平台会根据实际数据呈现学习建议。';}
function formatTime(n){n=Math.max(0,Number(n)||0);return n<60?`${n}秒`:n<3600?`${Math.floor(n/60)}分`:`${(n/3600).toFixed(1)}小时`}
/* Chat — offline curated knowledge + optional verified server. */
const qaMap=[
 {re:/心脏|心腔|四腔|左心室|右心室|二尖瓣|三尖瓣/,ids:['heart-chambers','heart-valves']},
 {re:/胼胝体|半球|脑室/,ids:['brain-corpus']},
 {re:/脑干|延髓|脑桥|中脑/,ids:['brain-stem']},
 {re:/小脑|脑叶|枕叶|额叶|顶叶|颞叶/,ids:['brain-lobes']},
 {re:/肺叶|左肺|右肺|支气管树/,ids:['lung-lobes','bronchi']},
 {re:/肺泡|气体交换/,ids:['alveoli']},
 {re:/膝关节|半月板|交叉韧带/,ids:['knee-ligaments']},
 {re:/脊髓被膜|蛛网膜|硬脊膜|软脊膜/,ids:['spinal-meninges']},
 {re:/脊柱|椎骨|腰椎|胸椎/,ids:['vertebral-column']},
 {re:/骨骼|206块|骨头/,ids:['bone-206']},
 {re:/冠状动脉|冠心病/,ids:['coronaries']},
 {re:/膈肌|膈神经|吸气/,ids:['diaphragm']},
 {re:/肝脏|门静脉/,ids:['liver']},
 {re:/胃|幽门/,ids:['stomach']},
 {re:/小肠|十二指肠|空肠|回肠/,ids:['small-intestine']},
 {re:/胰腺|胰头|胰尾/,ids:['pancreas']},
];
function answerOffline(question,mode){const matches=qaMap.find(k=>k.re.test(question));if(!matches)return `当前为本地知识库模式。内置知识条目尚不能可靠回答这个问题，请尝试提问「心脏四腔」「胼胝体」「肺叶」「脊髓被膜」等核心主题。\n\n若需要开放式大模型问答，请在服务器配置 AI 接口并启动后端服务。`;const ts=matches.ids.map(id=>topics.find(t=>t.id===id)).filter(Boolean);if(mode==='popular')return `【通俗解释 · 本地知识库】\n${ts.map(t=>`${t.name}：${t.summary}`).join('\n\n')}\n\n理解重点：${ts.map(t=>t.key).join(' ')}\n\n提示：以上为基础教育知识梳理，如需个体医疗建议应咨询专业医师。`;
 return `【专业版 · 本地知识库】\n${ts.map(t=>`▍ ${t.name}（${t.latin}）\n${t.summary}\n核心：${t.key}\n临床关联：${t.clinical}`).join('\n\n')}\n\n知识来源说明：这里是平台内置的编写式教学条目，不是联网检索或实时大模型生成。`}
function addChat(role,text){state.chat.push({role,text:String(text).slice(0,4500),at:new Date().toISOString()});state.chat=state.chat.slice(-80);save();renderChat()}
function renderChat(){let entries=state.chat.length?state.chat:[{role:'assistant',text:'欢迎来到「智触 AI 解剖助教」。\n\n你可以询问心脏、脑干、肺叶、脊髓被膜、膝关节等基础解剖结构，也可以切换「专业版 / 通俗版」。当前若未连接后端，回答来自有限的内置知识条目，而非实时 AI 推理。',at:new Date().toISOString()}];$('#chatMessages').innerHTML=entries.map(m=>`<div class="chat-msg ${m.role==='user'?'user':''}"><div class="chat-avatar">${m.role==='user'?'我':'✳'}</div><div><div class="chat-bubble">${esc(m.text)}</div><div class="chat-meta">${m.role==='user'?'YOU':'ANATOMY COPILOT'} · ${new Date(m.at).toLocaleTimeString('zh-CN',{hour:'2-digit',minute:'2-digit'})}</div></div></div>`).join('');$('#chatMessages').scrollTop=$('#chatMessages').scrollHeight}
async function checkAiService(){try{const r=await fetch('/api/health',{signal:AbortSignal.timeout(2800)});if(!r.ok)return;const j=await r.json();aiService={chat:!!j.chat_ready,vision:!!j.vision_ready};}catch{}let s=aiService.chat?'AI 后端已连接':'本地知识模式已就绪';$('#aiStatus').textContent=s;$('#aiConnectionLabel').textContent=aiService.chat?'● 智能服务已连接':'● 本地知识库模式';if(!aiService.chat)$('#aiConnectionLabel').classList.remove('tag-green')}
async function sendChat(){const ta=$('#aiInput');let question=ta.value.trim();if(!question&&!aiUpload){toast('请先输入问题或上传图片');return}if(!question&&aiUpload)question='请识别这张解剖结构图片，并说明其解剖位置与功能。';if(question.length>1000){toast('问题最多1000字');return}const hasImage=!!aiUpload, imageData=aiUpload;addChat('user',question+(hasImage?'\n[附加了一张解剖图片]':''));ta.value='';aiUpload=null;$('#aiUploadThumb').classList.remove('show');$('#aiImageInput').value='';const btn=$('#aiSendBtn');btn.disabled=true;btn.textContent='正在处理…';let answer='';try{
 if(hasImage){if(!aiService.vision){answer='图片已在本机预览，但当前尚未配置视觉识别模型。为避免不可靠的识别结论，平台不会猜测图片中的结构。部署服务端并配置兼容图像输入的视觉模型后，才会执行实际识别。';}else{const r=await fetch('/api/ai/vision',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({image:imageData,question,mode:aiMode})});const j=await r.json();if(!r.ok)throw Error(j.error||`HTTP ${r.status}`);answer=j.answer||'服务端未返回识别结果。'}
 }else if(aiService.chat){const r=await fetch('/api/ai/chat',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({question,mode:aiMode})});const j=await r.json();if(!r.ok)throw Error(j.error||`HTTP ${r.status}`);answer=j.answer||'服务端未返回内容。';}else answer=answerOffline(question,aiMode);
 }catch(e){answer=`服务暂不可用：${e.message||'网络错误'}。\n\n暂时切换为本地知识模式：\n${answerOffline(question,aiMode)}`;}finally{btn.disabled=false;btn.textContent='发送问题 ↗'}addChat('assistant',answer);}
async function imagePicked(file){if(!file)return;if(!['image/jpeg','image/png','image/webp'].includes(file.type)){toast('请选择 JPEG / PNG / WEBP 图片');return}if(file.size>5*1024*1024){toast('单张图片最大 5 MB');return}aiUpload=await new Promise((res,rej)=>{const reader=new FileReader();reader.onload=()=>res(reader.result);reader.onerror=()=>rej(new Error('读取图片失败'));reader.readAsDataURL(file)});$('#aiUploadThumb').src=aiUpload;$('#aiUploadThumb').classList.add('show');toast(aiService.vision?'图片已载入，可发送至视觉识别服务':'图片已载入；当前未连接视觉模型，仅支持本地预览。')}
function startVoiceInput(){const R=window.SpeechRecognition||window.webkitSpeechRecognition;if(!R){toast('当前浏览器不支持语音识别，可使用 Chrome / Edge 的受支持版本或文字输入。');return}if(recognition){recognition.stop();recognition=null;return}const r=new R();recognition=r;r.lang='zh-CN';r.interimResults=false;r.continuous=false;r.onresult=e=>{$('#aiInput').value+=(($('#aiInput').value.trim())?' ':'')+e.results[0][0].transcript;toast('语音识别完成，请检查术语后发送')};r.onerror=e=>toast('语音输入失败：'+e.error);r.onend=()=>{recognition=null;$('#aiMicBtn').textContent='♩ 语音输入'};try{r.start();$('#aiMicBtn').textContent='■ 停止录音'}catch{toast('无法启动语音输入')}}
function speakLast(){if(!('speechSynthesis' in window)){toast('当前浏览器不支持语音合成');return}window.speechSynthesis.cancel();const last=[...state.chat].reverse().find(x=>x.role==='assistant');if(!last){toast('暂无可朗读的回答');return}const u=new SpeechSynthesisUtterance(last.text.slice(0,2000));u.lang='zh-CN';u.rate=.96;window.speechSynthesis.speak(u)}
/* Project, resources, quick navigation */
const team=[['臧昭越','团队队长 · 项目统筹、AI系统研发'],['杨家泰','解剖实践 · 数字标本影像采集'],['金雨菲','解剖实践 · 数字标本资源建设'],['王蕴琦','科普传播 · 文稿撰写'],['刘通','算法优化 · 图像识别研发'],['夏浩育','平台开发 · 系统部署']];
const faq=[
 ['这个平台可以替代真实解剖实验吗？','不可以。真实解剖实践是医学教育不可替代的核心体验。平台旨在补充课前预习、课后复习与结构认知，并倡导尊重遗体捐献与生命伦理。'],
 ['当前的交互标本是真实扫描出来的吗？','模型馆提供经 Blender 整理的开放解剖参考模型，支持真实三维旋转、结构展开和材质切换。来源及授权见独立展厅；它们不是本团队的标本扫描。展厅不读取题库、知识库或学习记录。'],
 ['AI 解剖助教会直接联网回答吗？','打开单文件 HTML 时，默认由内置的有限知识库回答。运行附带的 Flask 后端，并由部署者在服务器上配置兼容接口的 API 密钥后，可调用真实语言模型。图像识别还需要另行配置视觉模型。'],
 ['我的学习记录保存在哪里？','学习记录保存在当前浏览器的 localStorage 中，不自动上传服务器或跨设备同步。你可以从学习档案导出 JSON。清理浏览器数据会清除这些本地记录。'],
 ['可以导入自己的题库吗？','可以。在「在线测评」页面选择「导入 TXT 题库」，下载模板后按照其中的 ### 题目、选项 A–D、答案和解析格式编辑即可。'],
 ['本项目由谁发起？','“智触人体·医脉相承”是山东大学基础医学院2026年暑期医学教育创新社会实践项目，项目以解剖实践、技术研发、资源建设、科普传播和平台搭建五位一体为核心。']
];
const resources=[
 {symbol:'▤',cat:'LEARNING MATERIAL',title:'五大系统知识提纲',text:'覆盖运动、神经、循环、呼吸与消化系统的基础知识条目，适用于自主复习和回顾。',action:'knowledge'},
 {symbol:'◈',cat:'ACTIVE RECALL',title:'自定义题库模板',text:'规范化 TXT 格式，支持四选一中文和英文题目、知识点分类、难度与解析。',action:'template'},
 {symbol:'⌘',cat:'STUDY WORKSHEET',title:'解剖学习复习清单',text:'可打印的学习任务清单，引导你逐项完成知识点梳理、重点记忆和训练。',action:'checklist'},
 {symbol:'✧',cat:'SCIENCE COMMUNICATION',title:'「人体探秘」科普选题',text:'以骨骼、颅脑、肺、心脏等为主题的项目科普提纲与知识要点（非原始视频文件）。',action:'science'},
 {symbol:'◉',cat:'SPECIMEN REFERENCE',title:'五件结构标本学习资料',text:'汇总本演示站五个解剖主题的结构概览、关键结构与临床关联。',action:'specimens'},
 {symbol:'↗',cat:'PROJECT REPORT',title:'实践项目与创新路径',text:'了解山东大学医学教育创新团队如何连接一线解剖实践与数字教育。',action:'project'},
];
function renderResources(){const panel=$('#resourceGrid');panel.innerHTML=resources.map(r=>`<article class="card card-hover resource-card"><span class="eyebrow">${r.cat}</span><div class="res-symbol">${r.symbol}</div><h3>${r.title}</h3><p>${r.text}</p><button class="btn btn-sm" data-resource="${r.action}">${r.action==='project'?'阅读项目故事 ↗':'获取资源 ↓'}</button></article>`).join('')}
function knowledgeText(){return `智触人体 · 医脉相承\n五大系统解剖学习提纲\n===========================\n${[...new Set(topics.map(t=>t.system))].map(g=>'\n【'+g+'】\n'+topics.filter(x=>x.system===g).map((t,i)=>`${i+1}. ${t.name} (${t.latin})\n   ${t.summary}\n   要点：${t.key}`).join('\n')).join('\n')}\n\n医学教育参考资料。请结合正式教材和教师指导学习。`}
function scienceText(){return `智触人体 · 医脉相承\n「人体探秘」科普专题（根据实践报告提炼的学习提纲）\n\n1. 人体的支撑系统——骨骼\n认识成人骨骼约206块及骨骼系统的支持、保护与运动功能。\n\n2. 大脑指挥官——颅脑探秘\n介绍大脑主要脑叶、脑干、小脑与神经信号传导。\n\n3. 呼吸之间——肺的奥秘\n了解肺叶、支气管与肺泡，认识呼吸和气体交换。\n\n4. 心脏——永不停歇的泵\n理解四心腔、瓣膜以及肺循环、体循环的血流路径。\n\n5. 探秘人体——从细胞到系统\n从细胞、组织、器官和系统四个层次理解人体组织结构。\n\n注：这份材料是对项目报告所述科普主题的摘要，并非原始视频或完整脚本。`}
function checklistText(){return `智触人体医学学习清单\n\n使用建议：阅读知识图谱 -> 复述结构 -> 完成测评 -> 回顾错题。\n\n${topics.map(t=>`[ ] 【${t.system}】${t.name}`).join('\n')}\n\n[ ] 完成5道基础题\n[ ] 完成10道混合题\n[ ] 复习错题本\n[ ] 向同学解释一个解剖结构\n[ ] 记录一次学习心得`}
function doResource(action){if(action==='project')return navigate('about');if(action==='knowledge')return download('智触人体-五大系统知识提纲.txt',knowledgeText());if(action==='template')return download('智触人体-自定义题库模板.txt',quizTemplate);if(action==='checklist')return download('智触人体-学习复习清单.txt',checklistText());if(action==='science')return download('智触人体-人体探秘科普提纲.txt',scienceText());if(action==='specimens')return download('智触人体-五大标本结构笔记.txt',specimens.map(specNotes).join('\n\n'+'='.repeat(45)+'\n\n'))}
function renderAbout(){$('#teamGrid').innerHTML=team.map(([name,role])=>`<div class="card person"><div class="initial">${esc(name.slice(-1))}</div><h3>${esc(name)}</h3><p>${esc(role)}</p></div>`).join('');$('#faqList').innerHTML=faq.map(([q,a],i)=>`<div class="faq-item"><button class="faq-question" aria-expanded="false" data-faq="${i}">${esc(q)} <span>＋</span></button><div class="faq-answer">${esc(a)}</div></div>`).join('')}
const commands=[...[
 ['首页','home'],['三维模型馆','atlas'],['AI 解剖助教','assistant'],['知识图谱','learn'],['在线测评','quiz'],['学习档案','dashboard'],['资源中心','resources'],['关于我们','about']].map(([label,route])=>({label,route,type:'页面'})),...galleryModels.map(s=>({label:s.title,route:'atlas',type:'数字标本',spec:s.id})),...topics.map(t=>({label:t.name,route:'learn',type:t.system,learn:t.id}))];
function renderCommands(){const kw=$('#commandInput').value.trim().toLowerCase();const results=commands.filter(x=>(x.label+x.type).toLowerCase().includes(kw)).slice(0,18);$('#commandResults').innerHTML=results.length?results.map((r,i)=>`<button class="cmd-item" data-command="${commands.indexOf(r)}"><span class="muted" style="font-size:10px;margin-right:11px">${r.type}</span>${esc(r.label)} <span style="float:right;color:#aa8555">↗</span></button>`).join(''):'<p class="muted small">没有找到匹配的项目。</p>'}
function activateCommand(idx){const r=commands[idx];if(!r)return;closeModal('searchModal');if(r.learn)learnSelected=r.learn;navigate(r.route);if(r.spec)openSpec(r.spec)}
function showSearch(){openModal('searchModal');$('#commandInput').value='';renderCommands();setTimeout(()=>$('#commandInput').focus(),20)}
function init(){
 renderHomeSpecs();renderAtlas();renderChat();renderResources();renderAbout();renderQuizSetup();renderLearn();checkAiService();
 document.addEventListener('click',e=>{
  const spec=e.target.closest('[data-spec]');if(spec){e.preventDefault();openSpec(spec.dataset.spec);return}
  const route=e.target.closest('[data-route]');if(route){e.preventDefault();navigate(route.dataset.route);return}
  const close=e.target.closest('[data-close]');if(close){closeModal(close.dataset.close);return}
  const lesson=e.target.closest('[data-learn]');if(lesson){learnSelected=lesson.dataset.learn;renderLearn();return}
  const option=e.target.closest('[data-option]');if(option&&!quizAnswered){quizSelected=+option.dataset.option;persistQuiz();$$('#quizChoices .quiz-option').forEach(b=>b.classList.toggle('selected',b===option));return}
  const res=e.target.closest('[data-resource]');if(res){doResource(res.dataset.resource);return}
  const cmd=e.target.closest('[data-command]');if(cmd){activateCommand(+cmd.dataset.command);return}
  const faqBtn=e.target.closest('[data-faq]');if(faqBtn){const item=faqBtn.closest('.faq-item');item.classList.toggle('open');faqBtn.setAttribute('aria-expanded',item.classList.contains('open')?'true':'false');faqBtn.querySelector('span').textContent=item.classList.contains('open')?'－':'＋';return}
 });
 // Move keyboard focus to specimen cards, not only mouse clicks.
 document.addEventListener('keydown',e=>{
  if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='k'){e.preventDefault();showSearch();return}
  if(e.key==='Escape'){$$('.modal-backdrop.open').forEach(x=>closeModal(x.id));return}
  if((e.key==='Enter'||e.key===' ')&&e.target.matches('[data-spec]')){e.preventDefault();openSpec(e.target.dataset.spec);return}
  if(e.target.id==='clozeAnswer'&&e.key==='Enter'&&quizSession&&!quizAnswered){e.preventDefault();submitQuiz();return}
  if(e.target.closest('#quizScreen')&&quizSession&&!quizAnswered&&!['TEXTAREA','INPUT'].includes(e.target.tagName)){
   if('1234'.includes(e.key)&&e.key.length===1){const i=+e.key-1;const option=$('#quizChoices [data-option="'+i+'"]');if(option)option.click()}
   if(e.code==='Space'&&quizSelected!==null){e.preventDefault();submitQuiz()}
  }
 });
 $$('.modal-backdrop').forEach(el=>el.addEventListener('mousedown',e=>{if(e.target===el)closeModal(el.id)}));
 $('#mobileMenu').onclick=()=>{const nav=$('#navLinks');nav.classList.toggle('open');$('#mobileMenu').setAttribute('aria-expanded',nav.classList.contains('open')?'true':'false')};
 $('#searchTrigger').onclick=showSearch;$('#commandInput').oninput=renderCommands;
 $('#atlasSearch').oninput=renderAtlas;$('#atlasFilters').onclick=e=>{const btn=e.target.closest('[data-filter]');if(!btn)return;$$('#atlasFilters .chip').forEach(x=>x.classList.toggle('active',x===btn));renderAtlas()};
 $('#learnSearch').oninput=e=>{learnSearchText=e.target.value.trim().toLowerCase();renderLearn()};$('#learnFilters').onclick=e=>{const btn=e.target.closest('[data-filter]');if(!btn)return;learnFilter=btn.dataset.filter;$$('#learnFilters .chip').forEach(x=>x.classList.toggle('active',x===btn));renderLearn()};
 $('#quizStart').onclick=startQuiz;$('#quizSubmit').onclick=submitQuiz;$('#quizNext').onclick=nextQuiz;$('#quizExit').onclick=exitQuiz;$('#quizFavBtn').onclick=toggleQuizFav;$('#quizAgain').onclick=()=>{quizSession=null;renderQuizSetup()};$('#quizImportBtn').onclick=()=>$('#quizImportInput').click();$('#quizTemplateBtn').onclick=()=>download('智触人体-TXT题库导入模板.txt',quizTemplate);$('#quizImportInput').onchange=async e=>{try{await importQuizFile(e.target.files[0])}catch(err){toast('题库导入失败：'+err.message)}e.target.value=''};
 $('#aiModeSwitch').onclick=e=>{const b=e.target.closest('[data-mode]');if(!b)return;aiMode=b.dataset.mode;$$('#aiModeSwitch button').forEach(x=>x.classList.toggle('active',x===b));toast(aiMode==='popular'?'已切换为通俗解释模式':'已切换为专业解剖模式')};$('#aiSendBtn').onclick=sendChat;$('#aiInput').onkeydown=e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();sendChat()}};$('#aiUploadBtn').onclick=()=>$('#aiImageInput').click();$('#aiImageInput').onchange=async e=>{try{await imagePicked(e.target.files[0])}catch(err){toast(err.message)}};$('#aiMicBtn').onclick=startVoiceInput;$('#aiSpeakBtn').onclick=speakLast;$('#clearChat').onclick=()=>{if(confirm('确定清空本机的问答历史吗？')){state.chat=[];save();renderChat();toast('问答历史已清空')}};$$('[data-prompt]').forEach(btn=>btn.onclick=()=>{$('#aiInput').value=btn.dataset.prompt;$('#aiInput').focus()});
 $('#exportData').onclick=()=>download('智触人体-学习档案-'+new Date().toISOString().slice(0,10)+'.json',JSON.stringify({version:1,exportedAt:new Date().toISOString(),data:state},null,2),'application/json');
 $('#editNickname').onclick=()=>{const n=prompt('请输入学习档案中显示的昵称（最多20字）',state.nickname||'探索者');if(n===null)return;state.nickname=n.trim().slice(0,20)||'探索者';save();renderDashboard()};
 $('#resetData').onclick=()=>{if(confirm('将永久清除当前浏览器内的所有学习、错题、收藏和聊天记录。建议先导出备份。确定清空吗？')){state=defaults();save();renderChat();renderDashboard();renderAtlas();renderHomeSpecs();renderLearn();toast('本地学习档案已清空')}};
 $('#footerContact').onclick=()=>toast('项目归属：山东大学基础医学院「智触人体」医学教育创新实践队；未提供公开的官方联系邮箱。');
 const startHash=decodeURIComponent(location.hash.slice(1)),initial=startHash.split('?')[0]||'home';navigate(initial,{replace:true});if(startHash.includes('?spec=')){const v=startHash.split('spec=')[1]?.split('&')[0];if(galleryModels.some(s=>s.id===v))setTimeout(()=>openSpec(v),150)}
 window.addEventListener('popstate',()=>navigate(location.hash.slice(1).split('?')[0]||'home',{replace:true}));
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();

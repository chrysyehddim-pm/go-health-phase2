(function () {
  'use strict';

  const typeMeta = {
    '健康飲食': { icon: 'fa-bowl-food', tone: 'food' },
    '公園步道': { icon: 'fa-tree', tone: 'park' },
    '運動場所': { icon: 'fa-person-running', tone: 'sport' },
    '醫院診所': { icon: 'fa-hospital', tone: 'medical' },
    '藥局': { icon: 'fa-prescription-bottle-medical', tone: 'pharmacy' }
  };

  // Review fixtures only. Loaded exclusively by an explicit demo query parameter.
  // Never merge these records with Google results or use them as an API error fallback.
  const rawPlaces = [
    ['daan-forest', '大安森林公園', '公園步道', '臺北市', '大安區', '新生南路二段1號', 25.0296, 121.5356, '大片綠地與環狀步道，適合散步、慢跑與親子活動。', ['無障礙步道', '戶外']],
    ['fuyang-park', '富陽自然生態公園', '公園步道', '臺北市', '大安區', '富陽街底', 25.0188, 121.5561, '保留自然林相與緩坡步道，可安排輕量健走。', ['自然步道', '戶外']],
    ['fuzhou-hill', '福州山公園', '公園步道', '臺北市', '大安區', '臥龍街199號', 25.0168, 121.5512, '可眺望市區的森林步道，部分路段有階梯。', ['登高步道', '戶外']],
    ['dunan-park', '敦安公園', '公園步道', '臺北市', '大安區', '信義路四段與敦化南路口', 25.0326, 121.5486, '市區內的小型綠地，適合短程散步與休息。', ['城市綠地']],
    ['daan-sports', '臺北市大安運動中心', '運動場所', '臺北市', '大安區', '辛亥路三段55號', 25.0217, 121.5433, '設有游泳池、健身房與多用途球場。', ['室內運動', '無障礙']],
    ['ntu-gym', '國立臺灣大學綜合體育館', '運動場所', '臺北市', '大安區', '羅斯福路四段1號', 25.0212, 121.5352, '校園綜合運動場館，開放項目與時段以現場公告為準。', ['運動場館']],
    ['heping-basketball', '臺北和平籃球館', '運動場所', '臺北市', '大安區', '敦南街76巷28號', 25.0214, 121.5477, '大型室內場館，活動及開放資訊可於出發前查詢。', ['室內場館']],
    ['ntnu-gym', '國立臺灣師範大學體育館', '運動場所', '臺北市', '大安區', '和平東路一段162號', 25.0266, 121.5275, '校園運動場館，使用規則依校方公告。', ['運動場館']],
    ['cathay-hospital', '國泰綜合醫院', '醫院診所', '臺北市', '大安區', '仁愛路四段280號', 25.0370, 121.5537, '提供門診、急診與多科醫療服務。', ['醫院', '急診']],
    ['renai-hospital', '臺北市立聯合醫院仁愛院區', '醫院診所', '臺北市', '大安區', '仁愛路四段10號', 25.0375, 121.5460, '市立綜合醫院，提供門診、住院與急診服務。', ['醫院', '急診']],
    ['center-hospital', '中心診所醫療財團法人中心綜合醫院', '醫院診所', '臺北市', '大安區', '忠孝東路四段77號', 25.0418, 121.5474, '提供多科門診與健康檢查服務。', ['醫院', '健檢']],
    ['chungshan-hospital', '中山醫院', '醫院診所', '臺北市', '大安區', '仁愛路四段112巷11號', 25.0366, 121.5502, '提供多科門診及住院服務。', ['醫院']],
    ['greattree-ruian', '大樹連鎖藥局 台北瑞安店', '藥局', '臺北市', '大安區', '瑞安街208巷11弄1號', 25.0286, 121.5405, '社區藥局，可於前往前確認營業時間與所需服務。', ['社區藥局']],
    ['yeschain-heping', '躍獅藥局 和平店', '藥局', '臺北市', '大安區', '和平東路二段', 25.0254, 121.5419, '社區藥局，提供用藥諮詢與日常保健用品。', ['用藥諮詢']],
    ['cosmed-daan', '丁丁連鎖藥妝 大安店', '藥局', '臺北市', '大安區', '信義路三段', 25.0333, 121.5408, '藥妝與保健用品據點，服務內容依門市公告。', ['保健用品']],
    ['little-tree', '小小樹食 大安店', '健康飲食', '臺北市', '大安區', '大安路一段116巷17號', 25.0391, 121.5460, '提供蔬食餐點，適合安排清爽均衡的一餐。', ['蔬食', '均衡餐點']],
    ['miacucina', 'Miacucina 復興店', '健康飲食', '臺北市', '大安區', '復興南路一段', 25.0410, 121.5437, '以蔬食與原型食材為主的餐飲選擇。', ['蔬食']],
    ['plants', 'Plants', '健康飲食', '臺北市', '大安區', '復興南路二段', 25.0297, 121.5435, '提供植物性餐點，餐點與營業資訊以店家公告為準。', ['植物性飲食']],
    ['banqiao-wanping', '板橋萬坪公園', '公園步道', '新北市', '板橋區', '文化路一段與新站路口', 25.0139, 121.4624, '車站周邊綠地，適合短程散步。', ['城市綠地']],
    ['banqiao-435', '板橋435藝文特區', '公園步道', '新北市', '板橋區', '中正路435號', 25.0232, 121.4525, '有戶外廣場與河濱周邊空間，適合散步與親子活動。', ['戶外', '親子']],
    ['banqiao-sports', '新北市板橋國民運動中心', '運動場所', '新北市', '板橋區', '智樂路6號', 25.0224, 121.4601, '設有游泳池、健身房與多用途運動空間。', ['室內運動']],
    ['far-eastern-hospital', '亞東紀念醫院', '醫院診所', '新北市', '板橋區', '南雅南路二段21號', 24.9975, 121.4527, '提供門診、急診與多科醫療服務。', ['醫院', '急診']],
    ['banqiao-chung-hsing', '板橋中興醫院', '醫院診所', '新北市', '板橋區', '忠孝路15號', 25.0011, 121.4600, '提供門診與住院醫療服務。', ['醫院']],
    ['greattree-banqiao', '大樹連鎖藥局 板橋店', '藥局', '新北市', '板橋區', '中山路二段', 25.0165, 121.4760, '社區藥局，可於前往前確認營業時間。', ['社區藥局']]
  ];

  const curated = rawPlaces.map(function (row) {
    const id = row[0];
    const name = row[1];
    const type = row[2];
    const county = row[3];
    const district = row[4];
    const street = row[5];
    const lat = row[6];
    const lng = row[7];
    const summary = row[8];
    const tags = row[9];
    const meta = typeMeta[type];
    const address = county + district + street;
    return {
      id: id, name: name, type: type, county: county, district: district,
      street: street, address: address, lat: lat, lng: lng, summary: summary,
      tags: tags, icon: meta.icon, tone: meta.tone, source: 'GO HEALTH 精選',
      updatedAt: '2026-10-18', active: true,
      mapsUrl: 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(name + ' ' + address)
    };
  });


  window.GH_PLACE_FIXTURES = { places: curated, typeMeta: typeMeta };
})();

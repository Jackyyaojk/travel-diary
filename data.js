// 定义照片的基础路径 (使用相对路径以兼容浏览器)
const basePaths = {
    // 假设 index.html 在 code/travel-diary/
    // Inter-Data 在 code/travel-diary/Inter-Data/ --> ./Inter-Data/
    intl: "./Inter-Data/", 
    
    // Dome-Data 在 code/travel-diary/Dome-Data/ --> ./Dome-Data/
    domestic: "./Dome-Data/"
};

// **地理边界数据 GeoJSON**
// 我们使用公共 CDN 提供全球和中国省级边界数据
// 如果想离线使用，可以将这些 JSON 下载到 geojson 文件夹并修改路径
const geoJsonUrls = {
    world: "https://raw.githubusercontent.com/johan/world.geo.json/master/countries.geo.json",
    // 使用阿里云 DataV 的数据源，虽然比较大但非常准确
    china: "https://geo.datav.aliyun.com/areas_v3/bound/geojson?code=100000_full"
};

// **区域匹配规则**
// 为了让程序知道 "Spain" 对应地图上的哪个形状，我们需要建立映射
// 格式: { "数据里的名字": ["地图里的名字1", "地图里的名字2"] }
const regionMapping = {
    // 国际版：国家名称映射
    intl: {
        "Spain - Barcelona & Madrid & Seville": ["Spain"], 
        "Japan - Kyoto": ["Japan"],
        "France - Paris": ["France"]
    },
    // 国内版：省份名称映射 (注意: 地图是按省份画的，所以要把城市映射到省份)
    domestic: {
        "China - Beijing": ["Beijing", "北京", "北京市"],
        "China - Shanghai": ["Shanghai", "上海", "上海市"],
        "China - Yangzhou": ["Jiangsu", "江苏", "江苏省"],
        "China - Ningbo": ["Zhejiang", "浙江", "浙江省"],
        "China - Xiamen": ["Fujian", "福建", "福建省"],
        "China - Nanjing": ["Jiangsu", "江苏", "江苏省"],
        // 确保特殊地区也能匹配
        "China - Taiwan": ["Taiwan", "台湾", "台湾省"],
        "China - Hong Kong": ["Hong Kong", "香港", "香港特别行政区"],
        "China - Macau": ["Macau", "澳门", "澳门特别行政区"]
    }
};

// 背景音乐列表
const musicList = [
    {
        title: "Autumn Leaves",
        // 请确保你把 Lost Stars.mp3 放在 music 文件夹里
        // 或者你可以把这里换成网上的链接
        url: "music/autumn.mp3"
    }
];

const travelData = {
    "intl": [
        {
            "id": 1,
            "name": "Spain - Barcelona & Madrid & Seville",
            "date": "2025-10-12 -- 2025-10-24",
            "desc": "小姚小朱第一次国外蜜月旅行～～.",
            "lat": 40.4167,
            "lng": -3.7033,
            "photo": "2025Spain.jpg"
        },
    ],
    "domestic": [
        {
            "id": 1,
            "name": "China - Shanghai",
            "date": "2025-08-10 -- 2025-08-11",
            "desc": "在一起的旅行，上海外滩的大明路上～～～.",
            "lat": 31.2304,
            "lng": 121.4737,
            "photo": "2025Shanghai.jpg"
        },
        {
            "id": 2,
            "name": "China - Yangzhou",
            "date": "2025-09-20 -- 2025-09-22",
            "desc": "猪贱贱和猪宝贝担任起了实验室旅行团的导游职责～～～",
            "lat": 32.3932,
            "lng": 119.4085,
            "photo": "2025Yangzhou.jpg"
        },
        {
            "id": 3,
            "name": "China - Ningbo",
            "date": "2025-09-27 -- 2025-09-29",
            "desc": "参加国家工业软件大会，顺便游览了宁波～～～",
            "lat": 29.8750,
            "lng": 121.5497,
            "photo": "2025Ningbo.jpg"
        },
        {
            "id": 4,
            "name": "China - Xiamen",
            "date": "2025-10-29 -- 2025-10-31",
            "desc": "参加MIND会议，顺便游览了厦门～～～",
            "lat": 24.4467,
            "lng": 118.0800,
            "photo": "2025Xiamen.jpg"
        },
        {
            "id": 5,
            "name": "China - Nanjing",
            "date": "2025-12-09 -- 2025-12-12",
            "desc": "猪贱贱在北京kuku工作，猪宝贝在杭州kuku工作，中间放松一下啦～～～",
            "lat": 32.0603,
            "lng": 118.7969,
            "photo": "2025Nanjing.jpg"
        },
    ]
};
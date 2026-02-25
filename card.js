const CARD_DATABASE = [
    {
        id: "BT01_056",
        name: "에테르",
        type: "UNIT",
        att: "폭풍",
        aff: "미실러스",
        cost: 1,
        power: 1500,
        hit: 1,
        desc: "엑시트 : 필드 위에 있는 상대 유닛 1장을 골라, 이 턴이 끝날 때까지 파워 -2000",
        image: "image/BT01_056.jpg" // 이미지 경로
    },
    {
        id: "BT01_057",
        name: "미하라",
        type: "UNIT",
        att: "폭풍",
        aff: "미실러스",
        cost: 1,
        power: 2500,
        hit: 1,
        desc: "",
        image: "image/BT01_057.jpg" // 이미지 경로
    },
    {
        id: "BT01_074",
        name: "시크릿 코드",
        type: "SKILL",
        att: "폭풍",
        cost: 2,
        desc: "자신의 필드에서 유닛을 1장 골라 트래시한다. 그 유닛의 히트만큼 카드를 드로우한다.",
        trigger: "이 카드를 자신의 패에 넣는다.",
        image: "image/BT01_074.jpg"
    },
    {
        id: "BT01_080",
        name: "갓데시움 바이저",
        type: "ITEM",
        att: "폭풍",
        cost: 2,
        desc: "엑시트 : 카드를 2장 드로우한다.",
        image: "image/BT01_080.jpg"
    },
    {
        id: "ST03_001",
        front: "image/ST03_001_F.jpg",
        back: "image/ST03_001_B.jpg",
        name: "모더니아",
        type: "LEADER",
        att: "폭풍",
        aff: "필그림",
        wake: 4,
        pledge : "자신의 덱에 [폭풍]카드만 넣을 수 있다.",
        descf : "자신의 리더 레벨이 4 이상이라면 이 카드를 뒤집는다.",
        descb : "패시브 : 필드 위의 [엑시트]를 가진 모든 자신의 유닛 파워 +1000."
    }
];

// 다른 파일에서 쓸 수 있도록 내보내기 (혹은 전역 변수 유지)
// export default CARD_DATABASE; // 모듈 방식 사용 시

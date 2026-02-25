// 선택된 카드 정보를 담는 변수
let selectedCard = null;

window.onload = () => {
    if (typeof CARD_DATABASE !== 'undefined') {
        // 1. 리더 카드를 레벨 존 시작 지점에 배치
        setupLeader("ST03_001");

        // 2. 초기 패 설정
        const initialCards = [
            "BT01_056", "BT01_056", "BT01_056",
            "BT01_057", "BT01_057", "BT01_057",
            "BT01_074", "BT01_074", "BT01_074",
            "BT01_080", "BT01_080", "BT01_080"
        ];
        initialCards.forEach(id => addCardToHand(id));
    }
    
};

/**
 * 1. 손패(Hand)에 카드 생성
 */
function addCardToHand(cardId) {
    const cardData = CARD_DATABASE.find(c => c.id === cardId);
    if (!cardData) return;

    const handEl = document.getElementById('player-hand');
    const cardEl = document.createElement('div');
    cardEl.className = 'card';
    cardEl.style.backgroundImage = `url('${cardData.image}')`;
    
    // 카드 라벨 추가
    const label = document.createElement('div');
    label.className = 'card-label';
    label.innerText = cardData.name;
    cardEl.appendChild(label);

    // 클릭 이벤트
    cardEl.onclick = (e) => {
        e.stopPropagation();
        handleCardClick(cardEl, cardData);
    };

    setupPreview(cardEl, cardData);

    handEl.appendChild(cardEl);
}

/**
 * 데미지 존 자동 정렬 함수
 * 카드가 이동되어 빠졌을 때 호출하면 자리를 다시 계산합니다.
 */
function refreshDamageZone() {
    const stackContainer = document.querySelector('#player-side #damage-cards-stack');
    if (!stackContainer) return;

    const cards = stackContainer.querySelectorAll('.card');
    const step = 30; // 수치 반영

    cards.forEach((card, index) => {
        card.style.left = `${index * step}px`;
        card.style.zIndex = 10 + index;
    });
}

/**
 * 덱/트래시 존 전용 이동 함수 (스택 방식)
 */
function moveCardToStackZone(slot, isDeck = false) {
    if (!selectedCard) return;

    const cardEl = selectedCard.el;
    const wasInDamageZone = cardEl.parentElement.id === 'damage-cards-stack';
    const existingCards = slot.querySelectorAll('.card').length;

    // 초기화 및 배치
    cardEl.style.position = "absolute";
    cardEl.style.left = "0";
    cardEl.style.top = "0";
    cardEl.style.zIndex = 10 + existingCards; // 항상 맨 위로

    // 덱 존일 경우 뒷면 처리
    if (isDeck) {
        cardEl.classList.add('card-back');
    } else {
        cardEl.classList.remove('card-back');
    }

    slot.appendChild(cardEl);

    if (wasInDamageZone) refreshDamageZone(); // 데미지 존 리필 실행
    finishMove(cardEl, selectedCard.info);
}

function moveCardToSlot(slot) {
    if (!selectedCard) return;

    const cardEl = selectedCard.el;
    const wasInDamageZone = cardEl.parentElement.id === 'damage-cards-stack';

    // 점선 클래스 제거 (유닛 존으로 가는 게 아닐 때를 대비)
    cardEl.classList.remove('item-card');

    cardEl.style.position = "relative";
    cardEl.style.left = "0";
    cardEl.style.top = "0";
    cardEl.style.zIndex = "5";
    cardEl.classList.remove('card-back');

    slot.appendChild(cardEl);

    if (wasInDamageZone) refreshDamageZone(); // 데미지 존 리필 실행
    finishMove(cardEl, selectedCard.info);
}

/**
 * 2. 카드 클릭 핸들러 (레벨 10 제한 추가)
 */
function handleCardClick(el, info) {
    if (selectedCard && selectedCard.el === el) return cancelSelection();
    cancelSelection();

    selectedCard = { el, info };
    el.classList.add('card-selected');

    const parentSlot = el.parentElement;
    const isInDeck = parentSlot.classList.contains('deck-zone');
    
    let targetSelector = "";

    // [아이템 로직] 덱/트래시/데미지/패 + 유닛 존(장착용) 이동 가능
    if (info.type === "ITEM") {
        targetSelector = "#player-side .unit-slot, #player-side .deck-zone, #player-side .trash-zone, #player-hand";
    } 
    else if (isInDeck) {
        targetSelector = "#player-hand, #player-side .trash-zone"; 
    } 
    else if (info.type === "UNIT") {
        targetSelector = "#player-side .unit-slot, #player-side .deck-zone, #player-side .trash-zone, #player-hand";
    }
    // [수정] 덱 존에 있는 카드를 선택한 경우 -> 패(Hand)와 트래시 존으로 이동 가능
    if (isInDeck) {
        targetSelector = "#player-hand, #player-side .trash-zone"; 
    } 
    else if (info.type === "UNIT") {
        targetSelector = "#player-side .unit-slot, #player-side .deck-zone, #player-side .trash-zone, #player-hand";
    } else if (info.type === "SKILL") {
        targetSelector = "#player-side .skill-slot, #player-side .skill-slot, #player-side .deck-zone, #player-side .trash-zone, #player-hand";
    } else if (info.type === "LEADER") {
        targetSelector = "#player-side .level-slot:not(.level-10)";
    }

    if (targetSelector) {
        document.querySelectorAll(targetSelector).forEach(slot => {
            slot.classList.add('highlight-target');
            slot.onclick = (e) => {
                e.stopPropagation();
                
                // [확인] info.type이 LEADER인지 체크 후 함수 호출
                if (info.type === "LEADER") {
                    moveLeaderToLevel(slot);
                } else if (info.type === "ITEM" && slot.classList.contains('unit-slot')) {
                    attachItemToUnit(slot); // 아이템 전용 장착 함수
                } else if (slot.id === "player-hand") {
                    moveCardToHand(slot);
                } else if (slot.classList.contains('deck-zone')) {
                    moveCardToStackZone(slot, true);
                } else if (slot.classList.contains('trash-zone')) {
                    moveCardToStackZone(slot, false);
                } else {
                    moveCardToSlot(slot);
                }
            };
        });
    }

    // 데미지 존 연결 (아이템 포함)
    if (info.type !== "LEADER" && !isInDeck) {
        const damageZone = document.querySelector('#player-side .damage-zone');
        if (damageZone) {
            damageZone.classList.add('highlight-target');
            damageZone.onclick = (e) => {
                e.stopPropagation();
                moveCardToDamageZone(damageZone);
            };
        }
    }
}

/**
 * 아이템 장착 및 이동 로직 수정
 */
function attachItemToUnit(slot) {
    if (!selectedCard) return;

    const itemEl = selectedCard.el;
    itemEl.classList.add('item-card'); // 여기서만 점선 추가
    const wasInDamageZone = itemEl.parentElement.id === 'damage-cards-stack';

    // 스타일 및 클래스 설정
    itemEl.classList.add('item-card');
    itemEl.style.position = "absolute";
    itemEl.style.left = "0";
    itemEl.style.top = "30px"; // 유닛보다 아래 배치
    itemEl.style.zIndex = "4";

    slot.appendChild(itemEl);

    if (wasInDamageZone) refreshDamageZone();
    finishMove(itemEl, selectedCard.info);
}

/**
 * 패(Hand)로 이동하는 함수
 */
function moveCardToHand(handEl) {
    if (!selectedCard) return;
    const cardEl = selectedCard.el;
    const wasInDamageZone = cardEl.parentElement.id === 'damage-cards-stack';

    // 스타일 초기화 (뒷면 해제, 위치 리셋)
    cardEl.style.position = "relative";
    cardEl.style.left = "0";
    cardEl.style.top = "0";
    cardEl.style.zIndex = "5";
    cardEl.classList.remove('card-back');

    handEl.appendChild(cardEl);

    if (wasInDamageZone) refreshDamageZone(); //
    finishMove(cardEl, selectedCard.info);
}

/**
 * 6. 리더 이동 (레벨 10 진입 방지 로직 강화)
 */
/**
 * 리더 이동 함수 수정본
 */
function moveLeaderToLevel(targetSlot) {
    if (!selectedCard || !selectedCard.info) return;

    const cardEl = selectedCard.el;
    const info = selectedCard.info;
    
    // 1. 레벨 판정 (data-lv 값 기준)
    const slotLvAttr = parseInt(targetSlot.dataset.lv) || 0; 
    const currentActualLevel = slotLvAttr+1; // 선택한 슬롯의 레벨 번호

    // 2. 각성 이미지 처리
    if (info.wake && currentActualLevel >= info.wake) {
        cardEl.style.backgroundImage = `url('${info.back}')`;
        cardEl.classList.add('awakened');
    } else {
        cardEl.style.backgroundImage = `url('${info.front}')`;
        cardEl.classList.remove('awakened');
    }

    // 3. 부모 슬롯 변경
    targetSlot.appendChild(cardEl); 

    // 4. 스타일 강제 조정 (이동폭 제한)
    // absolute 상태에서 bottom: 0을 주면 해당 '14px' 높이의 슬롯 바닥에 붙습니다.
    cardEl.style.position = "absolute";
    cardEl.style.bottom = "0"; 
    cardEl.style.left = "0";
    cardEl.style.top = "auto"; // 위쪽으로 튀어나가지 않게 고정
    cardEl.style.transform = "none";

    finishMove(cardEl, info);
}
/**
 * 3. 일반 이동 (유닛 존 용)
 */
function moveCardToSlot(slot) {
    if (!selectedCard) return;

    const cardEl = selectedCard.el;
    cardEl.style.zIndex = "5";
    // 부모 요소가 데미지 스택 컨테이너인지 정확히 확인
    const wasInDamageZone = cardEl.parentElement.id === 'damage-cards-stack';
    
    // 다른 곳으로 이동할 때는 아이템 클래스 제거 (점선 제거)
    cardEl.classList.remove('item-card'); 

    slot.appendChild(cardEl);
    if (wasInDamageZone) refreshDamageZone();
    finishMove(cardEl, selectedCard.info);
    cardEl.style.position = "relative";
    cardEl.style.left = "0";
    cardEl.style.top = "0";
    cardEl.classList.remove('card-back');

    slot.appendChild(cardEl);

    // [중요] 유닛 존으로 이동 시에도 데미지 존 리필 실행
    if (wasInDamageZone) {
        refreshDamageZone();
    }

    finishMove(cardEl, selectedCard.info);
}

/**
 * 좌측 상세 보기 패널 업데이트
 * 유닛 슬롯 클릭 시 실행되도록 연결하세요.
 */
function showDetailView(slot) {
    const detailPanel = document.getElementById('detail-panel'); // 좌측 빈 공간 div
    detailPanel.innerHTML = ""; // 기존 내용 비우기

    const cards = slot.querySelectorAll('.card');
    cards.forEach(card => {
        const clone = card.cloneNode(true);
        clone.classList.remove('card-selected', 'item-card'); // 강조 및 점선 제거
        clone.style.position = "static"; // 나란히 정렬을 위해
        clone.style.transform = "scale(1.5)"; // 크게 보기
        clone.style.margin = "40px";
        detailPanel.appendChild(clone);
    });
}

/**
 * 4. 스킬 존 이동 (중첩 쌓기)
 */
function moveCardToSkillSlot(slot) {
    if (!selectedCard) return;
    const cardEl = selectedCard.el;
    const existingCards = slot.querySelectorAll('.card').length;

    cardEl.style.position = "absolute";
    cardEl.style.left = "0";
    cardEl.style.top = "0";
    cardEl.style.zIndex = 10 + existingCards; // 나중에 온 카드가 위로

    slot.appendChild(cardEl);
    finishMove(cardEl, selectedCard.info);
}

/**
 * 5. 대미지 존 이동 (계단식 겹치기)
 */
function moveCardToDamageZone(targetZone) {
    if (!selectedCard) return;

    const stackContainer = targetZone.querySelector('.damage-cards-stack') || 
                           targetZone.querySelector('#damage-cards-stack');
    
    const existingCards = stackContainer.querySelectorAll('.card').length;
    if (existingCards >= 10) {
        alert("대미지가 가득 찼습니다!");
        return cancelSelection();
    }

    const cardEl = selectedCard.el;
    const step = 30; // 널널한 간격 적용
    const newLeft = existingCards * step;

    cardEl.style.position = "absolute";
    cardEl.style.left = `${newLeft}px`;
    cardEl.style.zIndex = 10 + existingCards;

    stackContainer.appendChild(cardEl);
    finishMove(cardEl, selectedCard.info);
}

/**
 * 7. 리더 초기 배치
 */
function setupLeader(leaderId) {
    const leaderData = CARD_DATABASE.find(c => c.id === leaderId);
    if (!leaderData) return;

    const playerLevelBase = document.querySelector('#player-side .base-level');
    if (playerLevelBase) {
        // [중요] 초기 위치 박스에도 level-slot 클래스를 추가하면 계산이 정확해집니다.
        playerLevelBase.classList.add('level-slot'); 
        
        const leaderEl = document.createElement('div');
        leaderEl.className = 'card leader-card';
        leaderEl.style.backgroundImage = `url('${leaderData.front}')`;
        
        leaderEl.onclick = (e) => {
            e.stopPropagation();
            handleCardClick(leaderEl, leaderData);
        };

        setupPreview(leaderEl, leaderData);
        playerLevelBase.appendChild(leaderEl);
    }
}

/**
 * 8. 공통 마무리 처리
 */
function finishMove(cardEl, info) {
    cardEl.classList.remove('card-selected');
    cardEl.onclick = (e) => {
        e.stopPropagation();
        handleCardClick(cardEl, info);
    };
    cancelSelection();
}

/**
 * 9. 선택 초기화
 */
function cancelSelection() {
    selectedCard = null;
    document.querySelectorAll('.card').forEach(c => c.classList.remove('card-selected'));
    document.querySelectorAll('.highlight-target').forEach(s => {
        s.classList.remove('highlight-target');
        s.onclick = null;
    });
}

// 배경 클릭 시 선택 취소
document.addEventListener('click', cancelSelection);

/**
 * 카드 생성 시 프리뷰 이벤트 등록
 */
function attachPreviewEvents(cardEl, cardData) {
    cardEl.onmouseenter = () => {
        const mainPreview = document.getElementById('main-preview');
        const itemContainer = document.getElementById('item-preview-container');
        const itemList = document.getElementById('item-preview-list');

        // 1. 메인 카드 표시
        mainPreview.style.backgroundImage = `url('${cardData.image}')`;
        mainPreview.style.display = 'block';

        // 2. 장착된 아이템 확인 (현재 카드가 유닛 슬롯에 있다면)
        const parentSlot = cardEl.parentElement;
        if (parentSlot && parentSlot.classList.contains('unit-slot')) {
            const items = parentSlot.querySelectorAll('.item-card');
            if (items.length > 0) {
                itemContainer.style.display = 'block';
                itemList.innerHTML = ""; // 초기화
                items.forEach(item => {
                    const thumb = document.createElement('div');
                    thumb.className = 'item-thumb';
                    thumb.style.backgroundImage = item.style.backgroundImage;
                    itemList.appendChild(thumb);
                });
            }
        }
    };

    cardEl.onmouseleave = () => {
        document.getElementById('main-preview').style.display = 'none';
        document.getElementById('item-preview-container').style.display = 'none';
    };
}

/**
 * 프리뷰 업데이트 로직
 */
function setupPreview(cardEl, cardData) {
    cardEl.onmouseenter = () => {
        const mainPreview = document.getElementById('main-preview');
        if (!mainPreview) return;

        // 현재 카드의 backgroundImage 스타일을 그대로 가져오는 것이 가장 정확합니다.
        const currentImg = cardEl.style.backgroundImage;
        mainPreview.style.backgroundImage = currentImg;
        mainPreview.style.display = 'block';

        // 아이템 프리뷰 영역 제어
        const itemContainer = document.getElementById('item-preview-container');
        const parentSlot = cardEl.parentElement;
        if (parentSlot && parentSlot.classList.contains('unit-slot')) {
            const items = parentSlot.querySelectorAll('.item-card');
            if (items.length > 0) {
                itemContainer.style.display = 'block';
                const itemList = document.getElementById('item-preview-list');
                itemList.innerHTML = "";
                items.forEach(item => {
                    const thumb = document.createElement('div');
                    thumb.className = 'item-thumb';
                    thumb.style.backgroundImage = item.style.backgroundImage;
                    itemList.appendChild(thumb);
                });
            } else {
                itemContainer.style.display = 'none';
            }
        } else {
            if (itemContainer) itemContainer.style.display = 'none';
        }
    };

    cardEl.onmouseleave = () => {
        const mainPreview = document.getElementById('main-preview');
        const itemContainer = document.getElementById('item-preview-container');
        if (mainPreview) mainPreview.style.display = 'none';
        if (itemContainer) itemContainer.style.display = 'none';
    };
}

function setupCardEvents(cardEl, cardData) {
    cardEl.onmouseenter = () => {
        const mainPreview = document.getElementById('main-preview');
        if (!mainPreview) return;

        // 1. 이미지 설정
        const currentImg = cardEl.style.backgroundImage;
        mainPreview.style.backgroundImage = currentImg;

        // 2. 리더 카드 여부에 따른 프리뷰 크기 조절
        if (cardData.type === "LEADER") {
            // 리더는 가로형 비율 (예: 가로 280px, 세로 200px)
            mainPreview.style.width = "280px";
            mainPreview.style.height = "200px";
        } else {
            // 일반 유닛/스킬은 세로형 비율 (원래 설정)
            mainPreview.style.width = "200px";
            mainPreview.style.height = "280px";
        }

        mainPreview.style.display = 'block';

        // ... (이하 아이템 프리뷰 제어 로직은 동일)
    };

    cardEl.onmouseleave = () => {
        const mainPreview = document.getElementById('main-preview');
        if (mainPreview) mainPreview.style.display = 'none';
        // ...
    };
}

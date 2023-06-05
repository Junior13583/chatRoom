$('.contact').click(function () {
    window.open('https://www.doruo.cn/s/leaving', '_blank');
})

$(document).on('mouseenter', '.chat-item', function () {
    $(this).find('.chat-del').css('visibility', 'visible');
});

$(document).on('mouseleave', '.chat-item', function () {
    $(this).find('.chat-del').css('visibility', 'hidden');
});

function selectChatRoom(chatTitle) {
    // TODO 选择聊天室
    $('.right-title').html(chatTitle);
}

$(document).on('click', '.chat-item', function () {
    $('.chat-selected').removeClass('chat-selected');
    $(this).addClass('chat-selected');
    let chatTitle = $(this).find('.chat-title').text();
    // TODO 请求后台获取聊天信息
    selectChatRoom(chatTitle)
});

function delChatRoom(isCreate, dom) {
    if (isCreate) {
        if (confirm("创建者删除将会清空聊天记录！")){
            dom.remove();
        }else {

        }
    }else {
        dom.remove();
    }
}

$(document).on('click', '.chat-del', function () {
    // TODO 请求后端删除
    let delDom = $(this).parent('.chat-item')
    delChatRoom(true, delDom);
});

function hiddenModel() {
    // 隐藏模态框
    $('.overlay').css('z-index', '');
    $('.model').css('visibility', 'hidden');
}

function showModel() {
    // 显示模态框
    $('.overlay').css('z-index', '1');
    $('.model').css('visibility', 'visible');
}

function addChat() {
    let chatRoom = $('.model-input').val();
    if (chatRoom !== '') {
        $('.item-box').append(`<div class="chat-item">
                                <div class="chat-del"></div>
                                <div class="chat-title">${chatRoom}</div>
                                <div class="chat-bottom">
                                    <div class="chat-time">2023-06-29 09:45</div>
                                    <div class="chat-num">9999条对话</div>
                                </div>
                            </div>`);
        $('.model-input').val("");
    }else {
        alert("聊天室不能为空！！")
    }

}

$('.overlay').click(function () {
    hiddenModel()
});

$(".new-chat").click(function () {
    showModel()
});

$('.add').click(function () {
    // TODO 请求成功隐藏模态框，并添加聊天室
    hiddenModel();
    addChat()
});

$('.create').click(function () {
    // TODO 请求成功隐藏模态框，并添加聊天室
    hiddenModel();
    addChat()
});
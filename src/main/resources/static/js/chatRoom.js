var textInput;
var fileInput = `<div class="file-input" tabindex="0"></div>`;
// 全局文件数组，保存用户添加的文件
var fileArray = [];
// 全局已发送文件数组，保存已发送的文件，用于当文件发送失败时进行重新发送
var sendFileArray = [];
var msgPageIndex = 1;
var wsUrl = "";

var msgCount = 0;
var selectedChatRoomDom = null;

function getDateTime(len=19) {
    let curDate = new Date();  //获取当前时间
    let year = curDate.getFullYear();  //获取年份
    let month = curDate.getMonth() + 1;  //获取月份
    let day = curDate.getDate();  //获取日期
    let hour = curDate.getHours();  //获取小时
    let minute = curDate.getMinutes();  //获取分钟
    let second = curDate.getSeconds();  //获取秒钟

//调整格式
    month = month < 10 ? "0" + month : month;
    day = day < 10 ? "0" + day : day;
    hour = hour < 10 ? "0" + hour : hour;
    minute = minute < 10 ? "0" + minute : minute;
    second = second < 10 ? "0" + second : second;

    let dataTime = (year + "-" + month + "-" + day + " " + hour + ":" + minute + ":" + second).substring(0, len);

    return dataTime;
}

$('.user-info').text(`最近上线时间：${getDateTime()}`)

cocoMessage.config({
    duration: 2000,
});

// 获取cookie
function getCookie(name) {
    let cookieArr = document.cookie.split(";");
    for(let i = 0; i < cookieArr.length; i++) {
        let cookiePair = cookieArr[i].split("=");
        if(name === cookiePair[0].trim()) {
            return decodeURIComponent(cookiePair[1]);
        }
    }
    return "";
}

let ws = null;
function connect(room) {
    if (ws != null) {
        ws.close(1000, '切换聊天室')
    }
    // 获取 token，用于websocket连接认证
    let token = getCookie("token");
    ws = new WebSocket(`${wsUrl}${room}?token=${token}`);

    ws.onopen = function() {
        console.log(`聊天室-->${room}: 连接已经建立`);
        cocoMessage.success(2000, `聊天室-->${room}: 连接已经建立`)
    };

    ws.onmessage = function(evt) {
        acceptMsg(evt.data)
    };

    ws.onerror = function() {
        console.log('websocket 服务器异常')
        cocoMessage.error(2000, "websocket 服务器异常")
        // 重定向到登录页
        window.location.href = '/loginPage';
    };

    ws.onclose = function(evt) {
        if (evt.reason === '切换聊天室') {
            console.log(`聊天室-->${room}: 关闭当前连接`);
            // cocoMessage.info(1000, `聊天室-->${room}: 关闭当前连接`)
        } else {
            // 重定向到登录页
            window.location.href = '/loginPage';
        }
    };
}

$.ajax({
    url: '/getUserInfo/',
    type: 'post',
    contentType: false,
    processData: false,
    success: function (res) {
        if (res.code === 200) {
            let userInfoHtml = `${res.data.username}<span class="append-info">${res.data.email}</span>`
            $('.user-name').html(userInfoHtml);
            wsUrl = res.data.wsUrl;
            res.data.rooms.forEach(data => {
                let formattedDatetime = data.createTime.replace('T', ' ').substr(0, 19);
                $('.item-box').append(`<div class="chat-item">
                                <div class="chat-del"></div>
                                <div class="chat-title">${data.roomName}</div>
                                <div class="chat-bottom">
                                    <div class="chat-time">${formattedDatetime}</div>
                                    <div class="chat-num">0 条对话</div>
                                </div>
                            </div>`);
            })
        } else {
            // 重定向到登录页
            window.location.href = '/loginPage';
        }
    }
});

$('.contact').click(function () {
    window.open('https://www.doruo.cn/s/leaving', '_blank');
})

$(document).on('mouseenter', '.chat-item', function () {
    $(this).find('.chat-del').css('visibility', 'visible');
});

$(document).on('mouseleave', '.chat-item', function () {
    $(this).find('.chat-del').css('visibility', 'hidden');
});

function selectChatRoom(selectDom) {
    // 记录当前选中的聊天室，用于后续更新消息数量
    selectedChatRoomDom = selectDom;
    // 显示右边聊天框
    $('.right-panel').css('visibility', 'visible')
    $('.chat-selected').removeClass('chat-selected');
    // 添加点击被选中状态
    $(selectDom).addClass('chat-selected');
    // 获取当前聊天室标题
    let chatTitle = $(selectDom).find('.chat-title').text();
    // TODO 选择聊天室
    $('.right-title').html(chatTitle);
    $('.right-chatRoom').empty();
    // 切换聊天室将页码置为1
    msgPageIndex = 1;
    let formData = new FormData();
    formData.append("pageIndex", msgPageIndex);
    formData.append("roomName", chatTitle);
    loadingMsg(formData, $(selectDom).find('.chat-num')[0]);
    msgPageIndex++;
    // 添加后滚动条长度
    let afterScrollLength = $('.right-chatRoom').prop('scrollHeight');
    // 将滚动条滚动到没添加前的位置
    $('.right-chatRoom').scrollTop(afterScrollLength)
    connect(chatTitle);
}

$(document).on('click', '.chat-item-main', function () {
    selectChatRoom(this)
});

$(document).on('click', '.chat-item',function () {
    selectChatRoom(this)
});

function delChatRoom(isCreate, dom) {
    if (isCreate) {
        if (confirm("创建者删除将会清空聊天记录！")){
            dom.detach();
        }else {

        }
    }else {
        let roomName = $(dom).find('.chat-title').text();
        let formData = new FormData();
        formData.append("roomName", roomName);
        $.ajax({
            url: '/delChat/',
            type: 'post',
            data: formData,
            contentType: false,
            processData: false,
            success: function (res) {
                if (res.code === 200) {
                    cocoMessage.success(2000, res.data)
                    dom.detach();
                }else if(res.code === 201) {
                    cocoMessage.info(2000, res.data)
                }else {
                    // 重定向到登录页
                    window.location.href = '/loginPage';
                }
            },
            error:function (res) {
                // 重定向到登录页
                window.location.href = '/loginPage';
            }
        })

    }
}

$(document).on('click', '.chat-del', function (event) {
    event.stopPropagation()
    // TODO 请求后端删除
    let delDom = $(this).parent('.chat-item')
    delChatRoom(false, delDom);
});

function hiddenModel() {
    // 隐藏模态框
    $('.overlay').css('z-index', '');
    $('.model').css('visibility', 'hidden');
    $('.show-img').css('visibility', 'hidden');
}

function showModel() {
    // 显示模态框
    $('.overlay').css('z-index', '1');
    $('.model').css('visibility', 'visible');
}

function addChat() {
    let chatRoom = $('.model-input').val();
    let formData = new FormData();
    formData.append('roomName', chatRoom);
    if (chatRoom !== '') {
        $.ajax({
            url: '/addChat/',
            type: 'post',
            data: formData,
            contentType: false,
            processData: false,
            success: function (res) {
                if (res.code === 200) {
                    cocoMessage.success(2000, res.data)
                    $('.item-box').append(`<div class="chat-item">
                                <div class="chat-del"></div>
                                <div class="chat-title">${chatRoom}</div>
                                <div class="chat-bottom">
                                    <div class="chat-time">${getDateTime(19)}</div>
                                    <div class="chat-num">0 条对话</div>
                                </div>
                            </div>`);
                    $('.model-input').val("");
                }else if(res.code === 201) {
                    cocoMessage.info(2000, res.data)
                }else {
                    // 重定向到登录页
                    window.location.href = '/loginPage';
                }
            },
            error: function (res) {
                // 重定向到登录页
                window.location.href = '/loginPage';
            },
        })

    }else {
        cocoMessage.warning(2000, "聊天室不能为空！！")
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

$('#text-message').on('change', function () {
    if ($('#text-message').prop('checked')) {
        // 更改发送按钮属性
        $('.send-img').removeClass('file');
        $('.send-img').addClass('text');
        // 更改发送框
        fileInput = $('.file-input').detach();
        $('.message-input').prepend(textInput)
    }

});

$('#file-message').on('change', function () {
    if ($('#file-message').prop('checked')) {
        // 更改发送按钮属性
        $('.send-img').removeClass('text');
        $('.send-img').addClass('file');
        // 更改发送框
        textInput = $('.text-input').detach();
        $('.message-input').prepend(fileInput)
    }

});

$('.right-panel').on("dragenter", function (event) {
    $('.left-overlay').css('display', 'block');
    // 判断radio是否处于选中状态
    if ($('#text-message').prop('checked')) {
        $('#text-message').prop('checked', false);
        $('#file-message').prop('checked', true);
        // // 更改发送按钮属性
        $('.send-img').removeClass('text');
        $('.send-img').addClass('file');
        // 更改发送框
        textInput = $('.text-input').detach();
        $('.message-input').prepend(fileInput)

    }

});

$('.right-panel').on("dragover", function (event) {
    event.preventDefault();

});

$('.right-panel').on("dragleave", function (event) {
    if (!$(event.relatedTarget).closest('.right-panel').length) {
        $('.left-overlay').css('display', 'none');
    }
});

$('.right-panel').on("drop", function (event) {
    event.preventDefault();

    const files = Array.from(event.originalEvent.dataTransfer.files);
    // 定义一个数组来存储不重复的文件
    const uniqueFiles = [];
    // 遍历文件列表，将不重复的文件添加到 uniqueFiles 中
    files.forEach(file => {
        if (!uniqueFiles.find(f => f.name === file.name && f.size === file.size)) {
            uniqueFiles.push(file);
        }
    });
    const finalFiles = []
    // 遍历不重复文件数组，将已经添加过的文件从中去除
    uniqueFiles.forEach(file => {
        if (!fileArray.find(f => f.name === file.name && f.size === file.size)) {
            finalFiles.push(file)
        }
    });

    if (finalFiles && finalFiles.length > 0) {
        finalFiles.forEach(file => {
            // 将文件添加到全局数组中
            fileArray.push(file)
            const reader = new FileReader();
            reader.onload = function (event) {
                // 处理图片类文件
                if (file.type.indexOf("image") === 0) {
                    $('.file-input').append(`<div class="file-item">
                                                    <div class="file-del"></div>
                                                    <img src="${event.target.result}" alt="${file.name}" class="file-preview" draggable="false">
                                                    <span class="file-name" title="${file.name}">${file.name}</span>
                                                </div>`);
                } else {
                    $('.file-input').append(`<div class="file-item">
                                                    <div class="file-del"></div>
                                                    <img src="../../static/img/unknown.png" alt="${file.name}" class="file-preview" draggable="false">
                                                    <span class="file-name" title="${file.name}">${file.name}</span>
                                                </div>`)
                }
            };
            reader.readAsDataURL(file);
        });
        $('.file-input').focus();

    }
    $('.left-overlay').css('display', 'none');
});

$(document).on('click', '.file-del', function () {
    $(this).parent('.file-item').detach();
    let fileName = $(this).siblings('.file-name').text();
    fileArray = fileArray.filter(file => file.name !== fileName);
});

$(document).on('mousewheel', '.file-input', function(e) {
    // 设置鼠标移动的距离
    let moveX = e.originalEvent.deltaY;

    // 控制容器横向滚动
    $(this).scrollLeft($(this).scrollLeft() + moveX);
});

/**
 *
 * @param dom:  元素的class或者id
 * @return:
 * @Author: Junior
 * @Date: 2023/6/6
 */
function changeTextareaHeight(dom) {
    let textarea = document.querySelector(dom)
    let _scrollHeight = textarea.scrollHeight;
    if (dom === '.text-input') {
        // 最大显示五行
        if (_scrollHeight / 21 <= 5){
            textarea.style.height = `${_scrollHeight}px`;
        }else {
            textarea.style.height = `105px`;
        }
    }
}

$('.text-input').on('input', function () {
    changeTextareaHeight('.text-input')
});

function getConvertSize(fileSize) {
    let convertSize = '';
    let M = 1048576;
    let K = 1024;
    if (fileSize < M) {
        convertSize = `${(fileSize / K).toFixed(2)} KB`;
    } else {
        convertSize = `${(fileSize / M).toFixed(2)} MB`
    }
    return convertSize
}

/**
 * 将 msg 中的连接转为可以点击的连接
 * @Author: Junior
 * @Date: 2023/10/20
 * @param msg
 */
function getConvertMsg(msg) {
    let urlRegex = /(http:\/\/|https:\/\/|www\.)([\w-]+\.)+[\w-]+(\/[\w- .\/?%&=]*)?/gi;
    let htmlRegex = /<(?!\/?a(?=>|\s.*>))([^\s<>]+)[^<>]*>/gi;

    // 将消息中http连接转换为 <a> 标签
    let replaceUrlText = msg.replace(urlRegex, function(url) {
        let httpRegex = /^(http:\/\/|https:\/\/)/;
        let wholeUrl = "";
        if (!httpRegex.test(url)) {
            // 如果不是以http://或https://开头，则在最前面添加http://
            wholeUrl = 'http://' + url;
        }else {
            wholeUrl = url;
        }
        return '<a href="' + wholeUrl + '" target="_blank">' + url + '</a>';
    });

    // 将除了a标签的其他所有html标签转化为实体
    return replaceUrlText.replace(htmlRegex, function (match) {
        return '&lt;' + match.substring(1, match.length - 1) + '&gt;';
    });
}

function insertText(horizontal, vertical, user, email, sendMsg) {
    let convertMsg = getConvertMsg(sendMsg);
    let $rightChatRoom = $('.right-chatRoom')
    if (horizontal === 'left') {
        if (vertical === 'head') {
            // 往前添加靠左的气泡
            $rightChatRoom.prepend(`<div class="bubble">
                                        <div class="bubble-user-box">
                                            <span class="bubble-user">${user}</span>
                                            <span class="append-info">${email}</span>
                                        </div>
                                        <div class="bubble-info-box">
                                            <div class="bubble-info">
                                                <span class="bubble-text"></span>
                                            </div>
                                        </div>
                                    </div>`);
            // 获取最后添加的气泡
            let lastBubble = $($rightChatRoom.children().first()).find('.bubble-text')[0];
            lastBubble.innerHTML = convertMsg
        } else if (vertical === 'end'){
            // 往后添加靠左的气泡
            $rightChatRoom.append(`<div class="bubble">
                                        <div class="bubble-user-box">
                                            <span class="bubble-user">${user}</span>
                                            <span class="append-info">${email}</span>
                                        </div>
                                        <div class="bubble-info-box">
                                            <div class="bubble-info">
                                                <span class="bubble-text"></span>
                                            </div>
                                        </div>
                                    </div>`);
            // 获取最后添加的气泡
            let lastBubble = $($rightChatRoom.children().last()).find('.bubble-text')[0];
            lastBubble.innerHTML = convertMsg
        }
    }else if (horizontal === 'right') {
        if (vertical === 'head') {
            // 往前添加靠右的气泡
            $rightChatRoom.prepend(`<div class="bubble">
                                        <div class="bubble-user-box-right">
                                            <span class="bubble-user">${user}</span>
                                            <span class="append-info">${email}</span>
                                        </div>
                                        <div class="bubble-info-box-right">
                                            <div class="bubble-info-right">
                                                <span class="bubble-text"></span>
                                            </div>
                                        </div>
                                    </div>`);
            // 获取最后添加的气泡
            let lastBubble = $($rightChatRoom.children().first()).find('.bubble-text')[0];
            lastBubble.innerHTML = convertMsg
        } else if (vertical === 'end'){
            // 往后添加靠右的气泡
            $rightChatRoom.append(`<div class="bubble">
                                        <div class="bubble-user-box-right">
                                            <span class="bubble-user">${user}</span>
                                            <span class="append-info">${email}</span>
                                        </div>
                                        <div class="bubble-info-box-right">
                                            <div class="bubble-info-right">
                                                <span class="bubble-text"></span>
                                            </div>
                                        </div>
                                    </div>`)
            // 获取最后添加的气泡
            let lastBubble = $($rightChatRoom.children().last()).find('.bubble-text')[0];
            lastBubble.innerHTML = convertMsg
        }
    }
    return $rightChatRoom.children().last();
}

function insertImage(horizontal, vertical, user, email, sendMsg, file) {
    let $rightChatRoom = $('.right-chatRoom')
    if (horizontal === 'left') {
        if (vertical === 'head') {
            // 往前添加靠左的气泡
            $rightChatRoom.prepend(`<div class="bubble" name="${file.name}">
                                        <div class="bubble-user-box">
                                            <span class="bubble-user">${user}</span>
                                            <span class="append-info">${email}</span>
                                        </div>
                                        <div class="bubble-info-box">
                                            <div class="bubble-info-file">
                                                <img class="bubble-image" src="${sendMsg}" draggable="false" alt="">
                                            </div>
                                        </div>
                                    </div>`);
        }else if (vertical === 'end') {
            // 往后添加靠左的气泡
            $rightChatRoom.append(`<div class="bubble" name="${file.name}">
                                <div class="bubble-user-box">
                                    <span class="bubble-user">${user}</span>
                                    <span class="append-info">${email}</span>
                                </div>
                                <div class="bubble-info-box">
                                    <div class="bubble-info-file">
                                        <img class="bubble-image" src="${sendMsg}" draggable="false" alt="">
                                    </div>
                                </div>
                            </div>`);
        }
    }else if (horizontal === 'right') {
        if (vertical === 'head') {
            // 往前添加靠右的气泡
            $rightChatRoom.prepend(`<div class="bubble" name="${file.name}">
                                        <div class="bubble-user-box-right">
                                            <span class="bubble-user">${user}</span>
                                            <span class="append-info">${email}</span>
                                        </div>
                                        <div class="bubble-info-box-right">
                                            <div class="bubble-info-right-file">
                                                <img class="bubble-image" src="${sendMsg}" draggable="false" alt="">
                                            </div>
                                        </div>
                                    </div>`);
        }else if (vertical === 'end') {
            // 往后添加靠右的气泡
            $rightChatRoom.append(`<div class="bubble" name="${file.name}">
                                    <div class="bubble-user-box-right">
                                        <span class="bubble-user">${user}</span>
                                        <span class="append-info">${email}</span>
                                    </div>
                                    <div class="bubble-info-box-right">
                                        <div class="bubble-info-right-file">
                                            <img class="bubble-image" src="${sendMsg}" draggable="false" alt="">
                                        </div>
                                    </div>
                                </div>`)
        }
    }
    return $rightChatRoom.children().last();
}

function insertOthers(horizontal, vertical, user, email, sendMsg, file) {
    let fileSize = file.size;
    let convertSize = getConvertSize(file.size);

    let $rightChatRoom = $('.right-chatRoom');
    if (horizontal === 'left') {
        if (vertical === 'head') {
            // 往前添加靠左的气泡
            $rightChatRoom.prepend(`<div class="bubble" name="${file.name}">
                                        <div class="bubble-user-box">
                                            <span class="bubble-user">${user}</span>
                                            <span class="append-info">${email}</span>
                                        </div>
                                        <div class="bubble-info-box">
                                            <div class="bubble-info-file">
                                                <div class="bubble-file" name="${sendMsg}">
                                                    <div class="bubble-file-info">
                                                        <div class="bubble-file-name" title="${file.name}">${file.name}</div>
                                                        <div class="bubble-file-size">${convertSize}</div>
                                                    </div>
                                                    <img class="bubble-file-img" src="../../static/img/unknown.png" alt="" draggable="false">
                                                </div>
                                            </div>
                                        </div>
                                    </div>`);
        }else if (vertical === 'end') {
            // 往后添加靠右的气泡
            $rightChatRoom.append(`<div class="bubble" name="${file.name}">
                                    <div class="bubble-user-box">
                                        <span class="bubble-user">${user}</span>
                                        <span class="append-info">${email}</span>
                                    </div>
                                    <div class="bubble-info-box">
                                        <div class="bubble-info-file">
                                            <div class="bubble-file" name="${sendMsg}">
                                                <div class="bubble-file-info">
                                                    <div class="bubble-file-name" title="${file.name}">${file.name}</div>
                                                    <div class="bubble-file-size">${convertSize}</div>
                                                </div>
                                                <img class="bubble-file-img" src="../../static/img/unknown.png" alt="" draggable="false">
                                            </div>
                                        </div>
                                    </div>
                                </div>`)
        }

    } else if (horizontal === 'right') {
        if (vertical === 'head') {
            // 往前添加靠右的气泡
            $rightChatRoom.prepend(`<div class="bubble" name="${file.name}">
                                    <div class="bubble-user-box-right">
                                        <span class="bubble-user">${user}</span>
                                        <span class="append-info">${email}</span>
                                    </div>
                                    <div class="bubble-info-box-right">
                                        <div class="bubble-info-right-file">
                                            <div class="bubble-file" name="${sendMsg}">
                                                <div class="bubble-file-info">
                                                    <div class="bubble-file-name" title="${file.name}">${file.name}</div>
                                                    <div class="bubble-file-size">${convertSize}</div>
                                                </div>
                                                <img class="bubble-file-img" src="../../static/img/unknown.png" alt="" draggable="false">
                                            </div>
                                        </div>
                                    </div>
                                </div>`)

        }else if (vertical === 'end') {
            // 往后添加靠右的气泡
            $rightChatRoom.append(`<div class="bubble" name="${file.name}">
                                    <div class="bubble-user-box-right">
                                        <span class="bubble-user">${user}</span>
                                        <span class="append-info">${email}</span>
                                    </div>
                                    <div class="bubble-info-box-right">
                                        <div class="bubble-info-right-file">
                                            <div class="bubble-file" name="${sendMsg}">
                                                <div class="bubble-file-info">
                                                    <div class="bubble-file-name" title="${file.name}">${file.name}</div>
                                                    <div class="bubble-file-size">${convertSize}</div>
                                                </div>
                                                <img class="bubble-file-img" src="../../static/img/unknown.png" alt="" draggable="false">
                                            </div>
                                        </div>
                                    </div>
                                </div>`)
        }
    }
    return $rightChatRoom.children().last();
}

/**
 *
 * @return:
 * @Author: Junior
 * @Date: 2023/6/6
 * @param horizontal
 * @param vertical
 * @param user
 * @param email
 * @param sendMsg
 * @param sendType
 * @param file
 */
function drawBubble(horizontal, vertical, user, email, sendMsg, sendType, file) {
    let thisBubble;
    if (sendType === 'text') {
        thisBubble = insertText(horizontal, vertical, user, email, sendMsg);
    }else if (sendType === 'image') {
        thisBubble = insertImage(horizontal, vertical, user, email, sendMsg, file);
    }else if (sendType === 'others') {
        thisBubble = insertOthers(horizontal, vertical, user, email, sendMsg, file)
    }
    return thisBubble;
}

$(document).on('click', '.bubble-image', function () {
    // 显示大图
    let imgSrc = $(this).attr('src')
    $('.show-img').attr('src', imgSrc)
    $('.overlay').css('z-index', '1');
    $('.show-img').css('visibility', 'visible');
});

function isSending(dom) {
    // 移除发送失败标志
    $(dom).find('.bubble-error').remove();
    // 添加正在发送标志
    if ($(dom).find('.bubble-loading').length === 0)
        $(dom).find('.bubble-info-box-right').prepend(`<img src="../../static/img/loading.png" class="bubble-loading">`)
}

function sendSuccess(dom) {
    // 移除正在发送标志
    $(dom).find('.bubble-loading').remove();
}
function sendError(dom) {
    // 移除正在发送标志
    $(dom).find('.bubble-loading').remove();
    // 添加发送失败标志
    if($(dom).find('.bubble-error').length === 0)
        $(dom).find('.bubble-info-box-right').prepend(`<img src="../../static/img/error.png" class="bubble-error">`)
}

$(document).on('click', '.bubble-error', function () {
    let bubbleDom = $(this).parents('.bubble')
    let bubbles = [bubbleDom[0]]
    let formData = new FormData();
    // 发送失败消息重新发送
    if (bubbleDom.find('.bubble-info-right-file').length > 0) {
        // 重发文件
        let fileName = bubbleDom.attr('name');
        let file = sendFileArray.find(f => f.name === fileName);
        // 更改为发送状态
        isSending(bubbleDom);
        // 使用ajax发送文件
        formData.append('index', 0);
        formData.append('file', file);
        formData.append('roomName', $('.right-title').text());
        ajaxFile(formData, bubbles);


    }else if (bubbleDom.find('.bubble-info-right').length > 0) {
        // 重发文字
        let sendMsg = bubbleDom.find('.bubble-text').text();
        // 去除发送失败标志
        $(bubbleDom[0]).find('.bubble-error').remove();
        websocketSend(sendMsg,bubbleDom[0])
    }
});

function websocketSend(sendMsg, bubble) {
    if (ws.readyState === 1) {
        ws.send(sendMsg);
        msgCount += 1;
        $(selectedChatRoomDom).find('.chat-num').text(`${msgCount} 条对话`);
    } else {
        sendError(bubble)
    }
}

function sendMsg() {
    let user = $(".user-name").contents().filter(function () {
                    return this.nodeType === 3; // 筛选文本节点
                }).text().trim();
    let email = $(".user-name").contents().filter(function () {
                    return this.nodeType === 1; // 筛选element节点
                }).text().trim();
    let sendType = 'text';
    let sendMsg = $('.text-input').val();
    let file = '';
    let thisBubble = drawBubble('right', 'end', user, email,  sendMsg, sendType, file)
    $('.text-input').val('');
    // todo 向websocket发送请求
    websocketSend(sendMsg, thisBubble);

    // 发消息后滚动到最底部
    $('.right-chatRoom').animate({scrollTop:$('.right-chatRoom').prop('scrollHeight')}, 'slow');
    // $('.right-chatRoom').scrollTop($('.right-chatRoom').prop('scrollHeight'));
}

function ajaxFile(formData, bubbles) {
    let copyBubbles = bubbles.slice();
    $.ajax({
        url: '/uploadFile/',
        type: 'post',
        data: formData,
        contentType: false,
        processData: false,
        success: function (res) {
            if (res.code) {
                if (res.code === 200) {
                    sendSuccess(bubbles[res.data]);
                    msgCount += 1;
                    $(selectedChatRoomDom).find('.chat-num').text(`${msgCount} 条对话`);
                } else {
                    sendError(bubbles[res.data]);
                }
                copyBubbles.splice(res.data, 1);
            } else {
                // 重定向到登录页
                window.location.href = '/loginPage';
            }

        },
        error: function () {
            copyBubbles.forEach(bubble => {
                sendError(bubble)
            })
        }
    });
}

function sendFile() {
    let index = 0;
    let user = $(".user-name").contents().filter(function () {
        return this.nodeType === 3; // 筛选文本节点
    }).text().trim();
    let email = $(".user-name").contents().filter(function () {
        return this.nodeType === 1; // 筛选element节点
    }).text().trim();
    let bubbles = [];
    fileArray.forEach(file => {
        const reader = new FileReader();
        reader.onload = function (event) {
            if (file.type.indexOf("image") === 0) {
                bubbles.push(drawBubble('right', 'end', user, email, event.target.result, 'image', {name: file.name}));
            } else {
                bubbles.push(drawBubble('right', 'end', user, email, '../../static/img/unknown.png', 'others', file));
            }
            // 添加正在发送标志
            isSending(bubbles[index]);
            // 将文件添加到已发送文件数组中
            if (!sendFileArray.find(f => f.name === file.name && f.size === file.size)) {
                sendFileArray.push(file);
            }

            // todo ajax发送文件，发送成功去除正在发送标志，发送失败添加发送失败标志
            let formData = new FormData();
            formData.append('index', index);
            formData.append('file', file);
            formData.append('roomName', $('.right-title').text());
            // 发送文件
            ajaxFile(formData, bubbles)

            index++;
            // 发消息后滚动到最底部
            $('.right-chatRoom').animate({scrollTop:$('.right-chatRoom').prop('scrollHeight')}, 'slow');
            // $('.right-chatRoom').scrollTop($('.right-chatRoom').prop('scrollHeight'));
        };
        reader.readAsDataURL(file);
    });
    // 点击发送之后，将输入的文件清空
    fileArray = [];
    $('.file-input').empty();
}

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function send() {
    // 发送文字
    if ($('.send-img').hasClass('text')) {
        sendMsg();
        // 发送文件
    }else if ($('.send-img').hasClass('file')) {
        sendFile();
    }
}

$('.send-img').click(function () {
    send();
});

$(document).on("keydown", "textarea", function(e) {
    // 取消默认回车换行改为消息发送，添加Ctrl+Enter组合键换行
    if ((e.keyCode === 13 && e.ctrlKey) || (e.keyCode === 13 && e.metaKey)) {
        e.preventDefault();
        var value = $(this).val();
        var start = this.selectionStart;
        var end = this.selectionEnd;
        $(this).val(value.slice(0, start) + "\n" + value.slice(end));
        this.selectionStart = this.selectionEnd = start + 1;
        changeTextareaHeight('.text-input');
    }else if (e.keyCode === 13) {
        e.preventDefault();
        send();
    }
});

$(document).on('keydown', '.file-input', function (e) {
    if (e.keyCode === 13) {
        e.preventDefault();
        send();
    }
})

function loadingMsg(formData, dom) {
    $.ajax({
        url: 'loadingMsg',
        type: 'post',
        data: formData,
        async: false,
        contentType: false,
        processData: false,
        success:function (res) {
            if (res.code === 200) {
                console.log(res.data)
                let allData = res.data;
                if (dom != null) {
                    $(dom).text(allData.total + ' 条对话');
                    // 获取当前聊天室消息数量
                    msgCount = parseInt(allData.total);
                }
                // 添加聊天气泡
                allData.list.forEach(data => {
                    if (data.msgType === 'text') {
                        drawBubble(data.position, 'head', data.username, data.sender, data.content, data.msgType, '');
                    }else if (data.msgType === 'image') {
                        let fileInfo = {name: data.filename}
                        drawBubble(data.position, 'head', data.username, data.sender, data.content, data.msgType, fileInfo);
                    }else if (data.msgType === 'others') {
                        let fileInfo = {name: data.filename, size: data.filesize}
                        drawBubble(data.position, 'head', data.username, data.sender, data.content, data.msgType, fileInfo);
                    }

                });
            }else {
                // 重定向到登录页
                window.location.href = '/loginPage';
            }
        },
        error: function (res) {
            // 重定向到登录页
            window.location.href = '/loginPage';
        }

    })
}

$('.right-chatRoom').scroll(function () {
    // todo 向后台拉取历史消息
    let roomName = $('.right-title').text();
    let formData = new FormData();
    // 添加前滚动条长度
    let beforeScrollLength = $(this).prop('scrollHeight');
    let allMsgNum = 0;
    if ($(this).scrollTop() === 0) {

        formData.append("pageIndex", msgPageIndex);
        formData.append("roomName", roomName);
        loadingMsg(formData, null);
        // 加载完一页之后自动跳转到下一页
        msgPageIndex++;

        // 添加后滚动条长度
        let afterScrollLength = $(this).prop('scrollHeight');
        // 将滚动条滚动到没添加前的位置
        $(this).scrollTop(afterScrollLength - beforeScrollLength)
    }
});

// 模拟接受websocket消息
function acceptMsg(res) {

    let dataJson = JSON.parse(res).data;
    // 添加前滚动条位置
    let beforeScrollLength = $('.right-chatRoom').scrollTop();
    // 更新消息数量
    msgCount++;
    $(selectedChatRoomDom).find('.chat-num').text(`${msgCount} 条对话`);
    // 通知提示
    suportNotify(dataJson.sender, dataJson.content, dataJson.type)
    // 绘制聊天气泡
    if (dataJson.type === 'text') {
        drawBubble('left', 'end', dataJson.username, dataJson.sender, dataJson.content, dataJson.type, '');
    }else if (dataJson.type === 'image') {
        drawBubble('left', 'end', dataJson.username, dataJson.sender, dataJson.content, dataJson.type, {name:dataJson.name});
    }else if (dataJson.type === 'others') {
        let file = {name: dataJson.name, size: dataJson.size}
        drawBubble('left', 'end', dataJson.username, dataJson.sender, dataJson.content, dataJson.type, file);
    }

    // 添加后滚动条长度
    let afterScrollLength = $('.right-chatRoom').prop('scrollHeight');
    // 滚动范围较小将聚焦到底部
    if (afterScrollLength - beforeScrollLength < 1000) {
        $('.right-chatRoom').animate({scrollTop: afterScrollLength}, 'slow');
    }


}

$(document).on('click', '.bubble-file', function () {
    let downUrl = $(this).attr('name');
    let sp = 'alias='
    let encodeDownUrl = downUrl.split(sp)[0] + sp + encodeURIComponent(downUrl.split(sp)[1])
    window.open(encodeDownUrl, '_blank')
});


//判断浏览器是否支持Web Notifications API
function suportNotify(title, msg, type) {
    if (window.Notification) {
        // 支持
        console.log("支持" + "Web Notifications API");
        //如果支持Web Notifications API，再判断浏览器是否支持弹出实例
        showMess(title, msg, type)
    } else {
        // 不支持
        alert("不支持 Web Notifications API");
    }
}

//判断浏览器是否支持弹出实例
function showMess(title, msg, type) {
        console.log('1：' + Notification.permission);
        //如果支持window.Notification 并且 许可不是拒绝状态
        if (window.Notification && Notification.permission !== "denied") {
            //Notification.requestPermission这是一个静态方法，作用就是让浏览器出现是否允许通知的提示
            Notification.requestPermission(function (status) {
                console.log('2: ' + status);
                //如果状态是同意
                if (status === "granted") {
                    let body = '';
                    if (type === 'text') {
                        body = msg
                    } else {
                        body = "【文件信息不支持预览，请点击跳回网页查看！！】"
                    }
                    var m = new Notification(`用户${title}发送一条信息`, {
                        body: body, //消息体内容
                        icon: "../static/img/notice.png", //消息图片
                        tag: "msg",
                        renotify: true,
                        timeout: 3000
                    });
                    // 延时3秒关闭
                    setTimeout(function () {
                        m.close();
                    }, 3000);
                    m.onclick = function () { //点击当前消息提示框后，跳转到当前页面
                        window.focus();
                    }
                } else {
                    alert('当前浏览器不支持弹出消息')
                }
            });
        }
}

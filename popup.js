let add = document.getElementById('add_url');
let close = document.getElementById('close_input');
let accept = document.getElementById('accept_input');
let input = document.getElementById('input_url');
let urlList = document.getElementById('url_list');
let port = chrome.runtime.connect();

function getUrlDiv(url) {
    let urlDiv = document.createElement('div');
    urlDiv.className = 'url_div';
    urlDiv.id = 'url_div';
    urlDiv.innerHTML = `<span>${url}</span>`;
    
    let remove = document.createElement('img');
    remove.alt = 'remove';
    remove.className = 'remove_url';
    remove.id = 'remove_url';
    remove.src = './icons/input/close.svg';

    remove.addEventListener('click', async function() {
        await port.postMessage({'removeURL': url});
        urlList.removeChild(this.parentNode)
    })
    
    urlDiv.appendChild(remove);
    
    return urlDiv;
}

port.onMessage.addListener(function(request, response, sendResponse) {
    if(request.data !== undefined) {
        for(let i in request.data) {
            urlList.appendChild(getUrlDiv(request.data[i]));
        }
    }
})

add.onclick = async function() {
    this.style.display = "none";
    input.style.display = "block";
    close.style.display = "block";
    accept.style.display = "block";
}

close.onclick = function() {
    this.style.display = "none";
    input.style.display = "none";
    accept.style.display = "none";
    add.style.display = "block";

    input.value = '';
}

accept.onclick = async function() {
    this.style.display = "none";
    input.style.display = "none";
    close.style.display = "none";
    add.style.display = "block";

    let url = input.value;
    let message = { 'blockURL':url };
    urlList.appendChild(getUrlDiv(new URL(url).hostname));

    await processURL(message);
}

function processURL(message) {
    return new Promise(function(resolve, reject) {
        port.postMessage(message);
    })
}

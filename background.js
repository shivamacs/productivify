let blockedURLs = [];
const TIME_ALLOWED_PER_DAY_IN_SECONDS = 10;

chrome.runtime.onConnect.addListener(function(port) {
    port.onMessage.addListener(async function(request) {
        if(request.blockURL !== undefined) {
            let dataObj = {
                date: getCurrentDate(),
                timeSpent: 0
            };
    
            let url = getHostname(request.blockURL);
    
            await saveToStorage(url, dataObj);
            blockedURLs.push(url);
        }

        if(request.removeURL !== undefined) {
            await unblockURL(request.removeURL);
            blockedURLs = blockedURLs.filter(function(item) {
                return item !== request.removeURL
            })
        }
    })

    port.postMessage({data: blockedURLs})
})

async function startExtension() {
    blockedURLs = await getAllKeys();

    (async function pollToGetCurrentTab() {
        let tab = await getCurrentTab();
        
        if(tab !== undefined) {
            let url = getHostname(tab.url);

            if(blockedURLs.indexOf(url) !== -1) {
                let result = await getFromStorage(url);

                if(await shouldBeBlocked(result, tab) === false) {

                    let resultDate = Date.parse(result.date);
                    resultDate = new Date(resultDate);

                    let currentDate = new Date();
                    currentDate.setHours(0, 0, 0, 0);

                    await setBadgeText((TIME_ALLOWED_PER_DAY_IN_SECONDS - 1 - result.timeSpent) + '');
                    if (resultDate.getTime() === currentDate.getTime()) {
                        result.timeSpent++;
                        await shouldBeBlocked(result, tab);
                    } else {
                        result.date = getCurrentDate();
                        result.timeSpent = 1;
                    }

                    await saveToStorage(url, result);
                }
            } else {
                await setBadgeText('');
            }
        }
        
        setTimeout(pollToGetCurrentTab, 1000);
    })();
}

async function shouldBeBlocked(result, tab) {
    let resultDate = Date.parse(result.date);
    resultDate = new Date(resultDate);
    let currentDate = new Date();

    currentDate.setHours(0, 0, 0, 0);

    if (resultDate.getTime() === currentDate.getTime()) {
        if (result.timeSpent >= TIME_ALLOWED_PER_DAY_IN_SECONDS) {
            alert("Access time limit reached for this site. Kindly focus on your work.");
            await closeTab(tab.id);
            return true;
        }
    }

    return false;
}

function unblockURL(key) {
    return new Promise(function(resolve, reject) {
        chrome.storage.sync.remove([key], function() {
            resolve();
        })
    })
}

function getHostname(url) {
    return new URL(url).hostname;
}

function getCurrentDate() {
    let date = new Date();
    date.setHours(0, 0, 0, 0);
    return date.toJSON();
}

function getCurrentTab() {
    return new Promise(function(resolve, reject) {
        chrome.tabs.query({ currentWindow: true, active: true }, function (tabArray) { 
            resolve(tabArray[0]); 
        });
    })
}

function closeTab(tabId) {
    return new Promise(function(resolve, reject) {
        chrome.tabs.remove(tabId, function() {
            resolve();
        });
    });
}

function saveToStorage(key, dataObj) {
    return new Promise(function(resolve, reject) {
        chrome.storage.sync.set({ [key]: dataObj }, function() {
            resolve();
        })
    })
}

function getFromStorage(key) {
    return new Promise(function(resolve, reject) {
        chrome.storage.sync.get([key], function(result) {
            resolve(result[key]);
        });
    })
}

function clearStorage() {
    return new Promise((resolve, reject) => {
        chrome.storage.sync.clear(function () {
            resolve()
        });
    })
}

function getAllKeys() {
    return new Promise(function(resolve, reject) {
        chrome.storage.sync.get(null, function(items) {
            let allKeys = Object.keys(items);
            resolve(allKeys);
        })
    })
}

function setBadgeText(text) {
    return new Promise(function(resolve, reject) {
        chrome.browserAction.setBadgeText({ text: text }, function() {
            resolve();
        });
    })
}

startExtension();
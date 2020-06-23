chrome.tabs.query({'active': true, 'windowId': chrome.windows.WINDOW_ID_CURRENT},
  function(tabs){
    var base_url = tabs[0].url.match(/^[\w-]+:\/{2,}\[?([\w\.:-]+)\]?(?::[0-9]*)?/)[1];
     
    chrome.storage.sync.get(base_url, function(result){
      if(result[base_url] == null){
        document.getElementById("main_memo_contents").innerHTML = "(저장된 개인 메모가 없습니다.)";
      }
      else
        document.getElementById("main_memo_contents").innerHTML = result[base_url];
    });
  }
);
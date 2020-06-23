chrome.tabs.query({'active': true, 'windowId': chrome.windows.WINDOW_ID_CURRENT},
   function(tabs){
     var base_url = tabs[0].url.match(/^[\w-]+:\/{2,}\[?([\w\.:-]+)\]?(?::[0-9]*)?/)[1];
     var header_text = base_url + " 개인 메모";
     document.getElementById("main_logo").innerHTML = header_text;
   }
);
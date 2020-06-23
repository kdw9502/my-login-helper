document.addEventListener("DOMContentLoaded", function() {
  document.getElementById("memo_edit_complete").addEventListener('click', function(){
    chrome.tabs.query({'active': true, 'windowId': chrome.windows.WINDOW_ID_CURRENT},
      function(tabs){
        var base_url = tabs[0].url.match(/^[\w-]+:\/{2,}\[?([\w\.:-]+)\]?(?::[0-9]*)?/)[1];
        var memo_content = document.getElementById("text_memo_box").value;
        
        chrome.storage.sync.set({[base_url] : memo_content}, function(){
          alert("Saved " + base_url + " : " + memo_content + "!");
        });
      }
    );
  });
});
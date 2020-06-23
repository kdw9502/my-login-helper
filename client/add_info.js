document.addEventListener("DOMContentLoaded", function(){
  document.getElementById("info_add_complete").addEventListener('click', function(){
    chrome.tabs.query({'active': true, 'windowId': chrome.windows.WINDOW_ID_CURRENT},
      function(tabs){
        var base_url = tabs[0].url.match(/^[\w-]+:\/{2,}\[?([\w\.:-]+)\]?(?::[0-9]*)?/)[1];
        upper_case_flag = document.getElementById("upper_case").checked;
        lower_case_flag = document.getElementById("lower_case").checked;
        special_flag = document.getElementById("special").checked;
        password_len = document.getElementById("min_len").value;
        
        post_api(base_url, lower_case_flag, upper_case_flag, special_flag, password_len)
          .then(function (response) {
            if (response.ok)
              return response.json();
            else
              return response.body.toString();
          })
          .then(function (result) {
            console.log(result);
          })
          .then(function(){
            alert("Added Info!")
          });
      }
    );
  });
});

async function post_api(url, lower, upper, special, length) {
  let base_url = "https://vyueat628d.execute-api.us-east-1.amazonaws.com/default/login_helper";
  const settings = {
      method: 'POST',
      body: JSON.stringify({"url": url, "lower": lower, "upper": upper, "special": special, "length": length}),
      // mode: 'no-cors'
  };
  return await fetch(base_url, settings);
}
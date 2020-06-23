var inputs = document.getElementsByTagName("input");
var buttons = document.getElementsByTagName("button");
var tag_id;
var button_id;
var login_page_flag = 0;
var current_url;
var user_input;

var lower_case_flag = false;
var upper_case_flag = false;
var number_flag = false;
var special_flag = false;
var password_len = 0;

var is_data_flag = false;
var new_pwd_placeholder = "";
var new_password = "";

//check if Login Page
for (var i=0,iLen=inputs.length; i<iLen; i++) {
  if(inputs[i].type == "password"){
    tag_id = inputs[i].id;
    login_page_flag = 1;
    console.log(tag_id);
    //alert("This is Login Page!");
    break;
  }
}

if(login_page_flag){
  var subdomain = location.host.split('.')[1] ? location.host.indexOf('.') : false;
  if(subdomain){ //subdomain is starting index of subdomain when exists
    host = location.host.substr(subdomain + 1, location.host.length - subdomain - 1);
    current_url = location.protocol + "//*." + host + "/" + location.pathname.split('/')[1];;
  }
  else{
    current_url = location.protocol + "//" + location.host + "/" + location.pathname.split('/')[1];
  }
  console.log(current_url);

  //get request with url
  get_api(current_url)
    .then(function (response) {
        if (response.ok){
          is_data_flag = true;
          return response.json();
        }
        else{
          console.log(response.body.toString());
          return -1;
        }
    })
    .then(function (result) {
        console.log(result);
        if(result != -1){
          var tmp = result["main"]["pass_types"][0];
          if(tmp["lower"])  new_pwd_placeholder += "소문자, ";
          if(tmp["upper"])  new_pwd_placeholder += "대문자, ";
          if(tmp["special"]) new_pwd_placeholder += "특수문자, ";
          new_pwd_placeholder += ("최소 " + result["main"]["min_len"].toString() + "자");
        }
    })
    .then(function(){
      if(is_data_flag){ //저장된 내용 있으면 그에 맞게 placeholder를 바꿔줌
        console.log(tag_id)
        document.getElementById(tag_id).placeholder = new_pwd_placeholder;
      }
      else{ //저장된 내용 없으면 password의 keyboard 입력을 new_password에 저장
        //alert("MyLoginHelper: 최초 사용자입니다! 로그인하여 정보를 제공해주세요.");
        document.getElementById(tag_id).placeholder = "MyLoginHelper: 최초 로그인";
        console.log(tag_id);

        //var target = document.getElementById(tag_id);
        //console.log(target.nodeType);

        document.getElementById(tag_id).addEventListener('keypress', function(e){
          if(e.key == "Enter"){
            login(new_password);
          }
          else{
            new_password += e.key;
            console.log(new_password);
          }
        }, false);
        document.getElementById(tag_id).addEventListener('keydown', function(e){
          if(e.keyCode == 8){ //if backspace pressed
            new_password = new_password.substring(0, new_password.length - 1); //delete last word
            console.log(new_password);
          }
        }, false);
        /*for (var i=0,iLen=inputs.length; i<iLen; i++) {
          if(inputs[i].type == "button"){
            console.log("**")
            document.getElementById(inputs[i]).onclick = login(new_password);
          }
        };
        for (var i=0,iLen=buttons.length; i<iLen; i++) {
          if(document.getElementById(buttons[i])){
            console.log("****s")
            document.getElementById(buttons[i]).onclick = login(new_password);
          }
        };*/
      }
    })
        /*var observer = new MutationObserver(function(mutations){
          mutations.forEach(function(mutation){
            alert("Hey!!")
            console.log(target.value)
            console.log(mutation.target.value);
          })
        })

        var config = {
          attributes: true,
          childList: true,
          characterData: true,
          subtree: true
        };

        observer.observe(target, config);*/
}

/*console.log(new_password, new_password.length);

if(new_password.length > 0){ //new_password를 parsing하여 POST request
  password_len = new_password.length;

  if(new_password.search(/[a-z]/g) != -1){
    console.log("lower case");
    lower_case_flag = true;
  }
  if(new_password.search(/[A-Z]/g) != -1){
    console.log("upper case");
    upper_case_flag = true;
  }
  if(new_password.search(/[0-9]/g) != -1){
    console.log("number");
    number_flag = true;
  }
  if(new_password.search(/[~!@#$%^&*()_+|<>?:{}]/g) != -1){
    console.log("special");
    special_flag = true;
  }
    
  console.log(current_url, lower_case_flag, upper_case_flag, special_flag, password_len);

  post_api(current_url, lower_case_flag, upper_case_flag, special_flag, password_len)
    .then(function (response) {
      if (response.ok)
        return response.json();
      else
        return response.body.toString();
    })
    .then(function (result) {
      console.log(result);
    });
}*/

function login(new_password) {
  console.log(new_password, new_password.length)
  if(new_password.length > 0){ //new_password를 parsing하여 POST request
    password_len = new_password.length;

    if(new_password.search(/[a-z]/g) != -1){
      console.log("lower case");
      lower_case_flag = true;
    }
    if(new_password.search(/[A-Z]/g) != -1){
      console.log("upper case");
      upper_case_flag = true;
    }
    if(new_password.search(/[0-9]/g) != -1){
      console.log("number");
      number_flag = true;
    }
    if(new_password.search(/[~!@#$%^&*()_+|<>?:{}]/g) != -1){
      console.log("special");
      special_flag = true;
    }
    
    console.log(current_url, lower_case_flag, upper_case_flag, special_flag, password_len);

    post_api(current_url, lower_case_flag, upper_case_flag, special_flag, password_len)
      .then(function (response) {
          if (response.ok)
            return response.json();
          else
            return response.body.toString();
      })
      .then(function (result) {
          console.log(result);
      });
  }
}

async function get_api(url) {
  let base_url = "https://vyueat628d.execute-api.us-east-1.amazonaws.com/default/login_helper";
  return await fetch(base_url + `?url=${url}`);
}

async function post_api(url, lower, upper, special, length) {
  let base_url = "https://vyueat628d.execute-api.us-east-1.amazonaws.com/default/login_helper";
  const settings = {
      method: 'POST',
      body: JSON.stringify({"url": url, "lower": lower, "upper": upper, "special": special, "length": length}),
      // mode: 'no-cors'
  };
  return await fetch(base_url, settings);
}
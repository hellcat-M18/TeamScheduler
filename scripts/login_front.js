import $ from "jquery"

$(document).on("click",".github",()=>{
  window.location.href = "./auth/github"
})
$(document).on("click",".google",()=>{
  window.location.href = "./auth/google"
})
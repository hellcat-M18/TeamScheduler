import $ from "jquery"

function getUserAgent(){
  return new Promise((resolve,reject)=>{
      $.ajax({
          type:"GET",
          url:"/userAgent"
      })
      .done((res)=>{
          console.log("getuserAgent",res.id)
          resolve(res.id)
      })
      .fail((err)=>{
          reject(err)
      })
  })
  
}

const currentUserId = await getUserAgent()

$(document).on("click","#record",function(){
  window.location.href = `${window.location}/new`
  console.log("hey")
})
$(document).on("click",".contentData",(event)=>{
  let elem = event.target
  let schdeuleUUID = Array.from(elem.classList)[0]
  let scheduleOwnerId = Array.from(elem.classList)[1]

  if(scheduleOwnerId==currentUserId){
    window.location.href = `${window.location}/${schdeuleUUID}`
  }
  
})
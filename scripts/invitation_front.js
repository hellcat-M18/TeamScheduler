import $ from "jquery"

async function addPartners(userId,url){
  const urlArray = url.split("/")
  const UUID = urlArray[urlArray.length-1]
  console.log(UUID)

  const data = {userId:userId,uuid:UUID}

  return new Promise((resolve,rejects)=>{
    $.ajax({
      type:"POST",
      url:"/invitations/addPartners",
      data:data
    })
    .done((data, textStatus, jqXHR)=>{
      resolve(data)
      window.location.href="/calendar"
    })
    .fail((jqXHR, textStatus, errorThrown)=>{
      rejects(errorThrown)
      window.location.href="/calendar"
    })
  })
}

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

const userId = await getUserAgent()

console.log("getUserAgent",userId)


$(document).on("click",".cancel",()=>{
  window.location.href = "/calendar"
})

$(document).on("click",".join",async ()=>{

  await addPartners(userId,window.location.href)

})
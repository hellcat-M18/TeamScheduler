import $ from "jquery"
require("date-utils")


const inputDescArray = ["予定名","開始日時","開始時刻","終了日時","終了時刻"]

function isArrayEmpty(inputDataArray,inputDescArray){
  let isEmpty = false
  let desc = []
  let i = 0

  inputDataArray.forEach(elem => {
    if(!elem){
      isEmpty = true
      desc.push(inputDescArray[i])
    }
    i++
  });
  return {isEmpty,desc}
}

function disableIfChecked(checkbox){
  let checkStatus = checkbox.is(":checked")
  if(checkStatus){
    $(".startTime").prop("disabled",true)
    $(".endTime").prop("disabled",true)
  }else{
    $(".startTime").prop("disabled",false)
    $(".endTime").prop("disabled",false)
  }
}
  
$(window).on("load",function(){
  //チェックが入っていたら時刻入力を無効化
  disableIfChecked($(".allDay"))

  //newかeditかの判定　newの場合のみjsから値を入れる
  const urlArray = window.location.pathname.split("/")
  if(urlArray[urlArray.length-1]=="new"){

    let URLDate = urlArray[urlArray.length-2]
    let currentTime = new Date().toFormat("HH24:MI")
  
    let displayDate = new Date(`${URLDate},${currentTime}`)
  
    let startDate = new Date(displayDate)
    let endDate = new Date(displayDate.setHours(displayDate.getHours()+1))
  
    $(".startDate").val(startDate.toFormat("YYYY-MM-DD"))
    $(".startTime").val(startDate.toFormat("HH24:MI"))
    $(".endDate").val(endDate.toFormat("YYYY-MM-DD"))
    $(".endTime").val(endDate.toFormat("HH24:MI"))
  }
})

//登録が押されたときの処理
$(document).on("click","#post",function(){
  const scheduleName = $(".scheduleName").val()
  const startDate = $(".startDate").val()
  const startTime = $(".startTime").val()
  const endDate = $(".endDate").val()
  const endTime = $(".endTime").val()
  const memo = $(".memo").val()
  const isAllDay = $(".allDay").is(":checked")

  console.log("startDate",startDate)
  console.log("endDate",endDate)

  let startTimeObj,endTimeObj

  const maxDate = new Date(10000,1,1)
  const minDate = new Date(0)

  //終日の場合は期間を0000~2359に設定 表示に必要なだけ
  if(isAllDay){
    startTimeObj = new Date(`${startDate}T00:00`)
    endTimeObj = new Date(`${endDate}T23:59`)
  }else{
    startTimeObj = new Date(`${startDate}T${startTime}`)
    endTimeObj = new Date(`${endDate}T${endTime}`)
  }

  //入力不足判定
  const inputDataArray = [scheduleName,startDate,startTime,endDate,endTime]

  let {isEmpty,desc} = isArrayEmpty(inputDataArray,inputDescArray)

  if(isEmpty){
    let alertText = "入力が不足しています"

    desc.forEach((elem)=>{
      alertText = alertText+`\n・${elem}`
    })
    alert(alertText)

  }else if(endTimeObj<startTimeObj){

    alert("予定の長さがマイナスです")

  }else{

    if(startTimeObj<minDate || endTimeObj<minDate || startTimeObj>=maxDate || endTimeObj>=maxDate || isNaN(startTimeObj) || isNaN(endTimeObj)){

      alert("無効な日付です")
    
    }else{
      const ajaxData = {
        scheduleName:scheduleName,
        startTime:startTimeObj.toISOString(),
        endTime:endTimeObj.toISOString(),
        memo:memo,
        isAllDay:isAllDay
      }
      //post
      $.ajax({
        type:"POST",
        url:`${window.location.pathname}/postSchedule`,
        data:ajaxData,
      })
      .done(function(){
        let params = new URLSearchParams({"lastViewDate":ajaxData.startTime})
  
        //window.location.href=`/calendar?${params.toString()}`
      })
      .fail(function(jqXHR, textStatus, errorThrown){
        //console.log(errorThrown)
        alert(textStatus)
      })
    }
  }
})
//予定削除
$(document).on("click","#delete",()=>{
  $.ajax({
    type:"POST",
    url:`${window.location.pathname}/deleteSchedule`
  })
  .done(()=>{
    const urlArray = window.location.pathname.split("/")
    let params = new URLSearchParams({"lastViewDate":new Date(urlArray[urlArray.length-2])})

    window.location.href = `/calendar?${params.toString()}`
  })
  .fail((jqXHR, textStatus, errorThrown)=>{
    //console.log(errorThrown)
    alert(textStatus)
  })
})

//終日にチェックを入れたときに時刻の入力を無効化する
$(document).on("change",".allDay",function(){
  disableIfChecked($(this))
})



import $ from "jquery"

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

$(document).on("click","#post",function(){
  const scheduleName = $(".scheduleName").val()
  const startDate = $(".startDate").val()
  const startTime = $(".startTime").val()
  const endDate = $(".endDate").val()
  const endTime = $(".endTime").val()
  const memo = $(".memo").val()

  console.log("startDate",startDate)
  console.log("endDate",endDate)

  const inputDataArray = [scheduleName,startDate,startTime,endDate,endTime]

  let {isEmpty,desc} = isArrayEmpty(inputDataArray,inputDescArray)
  if(isEmpty){
    let alertText = "入力が不足しています"

    desc.forEach((elem)=>{
      alertText = alertText+`\n・${elem}`
    })
    alert(alertText)
    
  }else{

    const maxDate = new Date(10000,1,1)
    const minDate = new Date(0)

    const startTimeObj = new Date(`${startDate}T${startTime}`)
    const endTimeObj = new Date(`${endDate}T${endTime}`)

    if(startTimeObj<minDate || endTimeObj<minDate || startTimeObj>=maxDate || endTimeObj>=maxDate || isNaN(startTimeObj) || isNaN(endTimeObj)){

      alert("無効な日付です")
      
    }else{
      //console.log(typeof(startDate),startDate)
      //console.log(typeof(startTime),startTime)

      const ajaxData = {
        scheduleName:scheduleName,
        startTime:startTimeObj.toISOString(),
        endTime:endTimeObj.toISOString(),
        memo:memo
      }
      $.ajax({
        type:"POST",
        url:`${window.location.pathname}/postSchedule`,
        data:ajaxData,
      })
      .done(function(){
        //console.log("done!")
        window.location.pathname=`/calendar`
      })
      .fail(function(jqXHR, textStatus, errorThrown){
        //console.log(errorThrown)
        alert(textStatus)
      })
      }
  }

  

})

$(document).on("click","#delete",()=>{
  $.ajax({
    type:"POST",
    url:`${window.location.pathname}/deleteSchedule`
  })
  .done(()=>{
    window.location.pathname = "/calendar"
  })
  .fail((jqXHR, textStatus, errorThrown)=>{
    //console.log(errorThrown)
    alert(textStatus)
  })
})

$(document).on("change",".allDay",function(){
  let checkStatus = $(this).is(":checked")
  if(checkStatus){
    $(".startTime").prop("disabled",true)
    $(".endTime").prop("disabled",true)
  }else{
    $(".startTime").prop("disabled",false)
    $(".endTime").prop("disabled",false)
  }
})


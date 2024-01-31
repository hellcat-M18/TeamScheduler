import $ from "jquery"
require("date-utils")

console.log("window.location",window.location)
const urlPrefix = window.location.origin+"/invitations/"

let paramsDate = new URLSearchParams(document.location.search).get("lastViewDate")

let currentDate = new Date()
let renderDate = isValidDate(paramsDate) ? new Date(paramsDate):new Date()

let userId
let displayUsers = []

let displayColorArray = [[220,0,0],[0,220,0],[0,0,220],[220,220,0],[220,0,220],[0,200,200]]
let arrayBaseLength = displayColorArray.length

for(let i=1;i<=5;i++){
    for(let n=0;n<=5;n++){
        displayColorArray[arrayBaseLength*i+n] = []
        for(let v=0;v<=2;v++){
            displayColorArray[arrayBaseLength*i+n].push(Math.max(displayColorArray[n][v]-20*i,0))
        }
    }
}
console.log(displayColorArray)

function increaceMonth(inputDate){
    const {fullyear,month,date} = getMonthCurrent(inputDate)

    renderDate = new Date(fullyear,month+1,date)

    renderResult(renderDate)
}

function decreaceMonth(inputDate){
    const {fullyear,month,date} = getMonthCurrent(inputDate)

    renderDate = new Date(fullyear,month-1,date)

    renderResult(renderDate)
}

function isValidDate(str){
    const inputDate = new Date(str)
  
    return (str&&!isNaN(inputDate)&&inputDate.getFullYear()>=1970)

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

function getUser(){
    return new Promise((resolve,rejects)=>{
        $.ajax({
            type:"GET",
            url:"/getUser"
        })
        .done((res)=>{
            resolve(res)
        })
        .fail((err)=>{
            rejects(err)
        })
    })
}
const requestUser = await getUser()
displayUsers = requestUser.partners
displayUsers.push(requestUser.userId)

function isInRange(value,min,max){
    if(min<=value && value<=max){
        return true
    }
    else return false
}

function initClass(content){
    content.removeClass("font-weight-bold")
    content.removeClass("text-secondary")
    content.removeClass("text-primary")
    content.removeClass("text-danger")
    content.removeClass("disabled")
}

function getMonthCurrent(currentDate){
    let fullyear = currentDate.getFullYear()
    let month = currentDate.getMonth()
    let date = currentDate.getDate()

    return {fullyear,month,date}
}

function getMonthInfo(date){
    let firstDate = new Date(date.getFullYear(),date.getMonth(),1)
    let lastDate = new Date(date.getFullYear(),date.getMonth()+1,1)
    let prevlastDate = new Date(date.getFullYear(),date.getMonth(),0)

    return {firstDate,lastDate,prevlastDate}
}

//一か月の間の予定を取得
function getSchedulesInRange(userId,minDate,maxDate,displayUsers){
    console.log("getSchedulesInRange",displayUsers)
    return new Promise((resolve,reject)=>{
        $.ajax({
            type:"POST",
            url:"calendar/fetchSchedules",
            data:{
                userId:userId,
                minDate:minDate,
                maxDate:maxDate,
                displayUsers:JSON.stringify(displayUsers)
            }
        })
        .done((res)=>{
            resolve(res)
        })
        .fail((err)=>{
            reject(err)
            
        })
    })
  }


async function renderResult(renderDate){

    const currentUser = await getUser()
    const partners = currentUser.partners

    $(".Month").text(`${renderDate.getFullYear()}年 ${renderDate.getMonth()+1}月`)
    let {firstDate,lastDate,prevlastDate} = getMonthInfo(renderDate)
    let schedules = await getSchedulesInRange(userId,firstDate,lastDate,displayUsers)


    let firstDayIndex = firstDate.getDay()
    let lastDateIndex = new Date(lastDate.setDate(0)).getDate()
    let prevlastDateIndex = prevlastDate.getDate()

    let DaysOfWeek = ["日","月","火","水","木","金","土"]

    //曜日を表示
    for(let i=1;i<=7;i++){
        $(`.DayOfWeek_${i}`).text(DaysOfWeek[i-1])
        $(`.DayOfWeek_${i}`).addClass("text-center")
    }

    //下準備
    let monthLength = firstDayIndex+lastDateIndex
    let rooplength = 35
    let maxScheduleIndex = 3

    if(monthLength>35){
        rooplength = 42
        maxScheduleIndex = 2
        $(".days").append(`<tr class=extend></tr>`)
        for(let i=1;i<=7;i++){
            $(".extend").append(`<td class="Date_${35+i} dateCell"></td>`)
        }
    }else{
        $(".extend").remove()
    }
    //各日付のセルに日付を描画
    for(let i=1;i<=rooplength;i++){
            let cellIndex = i
            let day = cellIndex-firstDayIndex
            let inRange = isInRange(day,1,lastDateIndex)
            let baseDay = day

            let cell = $(`.Date_${cellIndex}`)
            initClass(cell)
            cell.addClass("align-text-top")

            if(inRange){
                cell.prop("disabled",false)
                cell.addClass("font-weight-bold")
                if(cellIndex%7==0){
                    cell.addClass("text-primary")
                }else if((cellIndex+6)%7==0){
                    cell.addClass("text-danger")
                }
            }else{
                cell.prop("disabled",true)
                cell.addClass("disabled")
                // $(`.Date_${cellIndex}`).addClass("text-white")
                if(day<1){
                    day = day+prevlastDateIndex            
                }else if(day>lastDateIndex){
                    day = day-lastDateIndex
                }
            }
            cell.text(day)
            //今日ならオレンジの枠を追加
            // if(currentDate.toFormat("DD")==day){
            //     if(firstDate.toFormat("MM")===currentDate.toFormat("MM")){
            //         cell.addClass("today")
            //     }else{
            //         cell.removeClass("today")
            //     }
            // }else{
            //     cell.removeClass("today")
            // }

            if(currentDate.toFormat("DD")==baseDay && firstDate.toFormat("YY-MM")==currentDate.toFormat("YY-MM")){
                cell.addClass("today")
            }else{
                cell.removeClass("today")
            }
            
            //予定表示用divを追加
            cell.append(`<div class="schedule_${cellIndex} scheduleDiv"></div>`)
            let scheduleDiv = $(`.schedule_${cellIndex}`)
            if(monthLength>35){
                scheduleDiv.css("height",`${520/6-30}px`)
            }else{
                scheduleDiv.css("height",`${520/5-30}px`)
            }
            
            
            //予定を期間(1日)でフィルタリングしdivにappend
            let renderSchedules = schedules.filter(function(item){
                let startTime = new Date(item.startTime)
                let startDate = new Date(startTime.getFullYear(),startTime.getMonth(),startTime.getDate())

                let endTime = new Date(item.endTime)
                let endDate = new Date(endTime.getFullYear(),endTime.getMonth(),endTime.getDate())

                let sortBase = new Date(renderDate.getFullYear(),renderDate.getMonth(),baseDay)

                return startDate<=sortBase && sortBase<=endDate
            })
            //代入部分はForから外せそうなので最適化候補

            renderSchedules.some((elem,index) => {
                if(index<maxScheduleIndex){
                    scheduleDiv.append(`<div class="schedule ${elem.scheduleOwnerId}">${elem.scheduleName}</div>`)
                }else{
                    scheduleDiv.append(`<div class="overflowText">+${renderSchedules.length-maxScheduleIndex}</div>`)
                    return true
                }
                
            });
            $(`.${userId}`).css("background-color","cornflowerblue")
            partners.forEach((elem,i)=>{
                if(i<displayColorArray.length){
                    $(`.${elem}`).css("background-color",`rgb(${displayColorArray[i][0]},${displayColorArray[i][1]},${displayColorArray[i][2]})`)
                }else{
                    $(`${elem}`).css("background-color","gray")
                }
            });
            

    }

}


$(async function(){
    console.log("load")
    userId = await getUserAgent()
    console.log("getUserAgent")
    await renderResult(renderDate)
    console.log("renderDate")
})

$(document).on("click",".next",function(){
    increaceMonth(renderDate)
})

$(document).on("click",".prev",function(){
    decreaceMonth(renderDate)
})

window.addEventListener("keydown",(e)=>{
    if(e.key=="ArrowRight"){
        increaceMonth(renderDate)
    }else if(e.key=="ArrowLeft"){
        decreaceMonth(renderDate)
    }
})

$(document).on("click",".dateCell",function(){

    let id = $(this).attr("class")
    let clickedCellIndex = id.split(" ")[0].split("_")[1]

    let {firstDate,lastDate,prevlastDate} = getMonthInfo(renderDate)
    let firstDayIndex = firstDate.getDay()

    let clickedDate = clickedCellIndex-firstDayIndex
    let clickedDateObject = new Date(renderDate.getFullYear(),renderDate.getMonth(),clickedDate)
    let fullClickedDate = clickedDateObject.toFormat("YYYY-MM-DD")

    let url = `${window.location.pathname}/${fullClickedDate}`

    console.log(url)
    window.location.href = url
    
})
$(document).on("click",".logout",()=>{
    window.location.href="/logout"
})

$(document).on("click",".invite",()=>{

    let url

    new Promise((resolve,reject)=>{
        $.ajax({
            type:"GET",
            url:"/invitations/create",
        })
        .done((res,status,jqXHR)=>{
            url = urlPrefix+res
            resolve(url)
            
            $(".logout").append(
                `<textarea class='urlTemp'>${url}</textarea>`
            )
            $(".urlTemp").select()
            document.execCommand("copy")
            $(".urlTemp").remove()

            alert(`招待URLをコピーしました\n${url}`)

        })
        .fail((jqXHR,status,err)=>{
            url = "ERROR"
            reject(err)
        })
    })

})

$(document).on("click",".checkBox",async function(){
    let currentState = $(this).prop("checked")
    let clickedId = $(this).attr("id")
    
    if(currentState){
        displayUsers.push(clickedId)
    }else{

        displayUsers.splice(displayUsers.findIndex((elem)=>elem==clickedId),1)
    }
    console.log(displayUsers)

    await renderResult(renderDate)

})
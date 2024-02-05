require("date-utils")

var express = require('express');
var router = express.Router();
const isAuth = require("./isAuth")
const isValidDate = require("./isValidDate")
const isValidUUID = require("./isValidUUID")

const {v4:uuidv4} = require("uuid")
const {PrismaClient} = require("@prisma/client")
const prisma = new PrismaClient({log:["query"]})

/* GET home page. */

async function getUser(userId){
  const user = await prisma.users.findFirst({
    where:{
      userId:userId
    }
  })
  return user
}

async function getSchedulesInRange(userId,minDate,maxDate,displayUsers){

  let fetchedSchedules = []
  console.log("displayUsers",displayUsers)

  //表示、非表示の指定がある場合
  if(displayUsers){

    console.log("displayUsers",displayUsers)
    for(let elem of displayUsers){
      const schedules = await prisma.schedules.findMany({
        where:{
          scheduleOwnerId:elem,
          OR:[
            {startTime:{gte:minDate,lt:maxDate}},
            {endTime:{gte:minDate,lt:maxDate}}
          ]
        }
      })

      fetchedSchedules = fetchedSchedules.concat(schedules)

    }
  }else{
    //ない場合(今まで通りの動作)

    const requestUser = await getUser(userId)

    let fetchTarget = requestUser.partners
    fetchTarget.push(userId)

    for(let elem of fetchTarget){
      const schedules = await prisma.schedules.findMany({
        where:{
          scheduleOwnerId:elem,
          OR:[
            {startTime:{gte:minDate,lt:maxDate}},
            {endTime:{gte:minDate,lt:maxDate}}
          ]
        }
      })

      fetchedSchedules = fetchedSchedules.concat(schedules)

    }
  }

  fetchedSchedules.sort((a,b)=>{
    return new Date(a.startTime) - new Date(b.startTime)
  })

  return fetchedSchedules

}

async function getUserName(userId){
  const user = await prisma.users.findFirst({
    where:{
      userId:userId,
    }
  })
  return user.userName
}

//カレンダー
router.get('/',isAuth, async function(req, res, next) {

  const requestUser = await prisma.users.findFirst({
    where:{
      userId:req.user.id
    }
  })

  const partnersId = requestUser.partners
  console.log(partnersId)

  let partners = []

  for(let elem of partnersId){
    const partner = await prisma.users.findFirst({
      where:{
        userId:elem
      }
    })
    let id = partner.userId
    let name = partner.userName
    partners.push({
      "id":id,
      "name":name
    })
  }
  
  console.log(partners)

  const displayName = requestUser.userName

  res.render('calendar', {displayName:displayName ,id:req.user.id ,renderDate:new Date(), partners:partners});
});

//その日の予定一覧
router.get("/:fulldate",isAuth,isValidDate,async function(req,res,next){
  let fulldate = req.params.fulldate
  const dateArray = fulldate.split("-")
  const fulldateObj = new Date(dateArray[0],dateArray[1]-1,dateArray[2])
  
  const userId = req.user.id
  const minDate = new Date(dateArray[0],dateArray[1]-1,1)
  const maxDate = new Date(dateArray[0],dateArray[1],1)

  let = await getSchedulesInRange(userId,minDate,maxDate)

  let schedules = schedules.filter(function(item){
    let startTime = new Date(item.startTime)
    let startDate = new Date(startTime.getFullYear(),startTime.getMonth(),startTime.getDate())

    let endTime = new Date(item.endTime)
    let endDate = new Date(endTime.getFullYear(),endTime.getMonth(),endTime.getDate())

    return startDate<=fulldateObj && fulldateObj<=endDate
  })

  for(let elem of schedules){
    elem["startTime"] = elem["startTime"].toFormat("HH24:MI")
    elem["endTime"] = elem["endTime"].toFormat("HH24:MI")
    elem["createdBy"] = await getUserName(elem.scheduleOwnerId)
  }
  console.log("schedules",schedules)

  res.render("date",{fulldate:fulldate,schedules:schedules})
  
})

//予定の新規作成
router.get("/:fulldate/new",isAuth,isValidDate,function(req,res,next){
  const fulldate = req.params.fulldate

  res.render("new",{fulldate:fulldate})

})

//特定の予定の表示
router.get("/:fulldate/:scheduleUUID",isAuth,isValidDate,isValidUUID,async function(req,res,next){
  const scheduleUUID = req.params.scheduleUUID

  const fetchResult = await prisma.schedules.findFirst({
    where:{
      scheduleOwnerId:req.user.id,
      scheduleId:scheduleUUID
    }
  })
  
  const StartTimestamp = new Date(fetchResult.startTime).toFormat("YYYY-MM-DD_HH24:MI").split("_")
  const EndTimestamp = new Date(fetchResult.endTime).toFormat("YYYY-MM-DD_HH24:MI").split("_")
    
  console.log(StartTimestamp)
  console.log(EndTimestamp)
    
  const title = fetchResult.scheduleName
  const startDate = StartTimestamp[0]
  const startTime = StartTimestamp[1]
  const endDate = EndTimestamp[0]
  const endTime = EndTimestamp[1]
  const memo = fetchResult.memo
  const isAllDay = fetchResult.isAllDay
    
  const fetchResultFormatted = [title,startDate,startTime,endDate,endTime,memo,isAllDay]
    
  res.render("edit",{res:fetchResultFormatted})
  
})
//新規作成 post_frontより
router.post("/:fulldate/new/postSchedule",isAuth,isValidDate,async function(req,res,next){
  const scheduleId = uuidv4()
  const scheduleName = req.body.scheduleName
  const startTime = req.body.startTime//toISOstring
  const endTime = req.body.endTime//toISOstring
  const memo = req.body.memo
  const isAllDay = JSON.parse(req.body.isAllDay)
  const scheduleOwnerId = req.user.id

  try{
    const newSchedule = await prisma.schedules.create({
      data:{
        scheduleId:scheduleId,
        scheduleName:scheduleName,
        startTime:startTime,
        endTime:endTime,
        memo:memo,
        isAllDay:isAllDay,
        scheduleOwnerId:scheduleOwnerId
      }
    })
    res.end()
  }catch(err){
    console.log(err)
    res.status(500).end(err)
  }
  
})
//編集 post_frontより
router.post("/:fulldate/:scheduleUUID/postSchedule",isAuth,isValidDate,async function(req,res,next){

  const scheduleOwnerId = req.user.id
  const scheduleId = req.params.scheduleUUID
  const scheduleName = req.body.scheduleName
  const startTime = req.body.startTime//toISOstring
  const endTime = req.body.endTime//toISOstring
  const memo = req.body.memo
  const isAllDay = JSON.parse(req.body.isAllDay)

  try{
    const newSchedule = await prisma.schedules.update({
      where:{
        scheduleOwnerId:scheduleOwnerId,
        scheduleId:scheduleId,
      },
      data:{
        scheduleName:scheduleName,
        startTime:startTime,
        endTime:endTime,
        memo:memo,
        isAllDay:isAllDay
      }
    })
    res.end()
  }catch(err){
    console.log(err)
    res.status(500).end(err)
  }
})

//予定の削除
router.post("/:fulldate/:scheduleUUID/deleteSchedule",isAuth,isValidUUID,async function(req,res,next){
  const userId = req.user.id
  const scheduleId = req.params.scheduleUUID

  try{
    const deleteSchedule = await prisma.schedules.delete({
      where:{
        scheduleOwnerId:userId,
        scheduleId:scheduleId
      }
    })
    console.log(console.log("deleted"))
    res.end()
  }catch(err){
    console.log(err)
    res.status(500).end(err)
  }
})

//フロントに返す用のAPI
router.post("/fetchSchedules",isAuth,async function(req,res,next){

  const userId = req.body.userId
  const minDate = new Date(req.body.minDate)
  const maxDate = new Date(req.body.maxDate)
  const displayUsers = JSON.parse(req.body.displayUsers)

  console.log("displayUsers",displayUsers)

  await getSchedulesInRange(userId,minDate,maxDate,displayUsers)
  .then((fetchResult)=>{
    res.status(200).send(fetchResult)
  })
  .catch((err)=>{
    console.log(err)
    res.status(500).send(err)
  })

})

module.exports = router;
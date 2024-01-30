require("date-utils")

var express = require('express');
var router = express.Router();
const isAuth = require("./isAuth")

const {v4:uuidv4} = require("uuid")
const {PrismaClient} = require("@prisma/client")
const prisma = new PrismaClient({log:["query"]})

//ページではなくAPIとして活用

//リンク取得
router.get("/create",isAuth,async function(req,res,next){

  const createdBy = req.user.id
  const generatedUUID = uuidv4()
  const createdAt = new Date()

  const createNewInvitation = await prisma.invitations.create({
    data:{
      UUID: generatedUUID,
      createdAt: createdAt,
      createdBy: createdBy
    }
  })

  res.end(createNewInvitation.UUID)
  
})



//招待リンクに飛んだ時の画面
router.get("/:invitationUUID",isAuth,async function(req,res,next){
  
  const userId = req.user.id
  const UUID = req.params.invitationUUID

  const storedUUID = await prisma.invitations.findFirst({
    where:{
      UUID:UUID
    }
  })
  if(storedUUID){
    const createdBy = storedUUID.createdBy
    const createdAt = storedUUID.createdAt

    const currentDate = new Date()

    const expires = Math.ceil(7-(currentDate-createdAt)/(1000*60*60*24))

    const userInfo = await prisma.users.findUnique({
      where:{
        userId:createdBy,
      }
    })

    const userName = userInfo.userName

    res.render("invitations",{userName,expires})

  }else{

    res.render("invitationNotFound")

  } 

})

router.post("/addPartners",isAuth,async function(req,res){

  const clickedUserId = req.body.userId
  const clickedUUID = req.body.uuid

  console.log("clickedUserId",clickedUserId)
  console.log("clickedUUID",clickedUUID)

  //データベースを照会しUUIDからオーナーを取得
  const UUIDInfo = await prisma.invitations.findFirst({
    where:{
      UUID:clickedUUID
    }
  })
  const uuidOwnerId = UUIDInfo.createdBy

  console.log("uuidOwner",uuidOwnerId)
  console.log("clickedUser",clickedUserId)
  if(uuidOwnerId==clickedUserId){
    console.log("same!")
    return res.end()
  }
  
  //パートナー取得用にユーザーテーブルを取得
  const clickedUser = await prisma.users.findFirst({
    where:{
      userId:clickedUserId
    }
  })

  //クリックした人のパートナーを更新
  const cPartners = clickedUser.partners
  console.log("cPartners",cPartners)

  if(cPartners.filter((elem)=>elem==uuidOwnerId).length==0){
    cPartners.push(uuidOwnerId)
    console.log("pushした")

    await prisma.users.update({
      where:{
        userId:clickedUserId
      },
      data:{
        partners:cPartners
      }
    })
  }
  
  //パートナー取得用にユーザーテーブルを取得
  const uuidOwner = await prisma.users.findFirst({
    where:{
      userId:uuidOwnerId
    }
  })
  //UUID作成者のパートナーを更新
  const oPartners = uuidOwner.partners
  console.log("oPartners",oPartners)

  if(oPartners.filter((elem)=>elem==clickedUserId).length==0){
    oPartners.push(clickedUserId)
    console.log("pushした")

    await prisma.users.update({
      where:{
        userId:uuidOwnerId
      },
      data:{
        partners:oPartners
      }
    })
  }

  res.end()

})



module.exports = router;
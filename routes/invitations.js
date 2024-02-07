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

  const userInfo = await prisma.users.findFirst({
    where:{
      userId:createdBy
    }
  })
  const invitationUUID = userInfo.invitationUUID
  
  if(invitationUUID){
    res.send(invitationUUID)
  }else{
    res.send("error")
  }
})



//招待リンクに飛んだ時の画面
router.get("/:invitationUUID",isAuth,async function(req,res,next){
  
  const UUID = req.params.invitationUUID

  const userInfo = await prisma.users.findFirst({
    where:{
      invitationUUID:UUID
    }
  })
  if(userInfo){
    res.render("invitations",{userName:userInfo.userName})
  }else{
    res.status(404).end()
  }

})

router.post("/addPartners",isAuth,async function(req,res){

  const clickedUserId = req.body.userId
  const clickedUUID = req.body.uuid

  const targetUser = await prisma.users.findFirst({
    where:{
      invitationUUID:clickedUUID
    }
  })
  if(targetUser){
    if(targetUser.userId==clickedUserId){
      res.end()
    }else{
      if(targetUser.partners.findIndex((elem)=>elem==clickedUserId)==-1){
        targetUser.partners.push(clickedUserId)
        const updateTargetPartners = await prisma.users.update({
          where:{
            userId:targetUser.userId
          },
          data:{
            partners:targetUser.partners
          }
        })
      }
    }
  }else{
    res.status(404).end()
  }
  
  const requestUser = await prisma.users.findFirst({
    where:{
      userId:clickedUserId
    }
  })
  if(requestUser){
    if(requestUser.partners.findIndex((elem)=>elem==targetUser.userId)==-1){
      requestUser.partners.push(targetUser.userId)
      const updateRequestUserPartners = await prisma.users.update({
        where:{
          userId:clickedUserId
        },
        data:{
          partners:requestUser.partners
        }
      })
    }
  }
  res.end()


  // //データベースを照会しUUIDからオーナーを取得
  // const UUIDInfo = await prisma.invitations.findFirst({
  //   where:{
  //     UUID:clickedUUID
  //   }
  // })
  // const uuidOwnerId = UUIDInfo.createdBy
  // if(uuidOwnerId==clickedUserId){
  //   console.log("same!")
  //   return res.end()
  // }
  
  // //パートナー取得用にユーザーテーブルを取得
  // const clickedUser = await prisma.users.findFirst({
  //   where:{
  //     userId:clickedUserId
  //   }
  // })

  // //クリックした人のパートナーを更新
  // const cPartners = clickedUser.partners
  // console.log("cPartners",cPartners)

  // if(cPartners.filter((elem)=>elem==uuidOwnerId).length==0){
  //   cPartners.push(uuidOwnerId)
  //   console.log("pushした")

  //   await prisma.users.update({
  //     where:{
  //       userId:clickedUserId
  //     },
  //     data:{
  //       partners:cPartners
  //     }
  //   })
  // }
  
  // //パートナー取得用にユーザーテーブルを取得
  // const uuidOwner = await prisma.users.findFirst({
  //   where:{
  //     userId:uuidOwnerId
  //   }
  // })
  // //UUID作成者のパートナーを更新
  // const oPartners = uuidOwner.partners
  // console.log("oPartners",oPartners)

  // if(oPartners.filter((elem)=>elem==clickedUserId).length==0){
  //   oPartners.push(clickedUserId)
  //   console.log("pushした")

  //   await prisma.users.update({
  //     where:{
  //       userId:uuidOwnerId
  //     },
  //     data:{
  //       partners:oPartners
  //     }
  //   })
  // }

  // res.end()

})

router.post("/removePartners",isAuth,async(req,res,next)=>{
  const requestUserId = req.user.id
  const targetUserId = req.body.targetId

  //リクエストしたユーザーを取得
  const requestUser = await prisma.users.findFirst({
    where:{
      userId:requestUserId
    }
  })

  //Arrayからターゲットを削除
  let reqPartners = requestUser.partners 
  reqPartners = reqPartners.filter((elem) => elem!==targetUserId)
  
  //DBを更新
  const updateReqUserPartners = await prisma.users.update({
    where:{
      userId:requestUserId
    },
    data:{
      partners:reqPartners
    }
  })

  //対象のユーザーを取得
  const targetUser = await prisma.users.findFirst({
    where:{
      userId:targetUserId
    }
  })

  let tgtPartners = targetUser.partners
  tgtPartners = tgtPartners.filter((elem)=>elem!==requestUserId)

  const updateTgtUserPartners = await prisma.users.update({
    where:{
      userId:targetUserId
    },
    data:{
      partners:tgtPartners
    }
  })
  res.end()

})



module.exports = router;
function isValidUUID(req,res,next){
  const str = req.params.scheduleUUID
  const format = /[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[0-9a-f]{4}-[0-9a-f]{12}/gi //uuidv4 format

  if(str.match(format)){
    return next()
  }else{
    res.status(400).send("Invalid UUID")
  }
}

module.exports = isValidUUID
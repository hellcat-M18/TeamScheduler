function isValidDate(req,res,next){
  const str = req.params.fulldate
  const format = /^\d{4}-\d{2}-\d{2}$/
  const inputDate = new Date(str)

  if(!isNaN(inputDate)&&str.match(format)&&inputDate.getFullYear()>=1970){
    return next()
  }else{
    res.status(400).send("Invalid Date")
  }
}

module.exports = isValidDate
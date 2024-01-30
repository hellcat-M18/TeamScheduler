//本体
const express = require('express');

//よくわからないやつら
const createError = require('http-errors');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const helmet = require("helmet");

//自分で入れたライブラリ
const cron = require("node-cron")

//Passport認証関連
const session = require("express-session");
const passport = require("passport");
const GitHubStrategy = require("passport-github2").Strategy;
const GoogleStrategy = require("passport-google-oauth").OAuth2Strategy;

passport.serializeUser((user,done)=>{
  done(null,user);
})
passport.deserializeUser((obj,done)=>{
  done(null,obj)
})

//環境変数関連
const dotenv = require("dotenv")
const {PrismaClient} = require("@prisma/client")
const prisma = new PrismaClient({log:["query"]})
dotenv.config()

//Github認証の設定
const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID
const GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET

passport.use(new GitHubStrategy({
  clientID:GITHUB_CLIENT_ID,
  clientSecret:GITHUB_CLIENT_SECRET,
  calbackURL:process.env.GITHUB_CALLBACK_URL
},(accessToken,refreshToken,profile,done)=>{
  process.nextTick(()=>{
    return done(null,profile)
  })
}
))

//Google認証の設定
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET

passport.use(new GoogleStrategy({
  clientID:GOOGLE_CLIENT_ID,
  clientSecret:GOOGLE_CLIENT_SECRET,
  callbackURL:process.env.GOOGLE_CALLBACK_URL
},(accessToken,refreshToken,profile,done)=>{
  process.nextTick(()=>{
    return done(null,profile)
  })
}))


//ルーティング
const indexRouter = require('./routes/index');
const calendarRouter = require("./routes/calendar");
const invitationsRouter = require("./routes/invitations");
const isAuth = require('./routes/isAuth');

const app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(helmet());
app.use(session({secret:"1eadd6e6546fe940",resave:false,saveUninitialized:false}));
app.use(passport.initialize());
app.use(passport.session());

//Github認証のコールバック
app.get("/auth/github",
  passport.authenticate("github",{scope:["user:email"]}),
  (req,res)=>{
    res.redirect("/")
  });

app.get("/auth/github/callback",
  passport.authenticate("github",{failureRedirect:"/login"}),async function(req,res){
    
    const updateUser = await prisma.users.upsert({
      where:{userId:req.user.id},
      update:{userName:req.user.username},
      create:{userId:req.user.id,userName:req.user.username}
    })

    res.redirect("/calendar")
  }
)

//Google認証のコールバック
app.get("/auth/google",
  passport.authenticate("google",{scope:['https://www.googleapis.com/auth/plus.login']}),
  (req,res)=>{
    res.redirect("/")
  }
)

app.get("/auth/google/callback",
  passport.authenticate("google",{failureRedirect:"/login"}),async function(req,res){
    const updateUser = await prisma.users.upsert({
      where:{userId:req.user.id},
      update:{userName:req.user.displayName},
      create:{userId:req.user.id,userName:req.user.displayName}
    })
    res.redirect("/calendar")
  }
)

//招待リンクの期限切れ処理
cron.schedule("* * * * *",async () =>{

  let expireDate = new Date()
  expireDate.setDate(expireDate.getDate()-7)

  console.log("expireDate",expireDate)

  await prisma.invitations.deleteMany({
    where:{
      createdAt:{
        lt:expireDate
      }
    }
  })
})



//ページ上で使ってるAPI
app.get("/userAgent",isAuth,(req,res)=>{
  res.send(req.user)
})
app.get("/getUser",isAuth,async (req,res) =>{
  const user = await prisma.users.findFirst({
    where:{
      userId:req.user.id
    }
  })
  res.send(user)
})

app.get("/login",(req,res)=>{
  res.render("login");
})
app.get("logout",(req,res,next)=>{
  req.logout((err)=>{
    if(err) return next(err)
    res.redirect("/")
  })
})

app.get("/logout",(req,res)=>{
  res.status(401).redirect("/login")
})

//ルーターの使用
app.use("/", indexRouter);
app.use("/calendar",calendarRouter);
app.use("/invitations",invitationsRouter);
app.use("/public",express.static("public"));


// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

app.use(function(req,res,next){
  next(createError(400))
})

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;

var express = require('express');
var app = express();

const router = express.Router();
const bcrypt = require('bcrypt');
var session = require('express-session');
const cookieParser = require("cookie-parser");
var bodyParser = require('body-parser');
app.use(bodyParser.json());
app.use(cookieParser());
app.use(bodyParser.urlencoded({
    extended: true
 }));
//session setting
 const oneDay = 1000 * 60 * 60 * 24;
 app.use(session({
    secret: "thisismysecrctekeyfhrgfgrfrty84fwir767",
    saveUninitialized:true,
    cookie: { maxAge: oneDay },
    resave: false
}));
//db setup************************
var mongoose = require('mongoose');
const { render } = require('ejs');
//const { getMaxListeners } = require('process');

mongoose.connect('mongodb://0.0.0.0:27017/userData', ()=>{
    console.log("connected to database");
},e=>console.error(e));
mongoose.set('strictQuery', true);
var userSchema = mongoose.Schema({
     name: String,
    email: String,
    address: String,
    mobile: Number,
    password: String
 });
 var users = mongoose.model("users", userSchema);
//*********************************** 
app.set('view engine', 'ejs');
app.get('/', (req, res) => {
    res.render('login-page');
    });
app.get('/sign-up', (req, res) => {
        res.render('sign-up');
        });

     app.get('/admin', (req, res) => {
            res.render('admin-login');
            });
    ///ADMIN POST 
    app.post('/admin-dashboard',async(req,res) => {
        const mail = req.body.email;
        const user = await users.findOne({email:mail});    
        const uData = await users.find({});  
        var num=1;
        //console.log(user);  
        if(user==null){
            return res.status(400).send('cannot find user ');
            }
        try{
           if(await bcrypt.compare(req.body.password,user.password))
           {
            session=req.session;
            session.userid=req.body.email;
           //console.log(req.session)
            res.render('admin-dashboard',{uData,num});
            app.get('/logout',(req,res) => {
                   req.session.destroy();
                    // res.redirect('/');
                  });  
             }else{
            res.send('not allowed');
           }
        }catch{
            //res.status(500).send();
            res.send("error");
        }
    }); 

//USER POST
    app.post('/home',async(req,res) => {
        const mail = req.body.email;
        const user = await users.findOne({email:mail});    
        //console.log(user);  
        if(user==null){
            return res.status(400).send('cannot find user');
            }
        try{
           if(await bcrypt.compare(req.body.password,user.password))
           {
            session=req.session;
            session.userid=req.body.email;
          // console.log(req.session)
            res.send(`Hey there, welcome <a href=\'/logout'>click to logout</a>`);
            app.get('/logout',(req,res) => {
                   req.session.destroy();
                     res.redirect('/');
                  });  
             }else{
            res.send('not allowed');
           }
        }catch{
            //res.status(500).send();
            res.send("error");
        }
    });

    //DELETE -USER DATA
  app.post('/admin/delete/:id',async (req,res)=>{
    const id = req.params.id;
    let deleteUser = await users.findOneAndDelete({_id:id})
   
    res.redirect('/admin');   
  });

  //DELETE -ALL
  app.post('/admin/deleteall',async (req,res)=>{ 
    let deleteUser = await users.collection.drop();
     res.redirect('/admin');   
  });
//admin-sgnout
app.post('/admin/signout', (req,res)=>{ 
  //  req.session.destroy();
    res.redirect('/');
       
  });

  //UPDATE
  app.post('/admin-update',async (req,res)=>{
    const filter = { name: req.body.uname };
    const update = { name:  req.body.uname,
                     email: req.body.uemail,
                    address:req.body.uadrs,
                     mobile:req.body.uphone,
                     password: await bcrypt.hash(req.body.upassword,10) }; 
   // const id = req.params.id;
    let doc = await users.findOneAndUpdate(filter, update);
    res.redirect('/admin');   
  })
 
 
app.get('/admin-dashboard',(req,res)=>{

    res.render('admin-dashboard');
});
//ADD NEW
app.post('/add-new',async (req,res)=>{
   
    var newUserr = new users({
        name: req.body.nName,
       email: req.body.nEmail,
       mobile:  req.body.nPhone,
       address:req.body.nAdrs,
       password: await bcrypt.hash(req.body.nPassword,10)
     });

     newUserr.save(function(err,newUserr){
        if(err)
           res.send("db error");
        else
        res.redirect('/admin');
          
     });
 

} );

/****************USER SIGN-UP */
app.post('/sign-up', async (req,res)=>{
    var userInfo= req.body;
//hashing password
    try{
     var hashedPassword = await bcrypt.hash(req.body.password,10);// 10-salt rounds
    }catch{
      res.status(500).send();
    }
 if(!userInfo.name||!userInfo.email||!userInfo.password)
    {
        res.render("res_page",{message:"input details please"});
     }
     else{
        {
            var newUser = new users({
               name: userInfo.name,
               password:hashedPassword,
               email:userInfo.email,
               mobile:userInfo.mobile,
               address:userInfo.adrs
            });
 newUser.save(function(err,newUser){
               if(err)
                  res.send("db error");
               else
                 res.redirect('/');
            });
         }
     }
});

// const userRouter=require('./routes/users');
// app.use("/",userRouter);

app.listen(3000, function(){
    console.log('listening to port  3000');
   });
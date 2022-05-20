let express = require('express');

let app = express();

app.use(express.static('assets'));
app.set('view engine','ejs');

let bodyParser = require('body-parser');
let urlEncoded = bodyParser.urlencoded({extended: false});

let mongoose = require('mongoose');

mongoose.connect('mongodb+srv://benson306:benson306@bencluster.axe8t.mongodb.net/profile?retryWrites=true&w=majority');

let profileSchema = new mongoose.Schema({
    email: String,
    username: String,
    password: String,
    picName: String
});

let Profile = mongoose.model('users', profileSchema);

let methodOverride = require('method-override');
app.use(methodOverride('_method'));


let session = require('express-session');
const req = require('express/lib/request');
const res = require('express/lib/response');
let sessionStore = require('connect-mongodb-session')(session);
let mongoURI = 'mongodb+srv://benson306:benson306@bencluster.axe8t.mongodb.net/profile?retryWrites=true&w=majority';

let store = new sessionStore({
    uri: mongoURI,
    collection: 'userSessions'
})

app.use(session({
    secret: 'secret',
    saveUninitialized: false,
    resave: false,
    store: store
}))

let isAuth = function(req, res, next){
    if(req.session.isAuth){
        next();
    }else{
        res.render('index',{data: "Log In to Continue"})
    }
}

app.get('/', function(req, res){
    res.render('index',{ data: "" })
})

app.get('/index', function(req, res){
    res.render('index',{ data: "" })
})

app.get('/register', function(req, res){
    res.render('register',{ data: "" })
})

app.get('/dashboard', isAuth, function(req, res){
    Profile.findOne({_id: req.session.userId}, function(err, data){
                res.render('dashboard', {data: data});
    })
})

app.post('/register', urlEncoded, function(req,res){
    if(req.body.password === req.body.confpassword){
        Profile.findOne({$or:[{email: req.body.email},{username: req.body.username}]}, function(err, data){
            if(!data){
                let password = req.body.password;
                if(password.length < 8){
                    res.render('register', {data: "Password must be 8 or more characters"})
                }else{
                    req.session.isAuth=true;
                    Profile(req.body).save(function(err, data){
                        res.render('index',{data: "Succesfully Registered"});
                    });
                }    
            }else if(data){
                res.render('register', {data: "Username or Email has already been Registered"})
            }
        })
    }else{
        res.render('register',{data: "Password Does not match"});
    }
    
});

app.post('/index', urlEncoded, function(req, res){
    Profile.findOne({$or:[{email: req.body.email},{username: req.body.email}]}, function(err,data){
        if(data){
            if(data.password===req.body.password){
                req.session.isAuth=true;
                req.session.userId = data._id;
                res.redirect('/dashboard');
            }else{
                res.render('index',{data: "Wrong Password"});  
            }
        }else if(!data){
            res.render('index',{data: "User is not registered"});
        }
        
    })
})

app.post('/logout', urlEncoded, function(req,res){
    req.session.destroy(function(err){
        if(err) throw (err)
        // res.render('index', {data: ""})
        res.redirect('/index')
    });
})
app.get('/logout', function(req,res){
    req.session.destroy(function(err){
        if(err) throw (err)
        // res.render('index', {data: ""})
        res.redirect('/index')
    });
})

app.post('/edit/:id', function(req,res){
    Profile.findOne({_id: req.session.userId}, function(err, data){
        res.render('edit',{data: data});
    }) 
});

app.put('/edit/:id', isAuth, urlEncoded, function(req,res){
    let id= req.params.id;
    Profile.findByIdAndUpdate(id, {username: req.body.username, email: req.body.email}, {new: true},function(err, data){
        res.redirect('/dashboard');
    });
});

app.delete('/delete/:id', isAuth, urlEncoded, function(req, res){
    Profile.findByIdAndRemove({_id: req.params.id}, function(err, data){
        res.redirect('/logout');
    })
})

let multer = require('multer');
let path = require('path');

let storage = multer.diskStorage({
    destination: (req, file, cb)=>{
        cb(null, 'assets/uploads')
    },
    filename: (req, file, cb)=>{
        //console.log(file);
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

let upload = multer({
    storage: storage
});

app.post('/upload', upload.single('image'), function(req, res){
    Profile.findByIdAndUpdate({_id: req.session.userId}, {picName: req.file.filename}, {new: true}, function(err, data){
        res.redirect('dashboard');
    })
    // console.log(req.file);
})


app.listen(3000);

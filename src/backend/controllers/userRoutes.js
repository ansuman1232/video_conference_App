import httpStatus from "http-status";
import { User } from "../models/userModel.js";
import {Meeting} from "../models/meetingModel.js";
import bcrypt, { hash } from "bcrypt"
import { randomBytes } from 'node:crypto';






const register = async (req, res,next) => {
    const { name, username, password } = req.body;


    const existingUser = await User.findOne({ username });
    if (existingUser) return res.status(httpStatus.FOUND).json({ "message": "user alredy registered" });
    const hashedPassword = await bcrypt.hash(password, 10);

    let newUser = new User({
        name: name, username: username, password: hashedPassword
    })
    newUser.save();
    res.status(httpStatus.CREATED).json({ "message": "user is registered" });
    return next();
}




const login = async (req, res,next) => {
    const { username, password } = req.body;
 
    if (!username || !password) return res.status(httpStatus.NOT_FOUND).json({ "message": "please provide details" });

    const user = await User.findOne({ username });

    if (!user) return res.status(httpStatus.NOT_FOUND).json({ "message": "User details not found" });
    let isPasswordCorrect = await bcrypt.compare(password, user.password);

    if (isPasswordCorrect) {
        const token = randomBytes(32).toString('hex');
        user.token = token;
        await user.save();
        res.status(httpStatus.OK).json({ "message": "token saved","token":`${token}` });
        return next();
    }
    else return res.status(httpStatus.UNAUTHORIZED).json({ "message": "Invalid username or password" });
}



const get_all_acitvity= async (req,res,next)=>{

let {token}=req.query;

const user=await User.findOne({token:token});
const meeting=await Meeting.find({user_id:user.username});
res.json(meeting);

}

const add_to_history=async (req,res,next)=>{
  const {token,meeting_code}=req.body;


  const user=await User.findOne({token:token});
  let newMeeting= new Meeting({
    user_id:user.username,
    meetingCode:meeting_code
  });
  


  newMeeting.save();
  res.status(httpStatus.CREATED).json({message:"Added to history"});
}


const validate= async(req,res,next)=>{
  let token=req.query.token;
 
const user=await User.findOne({token});

if(user) res.status(httpStatus.FOUND);
else res.status(httpStatus.NOT_FOUND);

}


export { login, register,get_all_acitvity,add_to_history,validate };
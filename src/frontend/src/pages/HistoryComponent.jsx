import React, { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { HisContex } from "../contexts/HistoryContex";
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardActions from '@mui/material/CardActions';
import CardContent from '@mui/material/CardContent';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import HomeIcon from '@mui/icons-material/Home';
import IconButton from '@mui/material/IconButton';
import "../styles/History.css"

export default function HistoryComponent() {
    const { getAllActivity } = useContext(HisContex);
    const [meetings, setMeeting] = useState([]);

    const route = useNavigate();







    useEffect(() => {
        const fetchHistory = async () => {
            try {

                const history = await getAllActivity();
                setMeeting(history);


            } catch (e) {
                console.log(e);
            }

        }

        fetchHistory();
    }, []);


  
    let formatDate=(dateString)=>{
       const date=new Date(dateString);
       const day=date.getDay().toString().padStart(2,"0");
       const month=(date.getMonth()+1).toString().padStart(2,"0");
       const year=date.getFullYear();

 
         return `${day}/${month}/${year}`
    }





    return (
        <div>
            <IconButton className="Homebutton" sx={{color:"white"}}onClick={() => route("/home")}>
                <HomeIcon />
            </IconButton>
            {meetings.length > 0 &&
                meetings.map((e, i) => {
                    return (
                        <>

                            <Card key={i}  sx={{ minWidth: 275,marginBottom:"1vh",marginTop:"1vh" ,paddingLeft:"2vw"}}>
                                <CardContent>
                                    <Typography gutterBottom sx={{ color: 'black', fontSize: 20 }}>
                                      {"meeting-code:"+e.meetingCode}
                                    </Typography>
                                  
                                    <Typography sx={{fontSize:16}} variant="body2">
                                       
                                        {"date: "+ formatDate(e.date)};
                                    </Typography>
                                </CardContent>

                            </Card>





                        </>
                    )
                })
            }

        </div>

    )





}
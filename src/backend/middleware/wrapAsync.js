const wrapAsync= function(fun){

    return function(req,res,next){
        
        fun(req,res,next).catch(next);
          
    }
}
export default wrapAsync;
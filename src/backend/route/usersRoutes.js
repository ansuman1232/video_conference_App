import {Router} from "express";
import {login,register,get_all_acitvity,add_to_history,validate} from "../controllers/userRoutes.js";
import wrapAsync from "../middleware/wrapAsync.js"

const router=Router();

router.route("/login").post(wrapAsync(login));
router.route("/register").post(wrapAsync(register));
router.route("/add_to_history").post(wrapAsync(add_to_history));
router.route("/get_all_acitvity").get(wrapAsync(get_all_acitvity));
router.route("/validate").get(wrapAsync(validate));
export default router;
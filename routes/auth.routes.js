import { Router } from "express";
import * as authControllers from "../controllers/auth.controller.js"

const router=new Router();

router
.route("/login")
.get(authControllers.getLoginPage)
.post(authControllers.postLogin);

router
.route("/register")
.get(authControllers.getRegisterPage)
.post(authControllers.postRegister);

router.route('/me').get(authControllers.getMe);

router.route('/profile').get(authControllers.getProfilePage);

router.route('/logout').get(authControllers.logoutUser);

export const authRoute=router;
import { Router } from "express";
import { authRouter } from "./auth.routes";
import { projectRouter } from "./project.routes";
import { roleRouter } from "./role.routes";
import { userRouter } from "./user.routes";
import { meRouter } from "./me.routes";
import { workshopCategoryRouter } from "./workshopCategory.routes";
import { venueRouter } from "./venue.routes";
import { marqueeRouter } from "./marquee.routes";
import { workshopRouter } from "./workshop.routes";
import { registrationRouter } from "./registration.routes";
import { organisationRouter } from "./organisation.routes";
import { enrollmentRouter } from "./enrollment.routes";
import { attendanceRouter } from "./attendance.routes";
import { questionBankRouter } from "./questionBank.routes";
import { feedbackQuestionBankRouter } from "./feedbackQuestionBank.routes";
import { certificateTemplateRouter } from "./certificateTemplate.routes";
import { certificateRouter } from "./certificate.routes";
import { publicRouter } from "./public.routes";

export const apiRouter = Router();

apiRouter.use("/auth", authRouter);
apiRouter.use("/projects", projectRouter);
apiRouter.use("/roles", roleRouter);
apiRouter.use("/users", userRouter);
apiRouter.use("/me", meRouter);

apiRouter.use("/workshop-categories", workshopCategoryRouter);
apiRouter.use("/venues", venueRouter);
apiRouter.use("/marquee", marqueeRouter);
apiRouter.use("/workshops", workshopRouter);
apiRouter.use("/registrations", registrationRouter);
apiRouter.use("/organisations", organisationRouter);
apiRouter.use("/enrollments", enrollmentRouter);
apiRouter.use("/attendance", attendanceRouter);
apiRouter.use("/question-bank", questionBankRouter);
apiRouter.use("/feedback-question-bank", feedbackQuestionBankRouter);
apiRouter.use("/certificate-templates", certificateTemplateRouter);
apiRouter.use("/certificates", certificateRouter);

// Unauthenticated public-site surface — browse workshops, submit a registration.
apiRouter.use("/public", publicRouter);

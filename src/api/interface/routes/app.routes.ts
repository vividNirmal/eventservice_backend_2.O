import express from "express";
import { checkAdmin, protectedRoute} from "../../middleware/auth.middleware";
import { validateRequest, validateRequestBody } from "../../middleware/validation.middleware";
import { storeAdminEvent,updateAdminEvent,getAdminEventDetails  ,getAdminEventList,deleteAdminEvent,generateUniqueURL,generateRegistrationURL,getTokeneventDetails,getParticipantUserList,getAllParticipantUserList,getPeopleList,UpdateExtraEventDetails,GetExtraEventDetails, getParticipantUserDetails, getDeviceUrl, verifyDeviceAndLogin, getEventStatistics, generateCleanDeviceUrl, resolveDeviceUrl, generateCleanFormUrl, resolveFormUrl} from "../../interface/controllers/adminevent.controller";
import { registerUser , loginUser} from "../../interface/controllers/auth.controller";
import { getCountry,getState,getCity,importXlsxData,getHomePageCity } from "../../interface/controllers/location.controller";
import { getSetting , updateSetting } from "../../interface/controllers/setting.controller";
import { storeScannerMachine,updateScannerMachine,deleteScannerMachine,getScannerMachine,assignScannerMachine,removeAssignScannerMachine,getScannerMachineDetails,checkUniqueMachineId,getScannerMachinesByCompany } from "../../interface/controllers/scannerMachine.controller";
import { storeCompanyController,getCompany,getCompanyDetails,updateCompanyController,deleteCompany,updateCompanyStatus, updateCompanyLogo } from "../../interface/controllers/company.controller";

import { getEventDetailsSlug,logoutAllScanners,scannerPageLogin } from "../../interface/controllers/ScannerPage.controller";
import { storeEventParticipantUser ,getUserDetailsUsingEmail,generateEventPdf,generateScannerEventPdf,getParticipantDetails,getParticipantDetailsScanner,scanFaceId,scanParticipantFace, OtpGenerate, OtpVerify, updateParticipantUser, toggleParticipantBlockStatus } from "../../interface/controllers/participantUser.controller";
import { getAdminUser,storeAdminUser,getSingleAdminUser,updateAdminUser,checkEmailUser,deleteAdminUser,forgetPassword,setPassword,updateUserStatus,changePassword} from "../../interface/controllers/adminuser.controller";
import { registerUserSchema,loginUserSchema,updateUserSchema,forgetPasswordSchema,setPasswordSchema,updateStatusUserSchema,deleteUsersSchema,changePasswordSchema,scannerPageLoginUserSchema} from "../../utils/validation-schems/user.validation";
import { EventParticipantUsers, DynamicEventParticipantUsers, sendOtpValidation, UpdateParticipantUsers, verifyOtpValidation } from "../../utils/validation-schems/event_participant_users.validation";
import { adminEventSchema , adminUpdateEventSchema,deleteEventSchema,extraEventDetails,getDeviceUrlSchema,updateExtraEventDetails, verifyDeviceAndLoginSchema, verifyDeviceDirectAccessSchema, generateFormUrlSchema} from "../../utils/validation-schems/adminevent.validation";
import { uploadImagesFile, uploadTemplateAttachments } from "../../helper/helper";
import { settingSchema } from "../../utils/validation-schems/setting.validation";
import { updateCompanySchema , registerCompanySchema,deleteCompanySchema ,updateStatusCompanySchema, updateCompanyLogoSchema} from "../../utils/validation-schems/company.validation";
import { getParticipantDetailsSchema, toggleParticipantBlockStatusSchema } from "../../utils/validation-schems/participantDetails.validation";
import { addScannerMachineSchema,updateScannerMachineSchema,deleteScannerMachineSchema,assignScannerMachineSchema } from "../../utils/validation-schems/scannerMachine.validation";
import { scannerData ,scannerGetData} from "../../utils/validation-schems/scannerData.validation";
import { blogValidation,updateBlogValidation,homeBlogdetailsValidation,deleteEventBlog } from "../../utils/validation-schems/blogValidation.validation";
import { getEventBlog,storeBlogController,eventBlogDetailsController, updateBlogController,locationWiseEventList,locationWiseBlogDetails,deleteEventBlogController} from "../../interface/controllers/eventBlog.conroller";
import { storeAdminCompanyController,getAdminCompanyList,getAdminCompanyDetails,updateAdminCompanyController,deleteAdminCompanyController } from "../../interface/controllers/adminCompany.controller";
import {  storeCompanyTeamController , updateCompanyTeamController,deleteCompanyTeamController,getCompanyTeamDetails,getCompanyTeamList } from "../../interface/controllers/companyTeam.controller";
import { adminCompanySchema,updateAdminCompanySchema,deleteAdminCompanySchema } from "../../utils/validation-schems/adminCompanySchema.validation";
import { companyTeamSchema,updateCompanyTeamSchema,deleteCompanyTeamSchema } from "../../utils/validation-schems/companyTeamSchema.validation";
import { getEventDetailValidation,scanParticipantFaceSchema } from "../../utils/validation-schems/scannerPage.validation";
import { verifyScannerToken } from "../../middleware/scanner.middleware";
import { getAdminEventHostList, storeAdminEventHost, updateAdminEventHost, getAdminEventHostDetails, getAdminEventHostListByCompany, linkTicketToEventHost, checkTicketLinkStatus, copyAdminEventHost } from "../controllers/eventHost.controller";
import { eventHostUpdateSchema, eventHostSchema } from "../../utils/validation-schems/eventHostSchema.validation";
import { getFormListController, getFormDetailsController, createFormController, updateFormController, deleteFormController, addPageController, exportFormController, importFormController } from "../../interface/controllers/form.controller";
import { createFormSchema, updateFormBodySchema, deleteFormSchema, getFormByIdSchema } from "../../utils/validation-schems/form.validation";
import { getTicketListController, getTicketDetailsController, createTicketController, updateTicketController, deleteTicketController, getTicketsByUserTypeController, bulkDeleteTicketsController, exportTicketsController, importTicketsController, generateTicketRegistrationUrl } from "../../interface/controllers/ticket.controller";
import { createTicketSchema, updateTicketBodySchema, deleteTicketSchema, getTicketByIdSchema, getTicketsQuerySchema } from "../../utils/validation-schems/ticket.validation";
import { createDeviceConfiguration, updateDeviceConfiguration, deleteDeviceConfiguration, getDeviceConfigurationsByCompany, getDeviceConfigurationById } from "../../interface/controllers/deviceConfiguration.controller";
import { createDeviceConfigurationSchema, updateDeviceConfigurationSchema, deleteDeviceConfigurationSchema, getDeviceConfigurationByCompanySchema } from "../../utils/validation-schems/deviceConfiguration.validation";
import { createDefaultFieldController, deleteManyDefaultFieldsController, getAllDefaultFieldsController, getDefaultFieldByIdController, getDefaultFieldByUserTypeController, updateDefaultFieldByIdController } from "../controllers/defaultField.controller";
import { createDefaultFieldSchema, deleteDefaultFieldSchema } from "../../utils/validation-schems/defualtField.validation";
import { getTemplateTypeListController, getTemplateTypeDetailsController, createTemplateTypeController, updateTemplateTypeController, deleteTemplateTypeController } from "../controllers/templateType.controller";
import { getTemplateListController, getTemplateDetailsController, createTemplateController, updateTemplateController, deleteTemplateController,  } from "../controllers/template.controller";
import { createUserTemplate, deleteUserTemplateController, getUserTemplateDetails, getUserTemplates, updateUserTemplateController } from "../controllers/userTemplate.controller";
import { createUserTemplateValidation, updateUserTemplateValidation } from "../../utils/validation-schems/userTemplate.validation";
import multer from "multer";
import { createUserTypeSchema, updateUserTypeSchema } from "../../utils/validation-schems/userType.validation";
import { createUserTypeController, deleteUserTypeByIdController, getAllUserTypesController, getUserTypeByIdController, updateUserTypeByIdController } from "../controllers/userType.controller";
import { createUserTypeMapController, deleteUserTypeMapByIdController, getAllUserTypeMapsController, getUserTypeMapByIdController, updateUserTypeMapByIdController } from "../controllers/userTypeMap.controller";
import { createUserTypeMapSchema, updateUserTypeMapSchema } from "../../utils/validation-schems/userTypeMap.validation";
import { generateFormRegistrationPdf, getFormRegistrationListController, getRegistrationController, resolveEmailController, resolveFormUrlController, submitRegistrationController, updateFormRegistrationController, updateFormRegistrationStatusController } from "../controllers/formRegistration.controller";
import { formRegistrationStatusValidation, generatePdfValidation, resolveEmailValidation, resolveFormUrlValidation, submitRegistrationValidation, updateRegistrationValidation } from "../../utils/validation-schems/formRegistration.validation";
import { createEBadgeTemplateSchema, updateEBadgeTemplateSchema } from "../../utils/validation-schems/eBadgeTemplate.validation";
import { createEBadgeTemplateController, deleteEBadgeTemplateByIdController, getAllEBadgeTemplatesController, getEBadgeTemplateByIdController, updateEBadgeTemplateByIdController } from "../controllers/eBadgeTemplate.controller";
import { createEBadgeSettingSchema, updateEBadgeSettingSchema } from "../../utils/validation-schems/eBadgeSetting.validation";
import { createEBadgeSettingController, deleteEBadgeSettingByIdController, getAllEBadgeSettingsController, getEBadgeSettingByIdController, updateEBadgeSettingByIdController } from "../controllers/eBadgeSetting.controller";
import { createFieldConstantController, deleteFieldConstantByIdController, getAllFieldConstantsController, getFieldConstantByIdController, updateFieldConstantByIdController } from "../controllers/fieldConstant.controller";
import { createfieldConstantSchema, updateFieldConstantSchema } from "../../utils/validation-schems/fieldconstant.validation";

const storage = multer.memoryStorage();
export const upload = multer({ storage: storage });


// import { getUsersProfiles, imageCaptionUpdate, imageUpload, removeImages, removeSingleImage, setProfileImage, updateUserProfile } from "../controllers/user.controller";
    const route = express.Router();

    export const appRoute = (router: express.Router): void => {
        try {

            router.use('/v1', route)
            
            //auth urls

            //Admin company module

            route.post('/store-admin-company',protectedRoute,validateRequest(adminCompanySchema),storeAdminCompanyController);
            route.get('/get-admin-company-list',protectedRoute,getAdminCompanyList);
            route.get('/get-admin-company-details/:id',protectedRoute,getAdminCompanyDetails);
            route.post('/update-admin-company',protectedRoute,validateRequest(updateAdminCompanySchema),updateAdminCompanyController);
            route.post('/delete-admin-company',protectedRoute,validateRequest(deleteAdminCompanySchema),deleteAdminCompanyController);

            route.get('/get-company-team-list',protectedRoute,getCompanyTeamList);
            route.post('/store-company-team',protectedRoute,validateRequest(companyTeamSchema),storeCompanyTeamController);
            route.post('/update-company-team',protectedRoute,validateRequest(updateCompanyTeamSchema),updateCompanyTeamController);
            route.get('/get-company-team-details/:id',protectedRoute,getCompanyTeamDetails);
            route.post('/delete-company-team',protectedRoute,validateRequest(deleteCompanyTeamSchema),deleteCompanyTeamController);

            
            route.post("/register",validateRequest(registerUserSchema),registerUser);
            route.post("/login",validateRequest(loginUserSchema),loginUser);
            route.post("/logout",validateRequest(loginUserSchema),loginUser);

            //email validation api

            route.get("/check-email", protectedRoute ,checkEmailUser);

            //admin users url
            route.get("/get-admin-user-list", protectedRoute ,getAdminUser);
            
            route.post("/save-admin-users",protectedRoute,validateRequest(registerUserSchema),storeAdminUser);
            route.get("/get-single-admin-users/:id",protectedRoute,getSingleAdminUser);
            route.post("/update-admin-users",protectedRoute,validateRequest(updateUserSchema),updateAdminUser);
            route.post("/delete-admin-user",protectedRoute,validateRequest(deleteUsersSchema),deleteAdminUser);            
            route.post("/update-user-status", protectedRoute,validateRequest(updateStatusUserSchema), updateUserStatus)

            //event module urls
            route.post("/save-event-details",protectedRoute,validateRequest(adminEventSchema),storeAdminEvent);
            route.post("/update-event-details",protectedRoute,validateRequest(adminUpdateEventSchema),updateAdminEvent);
            route.get("/get-event-details/:id",protectedRoute,getAdminEventDetails);
            // route.get("/delete-event/:id",protectedRoute,deleteAdminEvent);
            route.get("/get-event-list",protectedRoute,getAdminEventList);
            route.post("/delete-event", protectedRoute,validateRequest(deleteEventSchema), deleteAdminEvent)
            route.get("/get-event-statistics/:id",protectedRoute,getEventStatistics);
            route.get("/get-paticipant-user-list/:token",protectedRoute,getParticipantUserList);
            route.get("/get-all-paticipant-user-list",protectedRoute,getAllParticipantUserList);
            route.get("/get-people-list",protectedRoute,getPeopleList);
            route.get("/get-paticipant-user-detail/:id",protectedRoute,getParticipantUserDetails);
            route.post("/update-praticipent-user-details",validateRequest(UpdateParticipantUsers),updateParticipantUser);
            route.post("/toggle-participant-block-status",protectedRoute,validateRequestBody(toggleParticipantBlockStatusSchema),toggleParticipantBlockStatus);            
            route.post("/update-extra-event-details",protectedRoute,validateRequest(updateExtraEventDetails),UpdateExtraEventDetails);
            route.post("/get-extra-event-details",protectedRoute,validateRequest(extraEventDetails),GetExtraEventDetails);

            //event host module
            route.post("/save-event-host",protectedRoute,uploadImagesFile,validateRequest(eventHostSchema),storeAdminEventHost);
            route.post("/update-event-host",protectedRoute,uploadImagesFile,validateRequest(eventHostUpdateSchema),updateAdminEventHost);
            route.post("/copy-event-host/:id",protectedRoute,copyAdminEventHost);
            route.get("/get-event-host-list",protectedRoute,getAdminEventHostList);
            route.get("/get-event-host-details/:id",protectedRoute,getAdminEventHostDetails);

            // admin route to get event host list by company
            route.get("/get-event-host-list-by-company", checkAdmin, getAdminEventHostListByCompany);
            
            // ticket linking routes
            route.post("/link-ticket-to-event-host", protectedRoute, linkTicketToEventHost);
            route.get("/check-ticket-link-status/:ticketId", protectedRoute, checkTicketLinkStatus);
            
            //unique url generate
            route.get("/generate-unique-url/:slug",protectedRoute,generateUniqueURL);
            route.get("/get-event-details-using-token/:token",getTokeneventDetails);
            route.get("/get-registration-url/:slug",generateRegistrationURL);

            route.post("/get-device-url",protectedRoute, validateRequest(getDeviceUrlSchema), getDeviceUrl);
            route.post("/generate-clean-device-url",protectedRoute, validateRequest(getDeviceUrlSchema), generateCleanDeviceUrl);
            route.get("/resolve-device-url/:shortId", resolveDeviceUrl);
            route.post("/generate-clean-form-url",protectedRoute, validateRequest(generateFormUrlSchema), generateCleanFormUrl);
            route.get("/resolve-form-url/:eventSlug", resolveFormUrl);
            route.post("/verify-device-and-login", validateRequest(verifyDeviceAndLoginSchema), verifyDeviceAndLogin);

            //store participant urls
            route.get("/getuser",getTokeneventDetails);
            route.get("/get-user-details/:email",getUserDetailsUsingEmail);
            
            // Use conditional validation based on form_type
            route.post("/store-participant-details", (req, res, next) => {
                const schema = req.body.form_type === 'dynamic' ? DynamicEventParticipantUsers : EventParticipantUsers;
                return validateRequestBody(schema)(req, res, next);
            }, storeEventParticipantUser);
            
            route.get("/generate-event-pdf/:encrypt_token",generateEventPdf);
            route.post("/generate-event-pdf-scanner",validateRequest(scannerGetData),generateScannerEventPdf);            

            //location module urls
            route.get('/get-country',getCountry)
            route.get('/get-state/:id',getState)
            route.get('/get-city/:id',getCity)
            route.get('/scanner-page',getSetting)
            route.post("/importXlsxData",importXlsxData)
            route.post('/update-button-setting',validateRequest(settingSchema),updateSetting)
            
            //Form Management Module URLs
            route.get('/forms',protectedRoute,getFormListController);
            route.get('/forms/:id',getFormDetailsController);
            route.post('/forms',protectedRoute,validateRequest(createFormSchema),createFormController);
            route.put('/forms/:id',protectedRoute,validateRequestBody(updateFormBodySchema),updateFormController);
            route.delete('/forms/:id',protectedRoute,deleteFormController);
            route.put('/forms/add-page/:id', protectedRoute, addPageController);
            route.get('/form/export/:id',protectedRoute,exportFormController)
            route.post('/form/import/:id',upload.single("file"),importFormController)

            // form Field management
            route.post('/store-default-field',protectedRoute,validateRequest(createDefaultFieldSchema),createDefaultFieldController);
            route.get('/get-default-field-list',protectedRoute,getAllDefaultFieldsController);
            route.get('/get-default-field/:id',protectedRoute,getDefaultFieldByIdController);
            route.post('/update-default-field/:id',protectedRoute,validateRequest(createDefaultFieldSchema),updateDefaultFieldByIdController);
            route.post("/default-fields/delete",protectedRoute,validateRequest(deleteDefaultFieldSchema), deleteManyDefaultFieldsController);
            route.get('/get-default-userType/:userType',getDefaultFieldByUserTypeController)
            // Public form endpoint for participants
            route.get('/public/forms/:id', getFormDetailsController);

            //Ticket Management Module URLs
            route.get('/tickets',protectedRoute,getTicketListController);
            route.get('/tickets/export',protectedRoute,exportTicketsController);
            route.post('/tickets/import',protectedRoute,importTicketsController);
            route.get('/tickets/:id',protectedRoute,getTicketDetailsController);
            route.post('/tickets',protectedRoute,uploadImagesFile,validateRequest(createTicketSchema),createTicketController);
            route.put('/tickets/:id',protectedRoute,uploadImagesFile,validateRequestBody(updateTicketBodySchema),updateTicketController);
            route.delete('/tickets/:id',protectedRoute,deleteTicketController);
            route.post('/tickets/bulk-delete',protectedRoute,bulkDeleteTicketsController);
            route.get('/tickets/by-usertype/:userType',protectedRoute,getTicketsByUserTypeController);
            route.get('/tickets/get-ticket-url/:id', protectedRoute, generateTicketRegistrationUrl);
            
            route.post('/get-praticipent-details',validateRequest(getParticipantDetailsSchema),getParticipantDetails)
            
            //company Module urls
            route.post("/store-company", protectedRoute ,validateRequest(registerCompanySchema),storeCompanyController);
            route.get('/get-company-list' ,getCompany)
            route.get('/get-company-details/:company_id',protectedRoute ,getCompanyDetails)
            route.post("/update-company-details/:company_id", protectedRoute, validateRequest(updateCompanySchema),updateCompanyController)
            route.post("/delete-company", protectedRoute,validateRequest(deleteCompanySchema), deleteCompany)
            route.post("/update-company-status", protectedRoute,validateRequest(updateStatusCompanySchema), updateCompanyStatus)
            route.post("/get-scanner-data-details",validateRequest(scannerData), getParticipantDetailsScanner)
            route.post("/update-company-logo",protectedRoute,validateRequest(updateCompanyLogoSchema),updateCompanyLogo);

            //forget password
            route.post("/forget-password",validateRequest(forgetPasswordSchema),forgetPassword);
            route.post("/set-password",validateRequest(setPasswordSchema),setPassword);

            //scanner machine module
            route.post("/add-scanner-machine",protectedRoute,validateRequest(addScannerMachineSchema),storeScannerMachine);
            route.post("/update-scanner-machine",protectedRoute,validateRequest(updateScannerMachineSchema),updateScannerMachine);
            route.post("/get-scanner-machine-list",protectedRoute,setPassword);
            route.post("/delete-scanner-machine",protectedRoute,validateRequest(deleteScannerMachineSchema),deleteScannerMachine);
            route.get("/get-scanner-machine-list",protectedRoute,getScannerMachine);
            route.post("/assign-scanner-machine",protectedRoute,validateRequest(assignScannerMachineSchema),assignScannerMachine);
            route.post("/remove-assign-scanner-machine",protectedRoute,validateRequest(deleteScannerMachineSchema),removeAssignScannerMachine);
            route.get('/get-scanner-machine/:scanner_machine_id',protectedRoute ,getScannerMachineDetails)
            route.get('/get-scanner-machines-by-company/:company_id',protectedRoute ,getScannerMachinesByCompany)
            route.get("/check-scanner-machine", protectedRoute ,checkUniqueMachineId);
            route.post("/scan-face-id" ,scanFaceId);
            route.post("/scan-participant-face",validateRequest(scanParticipantFaceSchema),scanParticipantFace);
            
            //device configuration module
            route.post("/create-device-configuration",protectedRoute,validateRequest(createDeviceConfigurationSchema),createDeviceConfiguration);
            route.post("/update-device-configuration",protectedRoute,validateRequest(updateDeviceConfigurationSchema),updateDeviceConfiguration);
            route.post("/delete-device-configuration",protectedRoute,validateRequest(deleteDeviceConfigurationSchema),deleteDeviceConfiguration);
            route.get("/get-device-configurations/:company_id/:event_id",protectedRoute,getDeviceConfigurationsByCompany);
            route.get("/get-device-configuration/:id",protectedRoute,getDeviceConfigurationById);
            
            route.post('/get-event-details-slug',validateRequestBody(getEventDetailValidation),getEventDetailsSlug);
            
            //scannerPageLogin
            route.post("/scanner-page-login",validateRequest(scannerPageLoginUserSchema),scannerPageLogin);
            route.post("/logout-all-scanners",protectedRoute,logoutAllScanners);
            //changePasswordSchema
            route.post("/change-password",protectedRoute,validateRequest(changePasswordSchema),changePassword);
            
            //levenex blogs
            route.get("/blogs-listing",protectedRoute,getEventBlog);
            route.post("/add-blog",protectedRoute,validateRequest(blogValidation),storeBlogController);
            route.post("/update-blog",protectedRoute,validateRequest(updateBlogValidation),updateBlogController);
            route.get("/blog-details/:id",protectedRoute,eventBlogDetailsController);
            route.post("/delete-event-blog", protectedRoute,validateRequest(deleteEventBlog),deleteEventBlogController)

            //show frontend side
            route.get('/get-homepage-cities-data',getHomePageCity);
            route.get("/event-blog-listing",locationWiseEventList)
            route.post("/home-page-blog-details",validateRequest(homeBlogdetailsValidation),locationWiseBlogDetails)

            //template type
            route.get('/template-types', protectedRoute, getTemplateTypeListController);
            route.get('/template-types/:id', protectedRoute, getTemplateTypeDetailsController);
            route.post('/template-types', protectedRoute, createTemplateTypeController);
            route.put('/template-types/:id', protectedRoute, updateTemplateTypeController);
            route.delete('/template-types/:id', protectedRoute, deleteTemplateTypeController);
            
            //template
            route.get('/templates', protectedRoute, getTemplateListController);
            route.get('/templates/:id', protectedRoute, getTemplateDetailsController);
            route.post('/templates', protectedRoute, createTemplateController);
            route.put('/templates/:id', protectedRoute, updateTemplateController);
            route.delete('/templates/:id', protectedRoute, deleteTemplateController);

            //user template
            route.get("/user-templates", protectedRoute, getUserTemplates);
            route.get("/user-templates/:id", protectedRoute, getUserTemplateDetails);
            route.post("/user-templates", protectedRoute, uploadImagesFile, validateRequest(createUserTemplateValidation), createUserTemplate);
            route.put("/user-templates/:id", protectedRoute, uploadImagesFile, validateRequest(updateUserTemplateValidation), updateUserTemplateController);
            route.delete("/user-templates/:id", protectedRoute, deleteUserTemplateController);

            // user types
            route.get('/user-types', protectedRoute, getAllUserTypesController);
            route.get('/user-types/:id', protectedRoute, getUserTypeByIdController);
            route.post('/user-types', protectedRoute, validateRequest(createUserTypeSchema), createUserTypeController);
            route.put('/user-types/:id', protectedRoute, validateRequest(updateUserTypeSchema), updateUserTypeByIdController);
            route.delete('/user-types/:id', protectedRoute, deleteUserTypeByIdController);

            // user types
            route.get('/contant-map', protectedRoute, getAllFieldConstantsController);
            route.get('/contant-map/:id', protectedRoute, getFieldConstantByIdController);
            route.post('/contant-map', protectedRoute, validateRequest(createfieldConstantSchema), createFieldConstantController);
            route.put('/contant-map/:id', protectedRoute, validateRequest(updateFieldConstantSchema), updateFieldConstantByIdController);
            route.delete('/contant-map/:id', protectedRoute, deleteFieldConstantByIdController);



            // user type maps
            route.get('/user-type-maps', protectedRoute, getAllUserTypeMapsController);
            route.get('/user-type-maps/:id', protectedRoute, getUserTypeMapByIdController);
            route.post('/user-type-maps', protectedRoute, validateRequest(createUserTypeMapSchema), createUserTypeMapController);
            route.put('/user-type-maps/:id', protectedRoute, validateRequest(updateUserTypeMapSchema), updateUserTypeMapByIdController);
            route.delete('/user-type-maps/:id', protectedRoute, deleteUserTypeMapByIdController);

            // form registration
            route.post("/resolve-ticket-url", validateRequest(resolveFormUrlValidation), resolveFormUrlController);
            route.post("/resolve-email", validateRequest(resolveEmailValidation), resolveEmailController);
            route.post("/store-register-form", uploadImagesFile, validateRequest(submitRegistrationValidation), submitRegistrationController);
            route.post("/generate-pdf-scanner", validateRequest(generatePdfValidation), generateFormRegistrationPdf);
            route.get("/form-registration-list", protectedRoute, getFormRegistrationListController);
            route.get("/get-form-registration/:id", protectedRoute, getRegistrationController);
            route.put("/form-registration-status-change/:id", protectedRoute, validateRequest(formRegistrationStatusValidation), updateFormRegistrationStatusController);
            route.put("/update-register-form/:id", protectedRoute, uploadImagesFile, validateRequest(updateRegistrationValidation), updateFormRegistrationController);

            route.get("/get-e-badge-templates", protectedRoute, getAllEBadgeTemplatesController);
            route.get("/get-e-badge-template-byId/:id", protectedRoute, getEBadgeTemplateByIdController);
            route.post("/create-e-badge-template", protectedRoute, validateRequest(createEBadgeTemplateSchema), createEBadgeTemplateController);
            route.put("/update-e-badge-template/:id", protectedRoute, validateRequest(updateEBadgeTemplateSchema), updateEBadgeTemplateByIdController);
            route.delete("/delete-e-badge-template/:id", protectedRoute, deleteEBadgeTemplateByIdController);

            route.get("/get-e-badge-settings", protectedRoute, getAllEBadgeSettingsController);
            route.get("/get-e-badge-setting-byId/:id", protectedRoute, getEBadgeSettingByIdController);
            route.post("/create-e-badge-setting", protectedRoute, validateRequest(createEBadgeSettingSchema), createEBadgeSettingController);
            route.put("/update-e-badge-setting/:id", protectedRoute, validateRequest(updateEBadgeSettingSchema), updateEBadgeSettingByIdController);
            route.delete("/delete-e-badge-setting/:id", protectedRoute, deleteEBadgeSettingByIdController);

            route.post('/send-otp',verifyScannerToken,validateRequest(sendOtpValidation),OtpGenerate);
            route.post('/verify-otp',validateRequest(verifyOtpValidation),OtpVerify);


        } catch (error) {
            // Log any errors that occur during route definition
            console.log(error, 'warn')
        }
    }

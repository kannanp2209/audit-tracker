	//var mysql = require('mysql');
	//var dbConfig = require("./db_connection.js");
	//var dbConnection = mysql.createConnection(dbConfig.databaseOptions);
	var DBQuery = require('./DBQuery.js');
	var nodemailer = require('nodemailer');
	const fs = require('fs');
	var base64ToImage = require('base64-to-image');
	const imageThumbnail = require('image-thumbnail');
	var dateFormat = require('date-format');
	var moment = require('moment-timezone');

	var AppLink = "https://gembawalker.wabco-auto.com/";
	var MailLogo = "https://mobility-webservices.wabco-auto.com/gembawalker/mail_logo/mail-logo.png";

	var dbQuery = new DBQuery();

	function jsonCovert(status, content, value) {
	    return { "status": status, "content": content, "value": value };
	}

	function Base64Encode(EncodeData) {
	    let buf = Buffer.from(EncodeData, 'utf-8');
	    return buf.toString('base64');
	}

	function Base64Decode(DecodeData) {
	    const buff = Buffer.from(DecodeData, 'base64');
	    return buff.toString('utf-8');
	}

	function jsonCovertToken(status, content, value, token) {
	    return { "status": status, "content": content, "value": value, "token": token };
	}
	
	function ConvertTime(LocationId, DateTime)
	{
		var TimeZone = '';
		if(LocationId == 1) {
			/* ----------- India Location ----------- */
			TimeZone = 'Asia/Kolkata';
		} else if(LocationId == 2) {
			/* ----------- Poland Location ----------- */
			TimeZone = 'Europe/Warsaw';
		} else if(LocationId == 3) {
			/* ----------- German Location ----------- */
			TimeZone = 'Europe/Berlin';
		} else if(LocationId == 4) {
			/* ----------- Brazil Location ----------- */
			TimeZone = 'America/Sao_Paulo';
		} else if(LocationId == 5) {
			/* ----------- China Location ----------- */
			TimeZone = 'Asia/Shanghai';
		} else if(LocationId == 7) {
			/* ----------- Japan Location ----------- */
			TimeZone = 'Asia/Tokyo';
		} else {
			TimeZone = 'Asia/Kolkata';
		}
		
		if(DateTime == '') { DateTime = new Date(); }
			
		const ConvertedTime = moment.tz(DateTime, TimeZone).format("yyyy-MM-DD hh:MM:ss");
		return ConvertedTime;
	}

	function SendEmail(fromMail, toMail, ccMail, subject, body, Attachments) {
	    /* host: 'smtp.gmail.com',
	    	port: 587,
	    	secure: false,
	    	requireTLS: false,
	    	auth: {
	    		user: 'mobility.wabco@gmail.com',
	    		pass: 'ghydebujxtfsybaw'
	    	}*/
	    fromMail = 'noreply-gembawalker@zf.com';
	    var transporter = nodemailer.createTransport({
	        host: 'Frd-mail.emea.zf-world.com',
	        port: 25,
	        secure: false,
	        requireTLS: false
	    });

	    if (Attachments != '' && Attachments != null) {
	        var mailOptions = {
	            from: fromMail,
	            to: toMail,
	            cc: ccMail,
	            subject: subject,
	            html: body,
	            attachments: [{ filename: Attachments, path: 'https://mobility-services.wabco-auto.com/randomaudit/GetImage?image=' + Attachments }]
	        };
	    } else {
	        var mailOptions = {
	            from: fromMail,
	            to: toMail,
	            cc: ccMail,
	            subject: subject,
	            html: body
	        };
	    }


	    transporter.sendMail(mailOptions, function(error, info) {
	        if (error) {
	            console.log(error);
	            //this.jsonCovert("error", "Mail not sent", 0);
	            //info.json(this.jsonCovert("error", error, 0));
	        } else {
	            console.log("Success");
	            return true;
	            //this.jsonCovert("success", "Mail Successfully sent", 1);
	            //info.json(this.jsonCovert("success", "Mail Successfully sent", 1));
	        }
	    });
	}

	function CreateNCMail(NCId,LocationId) {
	    dbQuery.GetEmailTemplate('create-nc').then(TempResponse => {
	        dbQuery.NCDetailMail(NCId).then(response => {
	            console.log(response);
	            var AuditerName = response[0]['FirstName'] + " " + response[0]['LastName'];
	            var Area = response[0]['LineName'];
	            var CreatedOn = response[0]['NCCreateOn'];
	            var ChecklistName = response[0]['ChecklistName'];
	            var CategoryTitle = response[0]['CategoryTitle'];
	            var CETitle = response[0]['CETitle'];
	            var MCTitle = response[0]['MCTitle'];
	            var NCDescription = response[0]['NCDescription'];
	            var NCImage = response[0]['NCImage'];

	            var VSPRENG = response[0]['VSPRENG'];
	            var VSPRQLENG = response[0]['VSPRQLENG'];
	            var MRPCNTRL = response[0]['MRPCNTRL'];
	            var PRSFTLD = response[0]['PRSFTLD'];
	            var Engineers = response[0]['Engineers'];
	            var Leaders = response[0]['Leaders'];
				console.log("Engineer"+Engineers);
				console.log("Leaders"+Leaders);
	            var MailReceiver = '';
	            MailReceiver = MailReceiver.concat(Engineers, Leaders);

	             dbQuery.NCReassignAuditeesEmail(Engineers, Leaders, LocationId).then(resDetmail => {
	                var AuditeeEmail = '';
	                for (var i = 0; i <= resDetmail.length - 1; i++) {
	                    if (resDetmail[i]['Email'] != null && resDetmail[i]['Email'] != 0 && resDetmail[i]['Email'] != '') {
	                        console.log(resDetmail.length - 1 + "$$$" + i);
	                        if (resDetmail.length - 1 == i) {
	                            AuditeeEmail = AuditeeEmail.concat(resDetmail[i]['Email'], '');
	                        } else {
	                            AuditeeEmail = AuditeeEmail.concat(resDetmail[i]['Email'], ',');
	                        }
	                    }
	                }

	                var BodyContent = TempResponse[0]['EmailTempBody'];
	                var SubjectContent = TempResponse[0]['EmailTempSubject'];

	                SubjectContent = SubjectContent.replace('{{AREA_NAME}}', Area);
	                SubjectContent = SubjectContent.replace('{{NC_ID}}', '-NC' + NCId);

	                BodyContent = BodyContent.replace('{{AUDITER_NAME}}', AuditerName);
	                BodyContent = BodyContent.replace('{{AREA_NAME}}', Area);
	                BodyContent = BodyContent.replace('{{NC_CREATEDON}}', CreatedOn);
	                BodyContent = BodyContent.replace('{{CHECKLIST_NAME}}', ChecklistName);
	                BodyContent = BodyContent.replace('{{CATEGORY_NAME}}', CategoryTitle);
	                BodyContent = BodyContent.replace('{{CONTROL_ELEMENT_NAME}}', CETitle);
	                BodyContent = BodyContent.replace('{{MISTAKE_CODE_NAME}}', MCTitle);
	                BodyContent = BodyContent.replace('{{NC_DESCRIPTION}}', NCDescription);
	                BodyContent = BodyContent.replace('{{NC_DESCRIPTION}}', NCDescription);
					BodyContentCA = BodyContentCA.replace('{{APP_LINK}}', AppLink);
					BodyContent = BodyContent.replace('{{MAIL_LOGO}}', MailLogo);

                    console.log("mail+!");
	                this.SendEmail('mobility.wabco@gmail.com', AuditeeEmail, '', SubjectContent, BodyContent, NCImage);
	            });

	        });
	    });
	}

	function CreateRACAMail(NCId, LocationId) {
	    dbQuery.GetEmailTemplate('create-ca').then(TempResponse => {
	        dbQuery.NCCADetailMail(NCId, LocationId).then(response => {
	            if (response) {
	                console.log(response);
	                var AuditerName = response[0]['FirstName'] + " " + response[0]['LastName'];
	                var ResponsibleName = response[0]['ResFirstName'] + " " + response[0]['ResLastName'];
	                var Area = response[0]['LineName'];
	                var CreatedOn = response[0]['NCCreateOn'];
	                var ChecklistName = response[0]['ChecklistName'];
	                var CategoryTitle = response[0]['CategoryTitle'];
	                var CETitle = response[0]['CETitle'];
	                var MCTitle = response[0]['MCTitle'];
	                var NCDescription = response[0]['NCDescription'];
	                var NCImage = response[0]['NCImage'];
	                var ImpDate = dateFormat(response[0]['ImpDate'], "dd-mm-yyyy");

	                var ResponsibleId = response[0]['ResponsibleId'];


	                dbQuery.NCResponsibleEmail(ResponsibleId, LocationId).then(resDet => {
	                    var ResponsibleEmail = resDet[0]['Email'];

	                    console.log("#########################");
	                    console.log(ResponsibleEmail);

	                    var BodyContentCA = '';
	                    BodyContentCA = TempResponse[0]['EmailTempBody'];
	                    var SubjectContent = TempResponse[0]['EmailTempSubject'];

	                    SubjectContent = SubjectContent.replace('{{AREA_NAME}}', Area);
	                    SubjectContent = SubjectContent.replace('{{NC_ID}}', '-NC' + NCId);

	                    BodyContentCA = BodyContentCA.replace('{{AUDITER_NAME}}', AuditerName);
	                    BodyContentCA = BodyContentCA.replace('{{AREA_NAME}}', Area);
	                    BodyContentCA = BodyContentCA.replace('{{NC_CREATEDON}}', CreatedOn);
	                    BodyContentCA = BodyContentCA.replace('{{CHECKLIST_NAME}}', ChecklistName);
	                    BodyContentCA = BodyContentCA.replace('{{CATEGORY_NAME}}', CategoryTitle);
	                    BodyContentCA = BodyContentCA.replace('{{CONTROL_ELEMENT_NAME}}', CETitle);
	                    BodyContentCA = BodyContentCA.replace('{{MISTAKE_CODE_NAME}}', MCTitle);
	                    BodyContentCA = BodyContentCA.replace('{{NC_DESCRIPTION}}', NCDescription);
	                    BodyContentCA = BodyContentCA.replace('{{RESPONSIBLE_NAME}}', ResponsibleName);
	                    BodyContentCA = BodyContentCA.replace('{{IMPLEMENT_DATE}}', ImpDate);
	                    BodyContentCA = BodyContentCA.replace('{{APP_LINK}}', AppLink);
	                    BodyContentCA = BodyContentCA.replace('{{MAIL_LOGO}}', MailLogo);


	                    this.SendEmail('mobility.wabco@gmail.com', ResponsibleEmail, '', SubjectContent, BodyContentCA, '');
	                    return true;
	                });
	            }
	        });
	    });
	}

	function CreateNCImplementMail(NCId, LocationId) {
	    dbQuery.GetEmailTemplate('nc-implemented').then(TempResponse => {
	        dbQuery.NCCADetailMail(NCId, LocationId).then(response => {
	            if (response) {
	                console.log(response);
	                var AuditerName = response[0]['FirstName'] + " " + response[0]['LastName'];
	                var Area = response[0]['LineName'];
	                var CreatedOn = response[0]['NCCreateOn'];
	                var ChecklistName = response[0]['ChecklistName'];
	                var CategoryTitle = response[0]['CategoryTitle'];
	                var CETitle = response[0]['CETitle'];
	                var MCTitle = response[0]['MCTitle'];
	                var NCDescription = response[0]['NCDescription'];
	                var NCImage = response[0]['NCImage'];
	                var ImpDate = response[0]['ImpDate'];
	                var ResFirstName = response[0]['ResFirstName'];
	                var ResLastName = response[0]['ResLastName'];
	                var ImpDescription = response[0]['ImpDescription'];

	                var ResponsibleId = response[0]['ResponsibleId'];
	                var AuditerId = response[0]['AuditerId'];


	                dbQuery.NCResponsibleEmail(AuditerId, LocationId).then(resDet => {
	                    var AuditerEmail = resDet[0]['Email'];

	                    console.log("#########################");
	                    console.log(AuditerEmail);

	                    var BodyContentImp = '';
	                    BodyContentImp = TempResponse[0]['EmailTempBody'];
	                    var SubjectContent = TempResponse[0]['EmailTempSubject'];

	                    SubjectContent = SubjectContent.replace('{{AREA_NAME}}', Area);
	                    SubjectContent = SubjectContent.replace('{{NC_ID}}', '-NC' + NCId);

	                    BodyContentImp = BodyContentImp.replace('{{NC_ID}}', '-NC' + NCId);
	                    BodyContentImp = BodyContentImp.replace('{{AREA_NAME}}', Area);
	                    BodyContentImp = BodyContentImp.replace('{{IMP_DATE}}', ImpDate);
	                    BodyContentImp = BodyContentImp.replace('{{RESPONSIBLE_PERSON}}', ResFirstName + ' ' + ResLastName);
	                    BodyContentImp = BodyContentImp.replace('{{IMP_COMMENTS}}', ImpDescription);
						BodyContentImp = BodyContentImp.replace('{{MAIL_LOGO}}', MailLogo);

	                    this.SendEmail('mobility.wabco@gmail.com', AuditerEmail, '', SubjectContent, BodyContentImp, '');
	                    return true;
	                });
	            }
	        });
	    });
	}

	function CreateNCVerifyMail(NCId, TodayDate, LocationId) {
	    dbQuery.GetEmailTemplate('nc-verification').then(TempResponse => {
	        dbQuery.NCVerifyMail(NCId, LocationId).then(response => {
	            console.log(response);
	            var AuditerName = response[0]['FirstName'] + " " + response[0]['LastName'];
	            var Area = response[0]['LineName'];
	            var CreatedOn = response[0]['NCCreateOn'];
	            var CategoryTitle = response[0]['CategoryTitle'];
	            var CETitle = response[0]['CETitle'];
	            var MCTitle = response[0]['MCTitle'];
	            var NCDescription = response[0]['NCDescription'];
	            var NCImage = response[0]['NCImage'];
	            var ImpDate = response[0]['ImpDate'];
	            var ResponsibleId = response[0]['ResponsibleId'];
	            var VrfcDescription = response[0]['VrfcDescription'];
	            if (VrfcDescription == null || VrfcDescription == 'undefined') {
	                VrfcDescription = '-';
	            }
	            var VSPRENG = response[0]['VSPRENG'];
	            var VSPRQLENG = response[0]['VSPRQLENG'];
	            var MRPCNTRL = response[0]['MRPCNTRL'];
	            var PRSFTLD = response[0]['PRSFTLD'];
	            var Engineers = response[0]['Engineers'];
	            var Leaders = response[0]['Leaders'];

	            dbQuery.NCAuditeesEmail(Engineers, LocationId).then(resDetmail => {
	                var AuditeeEmail = '';
	                for (var i = 0; i <= resDetmail.length - 1; i++) {
	                    AuditeeEmail = AuditeeEmail.concat(resDetmail[i]['Email'], ',');
	                }

	                dbQuery.NCResponsibleEmail(ResponsibleId, LocationId).then(resDet => {
	                    var ResponsibleEmail = resDet[0]['Email'];
	                    var ResponsiblePersonName = resDet[0]['FirstName'] + ' ' + resDet[0]['LastName'];

	                    console.log("#########################");
	                    console.log(ResponsibleEmail);

	                    var BodyContentVY = '';
	                    BodyContentVY = TempResponse[0]['EmailTempBody'];
	                    var SubjectContent = TempResponse[0]['EmailTempSubject'];

	                    SubjectContent = SubjectContent.replace('{{AREA_NAME}}', Area);
	                    SubjectContent = SubjectContent.replace('{{NC_ID}}', '-NC' + NCId);

	                    BodyContentVY = BodyContentVY.replace('{{RAID}}', 'NC' + NCId);
	                    BodyContentVY = BodyContentVY.replace('{{NC_ID}}', '-NC' + NCId);
	                    BodyContentVY = BodyContentVY.replace('{{AREA_NAME}}', Area);
	                    BodyContentVY = BodyContentVY.replace('{{AUDITER_NAME}}', AuditerName);
	                    BodyContentVY = BodyContentVY.replace('{{TODAY_DATE}}', TodayDate);
	                    BodyContentVY = BodyContentVY.replace('{{IMP_DATE}}', ImpDate);
	                    BodyContentVY = BodyContentVY.replace('{{RESPONSIBLE_PERSON}}', ResponsiblePersonName);
	                    BodyContentVY = BodyContentVY.replace('{{VERFY_COMMANT}}', VrfcDescription);
						BodyContentCA = BodyContentCA.replace('{{APP_LINK}}', AppLink);
						BodyContentVY = BodyContentVY.replace('{{MAIL_LOGO}}', MailLogo);

	                    this.SendEmail('mobility.wabco@gmail.com', ResponsibleEmail, AuditeeEmail, SubjectContent, BodyContentVY, '');
	                    return true;
	                });
	            });
	        });
	    });
	}

	function CreateNCReassignMail(NCId, TodayDate, LocationId) {
	    dbQuery.GetEmailTemplate('nc-reassign').then(TempResponse => {
	        dbQuery.NCReassignMail(NCId, LocationId).then(response => {
	            console.log(response);
	            var AuditerName = response[0]['FirstName'] + " " + response[0]['LastName'];
	            var Area = response[0]['LineName'];
	            var CreatedOn = response[0]['NCCreateOn'];
	            var CategoryTitle = response[0]['CategoryTitle'];
	            var CETitle = response[0]['CETitle'];
	            var MCTitle = response[0]['MCTitle'];
	            var NCDescription = response[0]['NCDescription'];
	            var NCImage = response[0]['NCImage'];
	            var ImpDate = dateFormat(response[0]['ImpDate'], "dd-mmm-yyyy").split('T')[0];
	            var TodayDate = dateFormat(TodayDate, "dd-mmm-yyyy").split('T')[0];
	            var ResponsibleId = response[0]['ResponsibleId'];
	            var NCReassCommands = response[0]['NCReassCommands'];

	            var VSPRENG = response[0]['VSPRENG'];
	            var VSPRQLENG = response[0]['VSPRQLENG'];
	            var MRPCNTRL = response[0]['MRPCNTRL'];
	            var PRSFTLD = response[0]['PRSFTLD'];
	            var VSPRLD = response[0]['VSPRLD'];
	            var VSPRQLLD = response[0]['VSPRQLLD'];
	            var VSLGSLD = response[0]['VSLGSLD'];
	            var Engineers = response[0]['Engineers'];
	            var Leaders = response[0]['Leaders'];

	            dbQuery.NCReassignAuditeesEmail(Engineers, Leaders, LocationId).then(resDetmail => {
	                var AuditeeEmail = '';
	                for (var i = 0; i <= resDetmail.length - 1; i++) {
	                    if (resDetmail[i]['Email'] != null && resDetmail[i]['Email'] != 0 && resDetmail[i]['Email'] != '') {
	                        console.log(resDetmail.length - 1 + "$$$" + i);
	                        if (resDetmail.length - 1 == i) {
	                            AuditeeEmail = AuditeeEmail.concat(resDetmail[i]['Email'], '');
	                        } else {
	                            AuditeeEmail = AuditeeEmail.concat(resDetmail[i]['Email'], ',');
	                        }
	                    }
	                }
	                console.log("########");
	                console.log(AuditeeEmail);
	                console.log(NCReassCommands);

	                dbQuery.NCResponsibleEmail(ResponsibleId, LocationId).then(resDet => {
	                    var ResponsibleEmail = resDet[0]['Email'];
	                    var ResponsiblePersonName = resDet[0]['FirstName'] + ' ' + resDet[0]['LastName'];

	                    console.log("#########################");
	                    console.log(ResponsibleEmail);

	                    var BodyContentVY = '';
	                    BodyContentVY = TempResponse[0]['EmailTempBody'];
	                    var SubjectContent = TempResponse[0]['EmailTempSubject'];

	                    SubjectContent = SubjectContent.replace('{{AREA_NAME}}', Area);
	                    SubjectContent = SubjectContent.replace('{{NC_ID}}', '-NC' + NCId);

	                    BodyContentVY = BodyContentVY.replace('{{NCID}}', 'NC' + NCId);
	                    BodyContentVY = BodyContentVY.replace('{{NC_ID}}', '-NC' + NCId);
	                    BodyContentVY = BodyContentVY.replace('{{AREA_NAME}}', Area);
	                    BodyContentVY = BodyContentVY.replace('{{AUDITER_NAME}}', AuditerName);
	                    BodyContentVY = BodyContentVY.replace('{{TODAY_DATE}}', TodayDate);
	                    BodyContentVY = BodyContentVY.replace('{{IMP_DATE}}', ImpDate);
	                    BodyContentVY = BodyContentVY.replace('{{RESPONSIBLE_PERSON}}', ResponsiblePersonName);
	                    BodyContentVY = BodyContentVY.replace('{{NC_COMMANT}}', NCReassCommands);
	                    BodyContentVY = BodyContentVY.replace('{{APP_LINK}}', AppLink);
	                    BodyContentVY = BodyContentVY.replace('{{MAIL_LOGO}}', MailLogo);


	                    this.SendEmail('mobility.wabco@gmail.com', ResponsibleEmail, AuditeeEmail, SubjectContent, BodyContentVY, '');
	                    return true;
	                });
	            });
	        });
	    });
	}
	
	function LoginOTPMail(UserEmail, UserOTP) {
		
	    dbQuery.GetEmailTemplate('login-otp').then(TempResponse => {
	                
			var BodyContentVY = '';
			BodyContentVY = TempResponse[0]['EmailTempBody'];
			var SubjectContent = TempResponse[0]['EmailTempSubject'];

			BodyContentVY = BodyContentVY.replace('{{OTP_PASSWORD}}', UserOTP);
			BodyContentVY = BodyContentVY.replace('{{MAIL_LOGO}}', MailLogo);

			this.SendEmail('mobility.wabco@gmail.com', UserEmail, '', SubjectContent, BodyContentVY, '');
			return true;
	    });
	}
	
	async function ThumbnailCreate(fileName) {
	    console.log("!!!!!!!!!!!!!@@@@@@@@@@" + fileName);
	    var fileName_thumnail = "resize_" + fileName;
	    const Ipath = "assets/upload_images/" + fileName;
	    const IpathThumbnail = "assets/upload_images/" + fileName_thumnail;

	    let options = { width: 200, height: 200, responseType: 'base64', jpegOptions: { force: true, quality: 90 } };
	    const Base64Thumbnail = await imageThumbnail('assets/upload_images/' + fileName, options);
	    //const Base64Thumbnail = await imageThumbnail(base64Data);
	    //console.log("Resized image Thumnail ################### "+Base64Thumbnail);
	    require("fs").writeFile(IpathThumbnail, Base64Thumbnail, 'base64', function(err) {
	        console.log("###########");
	        console.log(err);
	    });
	}


	function SendEmailNew(fromMail, toMail, ccMail, subject, body, Attachments) {
	    /* host: 'smtp.gmail.com',
	    	port: 587,
	    	secure: false,
	    	requireTLS: false,
	    	auth: {
	    		user: 'mobility.wabco@gmail.com',
	    		pass: 'ghydebujxtfsybaw'
	    	}*/
	    fromMail = 'info-gembawalker@zf.com';
	    var transporter = nodemailer.createTransport({
	        host: 'Frd-mail.emea.zf-world.com',
	        port: 25,
	        secure: false,
	        requireTLS: false
	    });

	    if (Attachments != '' && Attachments != null) {
	        var mailOptions = {
	            from: fromMail,
	            to: toMail,
	            cc: ccMail,
	            subject: subject,
	            html: body,
	            attachments: [{ filename: Attachments, path: 'https://mobility-services.wabco-auto.com/randomaudit/GetImage?image=' + Attachments }]
	        };
	    } else {
	        var mailOptions = {
	            from: fromMail,
	            to: toMail,
	            cc: ccMail,
	            subject: subject,
	            html: body
	        };
	    }


	    transporter.sendMail(mailOptions, function(error, info) {
	        if (error) {
	            console.log(error);
	            //this.jsonCovert("error", "Mail not sent", 0);
	            //info.json(this.jsonCovert("error", error, 0));
	        } else {
	            console.log("Success");
	            return true;
	            //this.jsonCovert("success", "Mail Successfully sent", 1);
	            //info.json(this.jsonCovert("success", "Mail Successfully sent", 1));
	        }
	    });
	}



	module.exports.jsonCovert = jsonCovert;
	module.exports.jsonCovertToken = jsonCovertToken;
	module.exports.ConvertTime = ConvertTime;
	module.exports.SendEmail = SendEmail;
	module.exports.CreateNCMail = CreateNCMail;
	module.exports.CreateRACAMail = CreateRACAMail;
	module.exports.CreateNCVerifyMail = CreateNCVerifyMail;
	module.exports.Base64Encode = Base64Encode;
	module.exports.Base64Decode = Base64Decode;
	module.exports.CreateNCReassignMail = CreateNCReassignMail;
	module.exports.CreateNCImplementMail = CreateNCImplementMail;
	module.exports.ThumbnailCreate = ThumbnailCreate;
	module.exports.SendEmailNew = SendEmailNew;
	module.exports.LoginOTPMail = LoginOTPMail;
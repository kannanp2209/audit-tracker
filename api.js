'use strict';

const express = require("express");
var bodyParser = require("body-parser");
const app = express();
const fileUpload = require('express-fileupload');

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json({ limit: "50mb" }));

const fs = require('fs');
var base64ToImage = require('base64-to-image');
const imageThumbnail = require('image-thumbnail');
//var Jimp = require('jimp');
var Common = require('./common');
var DBQuery = require('./DBQuery.js');
//var connect = require('connect');
var tables = require("./tables.js");
var dateFormat = require('date-format');
var jwt = require('jsonwebtoken');
const config = require('./config.js');
const path = require('path');
var cron = require('node-cron');
var request = require('request');
var jwt = require('jsonwebtoken');


const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('./swagger.json');

//const nocache = require('nocache');


var dbTable = tables.table;
var dbQuery = new DBQuery();


app.listen(1565, () => {
    var datetime = new Date();
    console.log("Servcer Running on port 1565");
});


app.all("/*", function(req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Content-Length, X-Requested-With');
    res.header('Cache-Control', 'private, no-cache, no-store, must-revalidate');
    next();
});

	/* --------- JWT Token Validation -------------------- */

	var myLogger = function(req, res, next) {
		if (req.originalUrl == '/gembawalker-dev/UserCreate' || req.originalUrl == '/gembawalker-dev/GetHrStatus' || req.originalUrl == '/gembawalker-dev/GetUserDetails' || req.originalUrl == '/gembawalker-dev/RefreshToken') {
			next();
		} else {
			if (req.method == 'OPTIONS' || req.method == 'GET') {
				console.log(req.originalUrl + ' LOGGED ' + req.method);
				next();
			} else {
				console.log(req.originalUrl + ' LOGGED ' + req.method);
				var token = req.headers.authorization;
				if (typeof token === 'undefined') {
					res.json(Common.jsonCovert("e_token", "Invalid token", 0));
				}
				console.log(token);

				dbQuery.CheckUserTokenDetails(token).then(checktoken => {
					if (checktoken == 1) {
						console.log("@@@@@@@@@@@@@@@@@@@@@@@@@@" + token);
						
						let TokenDecode = jwt.decode(token, { complete: true });
						let Domain = TokenDecode.payload.DomainName;
						dbQuery.GetHrStatus(Domain).then(response => {
							if(response[0]['AM_DOMAIN_ID'] === 'undefined') {
								res.json(Common.jsonCovert("e_user", "User inactive in Scuuess factor.", 0));
							} else {
								next();
							}
							//res.json(Common.jsonCovert("success", response, 1));
						});
						//next()
					} else {
						res.json(Common.jsonCovert("e_token", "Invalid token", 0));
					}
				});
			}
		}
	}

	app.use(myLogger)

	/* --------- JWT Token Validation -------------------- */

	app.use((req, res, next) => {
		res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private')
		next()
	})

	app.use('/gembawalker-dev/TutorialImage', express.static(__dirname + "/assets/mobile_tutorial_slides/auditee/"));
	app.use('/gembawalker-dev/TutorialImage', express.static(__dirname + "/assets/mobile_tutorial_slides/auditor/"));


	console.log("-------------");
	
	app.use('/gembawalker-dev/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
	

	app.use(fileUpload());
	app.use(express.static('data/img'));

	app.post("/gembawalker-dev/test", (req, res, next) => {
		res.json(Common.jsonCovert("success", "Test API", 1));
	});

	app.post("/gembawalker-dev/NewTestMail", (req, res, next) => {
		var ToMail = req.body.tomail;
		Common.SendEmailNew('kannan.p@zf.com', ToMail, '', 'ZF SMTP Test', 'ZF SMTP Test', '');
		res.json(Common.jsonCovert("success", "Test API", 1));
	});

	app.post("/gembawalker-dev/GetUserDetails", (req, res, next) => {
		var DomainName = req.body.DomainName;
		if (DomainName == '') {
			res.json(Common.jsonCovert("error", "Data missing", 0));
		}

		dbQuery.GetUserDetails(DomainName).then(response => {
			if (response.length == 0) {
				res.json(Common.jsonCovert("error", "Data not fount", 0));
			}
			console.log(response[0]['UserId']);
			res.json(Common.jsonCovert("sucess", response[0], 1));
		});
	});

	app.post("/gembawalker-dev/GetUserDetailsNew", (req, res, next) => {
		var UserId = req.body.UserId;
		var LocationId = req.body.LocationId;
		var Auditor = req.body.Auditor;
		if (typeof LocationId === 'undefined') { LocationId = ''; }
		if (UserId == '') {
			res.json(Common.jsonCovert("error", "Data missing", 0));
		}

		dbQuery.GetUserDetailsNew(UserId, LocationId).then(response => {
			if (response.length == 0) {
				res.json(Common.jsonCovert("error", "Data not fount", 0));
			}
			dbQuery.GetUserLineDetails(UserId, LocationId, Auditor).then(responseLine => {
				res.json(Common.jsonCovert("sucess", { 'UserDetails': response[0], 'LineDetails': responseLine }, 1));
			});
		});
	});

	function between(min, max) {  
		return Math.floor(
			Math.random() * (max - min) + min
		)
	}

    

    app.get('/gembawalker-dev/login', function(req, res){
		
		var UsernameVal = req.query.Username;
		var PasswordVal = req.query.Password;
		
		const buff = Buffer.from(PasswordVal, 'base64');
		PasswordVal = buff.toString('utf-8');
		
		console.log(UsernameVal+"^^^^^^^"+PasswordVal);
		
		var client = ldap.createClient({
			url: 'ldaps://zcdem.zf-world.com:636',
			baseDN: 'OU=accounts,o=ZF',
			username: 'cn=S0000258,ou=svcaccounts,o=zf',
			password: 'ghyu67@JH6Cde2FGRD5643hjgp098g62',
			tlsOptions: {
				ca: [fs.readFileSync("zcdem.zf-world.com_withChain.crt")],
				rejectUnauthorized: false // Force Certificate Verification
			}
		});
		
		client.bind('cn='+UsernameVal+',ou=accounts,o=zf', PasswordVal, function (err) {
			if (err) {
				console.log("Error in new connetion " + err)
				res.send({status: 'error', message: err});
			} else {
				console.log("######## Connection Success");
				
				const opts = {
				  filter: '(cn='+UsernameVal+')',
				  scope: 'sub',
				  attributes: ['sn', 'cn', 'mail', 'displayName', 'givenName', 'employeeNumber', 'co', 'passwordExpirationTime', 'zfUserStatus']
				};
				const retVal=[];
					client.search('OU=accounts,o=ZF', opts, (err, ress) => {
						 if(err) {
							 console.log("ERROR in Search"+ err);
							 res.send({status: 'error', message: err});
						 } else {
							 
							 console.log("@@@@@@@@@@@@@@@@@");
							  ress.on('searchEntry', (entry) => {
								console.log('entry: ' + JSON.stringify(entry.object));
								retVal.push(entry.object);
								res.send({status: 'success', message: entry.object});
							  });
							 
						 }
					  
					});

			}
		});
		
	});
	
	app.post("/gembawalker-dev/RefreshToken", (req, res, next) => {
		let Domain = req.body.DomainName;
		let LocationId = req.body.LocationId;
		
		if (Domain == '' || typeof Domain === 'undefined' || LocationId == '' || typeof LocationId === 'undefined') {
			res.json(Common.jsonCovert("error", "Data Missing!", 0));
		}
		
		dbQuery.GetUserDetails(Domain, LocationId).then(responseUser => {
			let EmpId = responseUser[0]['EmpId'];
			let DomainName = responseUser[0]['DomainName'];
			var token = jwt.sign({ UsersEmpId: EmpId, DomainName: DomainName }, config.secret, { expiresIn: '10d' });
			dbQuery.RefreshToken(dbTable.Users, DomainName, LocationId, token).then(result => {
				res.json(Common.jsonCovertToken("sucess", "Token Updated Successfully", DomainName, token));
			});
		});
	});

	app.post("/gembawalker-dev/OTPValidate", (req, res, next) => {
		var UserId = req.body.UserId;
		var UserOTP = req.body.UserOTP;
		var LocationId = req.body.LocationId;
		
		if (UserId == '' || UserOTP == '') {
			res.json(Common.jsonCovert("error", "Data Missing!", 0));
		}
	
		dbQuery.OTPValidate(dbTable.Users, UserId, UserOTP, LocationId).then(response => {
			if (response.length) {
				res.json(Common.jsonCovert("success", "OTP Matched.", 1));
			} else {
				res.json(Common.jsonCovert("error", "Invalid OTP", 0));
			}
		});
	});
	
	app.post("/gembawalker-dev/OTPResend", (req, res, next) => {
		var UserId = req.body.UserId;
		var LocationId = req.body.LocationId;
		var UserOTP = between(100000, 999999);
		
		if (UserId == '') {
			res.json(Common.jsonCovert("error", "Data Missing!", 0));
		}
		
		dbQuery.GetUserDetailsById(dbTable.Users, UserId, LocationId).then(reponseUs => {
			console.log(reponseUs);
			var UserEmail = reponseUs[0]['Email'];
			dbQuery.OTPUpdate(dbTable.Users, UserId, UserOTP).then(response => {
				if (response.length) {
					Common.LoginOTPMail(UserEmail, UserOTP);
					res.json(Common.jsonCovert("success", "OTP Resent.", 1));
				} else {
					res.json(Common.jsonCovert("error", "Oops!", 0));
				}
			});
		});
	});

	app.post("/gembawalker-dev/UserCreateResponsible", (req, res, next) => {
		var DomainName = req.body.DomainName;
		var FirstName = req.body.FirstName;
		var LastName = req.body.LastName;
		var Email = req.body.Email;
		var EmpId = req.body.EmpId;
		var Status = 1;
		var SuperAdmin = 0;
		var Auditor = 0;
		var token = jwt.sign({ DomainName: DomainName }, config.secret);
		var LocationId = req.body.LocationId;
		var CreatedOn = Common.ConvertTime(LocationId);
		if (typeof LocationId === 'undefined') { LocationId = ''; }
		dbQuery.GetUserDetails(DomainName, LocationId).then(response => {
			console.log(response.length);
			if (!response.length) {
				if (LocationId != '') {
					var columnKey = "DomainName, FirstName, LastName, Email, EmpId, Status, CreatedOn, SuperAdmin, Auditor, LocationId";
				} else {
					var columnKey = "DomainName, FirstName, LastName, Email, EmpId, Status, CreatedOn, SuperAdmin, Auditor";
				}

				var insertValues = { DomainName: DomainName, FirstName: FirstName, LastName: LastName, Email: Email, EmpId: EmpId, Status: Status, CreatedOn: CreatedOn, SuperAdmin: SuperAdmin, Auditor: Auditor, LocationId: LocationId };
				dbQuery.CreateUserResponsible(dbTable.Users, columnKey, insertValues).then(result => {
					dbQuery.GetUserDetails(DomainName, LocationId).then(responseUser => {
						res.json(Common.jsonCovertToken("sucess", "Successfully Inserted", responseUser[0], token));
					});
				});
			} else {
				console.log("#################################");
				res.json(Common.jsonCovertToken("sucess", "User Already Exist", response[0], token));
			}
		});
	});

	app.post("/gembawalker-dev/PasscodeGenerate", (req, res, next) => {
		var UsersEmpId = req.body.UserEmpId;
		var Passcode = req.body.Passcode;
		var ConfirmPasscode = req.body.ConfirmPasscode;
		var LocationId = req.body.LocationId;
		if (typeof LocationId === 'undefined') { LocationId = ''; }

		if (UsersEmpId == '' || Passcode == '' || ConfirmPasscode == '') {
			res.json(Common.jsonCovert("error", "Invalid Data", 0));
		}

		if (Passcode != ConfirmPasscode) {
			res.json(Common.jsonCovert("error", "Passcode Mismatch", 0));
		}

		var EncodePasscode = Common.Base64Encode(Passcode);

		dbQuery.FetchUserDetails(UsersEmpId, LocationId).then(response => {
			if (response.length) {
				dbQuery.UpdatePasscode(dbTable.Users, EncodePasscode, UsersEmpId, LocationId).then(result => {
					res.json(Common.jsonCovert("success", result, 1));
				});
			} else {
				res.json(Common.jsonCovert("error", "User doesn't match", 0));
			}
		})
	});

	app.post("/gembawalker-dev/PasscodeCheck", (req, res, next) => {
		var UsersEmpId = req.body.UserEmpId;
		var Passcode = req.body.Passcode;
		var LocationId = req.body.LocationId;
		if (typeof LocationId === 'undefined') { LocationId = ''; }

		if (UsersEmpId == '' || Passcode == '') {
			res.json(Common.jsonCovert("error", "Invalid Data", 0));
		}
		var EncodePasscode = Common.Base64Encode(Passcode);

		dbQuery.PasscodeCheck(dbTable.Users, EncodePasscode, UsersEmpId, LocationId).then(result => {
			if (result.length) {
				res.json(Common.jsonCovert("success", result, 1));
			} else {
				res.json(Common.jsonCovert("error", "Invalid Passcode", 0));
			}
		});
	});

	app.post("/gembawalker-dev/GetChecklistNew", (req, res, next) => {
		var LineId = req.body.LineId;
		if (LineId == '') {
			res.json(Common.jsonCovert("error", "Checklist data missing", 0));
		}
		dbQuery.GetChecklistNew(dbTable.Checklists, LineId).then(response => {
			res.json(Common.jsonCovert("success", response, 1));

		});
	});

	app.post("/gembawalker-dev/GetChecklist", (req, res, next) => {
		var LineId = req.body.LineId;
		var UserId = req.body.UserId;
		var LocationId = req.body.LocationId;
		if (typeof LocationId === 'undefined') { LocationId = ''; }
		if (LineId == '' || UserId == '') {
			res.json(Common.jsonCovert("error", "Checklist data missing", 0));
		}
		dbQuery.GetChecklist(dbTable.Checklists, LineId, LocationId).then(response => {
			dbQuery.GetChecklistByRole(dbTable.Checklists, UserId, LocationId).then(responseR => {
				let intersection = response.filter(x => responseR.includes(x));
				if (intersection != '') {
					dbQuery.GetChecklistByIds(dbTable.Checklists, intersection, LocationId).then(responseI => {
						res.json(Common.jsonCovert("success", {Checklists: responseI, Proxy: 0}, 1));
					});
				} else {
					dbQuery.GetChecklistByProxyUserRole(dbTable.Checklists, UserId, LocationId, LineId).then(responsePR => {
						dbQuery.GetProxyUserDetails(UserId, LocationId, LineId).then(responsePX => {
							let intersectionP = response.filter(x => responsePR.includes(x));
							if (intersectionP != '') {
								dbQuery.GetChecklistByIds(dbTable.Checklists, intersectionP, LocationId).then(responseI => {
									res.json(Common.jsonCovert("success",  {Checklists: responseI, Proxy: responsePX}, 1));
								});
							} else {
								res.json(Common.jsonCovert("error", "Checklist not found", 0));
							}
						});
					});
				}
			});
		});
	});

	app.post("/gembawalker-dev/GetCategory", (req, res, next) => {
		var ChecklistId = req.body.ChecklistId;
		var LocationId = req.body.LocationId;
		if (typeof LocationId === 'undefined') { LocationId = ''; }
		if (ChecklistId == '') {
			res.json(Common.jsonCovert("error", "Checklist data missing", 0));
		}
		console.log("#########" + ChecklistId);
		dbQuery.GetCategory(dbTable.AuditCategory, ChecklistId, LocationId).then(response => {
			res.json(Common.jsonCovert("success", response, 1));

		});
	});

	app.post("/gembawalker-dev/GetControllElement", (req, res, next) => {
		var CategoryId = req.body.CategoryId;
		var LocationId = req.body.LocationId;
		if (typeof LocationId === 'undefined') { LocationId = ''; }
		console.log("#########" + req.body.CategoryId);
		if (!CategoryId) {
			res.json(Common.jsonCovert("error", "Category data missing", 0));
		}

		dbQuery.GetControllElement(dbTable.AuditCE, CategoryId, LocationId).then(response => {
			res.json(Common.jsonCovert("success", response, 1));

		});
	});

	app.post("/gembawalker-dev/GetMistakeCode", (req, res, next) => {
		var CategoryId = req.body.CategoryId;
		var CEId = req.body.CEId;
		var LocationId = req.body.LocationId;
		if (typeof LocationId === 'undefined') { LocationId = ''; }
		console.log("#########" + req.body.CEId);
		if (!CEId || !CategoryId) {
			res.json(Common.jsonCovert("error", "Controll Element data missing", 0));
		}

		dbQuery.GetMistakeCode(dbTable.AuditMC, CategoryId, CEId, LocationId).then(response => {
			res.json(Common.jsonCovert("success", response, 1));

		});
	});

	app.post("/gembawalker-dev/GetMistakeCodeByCategory", (req, res, next) => {
		var CategoryId = req.body.CategoryId;
		var RAId = req.body.RAId;
		var LocationId = req.body.LocationId;
		if (typeof LocationId === 'undefined') { LocationId = ''; }
		if (RAId == '') {
			RAId = '';
		}
		if (!CategoryId) {
			res.json(Common.jsonCovert("error", "Data missing", 0));
		}

		dbQuery.GetMistakeCodeByCategory(dbTable.AuditMC, CategoryId, RAId, LocationId).then(response => {
			res.json(Common.jsonCovert("success", response, 1));

		});
	});
	
	app.post("/gembawalker-dev/GetMistakeCodeByCategoryAll", (req, res, next) => {
		
		var RAId = req.body.RAId;
		var CategoryId = req.body.CategoryId;
		var CEId = req.body.CEId;
		var MCId = req.body.MCId;
		var LocationId = req.body.LocationId;
	
		if (!RAId || typeof RAId === 'undefined' || !CategoryId || typeof CategoryId === 'undefined' || !CEId || typeof CEId === 'undefined' || !LocationId || typeof LocationId === 'undefined' || !MCId || typeof MCId === 'undefined') {
			res.json(Common.jsonCovert("error", "Data missing", 0));
		}

		dbQuery.GetMistakeCodeByCategoryAll(dbTable.AuditMC, RAId, CategoryId, CEId, MCId, LocationId).then(response => {
			res.json(Common.jsonCovert("success", response, 1));

		});
	});

	app.post("/gembawalker-dev/GetUserRoles", function(req, res, next) {
		var searchName = req.body.searchKey;
		var LocationId = req.body.LocationId;
		if (typeof LocationId === 'undefined') { LocationId = ''; }
		if (!searchName) {
			res.json(Common.jsonCovert("error", "Data missing", 0));
		}
		dbQuery.GetUserRoles(searchName, LocationId).then(response => {
			res.json(Common.jsonCovert("success", response, 1));
		});

	});


	app.post("/gembawalker-dev/NCCreate", (req, res, next) => {
		var RAId = req.body.RAId;
		var CategoryId = req.body.CategoryId;
		var CEId = req.body.CEId;
		var MCId = req.body.MCId;
		var NCLevel = req.body.NCLevel;
		var NCImage = req.body.NCImage;
		var NCDescription = req.body.NCDescription;
		var AuditerResponsibleId = req.body.AuditerResponsibleId;
		var CreatedOn = dateFormat(new Date(), "yyyy-mm-dd hh:MM:ss");
		console.log(RAId);

		if (!RAId || !CategoryId || !CEId || !MCId) {
			res.json(Common.jsonCovert("error", "Data missing", 0));
		}
		if (!NCDescription) {
			NCDescription = "";
		}

		if (typeof AuditerResponsibleId === 'undefined') {
			AuditerResponsibleId = 0;
		}

		var fileName = "";
		var fileName_thumnail = "";
		if (NCImage != null && NCImage != '') {
			fileName = Date.now() + ".png";
			fileName_thumnail = Date.now() + "_200.png";
			const Ipath = "assets/upload_images/" + fileName;
			const IpathThumbnail = "assets/upload_images/" + fileName_thumnail;
			var base64Data = NCImage.replace(/^data:image\/png;base64,/, "");

			require("fs").writeFile(Ipath, base64Data, 'base64', function(err) {
				console.log(err);
			});
		}

		var columnKey = "RAId, CategoryId, CEId, MCId, NCLevel, NCDescription, NCImage, CreatedOn, AuditerResponsibleId";
		var insertValues = { RAId: RAId, CategoryId: CategoryId, CEId: CEId, MCId: MCId, NCLevel: NCLevel, NCDescription: NCDescription, NCImage: fileName, CreatedOn: CreatedOn, AuditerResponsibleId: AuditerResponsibleId };
		dbQuery.NCCreate(dbTable.RANCList, columnKey, insertValues).then(response => {
			if (response[0]['insertedId']) {
				//Common.CreateNCMail(response[0]['insertedId']);
				res.json(Common.jsonCovert("success", "Successfully Inserted", response[0]['insertedId']));
			} else {
				res.json(Common.jsonCovert("error", "Oops! Try again later", 0));
			}


		});
	});

	app.post("/gembawalker-dev/NCCreateContent", (req, res, next) => {
		var RAId = req.body.RAId;
		var CategoryId = req.body.CategoryId;
		var CEId = req.body.CEId;
		var MCId = req.body.MCId;
		var NCLevel = req.body.NCLevel;
		var NCDescription = req.body.NCDescription;
		var AuditerResponsibleId = req.body.AuditerResponsibleId;
		//var CreatedOn = dateFormat(new Date(), "yyyy-mm-dd hh:MM:ss");
		var LocationId = req.body.LocationId;
		var ProxyUser = req.body.ProxyUser;
		
		if (typeof LocationId === 'undefined') { LocationId = ''; }
		var CreatedOn = Common.ConvertTime(LocationId);
		console.log(RAId);

		if (!RAId || !CategoryId) {
			res.json(Common.jsonCovert("error", "Data missing", 0));
		}
		if (!NCDescription) {
			NCDescription = "";
		}
		if (typeof AuditerResponsibleId === 'undefined') {
			AuditerResponsibleId = 0;
		}
		if (typeof ProxyUser === 'undefined' || ProxyUser == '') {
			ProxyUser = 0;
		}
		
		if (LocationId != '') {
			var columnKey = "RAId, CategoryId, CEId, MCId, NCLevel, NCDescription, CreatedOn, AuditerResponsibleId, LocationId, ProxyUser";
		} else {
			var columnKey = "RAId, CategoryId, CEId, MCId, NCLevel, NCDescription, CreatedOn, AuditerResponsibleId, ProxyUser";
		}

		var insertValues = { RAId: RAId, CategoryId: CategoryId, CEId: CEId, MCId: MCId, NCLevel: NCLevel, NCDescription: NCDescription, CreatedOn: CreatedOn, AuditerResponsibleId: AuditerResponsibleId, LocationId: LocationId, ProxyUser: ProxyUser };
		dbQuery.NCCreateContent(dbTable.RANCList, columnKey, insertValues).then(response => {
			if (response[0]['insertedId']) {
				res.json(Common.jsonCovert("success", "Successfully Inserted", response[0]['insertedId']));
			} else {
				res.json(Common.jsonCovert("error", "Oops! Try again later", 0));
			}
		});
	});
app.post("/gembawalker-dev/NCUpdateContent", (req, res, next) => {
    var NCId = req.body.NCId;
    var RAId = req.body.RAId;
    var CategoryId = req.body.CategoryId;
    var CEId = req.body.CEId;
    var MCId = req.body.MCId;
    var NCLevel = req.body.NCLevel;
    var NCStatus = req.body.NCStatus;
    var NCDescription = req.body.NCDescription;
    var AuditerResponsibleId = req.body.AuditerResponsibleId;
    var LocationId = req.body.LocationId;
	var UpdatedOn = Common.ConvertTime(LocationId);
    if (typeof LocationId === 'undefined') { LocationId = ''; }

    if (!NCId || !RAId || !CategoryId) {
        res.json(Common.jsonCovert("error", "Data missing", 0));
    }
    if (!NCDescription) {
        NCDescription = "";
    }
    if (typeof AuditerResponsibleId === 'undefined') {
        AuditerResponsibleId = 0;
    }

    var updateValues = { NCId: NCId, RAId: RAId, CategoryId: CategoryId, CEId: CEId, MCId: MCId, NCLevel: NCLevel, NCStatus: NCStatus, NCDescription: NCDescription, UpdatedOn: UpdatedOn, AuditerResponsibleId: AuditerResponsibleId, LocationId: LocationId };
    dbQuery.NCUpdateContent(dbTable.RANCList, updateValues).then(response => {
        res.json(Common.jsonCovert("success", "Successfully Updated", response));

    });
});

app.post("/gembawalker-dev/NCImageUpdate", (req, res, next) => {
    var NCId = req.body.NCId;
    var RAId = req.body.RAId;
    var NCImage = req.body.NCImage;
    //var UpdatedOn = dateFormat(new Date(), "yyyy-mm-dd hh:MM:ss");
    var LocationId = req.body.LocationId;
	var UpdatedOn = Common.ConvertTime(LocationId);
    if (typeof LocationId === 'undefined') { LocationId = ''; }

    if (!NCId || !RAId || !NCImage) {
        res.json(Common.jsonCovert("error", "Data missing", 0));
    }

    var fileName = "";
    if (NCImage == "removed") {
        fileName = NCImage;
    } else if (NCImage != null) {
        fileName = Date.now() + ".png";
        const Ipath = "assets/upload_images/" + fileName;
        var base64Data = NCImage.replace(/^data:image\/png;base64,/, "");

        console.log("NC Image " + base64Data);

        var writer = fs.createWriteStream('log.txt');
        writer.write(NCImage);

        require("fs").writeFile(Ipath, base64Data, 'base64', function(err) {
            console.log(err);
        });
    }

    var updateValues = { NCId: NCId, RAId: RAId, NCImage: fileName, UpdatedOn: UpdatedOn, LocationId: LocationId };
    dbQuery.NCImageUpdate(dbTable.RANCList, updateValues).then(response => {
        if (NCImage != null && NCImage != "removed") {
            Common.ThumbnailCreate(fileName);
        }
        res.json(Common.jsonCovert("success", "Successfully Updated", response));

    });
});

	app.post("/gembawalker-dev/NCImageUpdateNew", (req, res, next) => {
		var NCId = req.body.NCId;
		var RAId = req.body.RAId;
		var NCImage = req.body.NCImage;
		var LocationId = req.body.LocationId;
		var UpdatedOn = Common.ConvertTime(LocationId);

		if (!NCId || !RAId || !NCImage) {
			res.json(Common.jsonCovert("error", "Data missing", 0));
		}
		//NCImage = ["123","456","789","012"];
		var fileName = "";
		var FileNameList = [];
		console.log(NCImage);
		if(NCImage.length) {
			NCImage.forEach(ImageVal => {
				fileName = Date.now() + ".png";
				const Ipath = "assets/upload_images/" + fileName;
				if(ImageVal.includes('data:image/png;base64')) {
					var base64Data = ImageVal.replace(/^data:image\/png;base64,/, "");
				}
				if(ImageVal.includes('data:image/jpeg;base64')) {
					var base64Data = ImageVal.replace(/^data:image\/jpeg;base64,/, "");
				}
				//data:image/png;base64         data:image/jpeg;base64
				console.log("NC Image " + base64Data);
				var writer = fs.createWriteStream('log.txt');
				writer.write(ImageVal);
				require("fs").writeFile(Ipath, base64Data, 'base64', function(err) {
					console.log(err);
					//Common.ThumbnailCreate(fileName);
				});
				FileNameList.push(fileName);
			});
		}
		
		
		
		dbQuery.GetNCDetailsForImage(dbTable.RANCList, RAId, NCId).then(resImage => {
			let NCImageVal = resImage[0]['NCImage'];
			if(NCImageVal) {
				NCImageVal = JSON.parse(resImage[0]['NCImage']);
				FileNameList = FileNameList.concat(NCImageVal);
			}
			
			FileNameList = JSON.stringify(FileNameList);
			var updateValues = { NCId: NCId, RAId: RAId, NCImage: FileNameList, UpdatedOn: UpdatedOn, LocationId: LocationId };
			dbQuery.NCImageUpdate(dbTable.RANCList, updateValues).then(response => {
				res.json(Common.jsonCovert("success", "Successfully Updated", response));
			}); 
		});
		
	});
	
	app.post("/gembawalker-dev/NCImageDelete", (req, res, next) => {
		var NCId = req.body.NCId;
		var RAId = req.body.RAId;
		var NCImage = req.body.NCImage;
		var LocationId = req.body.LocationId;
		var UpdatedOn = Common.ConvertTime(LocationId);
		
		dbQuery.GetNCDetailsForImage(dbTable.RANCList, RAId, NCId).then(response => {
			let NCImages = JSON.parse(response[0]['NCImage']);
			var FilteredImages = NCImages.filter(function(value, index, arr){ 
				return value != NCImage;
			});
			console.log(FilteredImages);
			FilteredImages = JSON.stringify(FilteredImages);
			dbQuery.UpdateNCImage(dbTable.RANCList, RAId, NCId, FilteredImages).then(ImgUpdRes => {
				fs.exists("assets/upload_images/"+NCImage, function(exists) {
					if(exists) {
						fs.unlink("assets/upload_images/"+NCImage, (err) => {
							res.json(Common.jsonCovert("success", "Successfully Updated", ImgUpdRes));
						});
					}
					res.json(Common.jsonCovert("success", "Successfully Updated", ImgUpdRes));
				});
			});
		});
	});

app.get("/gembawalker-dev/GetImage", (req, res) => {
    var Uploadimage = req.query.image;
    console.log(Uploadimage);
    res.sendFile(path.join(__dirname, "/assets/upload_images/" + Uploadimage));
});

app.post("/gembawalker-dev/GetNCList", (req, res, next) => {
    var RAId = req.body.RAId;
    var LocationId = req.body.LocationId;
    if (typeof LocationId === 'undefined') { LocationId = ''; }
    if (!RAId) {
        res.json(Common.jsonCovert("error", "Data missing", 0));
    }

    dbQuery.GetNCList(dbTable.RANCList, RAId, LocationId).then(response => {
        res.json(Common.jsonCovert("success", response, 1));

    });
});

app.post("/gembawalker-dev/NCDetail", (req, res, next) => {
    var NCId = req.body.NCId;
    var LocationId = req.body.LocationId;
    if (typeof LocationId === 'undefined') { LocationId = ''; }

    if (!NCId) {
        res.json(Common.jsonCovert("error", "Data missing", 0));
    }

    dbQuery.NCDetail(dbTable.RANCList, NCId, LocationId).then(response => {
        res.json(Common.jsonCovert("success", response, 1));

    });
});

app.post("/gembawalker-dev/NCUpdate", (req, res, next) => {
    var NCId = req.body.NCId;
    var RAId = req.body.RAId;
    var CategoryId = req.body.CategoryId;
    var CEId = req.body.CEId;
    var MCId = req.body.MCId;
    var NCLevel = req.body.NCLevel;
    var NCStatus = req.body.NCStatus;
    var NCImage = req.body.NCImage;
    var NCDescription = req.body.NCDescription;
    var AuditerResponsibleId = req.body.AuditerResponsibleId;
    var UpdatedOn = dateFormat(new Date(), "yyyy-mm-dd hh:MM:ss");

    if (!NCId || !RAId || !CategoryId || !CEId || !MCId) {
        res.json(Common.jsonCovert("error", "Data missing", 0));
    }
    if (!NCDescription) {
        NCDescription = "";
    }
    var fileName = "";
    if (NCImage == "removed") {
        fileName = NCImage;
    } else if (NCImage != null) {
        fileName = Date.now() + ".png";
        const Ipath = "assets/upload_images/" + fileName;
        var base64Data = NCImage.replace(/^data:image\/png;base64,/, "");

        require("fs").writeFile(Ipath, base64Data, 'base64', function(err) {
            console.log(err);
        });
    }

    var updateValues = { NCId: NCId, RAId: RAId, CategoryId: CategoryId, CEId: CEId, MCId: MCId, NCLevel: NCLevel, NCStatus: NCStatus, NCImage: fileName, NCDescription: NCDescription, UpdatedOn: UpdatedOn, AuditerResponsibleId: AuditerResponsibleId };
    dbQuery.NCUpdate(dbTable.RANCList, updateValues).then(response => {
        res.json(Common.jsonCovert("success", "Successfully Updated", response));

    });
});

app.post("/gembawalker-dev/NCReassign", (req, res, next) => {
    var NCId = req.body.NCId;
    var RAId = req.body.RAId;
    var CAId = req.body.CAId;
    var NCReassCommands = req.body.NCReassCommands;
	var LocationId = req.body.LocationId;
	var ReassignProxy = req.body.ReassignProxy;
   // var UpdatedOn = dateFormat(new Date(), "yyyy-mm-dd hh:MM:ss");
	var UpdatedOn = Common.ConvertTime(LocationId);
    //var NCReassOn = dateFormat(new Date(), "yyyy-mm-dd hh:MM:ss");
	var NCReassOn = Common.ConvertTime(LocationId);
    var CAStatus = 2;
    
    if (typeof LocationId === 'undefined') { LocationId = ''; }
    if (typeof ReassignProxy === 'undefined' || ReassignProxy == '') { ReassignProxy = ''; }

    if (!NCId || !RAId || !CAId || !NCReassCommands) {
        res.json(Common.jsonCovert("error", "Data missing......", 0));
    }

    var updateValues = { NCId: NCId, RAId: RAId, CAId: CAId, CAStatus: CAStatus, UpdatedOn: UpdatedOn, NCReassCommands: NCReassCommands, NCReassOn: NCReassOn, ReassignProxy: ReassignProxy };
    dbQuery.NCReassign(dbTable.RACA, updateValues).then(response => {
        dbQuery.SingleNCStatusUpdate(dbTable.RANCList, NCId, 3, LocationId).then(responseNC => {
            res.json(Common.jsonCovert("success", "Successfully Updated", response));
        });

    });
});

app.post("/gembawalker-dev/NCDelete", (req, res, next) => {
    var NCId = req.body.NCId;

    if (!NCId) {
        res.json(Common.jsonCovert("error", "Data missing", 0));
    }

    dbQuery.NCDelete(dbTable.RANCList, NCId).then(response => {
        res.json(Common.jsonCovert("success", "Deleted Successfully", 1));

    });
});

app.post("/gembawalker-dev/RADelete", (req, res, next) => {
    var RAId = req.body.RAId;
    var LocationId = req.body.LocationId;

    if (!RAId) {
        res.json(Common.jsonCovert("error", "Data missing", 0));
    }

    dbQuery.GetNCList(dbTable.RANCList, RAId, LocationId).then(responseRA => {
        if (responseRA.length == 0) {
            dbQuery.RADelete(dbTable.RADetails, RAId).then(response => {
                res.json(Common.jsonCovert("success", "Deleted Successfully", 1));
            });
        } else {
            res.json(Common.jsonCovert("error", "Have NC for this RAId. can't Delete.", 0));
        }
    });
});


app.post("/gembawalker-dev/RACreate", (req, res, next) => {
    var AuditerId = req.body.AuditerId;
    var LineId = req.body.LineId;
    var ChecklistId = req.body.ChecklistId;
    var AuditDescription = req.body.AuditDescription;
    var Status = 1;
    var WkNumber = Date.now();
	var LocationId = req.body.LocationId;
    //var CreatedOn = dateFormat(new Date(), "yyyy-mm-dd hh:MM:ss");
	var CreatedOn = Common.ConvertTime(LocationId);
    var AuditDate = dateFormat(new Date(), "yyyy-mm-dd");
	AuditDate = Common.ConvertTime(LocationId, AuditDate);
    var AuditTime = dateFormat(new Date(), "hh:MM:ss");
	AuditTime = Common.ConvertTime(LocationId, AuditTime);
	var AuditScheduledId = req.body.AuditScheduledId;
    
    if (typeof LocationId === 'undefined') { LocationId = ''; }
    if (typeof AuditScheduledId === 'undefined') { AuditScheduledId = ''; }
    console.log(CreatedOn);

    if (!AuditerId || !LineId || !ChecklistId) {
        res.json(Common.jsonCovert("error", "Data missing", 0));
    }
    if (!AuditDescription) {
        AuditDescription = "";
    }
    
    var columnKey = "AuditerId, LineId, ChecklistId, AuditDate, AuditTime, AuditDescription, Status, CreatedOn, WkNumber, LocationId, AuditScheduledId";
    var insertValues = { AuditerId: AuditerId, LineId: LineId, ChecklistId: ChecklistId, AuditDate: AuditDate, AuditTime: AuditTime, AuditDescription: AuditDescription, Status: Status, CreatedOn: CreatedOn, WkNumber: WkNumber, LocationId: LocationId, AuditScheduledId: AuditScheduledId };
    dbQuery.RACreate(dbTable.RADetails, columnKey, insertValues).then(response => {
        console.log("################" + response[0]['RAId']);
		if(AuditScheduledId) {
			dbQuery.AuditScheduleStatuUpdate(dbTable.AuditScheduled, AuditScheduledId).then(responseAud => {
				res.json(Common.jsonCovert("success", "Successfully Inserted", response[0]['RAId']));
			})
		} else {
			res.json(Common.jsonCovert("success", "Successfully Inserted", response[0]['RAId']));
		}

    });
});

/*app.post("/randomaudit/RAFinish", function(req, res) {
	if (!req.files || Object.keys(req.files).length === 0) {
		res.json(Common.jsonCovert("error", "No files were uploaded.", 0));
	}
	console.log("#############"+req.body.RAId);
	var RAId = req.body.RAId;
	let RAImage = req.files.RAImage;
	//console.log(req.body.sampleId);

	RAImage.mv(__dirname+'/assets/upload_images/'+RAImage.name, function(err) {
		if (err){
			res.json(Common.jsonCovert("error", err, 0));
		}
		var FileName = RAImage.name;
		dbQuery.RAFinish(dbTable.RADetails, FileName, RAId).then(result => {
			res.json(Common.jsonCovert("sucess", "File uploaded successfully.", RAId));
		});
		
	});

}); */

app.post("/gembawalker-dev/RAFinish", function(req, res) {
    var RAId = req.body.RAId;
    var RAStatus = req.body.RAStatus;
    var LocationId = req.body.LocationId;
    if (typeof LocationId === 'undefined') { LocationId = ''; }
    if (!RAId || !RAStatus) {
        res.json(Common.jsonCovert("error", "Data missing", 0));
    }

    if (RAStatus == 'OK') {
        var status = 6;
    } else {
        var status = 2;
    }

    dbQuery.RAFinish(dbTable.RADetails, RAId, status, LocationId).then(result => {
        if (result) {
            console.log("@@@@@@@@@@@@@@@" + status);
            if (status == 2) {
                var NCStatus = 1;
                //res.json(Common.jsonCovert("sucess", "Finished Successfully.", RAId));
                dbQuery.NCStatusUpdate(dbTable.RANCList, RAId, NCStatus, LocationId).then(result => {
                    res.json(Common.jsonCovert("sucess", "Finished Successfully.", RAId));
                });
            } else {
                res.json(Common.jsonCovert("sucess", "Finished Successfully.", RAId));
            }
        } else {
            res.json(Common.jsonCovert("error", "Oops! Please try again later.", 0));
        }
    });
});

/*app.post("/randomaudit/GetRAList", (req, res, next) => {
	var UserId = req.body.UserId;
	if(!UserId) {
		res.json(Common.jsonCovert("error", "Data missing", 0));
	}
	
	
	dbQuery.GetRAList(dbTable.RADetails, UserId).then(response => {
		res.json(Common.jsonCovert("success", response, 1));
	
	});
});*/

app.post("/gembawalker-dev/GetRAList", (req, res, next) => {
    var UserId = req.body.UserId;
    var Auditer = req.body.Auditer;
    if (!UserId) {
        res.json(Common.jsonCovert("error", "Data missing", 0));
    }

    /*var Token = req.headers['Authorization'];
    var TokenDecode = jwt.decode(Token, {complete: true});
    console.log("@@@@@@@@@@@@@@@@@");
    console.log(JSON.stringify(req.headers));*/

    dbQuery.GetRAList(dbTable.RADetails, UserId, Auditer).then(response => {
        res.json(Common.jsonCovert("success", response, 1));

    });
});

app.post("/gembawalker-dev/RACADetails", (req, res, next) => {
    var RAId = req.body.RAId;
    var NCId = req.body.NCId;
    var CAId = req.body.CAId;
    if (!RAId || !NCId || !CAId) {
        res.json(Common.jsonCovert("error", "Data missing", 0));
    }

    dbQuery.RACADetails(RAId, NCId, CAId).then(response => {
        res.json(Common.jsonCovert("success", response, 1));

    });
});

app.post("/gembawalker-dev/RACACreate", (req, res, next) => {
    var NCId = req.body.NCId;
    var ResponsibleId = req.body.ResponsibleId;
    var RAId = req.body.RAId;
    var CADescription = req.body.CADescription;
    var ImpDate = req.body.ImpDate;
    var CreatedBy = req.body.CreatedBy;
    var CAStatus = 0;
	var LocationId = req.body.LocationId;
	var CADefineProxy = req.body.CADefineProxy;
    //var CreatedOn = dateFormat(new Date(), "yyyy-mm-dd hh:MM:ss");
	var CreatedOn = Common.ConvertTime(LocationId);
    var AccResponsibleId = ResponsibleId;
    
    if (typeof LocationId === 'undefined') { LocationId = ''; }
	if (typeof CADefineProxy === 'undefined' || CADefineProxy == '') { CADefineProxy = ''; }

    if (!NCId || !ResponsibleId || !RAId || !CADescription || !ImpDate) {
        res.json(Common.jsonCovert("error", "Data missing", 0));
    }
    dbQuery.GetUserDetailsById(dbTable.Users, ResponsibleId, LocationId).then(responseUS => {
        if (responseUS.length) {
            var SubUserId = responseUS[0]['AuditSubstitute'];
            if (SubUserId != null && SubUserId != 0) { ResponsibleId = SubUserId; }

            var columnKey = "NCId, ResponsibleId, RAId, CADescription, ImpDate, CAStatus, CreatedOn, CreatedBy, AccResponsibleId, CADefineProxy";

            var insertValues = { NCId: NCId, ResponsibleId: ResponsibleId, RAId: RAId, CADescription: CADescription, ImpDate: ImpDate, CAStatus: CAStatus, CreatedOn: CreatedOn, CreatedBy: CreatedBy, AccResponsibleId: AccResponsibleId, CADefineProxy: CADefineProxy };
            dbQuery.RACACreate(dbTable.RACA, columnKey, insertValues).then(response => {
                if (response) {
                    dbQuery.SingleNCStatusUpdate(dbTable.RANCList, NCId, '2', LocationId).then(responseCAA => {
                        dbQuery.NCCACountCheck(dbTable.RACA, dbTable.RANCList, RAId, LocationId).then(responseCA => {
                            if (responseCA) {
                                dbQuery.RAStatusUpdate(dbTable.RADetails, 3, RAId, LocationId).then(responseRA => {
                                    if (responseRA) {
                                        res.json(Common.jsonCovert("success", "CA Created and RA Status updated successfully.", 1));
                                    } else {
                                        res.json(Common.jsonCovert("success", "CA Created but RA Status not updated.", 0));
                                    }
                                });
                            } else {
                                res.json(Common.jsonCovert("success", "Successfully Inserted", 0));
                            }
                        });
                    });
                } else {
                    res.json(Common.jsonCovert("error", "Oops! Please try again later.", 0));
                }

            });
        } else {
            res.json(Common.jsonCovert("error", "Oops! Responsible ID not available.", 0));
        }
    });
});

app.post("/gembawalker-dev/RACAUpdate", (req, res, next) => {
    var CAId = req.body.CAId;
    var NCId = req.body.NCId;
    var RAId = req.body.RAId;
    var ResponsibleId = req.body.ResponsibleId;
    var CADescription = req.body.CADescription;
    var ImpDate = req.body.ImpDate;
    var UpdatedBy = req.body.UpdatedBy;
    var CAStatus = 0;
	var LocationId = req.body.LocationId;
	var CADefineProxy = req.body.CADefineProxy;
    //var UpdatedOn = dateFormat(new Date(), "yyyy-mm-dd hh:MM:ss");
	var UpdatedOn = Common.ConvertTime(LocationId);
    var AccResponsibleId = ResponsibleId;
    
    if (typeof LocationId === 'undefined') { LocationId = ''; }
	if (typeof CADefineProxy === 'undefined' || CADefineProxy == '') { CADefineProxy = ''; }

    if (!CAId || !NCId || !ResponsibleId || !RAId || !CADescription || !ImpDate) {
        res.json(Common.jsonCovert("error", "Data missing", 0));
    }

    dbQuery.GetUserDetailsById(dbTable.Users, ResponsibleId, LocationId).then(responseUS => {
        if (responseUS.length) {
            var SubUserId = responseUS[0]['AuditSubstitute'];
            if (SubUserId != null && SubUserId != 0) { ResponsibleId = SubUserId; }

            var updateValues = { CAId: CAId, NCId: NCId, ResponsibleId: ResponsibleId, RAId: RAId, CADescription: CADescription, ImpDate: ImpDate, CAStatus: CAStatus, UpdatedOn: UpdatedOn, UpdatedBy: UpdatedBy, AccResponsibleId: AccResponsibleId, CADefineProxy: CADefineProxy };
            console.log(updateValues);
            dbQuery.RACAUpdate(dbTable.RACA, updateValues).then(response => {
                console.log("@@@@@@@@@@@@@@@@" + response);
                if (response) {
                    dbQuery.SingleNCStatusUpdate(dbTable.RANCList, NCId, '2', LocationId).then(responseCAA => {
                        dbQuery.NCCACountCheck(dbTable.RACA, dbTable.RANCList, RAId, LocationId).then(responseCA => {
                            if (responseCA) {
                                dbQuery.RAStatusUpdate(dbTable.RADetails, 3, RAId, LocationId).then(responseRA => {
                                    if (responseRA) {
                                        res.json(Common.jsonCovert("success", "CA Created and RA Status updated successfully.", 1));
                                    } else {
                                        res.json(Common.jsonCovert("success", "CA Created but RA Status not updated.", 0));
                                    }
                                });
                            } else {
                                res.json(Common.jsonCovert("success", "Successfully Inserted", 0));
                            }
                        });
                    });
                } else {
                    res.json(Common.jsonCovert("error", "Oops! Please try again later.", 0));
                }

            });

        } else {
            res.json(Common.jsonCovert("error", "Oops! Responsible ID not available.", 0));
        }
    });

});

app.post("/gembawalker-dev/GetUsersList", (req, res, next) => {

    dbQuery.GetUsersList(dbTable.Users).then(response => {
        res.json(Common.jsonCovert("success", response, 1));

    });
});

app.post("/gembawalker-dev/GetResponsiblePerson", function(req, res, next) {
    var searchName = req.body.searchKey;
    var LocationCode = req.body.LocationCode;
    if (typeof LocationCode === 'undefined') { LocationCode = ''; }
    dbQuery.GetResponsiblePerson(searchName, LocationCode).then(response => {
        res.json(Common.jsonCovert("success", response, 1));
    });

});

app.post("/gembawalker-dev/RACAImplemented", (req, res, next) => {
    var RAId = req.body.RAId;
    var CAId = req.body.CAId;
    var NCId = req.body.NCId;
    var CAStatus = 1;
	var LocationId = req.body.LocationId;
    var VrfcDescription = req.body.VrfcDescription;
    var VerfcProxy = req.body.VerfcProxy;
    //var VrfcDate = dateFormat(new Date(), "yyyy-mm-dd");
	var VrfcDate = Common.ConvertTime(LocationId);
    var status = 4;
    
    if (typeof LocationId === 'undefined') { LocationId = ''; }
    if (typeof VerfcProxy === 'undefined' || VerfcProxy == '') { VerfcProxy = ''; }

    dbQuery.RACAImplemented(dbTable.RACA, RAId, CAId, NCId, VrfcDescription, VrfcDate, VerfcProxy).then(response => {
        if (response) {
            dbQuery.SingleNCStatusUpdate(dbTable.RANCList, NCId, '4', LocationId).then(responseCAA => {
                dbQuery.NCConfirmCheck(dbTable.RACA, RAId, CAId, NCId).then(responseCA => {
                    if (responseCA) {
                        dbQuery.RAStatusUpdate(dbTable.RADetails, 6, RAId, LocationId).then(responseRA => {
                            if (responseRA) {
                                res.json(Common.jsonCovert("success", "NC Confirmed and RA Status updated.", 1));
                            } else {
                                res.json(Common.jsonCovert("success", "NC Confirmed and RA Status no updated.", 0));
                            }
                        });
                    } else {
                        res.json(Common.jsonCovert("success", "NC Confirmed.", 0));
                    }
                });
            });
        } else {
            res.json(Common.jsonCovert("error", "Oops! Please try again later.", 0));
        }
    });
});

app.post("/gembawalker-dev/NCImplementeContent", (req, res, next) => {
    var CAId = req.body.CAId;
    var NCId = req.body.NCId;
    var RAId = req.body.RAId;
    var ImpDescription = req.body.ImpDescription;
    var UpdatedBy = req.body.UpdatedBy;
    var ImpBy = req.body.UpdatedBy;
    var CAStatus = 3;
	var LocationId = req.body.LocationId;
	var ImpProxy = req.body.ImpProxy;
    //var ImpOn = dateFormat(new Date(), "yyyy-mm-dd hh:MM:ss");
	var ImpOn = Common.ConvertTime(LocationId);
    //var UpdatedOn = dateFormat(new Date(), "yyyy-mm-dd hh:MM:ss");
	var UpdatedOn = Common.ConvertTime(LocationId);
    
    if (typeof LocationId === 'undefined') { LocationId = ''; }
    if (typeof ImpProxy === 'undefined' || ImpProxy == '') { ImpProxy = ''; }

    if (!CAId || !NCId || !RAId || !ImpDescription || !UpdatedBy) {
        res.json(Common.jsonCovert("error", "Data missing", 0));
    }

    var updateValues = { CAId: CAId, NCId: NCId, RAId: RAId, ImpDescription: ImpDescription, ImpOn: ImpOn, ImpBy: ImpBy, CAStatus: CAStatus, UpdatedOn: UpdatedOn, UpdatedBy: UpdatedBy, ImpProxy: ImpProxy };
    console.log(updateValues);
    dbQuery.NCImplementeContent(dbTable.RACA, updateValues).then(response => {
        console.log("@@@@@@@@@@@@@@@@" + response);
        if (response) {
            dbQuery.SingleNCStatusUpdate(dbTable.RANCList, NCId, '5', LocationId).then(responseCAA => {
                if (responseCAA) {
                    dbQuery.RAStatusUpdate(dbTable.RADetails, 4, RAId, LocationId).then(responseRA => {
                        if (responseRA) {
                            res.json(Common.jsonCovert("success", "NC Implementation updated and RA Status updated successfully.", 1));
                        } else {
                            res.json(Common.jsonCovert("success", "NC Implementation updated but RA Status not updated.", 0));
                        }

                    });
                } else {
                    res.json(Common.jsonCovert("success", "NC Implementation updated but NC and RA Status not updated.", 0));
                }
            });
        } else {
            res.json(Common.jsonCovert("error", "Oops! Please try again later.", 0));
        }

    });
});

app.post("/gembawalker-dev/NCImplementeImage", (req, res, next) => {
    var RAId = req.body.RAId;
    var NCId = req.body.NCId;
    var CAId = req.body.CAId;
    var ImpImage = req.body.ImpImage;
    var UpdatedOn = dateFormat(new Date(), "yyyy-mm-dd hh:MM:ss");

    if (!NCId || !RAId || !CAId || !ImpImage) {
        res.json(Common.jsonCovert("error", "Data missing", 0));
    }

    var fileName = "";
    fileName = Date.now() + ".png";
    const Ipath = "assets/upload_images/" + fileName;
    var base64Data = ImpImage.replace(/^data:image\/png;base64,/, "");

    console.log("BASE64DATA");
    console.log(base64Data);

    require("fs").writeFile(Ipath, base64Data, 'base64', function(err) {
        console.log(err);
    });
    console.log("File Name: " + fileName);

    var updateValues = { NCId: NCId, RAId: RAId, CAId: CAId, ImpImage: fileName, UpdatedOn: UpdatedOn };
    dbQuery.NCImplementeImage(dbTable.RACA, updateValues).then(response => {
        if (ImpImage) {
            Common.ThumbnailCreate(fileName);
        }
        res.json(Common.jsonCovert("success", "Successfully Updated", response));

    });
});

app.post("/gembawalker-dev/LineCheck", (req, res, next) => {
    var Plant = req.body.Plant;
    var ValueStream = req.body.ValueStream;
    var LineName = req.body.LineName;
    var LocationId = req.body.LocationId;
    console.log("LocationId", LocationId)
    if (typeof LocationId === 'undefined') { LocationId = ''; }

    if (!Plant || !ValueStream || !LineName) {
        res.json(Common.jsonCovert("error", "Data missing", 0));
    }

    dbQuery.LineCheck(dbTable.LineResponsibility, Plant, ValueStream, LineName, LocationId).then(response => {
        if (!response) {
            res.json(Common.jsonCovert("error", "Oops! Please try again later.", 0));
        } else {
            res.json(Common.jsonCovert("success", response, 1));
        }
    });
});

/*app.get("/randomaudit/SendNCCreateMail", (req, res) => {
	var NCId = req.query.NCId;
	if(!NCId) {
		res.json(Common.jsonCovert("error", "Data missing", 0));
	}
	
	Common.CreateNCMail(NCId);
		
});*/

app.post("/gembawalker-dev/SendNCCreateMail", (req, res) => {
    var RAId = req.body.RAId;
    var LocationId = req.body.LocationId;
    if (typeof LocationId === 'undefined') { LocationId = ''; }
    if (!RAId) {
        res.json(Common.jsonCovert("error", "Data missing", 0));
    }
	
	dbQuery.GetSettingsDetails(dbTable.Settings, LocationId, 'CreateNC').then(responseSett => {
		let SettingRes = responseSett[0]['CreateNC'];
		if(SettingRes) {
			dbQuery.GetNCList(dbTable.RANCList, RAId, LocationId).then(response => {
				console.log("!!!!!!!!!!!!!!!!!!!!!!!!!!");
				console.log(response);
				if(response.length) {		
					if(response.length) {
						for(var i=0; i < response.length; i++) {
							var NCId = response[i]['NCId'];
							Common.CreateNCMail(NCId,LocationId);
						}
					}
				}
				res.json(Common.jsonCovert("success", "Mail Successfully sent", response));
			});
		} else {
			res.json(Common.jsonCovert("success", "Dont have mail send access.", 1));
		}
	});

    /*dbQuery.GetNCList(dbTable.RANCList, RAId).then(responseNC => {
    	console.log(responseNC);
    	res.json(Common.jsonCovert("success", "Mail Successfully sent", responseNC));
    });*/

});

app.post("/gembawalker-dev/NCCreateNotificationContent", (req, res) => {
    var NCId = req.body.NCId;
    var LocationId = req.body.LocationId;
    if (typeof LocationId === 'undefined') { LocationId = ''; }
    if (!NCId) {
        res.json(Common.jsonCovert("error", "Data missing", 0));
    }
    var NotificationDetails = '';
    dbQuery.GetNCDetailsMail(NCId, LocationId).then(response => {
        var Engineers = response[0]['Engineers'];
        if (Engineers) {
            dbQuery.NCAuditeesDeviceToken(Engineers).then(resDetToken => {
                var DeviceToken = [];
                console.log(resDetToken);
                if (resDetToken.length) {
                    for (var i = 0; i <= resDetToken.length - 1; i++) {
                        console.log("########" + resDetToken[i]['UserToken']);
                        if (resDetToken[i]['UserToken'] != '') {
                            DeviceToken.push(resDetToken[i]['UserToken']);
                        }
                    }
                }

                if (DeviceToken.length) {
                    var Title = "Non-Conforimity for " + response[0]['LineName'] + "-NC" + NCId + " NC Created";
                    var BodyContent = "NC Created";
                    var ActionLink = "https://gembawalker.wabco-auto.com/audit-lists?NCId=" + NCId;
                    NotificationDetails = { "Title": Title, "BodyContent": BodyContent, "ActionLink": ActionLink, "Tokens": DeviceToken };
                }
                res.json(Common.jsonCovert("success", "Notification Content", NotificationDetails));

            });
        } else {
            res.json(Common.jsonCovert("success", "Notification Content", NotificationDetails));
        }
    });
});

app.post("/gembawalker-dev/SendRACACreateMail", (req, res) => {
    var NCId = req.body.NCId;
    var LocationId = req.body.LocationId;
    if (typeof LocationId === 'undefined') { LocationId = ''; }
    if (!NCId) {
        res.json(Common.jsonCovert("error", "Data missing", 0));
    }
	
	dbQuery.GetSettingsDetails(dbTable.Settings, LocationId, 'CreateCA').then(responseSett => {
		let SettingRes = responseSett[0]['CreateCA'];
		if(SettingRes) {
			Common.CreateRACAMail(NCId, LocationId);
			res.json(Common.jsonCovert("success", "Mail Successfully sent", 1));
		} else {
			res.json(Common.jsonCovert("success", "Dont have mail send access.", 1));
		}
	});
});

app.post("/gembawalker-dev/RACANotificationContent", (req, res) => {
    var NCId = req.body.NCId;
    var LocationId = req.body.LocationId;
    if (typeof LocationId === 'undefined') { LocationId = ''; }
    if (!NCId) {
        res.json(Common.jsonCovert("error", "Data missing", 0));
    }

    dbQuery.NCCADetailMail(NCId, LocationId).then(response => {
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

        var ResponsibleId = response[0]['ResponsibleId'];

        var Tokens = [];
        var NotificationDetails = '';
        dbQuery.NCResponsibleDevicToken(ResponsibleId).then(resDet => {
            console.log("@@@@@@@@@@@@@@@@");
            console.log(resDet);
            if (resDet.length) {
                for (var j = 0; j < resDet.length; j++) {
                    var UserToken = resDet[j]['UserToken'];
                    if (UserToken != '') {
                        Tokens.push(UserToken);
                    }
                }
                var Title = "Non-Conforimity for " + response[0]['LineName'] + "-NC" + NCId + " Action Planned";
                var BodyContent = "Action Planned";
                var ActionLink = "https://gembawalker.wabco-auto.com/audit-lists?NCId=" + NCId;
                NotificationDetails = { "Title": Title, "BodyContent": BodyContent, "ActionLink": ActionLink, "Tokens": Tokens };
            }

            res.json(Common.jsonCovert("success", "Notification Content", NotificationDetails));
        });
    });
});

app.post("/gembawalker-dev/SendNCImplementMail", (req, res) => {
    var NCId = req.body.NCId;
    var LocationId = req.body.LocationId;
    if (typeof LocationId === 'undefined') { LocationId = ''; }
    if (!NCId) {
        res.json(Common.jsonCovert("error", "Data missing", 0));
    }
	
	dbQuery.GetSettingsDetails(dbTable.Settings, LocationId, 'NCImplemented').then(responseSett => {
		let SettingRes = responseSett[0]['NCImplemented'];
		if(SettingRes) {
			Common.CreateNCImplementMail(NCId, LocationId);
			res.json(Common.jsonCovert("success", "Mail Successfully sent", 1));
		} else {
			res.json(Common.jsonCovert("success", "Dont have mail send access.", 1));
		}
	});
});

app.post("/gembawalker-dev/RAImpNotificationContent", (req, res) => {
    var NCId = req.body.NCId;
    var LocationId = req.body.LocationId;
    if (typeof LocationId === 'undefined') { LocationId = ''; }
    if (!NCId) {
        res.json(Common.jsonCovert("error", "Data missing", 0));
    }

    dbQuery.NCCADetailMail(NCId, LocationId).then(response => {
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

        var ResponsibleId = response[0]['ResponsibleId'];
        var AuditerId = response[0]['AuditerId'];

        var Tokens = [];
        var NotificationDetails = '';
        dbQuery.NCResponsibleDevicToken(AuditerId).then(resDet => {
            console.log("@@@@@@@@@@@@@@@@");
            console.log(resDet);
            if (resDet.length) {
                for (var j = 0; j < resDet.length; j++) {
                    var UserToken = resDet[j]['UserToken'];
                    if (UserToken != '') {
                        Tokens.push(UserToken);
                    }
                }
                var Title = "Non-Conforimity for " + response[0]['LineName'] + "-NC" + NCId + " Action Implemented";
                var BodyContent = "Action Implemented";
                var ActionLink = "https://gembawalker.wabco-auto.com/audit-lists?NCId=" + NCId;
                NotificationDetails = { "Title": Title, "BodyContent": BodyContent, "ActionLink": ActionLink, "Tokens": Tokens };
            }

            res.json(Common.jsonCovert("success", "Notification Content", NotificationDetails));
        });
    });
});

app.post("/gembawalker-dev/NCVerification", (req, res) => {
    var NCId = req.body.NCId;
	var LocationId = req.body.LocationId;
    //var TodayDate = dateFormat(new Date(), "yyyy-mm-dd");
	var TodayDate = Common.ConvertTime(LocationId);
    var TodayDateSplit = TodayDate.split('T');
    
    if (typeof LocationId === 'undefined') { LocationId = ''; }
    if (!NCId) {
        res.json(Common.jsonCovert("error", "Data missing", 0));
    }
	
	dbQuery.GetSettingsDetails(dbTable.Settings, LocationId, 'NCVerification').then(responseSett => {
		let SettingRes = responseSett[0]['NCVerification'];
		if(SettingRes) {
			Common.CreateNCVerifyMail(NCId, TodayDateSplit[0], LocationId);
			res.json(Common.jsonCovert("success", "Mail Successfully sent", 1));
		} else {
			res.json(Common.jsonCovert("success", "Dont have mail send access.", 1));
		}
	});
});

app.post("/gembawalker-dev/NCVerifyNotificationContent", (req, res) => {
    var NCId = req.body.NCId;
	var LocationId = req.body.LocationId;
    //var TodayDate = dateFormat(new Date(), "yyyy-mm-dd");
	var TodayDate = Common.ConvertTime(LocationId);
    var TodayDateSplit = TodayDate.split('T');
    
    if (typeof LocationId === 'undefined') { LocationId = ''; }
    if (!NCId) {
        res.json(Common.jsonCovert("error", "Data missing", 0));
    }

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
        var Engineers = response[0]['Engineers'];
        var Leaders = response[0]['Leaders'];
        var NotificationDetails = '';

        if (Engineers) {
            dbQuery.NCAuditeesDeviceToken(Engineers).then(resDetToken => {
                var DeviceToken = [];
                console.log(resDetToken);
                if (resDetToken.length) {
                    for (var i = 0; i <= resDetToken.length - 1; i++) {
                        console.log("########" + resDetToken[i]['UserToken']);
                        if (resDetToken[i]['UserToken'] != '') {
                            DeviceToken.push(resDetToken[i]['UserToken']);
                        }
                    }
                }

                dbQuery.NCResponsibleDevicToken(ResponsibleId).then(resDet => {
                    if (resDet.length) {
                        for (var j = 0; j <= resDet.length - 1; j++) {
                            if (resDet[j]['UserToken'] != '') {
                                DeviceToken.push(resDet[j]['UserToken']);
                            }
                        }
                    }

                    if (DeviceToken.length) {
                        var Title = "Non-Conforimity for " + response[0]['LineName'] + "-NC" + NCId + " NC Verified";
                        var BodyContent = "NC Verified";
                        var ActionLink = "https://gembawalker.wabco-auto.com/audit-lists?NCId=" + NCId;
                        NotificationDetails = { "Title": Title, "BodyContent": BodyContent, "ActionLink": ActionLink, "Tokens": DeviceToken };
                    }
                    res.json(Common.jsonCovert("success", "Notification Content", NotificationDetails));

                });
            });
        } else {
            res.json(Common.jsonCovert("success", "Notification Content", NotificationDetails));
        }
    });

});

app.post("/gembawalker-dev/NCReassignMail", (req, res) => {
    var NCId = req.body.NCId;
	var LocationId = req.body.LocationId;
    //var TodayDate = dateFormat(new Date(), "yyyy-mm-dd");
	var TodayDate = Common.ConvertTime(LocationId);
    var TodayDateSplit = TodayDate.split('T');
    
    if (typeof LocationId === 'undefined') { LocationId = ''; }
    if (!NCId) {
        res.json(Common.jsonCovert("error", "Data missing", 0));
    }
	
	dbQuery.GetSettingsDetails(dbTable.Settings, LocationId, 'NCReassign').then(responseSett => {
		let SettingRes = responseSett[0]['NCReassign'];
		if(SettingRes) {
			Common.CreateNCReassignMail(NCId, TodayDateSplit[0], LocationId);
			res.json(Common.jsonCovert("success", "Mail Successfully sent", 1));
		} else {
			res.json(Common.jsonCovert("success", "Dont have mail send access.", 1));
		}
	});
});

app.post("/gembawalker-dev/NCReassignNotificationContent", (req, res) => {
    var NCId = req.body.NCId;
    var LocationId = req.body.LocationId;
    if (typeof LocationId === 'undefined') { LocationId = ''; }
    var TodayDate = dateFormat(new Date(), "yyyy-mm-dd");
	TodayDate = Common.ConvertTime(LocationId, TodayDate);
    var TodayDateSplit = TodayDate.split('T');
    if (!NCId) {
        res.json(Common.jsonCovert("error", "Data missing", 0));
    }

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
        var ImpDate = response[0]['ImpDate'];
        var ResponsibleId = response[0]['ResponsibleId'];
        var NCReassCommands = response[0]['NCReassCommands'];

        var Engineers = response[0]['Engineers'];
        var Leaders = response[0]['Leaders'];
        var EngineersLeaders = Engineers + Leaders;
        var NotificationDetails = '';

        dbQuery.NCAuditeesDeviceToken(EngineersLeaders).then(resDetToken => {
            var DeviceToken = [];
            console.log(resDetToken);
            if (resDetToken.length) {
                for (var i = 0; i <= resDetToken.length - 1; i++) {
                    console.log("########" + resDetToken[i]['UserToken']);
                    if (resDetToken[i]['UserToken'] != '') {
                        DeviceToken.push(resDetToken[i]['UserToken']);
                    }
                }
            }

            dbQuery.NCResponsibleDevicToken(ResponsibleId).then(resDet => {
                console.log("$$$$$$$$$$$$$$");
                console.log(resDet);
                if (resDet.length) {
                    for (var j = 0; j <= resDet.length - 1; j++) {
                        if (resDet[j]['UserToken'] != '') {
                            DeviceToken.push(resDet[j]['UserToken']);
                        }
                    }
                }
                console.log(DeviceToken);
                console.log(DeviceToken.length);
                if (DeviceToken.length) {
                    var Title = "Non-Conforimity for " + response[0]['LineName'] + "-NC" + NCId + " NC Reassign";
                    var BodyContent = "NC Reassigned";
                    var ActionLink = "https://gembawalker.wabco-auto.com/audit-lists?NCId=" + NCId;
                    NotificationDetails = { "Title": Title, "BodyContent": BodyContent, "ActionLink": ActionLink, "Tokens": DeviceToken };
                }
                console.log(NotificationDetails);
                res.json(Common.jsonCovert("success", "Mail Successfully sent", NotificationDetails));
            });
        });
    });
});


app.post("/gembawalker-dev/ReassignImageUpload", (req, res, next) => {
    var RAId = req.body.RAId;
    var NCId = req.body.NCId;
    var CAId = req.body.CAId;
    var ReassignImg = req.body.ReassignImg;
    var UpdatedOn = dateFormat(new Date(), "yyyy-mm-dd hh:MM:ss");

    if (!NCId || !RAId || !CAId || !ReassignImg) {
        res.json(Common.jsonCovert("error", "Data missing", 0));
    }

    var fileName = "";
    fileName = Date.now() + ".png";
    const Ipath = "assets/upload_images/" + fileName;
    var base64Data = ReassignImg.replace(/^data:image\/png;base64,/, "");

    console.log("BASE64DATA");
    console.log(base64Data);

    require("fs").writeFile(Ipath, base64Data, 'base64', function(err) {
        console.log(err);
    });
    console.log("File Name: " + fileName);

    var updateValues = { NCId: NCId, RAId: RAId, CAId: CAId, NCReassImage: fileName, UpdatedOn: UpdatedOn };
    dbQuery.ReassignNCImage(dbTable.RACA, updateValues).then(response => {
        if (ReassignImg) {
            Common.ThumbnailCreate(fileName);
        }
        res.json(Common.jsonCovert("success", "Successfully Updated", response));

    });
});

app.post("/gembawalker-dev/GetNCListHomeTest", (req, res, next) => {
    var Auditer = req.body.Auditer;
    var UserId = req.body.UserId;
    var NoPages = req.body.NoPages;
    var PerPageRecords = 10;
    if (!Auditer || !UserId) {
        res.json(Common.jsonCovert("error", "Data missing", 0));
    }

    if (NoPages == '') {
        NoPages = 1;
    }

    if (Auditer == 1) {
        var PageCalc = NoPages - 1;
        PageCalc = PageCalc * PerPageRecords;
        var RecordStarting = PageCalc + 1;
    } else {
        var PageCalc = NoPages - 1;
        PageCalc = PageCalc * PerPageRecords;
        var RecordStarting = PageCalc + 1;
    }
    dbQuery.GetActiveNCHomeTest(Auditer, UserId, RecordStarting, PerPageRecords).then(response => {
        if (Auditer == 1) {
            dbQuery.GetInprogressAudit(UserId).then(responseAuditer => {
                res.json(Common.jsonCovert("success", { "NCLists": response, "InprogressAudit": responseAuditer }, 1));
            });
        } else {
            res.json(Common.jsonCovert("success", { "NCLists": response, "InprogressAudit": '' }, 1));
        }
    });
});

app.post("/gembawalker-dev/GetNCListHome", (req, res, next) => {
    var Auditer = req.body.Auditer;
    var UserId = req.body.UserId;
    var NoPages = req.body.NoPages;
    var PerPageRecords = 10;

    var NCCreatedStart = req.body.NCCreatedStart;
    var NCCreatedEnd = req.body.NCCreatedEnd;
    var NCStatus = req.body.NCStatus;
    var AuditerId = req.body.AuditerId;
    var Responsible = req.body.Responsible;
    var Plant = req.body.Plant;
    var ValueStream = req.body.ValueStream;
    var LineName = req.body.LineName;
    var Checklist = req.body.Checklist;
    var LocationId = req.body.LocationId;
    if (typeof LocationId === 'undefined') { LocationId = ''; }

    if (typeof NCCreatedStart === 'undefined') { NCCreatedStart = ''; }
    if (typeof NCCreatedEnd === 'undefined') { NCCreatedEnd = ''; }
    if (typeof NCStatus === 'undefined') { NCStatus = ''; }
    if (typeof AuditerId === 'undefined') { AuditerId = ''; }
    if (typeof Responsible === 'undefined') { Responsible = ''; }
    if (typeof Plant === 'undefined') { Plant = ''; }
    if (typeof ValueStream === 'undefined') { ValueStream = ''; }
    if (typeof LineName === 'undefined') { LineName = ''; }
    if (typeof Checklist === 'undefined') { Checklist = ''; }

    if (!UserId) {
        res.json(Common.jsonCovert("error", "Data missing", 0));
    }

    if (NoPages == '') {
        NoPages = 1;
    }

    var RecordStarting = 0;
    var PageCalc = 0;
    if (Auditer == 1) {
        PageCalc = NoPages - 1;
        PageCalc = PageCalc * PerPageRecords;
        RecordStarting = PageCalc + 1;
    } else {
        PageCalc = NoPages - 1;
        PageCalc = PageCalc * PerPageRecords;
        RecordStarting = PageCalc + 1;
    }
    if (NoPages == 1) {
        RecordStarting = 0;
    }
    // , Plant, ValueStream, LineName, Checklist
	
	dbQuery.GetUserDetailsNew(UserId, LocationId).then(responseU => {
		if (responseU.length == 0) {
			res.json(Common.jsonCovert("error", "Data not fount", 0));
		}
		dbQuery.GetUserLineDetails(UserId, LocationId, Auditer).then(responseLine => {
			dbQuery.GetActiveNCHome(Auditer, UserId, RecordStarting, PerPageRecords, NCCreatedStart, NCCreatedEnd, NCStatus, AuditerId, Responsible, Plant, ValueStream, LineName, Checklist, LocationId).then(response => {
				if (Auditer == 1) {
					dbQuery.GetInprogressAudit(UserId, LocationId).then(responseAuditer => {
						res.json(Common.jsonCovert("success", { "NCLists": response, "InprogressAudit": responseAuditer, 'UserDetails': responseU[0], 'LineDetails': responseLine }, 1));
					});
				} else {
					res.json(Common.jsonCovert("success", { "NCLists": response, "InprogressAudit": '', 'UserDetails': responseU[0], 'LineDetails': responseLine }, 1));
				}
			});
		});
	});
	
});

	app.post("/gembawalker-dev/GetScheduledAudits", (req, res, next) => {
		var UserId = req.body.UserId;
		var LocationId = req.body.LocationId;
		var Freequency = req.body.Freequency;
		var ChecklistId = req.body.ChecklistId;
		var Plant = req.body.Plant;
		var ValueStream = req.body.ValueStream;
		var ScheduledOnStart = req.body.ScheduledOnStart;
		var ScheduledOnEnd = req.body.ScheduledOnEnd;
		var LineName = req.body.LineName;
		var NoPages = req.body.NoPages;
		var PerPageRecords = 10;
		
		if (typeof NoPages === 'undefined') { NoPages = ''; }
		if (typeof Freequency === 'undefined') { Freequency = ''; }
		if (typeof ChecklistId === 'undefined') { ChecklistId = ''; }
		if (typeof Plant === 'undefined') { Plant = ''; }
		if (typeof ValueStream === 'undefined') { ValueStream = ''; }
		if (typeof LineName === 'undefined') { LineName = ''; }
		if (typeof ScheduledOnStart === 'undefined') { ScheduledOnStart = ''; }
		if (typeof ScheduledOnEnd === 'undefined') { ScheduledOnEnd = ''; }
		
		
		if (NoPages == '') {
			NoPages = 1;
		}
		
		var RecordStarting = 0;
		var PageCalc = 0;
		PageCalc = NoPages - 1;
		PageCalc = PageCalc * PerPageRecords;
		//RecordStarting = PageCalc + 1;
		RecordStarting = PageCalc;
		
		if (NoPages == 1) {
			RecordStarting = 0;
		}
		
		dbQuery.GetScheduledAudits(UserId, LocationId, RecordStarting, PerPageRecords, Freequency, ChecklistId, Plant, ValueStream, LineName, ScheduledOnStart, ScheduledOnEnd).then(ScheduledAudit => {
			res.json(Common.jsonCovert("success", ScheduledAudit, 1));
		});
	});
				
				
app.post("/gembawalker-dev/GetAuditorNCList", (req, res, next) => {
    var LineId = req.body.LineId;
    var LocationId = req.body.LocationId;
    if (typeof LocationId === 'undefined') { LocationId = ''; }
    /* var NoPages = req.query.NoPages;
    var PerPageRecords = 10; */
    if (!LineId) {
        res.json(Common.jsonCovert("error", "Data missing", 0));
    }
    /* var PageCalc = NoPages-1;
    PageCalc = PageCalc*PerPageRecords;
    var RecordStarting = PageCalc+1; */

    dbQuery.GetActiveNCForAuditor(LineId, LocationId).then(responseAuditer => {
        res.json(Common.jsonCovert("success", responseAuditer, 1));
    });
});


app.post("/gembawalker-dev/UserDeviceToken", (req, res) => {
    var DeviceToken = req.body.DeviceToken;
    var Device = req.body.Device;
    var UserId = req.body.UserId;
    var TodayDate = dateFormat(new Date(), "yyyy-mm-dd hh:MM:ss");
	//var TodayDate = Common.ConvertTime(LocationId);
    if (!DeviceToken || !Device || !UserId) {
        res.json(Common.jsonCovert("error", "Data missing", 0));
    }
    console.log("UserDeviceToken Api ------------------");
    dbQuery.CheckUserDevice(dbTable.UsersToken, DeviceToken, Device, UserId).then(response => {
        console.log(response.length);
        if (response.length) {
            res.json(Common.jsonCovert("success", "Already Inserted", 1));
        } else {
            dbQuery.CheckUserDeviceRegistered(dbTable.UsersToken, DeviceToken, Device, UserId).then(responseReg => {
                console.log(responseReg.length);
                if (responseReg.length) {
                    dbQuery.UserDeviceUpdate(dbTable.UsersToken, DeviceToken, Device, UserId, TodayDate).then(responseUp => {
                        if (responseUp) {
                            res.json(Common.jsonCovert("success", "Token successfully updated", 1));
                        } else {
                            res.json(Common.jsonCovert("error", "Token update issue", 0));
                        }
                    });
                } else {
                    dbQuery.UserDeviceInsert(dbTable.UsersToken, DeviceToken, Device, UserId, TodayDate).then(responseIns => {
                        if (responseIns) {
                            res.json(Common.jsonCovert("success", "Token successfully inserted", 1));
                        } else {
                            res.json(Common.jsonCovert("error", "Token insert issue", 0));
                        }
                    });
                }
            });
        }
    });

});

/*app.get("/randomaudit/GetDesktopAuditNCList", (req, res, next) => {
	var NCCreatedStart = req.query.NCCreatedStart;
	var NCCreatedEnd = req.query.NCCreatedEnd;
	var NCStatus = req.query.NCStatus;
	var Auditer = req.query.Auditer;
	var Responsible = req.query.Responsible;
	dbQuery.GetDesktopAuditNCList(NCCreatedStart, NCCreatedEnd, NCStatus, Auditer, Responsible).then(response => {
		if(!response) {
			res.json(Common.jsonCovert("error", "Oops! Please try again later.", 0));
		} else {
			res.json(Common.jsonCovert("success", response, 1));
		}
	
	});
}); */


app.post("/gembawalker-dev/GetHrStatus", (req, res) => {
    var Username = req.body.Username;
    dbQuery.GetHrStatus(Username).then(response => {
        res.json(Common.jsonCovert("success", response, 1));
    });
});

app.post("/gembawalker-dev/GetPlantValuestream", (req, res, next) => {
    var LocationId = req.body.LocationId;
    if (typeof LocationId === 'undefined') { LocationId = ''; }

    var PlantList = [];
    var ValueStreamList = [];
    dbQuery.GetPlant(dbTable.LineResponsibility, LocationId).then(responsePlant => {
        for (var i = 0; i < responsePlant.length; i++) {
            PlantList.push(responsePlant[i]['Plant']);
        }
        console.log(PlantList);
        dbQuery.GetValuestream(dbTable.LineResponsibility, LocationId).then(responseValueStream => {
            if (responseValueStream != '') {
                for (var i = 0; i < responseValueStream.length; i++) {
                    ValueStreamList.push(responseValueStream[i]['ValueStream']);
                }
                console.log(ValueStreamList);
                res.json(Common.jsonCovert("success", { "Plant": PlantList, "ValueStream": ValueStreamList }, 1));
            } else {
                res.json(Common.jsonCovert("error", "Plant and ValueStream not found", 0));
            }
        });
    });
});

app.post("/gembawalker-dev/GetLines", function(req, res, next) {
    var searchName = req.body.searchKey;
    var LocationId = req.body.LocationId;
    if (typeof LocationId === 'undefined') { LocationId = ''; }
    if (!searchName) {
        res.json(Common.jsonCovert("error", "Data missing", 0));
    }
    dbQuery.GetLines(dbTable.LineResponsibility, searchName, LocationId).then(response => {
        res.json(Common.jsonCovert("success", response, 1));
    });

});

app.post("/gembawalker-dev/GetActiveChecklists", (req, res, next) => {
    var searchName = req.body.searchKey;
    var LocationId = req.body.LocationId;
    if (typeof LocationId === 'undefined') { LocationId = ''; }
    if (searchName == '') {
        res.json(Common.jsonCovert("error", "Checklist data missing", 0));
    }
    dbQuery.GetActiveChecklists(dbTable.Checklists, searchName, LocationId).then(response => {
        res.json(Common.jsonCovert("success", response, 1));

    });
});

app.post("/gembawalker-dev/GetDesktopAuditNCList", (req, res, next) => {
    var NCCreatedStart = req.body.NCCreatedStart;
    var NCCreatedEnd = req.body.NCCreatedEnd;
    var NCStatus = req.body.NCStatus;
    var Auditer = req.body.Auditer;
    var Responsible = req.body.Responsible;
    var Plant = req.body.Plant;
    var ValueStream = req.body.ValueStream;
    var LineName = req.body.LineName;
    var Checklist = req.body.Checklist;
    var LoggedUserId = req.body.LoggedUserId;
    var LocationId = req.body.LocationId;

    if (typeof NCCreatedStart === 'undefined') { NCCreatedStart = ''; }
    if (typeof NCCreatedEnd === 'undefined') { NCCreatedEnd = ''; }
    if (typeof NCStatus === 'undefined') { NCStatus = ''; }
    if (typeof Auditer === 'undefined') { Auditer = ''; }
    if (typeof Responsible === 'undefined') { Responsible = ''; }
    if (typeof Plant === 'undefined') { Plant = ''; }
    if (typeof ValueStream === 'undefined') { ValueStream = ''; }
    if (typeof LineName === 'undefined') { LineName = ''; }
    if (typeof Checklist === 'undefined') { Checklist = ''; }
    if (typeof LoggedUserId === 'undefined') { LoggedUserId = ''; }
    if (typeof LocationId === 'undefined') { LocationId = ''; }

    // , Plant, ValueStream, LineName, Checklist
    dbQuery.GetDesktopAuditNCList(NCCreatedStart, NCCreatedEnd, NCStatus, Auditer, Responsible, Plant, ValueStream, LineName, Checklist, LoggedUserId, LocationId).then(response => {
        if (!response) {
            res.json(Common.jsonCovert("error", "Oops! Please try again later.", 0));
        } else {
            res.json(Common.jsonCovert("success", response, 1));
        }

    });
});

app.post("/gembawalker-dev/NCStarUpdate", (req, res, next) => {
    var NCId = req.body.NCId;
    var UserId = req.body.UserId;
    var NCStarStatus = 0;
    var UpdatedOn = dateFormat(new Date(), "yyyy-mm-dd hh:MM:ss");

    var columnKey = "NCId, UserId, Status, UpdatedOn";
    var insertValues = { NCId: NCId, UserId: UserId, Status: 1, UpdatedOn: UpdatedOn };
    dbQuery.GetNCStar(dbTable.NCStar, NCId, UserId).then(response => {
        if (response.length) {
            console.log("#########");
            console.log(response[0]['Status']);
            if (response[0]['Status'] == 1) { NCStarStatus = 0; } else { NCStarStatus = 1; }
            dbQuery.NCStarUpdate(dbTable.NCStar, NCId, UserId, NCStarStatus, UpdatedOn).then(responseU => {
                res.json(Common.jsonCovert("success", "Successfully Updated", NCStarStatus));
            });
        } else {
            dbQuery.NCStarInsert(dbTable.NCStar, columnKey, insertValues).then(responseI => {
                res.json(Common.jsonCovert("success", "Successfully Inserted", 1));
            });
        }
    });
});

app.post("/gembawalker-dev/UserSubstituteUpdate", (req, res, next) => {
    var UserId = req.body.SubstituteId;
	var LineId = req.body.LineId;
	var LocationId = req.body.LocationId;
	var CreatedOn = Common.ConvertTime(LocationId);
	var CreatedBy = req.body.UserId;
	var UpdatedOn = Common.ConvertTime(LocationId);
	var UpdatedBy = req.body.UserId;
	var Auditor = req.body.Auditor;
	var Status = 1;
	var OverallStatus = 0;
	
	if (typeof LocationId === 'undefined') { LocationId = ''; }
    if (typeof UserId === 'undefined') {
        res.json(Common.jsonCovert("error", "User data missing", 0));
    }
	
	if (!LineId || !UserId) {
        res.json(Common.jsonCovert("error", "Data missing", 0));
    }

	var columnKey = "LineId, UserId, LocationId, Status, CreatedOn, CreatedBy, Auditor";

    var insertValues = { LineId: LineId, UserId: UserId, LocationId: LocationId, Status: Status, CreatedOn : CreatedOn, CreatedBy: CreatedBy, Auditor: Auditor};
			
    dbQuery.UserSubstituteUpdate(dbTable.Proxy, columnKey, insertValues).then(responseU => {
		console.log("inserted"+responseU);
        res.json(Common.jsonCovert("success", "Successfully Updated", responseU));
    });
});

app.post("/gembawalker-dev/UpdateUserProxyStatus", (req, res, next) => {
	var ProxyId = req.body.ProxyId;
	var Status = req.body.Status;
	var OverallStatus = req.body.OverallStatus
	var UpdatedOn = Common.ConvertTime(LocationId);
	var UpdatedBy = req.body.UpdatedBy;
	var LocationId = req.body.LocationId;
	
	if(ProxyId == null || !LocationId){
	    res.json(Common.jsonCovert("error", "Data missing", 0));
	}
	console.log("1");
	if (typeof LocationId === 'undefined') { LocationId = ''; }
 
	console.log("2");
    dbQuery.UpdateUserProxyStatus(dbTable.Proxy, Status, OverallStatus, ProxyId, LocationId, UpdatedBy).then(responseU => {
	console.log("responseU"+responseU);
        res.json(Common.jsonCovert("success", "Successfully Updated", 1));
    });
});

app.post("/gembawalker-dev/GetNCAuditerResponsible", (req, res, next) => {
    var NCId = req.body.NCId;
    var LocationId = req.body.LocationId;
    if (typeof LocationId === 'undefined') { LocationId = ''; }
    if (typeof NCId === 'undefined' || NCId == '') {
        res.json(Common.jsonCovert("error", "Data Missing.", 1));
    }

    dbQuery.GetNCAuditerResponsible(dbTable.RANCList, NCId, LocationId).then(response => {
        res.json(Common.jsonCovert("success", response, 1));
    });

});

app.post("/gembawalker-dev/GetLineAuditees", (req, res, next) => {
    var LineId = req.body.LineId;
    var ChecklistId = req.body.ChecklistId;
    var LocationId = req.body.LocationId;
    if (typeof LocationId === 'undefined') { LocationId = ''; }
    if (LineId == '' || ChecklistId == '') {
        res.json(Common.jsonCovert("error", "Data Missing.", 1));
    }

    dbQuery.GetChecklistDetails(dbTable.Checklists, ChecklistId, LocationId).then(responseChk => {
        dbQuery.GetLineAuditees(dbTable.LineResponsibility, LineId, LocationId).then(response => {
            if (response.length) {
                console.log(response);
                var Engineers = response[0]['Engineers'];
                Engineers = Engineers.slice(0, -1);
                Engineers = Engineers.substring(1);
                var Leaders = response[0]['Leaders'];
                Leaders = Leaders.slice(0, -1);
                var Auditees = Engineers + "" + Leaders;
                console.log(Auditees);
                dbQuery.GetLineAuditeeDetails(dbTable.Users, Auditees, LocationId).then(responseAud => {
                    res.json(Common.jsonCovert("success", responseAud, responseChk));
                });
            } else {
                res.json(Common.jsonCovert("error", "Try again later", 0));
            }
        });
    });
});

app.post("/gembawalker-dev/CheckScheduledAuditByUser", (req, res, next) => {
    var UserId = req.body.UserId;
    var LineId = req.body.LineId;
    var ChecklistId = req.body.ChecklistId;
    var LocationId = req.body.LocationId;
    
    if (typeof UserId === 'undefined' || UserId == '' || typeof LineId === 'undefined' || LineId == '' || typeof ChecklistId === 'undefined' || ChecklistId == '' || typeof LocationId === 'undefined' || LocationId == '') {
        res.json(Common.jsonCovert("error", "Data Missing.", 1));
    }

    dbQuery.CheckScheduledAuditByUser(UserId, LineId, ChecklistId, LocationId).then(response => {
		if(response.length) {
			res.json(Common.jsonCovert("error", "Scheduled Audit Already have.", 0));
		} else {
			res.json(Common.jsonCovert("success", "Can Audit", 1));
		}
    });

});


app.post("/gembawalker-dev/GetAuditUsers", (req, res, next) => {
        var searchName = req.body.searchKey;
		var LocationId = req.body.LocationId;
		var Auditor = req.body.Auditor;
		if (typeof LocationId === 'undefined') { LocationId = ''; }
		if (!searchName) {
			res.json(Common.jsonCovert("error", "Data missing", 0));
		}
		dbQuery.GetAuditUsers(searchName, LocationId, Auditor).then(response => {
			res.json(Common.jsonCovert("success", response, 1));
		});
});

	app.get("/gembawalker-dev/UpdateEmpId", (req, res, next) => {
		dbQuery.GetAllDomains(dbTable.Users).then(response => {
			console.log("GetAllDomains"+JSON.stringify(response));
			
				for(var i=0;i<response.length;i++){
					dbQuery.GetNewEmpId(response[i].DomainName).then(responseWD => {
						console.log("GetNewEmpId"+JSON.stringify(responseWD));
						if(responseWD.length>0) {			
							dbQuery.UpdateEmpId(dbTable.Users,responseWD[0].EMPLID,responseWD[0].AM_DOMAIN_ID).then(responseUpdate => {
								console.log("UpdateEmpId "+JSON.stringify(responseUpdate));
								if(!responseUpdate) {			
				
								} 
							});	
						} 
					});	
				}
							
			
		});
	});
	
	app.post("/gembawalker-dev/RoleRequestCreate", (req, res, next) => {
		var UserId = req.body.UserId;
		var RoleId = req.body.RoleId;
		var LineIds = req.body.LineIds;
		var Approver = req.body.Approver;
		var Status = 0;
		var LocationId = req.body.LocationId;
		var CreatedOn = Common.ConvertTime(LocationId);
		
		if(UserId == '' || typeof UserId === 'undefined' || RoleId == '' || typeof RoleId === 'undefined' || Approver == '' || typeof Approver === 'undefined' || LocationId == '' || typeof LocationId === 'undefined'){
			res.json(Common.jsonCovert("error", "Data missing", 0));
		}
		
		if(LineIds == '' || typeof LineIds === 'undefined') {
			LineIds = '';
		}
		
		var columnKey = "UserId, RoleId, LineIds, Approver, Status, CreatedBy, CreatedOn, LocationId";
		var insertValues = { UserId: UserId, RoleId: RoleId, LineIds: LineIds, Approver: Approver, Status : Status, CreatedBy: UserId, CreatedOn: CreatedOn, LocationId: LocationId};
	 
		dbQuery.RoleRequestCreate(dbTable.RoleRequest, columnKey, insertValues).then(responseU => {
			//if(responseU.length) {
				res.json(Common.jsonCovert("success", "Successfully Request Sent", 1));
			//} else {
				//res.json(Common.jsonCovert("error", "Oops! Please try again later.", 0));
			//}
		});
	});
	
	app.post("/gembawalker-dev/RoleRequestUpdate", (req, res, next) => {
		
		var RoleRequestId = req.body.RoleRequestId;
		var Approver = req.body.Approver;
		var UpdateStatus = req.body.UpdateStatus;
		var LocationId = req.body.LocationId;
		if(UpdateStatus == 1) {
			var Status = 1;
		} else {
			var Status = 2;
		}
		
		if(RoleRequestId == '' || typeof RoleRequestId === 'undefined' || Approver == '' || typeof Approver === 'undefined' || UpdateStatus == '' || typeof UpdateStatus === 'undefined' || LocationId == '' || typeof LocationId === 'undefined'){
			res.json(Common.jsonCovert("error", "Data missing", 0));
		}
		
		if(Status == 1) {
			dbQuery.GetRoleRequestDetails(dbTable.RoleRequest, RoleRequestId).then(responseRoleReq => {
				if(responseRoleReq.length) {
					let RoleId = responseRoleReq[0]['RoleId'];
					let UserId = responseRoleReq[0]['UserId'];
					let LineIds = responseRoleReq[0]['LineIds'];
					dbQuery.UserRequestRoleUpdate(dbTable.Users, UserId, RoleId, LocationId).then(respRoleReqUp => {
						if(LineIds != '') {
							//let LineIdsVal = '';
							//LineIds = JSON.parse(LineIds);
							//LineIds.forEach(LineVal => { LineIdsVal += LineVal+','; });
							LineIds = LineIds.substring(0, LineIds.length - 1);
							LineIds = LineIds.substring(1);
							dbQuery.UserRequestLineUpdate(dbTable.LineResponsibility, UserId, LineIds, LocationId).then(respRoleReqUp => {
								dbQuery.RoleRequestUpdate(dbTable.RoleRequest, RoleRequestId, Status, Approver, LocationId).then(responseU => {
									res.json(Common.jsonCovert("success", "Successfully Request Accepted", 1));
								});
							});
						} else {
							dbQuery.RoleRequestUpdate(dbTable.RoleRequest, RoleRequestId, Status, Approver, LocationId).then(responseU => {
								res.json(Common.jsonCovert("success", "Successfully Request Accepted", 1));
							});
						}
					});
				} else {
					res.json(Common.jsonCovert("error", "Oops! Please try again later.", 0));
				}
			});
		} else {
			dbQuery.RoleRequestUpdate(dbTable.RoleRequest, RoleRequestId, Status, Approver, LocationId).then(responseU => {
				res.json(Common.jsonCovert("success", "Successfully Request Cancelled", 1));
			});
		}
		
	});
	
	app.post("/gembawalker-dev/RoleRequestPending", (req, res, next) => {
		var UserId = req.body.UserId;
		var LocationId = req.body.LocationId;
		var RoleRequestVal = req.body.RoleRequestVal;
		
		if(UserId == '' || typeof UserId === 'undefined' || LocationId == '' || typeof LocationId === 'undefined' || RoleRequestVal == '' || typeof RoleRequestVal === 'undefined'){
			res.json(Common.jsonCovert("error", "Data missing", 0));
		}
		
		dbQuery.RoleRequestPending(dbTable.RoleRequest, UserId, LocationId, RoleRequestVal).then(responseP => {
			console.log(responseP);
			res.json(Common.jsonCovert("success", responseP, 1));
		});
	});
	
	app.post("/gembawalker-dev/GetPlantApproverRoles", (req, res, next) => {
		var EmpId = req.body.EmpId;
		var LocationId = req.body.LocationId;
		var PlantList = [];
		
		if(EmpId == '' || typeof EmpId === 'undefined' || LocationId == '' || typeof LocationId === 'undefined'){
			res.json(Common.jsonCovert("error", "Data missing", 0));
		}
		
		dbQuery.GetRoles(dbTable.UserRoles, LocationId).then(responseR => {
			console.log(responseR);
			dbQuery.GetPlant(dbTable.LineResponsibility, LocationId).then(responseP => {
				for (var i = 0; i < responseP.length; i++) {
					PlantList.push(responseP[i]['Plant']);
				}
				dbQuery.GetApprover(EmpId).then(responseA => {
					let DomainName = responseA[0]['AM_DOMAIN_ID'];
					let FirstName = responseA[0]['FIRST_NAME'];
					let LastName = responseA[0]['LAST_NAME'];
					let Email = responseA[0]['EMAIL_ADDR'];
					let EmpId = responseA[0]['EMPLID'];
					dbQuery.GetUserDetails(DomainName, LocationId).then(response => {
						console.log(response.length);
						
						if (!response.length) {
							var CreatedOn = Common.ConvertTime(LocationId);
							var columnKey = "DomainName, FirstName, LastName, Email, EmpId, LastLogin, Status, CreatedOn, SuperAdmin, Auditor, LocationId, Token, UserOTP";
							var insertValues = { DomainName: DomainName, FirstName: FirstName, LastName: LastName, Email: Email, EmpId: EmpId, LastLogin: '', Status: 1, CreatedOn: CreatedOn, SuperAdmin: 0, Auditor: 0, LocationId: LocationId, Token: 0, UserOTP: 0 };
							dbQuery.CreateUser(dbTable.Users, columnKey, insertValues).then(result => {
								dbQuery.GetUserDetails(DomainName, LocationId).then(responseUser => {
									let ApproverFirstName = responseUser[0]['FirstName'];
									let ApproverLastName = responseUser[0]['LastName'];
									let ApproverUserId = responseUser[0]['UserId'];
									res.json(Common.jsonCovert("success", {Roles: responseR, Plants: PlantList, AppFName: ApproverFirstName, AppLName: ApproverLastName, AppUId: ApproverUserId}, 1));
								});
							});
						} else {
							let FirstName = response[0]['FirstName'];
							let LastName = response[0]['LastName'];
							let UserId = response[0]['UserId'];
							res.json(Common.jsonCovert("success", {Roles: responseR, Plants: PlantList, AppFName: FirstName, AppLName: LastName, AppUId: UserId}, 1));
						}
					});
				});
			});
		});
	});
	
	app.post("/gembawalker-dev/GetValuestreamByPlant", (req, res, next) => {
		var LocationId = req.body.LocationId;
		var Plant = req.body.Plant;
		
		if(LocationId == '' || typeof LocationId === 'undefined' || Plant == '' || typeof Plant === 'undefined'){
			res.json(Common.jsonCovert("error", "Data missing", 0));
		}

		var ValueStreamList = [];
		dbQuery.GetValuestreamByPlant(dbTable.LineResponsibility, LocationId, Plant).then(responseValueStream => {
			if (responseValueStream != '') {
				for (var i = 0; i < responseValueStream.length; i++) {
					ValueStreamList.push(responseValueStream[i]['ValueStream']);
				}
				console.log(ValueStreamList);
				res.json(Common.jsonCovert("success", ValueStreamList, 1));
			} else {
				res.json(Common.jsonCovert("error", "ValueStream not found", 0));
			}
		});
	});
	
	app.post("/gembawalker-dev/GetLineByPlantVS", (req, res, next) => {
		var Plant = req.body.Plant;
		var ValueStream = req.body.ValueStream;
		var LocationId = req.body.LocationId;
		
		if(LocationId == '' || typeof LocationId === 'undefined' || Plant == '' || typeof Plant === 'undefined' || ValueStream == '' || typeof ValueStream === 'undefined'){
			res.json(Common.jsonCovert("error", "Data missing", 0));
		}

		var LinesList = [];
		dbQuery.GetLinesByPlantVS(dbTable.LineResponsibility, LocationId, Plant, ValueStream).then(responseLine => {
			if (responseLine != '') {				
				res.json(Common.jsonCovert("success", responseLine, 1));
			} else {
				res.json(Common.jsonCovert("error", "Line not found", 0));
			}
		});
	});
	
	


/* let NCImages = JSON.parse(response[0]['NCImage']);
cron.schedule('* * * * *', () => {
  request('https://mobility-webservices.wabco-auto.com/wbcnews/b2e.php', function (error, response, body) {
  //if (!error && response.statusCode == 200) {
    console.log(error) // Show the HTML for the Google homepage. 
  //}
  //else {
    //console.log("Error "+response.statusCode)
  //}
})
});*/

/*cron.schedule('* * * * *', () => {
  console.log('running a task every minute 123467890');
});*/
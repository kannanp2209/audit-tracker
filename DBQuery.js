'use strict';
const sql = require('mssql');
var dbConnection = require("./db_connection.js");
var tables = require("./tables.js");
var dbConfig = dbConnection.databaseOptions;
var dbTable = tables.table;
var jwt = require('jsonwebtoken');


module.exports = class DBQuery {
    constructor() {
        //dbConnection.connect();

    }

    async test() {
        return await new Promise((resolve, reject) => {
            setTimeout(function() {
                console.log("#########" + dbTable.Users);
                sql.connect(dbConfig, function(err) {
                    var request = new sql.Request();

                    request.query("select * from " + dbTable.Users, function(err, result) {

                        return resolve(result);
                    });
                });

            }, 2000);
        })
    }

    async CheckUserTokenDetails(token) {
        var TokenDecode = jwt.decode(token, { complete: true });
        console.log(TokenDecode);
        const currentTime = new Date().getTime();
        const currentTimeInSeconds = Math.floor(currentTime / 1000);
        console.log("$$$$$$$$$$$$$" + currentTimeInSeconds);
        const expiryTime = TokenDecode.payload.exp;
        console.log("###########" + expiryTime);
        var isExpired = expiryTime - currentTimeInSeconds; //it will be in minus value if expired	
        console.log("isexpiry=>", isExpired);


        if (isExpired > 0) {
            let pool = await sql.connect(dbConfig);
            var Query = "select * from " + dbTable.Users + " where DomainName='" + TokenDecode.payload.DomainName + "'";
            console.log(Query);
            let data = await pool.request()
                .query(Query);
            console.log("#########" + data.recordset.length);
            if (data.recordset.length > 0) {
                console.log(data['recordset'][0]);
                console.log(data['recordset'][0]['Token']);
                console.log("-----------------------");
                console.log(token);
                if ((data['recordset'][0]['Token']) == token) {
                    console.log("true");
                    return 1;
                } else {
                    return 0;
                }
            } else {
                return 0;
            }
            pool.close;
            sql.close;
        } else {
            return 0;
        }
    }

    async FetchUserDetails(UsersEmpId, LocationId) {
        var WhereCond = '';
        if (LocationId != '') {
            WhereCond += " and LocationId='" + LocationId + "'";
        }
        let pool = await sql.connect(dbConfig);
        let data = await pool.request()
            .query("select * from " + dbTable.Users + " where EmpId='" + UsersEmpId + "'" + WhereCond);
        pool.close;
        sql.close;
        return data.recordset;
    }

    async UpdatePasscode(tableName, Passcode, UsersEmpId, LocationId) {
        var WhereCond = '';
        if (LocationId != '') {
            WhereCond += " and LocationId='" + LocationId + "'";
        }
        return new Promise((resolve, reject) => {
            new sql.ConnectionPool(dbConfig).connect().then(pool => {
                return pool.request().query("UPDATE " + tableName + " set Passcode='" + Passcode + "' where EmpId='" + UsersEmpId + "' select UserId from " + tableName + " where EmpId='" + UsersEmpId + "'" + WhereCond)
            }).then(result => {
                resolve(result['recordset']);
                sql.close();
            }).catch(err => {
                reject(err)
                sql.close();
            });
        });
    }

    async PasscodeCheck(tableName, EncodePasscode, UsersEmpId, LocationId) {
        var WhereCond = '';
        if (LocationId != '') {
            WhereCond += " and LocationId='" + LocationId + "'";
        }
        let pool = await sql.connect(dbConfig);
        let Query = "select * from " + tableName + " where EmpId='" + UsersEmpId + "' and Passcode='" + EncodePasscode + "'" + WhereCond;
        console.log(Query);
        let data = await pool.request()
            .query(Query);
        pool.close;
        sql.close;
        return data.recordset;
    }
	
	async OTPValidate(tableName, UserId, UserOTP, LocationId) {
        
        let pool = await sql.connect(dbConfig);
        let Query = "select * from " + tableName + " where UserId='" + UserId + "' and UserOTP='" + UserOTP + "' and LocationId='"+LocationId+"'";
        console.log(Query);
        let data = await pool.request()
            .query(Query);
        pool.close;
        sql.close;
        return data.recordset;
    }
	
	async OTPUpdate(tableName, UserId, UserOTP) {
        
        return new Promise((resolve, reject) => {
            new sql.ConnectionPool(dbConfig).connect().then(pool => { 
				var Query = "UPDATE " + tableName + " set UserOTP='" + UserOTP + "' where UserId='" + UserId + "' select UserId from " + tableName + " where UserId='" + UserId + "'";
				console.log(Query);
                return pool.request().query(Query)
            }).then(result => {
                resolve(result['recordset']);
                sql.close();
            }).catch(err => {
                reject(err)
                sql.close();
            });
        });
    }

    async GetUserDetails(domainName, LocationId) {
        var WhereCond = '';
        var DevelopersDomainName = ['kannanp', 'umadevi', 'mohank', 'mrithun', 'kavitha', 'z0049894', 'rangasamys2'];
        var isDeveloper = DevelopersDomainName.includes(domainName);
        console.log("isDeveloper", isDeveloper);
        if (!isDeveloper) {
            WhereCond += " and a.LocationId='" + LocationId + "'";
        }
        let pool = await sql.connect(dbConfig);
        //select a.*,b.RoleName from [dbo].[Users] as a left join [dbo].[UserRoles] as b ON a.RoleId=b.RoleId where a.DomainName='salamon'
        // let Query = "select a.*,b.RoleName from " + dbTable.Users + " as a left join " + dbTable.UserRoles + " as b ON a.RoleId=b.RoleId where a.DomainName='" + domainName + "'" + WhereCond;
        let Query = "select a.*,b.RoleName,c.LocationCode,c.LocationDateformat from " + dbTable.Users + " as a left join " + dbTable.UserRoles + " as b ON a.RoleId=b.RoleId left join " + dbTable.Locations + " as c ON a.LocationId=c.LocationId  where a.DomainName='" + domainName + "'" + WhereCond;
        console.log("code", Query)
        let data = await pool.request()
            .query(Query);
        pool.close;
        sql.close;
        return data.recordset;
    }

    async GetUserDetailsNew(UserId, LocationId) {
        var WhereCond = '';
        if (LocationId != '') {
            WhereCond += " and a.LocationId='" + LocationId + "'";
        }
        let pool = await sql.connect(dbConfig);
        var Query = "select a.*,b.RoleName,c.FirstName as subFirstName,c.LastName as subLastName from [dbo].[Users] as a left join  [dbo].[UserRoles] as b on a.RoleId=b.RoleId left join [dbo].[Users] as c on c.UserId= a.AuditSubstitute where a.UserId='" + UserId + "'" + WhereCond;
		console.log(Query);
        let data = await pool.request()
            .query(Query);
        pool.close;
        sql.close;
        return data.recordset;
    }

    async GetUserLineDetails(UserId, LocationId, Auditor) {
        var WhereCond = '';
        if (LocationId != '') {
            WhereCond += " and LocationId='" + LocationId + "'";
        }
        let pool = await sql.connect(dbConfig);
		if(Auditor == '1'){
			var Query = "select DISTINCT d.LineId,d.LineName,d.ValueStream,d.Plant, e.UserId, e.ProxyId, e.Status, f.FirstName, f.LastName  from Users as a, RoleAccess as b,LineRespChecklist as c, LineResponsibility as d left Join [dbo].[Proxy] as e ON d.LineId= e.LineId left join [dbo].[Users] as f ON f.UserId=e.UserId where a.UserId='" + UserId + "' and a.RoleId=b.RoleId and b.ChecklistId=c.ChecklistId and c.LineId=d.LineId and d.LocationId='" + LocationId + "'";
		}
		else{
			var Query = "select a.Plant, a.ValueStream, a.LineName, a.LineId, b.UserId, b.ProxyId, b.Status, c.FirstName, c.LastName from [dbo].[LineResponsibility] as a left join [dbo].[Proxy] as b ON a.LineId = b.LineId left join [dbo].[Users] as c ON c.UserId=b.UserId where (a.Engineers like '%," + UserId + ",%' or Leaders like '%," + UserId + ",%') and a.LocationId='" + LocationId + "' "
		}
		console.log(Query);
        let data = await pool.request()
            .query(Query);
        pool.close;
        sql.close;
        return data.recordset;
    }

    async CreateUserOld(tableName, columnKey, insertValues) {
        return await new Promise((resolve, reject) => {
            setTimeout(function() {
                sql.connect(dbConfig, function(err) {
                    var request = new sql.Request();
                    console.log(insertValues.DomainName);
                    console.log("--------------");
                    request.query("INSERT INTO " + tableName + " (" + columnKey + ") VALUES ('" + insertValues.DomainName + "','" + insertValues.FirstName + "','" + insertValues.LastName + "','" + insertValues.Email + "','" + insertValues.EmpId + "','" + insertValues.LastLogin + "','" + insertValues.Status + "','" + insertValues.LastLogin + "', '" + insertValues.SuperAdmin + "', '" + insertValues.Auditor + "')", function(err, result) {
                        if (err) {
                            console.log(err);
                            return resolve(0);
                        } else {
                            //return resolve(result.insertId);
                            sql.connect(dbConfig, function(err) {
                                var request = new sql.Request();
                                request.query("select TOP 1 UserId from " + tableName + " ORDER BY UserId DESC", function(err, res) {
                                    console.log(res);
                                    return resolve(res['recordset']);
                                });
                            });
                        }
                    });
                });

            }, 2000);
        })
    }

    async CreateUser(tableName, columnKey, insertValues) {

        return new Promise((resolve, reject) => {
            new sql.ConnectionPool(dbConfig).connect().then(pool => {
                return pool.request().query("INSERT INTO " + tableName + " (" + columnKey + ") VALUES ('" + insertValues.DomainName + "','" + insertValues.FirstName + "','" + insertValues.LastName + "','" + insertValues.Email + "','" + insertValues.EmpId + "','" + insertValues.LastLogin + "','" + insertValues.Status + "','" + insertValues.LastLogin + "', '" + insertValues.SuperAdmin + "', '" + insertValues.Auditor + "', '" + insertValues.LocationId + "', '" + insertValues.Token + "', '"+insertValues.UserOTP+"') SELECT TOP 1 UserId from " + tableName + " ORDER BY UserId DESC")
            }).then(result => {
                console.log(result);
                resolve(result['recordset']);
                sql.close();
            }).catch(err => {
                reject(err)
                sql.close();
            });
        });

    }

    async CreateUserResponsible(tableName, columnKey, insertValues) {
        if (insertValues.LocationId != '') {
            var insertField = ",'" + insertValues.LocationId + "'";
        } else {
            var insertField = '';
        }
        return new Promise((resolve, reject) => {
            new sql.ConnectionPool(dbConfig).connect().then(pool => {
                console.log("INSERT INTO " + tableName + " (" + columnKey + ") VALUES ('" + insertValues.DomainName + "','" + insertValues.FirstName + "','" + insertValues.LastName + "','" + insertValues.Email + "','" + insertValues.EmpId + "','" + insertValues.Status + "','" + insertValues.CreatedOn + "', '" + insertValues.SuperAdmin + "', '" + insertValues.Auditor + "'" + insertField + ") SELECT TOP 1 UserId from " + tableName + " ORDER BY UserId DESC");
                return pool.request().query("INSERT INTO " + tableName + " (" + columnKey + ") VALUES ('" + insertValues.DomainName + "','" + insertValues.FirstName + "','" + insertValues.LastName + "','" + insertValues.Email + "','" + insertValues.EmpId + "','" + insertValues.Status + "','" + insertValues.CreatedOn + "', '" + insertValues.SuperAdmin + "', '" + insertValues.Auditor + "'" + insertField + ") SELECT TOP 1 UserId from " + tableName + " ORDER BY UserId DESC")
            }).then(result => {
                console.log(result);
                resolve(result['recordset']);
                sql.close();
            }).catch(err => {
                reject(err)
                sql.close();
            });
        });

    }


    async UpdateUser(tableName, DomainName, LastLogin, Email, LocationId, token, UserOTP) {

        return new Promise((resolve, reject) => {
            new sql.ConnectionPool(dbConfig).connect().then(pool => {
                // let Query = "UPDATE " + tableName + " set LastLogin='" + LastLogin + "', Email='" + Email + "', LocationId='" + LocationId + "' where DomainName='" + DomainName + "' select UserId from " + tableName + " where DomainName='" + DomainName + "'";
                let Query = "UPDATE " + tableName + " set LastLogin='" + LastLogin + "', Email='" + Email + "', Token='" + token + "', UserOTP='"+UserOTP+"' where DomainName='" + DomainName + "' select UserId from " + tableName + " where DomainName='" + DomainName + "'";
                console.log(Query);
                return pool.request().query(Query)
            }).then(result => {
                console.log(result);
                resolve(result['recordset']);
                sql.close();
            }).catch(err => {
                reject(err)
                sql.close();
            });
        });

    }
	
	async RefreshToken(tableName, DomainName, LocationId, token) {

        return new Promise((resolve, reject) => {
            new sql.ConnectionPool(dbConfig).connect().then(pool => {
                let Query = "UPDATE " + tableName + " set Token='" + token + "' where DomainName='" + DomainName + "' and LocationId='"+LocationId+"'";
                console.log(Query);
                return pool.request().query(Query)
            }).then(result => {
                console.log(result);
                resolve(result['recordset']);
                sql.close();
            }).catch(err => {
                reject(err)
                sql.close();
            });
        });
    }

    async UpdateUserOld(tableName, DomainName, LastLogin) {
        return await new Promise((resolve, reject) => {
            setTimeout(function() {
                sql.connect(dbConfig, function(err) {
                    var request = new sql.Request();
                    console.log("UPDATE " + tableName + " set LastLogin='" + LastLogin + "' where DomainName='" + DomainName + "'");
                    request.query("UPDATE " + tableName + " set LastLogin='" + LastLogin + "' where DomainName='" + DomainName + "'", function(err, result) {
                        if (err) {
                            console.log(err);
                            return resolve(0);
                        } else {
                            //return resolve(1);
                            sql.connect(dbConfig, function(err) {
                                var request = new sql.Request();
                                request.query("select UserId from " + tableName + " where DomainName='" + DomainName + "'", function(err, res) {
                                    console.log(res);
                                    return resolve(res['recordset']);
                                });
                            });
                        }
                    });
                });

            }, 2000);
        })
    }

    async GetChecklist(tableName, LineId, LocationId) {
        var WhereCond = '';
        if (LocationId != '') {
            WhereCond += " and b.LocationId='" + LocationId + "'";
        }
        let pool = await sql.connect(dbConfig);
        var Query = "select b.* from " + dbTable.LineRespChecklist + " as a, " + tableName + " as b  where a.LineId=" + LineId + " and a.ChecklistId=b.ChecklistId and a.Status=1 and b.Status=1" + WhereCond;
        console.log(Query);
        let data = await pool.request()
            .query(Query);
        pool.close;
        sql.close;
        sql.close;
        //return data.recordset;
        var Checklists = data.recordset;
        var ChecklistIds = [];
        for (var i = 0; i < Checklists.length; i++) {
            ChecklistIds.push(Checklists[i]['ChecklistId']);
        }
        console.log(ChecklistIds);
        return ChecklistIds;
    }

    async GetChecklistByRole(tableName, UserId, LocationId) {
        var WhereCond = '';
        if (LocationId != '') {
            WhereCond += " and c.LocationId='" + LocationId + "'";
        }
        let pool = await sql.connect(dbConfig);
        var Query = "select c.* from " + dbTable.Users + " as a, " + dbTable.RoleAccess + " as b, " + tableName + " as c where a.UserId=" + UserId + " and a.RoleId=b.RoleId and b.ChecklistId=c.ChecklistId and b.Status=1 and c.Status=1" + WhereCond;
        console.log(Query);
        let data = await pool.request()
            .query(Query);
        pool.close;
        sql.close;
        //return data.recordset;
        var Checklists = data.recordset;
        var ChecklistIds = [];
        for (var i = 0; i < Checklists.length; i++) {
            ChecklistIds.push(Checklists[i]['ChecklistId']);
        }
        console.log(ChecklistIds);
        return ChecklistIds;
    }
	
	async GetChecklistByProxyUserRole(tableName, UserId, LocationId, LineId) {
        var WhereCond = '';
        if (LocationId != '') {
            WhereCond += " and c.LocationId='" + LocationId + "'";
        }
        let pool = await sql.connect(dbConfig);
        var Query = "select c.*,d.CreatedBy as ActualUser,d.UserId as ProxyUser from "+dbTable.Users+" as a, "+dbTable.RoleAccess+" as b, "+tableName+" as c,"+dbTable.Proxy+" as d where d.UserId="+UserId+" and d.Status=1 and d.Auditor=1 and d.LineId="+LineId+" and a.UserId=d.CreatedBy and a.RoleId=b.RoleId and b.ChecklistId=c.ChecklistId and b.Status=1 and c.Status=1" + WhereCond;
        console.log(Query);
        let data = await pool.request()
            .query(Query);
        pool.close;
        sql.close;
        //return data.recordset;
        var Checklists = data.recordset;
        var ChecklistIds = [];
        for (var i = 0; i < Checklists.length; i++) {
            ChecklistIds.push(Checklists[i]['ChecklistId']);
        }
        console.log(ChecklistIds);
        return ChecklistIds;
    }
	
	async GetProxyUserDetails(UserId, LocationId, LineId) {
        var WhereCond = '';
        if (LocationId != '') {
            WhereCond += " and c.LocationId='" + LocationId + "'";
        }
        let pool = await sql.connect(dbConfig);
        var Query = "select UserId,CreatedBy from "+dbTable.Proxy+" where UserId="+UserId+" and LineId="+LineId+" and Status=1 and Auditor=1 and LocationId="+LocationId;
        console.log(Query);
        let data = await pool.request()
            .query(Query);
        pool.close;
        sql.close;
        return data.recordset;
    }

    async GetChecklistByIds(tableName, Ids, LocationId) {
        var WhereCond = '';
        if (LocationId != '') {
            WhereCond += " and LocationId='" + LocationId + "'";
        }
        let pool = await sql.connect(dbConfig);
        console.log("select * from " + tableName + " where ChecklistId IN (" + Ids + ") and Status=1" + WhereCond + "order by ChecklistOrder asc");
        let data = await pool.request()
            .query("select * from " + tableName + " where ChecklistId IN (" + Ids + ") and Status=1" + WhereCond + "order by ChecklistOrder asc");
        pool.close;
        sql.close;
        return data.recordset;
    }

    async GetChecklistNew(tableName, LineId) {
        let pool = await sql.connect(dbConfig);
        let data = await pool.request()
            .query("select b.* from " + dbTable.LineRespChecklist + " as a, " + tableName + " as b  where a.LineId=" + LineId + " and a.ChecklistId=b.ChecklistId and a.Status=1 and b.Status=1");
        pool.close;
        sql.close;
        return data.recordset;
    }

    async GetCategory(tableName, ChecklistId, LocationId) {
        var WhereCond = '';
        if (LocationId != '') {
            WhereCond += " and LocationId='" + LocationId + "'";
        }
        let pool = await sql.connect(dbConfig);
        let data = await pool.request()
            .query("select * from " + tableName + " where ChecklistId='" + ChecklistId + "' and Status=1" + WhereCond + " order by CategoryOrder asc");
        pool.close;
        sql.close;
        return data.recordset;
    }

    async GetControllElement(tableName, CategoryId, LocationId) {
        var WhereCond = '';
        if (LocationId != '') {
            WhereCond += " and LocationId='" + LocationId + "'";
        }
        let pool = await sql.connect(dbConfig);
        let data = await pool.request()
            .query("select * from " + tableName + " where CategoryId='" + CategoryId + "' and Status=1" + WhereCond + " order by CEOrder asc");
        pool.close;
        sql.close;
        return data.recordset;
    }

    async GetMistakeCode(tableName, CategoryId, CEId, LocationId) {
        var WhereCond = '';
        if (LocationId != '') {
            WhereCond += " and LocationId='" + LocationId + "'";
        }
        let pool = await sql.connect(dbConfig);
        let data = await pool.request()
            .query("select * from " + tableName + " where CEId='" + CEId + "' and CategoryId = '" + CategoryId + "' and Status=1" + WhereCond + " order by MCOrder asc");
        pool.close;
        sql.close;
        return data.recordset;
    }

    /*async GetMistakeCodeByCategory(tableName, CategoryId)
    {
    	let pool = await sql.connect(dbConfig);
    	let data = await pool.request()
    		.query("select * from "+tableName+" where CategoryId='"+CategoryId+"' and Status=1 order by MCId asc");		
    	pool.close;
    	sql.close;
    	return data.recordset;
    }*/

    async GetMistakeCodeByCategory(tableName, CategoryId, RAId, LocationId) {
        var WhereCond = '';
        if (RAId == '') {
            var sqlQuery = "select * from " + tableName + " where CategoryId='" + CategoryId + "' and LocationId='" + LocationId + "' and Status=1" + WhereCond + "  order by MCOrder asc";
            console.log("*********", sqlQuery);
        } else {
            //var sqlQuery = "select b.*, CONCAT(c.FirstName,' ',c.LastName) as AuditerResponsiblePerson, a.CategoryId as MCCategoryId,a.CEId as MCCEId,a.MCTitle,a.MCOrder,a.MCQuestion,a.MCId as MCMCId from " + tableName + " as a left join " + dbTable.RANCList + " as b ON a.MCId=b.MCId and b.RAId='" + RAId + "' left join " + dbTable.Users + " as c ON b.AuditerResponsibleId=c.UserId where a.CategoryId='" + CategoryId + "' and a.Status=1 " + WhereCond + " order by a.MCOrder asc";
			var sqlQuery = "select b.*, CONCAT(c.FirstName,' ',c.LastName) as AuditerResponsiblePerson, a.CategoryId as MCCategoryId,a.CEId as MCCEId,a.MCTitle,a.MCOrder,a.MCQuestion,a.MCId as MCMCId from AuditMC as a left join (select *,row_number() over(partition by MCId order by MCId desc) as roworder from RANCList as b where b.RAId="+RAId+") as b ON a.MCId=b.MCId and roworder=1 left join Users as c ON b.AuditerResponsibleId=c.UserId where a.CategoryId='"+CategoryId+"' and a.Status=1 and a.LocationId='" + LocationId + "' order by a.MCOrder asc";
            console.log("*********", sqlQuery);
        }
        let pool = await sql.connect(dbConfig);
        let data = await pool.request()
            .query(sqlQuery);
        pool.close;
        sql.close;
        return data.recordset;
    }
	
	async GetMistakeCodeByCategoryAll(tableName, RAId, CategoryId, CEId, MCId, LocationId) {
        
        var sqlQuery = "select b.*, CONCAT(c.FirstName,' ',c.LastName) as AuditerResponsiblePerson, a.CategoryId as MCCategoryId,a.CEId as MCCEId,a.MCTitle,a.MCOrder,a.MCQuestion,a.MCId as MCMCId from " + tableName + " as a left join " + dbTable.RANCList + " as b ON a.MCId=b.MCId and b.RAId='" + RAId + "' left join " + dbTable.Users + " as c ON b.AuditerResponsibleId=c.UserId where a.CategoryId='" + CategoryId + "' and a.CEId='"+CEId+"' and a.MCId='"+MCId+"' and a.Status=1 and a.LocationId='" + LocationId + "' order by a.MCOrder asc";
            console.log(sqlQuery);
        let pool = await sql.connect(dbConfig);
        let data = await pool.request()
            .query(sqlQuery);
        pool.close;
        sql.close;
        return data.recordset;
    }

    /*async NCCreate(tableName, columnKey, insertValues)
    {
    	return await new Promise((resolve, reject)=> {
    		setTimeout(function() {
    			sql.connect(dbConfig, function (err) {
    			var request = new sql.Request();
    			console.log("--------------");
    			console.log("INSERT INTO "+tableName+" ("+columnKey+") VALUES ('"+insertValues.RAId+"','"+insertValues.CategoryId+"','"+insertValues.CEId+"','"+insertValues.MCId+"','"+insertValues.NCLevel+"','"+insertValues.NCDescription+"','"+insertValues.NCImage+"','"+insertValues.CreatedOn+"')");
    				request.query("INSERT INTO "+tableName+" ("+columnKey+") VALUES ('"+insertValues.RAId+"','"+insertValues.CategoryId+"','"+insertValues.CEId+"','"+insertValues.MCId+"','"+insertValues.NCLevel+"','"+insertValues.NCDescription+"','"+insertValues.NCImage+"','"+insertValues.CreatedOn+"')", function(err, result) {
    						if(err) {
    							console.log(err);
    							return resolve(0);
    						} else {
    							return resolve(result.insertId);
    						}
    				});
    			});
    			
    		}, 2000);
    	})
    }*/

    async NCCreate(tableName, columnKey, insertValues) {

        return new Promise((resolve, reject) => {
            new sql.ConnectionPool(dbConfig).connect().then(pool => {
                var NCDesc = insertValues.NCDescription;
                NCDesc = NCDesc.replace(/'/g, "''");
                var Query = "INSERT INTO " + tableName + " (" + columnKey + ") VALUES ('" + insertValues.RAId + "','" + insertValues.CategoryId + "','" + insertValues.CEId + "','" + insertValues.MCId + "','" + insertValues.NCLevel + "',N'" + NCDesc + "','" + insertValues.NCImage + "','" + insertValues.CreatedOn + "','" + insertValues.AuditerResponsibleId + "') SELECT @@IDENTITY AS insertedId;";
                console.log(Query);
                return pool.request().query(Query)
            }).then(result => {
                resolve(result['recordset']);
                sql.close();
            }).catch(err => {
                reject(err)
                sql.close();
            });
        });

    }

    async NCCreateContent(tableName, columnKey, insertValues) {
        if (insertValues.LocationId != '') {
            var insertField = ",'" + insertValues.LocationId + "', '"+insertValues.ProxyUser+"'";
        } else {
            var insertField = ",'"+insertValues.ProxyUser+"'";
        }
        return new Promise((resolve, reject) => {
            new sql.ConnectionPool(dbConfig).connect().then(pool => {
                var NCDesc = insertValues.NCDescription;
                NCDesc = NCDesc.replace(/'/g, "''");
                var Query = "INSERT INTO " + tableName + " (" + columnKey + ") VALUES ('" + insertValues.RAId + "','" + insertValues.CategoryId + "','" + insertValues.CEId + "','" + insertValues.MCId + "','" + insertValues.NCLevel + "',N'" + NCDesc + "','" + insertValues.CreatedOn + "','" + insertValues.AuditerResponsibleId + "'" + insertField + ") SELECT @@IDENTITY AS insertedId;";
                console.log(Query);
                return pool.request().query(Query)
            }).then(result => {
                resolve(result['recordset']);
                sql.close();
            }).catch(err => {
                reject(err)
                sql.close();
            });
        });
    }

    async NCUpdateContent(tableName, updateValues) {
        var WhereCond = '';
        if (updateValues.LocationId != '') {
            WhereCond += " and LocationId='" + updateValues.LocationId + "'";
        }
        return new Promise((resolve, reject) => {
            new sql.ConnectionPool(dbConfig).connect().then(pool => {
                var Query = "UPDATE " + tableName + " set RAId='" + updateValues.RAId + "', CategoryId='" + updateValues.CategoryId + "', CEId='" + updateValues.CEId + "', MCId='" + updateValues.MCId + "', NCLevel='" + updateValues.NCLevel + "', NCStatus='" + updateValues.NCStatus + "', NCDescription=N'" + updateValues.NCDescription + "', AuditerResponsibleId='" + updateValues.AuditerResponsibleId + "' where NCId='" + updateValues.NCId + "'" + WhereCond;
                console.log(Query);
                return pool.request().query(Query)
            }).then(result => {
                resolve(1);
                sql.close();
            }).catch(err => {
                reject(err)
                sql.close();
            });
        });
    }

    async NCImageUpdate(tableName, updateValues) {
        var WhereCond = '';
        if (updateValues.LocationId != '') {
            WhereCond += " and LocationId='" + updateValues.LocationId + "'";
        }
        return new Promise((resolve, reject) => {
            new sql.ConnectionPool(dbConfig).connect().then(pool => {
                var WhereImage = "";
                if (updateValues.NCImage == "removed") {
                    WhereImage = ", NCImage=''";
                } else if (updateValues.NCImage != "") {
                    WhereImage = ", NCImage=N'" + updateValues.NCImage + "'";
                }

                console.log("UPDATE " + tableName + " set UpdatedOn='" + updateValues.UpdatedOn + "'" + WhereImage + " where NCId='" + updateValues.NCId + "' and RAId='" + updateValues.RAId + "'" + WhereCond);
                return pool.request().query("UPDATE " + tableName + " set UpdatedOn='" + updateValues.UpdatedOn + "'" + WhereImage + " where NCId='" + updateValues.NCId + "' and RAId='" + updateValues.RAId + "'" + WhereCond)
            }).then(result => {
                resolve(1);
                sql.close();
            }).catch(err => {
                reject(err);
                sql.close();
            });
        });
    }

    async GetNCList(tableName, RAId, LocationId) {
        var WhereCond = '';
        if (LocationId != '') {
            WhereCond += " and a.LocationId='" + LocationId + "'";
        }
        let pool = await sql.connect(dbConfig);
        var Query = "select a.*,b.CategoryTitle,c.CETitle,d.MCTitle,e.CAId,e.ResponsibleId,e.CADescription,e.ImpDate,e.CAStatus,e.VrfcDate,e.VrfcDescription,e.CreatedBy as CACreated,e.NCReassCommands,e.ImpImage,e.ImpDescription,e.NCReassOn,e.NCReassImage,e.ImpOn,e.ImpBy,f.FirstName,f.LastName,h.FirstName as AuditerFirstName, h.LastName as AuditerLastName,i.ChecklistName,i.ChecklistSlug from [dbo].[Checklists] as i,[dbo].[Users] as h,[dbo].[RADetails] as g,[dbo].[AuditCategory] as b, [dbo].[RANCList] as a left join [dbo].[AuditCE] as c ON a.CEId=c.CEId left join [dbo].[AuditMC] as d ON a.MCId=d.MCId left join [dbo].[RACA] as e ON e.NCId=a.NCId  left join [dbo].[Users] as f ON e.ResponsibleId=f.UserId  where a.RAId='" + RAId + "' and a.CategoryId=b.CategoryId and g.RAId=a.RAId and g.AuditerId=h.UserId and g.ChecklistId=i.ChecklistId" + WhereCond + " order by a.NCId asc";
        console.log(Query);
        let data = await pool.request()
            .query(Query)
        pool.close;
        sql.close;
        return data.recordset;
    }

    async NCDetail(tableName, NCId, LocationId) {
        var WhereCond = '';
        if (LocationId != '') {
            WhereCond += " and a.LocationId='" + LocationId + "'";
        }
        let pool = await sql.connect(dbConfig);
        var Query = "select a.*,b.CategoryTitle,c.CETitle,d.MCTitle,e.ResponsibleId,e.CADescription,e.ImpDate,e.VrfcDate,e.VrfcDescription,e.NCReassCommands,e.ImpDescription,e.ImpImage,e.NCReassImage from " + dbTable.AuditCategory + " as b, " + dbTable.RANCList + " as a left join " + dbTable.AuditCE + " as c ON a.CEId=c.CEId left join " + dbTable.AuditMC + " as d ON a.MCId=d.MCId left join " + dbTable.RACA + " as e ON a.NCId=e.NCId where a.NCId='" + NCId + "' and  a.CategoryId=b.CategoryId" + WhereCond;
        console.log(Query);
        let data = await pool.request()
            .query(Query);
        pool.close;
        sql.close;
        return data.recordset;
    }

    async NCUpdate(tableName, updateValues) {
        return await new Promise((resolve, reject) => {
            setTimeout(function() {
                sql.connect(dbConfig, function(err) {
                    var request = new sql.Request();
                    var WhereImage = "";
                    if (updateValues.NCImage == "removed") {
                        WhereImage = ", NCImage=''";
                    } else if (updateValues.NCImage != "") {
                        WhereImage = ", NCImage='" + updateValues.NCImage + "'";
                    }
                    request.query("UPDATE " + tableName + " set RAId='" + updateValues.RAId + "', CategoryId='" + updateValues.CategoryId + "', CEId='" + updateValues.CEId + "', MCId='" + updateValues.MCId + "', NCLevel='" + updateValues.NCLevel + "', NCStatus='" + updateValues.NCStatus + "', NCDescription=N'" + updateValues.NCDescription + "'" + WhereImage + ", AuditerResponsibleId='" + updateValues.AuditerResponsibleId + "' where NCId='" + updateValues.NCId + "'", function(err, result) {
                        if (err) {
                            console.log(err);
                            return resolve(0);
                        } else {
                            return resolve(1);
                        }
                    });
                });

            }, 2000);
        })
    }

    async NCReassign(tableName, updateValues) {
        return new Promise((resolve, reject) => {
            new sql.ConnectionPool(dbConfig).connect().then(pool => {
                var ReassCommands = updateValues.NCReassCommands;
                ReassCommands = ReassCommands.replace(/'/g, "''");
                let Query = "UPDATE " + tableName + " set CAStatus='" + updateValues.CAStatus + "', UpdatedOn='" + updateValues.UpdatedOn + "', NCReassCommands=N'" + ReassCommands + "', NCReassOn='" + updateValues.NCReassOn + "',ReassignProxy='"+updateValues.ReassignProxy+"',ImpDescription='',ImpImage='',ImpOn='',ImpBy='' where NCId='" + updateValues.NCId + "' and RAId='" + updateValues.RAId + "' and CAId='" + updateValues.CAId + "'";
				console.log(Query);
                return pool.request().query(Query)
            }).then(result => {
                resolve(1);
                sql.close();
            }).catch(err => {
                reject(err)
                sql.close();
            });
        });
    }

    async NCDelete(tableName, NCId) {
        return await new Promise((resolve, reject) => {
            setTimeout(function() {

                sql.connect(dbConfig, function(err) {
                    var request = new sql.Request();
                    console.log("delete from " + tableName + " where NCId='" + NCId + "'");
                    request.query("delete from " + tableName + " where NCId='" + NCId + "'", function(err, result) {
                        if (err) {
                            console.log(err);
                            return resolve(0);
                        } else {
                            return resolve(1);
                        }
                    });
                });

            }, 2000);
        })
    }

    async RADelete(tableName, RAId) {
        return new Promise((resolve, reject) => {
            new sql.ConnectionPool(dbConfig).connect().then(pool => {
                console.log("delete from " + tableName + " where RAId='" + RAId + "'");
                return pool.request().query("delete from " + tableName + " where RAId='" + RAId + "'")
            }).then(result => {
                resolve(1);
                sql.close();
            }).catch(err => {
                reject(err)
                sql.close();
            });
        });
    }

    async RACreate(tableName, columnKey, insertValues) {

        if (insertValues.LocationId != '') {
            var insertField = ",'" + insertValues.LocationId + "'";
        } else {
            var insertField = '';
        }
        var WhereCond = '';
        if (insertValues.LocationId != '') {
            WhereCond += " where LocationId='" + insertValues.LocationId + "'";
        }
        return await new Promise((resolve, reject) => {
            setTimeout(function() {
                sql.connect(dbConfig, function(err) {
                    var request = new sql.Request();
                    console.log("--------------");
                    request.query("INSERT INTO " + tableName + " (" + columnKey + ") VALUES ('" + insertValues.AuditerId + "','" + insertValues.LineId + "','" + insertValues.ChecklistId + "','" + insertValues.AuditDate + "','" + insertValues.AuditTime + "',N'" + insertValues.AuditDescription + "','" + insertValues.Status + "','" + insertValues.CreatedOn + "','" + insertValues.WkNumber + "'" + insertField + ",'"+insertValues.AuditScheduledId+"' )", function(err, result) {
                        if (err) {
                            console.log(err);
                            return resolve(0);
                        } else {
                            //return resolve(result.insertId);
                            sql.connect(dbConfig, function(err) {
                                var request = new sql.Request();
                                request.query("select TOP 1 RAId from " + tableName + WhereCond + " ORDER BY RAId DESC", function(err, res) {
                                    console.log(res);
                                    return resolve(res['recordset']);
                                });
                            });
                        }
                    });
                });

            }, 2000);
        })
    }

    async RAFinish(tableName, RAId, status, LocationId) {
        var WhereCond = '';
        if (LocationId != '') {
            WhereCond += " and LocationId='" + LocationId + "'";
        }
        return new Promise((resolve, reject) => {
            new sql.ConnectionPool(dbConfig).connect().then(pool => {
                console.log("UPDATE " + tableName + " set Status='" + status + "' where RAId='" + RAId + "'" + WhereCond);
                return pool.request().query("UPDATE " + tableName + " set Status='" + status + "' where RAId='" + RAId + "'" + WhereCond)
            }).then(result => {
                resolve(1);
                sql.close();
            }).catch(err => {
                reject(err)
                sql.close();
            });
        });
    }

    async NCStatusUpdate(tableName, RAId, status, LocationId) {
        var WhereCond = '';
        if (LocationId != '') {
            WhereCond += " and LocationId='" + LocationId + "'";
        }
        return new Promise((resolve, reject) => {
            new sql.ConnectionPool(dbConfig).connect().then(pool => {
                return pool.request().query("UPDATE " + tableName + " set NCStatus='" + status + "' where RAId='" + RAId + "'" + WhereCond)
            }).then(result => {
                resolve(result['recordset']);
                sql.close();
            }).catch(err => {
                reject(err)
                sql.close();
            });
        });
    }

    async SingleNCStatusUpdate(tableName, NCId, status, LocationId) {
        var WhereCond = '';
        if (LocationId != '') {
            WhereCond += " and LocationId='" + LocationId + "'";
        }
        return new Promise((resolve, reject) => {
            console.log("UPDATE " + tableName + " set NCStatus='" + status + "' where NCId='" + NCId + "'" + WhereCond);
            new sql.ConnectionPool(dbConfig).connect().then(pool => {
                return pool.request().query("UPDATE " + tableName + " set NCStatus='" + status + "' where NCId='" + NCId + "'" + WhereCond)
            }).then(result => {
                resolve(1);
                sql.close();
            }).catch(err => {
                reject(err)
                sql.close();
            });
        });
    }

    /*async GetRAList(tableName, UserId)
    {
    	let pool = await sql.connect(dbConfig);
    	let data = await pool.request()
    		.query("select a.*,b.ChecklistName, c.Plant as PlantName, c.ValueStream as ValueStreamName, c.LineName from "+tableName+" as a, "+dbTable.Checklists+" as b, "+dbTable.LineResponsibility+" as c where a.ChecklistId=b.ChecklistId and a.Status!=6 and a.LineId=c.LineId order by a.RAId desc");		
    	pool.close;
    	sql.close;
    	return data.recordset;
    }*/

    async GetRAList(tableName, UserId, Auditer) {
        let pool = await sql.connect(dbConfig);
        var query = '';
        if (Auditer == 0) {
            query = "select b.*,c.ChecklistName, a.Plant as PlantName, a.ValueStream as ValueStreamName, a.LineName from " + dbTable.LineResponsibility + " as a, " + tableName + " as b, " + dbTable.Checklists + " as c where (a.VSPRENG='" + UserId + "' or a.VSPRQLENG='" + UserId + "'  or a.MRPCNTRL='" + UserId + "' or a.PRSFTLD='" + UserId + "') and a.LineId=b.LineId and b.ChecklistId=c.ChecklistId and b.Status NOT IN ('1','6') order by b.RAId desc";
        } else if (Auditer == 1) {
            query = "select a.*,b.ChecklistName, c.Plant as PlantName, c.ValueStream as ValueStreamName, c.LineName from " + tableName + " as a, " + dbTable.Checklists + " as b, " + dbTable.LineResponsibility + " as c where a.AuditerId='" + UserId + "' and a.ChecklistId=b.ChecklistId and a.LineId=c.LineId and a.Status NOT IN ('6') order by a.RAId desc";
        }
        console.log(Auditer + "#################");
        console.log(query);

        let data = await pool.request()
            .query(query);
        pool.close;
        sql.close;
        return data.recordset;
    }

    async RACADetails(RAId, NCId, CAId) {
        let pool = await sql.connect(dbConfig);
        let data = await pool.request()
            .query("select a.*,b.FirstName,b.LastName from " + dbTable.Users + " as b, " + dbTable.RACA + " as a where a.NCId='" + NCId + "' and a.RAId='" + RAId + "' and a.CAId='" + CAId + "' and a.ResponsibleId=b.UserId");
        pool.close;
        sql.close;
        return data.recordset;
    }

    async RACACreate(tableName, columnKey, insertValues) {
        return await new Promise((resolve, reject) => {
            setTimeout(function() {
                sql.connect(dbConfig, function(err) {
                    var requestCA = new sql.Request();
                    requestCA.query("select * from " + tableName + " where NCId='" + insertValues.NCId + "'", function(err, resultCA) {
                        if (resultCA['recordset'].length == 0) {
                            var request = new sql.Request();
                            var CADesc = insertValues.CADescription;
                            CADesc = CADesc.replace(/'/g, "''");
                            request.query("INSERT INTO " + tableName + " (" + columnKey + ") VALUES ('" + insertValues.NCId + "','" + insertValues.ResponsibleId + "','" + insertValues.RAId + "',N'" + CADesc + "','" + insertValues.ImpDate + "','" + insertValues.CAStatus + "','" + insertValues.CreatedOn + "','" + insertValues.CreatedBy + "','" + insertValues.AccResponsibleId + "', '"+insertValues.CADefineProxy+"')", function(err, result) {
                                if (err) {
                                    console.log(err);
                                    return resolve(0);
                                } else {
                                    return resolve(1);
                                }
                            });
                        } else {
                            return resolve(0);
                        }
                    });
                });
            }, 2000);
        })
    }

    async RACAUpdate(tableName, updateValues) {
        return new Promise((resolve, reject) => {
            new sql.ConnectionPool(dbConfig).connect().then(pool => {
                var CADesc = updateValues.CADescription;
                CADesc = CADesc.replace(/'/g, "''");
                console.log("UPDATE " + tableName + " set ResponsibleId='" + updateValues.ResponsibleId + "', CADescription=N'" + CADesc + "', AccResponsibleId='" + updateValues.AccResponsibleId + "', ImpDate='" + updateValues.ImpDate + "', CADefineProxy='"+updateValues.CADefineProxy+"' where RAId='" + updateValues.RAId + "' and NCId='" + updateValues.NCId + "' and CAId='" + updateValues.CAId + "'");
                return pool.request().query("UPDATE " + tableName + " set ResponsibleId='" + updateValues.ResponsibleId + "', AccResponsibleId='" + updateValues.AccResponsibleId + "', CADescription=N'" + CADesc + "', ImpDate='" + updateValues.ImpDate + "', CADefineProxy='"+updateValues.CADefineProxy+"' where RAId='" + updateValues.RAId + "' and NCId='" + updateValues.NCId + "' and CAId='" + updateValues.CAId + "'")
            }).then(result => {
                resolve(1);
                sql.close();
            }).catch(err => {
                reject(err)
                sql.close();
            });
        });
    }

    async NCImplementeContent(tableName, updateValues) {
        return new Promise((resolve, reject) => {
            new sql.ConnectionPool(dbConfig).connect().then(pool => {
                var ImpDesc = updateValues.ImpDescription;
                ImpDesc = ImpDesc.replace(/'/g, "''");
                console.log();
                return pool.request().query("UPDATE " + tableName + " set ImpDescription=N'" + ImpDesc + "', ImpOn='" + updateValues.ImpOn + "', ImpBy='" + updateValues.ImpBy + "', ImpProxy='"+updateValues.ImpProxy+"' where RAId='" + updateValues.RAId + "' and NCId='" + updateValues.NCId + "' and CAId='" + updateValues.CAId + "'")
            }).then(result => {
                resolve(1);
                sql.close();
            }).catch(err => {
                reject(err)
                sql.close();
            });
        });
    }

    async NCImplementeImage(tableName, updateValues) {
        return new Promise((resolve, reject) => {
            new sql.ConnectionPool(dbConfig).connect().then(pool => {
                return pool.request().query("UPDATE " + tableName + " set ImpImage=N'" + updateValues.ImpImage + "' where RAId='" + updateValues.RAId + "' and NCId='" + updateValues.NCId + "' and CAId='" + updateValues.CAId + "'")
            }).then(result => {
                resolve(1);
                sql.close();
            }).catch(err => {
                reject(err)
                sql.close();
            });
        });
    }

    async GetUsersList(tableName) {
        let pool = await sql.connect(dbConfig);
        let data = await pool.request()
            .query("select * from " + tableName + " where Status=1 and SuperAdmin!=1 order by FirstName asc");
        pool.close;
        sql.close;
        return data.recordset;
    }

    async RAStatusUpdate(tableName, status, RAId, LocationId) {
        var WhereCond = '';
        if (LocationId != '') {
            WhereCond += " and LocationId='" + LocationId + "'";
        }
        return new Promise((resolve, reject) => {
            new sql.ConnectionPool(dbConfig).connect().then(pool => {
                return pool.request().query("UPDATE " + tableName + " set Status='" + status + "' where RAId='" + RAId + "'" + WhereCond)
            }).then(result => {
                resolve(1);
                sql.close();
            }).catch(err => {
                reject(err)
                sql.close();
            });
        });
    }

    async RASubAuditUpdate(tableName, RAId, AuditSubstitute) {
        return new Promise((resolve, reject) => {
            new sql.ConnectionPool(dbConfig).connect().then(pool => {
                return pool.request().query("UPDATE " + tableName + " set AuditerSubId=" + AuditSubstitute + " where RAId='" + RAId + "'")
            }).then(result => {
                resolve(1);
                sql.close();
            }).catch(err => {
                reject(err)
                sql.close();
            });
        });
    }

    async RACAImplemented(tableName, RAId, CAId, NCId, VrfcDescription, VrfcDate, VerfcProxy) {
        return await new Promise((resolve, reject) => {
            setTimeout(function() {
                sql.connect(dbConfig, function(err) {
                    var request = new sql.Request();
                    VrfcDescription = VrfcDescription.replace(/'/g, "''");
                    let Query = "UPDATE " + tableName + " set CAStatus='1', VrfcDate='" + VrfcDate + "', VrfcDescription=N'" + VrfcDescription + "', VerfcProxy='"+VerfcProxy+"' where RAId='" + RAId + "' and NCId='" + NCId + "' and CAId='" + CAId + "'";
                    request.query(Query, function(err, result) {
                        if (err) {
                            console.log(err);
                            return resolve(0);
                        } else {
                            return resolve(1);
                        }
                    });
                });

            }, 2000);
        })
    }

    async NCCACountCheck(RACATable, RANCListTable, RAId, LocationId) {
        var WhereCond = '';
        if (LocationId != '') {
            WhereCond += " and LocationId='" + LocationId + "'";
        }
        return await new Promise((resolve, reject) => {
            setTimeout(function() {
                sql.connect(dbConfig, function(err) {
                    var requestCA = new sql.Request();
                    console.log("select * from " + RACATable + " where RAId='" + RAId + "'");
                    requestCA.query("select * from " + RACATable + " where RAId='" + RAId + "'", function(err, resultCA) {
                        var RACACount = resultCA['recordset'].length;

                        var requestNC = new sql.Request();
                        console.log("select * from " + RANCListTable + " where RAId='" + RAId + "'" + WhereCond);
                        requestCA.query("select * from " + RANCListTable + " where RAId='" + RAId + "'" + WhereCond, function(err, requestNC) {
                            var RANCCount = requestNC['recordset'].length;
                            if (RACACount == RANCCount) {
                                return resolve(1);
                            } else {
                                return resolve(0);
                            }
                        });
                    });
                });
            }, 2000);
        })
    }

    async NCConfirmCheck(RACATable, RAId, CAId, NCId) {
        return await new Promise((resolve, reject) => {
            setTimeout(function() {
                sql.connect(dbConfig, function(err) {
                    var requestCA = new sql.Request();
                    //console.log("!!!!!");
                    //console.log("select * from "+RACATable+" where RAId='"+RAId+"'");
                    requestCA.query("select * from " + RACATable + " where RAId='" + RAId + "'", function(err, resultCA) {
                        var RACACount = resultCA['recordset'].length;

                        var requestNC = new sql.Request();
                        //console.log("!!!!!!!");
                        //console.log("select * from "+RACATable+" where RAId='"+RAId+"' and CAStatus=1");
                        requestCA.query("select * from " + RACATable + " where RAId='" + RAId + "' and CAStatus=1", function(err, requestNC) {
                            var RAConfirmCount = requestNC['recordset'].length;
                            console.log("##################" + RACACount + " == " + RAConfirmCount);
                            if (RACACount == RAConfirmCount) {
                                return resolve(1);
                            } else {
                                return resolve(0);
                            }
                        });
                    });
                });
            }, 2000);
        })
    }

    async LineCheck(LineResponsibilityTable, Plant, ValueStream, LineName, LocationId) {
        var WhereCond = '';
        if (LocationId != '') {
            WhereCond += " and LocationId='" + LocationId + "'";
        }
        let pool = await sql.connect(dbConfig);
        let data = await pool.request()
            .query("select * from " + LineResponsibilityTable + " where Plant='" + Plant + "' and ValueStream='" + ValueStream + "' and LineName='" + LineName + "' and Status=1" + WhereCond);
        pool.close;
        sql.close;
        return data.recordset;
    }

    async NCDetailMail(NCId) {
        let pool = await sql.connect(dbConfig);
        console.log("select a.*,b.CategoryTitle,c.CETitle,d.MCTitle,f.FirstName,f.LastName,g.*,h.ChecklistName from " + dbTable.RANCList + " as a, " + dbTable.AuditCategory + " as b, " + dbTable.AuditCE + " as c, " + dbTable.AuditMC + " as d " + dbTable.RADetails + " as e, " + dbTable.Users + " as f, " + dbTable.RADetails + " as e, " + dbTable.Users + " as f, " + dbTable.LineResponsibility + " as g, " + dbTable.Checklists + " as h where a.NCId='" + NCId + "' and a.CategoryId=b.CategoryId and a.CEId=c.CEId and a.MCId=d.MCId and a.RAId=e.RAId and e.AuditerId=f.UserId and g.LineId=e.LineId and h.ChecklistId=e.ChecklistId");
        let data = await pool.request()
            .query("select a.*,a.CreatedOn as NCCreateOn,b.CategoryTitle,c.CETitle,d.MCTitle,f.FirstName,f.LastName,g.*,h.ChecklistName from " + dbTable.RANCList + " as a, " + dbTable.AuditCategory + " as b, " + dbTable.AuditCE + " as c, " + dbTable.AuditMC + " as d, " + dbTable.RADetails + " as e, " + dbTable.Users + " as f, " + dbTable.LineResponsibility + " as g, " + dbTable.Checklists + " as h where a.NCId='" + NCId + "' and a.CategoryId=b.CategoryId and a.CEId=c.CEId and a.MCId=d.MCId and a.RAId=e.RAId and e.AuditerId=f.UserId and g.LineId=e.LineId and h.ChecklistId=e.ChecklistId");
        pool.close;
        sql.close;
        return data.recordset;
    }

    async NCAuditeesEmailOld(VSPRENG, VSPRQLENG, MRPCNTRL, PRSFTLD) {
        let pool = await sql.connect(dbConfig);
        console.log("select Email from " + dbTable.Users + " where UserId IN (" + VSPRENG + ", " + VSPRQLENG + ", " + MRPCNTRL + ", " + PRSFTLD + ")");
        let data = await pool.request()
            .query("select Email from " + dbTable.Users + " where UserId IN (" + VSPRENG + ", " + VSPRQLENG + ", " + MRPCNTRL + ", " + PRSFTLD + ")");
        pool.close;
        sql.close;
        return data.recordset;
    }

    async NCAuditeesEmail(Engineers, LocationId) {
        var WhereCond = '';
        if (LocationId != '') {
            WhereCond += " and LocationId='" + LocationId + "'";
        }
        let pool = await sql.connect(dbConfig);
        Engineers = Engineers.slice(0, -1);
        console.log("select Email from " + dbTable.Users + " where UserId IN (" + Engineers + ")" + WhereCond);
        let data = await pool.request()
            .query("select Email from " + dbTable.Users + " where UserId IN (" + Engineers + ")" + WhereCond);
        pool.close;
        sql.close;
        return data.recordset;
    }

    async NCAuditeesDeviceToken(Engineers) {
        let pool = await sql.connect(dbConfig);
        Engineers = Engineers.slice(0, -1);
        console.log("select UserToken from " + dbTable.UsersToken + " where UserId IN (" + Engineers + ")");
        let data = await pool.request()
            .query("select UserToken from " + dbTable.UsersToken + " where UserId IN (" + Engineers + ")");
        pool.close;
        sql.close;
        return data.recordset;
    }

    async NCReassignAuditeesEmailOld(VSPRENG, VSPRQLENG, MRPCNTRL, PRSFTLD, VSPRLD, VSPRQLLD, VSLGSLD) {
        let pool = await sql.connect(dbConfig);
        console.log("select Email from " + dbTable.Users + " where UserId IN (" + VSPRENG + ", " + VSPRQLENG + ", " + MRPCNTRL + ", " + PRSFTLD + ", " + VSPRLD + ", " + VSPRQLLD + ", " + VSLGSLD + ")");
        let data = await pool.request()
            .query("select Email from " + dbTable.Users + " where UserId IN (" + VSPRENG + ", " + VSPRQLENG + ", " + MRPCNTRL + ", " + PRSFTLD + ", " + VSPRLD + ", " + VSPRQLLD + ", " + VSLGSLD + ")");
        pool.close;
        sql.close;
        return data.recordset;
    }

    async NCReassignAuditeesEmail(Engineers, Leaders, LocationId) {
        var WhereCond = '';
        if (LocationId != '') {
            WhereCond += " and LocationId='" + LocationId + "'";
        }
        let pool = await sql.connect(dbConfig);
		console.log("engineers"+Engineers);
		console.log("leaders"+Leaders);
        var LineUsers = Engineers + Leaders;
		LineUsers = LineUsers.replace(/[,,]+/g, ",").trim();
        LineUsers = LineUsers.slice(0, -1);
		LineUsers = LineUsers.substring(1);
        console.log("select Email from " + dbTable.Users + " where UserId IN (" + LineUsers + ")" + WhereCond);
        let data = await pool.request()
            .query("select Email from " + dbTable.Users + " where UserId IN (" + LineUsers + ")" + WhereCond);
        pool.close;
        sql.close;
        return data.recordset;
    }

    async NCResponsibleEmail(ResponsibleId, LocationId) {
        var WhereCond = '';
        if (LocationId != '') {
            WhereCond += " and LocationId='" + LocationId + "'";
        }
        let pool = await sql.connect(dbConfig);
        let data = await pool.request()
            .query("select Email, FirstName, LastName from " + dbTable.Users + " where UserId=" + ResponsibleId + WhereCond);
        pool.close;
        sql.close;
        return data.recordset;
    }

    async NCResponsibleDevicToken(ResponsibleId) {
        let pool = await sql.connect(dbConfig);
        let data = await pool.request()
            .query("select * from " + dbTable.UsersToken + " where UserId=" + ResponsibleId);
        pool.close;
        sql.close;
        return data.recordset;
    }

    async NCCADetailMail(NCId, LocationId) {
        var WhereCond = '';
        if (LocationId != '') {
            WhereCond += " and a.LocationId='" + LocationId + "'";
        }
        let pool = await sql.connect(dbConfig);
        var Query = "select e.AuditerId,a.*,a.CreatedOn as NCCreateOn,b.CategoryTitle,c.CETitle,d.MCTitle,f.FirstName,f.LastName,j.FirstName as ResFirstName,j.LastName as ResLastName,g.*,h.ChecklistName,i.ResponsibleId,i.CADescription,i.ImpDate,i.ImpDescription from " + dbTable.AuditCategory + " as b, " + dbTable.RADetails + " as e, " + dbTable.Users + " as f, " + dbTable.LineResponsibility + " as g, " + dbTable.Checklists + " as h, " + dbTable.RACA + " as i, " + dbTable.Users + " as j," + dbTable.RANCList + " as a left join " + dbTable.AuditMC + " as d ON a.MCId=d.MCId left join " + dbTable.AuditCE + " as c ON a.CEId=c.CEId where a.NCId='" + NCId + "' and a.CategoryId=b.CategoryId and a.RAId=e.RAId and e.AuditerId=f.UserId and g.LineId=e.LineId and h.ChecklistId=e.ChecklistId and a.NCId=i.NCId and j.UserId=i.ResponsibleId" + WhereCond;
        console.log(Query);
        let data = await pool.request()
            .query(Query);
        pool.close;
        sql.close;
        return data.recordset;
    }

    async NCVerifyMail(NCId, LocationId) {
        var WhereCond = '';
        if (LocationId != '') {
            WhereCond += " and a.LocationId='" + LocationId + "'";
        }
        let pool = await sql.connect(dbConfig);
        var Query = "select a.*,a.CreatedOn as NCCreateOn,b.CategoryTitle,c.CETitle,d.MCTitle,f.FirstName,f.LastName,g.*,i.ResponsibleId,i.CADescription,i.ImpDate,i.VrfcDescription,i.NCReassCommands from " + dbTable.AuditCategory + " as b, " + dbTable.RADetails + " as e, " + dbTable.Users + " as f, " + dbTable.LineResponsibility + " as g, " + dbTable.RACA + " as i, " + dbTable.RANCList + " as a left join " + dbTable.AuditCE + " as c ON a.CEId=c.CEId left join " + dbTable.AuditMC + " as d ON a.MCId=d.MCId  where a.NCId='" + NCId + "' and a.CategoryId=b.CategoryId and a.RAId=e.RAId and e.AuditerId=f.UserId and g.LineId=e.LineId and a.NCId=i.NCId" + WhereCond;
        console.log(Query);
        let data = await pool.request()
            .query(Query);
        pool.close;
        sql.close;
        return data.recordset;
    }

    async NCReassignMail(NCId, LocationId) {
        var WhereCond = '';
        if (LocationId != '') {
            WhereCond += " and a.LocationId='" + LocationId + "'";
        }
        let pool = await sql.connect(dbConfig);
        var Query = "select a.*,a.CreatedOn as NCCreateOn,b.CategoryTitle,c.CETitle,d.MCTitle,f.FirstName,f.LastName,g.*,i.ResponsibleId,i.CADescription,i.ImpDate,i.VrfcDescription,i.NCReassCommands from " + dbTable.AuditCategory + " as b, " + dbTable.RADetails + " as e, " + dbTable.Users + " as f, " + dbTable.LineResponsibility + " as g, " + dbTable.RACA + " as i, " + dbTable.RANCList + " as a left join " + dbTable.AuditCE + " as c ON a.CEId=c.CEId left join " + dbTable.AuditMC + " as d ON a.MCId=d.MCId where a.NCId='" + NCId + "' and a.CategoryId=b.CategoryId and a.RAId=e.RAId and e.AuditerId=f.UserId and g.LineId=e.LineId and a.NCId=i.NCId" + WhereCond;
        console.log(Query);
        let data = await pool.request()
            .query(Query);
        pool.close;
        sql.close;
        return data.recordset;
    }


	  async ReassignNCImage(tableName, updateValues) {
        return new Promise((resolve, reject) => {
            new sql.ConnectionPool(dbConfig).connect().then(pool => {
                return pool.request().query("UPDATE " + tableName + " set NCReassImage='" + updateValues.NCReassImage + "' where RAId='" + updateValues.RAId + "' and NCId='" + updateValues.NCId + "' and CAId='" + updateValues.CAId + "'")
            }).then(result => {
                resolve(1);
                sql.close();
            }).catch(err => {
                reject(err)
                sql.close();
            });
        });
    }
	
    async GetEmailTemplate(TempSlug) {
        let pool = await sql.connect(dbConfig);
        //console.log("select EmailTempSubject, EmailTempBody from "+dbTable.EmailTemplate+" where EmailTempSlug='"+TempSlug+"' and Status=1");
        let data = await pool.request()
            .query("select EmailTempSubject, EmailTempBody from " + dbTable.EmailTemplate + " where EmailTempSlug='" + TempSlug + "' and Status=1");
        pool.close;
        sql.close;
        return data.recordset;
    }

    async GetActiveNCHomeOld(Auditer, UserId) {
        let pool = await sql.connect(dbConfig);
        var query = '';
        if (Auditer == 0) {
            var UserId = UserId;
            //query = "select j.ChecklistSlug,j.ChecklistType,i.UserId,i.FirstName as AuditerFirstName,i.LastName as AuditerLastName,a.*,b.CategoryTitle,c.CETitle,d.MCTitle,e.CAId,e.ResponsibleId,e.CADescription,e.ImpDate,e.CAStatus,e.VrfcDate,e.VrfcDescription,e.CreatedBy as CACreated,e.NCReassCommands,e.ImpImage,e.ImpDescription,e.NCReassOn,e.NCReassImage,e.ImpOn,e.ImpBy,f.FirstName,f.LastName,h.Plant as LPlant,h.ValueStream as LValueStream,h.LineName as LLineName from " + dbTable.Checklists + " as j," + dbTable.Users + " as i," + dbTable.LineResponsibility + " as h," + dbTable.RADetails + " as g," + dbTable.AuditCategory + " as b, " + dbTable.AuditCE + " as c, " + dbTable.AuditMC + " as d, " + dbTable.RANCList + " as a left join " + dbTable.RACA + " as e ON e.NCId=a.NCId  left join " + dbTable.Users + " as f ON e.ResponsibleId=f.UserId  where ((h.Engineers like '%" + UserId + "%') or (e.ResponsibleId='" + UserId + "')) and h.LineId=g.LineId and g.ChecklistId=j.ChecklistId and g.AuditerId=i.UserId and a.RAId=g.RAId and a.NCStatus IN (1,2,3,5) and a.CategoryId=b.CategoryId and a.CEId=c.CEId and a.MCId=d.MCId order by a.NCId desc";
			query = "select j.ChecklistSlug,j.ChecklistType,i.UserId,i.FirstName as AuditerFirstName,i.LastName as AuditerLastName,a.*,b.CategoryTitle,c.CETitle,d.MCTitle,e.CAId,e.ResponsibleId,e.CADescription,e.ImpDate,e.CAStatus,e.VrfcDate,e.VrfcDescription,e.CreatedBy as CACreated,e.NCReassCommands,e.ImpImage,e.ImpDescription,e.NCReassOn,e.NCReassImage,e.ImpOn,e.ImpBy,f.FirstName,f.LastName,h.Plant as LPlant,h.ValueStream as LValueStream,h.LineName as LLineName from "+dbTable.Checklists+" as j,"+dbTable.Users+" as i,"+dbTable.LineResponsibility+" as h,"+dbTable.RADetails+" as g,"+dbTable.AuditCategory+" as b, "+dbTable.AuditCE+" as c, "+dbTable.AuditMC+" as d, "+dbTable.RANCList+" as a left join "+dbTable.RACA+" as e ON e.NCId=a.NCId  left join "+dbTable.Users+" as f ON e.ResponsibleId=f.UserId left join "+dbTable.Proxy+" as k ON k.UserId="+UserId+" and k.Status=1  where ((h.Engineers like '%"+UserId+"%') or (e.ResponsibleId like '%"+UserId+"%') or k.LineId=h.LineId) and h.LineId=g.LineId and g.ChecklistId=j.ChecklistId and g.AuditerId=i.UserId and a.RAId=g.RAId and a.NCStatus IN (1,2,3,5) and a.CategoryId=b.CategoryId and a.CEId=c.CEId and a.MCId=d.MCId order by a.NCId desc";
        } else if (Auditer == 1) {
            //query = "select j.ChecklistSlug,j.ChecklistType,i.UserId,i.FirstName as AuditerFirstName,i.LastName as AuditerLastName,a.*,b.CategoryTitle,c.CETitle,d.MCTitle,e.CAId,e.ResponsibleId,e.CADescription,e.ImpDate,e.CAStatus,e.VrfcDate,e.VrfcDescription,e.CreatedBy as CACreated,e.NCReassCommands,e.ImpImage,e.ImpDescription,e.NCReassOn,e.NCReassImage,e.ImpOn,e.ImpBy,f.FirstName,f.LastName,h.Plant as LPlant,h.ValueStream as LValueStream,h.LineName as LLineName from " + dbTable.Checklists + " as j," + dbTable.Users + " as i," + dbTable.LineResponsibility + " as h," + dbTable.RADetails + " as g," + dbTable.AuditCategory + " as b, " + dbTable.AuditCE + " as c, " + dbTable.AuditMC + " as d, " + dbTable.RANCList + " as a left join " + dbTable.RACA + " as e ON e.NCId=a.NCId  left join " + dbTable.Users + " as f ON e.ResponsibleId=f.UserId  where (g.AuditerId='" + UserId + "' or e.ResponsibleId='" + UserId + "') and h.LineId=g.LineId and g.ChecklistId=j.ChecklistId and g.AuditerId=i.UserId and a.RAId=g.RAId and a.NCStatus IN (1,2,3,5) and a.CategoryId=b.CategoryId and a.CEId=c.CEId and a.MCId=d.MCId order by a.NCId desc";
			query = "select j.ChecklistSlug,j.ChecklistType,i.UserId,i.FirstName as AuditerFirstName,i.LastName as AuditerLastName,a.*,b.CategoryTitle,c.CETitle,d.MCTitle,e.CAId,e.ResponsibleId,e.CADescription,e.ImpDate,e.CAStatus,e.VrfcDate,e.VrfcDescription,e.CreatedBy as CACreated,e.NCReassCommands,e.ImpImage,e.ImpDescription,e.NCReassOn,e.NCReassImage,e.ImpOn,e.ImpBy,f.FirstName,f.LastName,h.Plant as LPlant,h.ValueStream as LValueStream,h.LineName as LLineName from "+dbTable.Checklists+" as j,"+dbTable.Users+" as i,"+dbTable.LineResponsibility+" as h,"+dbTable.RADetails+" as g,"+dbTable.AuditCategory+" as b, "+dbTable.AuditCE+" as c, "+dbTable.AuditMC+" as d, "+dbTable.RANCList+" as a left join "+dbTable.RACA+" as e ON e.NCId=a.NCId  left join "+dbTable.Users+" as f ON e.ResponsibleId=f.UserId left join "+dbTable.Proxy+" as k ON k.UserId="+UserId+" and k.Status=1  where (g.AuditerId="+UserId+" or e.ResponsibleId="+UserId+" or k.LineId=h.LineId) and h.LineId=g.LineId and g.ChecklistId=j.ChecklistId and g.AuditerId=i.UserId and a.RAId=g.RAId and a.NCStatus IN (1,2,3,5) and a.CategoryId=b.CategoryId and a.CEId=c.CEId and a.MCId=d.MCId order by a.NCId desc";
        }
        //console.log(Auditer+"#################");
        //console.log(query);

        let data = await pool.request()
            .query(query);
        pool.close;
        sql.close;
        return data.recordset;
    }

    async GetActiveNCHomeTest(Auditer, UserId, RecordStarting, PerPageRecords) {
        let pool = await sql.connect(dbConfig);
        var query = '';
        if (Auditer == 0) {
            var UserId = UserId;
            query = "select j.ChecklistSlug,j.ChecklistType,i.UserId,i.FirstName as AuditerFirstName,i.LastName as AuditerLastName,a.*,b.CategoryTitle,c.CETitle,d.MCTitle,e.CAId,e.ResponsibleId,e.CADescription,e.ImpDate,e.CAStatus,e.VrfcDate,e.VrfcDescription,e.CreatedBy as CACreated,e.NCReassCommands,e.ImpImage,e.ImpDescription,e.NCReassOn,e.NCReassImage,e.ImpOn,e.ImpBy,f.FirstName,f.LastName,h.Plant as LPlant,h.ValueStream as LValueStream,h.LineName as LLineName from " + dbTable.Checklists + " as j," + dbTable.Users + " as i," + dbTable.LineResponsibility + " as h," + dbTable.RADetails + " as g," + dbTable.AuditCategory + " as b, " + dbTable.AuditCE + " as c, " + dbTable.AuditMC + " as d, " + dbTable.RANCList + " as a left join " + dbTable.RACA + " as e ON e.NCId=a.NCId  left join " + dbTable.Users + " as f ON e.ResponsibleId=f.UserId  where ((h.Engineers like '%" + UserId + "%') or (e.ResponsibleId='" + UserId + "')) and h.LineId=g.LineId and g.ChecklistId=j.ChecklistId and g.AuditerId=i.UserId and a.RAId=g.RAId and a.NCStatus IN (1,2,3,5) and a.CategoryId=b.CategoryId and a.CEId=c.CEId and a.MCId=d.MCId order by a.NCId desc  OFFSET " + RecordStarting + " ROWS FETCH NEXT " + PerPageRecords + " ROWS ONLY";
            //  OFFSET "+RecordStarting+" ROWS FETCH NEXT "+PerPageRecords+" ROWS ONLY
        } else if (Auditer == 1) {
            query = "select j.ChecklistSlug,j.ChecklistType,i.UserId,i.FirstName as AuditerFirstName,i.LastName as AuditerLastName,a.*,b.CategoryTitle,c.CETitle,d.MCTitle,e.CAId,e.ResponsibleId,e.CADescription,e.ImpDate,e.CAStatus,e.VrfcDate,e.VrfcDescription,e.CreatedBy as CACreated,e.NCReassCommands,e.ImpImage,e.ImpDescription,e.NCReassOn,e.NCReassImage,e.ImpOn,e.ImpBy,f.FirstName,f.LastName,h.Plant as LPlant,h.ValueStream as LValueStream,h.LineName as LLineName from " + dbTable.Checklists + " as j," + dbTable.Users + " as i," + dbTable.LineResponsibility + " as h," + dbTable.RADetails + " as g," + dbTable.AuditCategory + " as b, " + dbTable.AuditCE + " as c, " + dbTable.AuditMC + " as d, " + dbTable.RANCList + " as a left join " + dbTable.RACA + " as e ON e.NCId=a.NCId  left join " + dbTable.Users + " as f ON e.ResponsibleId=f.UserId  where (g.AuditerId='" + UserId + "' or e.ResponsibleId='" + UserId + "') and h.LineId=g.LineId and g.ChecklistId=j.ChecklistId and g.AuditerId=i.UserId and a.RAId=g.RAId and a.NCStatus IN (1,2,3,5) and a.CategoryId=b.CategoryId and a.CEId=c.CEId and a.MCId=d.MCId order by a.NCId desc  OFFSET " + RecordStarting + " ROWS FETCH NEXT " + PerPageRecords + " ROWS ONLY";
            //  OFFSET "+RecordStarting+" ROWS FETCH NEXT "+PerPageRecords+" ROWS ONLY
        }
        //console.log(Auditer+"#################");
        //console.log(query);

        let data = await pool.request()
            .query(query);
        pool.close;
        sql.close;
        return data.recordset;
    }

    async GetActiveNCHome(Auditer, UserId, RecordStarting, PerPageRecords, NCCreatedStart, NCCreatedEnd, NCStatus, AuditerId, Responsible, Plant, ValueStream, LineName, Checklist, LocationId) {
        // , Plant, ValueStream, LineName, Checklist 
        let pool = await sql.connect(dbConfig);
        var query = '';

        var WhereFilter = "";
        if (NCCreatedStart != '' && NCCreatedEnd != '') {
            WhereFilter += "and CAST(a.CreatedOn AS DATE) >= '" + NCCreatedStart + "' and CAST(a.CreatedOn AS DATE) <= '" + NCCreatedEnd + "'";
        }
        if (NCStatus != '') {
			if(NCStatus == 6) {
				WhereFilter += " and ((a.NCStatus=1 and DATEDIFF(day,a.CreatedOn,getdate())>5) or (a.NCStatus=2 and DATEDIFF(day,e.ImpDate,getdate())>1))";
			} else {
				WhereFilter += " and a.NCStatus IN (" + NCStatus + ")"; 
			}
		} else {
            WhereFilter += " and a.NCStatus IN (1,2,3,5)";
        }
        if (AuditerId != '') { WhereFilter += " and g.AuditerId=" + AuditerId; }
        if (Responsible != '') { WhereFilter += " and e.ResponsibleId=" + Responsible; }
        if (Plant != '') { WhereFilter += " and h.Plant='" + Plant + "'"; }
        if (ValueStream != '') { WhereFilter += " and h.ValueStream='" + ValueStream + "'"; }
        if (LineName != '') { WhereFilter += " and h.LineName='" + LineName + "'"; }
        if (Checklist != '') { WhereFilter += " and j.ChecklistId=" + Checklist; }
        if (LocationId != '') {
            WhereFilter += " and a.LocationId='" + LocationId + "'";
        }
        if (Auditer == 0) {
            var UserId = UserId;

            //query = "select j.ChecklistSlug,j.ChecklistType,i.UserId,i.FirstName as AuditerFirstName,i.LastName as AuditerLastName,a.*,b.CategoryTitle,c.CETitle,d.MCTitle,e.CAId,e.ResponsibleId,e.CADescription,e.ImpDate,e.CAStatus,e.VrfcDate,e.VrfcDescription,e.CreatedBy as CACreated,e.NCReassCommands,e.ImpImage,e.ImpDescription,e.NCReassOn,e.NCReassImage,e.ImpOn,e.ImpBy,f.FirstName,f.LastName,h.Plant as LPlant,h.ValueStream as LValueStream,h.LineName as LLineName from " + dbTable.Checklists + " as j," + dbTable.Users + " as i," + dbTable.LineResponsibility + " as h," + dbTable.RADetails + " as g," + dbTable.AuditCategory + " as b, " + dbTable.RANCList + " as a left join " + dbTable.AuditCE + " as c ON a.CEId=c.CEId left join " + dbTable.AuditMC + " as d ON a.MCId=d.MCId left join " + dbTable.RACA + " as e ON e.NCId=a.NCId  left join " + dbTable.Users + " as f ON e.ResponsibleId=f.UserId where ((h.Engineers like '%," + UserId + ",%') or (h.Leaders like '%," + UserId + ",%') or (e.ResponsibleId='" + UserId + "') or (g.AuditerSubId='" + UserId + "')) and h.LineId=g.LineId and g.ChecklistId=j.ChecklistId and g.AuditerId=i.UserId and a.RAId=g.RAId and a.CategoryId=b.CategoryId " + WhereFilter + " order by a.NCId desc OFFSET " + RecordStarting + " ROWS FETCH NEXT " + PerPageRecords + " ROWS ONLY";
			query = "select j.ChecklistSlug,j.ChecklistType,i.UserId,i.FirstName as AuditerFirstName,i.LastName as AuditerLastName,a.*,b.CategoryTitle,c.CETitle,d.MCTitle,e.CAId,e.ResponsibleId,e.CADescription,e.ImpDate,e.CAStatus,e.VrfcDate,e.VrfcDescription,e.CreatedBy as CACreated,e.NCReassCommands,e.ImpImage,e.ImpDescription,e.NCReassOn,e.NCReassImage,e.ImpOn,e.ImpBy,f.FirstName,f.LastName,h.Plant as LPlant,h.ValueStream as LValueStream,h.LineName as LLineName,l.FirstName as CADePrFName,l.LastName as CADePrLName,m.FirstName as ImPrFName,m.LastName as ImPrLName,n.FirstName as RePrFName,n.LastName as RePrLName,o.FirstName as VerPrFName,o.LastName as VerPrLName,k.ProxyId from " + dbTable.Checklists + " as j," + dbTable.Users + " as i," + dbTable.LineResponsibility + " as h," + dbTable.RADetails + " as g," + dbTable.AuditCategory + " as b, " + dbTable.RANCList + " as a left join " + dbTable.AuditCE + " as c ON a.CEId=c.CEId left join " + dbTable.AuditMC + " as d ON a.MCId=d.MCId left join " + dbTable.RACA + " as e ON e.NCId=a.NCId  left join " + dbTable.Users + " as f ON e.ResponsibleId=f.UserId left join "+dbTable.Proxy+" as k ON k.UserId="+UserId+" and k.Auditor=0 and k.Status=1 and k.LocationId="+LocationId+" left join "+dbTable.Users+" as l ON e.CADefineProxy=l.UserId left join "+dbTable.Users+" as m ON e.ImpProxy=m.UserId left join "+dbTable.Users+" as n ON e.ReassignProxy=n.UserId left join "+dbTable.Users+" as o ON e.VerfcProxy=o.UserId where ((h.Engineers like '%," + UserId + ",%') or (h.Leaders like '%," + UserId + ",%') or (e.ResponsibleId='" + UserId + "') or (g.AuditerSubId='" + UserId + "') or k.LineId=h.LineId) and h.LineId=g.LineId and g.ChecklistId=j.ChecklistId and g.AuditerId=i.UserId and a.RAId=g.RAId and a.CategoryId=b.CategoryId " + WhereFilter + " order by a.NCId desc OFFSET " + RecordStarting + " ROWS FETCH NEXT " + PerPageRecords + " ROWS ONLY";
			
        } else if (Auditer == 1) {

            //query = "select j.ChecklistSlug,j.ChecklistType,i.UserId,i.FirstName as AuditerFirstName,i.LastName as AuditerLastName,a.*,b.CategoryTitle,c.CETitle,d.MCTitle,e.CAId,e.ResponsibleId,e.CADescription,e.ImpDate,e.CAStatus,e.VrfcDate,e.VrfcDescription,e.CreatedBy as CACreated,e.NCReassCommands,e.ImpImage,e.ImpDescription,e.NCReassOn,e.NCReassImage,e.ImpOn,e.ImpBy,f.FirstName,f.LastName,h.Plant as LPlant,h.ValueStream as LValueStream,h.LineName as LLineName from " + dbTable.Checklists + " as j," + dbTable.Users + " as i," + dbTable.LineResponsibility + " as h," + dbTable.RADetails + " as g," + dbTable.AuditCategory + " as b, " + dbTable.RANCList + " as a left join " + dbTable.AuditCE + " as c ON a.CEId=c.CEId left join " + dbTable.AuditMC + " as d ON a.MCId=d.MCId left join " + dbTable.RACA + " as e ON e.NCId=a.NCId  left join " + dbTable.Users + " as f ON e.ResponsibleId=f.UserId left join " + dbTable.RADetails + " as l ON l.AuditerSubId=" + UserId + " where ((g.AuditerId='" + UserId + "') or (e.ResponsibleId='" + UserId + "')) and h.LineId=g.LineId and g.ChecklistId=j.ChecklistId and g.AuditerId=i.UserId and a.RAId=g.RAId and a.CategoryId=b.CategoryId  " + WhereFilter + " order by a.NCId desc OFFSET " + RecordStarting + " ROWS FETCH NEXT " + PerPageRecords + " ROWS ONLY";
           query = "select j.ChecklistSlug,j.ChecklistType,i.UserId,i.FirstName as AuditerFirstName,i.LastName as AuditerLastName,a.*,b.CategoryTitle,c.CETitle,d.MCTitle,e.CAId,e.ResponsibleId,e.CADescription,e.ImpDate,e.CAStatus,e.VrfcDate,e.VrfcDescription,e.CreatedBy as CACreated,e.NCReassCommands,e.ImpImage,e.ImpDescription,e.NCReassOn,e.NCReassImage,e.ImpOn,e.ImpBy,f.FirstName,f.LastName,h.Plant as LPlant,h.ValueStream as LValueStream,h.LineName as LLineName, m.FirstName as ProxyAuditorFirstName, m.LastName as ProxyAuditorLastName,o.FirstName as CADePrFName,o.LastName as CADePrLName,p.FirstName as ImPrFName,p.LastName as ImPrLName,q.FirstName as RePrFName,q.LastName as RePrLName,r.FirstName as VerPrFName,r.LastName as VerPrLName,k.ProxyId,g.AuditerId from " + dbTable.Checklists + " as j," + dbTable.Users + " as i," + dbTable.LineResponsibility + " as h," + dbTable.RADetails + " as g," + dbTable.AuditCategory + " as b, " + dbTable.RANCList + " as a left join " + dbTable.AuditCE + " as c ON a.CEId=c.CEId left join " + dbTable.AuditMC + " as d ON a.MCId=d.MCId left join " + dbTable.RACA + " as e ON e.NCId=a.NCId  left join " + dbTable.Users + " as f ON e.ResponsibleId=f.UserId left join " + dbTable.RADetails + " as l ON l.AuditerSubId=" + UserId + " left join "+dbTable.Proxy+" as k ON k.UserId="+UserId+" and k.Status=1 and k.Auditor=1 and k.LocationId="+LocationId+" left join "+dbTable.Users+" as m ON a.ProxyUser=m.UserId left join "+dbTable.Users+" as o ON e.CADefineProxy=o.UserId left join "+dbTable.Users+" as p ON e.ImpProxy=p.UserId left join "+dbTable.Users+" as q ON e.ReassignProxy=q.UserId left join "+dbTable.Users+" as r ON e.VerfcProxy=r.UserId where ((g.AuditerId='" + UserId + "') or (e.ResponsibleId='" + UserId + "') or k.LineId=h.LineId) and h.LineId=g.LineId and g.ChecklistId=j.ChecklistId and g.AuditerId=i.UserId and a.RAId=g.RAId and a.CategoryId=b.CategoryId  " + WhereFilter + " order by a.NCId desc OFFSET " + RecordStarting + " ROWS FETCH NEXT " + PerPageRecords + " ROWS ONLY";
        }
        console.log(RecordStarting + "#################");
        console.log(query);

        let data = await pool.request()
            .query(query);
        pool.close;
        sql.close;
        return data.recordset;
    }

    async GetActiveNCForAuditor(LineId, LocationId) {
        var WhereCond = '';
        if (LocationId != '') {
            WhereCond += " and a.LocationId='" + LocationId + "'";
        }
        let pool = await sql.connect(dbConfig);
        var query = "select j.ChecklistSlug,j.ChecklistType,i.UserId,i.FirstName as AuditerFirstName,i.LastName as AuditerLastName,a.*,b.CategoryTitle,c.CETitle,d.MCTitle,e.CAId,e.ResponsibleId,e.CADescription,e.ImpDate,e.CAStatus,e.VrfcDate,e.VrfcDescription,e.CreatedBy as CACreated,e.NCReassCommands,e.ImpImage,e.ImpDescription,e.NCReassOn,e.NCReassImage,e.ImpOn,e.ImpBy,f.FirstName,f.LastName,h.Plant as LPlant,h.ValueStream as LValueStream,h.LineName as LLineName,h.LineId as LLineId from dbo.Checklists as j,dbo.Users as i,dbo.LineResponsibility as h,dbo.RADetails as g,dbo.AuditCategory as b, dbo.RANCList as a left join dbo.AuditCE as c ON a.CEId=c.CEId left join dbo.AuditMC as d ON a.MCId=d.MCId left join dbo.RACA as e ON e.NCId=a.NCId  left join dbo.Users as f ON e.ResponsibleId=f.UserId  where g.LineId='" + LineId + "' and h.LineId='" + LineId + "' and h.LineId=g.LineId and g.ChecklistId=j.ChecklistId and g.AuditerId=i.UserId and a.RAId=g.RAId and a.NCStatus IN (1,2,3,5) and a.CategoryId=b.CategoryId" + WhereCond + " order by a.NCId desc";
        console.log(query);
        let data = await pool.request()
            .query(query);
        pool.close;
        sql.close;
        return data.recordset;
    }

    async GetInprogressAudit(UserId, LocationId) {
        var WhereCond = '';
        if (LocationId != '') {
            WhereCond += " and a.LocationId='" + LocationId + "'";
        }
        let pool = await sql.connect(dbConfig);
        var Query = "select a.*,b.ChecklistName,b.ChecklistSlug,b.ChecklistType,c.Plant as PlantName, c.ValueStream as ValueStreamName, c.LineName, d.FirstName as AuditerFirstName,d.LastName as AuditerLastName,e.CreatedBy as ActualAuditor from " + dbTable.Checklists + " as b, " + dbTable.LineResponsibility + " as c, " + dbTable.Users + " as d, " + dbTable.RADetails + " as a left join "+dbTable.Proxy+" as e ON a.LineId=e.LineId and e.Status=1 where (a.AuditerId='" + UserId + "' or a.AuditerId=e.CreatedBy) and a.ChecklistId=b.ChecklistId and a.LineId=c.LineId and a.AuditerId=d.UserId and a.Status=1" + WhereCond + " order by a.RAId desc";
		console.log(Query);
        let data = await pool.request()
            .query(Query);
        pool.close;
        sql.close;
        return data.recordset;
    }

    async GetResponsiblePerson(searchName, LocationCode) {
        var config = { user: 'feedback', password: 'feedback', server: 'WDEGSSQLT2', database: 'WABCO_FEEDBACK' };
        var whereCondition = '';
        if (searchName != '') {
            whereCondition += " AND NAME like '%" + searchName + "%'";
        }
        if (LocationCode != '') {
            whereCondition += " AND LOCATION like '%" + LocationCode + "%'";
        }
        return new Promise((resolve, reject) => {
            new sql.ConnectionPool(config).connect().then(pool => {
                return pool.request().query("select EMPLID, NAME, FIRST_NAME, LAST_NAME, LOCATION, AM_DOMAIN_ID, EMAIL_ADDR from [dbo].[EMPDETAILS_WORKDAY] where HR_STATUS='A'" + whereCondition)
            }).then(result => {
                resolve(result['recordset']);
                sql.close();
            }).catch(err => {
                reject(err)
                sql.close();
            });
        });
    }

    async GetLineDetails(Plant, ValueStream, LineName) {
        let pool = await sql.connect(dbConfig);
        let data = await pool.request()
            .query("select * from " + dbTable.LineResponsibility + " where Plant='" + Plant + "' and ValueStream='" + ValueStream + "' and LineName='" + LineName + "'");
        pool.close;
        sql.close;
        return data.recordset;
    }

    async GetHrStatus(username) {

        var config = { user: 'feedback', password: 'feedback', server: 'WDEGSSQLT2', database: 'WABCO_FEEDBACK' };
        var whereCondition = '';
        if (username != '') {
            whereCondition = " AND AM_DOMAIN_ID='" + username + "'";
        }
        return new Promise((resolve, reject) => {
            new sql.ConnectionPool(config).connect().then(pool => {
                return pool.request().query("select * from [dbo].[EMPDETAILS_WORKDAY] where HR_STATUS='A'" + whereCondition)
            }).then(result => {
                resolve(result['recordset']);
                sql.close();
            }).catch(err => {
                reject(err)
                sql.close();
            });
        });
    }

    async CheckUserDevice(tableName, DeviceToken, Device, UserId) {
        let pool = await sql.connect(dbConfig);
        console.log("SELECT * FROM " + tableName + " WHERE CONVERT(VARCHAR, UserToken)='" + DeviceToken + "' and UserDevice='" + Device + "' and UserId='" + UserId + "'");
        let data = await pool.request()
            .query("SELECT * FROM " + tableName + " WHERE CONVERT(VARCHAR, UserToken)='" + DeviceToken + "' and UserDevice='" + Device + "' and UserId='" + UserId + "'");
        pool.close;
        sql.close;
        return data.recordset;
    }

    //////////////////////////////////////////////////////////////////////////////////////

    async CheckUserDeviceRegistered(tableName, DeviceToken, Device, UserId) {
        let pool = await sql.connect(dbConfig);
        console.log("SELECT * FROM " + tableName + " WHERE CONVERT(VARCHAR, UserToken)<>'" + DeviceToken + "' and UserDevice='" + Device + "' and UserId='" + UserId + "'");
        let data = await pool.request()
            .query("SELECT * FROM " + tableName + " WHERE CONVERT(VARCHAR, UserToken)<>'" + DeviceToken + "' and UserDevice='" + Device + "' and UserId='" + UserId + "'");
        pool.close;
        sql.close;
        return data.recordset;
    }

    //////////////////////////////////////////////////////////////////////////////////////

    async UserDeviceUpdate(tableName, DeviceToken, Device, UserId, TodayDate) {
        return new Promise((resolve, reject) => {
            new sql.ConnectionPool(dbConfig).connect().then(pool => {
                console.log("update " + tableName + " set UserToken='" + DeviceToken + "', UpdatedOn='" + TodayDate + "' where UserDevice='" + Device + "' and UserId='" + UserId + "'");
                return pool.request().query("update " + tableName + " set UserToken='" + DeviceToken + "', UpdatedOn='" + TodayDate + "' where UserDevice='" + Device + "' and UserId='" + UserId + "'")
            }).then(result => {
                resolve(1);
                sql.close();
            }).catch(err => {
                reject(err)
                sql.close();
            });
        });
    }

    ////////////////////////////////////////////////////////////////////////////////////

    async UserDeviceInsert(tableName, DeviceToken, Device, UserId, TodayDate) {
        return new Promise((resolve, reject) => {
            new sql.ConnectionPool(dbConfig).connect().then(pool => {
                console.log("insert into " + tableName + " (UserId, UserToken, UserDevice, CreatedOn) values ('" + UserId + "', '" + DeviceToken + "', '" + Device + "', '" + TodayDate + "')");
                return pool.request().query("insert into " + tableName + " (UserId, UserToken, UserDevice, CreatedOn) values ('" + UserId + "', '" + DeviceToken + "', '" + Device + "', '" + TodayDate + "')")
            }).then(result => {
                resolve(1);
                sql.close();
            }).catch(err => {
                reject(err)
                sql.close();
            });
        });
    }

    async GetNCDetailsMail(NCId, GetNCDetailsMail) {
        var WhereCond = '';
        if (LocationId != '') {
            WhereCond += " and b.LocationId='" + LocationId + "'";
        }
        let pool = await sql.connect(dbConfig);
        console.log("select b.*,c.LineName,c.Engineers,d.FirstName,d.LastName from [dbo].[RADetails] as a, [dbo].[RANCList] as b, [dbo].[LineResponsibility] as c, [dbo].[Users] as d where b.NCId=" + NCId + " and a.RAId=b.RAId and a.LineId=c.LineId and a.AuditerId=d.UserId" + WhereCond);
        let data = await pool.request()
            .query("select b.*,c.LineName,c.Engineers,d.FirstName,d.LastName from [dbo].[RADetails] as a, [dbo].[RANCList] as b, [dbo].[LineResponsibility] as c, [dbo].[Users] as d where b.NCId=" + NCId + " and a.RAId=b.RAId and a.LineId=c.LineId and a.AuditerId=d.UserId" + WhereCond);
        pool.close;
        sql.close;
        return data.recordset;
    }

    async GetUserRoles(searchName, LocationId) {
        var searchVal;
        if (searchName != '') {
            searchVal = '%' + searchName.toLowerCase() + '%';
        }
        var WhereCond = '';
        if (LocationId != '') {
            WhereCond += " and LocationId='" + LocationId + "'";
        }
        console.log("searchVal" + searchVal);
        let pool = await sql.connect(dbConfig);
        console.log("select * from [dbo].[Users] where (LOWER(FirstName) like '" + searchVal + "' or LOWER(LastName) like '" + searchVal + "')" + WhereCond);
        let data = await pool.request()
            .query("select * from [dbo].[Users] where (LOWER(FirstName) like '" + searchVal + "' or LOWER(LastName) like '" + searchVal + "')" + WhereCond);
        pool.close;
        sql.close;
        return data.recordset;
    }

    async GetDesktopAuditNCList(NCCreatedStart, NCCreatedEnd, NCStatus, Auditer, Responsible, Plant, ValueStream, LineName, Checklist, LoggedUserId, LocationId) {
        var WhereFilter = "";
        if (NCCreatedStart != '' && NCCreatedEnd != '') {
            WhereFilter += "and CAST(a.CreatedOn AS DATE) >= '" + NCCreatedStart + "' and CAST(a.CreatedOn AS DATE) <= '" + NCCreatedEnd + "'";
        }
        if (NCStatus != '') {
            WhereFilter += " and a.NCStatus IN (" + NCStatus + ")";
        } else {
            WhereFilter += " and a.NCStatus IN (1,2,3,4,5)";
        }
        if (LocationId != '') { WhereFilter += " and a.LocationId=" + LocationId; }
        if (Auditer != '') { WhereFilter += " and g.AuditerId=" + Auditer; }
        if (Responsible != '') { WhereFilter += " and e.ResponsibleId=" + Responsible; }
        if (Plant != '') { WhereFilter += " and h.Plant=" + Plant; }
        if (ValueStream != '') { WhereFilter += " and h.ValueStream=" + ValueStream; }
        if (LineName != '') { WhereFilter += " and h.LineName=" + LineName; }
        if (Checklist != '') { WhereFilter += " and j.ChecklistId=" + Checklist; }
        if (LoggedUserId != '') { WhereFilter += " and ((g.AuditerId='" + LoggedUserId + "') or (e.ResponsibleId='" + LoggedUserId + "') or (h.Engineers like '%," + LoggedUserId + ",%') or (h.Leaders like '%," + LoggedUserId + ",%'))"; }

        let pool = await sql.connect(dbConfig);
        let Query = "select j.ChecklistSlug,i.UserId,i.FirstName as AuditerFirstName,i.LastName as AuditerLastName,a.*,b.CategoryTitle,c.CETitle,d.MCTitle,e.NCReassCommands,e.ImpImage,e.ImpDescription,e.NCReassOn,e.NCReassImage,e.ImpOn,e.ImpBy,e.CAId,e.ResponsibleId,e.CADescription,e.ImpDate,e.CAStatus,e.VrfcDate,e.VrfcDescription,e.CreatedBy as CACreated,e.NCReassCommands,f.FirstName,f.LastName,h.Plant as LPlant,h.ValueStream as LValueStream,h.LineName as LLineName from " + dbTable.Checklists + " as j," + dbTable.Users + " as i," + dbTable.LineResponsibility + " as h," + dbTable.RADetails + " as g," + dbTable.AuditCategory + " as b, " + dbTable.RANCList + " as a left join " + dbTable.AuditCE + " as c ON a.CEId=c.CEId left join " + dbTable.AuditMC + " as d ON a.MCId=d.MCId left join " + dbTable.RACA + " as e ON e.NCId=a.NCId  left join " + dbTable.Users + " as f ON e.ResponsibleId=f.UserId  where h.LineId=g.LineId and g.ChecklistId=j.ChecklistId and g.AuditerId=i.UserId and a.RAId=g.RAId and a.CategoryId=b.CategoryId " + WhereFilter + " order by a.NCId desc";
        console.log("######## " + Query);
        let data = await pool.request()
            .query(Query);
        pool.close;
        sql.close;
        return data.recordset;
    }

    async GetPlant(tableName, LocationId) {
        var WhereCond = '';
        if (LocationId != '') {
            WhereCond += " and LocationId='" + LocationId + "'";
        }
        let pool = await sql.connect(dbConfig);
        let data = await pool.request()
            .query("select DISTINCT Plant from " + tableName + " where Status=1" + WhereCond);
        pool.close;
        sql.close;
        return data.recordset;
    }

    async GetValuestream(tableName, LocationId) {
        var WhereCond = '';
        if (LocationId != '') {
            WhereCond += " and LocationId='" + LocationId + "'";
        }
        let pool = await sql.connect(dbConfig);
        let data = await pool.request()
            .query("select DISTINCT ValueStream from " + tableName + " where Status=1" + WhereCond);
        pool.close;
        sql.close;
        return data.recordset;
    }

    async GetLines(tableName, searchName, LocationId) {
        var searchVal;
        if (searchName != '') {
            searchVal = '%' + searchName.toLowerCase() + '%';
        }
        var WhereCond = '';
        if (LocationId != '') {
            WhereCond += " and LocationId='" + LocationId + "'";
        }
        console.log("searchVal" + searchVal);
        let pool = await sql.connect(dbConfig);
        console.log("select LineName from " + tableName + " where LOWER(LineName) like '" + searchVal + "' and Status=1" + WhereCond);
        let data = await pool.request()
            .query("select LineName from " + tableName + " where LOWER(LineName) like '" + searchVal + "' and Status=1" + WhereCond);
        pool.close;
        sql.close;
        return data.recordset;
    }

    async GetActiveChecklists(tableName, searchName, LocationId) {
        var searchVal;
        if (searchName != '') {
            searchVal = '%' + searchName.toLowerCase() + '%';
        }
        var WhereCond = '';
        if (LocationId != '') {
            WhereCond += " and LocationId='" + LocationId + "'";
        }
        console.log("searchVal" + searchVal);
        let pool = await sql.connect(dbConfig);
        console.log("select ChecklistId, ChecklistName from " + tableName + " where LOWER(ChecklistName) like '" + searchVal + "' and Status=1" + WhereCond);
        let data = await pool.request()
            .query("select ChecklistId, ChecklistName from " + tableName + " where LOWER(ChecklistName) like '" + searchVal + "' and Status=1" + WhereCond);
        pool.close;
        sql.close;
        return data.recordset;
    }

    /*async GetDesktopAuditNCList(NCCreatedStart, NCCreatedEnd, NCStatus, Auditer, Responsible, Plant, ValueStream, LineName, Checklist)
    {
    	var WhereFilter = "";
    	if(NCCreatedStart != '' && NCCreatedEnd != '') {
    		WhereFilter += "and CAST(a.CreatedOn AS DATE) >= '"+NCCreatedStart+"' and CAST(a.CreatedOn AS DATE) <= '"+NCCreatedEnd+"'";
    	} 
    	if(NCStatus != '') { WhereFilter += " and a.NCStatus IN ("+NCStatus+")";
    	} else { WhereFilter += " and a.NCStatus IN (1,2,3,4,5)"; }
    	if(Auditer != '') { WhereFilter += " and g.AuditerId="+Auditer; }
    	if(Responsible != '') { WhereFilter += " and e.ResponsibleId="+Responsible; }
    	if(Plant != '') { WhereFilter += " and h.Plant='"+Plant+"'"; }
    	if(ValueStream != '') {  WhereFilter += " and h.ValueStream='"+ValueStream+"'"; }
    	if(LineName != '') { WhereFilter += " and h.LineName='"+LineName+"'"; }
    	if(Checklist != '') { WhereFilter += " and j.ChecklistId="+Checklist; }
    	
    	let pool = await sql.connect(dbConfig);
    	console.log("select j.ChecklistSlug,i.UserId,i.FirstName as AuditerFirstName,i.LastName as AuditerLastName,a.*,b.CategoryTitle,c.CETitle,d.MCTitle,e.NCReassCommands,e.ImpImage,e.ImpDescription,e.NCReassOn,e.ImpOn,e.ImpBy,e.CAId,e.ResponsibleId,e.CADescription,e.ImpDate,e.CAStatus,e.VrfcDate,e.VrfcDescription,e.CreatedBy as CACreated,e.NCReassCommands,f.FirstName,f.LastName,h.Plant as LPlant,h.ValueStream as LValueStream,h.LineName as LLineName from "+dbTable.Checklists+" as j,"+dbTable.Users+" as i,"+dbTable.LineResponsibility+" as h,"+dbTable.RADetails+" as g,"+dbTable.AuditCategory+" as b, "+dbTable.AuditCE+" as c, "+dbTable.AuditMC+" as d, "+dbTable.RANCList+" as a left join "+dbTable.RACA+" as e ON e.NCId=a.NCId  left join "+dbTable.Users+" as f ON e.ResponsibleId=f.UserId  where h.LineId=g.LineId and g.ChecklistId=j.ChecklistId and g.AuditerId=i.UserId and a.RAId=g.RAId and a.CategoryId=b.CategoryId and a.CEId=c.CEId and a.MCId=d.MCId "+WhereFilter+" order by a.NCId desc");
    	let data = await pool.request()
         .query("select j.ChecklistSlug,i.UserId,i.FirstName as AuditerFirstName,i.LastName as AuditerLastName,a.*,b.CategoryTitle,c.CETitle,d.MCTitle,e.NCReassCommands,e.ImpImage,e.ImpDescription,e.NCReassOn,e.ImpOn,e.ImpBy,e.CAId,e.ResponsibleId,e.CADescription,e.ImpDate,e.CAStatus,e.VrfcDate,e.VrfcDescription,e.CreatedBy as CACreated,e.NCReassCommands,f.FirstName,f.LastName,h.Plant as LPlant,h.ValueStream as LValueStream,h.LineName as LLineName from "+dbTable.Checklists+" as j,"+dbTable.Users+" as i,"+dbTable.LineResponsibility+" as h,"+dbTable.RADetails+" as g,"+dbTable.AuditCategory+" as b, "+dbTable.AuditCE+" as c, "+dbTable.AuditMC+" as d, "+dbTable.RANCList+" as a left join "+dbTable.RACA+" as e ON e.NCId=a.NCId  left join "+dbTable.Users+" as f ON e.ResponsibleId=f.UserId  where h.LineId=g.LineId and g.ChecklistId=j.ChecklistId and g.AuditerId=i.UserId and a.RAId=g.RAId and a.CategoryId=b.CategoryId and a.CEId=c.CEId and a.MCId=d.MCId "+WhereFilter+" order by a.NCId desc");		
    	pool.close;
    	sql.close;
    	return data.recordset;
    } */

    async GetNCStar(tableName, NCId, UserId) {
        let pool = await sql.connect(dbConfig);
        let data = await pool.request()
            .query("select * from " + tableName + " where NCId='" + NCId + "' and UserId='" + UserId + "'");
        pool.close;
        sql.close;
        return data.recordset;
    }

    async NCStarInsert(tableName, columnKey, insertValues) {

        return new Promise((resolve, reject) => {
            new sql.ConnectionPool(dbConfig).connect().then(pool => {
                console.log("INSERT INTO " + tableName + " (" + columnKey + ") VALUES ('" + insertValues.NCId + "','" + insertValues.UserId + "','" + insertValues.Status + "','" + insertValues.UpdatedOn + "')");
                return pool.request().query("INSERT INTO " + tableName + " (" + columnKey + ") VALUES ('" + insertValues.NCId + "','" + insertValues.UserId + "','" + insertValues.Status + "','" + insertValues.UpdatedOn + "')")
            }).then(result => {
                console.log(result);
                resolve(result['recordset']);
                sql.close();
            }).catch(err => {
                reject(err)
                sql.close();
            });
        });
    }

    async NCStarUpdate(tableName, NCId, UserId, NCStarStatus, UpdatedOn) {
        return new Promise((resolve, reject) => {
            new sql.ConnectionPool(dbConfig).connect().then(pool => {
                console.log("UPDATE " + tableName + " set Status='" + NCStarStatus + "', UpdatedOn='" + UpdatedOn + "' where NCId='" + NCId + "'and UserId='" + UserId + "'");
                return pool.request().query("UPDATE " + tableName + " set Status='" + NCStarStatus + "', UpdatedOn='" + UpdatedOn + "' where NCId='" + NCId + "'and UserId='" + UserId + "'")
            }).then(result => {
                resolve(result['recordset']);
                sql.close();
            }).catch(err => {
                reject(err)
                sql.close();
            });
        });
    }

    async GetUserDetailsById(tableName, ResponsibleId, LocationId) {
        var WhereCond = '';
        if (LocationId != '') {
            WhereCond += " and LocationId='" + LocationId + "'";
        }
        let pool = await sql.connect(dbConfig);
        // let Query ="select * from " + tableName + " where UserId='" + ResponsibleId + "'" + WhereCond;
        let Query = "select * from " + tableName + " where UserId='" + ResponsibleId + "'";
        let data = await pool.request()
            .query(Query);
        pool.close;
        sql.close;
        return data.recordset;
    }


    async GetUserLocation(tableName, EmpLocation) {
        let pool = await sql.connect(dbConfig);
        let Query = "select LocationId from " + tableName + " where LocationName='" + EmpLocation + "'";
        console.log("****___", Query);
        let data = await pool.request()
            .query(Query);
        pool.close;
        sql.close;
        return data.recordset;
    }

    async CheckAuditerSubstitute(tableName, RAId) {
        let pool = await sql.connect(dbConfig);
        let data = await pool.request()
            .query("select b.* from " + tableName + " as a, " + dbTable.Users + " as b where a.RAId=" + RAId + " and a.AuditerId=b.UserId");
        pool.close;
        sql.close;
        return data.recordset;
    }

    async UserSubstituteUpdate(tableName, columnKey, insertValues) {
		return new Promise((resolve, reject) => {
            new sql.ConnectionPool(dbConfig).connect().then(pool => {
                 var Query = "INSERT INTO " + tableName + " (" + columnKey + ") VALUES ('" + insertValues.LineId + "','" + insertValues.UserId + "','" + insertValues.LocationId + "','" + insertValues.Status + "','" + insertValues.CreatedOn + "','" + insertValues.CreatedBy + "', '"+insertValues.Auditor+"') SELECT @@IDENTITY AS insertedId;";
                console.log(Query);
                return pool.request().query(Query)
            }).then(result => {
                console.log(result);
                resolve(result['recordset']);
                sql.close();
            }).catch(err => {
                reject(err)
                sql.close();
            });
        });
    }
	
	async UpdateUserProxyStatus(tableName, Status, OverallStatus, ProxyId, LocationId, UpdatedBy) {
		var WhereCond = '';
		if (LocationId != '') {
            WhereCond += " and LocationId='" + LocationId + "'";
        }			
		 if(OverallStatus == '1' || OverallStatus == '0'){
			var Query = "UPDATE [dbo].[Proxy] SET Status = '"+OverallStatus+"' WHERE CreatedBy = '"+UpdatedBy+"'" + WhereCond;
		 }
		 else{
			 if(Status == '1' || Status == '0'){
			  console.log("Status"+Status)
			  var Query = "Update [dbo].[Proxy] SET Status = '"+Status+"' where ProxyId='" + ProxyId + "'" + WhereCond;
		    }
			else{
				var Query = "delete from " + tableName + " where ProxyId='" + ProxyId + "'" + WhereCond;
			} 
		 }
		 
        let pool = await sql.connect(dbConfig);
       
        console.log(Query);
        let data = await pool.request()
            .query(Query);
        pool.close;
        sql.close;
        return data.recordset;
    }

    async GetNCAuditerResponsible(tableName, NCId, LocationId) {
        var WhereCond = '';
        if (LocationId != '') {
            WhereCond += " and a.LocationId='" + LocationId + "'";
        }
        let pool = await sql.connect(dbConfig);
        let data = await pool.request()
            .query("select b.* from " + tableName + " as a, " + dbTable.Users + " as b where a.NCId=" + NCId + " and b.UserId=a.AuditerResponsibleId" + WhereCond);
        pool.close;
        sql.close;
        return data.recordset;
    }

    async GetLineAuditees(tableName, LineId, LocationId) {
        var WhereCond = '';
        if (LocationId != '') {
            WhereCond += " and LocationId='" + LocationId + "'";
        }
        let pool = await sql.connect(dbConfig);
        var Query = "select * from " + tableName + " where LineId='" + LineId + "' and Status=1" + WhereCond;
        console.log(Query);
        let data = await pool.request()
            .query(Query);
        pool.close;
        sql.close;
        return data.recordset;
    }

    async GetLineAuditeeDetails(tableName, Auditees, LocationId) {
        var WhereCond = '';
        if (LocationId != '') {
            WhereCond += " and LocationId='" + LocationId + "'";
        }
        let pool = await sql.connect(dbConfig);
        var Query = "select * from " + tableName + " where UserId IN (" + Auditees + ")" + WhereCond;
        console.log(Query);
        let data = await pool.request()
            .query(Query);
        pool.close;
        sql.close;
        return data.recordset;
    }

    async GetChecklistDetails(tableName, ChecklistId, LocationId) {
        var WhereCond = '';
        if (LocationId != '') {
            WhereCond += " and LocationId='" + LocationId + "'";
        }
        let pool = await sql.connect(dbConfig);
        var Query = "select * from " + tableName + " where ChecklistId=" + ChecklistId + WhereCond;
        console.log(Query);
        let data = await pool.request()
            .query(Query);
        pool.close;
        sql.close;
        return data.recordset;
    }
	
	async GetScheduledAudits(UserId, LocationId, RecordStarting, PerPageRecords, Freequency, ChecklistId, Plant, ValueStream, LineName, ScheduledOnStart, ScheduledOnEnd) {
        
		console.log("##########"+RecordStarting+"@@@@@@@@@@@@"+PerPageRecords);
		var LimitCond = " OFFSET 0 ROWS FETCH NEXT 10 ROWS ONLY";
		var WhereCond = "";
		if(RecordStarting != '' && PerPageRecords != '') {
			LimitCond = " OFFSET "+RecordStarting+" ROWS FETCH NEXT "+PerPageRecords+" ROWS ONLY";
		}
		if(Freequency != "") {
			WhereCond += " and c.Freequency='"+Freequency+"'"; 
		} /*else {
			WhereCond += " and c.Freequency IN ('3','4')"; 
		} */
		if(ChecklistId != "") { WhereCond += " and c.ChecklistId='"+ChecklistId+"'"; }
		if(Plant != "") { WhereCond += " and e.Plant='"+Plant+"'"; }
		if(ValueStream != "") { WhereCond += " and e.ValueStream='"+ValueStream+"'"; }
		if(LineName != "") { WhereCond += " and e.LineName='"+LineName+"'"; }
		if(ScheduledOnStart != "" && ScheduledOnEnd != "") {
			WhereCond += " and (CAST(c.CreatedOn as DATE) >= '"+ScheduledOnStart+"') and (CAST(c.CreatedOn as DATE) <= '"+ScheduledOnEnd+"')";
		}			
		
        let pool = await sql.connect(dbConfig);
        //var Query = "select c.*,d.ChecklistName,d.ChecklistSlug,d.ChecklistType,e.Plant,e.ValueStream,e.LineName from "+dbTable.Users+" as a,"+dbTable.RoleAccess+" as b,"+dbTable.AuditScheduled+" as c,"+dbTable.Checklists+" as d,"+dbTable.LineResponsibility+" as e where a.UserId='"+UserId+"' and a.RoleId=b.RoleId and b.ChecklistId=c.ChecklistId and c.Status=0 and c.LocationId='"+LocationId+"' and c.ChecklistId=d.ChecklistId and c.LineId=e.LineId"+WhereCond+" order by c.AuditScheduledId desc "+LimitCond;
		var Query = "select * from ((select c.*,c.AuditScheduledId as AuditScheduledIdVal,d.ChecklistName,d.ChecklistSlug,d.ChecklistType,e.Plant,e.ValueStream,e.LineName,f.ProxyId,f.CreatedBy as ActualAuditor from "+dbTable.RoleAccess+" as b,"+dbTable.Checklists+" as d, "+dbTable.Users+" as a, "+dbTable.LineResponsibility+" as e, "+dbTable.AuditScheduled+" as c left join Proxy as f ON c.LineId=f.LineId and f.UserId="+UserId+" where a.UserId="+UserId+" and a.RoleId=b.RoleId and b.ChecklistId=c.ChecklistId and c.Status=0 and c.LocationId="+LocationId+" and c.ChecklistId=d.ChecklistId and c.LineId=e.LineId "+WhereCond+") union (select c.*,c.AuditScheduledId as AuditScheduledIdVal,d.ChecklistName,d.ChecklistSlug,d.ChecklistType,e.Plant,e.ValueStream,e.LineName, f.ProxyId,f.CreatedBy as ActualAuditor from "+dbTable.Proxy+" as f, "+dbTable.LineResponsibility+" as e, "+dbTable.AuditScheduled+" as c, "+dbTable.Checklists+" as d where f.UserId="+UserId+" and f.LineId=e.LineId and f.Status=1 and e.LineId=c.LineId and c.Status=0 and c.ChecklistId=d.ChecklistId and c.LocationId="+LocationId+" "+WhereCond+")) y order by AuditScheduledIdVal asc "+LimitCond;
        console.log(Query);
        let data = await pool.request()
            .query(Query);
        pool.close;
        sql.close;
        return data.recordset;
    }
	
	async AuditScheduleStatuUpdate(tableName, AuditScheduledId) {
		return new Promise((resolve, reject) => {
            new sql.ConnectionPool(dbConfig).connect().then(pool => {
				var Query = "UPDATE " + tableName + " set Status=1 where AuditScheduledId='" + AuditScheduledId + "'";
				console.log(Query);
                return pool.request().query(Query)
            }).then(result => {
                resolve(result['recordset']);
                sql.close();
            }).catch(err => {
                reject(err)
                sql.close();
            });
        });
	}
	
	async CheckScheduledAuditByUser(UserId, LineId, ChecklistId, LocationId) {
        
        let pool = await sql.connect(dbConfig);
        var Query = "select a.Status,c.UserId,c.Email,c.RoleId,a.ChecklistId,a.LineId,b.RoleId from "+dbTable.AuditScheduled+" as a, "+dbTable.RoleAccess+" as b, "+dbTable.Users+" as c where a.Status=0 and a.LocationId='"+LocationId+"' and a.ChecklistId='"+ChecklistId+"' and a.LineId='"+LineId+"' and a.ChecklistId=b.ChecklistId and b.Status=1 and b.RoleId=c.RoleId and c.UserId='"+UserId+"'";
        console.log(Query);
        let data = await pool.request()
            .query(Query);
        pool.close;
        sql.close;
        return data.recordset;
    }
	
	async GetAuditUsers(searchName, LocationId, Auditor){
		var searchVal;
        if (searchName != '') {
            searchVal = '%' + searchName.toLowerCase() + '%';
        }
		console.log("Auditorval"+Auditor);
        var WhereCond = '';
        if (LocationId != '') {
			if(Auditor == '1'){
				console.log("Auditor");
			    WhereCond += "and RoleId != '' and LocationId='" + LocationId + "' ";
			}
			else{
				console.log("Auditee");
				WhereCond += "and LocationId='" + LocationId + "'";
			}
        }
        console.log("searchVal" + searchVal);
        let pool = await sql.connect(dbConfig);
        console.log("select * from [dbo].[Users] where (LOWER(FirstName) like '" + searchVal + "' or LOWER(LastName) like '" + searchVal + "')" + WhereCond);
        let data = await pool.request()
            .query("select * from [dbo].[Users] where (LOWER(FirstName) like '" + searchVal + "' or LOWER(LastName) like '" + searchVal + "')" + WhereCond);
        pool.close;
        sql.close;
        return data.recordset;
	}
	
	async GetAllDomains(tableName) {

        return new Promise((resolve, reject) => {
            new sql.ConnectionPool(dbConfig).connect().then(pool => {
                let Query = "select DomainName from " + tableName + " ";
                console.log(Query);
                return pool.request().query(Query)
            }).then(result => {
                console.log(result);
                resolve(result['recordset']);
                sql.close();
            }).catch(err => {
                reject(err)
                sql.close();
            });
        });
    }
	
	async GetNewEmpId(DomainName) {
		var config = { user: 'feedback', password: 'feedback', server: 'WDEGSSQLT2', database: 'WABCO_FEEDBACK' };
		var whereCondition = '';
		return new Promise((resolve, reject) => {
			var Query="select EMPLID, NAME, FIRST_NAME, LAST_NAME, LOCATION, AM_DOMAIN_ID, EMAIL_ADDR from [dbo].[EMPDETAILS_WORKDAY] where HR_STATUS='A' and AM_DOMAIN_ID='"+DomainName+"'";
			console.log("GetActiveUserWorkday=>"+Query);
			new sql.ConnectionPool(config).connect().then(pool => {
				return pool.request().query(Query)
			}).then(result => {
				resolve(result['recordset']);
				sql.close();
			}).catch(err => {
				reject(err)
				sql.close();
			});
		});
	}
	
	async UpdateEmpId(tableName,EmpId,DomainName) {

        return new Promise((resolve, reject) => {
            new sql.ConnectionPool(dbConfig).connect().then(pool => {
                let Query = "UPDATE " + tableName + " set EmpIdTemp='"+EmpId+"' where DomainName='"+DomainName+"' ";
                console.log(Query);
                return pool.request().query(Query)
            }).then(result => {
                console.log(result);
                resolve(result['recordset']);
                sql.close();
            }).catch(err => {
                reject(err)
                sql.close();
            });
        });
    }
	
	async GetNCDetailsForImage(tableName, RAId, NCId) {
        return new Promise((resolve, reject) => {
            new sql.ConnectionPool(dbConfig).connect().then(pool => {
                let Query = "select * from "+tableName+" where RAId="+RAId+" and NCId="+NCId;
                return pool.request().query(Query)
            }).then(result => {
                resolve(result['recordset']);
                sql.close();
            }).catch(err => {
                reject(err)
                sql.close();
            });
        });
    }
	
	async UpdateNCImage(tableName,RAId,NCId,NCImage) {

        return new Promise((resolve, reject) => {
            new sql.ConnectionPool(dbConfig).connect().then(pool => {
                let Query = "UPDATE " + tableName + " set NCImage='"+NCImage+"' where RAId="+RAId+" and NCId="+NCId;
                console.log(Query);
                return pool.request().query(Query)
            }).then(result => {
                console.log(result);
                resolve(result['recordset']);
                sql.close();
            }).catch(err => {
                reject(err)
                sql.close();
            });
        });
    }
	
	async RoleRequestCreate(tableName, columnKey, insertValues) {

        return new Promise((resolve, reject) => {
            new sql.ConnectionPool(dbConfig).connect().then(pool => {
				var Query = "INSERT INTO " + tableName + " (" + columnKey + ") VALUES ('" + insertValues.UserId + "','" + insertValues.RoleId + "','" + insertValues.LineIds + "','" + insertValues.Approver + "','" + insertValues.Status + "','" + insertValues.CreatedBy + "','" + insertValues.CreatedOn + "','"+insertValues.LocationId+"')";
				console.log(Query);
                return pool.request().query(Query)
            }).then(result => {
                console.log(result);
                resolve(result['recordset']);
                sql.close();
            }).catch(err => {
                reject(err)
                sql.close();
            });
        });

    }
	
	async RoleRequestUpdate(tableName, RoleRequestId, Status, Approver, LocationId) {
		return new Promise((resolve, reject) => {
            new sql.ConnectionPool(dbConfig).connect().then(pool => {
				var Query = "UPDATE " + tableName + " set Status="+Status+" where RoleRequestId='" + RoleRequestId + "' and Approver='"+Approver+"' and LocationId="+LocationId;
				console.log(Query);
                return pool.request().query(Query)
            }).then(result => {
                resolve(result['recordset']);
                sql.close();
            }).catch(err => {
                reject(err)
                sql.close();
            });
        });
	}
	
	async GetRoleRequestDetails(tableName, RoleRequestId) {
        return new Promise((resolve, reject) => {
            new sql.ConnectionPool(dbConfig).connect().then(pool => {
                let Query = "select * from "+tableName+" where RoleRequestId="+RoleRequestId;
                return pool.request().query(Query)
            }).then(result => {
                resolve(result['recordset']);
                sql.close();
            }).catch(err => {
                reject(err)
                sql.close();
            });
        });
    }
	
	async UserRequestRoleUpdate(tableName, UserId, RoleId, LocationId) {
		return new Promise((resolve, reject) => {
            new sql.ConnectionPool(dbConfig).connect().then(pool => {
				var Query = "UPDATE " + tableName + " set RoleId="+RoleId+" where UserId='" + UserId + "' and LocationId="+LocationId;
				console.log(Query);
                return pool.request().query(Query)
            }).then(result => {
                resolve(result['recordset']);
                sql.close();
            }).catch(err => {
                reject(err)
                sql.close();
            });
        });
	}
	
	async UserRequestLineUpdate(tableName, UserId, LineIdsVal, LocationId) {
		return new Promise((resolve, reject) => {
            new sql.ConnectionPool(dbConfig).connect().then(pool => {
				var Query = "UPDATE " + tableName + " set Engineers=CONCAT(Engineers,'"+UserId+",') where LineId IN ("+LineIdsVal+") and LocationId="+LocationId;
				console.log(Query);
                return pool.request().query(Query)
            }).then(result => {
                resolve(result['recordset']);
                sql.close();
            }).catch(err => {
                reject(err)
                sql.close();
            });
        });
	}
	
	async RoleRequestPending(tableName, UserId, LocationId, RoleRequestVal) {
        let pool = await sql.connect(dbConfig);
		let WhereCond = '';
		if(RoleRequestVal == 'req') {
			WhereCond = "a.UserId="+UserId+" and a.Approver=c.UserId";
		} else {
			WhereCond = "a.Approver="+UserId+" and a.Status=0 and a.UserId=c.UserId";
		}
		let Query = "select a.*,b.RoleName,c.FirstName,c.LastName from "+tableName+" as a, "+dbTable.UserRoles+" as b, "+dbTable.Users+" as c where "+WhereCond+" and a.LocationId="+LocationId+" and a.RoleId=b.RoleId and b.Status=1 and b.LocationId="+LocationId+" order by RoleRequestId desc";
		console.log(Query);
		let data = await pool.request().query(Query);
        pool.close;
		sql.close;
		//return data.recordset;
				
            
		let RoleRequestRes = data.recordset;
		//console.log(RoleRequestRes);
		for(let i=0; i<RoleRequestRes.length; i++) {
			let LineIds = RoleRequestRes[i]['LineIds'];
			if(LineIds != '') {
				console.log("%%%%%%%");
				console.log(LineIds);
				LineIds = LineIds.substring(0, LineIds.length - 1);
				LineIds = LineIds.substring(1);
				let pool = await sql.connect(dbConfig);
				let QueryVal = "select Plant,ValueStream,LineName from " + dbTable.LineResponsibility + " where LineId IN ("+LineIds+") and LocationId="+LocationId+" and Status=1";
				let dataVal = await pool.request().query(QueryVal);
				pool.close;
				sql.close;
				console.log(dataVal.recordset);
				//return dataVal.recordset;
				RoleRequestRes[i]['LineDetails'] = dataVal.recordset;
			} else {
				RoleRequestRes[i]['LineDetails'] = '';
			}
		}
		return RoleRequestRes;
               
    }
	
	/*async RoleRequestPending(tableName, UserId, LocationId) {
        return new Promise((resolve, reject) => {
            new sql.ConnectionPool(dbConfig).connect().then(pool => {
                let Query = "select a.*,b.RoleName from "+tableName+" as a, "+dbTable.UserRoles+" as b where a.Approver="+UserId+" and a.Status=0 and a.LocationId="+LocationId+" and a.RoleId=b.RoleId and b.Status=1 and b.LocationId="+LocationId;
				console.log(Query);
                return pool.request().query(Query)
            }).then(result => {
				let RoleRequestRes = result['recordset'];
				//console.log(RoleRequestRes);
				for(let i=0; i<RoleRequestRes.length; i++) {
					let LineIds = RoleRequestRes[i]['LineIds'];
					console.log("%%%%%%%");
					console.log(LineIds);
					LineIds = LineIds.substring(0, LineIds.length - 1);
					LineIds = LineIds.substring(1);
					let pool = sql.connect(dbConfig);
					let data = pool.request()
						.query("select Plant,ValueStream,LineName from " + dbTable.LineResponsibility + " where LineId IN ("+LineIds+") and LocationId="+LocationId+" and Status=1");
					pool.close;
					sql.close;
					cosnole.log(data.recordset);
					//return data.recordset;
					RoleRequestRes[i]['LineDetails'] = data.recordset;
				}
                resolve(RoleRequestRes);
                sql.close();
            }).catch(err => {
                reject(err)
                sql.close();
            });
        });
    } */
	
	async GetLineDetailsByIds(tableName, LineIds, LocationId) {
        return new Promise((resolve, reject) => {
            new sql.ConnectionPool(dbConfig).connect().then(pool => {
                let Query = "select LineId,Plant,ValueStream,LineName from "+tableName+" where LineId IN ("+LineIds+") and LocationId="+LocationId+" and Status=1";
                return pool.request().query(Query)
            }).then(result => {
                resolve(result['recordset']);
                sql.close();
            }).catch(err => {
                reject(err)
                sql.close();
            });
        });
    }
	
	async GetRoles(tableName, LocationId) {
		return new Promise((resolve, reject) => {
            new sql.ConnectionPool(dbConfig).connect().then(pool => {
				var Query = "select * from " + tableName + " where Status=1 and LocationId="+LocationId;
				console.log(Query);
                return pool.request().query(Query)
            }).then(result => {
                resolve(result['recordset']);
                sql.close();
            }).catch(err => {
                reject(err)
                sql.close();
            });
        });
	}
	
	async GetApprover(EmpId) {
        var config = { user: 'feedback', password: 'feedback', server: 'WDEGSSQLT2', database: 'WABCO_FEEDBACK' };
        var whereCondition = '';
        
        return new Promise((resolve, reject) => {
            new sql.ConnectionPool(config).connect().then(pool => {
                return pool.request().query("select b.EMPLID,b.LAST_NAME,b.FIRST_NAME,b.AM_DOMAIN_ID,b.EMAIL_ADDR from [dbo].[EMPDETAILS_WORKDAY] as a, [dbo].[EMPDETAILS_WORKDAY] as b where a.EMPLID='"+EmpId+"' and a.SUPERVISOR_ID=b.EMPLID and a.HR_STATUS='A' and b.HR_STATUS='A'")
            }).then(result => {
                resolve(result['recordset']);
                sql.close();
            }).catch(err => {
                reject(err)
                sql.close();
            });
        });
    }
	
	async GetValuestreamByPlant(tableName, LocationId, Plant) {
        var WhereCond = '';
        
        let pool = await sql.connect(dbConfig);
		let Query = "select DISTINCT ValueStream from " + tableName + " where Status=1 and Plant='"+Plant+"' and LocationId='" + LocationId + "'";
        let data = await pool.request()
            .query(Query);
        pool.close;
        sql.close;
        return data.recordset;
    }

    async GetLinesByPlantVS(tableName, LocationId, Plant, ValueStream) {
        
        let pool = await sql.connect(dbConfig);
		let Query = "select * from " + tableName + " where Status=1 and Plant='"+Plant+"' and ValueStream='"+ValueStream+"' and LocationId='" + LocationId + "'";
        let data = await pool.request()
            .query(Query);
        pool.close;
        sql.close;
        return data.recordset;
    }
	
	async GetSettingsDetails(tableName, LocationId, SettingField) {
		return new Promise((resolve, reject) => {
            new sql.ConnectionPool(dbConfig).connect().then(pool => {
				var Query = "select "+SettingField+" from " + tableName + " where LocationId="+LocationId;
				console.log(Query);
                return pool.request().query(Query)
            }).then(result => {
                resolve(result['recordset']);
                sql.close();
            }).catch(err => {
                reject(err)
                sql.close();
            });
        });
	}
	
	
};

//export default Person;
var express = require('express');
var fs = require('fs');
var request = require('request');
var cheerio = require('cheerio');
var app = express();
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var autoIncrement = require('mongoose-auto-increment');
var uniqueValidator = require('mongoose-unique-validator');
var kue = require('kue');
var queue = kue.createQueue();
var cron = require('cron');
//var sanitizeHtml = require('sanitize-html');
//he = require('he');

var Model = require('./models');


//Create First Entry
// PollManager.findOne({},function(err,pollData){
// 	if(pollData == null){
// 		var newPoll = new PollManager({ object_type: 'sellers', object_id: 0 });
// 		newPoll.save(function(err){
// 			if(!err){
// 				console.log('PollManager Started!!');		
// 			}
// 		});		
// 	}
// })

var cronRunner = "*/40 * * * * *";    
var cronJob = cron.job(cronRunner, function(){
    console.log(new Date());
    processSeller();    
});
cronJob.start();


function processSeller(){
    Model.Seller.findOne({contact_details_added:{'$ne': true }}).limit(1).exec(function(err, seller){
        if(seller != null){
            getProductWebsiteUrl(seller,function(data){
                if(data['success']){
                    var seller_url = data.url;

                    var seller_enquiry_url = seller_url + 'enquiry.html';

                    request(seller_enquiry_url, function (error, response, html) {

                        if(error){
                            console.log('------------ Error Requesting Page ---------------');
                            console.log(error);
                        } else {
                            if (response.statusCode == 200) {
                                var $ = cheerio.load(html);

                                var latitude = $('input[name="latitude"]').val();
                                var longitude = $('input[name="longitude"]').val();

                                var mobiles = [];
                                var telephones = [];
                                var faxes = [];
                                var toll_free_number = '';
                                var contact_person = '';
                                var full_address = '';
                                var additional_details = [];

                                if($('span.ncnct_p.f13_p').length == 0){
                                    console.log(' No Contact Details Found!!');
                                } else {
                                    $('span.ncnct_p.f13_p').each(function(i,elem){

                                        var contact_text = $(this).text().trim();
                                        
                                        if($(this).prev().text() == "Mobile:"){
                                            var mobiles_split = contact_text.split("+91-");

                                            mobiles_split.forEach(function(mobile){
                                                if(mobile.trim().length != 0){
                                                    mobiles.push('+91-' + mobile.trim());
                                                }
                                            })
                                        }

                                        if($(this).prev().text() == "Telephone:"){
                                            var telephones_split = contact_text.split("+91-");

                                            telephones_split.forEach(function(tp){
                                                if(tp.trim().length != 0){
                                                    telephones.push('+91-' + tp.trim());
                                                }
                                            })
                                        }

                                        if($(this).prev().text() == "Fax:"){
                                            var faxes_split = contact_text.split("+91-");

                                            faxes_split.forEach(function(fax){
                                                if(fax.trim().length != 0){
                                                    faxes.push('+91-' + fax.trim());
                                                }
                                            })
                                        }
                                        
                                    });
                                }

                                toll_free_number = $('#tollfree_enq').text();

                                if($('.ncnct_p.f13_p.clr6_P').length != 0){
                                    address_split = $('.ncnct_p.f13_p.clr6_P').html().split('<br>');

                                    if(address_split.length != 0){
                                        address_split_unique = [];
                                        address_split.forEach(function(as){
                                            if(as.trim().length != 0){
                                                address_split_unique.push(as.trim());
                                            }
                                        })

                                        if(address_split_unique[1] != undefined){
                                            contact_person = address_split_unique[1];   
                                        }
                                        
                                    }    

                                    full_address = $('.ncnct_p.f13_p.clr6_P').text().trim();    

                                    full_address = full_address.replace(/\r?\n|\r/g, " ");
                                    full_address = full_address.replace(/\r?\t|\r/g, " ");
                                }

                                var contact_details = {
                                    mobile: mobiles,
                                    telephone: telephones,
                                    fax: faxes,
                                    toll_free_number: toll_free_number,
                                    contact_person: contact_person,
                                    full_address: full_address
                                }

                                var geo_location = {};

                                if(latitude != undefined && longitude != undefined){
                                    var geo_location = {
                                        latitude: latitude,
                                        longitude: longitude
                                    };    
                                }

                                if($('.m8_p.m33_p.f13_p.lh_p.txt_p').length != 0){
                                    var stop = false;
                                    $('.m8_p.m33_p.f13_p.lh_p.txt_p hr').each(function(pI,pEle){

                                        var contact = {};

                                        $(this).prevAll().each(function(i,elem){ 
                                            if(elem.tagName == "HR"){
                                                stop = true;
                                            }

                                            if(stop == false){
                                                if($(this).hasClass('clr6_P')){
                                                    if($(this).prev().text() == "Mobile:"){  
                                                        contact['mobile'] = $(this).text().trim();
                                                    } else if($(this).prev().text() == "Telephone:"){
                                                        contact['telephone'] = $(this).text().trim();
                                                    } else if($(this).prev().text() == "Fax:"){
                                                        contact['fax'] = $(this).text().trim();
                                                    } else {
                                                        contact['person'] = $(this).text();
                                                    }
                                                }
                                            }
                                        })  

                                        additional_details.push(contact);

                                        var contact = {};

                                        if($('.m8_p.m33_p.f13_p.lh_p.txt_p hr').length-1 == pI){
                                            $(this).nextAll().each(function(i,elem){ 
                                                if($(this).hasClass('clr6_P')){
                                                    if($(this).prev().text() == "Mobile:"){  
                                                        contact['mobile'] = $(this).text().trim();
                                                    } else if($(this).prev().text() == "Telephone:"){
                                                        contact['telephone'] = $(this).text().trim();
                                                    } else if($(this).prev().text() == "Fax:"){
                                                        contact['fax'] = $(this).text().trim();
                                                    } else {
                                                        contact['person'] = $(this).text();
                                                    }
                                                }               
                                            })  

                                            additional_details.push(contact);
                                        }
                                    })
                                }


                                var update_data = {contact_details: contact_details,website_url: seller_url};

                                if(Object.keys(geo_location).length !== 0){
                                    update_data['geo_location'] = geo_location;
                                }

                                if(additional_details.length != 0){
                                    update_data['additional_details'] = additional_details;
                                }

                                console.log(update_data);

                                Model.Seller.update({ seller_id: seller.seller_id }, { $set: update_data }, function(err, updatedResponse){ 
                                    
                                    console.log('++++++++++++++++++++++++++++++++++++++++++++++++');
                                    console.log('Updated Contact Details for seller_id  -> ' + seller.seller_id);
                                    console.log('++++++++++++++++++++++++++++++++++++++++++++++++');
                                });
                                

                            } else {
                                console.log(response.statusCode);
                                console.log('------------ Wrong response Code ---------------');
                            }    
                        }

                        
                    });

                    console.log(seller_enquiry_url);    
                    console.log('====================================');

                    Model.Seller.update({ seller_id: seller.seller_id }, { $set: { contact_details_added:true } }, function(err, updatedResponse){ 
                        console.log(updatedResponse);
                    });
                } else {
                    console.log('**************************************');
                    console.log(seller);
                    Model.Seller.remove({seller_id:seller.seller_id}, function(err){
                        console.log('******* Seller Not Found and Removed *************');
                    })
                }
            })    
        }
        
    });    
}




function getProductWebsiteUrl(seller,callback){
    Model.Product.findOne({seller_collection_id: seller.seller_id},function(err, product){
        if(product != null){
            callback({success: true, url: product.seller_details.url});
        } else {
            callback({success: false})
        }
    })
}

console.log('server started');
exports = module.exports = app;


/*
var mobiles = [];

$('hr:first').prevAll().each(function(i,elem){ 
    if($(this).prev().text() == "Mobile:"){  
        var mobiles_split = $(this).text().trim().split("+91-");

        mobiles_split.forEach(function(mobile){
            if(mobile.trim().length != 0){
                mobiles.push('+91-' + mobile.trim());
            }
        })
    } 
})

$('hr:first').prevAll().each(function(i,elem){ 
    console.log($(this).prev().text()); 
})*/
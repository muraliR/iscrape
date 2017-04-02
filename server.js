var express = require('express');
var fs = require('fs');
var request = require('request');
var cheerio = require('cheerio');
var app = express();
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var autoIncrement = require('mongoose-auto-increment');
var uniqueValidator = require('mongoose-unique-validator');
var sleep = require('sleep');
var kue = require('kue');
var queue = kue.createQueue();
var cron = require('cron');


var mongoose_connection = mongoose.connect('mongodb://localhost:27017/indiamart-scrapper');
autoIncrement.initialize(mongoose_connection);


var sectionSchema = new Schema({
    name: { type: String, required: true, unique: true},
    url: { type: String, required: true, unique: true },
    created_at: {type: Date, default: Date.now}
});

sectionSchema.plugin(autoIncrement.plugin, { model: 'sections', field: 'section_id', startAt: 1 });
var Section = mongoose.model('sections',sectionSchema);
sectionSchema.plugin(uniqueValidator);

var categorySchema = new Schema({
	name: { type: String, required: true},
    url: { type: String, required: true },
    section_id : { type: Number, required: true },
    created_at: {type: Date, default: Date.now}
})

categorySchema.plugin(autoIncrement.plugin, { model: 'categories', field: 'category_id', startAt: 1 });
var Category = mongoose.model('categories',categorySchema);
categorySchema.plugin(uniqueValidator);

var subcategorySchema = new Schema({
	name: { type: String, required: true},
    url: { type: String, required: true, unique: true },
    category_id: {type: Number, required: true},
    created_at: {type: Date, default: Date.now}
})

subcategorySchema.plugin(autoIncrement.plugin, { model: 'subcategories', field: 'subcategory_id', startAt: 1 });
var Subcategory = mongoose.model('subcategories',subcategorySchema);
subcategorySchema.plugin(uniqueValidator);

var productTypeSchema = new Schema({
	name: { type: String, required: true, unique: true},
    url: { type: String, required: true, unique: true },
    image_url : { type: String },
    subcategory_id: {type: Number, required: true},
    created_at: {type: Date, default: Date.now}
})

productTypeSchema.plugin(autoIncrement.plugin, { model: 'producttypes', field: 'product_type_id', startAt: 1 });
var ProductType = mongoose.model('producttypes',productTypeSchema);
productTypeSchema.plugin(uniqueValidator);

var sellerSchema = new Schema({
	product_title: { type: String},
	name: { type: String, required: true},
    city: { type: String, required: true},
    contact_number : { type: String, required: true },
    short_address : { type: String, required: true },
    full_address : { type: String, required: true },
    created_at: {type: Date, default: Date.now}
});

/*var productSubTypeSchema = new Schema({
	name: { type: String, required: true},
    url: { type: String, required: true, unique: true },
    image_url : { type: String, required: true },
    created_at: {type: Date, default: Date.now}
})

productSubTypeSchema.plugin(autoIncrement.plugin, { model: 'productsubtypes', field: 'product_sub_type_id', startAt: 1 });
var productSubType = mongoose.model('productsubtypes',productSubTypeSchema);
productSubTypeSchema.plugin(uniqueValidator);*/

sellerSchema.plugin(autoIncrement.plugin, { model: 'sellers', field: 'seller_id', startAt: 1 });
var Seller = mongoose.model('sellers',sellerSchema);
sellerSchema.plugin(uniqueValidator);

var productSchema = new Schema({
	product_title: { type: String, required: true},
    image_url: { type: String},
    quantity: {type: String},
    price: {type: String},
    seller_collection_id : { type: Number, required: true },
    images: Array,
    image_url: {type: String},
    product_url: { type: String, required: true },
    product_type_id: { type: Number, required: true },
    seller_details : { type: Schema.Types.Mixed },
    created_at: {type: Date, default: Date.now}
})

productSchema.plugin(autoIncrement.plugin, { model: 'products', field: 'product_id', startAt: 1 });
var Product = mongoose.model('products',productSchema);
productSchema.plugin(uniqueValidator);


var pollManagerSchema = new Schema({
    object_id : Number,
    object_type : String,
    created_at: {type: Date, default: Date.now}
});
var PollManager = mongoose.model('poll_manager',pollManagerSchema);

//Create First Entry
PollManager.findOne({},function(err,pollData){
	if(pollData == null){
		var newPoll = new PollManager({ object_type: 'category', object_id: 0 });
		newPoll.save(function(err){
			if(!err){
				console.log('PollManager Started!!');		
			}
		});		
	}
})


function scrapeSections(){
	request('https://dir.indiamart.com/', function (error, response, html) {
	    if (!error && response.statusCode == 200) {
	        var $ = cheerio.load(html);
	        $('.cat-pdt .catBx').each(function(i,elem) {
	        	var section = $(this).find('.catHd').text().trim();
	        	var section_link = 'https:' + $(this).find('.ctLk .view').attr('href');
	        	var insertParams = { 
		    		name: section,
		    		url: section_link
			    };
				var newSection = new Section(insertParams);
	            newSection.save(function(err){
	                if(err) {
	                	console.log('--');
	            		//res.status(400).send({success: false, error: err});    	
	                } else {
	                	console.log('saved');
	            		//res.send({success: true, message: 'User created successfully!!' });	        
	                }
	            });
	        	
	        });
	    } else {
	    	console.log('dasdasdas ----');
	    }
	});	
}

function processSections(section){
	var section_url = section.url;
	console.log('Processing Section URL --> ' + section_url);
	request(section_url, function (error, response, html) {
		if (!error && response.statusCode == 200) {
    		var $ = cheerio.load(html);
    		$('.mid li').each(function(i,elem) {
    			var category_name = $($(this).find('a')[0]).text();
    			var category_url = 'https://dir.indiamart.com' + $($(this).find('a')[0]).attr('href');
    			
    			var insertParams = { 
		    		name: category_name,
		    		url: category_url,
		    		section_id: section.section_id
			    };
			    console.log(insertParams);
				var newCategory = new Category(insertParams);
	            newCategory.save(function(err){
	                if(err) {
	                	console.log('--- Category Insertion Error ---');
	                	console.log(err);
	                } else {
	                	console.log('saved --> ' + category_name);
	                }
	            });
    			sleep.sleep(1);
    		});
    	} else {
    		console.log('Requesting section URL ' + section_url + 'Failed!!');
    		console.log(error);
    		console.log(response.statusCode);
    	}
    });
}

function processSubcategories(category){
	var category_url = category.url;
	console.log(category_url);
	request(category_url, function (error, response, html) {
	    if (!error && response.statusCode == 200) {
	        var $ = cheerio.load(html);
	        $('.ctgry li.box').each(function(i,elem) {
	        	var sub_category_name = $(this).find('.proHd').text().trim();
	        	var sub_category_url = 'https://dir.indiamart.com/' + $(this).find('.proHd').find('a').attr('href');

	        	var insertParams = { 
		    		name: sub_category_name,
		    		url: sub_category_url,
		    		category_id: category.category_id
			    };
			    console.log(insertParams);
				var newSubcategory = new Subcategory(insertParams);
	            newSubcategory.save(function(err){
	                if(err) {
	                	console.log('--- Subcategory Category Insertion Error ---');
	                	console.log(err);
	                } else {
	                	console.log('saved --> ' + sub_category_name);
	                }
	            });

    			sleep.sleep(1);
	        });
	    } else {
	    	console.log('dasdasdas ----');
	    }
	});	
}

function productTypes(){
	request('https://dir.indiamart.com/indianexporters/me_steel.html', function (error, response, html) {
	    if (!error && response.statusCode == 200) {
	        var $ = cheerio.load(html);
	        $('.ctgry li.box').each(function(i,elem) {
	        	console.log($(this).find('.proHd').text());
	        	console.log('https://dir.indiamart.com/' + $(this).find('.proHd').find('a').attr('href'));
	        });
	    } else {
	    	console.log('dasdasdas ----');
	    }
	});	
}

function processProductTypes(subcategory){
	var sub_category_url = subcategory.url;
	console.log('Processing Subcategory URL ' + sub_category_url);
	request(sub_category_url, function (error, response, html) {
	    if (!error && response.statusCode == 200) {
	        var $ = cheerio.load(html);
	        $('.ctgry').remove();
	        $('li.box').each(function(i,elem) {
	        	var product_type_name = $(this).find('.proHd').text();

	        	if(product_type_name.indexOf('(') > -1){
	        		product_type_name = product_type_name.split('(')[0];
	        	}

	        	var product_type_url = 'https://dir.indiamart.com/' + $(this).find('a').attr('href');
	        	var image_url = $(this).find('.expro img').attr('data-original');

	        	var insertParams = { 
		    		name: product_type_name,
		    		url: product_type_url,
		    		subcategory_id: subcategory.subcategory_id
			    };

	        	if(image_url != undefined){
	        		insertParams['image_url'] = 'https:' + image_url;
	        	}

			    console.log(insertParams);
				var newProductType = new ProductType(insertParams);
	            newProductType.save(function(err){
	                if(err) {
	                	console.log('--- ProductType Insertion Error ---');
	                	console.log(err);
	                } else {
	                	console.log('saved --> ' + product_type_name);
	                }
	            });
    			sleep.sleep(1);
	        	
	        });
	    } else {
	    	console.log('dasdasdas ----');
	    }
	});		
}

function scrapeProducts(producttype){
	console.log('Requesting ' + producttype.url);
	request(producttype.url, function (error, response, html) {
	    if (!error && response.statusCode == 200) {
	    	console.log('Got response from '+ producttype.url);
	        var $ = cheerio.load(html);
	        $('#relbt').remove();
	        $('.wlm .lst.nlc').each(function(i,elem) {

	        	var seller_name = city = contact_number = address = '-';

	        	var product_title = $(this).find('.ldf').text();
	        	var product_url = $(this).find('.ldf a').attr('href');
	        	var img_src =   'https:' + $(this).find('.nor_i.imwd img').attr('data-limg');
	        	$(this).find('.pr_t').remove();
	        	var quantity = $(this).find('.quan').text();
				$(this).find('.quan').remove();
	        	var price = $(this).find('.prc').text();
	        	var seller_name = $(this).find('div.nes .cnm a').text();
	        	var seller_url = $(this).find('div.nes .cnm a').attr('href');
	        	var full_address = $(this).find('div.nes .clg .srad').text();
	        	$(this).find('div.nes .clg .srad').remove();
	        	var short_address = $(this).find('div.nes .clg').text()
	        	var contact_number = $(this).find('.phn').text();

	        	var city = short_address;
	        	if(short_address != undefined){
	        		if(short_address.indexOf(',') > -1){
	        			city = short_address.split(',')[1];
	        		}
	        	}

	        	city = city.trim();
	        	short_address = short_address.trim();
	        	full_address = full_address.trim();


	        	var sellerParams = {
	        		name: seller_name,
	        		product_title: product_title,
	        		city: city,
	        		contact_number: contact_number,
	        		full_address: full_address,
	        		short_address: short_address,
	        		url: seller_url
	        	}

	        	getSeller(sellerParams,function(sellerResponse){
	        		if(sellerResponse['success']){
	        			var insertParams = {
	        				product_title: product_title,
	        				product_url: product_url,
	        				image_url: img_src,
	        				price: price,
	        				quantity: quantity,
	        				seller_collection_id: sellerResponse['seller_collection_id'],
	        				product_type_id: producttype.product_type_id,
	        				seller_details: sellerParams
	        			}
	        			var newProduct = new Product(insertParams);
			            newProduct.save(function(err){
			                if(err) {
			                	console.log('--- Product Insertion Error ---');
			                	console.log(err);
			                } else {
			                	console.log('saved --> ' + product_title);
			                }
			            });
		    			sleep.sleep(1);
	        		} else {
	        			console.log('Unable to create the Product' + sellerResponse['error']);
	        		}
	        	})
	        });
	    } else {
	    	console.log('Requesting failed ----');
	    }
	});		
}

function getSeller(sellerObj,callback){
	Seller.findOne(sellerObj,function(err,seller){
		if(err){
			callback({ success: false, error: err });
		} else {
			if(seller != null){
				callback({ success: true, seller_collection_id: seller.seller_id });
			} else {
				newSeller = new Seller(sellerObj);
				newSeller.save(function(saveErr,savedObj){
	                if(err) {
	                	callback({ success: false, error: saveErr });
	                } else {
	            		callback({success: true, seller_collection_id: savedObj.seller_id });
	                }
	            });
			}
		}
	})
}


/*Section.findOne({},function(err,section){
	if(section == null){
		scrapeSections();
	} else {
		Section.find({section_id:1},function(err,sections){
			sections.forEach(function(section){
				processSections(section);
			});
		})
	}
});*/

//scrapeProducts({url:'https://dir.indiamart.com//impcat/brass-alloys.html', product_type_id: 23});

//productTypes()

/*Subcategory.findOne({},function(err,subcategory){
	processSubcategories(subcategory);
})*/

/*ProductType.find({}, function(err,producttypes){
	if(!err){
		producttypes.forEach(function(producttype){
			var scrapeProductsQueue = queue.create('scrape_product', {
                    producttype: producttype,
                }).delay(1000)
                  .save();
		})
	}
})*/


var cronRunner = "*/30 * * * * *";	
//var cronRunner = "0 */2 * * * *";
var cronJob = cron.job(cronRunner, function(){
	console.log(new Date());
	PollManager.findOne({}, function(err, pollData){
		var object_id = pollData.object_id;

		if(pollData.object_type == "category"){
			Category.findOne({category_id: {$gt: object_id}}).sort({category_id: 1}).exec(function(catErr, categoryObj){
				if(categoryObj != null){
					processSubcategories(categoryObj);
					PollManager.update({ object_id: object_id }, { $set: {object_id: categoryObj.category_id, object_type: 'category'} }, function(err, updatedResponse){
					}); 
				}
				
			})	
		}
	});
});
cronJob.start();

/*Category.findOne({},function(err,category){
	processSubcategories(category);
})*/

queue.process('scrape_product', function(job, done){
	console.log('queue processing  scrape_product');
    var producttype = job.data.producttype;
    scrapeProducts(producttype);
    done();
});

app.listen('8081');
console.log('server started');
exports = module.exports = app;

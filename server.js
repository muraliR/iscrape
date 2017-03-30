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
	name: { type: String, required: true, unique: true},
    url: { type: String, required: true, unique: true },
    created_at: {type: Date, default: Date.now}
})

categorySchema.plugin(autoIncrement.plugin, { model: 'categories', field: 'category_id', startAt: 1 });
var Category = mongoose.model('sections',categorySchema);
categorySchema.plugin(uniqueValidator);

var subcategorySchema = new Schema({
	name: { type: String, required: true, unique: true},
    url: { type: String, required: true, unique: true },
    created_at: {type: Date, default: Date.now}
})

subcategorySchema.plugin(autoIncrement.plugin, { model: 'categories', field: 'subcategory_id', startAt: 1 });
var Subcategory = mongoose.model('sections',subcategorySchema);
subcategorySchema.plugin(uniqueValidator);

var productTypeSchema = new Schema({
	name: { type: String, required: true, unique: true},
    url: { type: String, required: true, unique: true },
    image_url : { type: String, required: true },
    created_at: {type: Date, default: Date.now}
})

productTypeSchema.plugin(autoIncrement.plugin, { model: 'categories', field: 'producttype_id', startAt: 1 });
var productType = mongoose.model('sections',productTypeSchema);
productTypeSchema.plugin(uniqueValidator);

var sellerSchema = new Schema({
	name: { type: String, required: true},
    city: { type: String, required: true},
    contact_number : { type: String, required: true },
    address : { type: String, required: true },
    created_at: {type: Date, default: Date.now}
})

sellerSchema.plugin(autoIncrement.plugin, { model: 'categories', field: 'seller_id', startAt: 1 });
var Seller = mongoose.model('sections',sellerSchema);
sellerSchema.plugin(uniqueValidator);

var ProductSchema = new Schema({
	name: { type: String, required: true, unique: true},
    image_url: { type: String, required: true},
    price_info: {type: String, required: true},
    seller_id : { type: Number, required: true },
    images: Array,
    seller_details : { type: Schema.Types.Mixed }
    created_at: {type: Date, default: Date.now}
})

productSchema.plugin(autoIncrement.plugin, { model: 'categories', field: 'product_id', startAt: 1 });
var product = mongoose.model('sections',productSchema);
productSchema.plugin(uniqueValidator);



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

function scrapeProductPage(){
	request('https://dir.indiamart.com/', function (error, response, html) {
	    if (!error && response.statusCode == 200) {
	        var $ = cheerio.load(html);
	    }
	});
}

function processSections(){
	Section.findOne({}, function(err, section){
		//sections.forEach(function(section) {

			var section_url = section.url;
			var section_url = 'https://dir.indiamart.com/industry/computer-hardware.html';
		    
			request(section_url, function (error, response, html) {
	    		if (!error && response.statusCode == 200) {
	        		var $ = cheerio.load(html);
	        		$('.mid li').each(function(i,elem) {
	        			var category_name = $($(this).find('a')[0]).text();
	        			var category_url = 'https://dir.indiamart.com' + $($(this).find('a')[0]).attr('href');

	        			console.log(category_url);

	        			/*$(this).find('span.dcwm').each(function(spanI, spanEle){
	        				subCatEle = $(this).next('a');
	        				var sub_category_name = subCatEle.text().trim();
	        				var sub_category_url = 'https://dir.indiamart.com' + subCatEle.attr('href');
	        				console.log(sub_category_name + ' --- ' + sub_category_url);
	        			})*/
	        			
	        		});
	        	} else {

	        	}
	        });
		//});
	})
}


Section.findOne({},function(err,section){
	if(section != null){
		processSections();
	} else {
		scrapeSections();
	}
});


app.listen('8081')

console.log('Magic happens on port 8081');

exports = module.exports = app;

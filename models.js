var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var autoIncrement = require('mongoose-auto-increment');
var uniqueValidator = require('mongoose-unique-validator');


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
	name: { type: String, required: true},
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
    website_url: {type: String, unique: true},
    contact_details: {type: Schema.Types.Mixed},
    geo_location: {type: Schema.Types.Mixed},
    contact_details_added: {type: Boolean},
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

module.exports = {
    Product: Product,
    Seller: Seller
}
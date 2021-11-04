const Product = require("../models/productModel")
const ErrorHandler = require("../utils/errorHandler")
const catchAsyncErrors = require("../middleware/catchAsyncErrors")
const ApiFeatures = require("../utils/apiFeatures")




//Create Product --Admin
exports.createProduct = catchAsyncErrors(async(req, res, next)=>{
    
    req.body.user = req.user.id
    
    const product = await Product.create(req.body)

    res.status(201).json({
        success:true,
        product
    })
})


 
//Get all products
exports.getAllProducts = catchAsyncErrors(async(req, res)=>{
    
    //change item per page here
    //-------down here-------
    const resultPerPage = 16
    const productCount  = await Product.countDocuments()


    const apiFeature = new ApiFeatures(Product.find(), req.query)
    .search()
    .filter()
   

    let products = await apiFeature.query
    let filteredProductsCount = products.length

    apiFeature.pagination(resultPerPage)

    products = await apiFeature.query.clone()
   
    res.status(200).json({
        success:true,
        products,
        productCount,
        resultPerPage,
        filteredProductsCount
    })

})

// Get Product Details
exports.getProductDetails = catchAsyncErrors(async(req, res, next)=>{
    
    const product = await Product.findById(req.params.id)

    if(!product){
        return next(new ErrorHandler("Product not found", 404))
    }

    res.status(200).json({
        success:true,
        product
    })
})

// Update product --Admin
exports.updateProduct = catchAsyncErrors(async(req, res, next)=>{
        
    let product = await Product.findById(req.params.id)
    
    if(!product){
        return next(new ErrorHandler("Product not found", 404))
    }

    product = await Product.findByIdAndUpdate(req.params.id, req.body, {
        new:true,
        runValidators:true,
        useFindAndModify:false
    })

    res.status(200).json({
        success:true,
        product
    })
    
})

// Delete Product
exports.deleteProduct = catchAsyncErrors(async(req, res, next)=>{

    const product = await Product.findById(req.params.id)

    if(!product){
        return next(new ErrorHandler("Product not found", 404))
    }

    await product.remove()

    res.status(200).json({
        success:true,
        message:"Product Deleted Successfully"
    })
})


// Create new review or update the review

exports.productReview = catchAsyncErrors(async(req, res, next)=>{
    
    const {rating, comment, productId} = req.body
    const review = {
        user:req.user.id,
        name:req.user.name,
        rating: Number(rating),
        comment
    }
   
    const product = await Product.findById(productId)
    
    const isReviewed = product.reviews.find(rev => rev.user.toString() === req.user.id.toString())

    
    if(isReviewed){
        product.reviews.forEach(rev => {
            if(rev.user.toString() === req.user.id.toString()){
            rev.rating = rating,
            rev.comment = comment
        }})
    }
    else{
        product.reviews.push(review)
        product.numOfReviews = product.reviews.length        
    }

    let avg = 0
    product.reviews.forEach(rev => {
        avg += rev.rating
    }) 

    product.ratings = avg / product.reviews.length

    await product.save({ validateBeforeSave:false })
       
    
    res.status(200).json({
        success:true
    })
})

// get all reviews of a product
exports.getProductReviews = catchAsyncErrors(async(req, res, next)=>{

    const product = await Product.findById(req.query.id)

    if(!product){
        return next(new ErrorHandler("Product not found", 404))
    }

    res.status(200).json({
        success:true,
        reviews:product.reviews
    })
})

// delete a product review
exports.deleteProductReviews = catchAsyncErrors(async(req, res, next)=>{

    const product = await Product.findById(req.query.productId)

    if(!product){
        return next(new ErrorHandler("Product not found", 404))
    }

    const reviews = product.reviews.filter(
        rev => rev.id.toString() !== req.query.id.toString()
        )

    let avg = 0

    reviews.forEach(rev => {
        avg += rev.rating
    }) 

    const ratings = avg / product.reviews.length

    const numOfReviews = reviews.length

    await Product.findByIdAndUpdate(req.query.productId, {
        reviews,
        ratings,
        numOfReviews
    },{
        new:true,
        runValidators:true,
        useFindAndModify:false
    })

    res.status(200).json({
        success:true,
    })
})


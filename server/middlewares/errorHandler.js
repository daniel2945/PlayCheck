const errorHandler = (err, req, res, next) => {
let statusCode = res.statusCode === 200 ? 500 : res.statusCode;
let message = err.message;
if (err.name === 'CastError') {
    statusCode = 404;
    message = 'Resource not found. Invalid ID format';
}
if (err.code === 11000) {
        statusCode = 400;
        message = 'Duplicate field value entered (Email or Username already exists)';
    }
    if (err.name === 'ValidationError') {
        statusCode = 400;
        message = Object.values(err.errors).map(val => val.message).join(', ');
    }
    res.status(statusCode).json({
        success: false,
        error: message,
        stack: process.env.NODE_ENV === 'production' ? null : err.stack,
    });

}

module.exports = errorHandler;


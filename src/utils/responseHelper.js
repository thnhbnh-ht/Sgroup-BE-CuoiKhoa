export const sendSuccess = (res, statusCode = 200, message = 'Success', data = null) => {
    const response = {
        success: true,
        message,
    };
    
    if (data !== null && data !== undefined) {
        response.data = data;
    }

    return res.status(statusCode).json(response);
};

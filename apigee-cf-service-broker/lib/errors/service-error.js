/**
 * @module errors
 */
const errors = require('./constants')

const DEFAULT_ERROR = errors.INTERNAL_ERROR;

class ServiceError extends Error {
  constructor(error, causedByError, message) {
    super(error);
    /* eslint-disable */
    if (!error) {
      error = DEFAULT_ERROR;
    }

    if (causedByError && !(causedByError instanceof Error)) {
      message = causedByError;
      causedByError = undefined;
    }
    /* eslint-enable */

    // super helper method to include stack trace in error object
    Error.captureStackTrace(this, this.constructor);

    // set our function’s name as error name.
    this.name = this.constructor.name;

    this.code = error.code;
    this.causedBy = causedByError;
    this.message = message || error.message;
  }
}

module.exports = ServiceError;

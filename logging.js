'use strict'

const winston = require('winston')

var logger = winston.createLogger({
	level: 'info',
	format: winston.format.combine(
			winston.format.colorize(),
			winston.format.timestamp(),
			winston.format.printf(info => `${info.timestamp} ${info.level}: ${info.message}`)
	),
	transports: [
		new winston.transports.Console()
	]
})

module.exports = logger
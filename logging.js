'use strict'

const winston = require('winston')

var logger = winston.createLogger({
	level: 'info',
	format: winston.format.combine(
		winston.format.timestamp(),
		winston.format.json()
	),
	transports: [
		new winston.transports.File({ filename: 'logs/api.error.json', level: 'error' }),
		new winston.transports.File({ filename: 'logs/api.json' })
	]
})

if (process.env.NODE_ENV !== 'production')
{
	logger.add(new winston.transports.Console({
		format: winston.format.combine(
			winston.format.colorize(),
			winston.format.timestamp(),
			winston.format.printf(info => `${info.timestamp} ${info.level}: ${info.message}`)
		)
	}))
}

module.exports = logger
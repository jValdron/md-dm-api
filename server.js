'use strict'

const express = require('express')
const MdDmConnection = require('./lib/MdDmConnection')

const logger = require('./logging')
const routes = require('./routes')

const PORT = process.env.PORT || 8080
const MDDM_ADDRESS = process.env.MDDM_ADDRESS

if (!MDDM_ADDRESS)
{
	logger.error('MDDM_ADDRESS must be defined. Use the IP or hostname of the MD-DM device.')
	return -1
}

var app = express(),
	connection = new MdDmConnection(MDDM_ADDRESS, logger)

app.use(express.json())

routes.setup(app, logger, connection)

connection.start()
app.listen(PORT, () => logger.info(`md-dm-api started on port ${PORT}`))

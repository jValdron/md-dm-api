'use strict'

const express = require('express')
const MdDmConnection = require('./lib/MdDmConnection')

const logger = require('./logging')

const args = process.argv.splice(2)
var configPath = args.length > 0 ? args[0] : './config.json'

logger.info(`Using config: ${configPath}`)

const config = require(configPath)
const routes = require('./routes')

var app = express(),
	connection = new MdDmConnection(config.device.address, logger)

app.use(express.json())

routes.setup(app, logger, connection)

connection.start()
app.listen(config.api.port, () => logger.info(`md-dm-api started on port ${config.api.port}`))

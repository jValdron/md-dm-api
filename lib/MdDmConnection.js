'use strict'

const Telnet = require('telnet-client')
const TelnetOutputParser = require('./TelnetOutputParser')

/**
 * Provides a connection to the MD-DM device.
 */
class MdDmConnection
{
	/**
	 * Initialize an instance of the MdDmConnection class.
	 * @param {string} host		The address of the MD-DM host.
	 * @param {Winston} logger	A Winston logger instance.
	 */
	constructor (host, logger) {
		this.host = host
		this.device = {
			connected: false
		}
		this.started = false

		this._params = {
			port: 23,
			shellPrompt: '\r\nDM-MD8x8>',
			timeout: 1000,
			irs: '\r\n',
			ors: '\r\n',
			echoLines: 0
		}

		this._logger = logger
		this._connection = new Telnet()
		this._setupEvents()
	}

	/**
	 * Starts the connection to the MD-DM Telnet server.
	 */
	start () {
		this._logger.info(`Connecting to ${this.host}...`)
		this._params.host = this.host
		this._connection.connect(this._params)
		this.started = true
	}

	/**
	 * Stops the connection to hte server.
	 */
	stop () {
		this._connection.exec('BYE', function (err, response) {})
		this.started = false
	}

	/**
	 * Gets the outputs (using dump DM routes).
	 */
	getOutputs (cb) {
		var self = this

		if (!this.started)
		{
			return cb('Connection to MD-DM not started')
		}

		if (!this.device.connected)
		{
			return cb('Not currently connected to MD-DM')
		}

		this._connection.exec('DUMPDMROUTEI', function (err, response) {
			self._logger.verbose(`DUMPDMROUTEI response: ${response}`)

			try
			{
				cb(err, TelnetOutputParser.parseDmRouteOutputs(response))
			}
			catch (e)
			{
				self._logger.warn(`Failed to parse response: ${response}`)
				cb(`Failed to parse response: ${e} / ${e.stack}`)
			}
		})
	}

	/**
	 * Gets the hardware from `SHOWHW`.
	 */
	getHardware (cb) {
		var self = this

		if (!this.started)
		{
			return cb('Connection to MD-DM not started')
		}

		if (!this.device.connected)
		{
			return cb('Not currently connected to MD-DM')
		}

		this._connection.exec('SHOWHW', function (err, response) {
			self._logger.verbose(`SHOWHW response: ${response}`)

			try
			{
				cb(err, TelnetOutputParser.parseHardware(response))
			}
			catch (e)
			{
				self._logger.warn(`Failed to parse response: ${response}`)
				cb(`Failed to parse response: ${e} / ${e.stack}`)
			}
		})
	}

	/**
	 * Set the audio route for the DM device in the given slot.
	 */
	setAudioRoute (slot, input, cb) {
		this._setRoute.call(this, slot, input, 'SETAUDIOROUTE', cb)
	}

	/**
	 * Set the video route for the DM device in the given slot.
	 */
	setVideoRoute (slot, input, cb) {
		this._setRoute.call(this, slot, input, 'SETVIDEOROUTE', cb)
	}

	/**
	 * Set the USB route for the DM device in the given slot.
	 */
	setUsbRoute (slot, input, cb) {
		this._setRoute.call(this, slot, input, 'SETUSBROUTE', cb)
	}

	/**
	 * Sets up the events for Telnet connection.
	 */
	_setupEvents () {
		var self = this

		this._logger.debug('Setting up Telnet communication events...')

		this._connection.on('ready', function (prompt) {
			self._logger.debug(`Telnet connection ready!`)

			self._logger.info(`Obtaining version from MD-DM at ${self.host}...`)

			self._connection.exec('VERsion', function (err, response) {
				if (err)
				{
					return self._logger.error(`Failed to get version from MD-DM: ${err}`)
				}
				else
				{
					self._logger.verbose(`VERsion response: ${response}`)
					self.device = TelnetOutputParser.parseVersion(response)
					self.device.connected = true
					self._logger.info(`Connected to ${self.device.name}, running ${self.device.firmware.version}.`)
				}
			})
		})

		this._connection.on('close', function () {
			self._logger.warn('Telnet session closed.')
			self.device.connected = false

			if (self.started)
			{
				self._logger.info(`Reconnecting to ${self.host} in 5s.`)
				setTimeout(function () {
					self.start.call(self)
				}, 5000)
			}
		})
	}

	/**
	 * Generic method to set routes.
	 */
	_setRoute (slot, input, method, cb) {
		var self = this

		if (!this.started)
		{
			return cb('Connection to MD-DM not started')
		}

		if (!this.device.connected)
		{
			return cb('Not currently connected to MD-DM')
		}

		slot = Number.parseInt(slot)
		input = Number.parseInt(input)

		this._connection.exec(`${method} ${input} ${slot}`, function (err, response) {
			self._logger.verbose(`${method} response: ${response}`)

			response = response.trim();

			try
			{
				cb(err || response, null)
			}
			catch (e)
			{
				self._logger.warn(`Failed to parse response: ${response}`)
				cb(`Failed to parse response: ${e} / ${e.stack}`)
			}
		})
	}
}

module.exports = MdDmConnection
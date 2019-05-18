'use strict'

const async = require('async')

module.exports = {

	/**
	 * Setups all routes for the md-dm-api app.
	 * @param {express} app
	 * @param {winston} logger
	 * @param {MdDmConnection} connection
	 */
	setup: function (app, logger, connection) {

		// GET /
		// Displays the connection status and basic device information (parsed
		// output from `version`).
		app.get('/', (req, res) => res.json(connection.device))

		// GET /hardware
		// Displays the hardware info, including a list of cards (parsed
		// output from `showhw`).
		app.get('/hardware', (req, res) => connection.getHardware(function (err, hardware) {
			if (err)
			{
				logger.warn(`Failed to get hardware: ${err}`)
				return res.status(500).json({ message: err })
			}

			res.json(hardware)
		}))

		// GET /outputs
		// Displays the current routing from the outputs (parsed output from
		// dumpdmroutei).
		app.get('/outputs', (req, res) => connection.getOutputs(function (err, outputs) {
			if (err)
			{
				logger.warn(`Failed to get hardware: ${err}`)
				return res.status(500).json({ message: err })
			}

			res.json(outputs)
		}))


		// GET /output/:slot
		// Same as /outputs, but returns routing from a single slot.
		app.get('/output/:slot', (req, res) => connection.getOutputs(function (err, outputs) {
			if (err)
			{
				logger.warn(`Failed to get hardware: ${err}`)
				return res.status(500).json({ message: err })
			}

			var output = outputs.filter(function (entry) {
				return entry.slot == req.params.slot
			})

			if (output.length)
			{
				res.json(output[0])
			}
			else
			{
				res.status(400).json({
					slot: req.params.slot,
					message: `No output device found on slot ${req.params.slot}`
				})
			}
		}))

		// POST /output/:slot
		// Changes the input routing, either video, audio or USB, of a specific
		// output card, using its slot. Only one parameter is required.
		// --
		// {
		//   "video": 1,
		//   "audio": 1
		// }
		//
		// {
		//   "video": 1,
		//   "audio": 3,
		//   "usb": 1
		// }
		app.post('/output/:slot', (req, res) => {
			if (!(req.body.video && req.body.audio && req.body.usb))
			{
				return res.status(400).json({ message: 'At least the video, audio or usb input must be given.' })
			}

			logger.info(`Setting new route for slot ${req.params.slot}`)

			async.series([
				function (cb) {
					if (req.body.audio)
					{
						logger.debug(`Setting new audio route for slot ${req.params.slot} to ${req.body.audio}`)

						connection.setAudioRoute(req.params.slot, req.body.audio, function (err) {
							cb(err)
						})
					}
					else
					{
						cb()
					}
				},

				function (cb) {
					if (req.body.video)
					{
						logger.debug(`Setting new video route for slot ${req.params.slot} to ${req.body.video}`)

						connection.setVideoRoute(req.params.slot, req.body.video, function (err) {
							cb(err)
						})
					}
					else
					{
						cb()
					}
				},

				function (cb) {
					if (req.body.usb)
					{
						logger.debug(`Setting new USB route for slot ${req.params.slot} to ${req.body.usb}`)

						connection.setUsbRoute(req.params.slot, req.body.usb, function (err) {
							cb(err)
						})
					}
					else
					{
						cb()
					}
				}
			], function (err) {
				if (err)
				{
					logger.warn(`Error setting route for slot ${req.params.slot}`)
					res.status(500).json({ message: err })
				}
				else
				{
					res.status(200).end()
				}
			})
		})
	}
}
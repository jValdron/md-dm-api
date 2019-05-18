'use strict'

/**
 * Provides methods to parse telnet commands.
 */
class TelnetOutputParser
{
	/**
	 * Parses the output of the `VERsion` command.
	 * @param {string} response	The response
	 */
	static parseVersion(response)
	{
		var version = /(.*) \[(v.*) \((.*)\)/gi.exec(response.trim());

		return {
			name: version[1],
			firmware: {
				version: version[2],
				date: version[3]
			}
		}
	}

	/**
	 * Parses the output of the `showhw` command.
	 * @param {string} response	The response
	 */
	static parseHardware(response)
	{
		var lines = response.split('\n'),
			currentLine = 1

		var hardware = {
			processorType: lines[currentLine++].substr(21).trim(),
			compactFlash: lines[currentLine++].substr(21).trim(),
			ybusSlots: Number.parseInt(lines[currentLine++].substr(21).trim()),
			zbusSlots: Number.parseInt(lines[currentLine++].substr(21).trim()),
			cards: []
		}

		do
		{
			var card = {
				slot: Number.parseInt(lines[currentLine].substr(0, 4).trim())
			}

			var matches = /(\d+): (.+) (Input Card|Output Card) \[(v.*), (.*)\] Stream:(.*)/.exec(lines[currentLine])

			if (matches)
			{
				card.name = matches[2]
				card.type = matches[3]
				card.version = matches[4]
				card['checksum?'] = matches[5]
				card.stream = matches[6]

				hardware.cards.push(card)
			}
		}
		while (lines[++currentLine].substr(4, 1) === ':')

		return hardware
	}

	/**
	 * Parses the output of the `DUMPDMROUTEI` command.
	 * @param {string} response	The response
	 */
	static parseDmRouteOutputs(response)
	{
		var lines = response.split('Routing Information for Output Card at ')
		lines.shift()

		var outputs = []

		lines.forEach(function (output) {
			var matches = /Slot (\d*)[\s\n]*(( Video.* slot (\d))|(No Video.*))[\s\n]*(( Audio.* slot (\d))|(No Audio.*))[\s\n]*(( USB.* slot (\d))|(No USB.*))[\s\n]*( Hot plug is (.*))[\s\n]*VideoSwitch - Out(\d+)->In(\d+)/g.exec(output)

			outputs.push({
				slot: Number.parseInt(matches[1]),
				video: {
					connected: !matches[5] || matches[5].trim().toLowerCase() !== 'no video connection',
					slot: Number.parseInt(matches[4])
				},
				audio: {
					connected: !matches[9] || matches[9].trim().toLowerCase() !== 'no audio connection',
					slot: Number.parseInt(matches[8])
				},
				usb: {
					connected: !matches[13] || matches[13].trim().toLowerCase() !== 'no usb connection',
					slot: Number.parseInt(matches[12])
				},
				hotplug: matches[15].trim(),
				out: Number.parseInt(matches[16]),
				in: Number.parseInt(matches[17])
			})
		})

		return outputs
	}
}

module.exports = TelnetOutputParser